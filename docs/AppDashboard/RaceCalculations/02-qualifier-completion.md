# Qualifier Completion Calculations

This document describes what happens when a qualifying session is marked as "completed" in the system.

## Entry Point

**Route**: `PUT /qualifiers/{id}`
**Controller**: `QualifierController::update()`
**Service**: `QualifierApplicationService::updateQualifier()`
**File**: `/app/Application/Competition/Services/QualifierApplicationService.php`

## Trigger Condition

When the `status` field changes to `'completed'`:

```php
if ($newStatus === RaceStatus::COMPLETED) {
    $qualifier->markAsCompleted();
}
```

## Calculation Flow

### Step 1: Mark Qualifier as Completed

```php
$qualifier->markAsCompleted();
$this->qualifierRepository->save($qualifier);
```

### Step 2: Update Race Result Statuses

All qualifying results are changed from `PENDING` to `CONFIRMED`:

```php
$this->updateRaceResultStatuses($qualifierId, $newStatus);
```

### Step 3: Calculate Pole Position Points

```php
$this->calculatePolePositionPoints($qualifierId);
```

## Grid Position Calculation Algorithm

**Method**: `calculatePolePositionForResultSet()`
**Lines**: 308-412 in `QualifierApplicationService.php`

### 3.1 Division Handling

If the season has divisions enabled:
- Results are grouped by division
- Each division gets its own pole position
- Grid positions calculated separately per division

### 3.2 Check for Valid Times

Two scenarios:

**Scenario A: Valid lap times exist**
- Sort by `fastest_lap` ascending (fastest = P1)
- Assign positions sequentially

**Scenario B: All times are null**
- Fall back to submission order
- First result submitted = P1
- Uses result ID for ordering

### 3.3 Separate Valid and Invalid Results

```php
// Valid: Has fastest_lap time AND not DNF
$validResults = array_filter($results, fn($r) =>
    $r->fastestLap() !== null && !$r->dnf()
);

// Invalid: DNF OR no fastest_lap time
$invalidResults = array_filter($results, fn($r) =>
    $r->fastestLap() === null || $r->dnf()
);
```

### 3.4 Sort Valid Results by Lap Time

```php
usort($validResults, function($a, $b) {
    return $a->fastestLap() <=> $b->fastestLap();
});
```

### 3.5 Assign Grid Positions

```
Position 1: Fastest qualifying time (Pole Position)
Position 2: Second fastest
Position 3: Third fastest
...
Invalid results: Placed at end
```

### 3.6 Pole Position Identification

The driver in P1 gets the `hasPole` flag:

```php
if ($position === 1) {
    $result->setHasPole(true);
}
```

## Pole Position Bonus Points

### Two Award Strategies

**Strategy 1: Immediate Award** (`qualifying_pole_top_10 = false`)

Points awarded immediately when qualifier completes:
```php
if ($hasPole && $polePoints > 0 && !$poleTop10Only) {
    $result->setRacePoints($polePoints);
}
```

**Strategy 2: Conditional Award** (`qualifying_pole_top_10 = true`)

Points NOT awarded when qualifier completes. Instead:
1. `hasPole = true` flag is set
2. Points awarded later when the **race** completes
3. Only if the pole driver finishes in the top 10 of the race

### Configuration

| Setting | Effect |
|---------|--------|
| `qualifying_pole = 0` or `null` | No pole bonus |
| `qualifying_pole = 3` | 3 bonus points for pole |
| `qualifying_pole_top_10 = false` | Award immediately |
| `qualifying_pole_top_10 = true` | Award only if driver finishes top 10 in race |

## Grid Position Usage in Races

Qualifying positions are used as the **grid source** for subsequent races.

### In Race Points Calculation

```php
// RaceApplicationService::calculatePointsForResultSet()
$gridSource = $race->gridSource();
$gridSourceRaceId = $race->gridSourceRaceId();

if ($gridSource->value !== 'manual' && $gridSourceRaceId !== null) {
    $sourceResults = $this->raceResultRepository->findByRaceId($gridSourceRaceId);
    // Build map: driverId => starting position (from qualifying)
}
```

### Positions Gained Formula

```php
$positionsGained = $qualifyingPosition - $raceFinishPosition;
```

**Example**:
- Driver qualified P5
- Driver finished race P2
- Positions gained: 5 - 2 = +3 (gained 3 positions)

## Database Updates

### `races` Table (Qualifier is stored in races table)
```sql
UPDATE races SET
    status = 'completed',
    updated_at = NOW()
WHERE id = ? AND is_qualifier = true
```

### `race_results` Table (for each result)
```sql
UPDATE race_results SET
    status = 'confirmed',
    position = ?,       -- Grid position (1, 2, 3, ...)
    has_pole = ?,       -- true for P1, false otherwise
    race_points = ?,    -- Pole bonus (if immediate award)
    updated_at = NOW()
WHERE id = ?
```

## Submission Order Fallback

**Method**: `calculatePolePositionBySubmissionOrder()`

**When Used**: All results have no `fastest_lap` data

**Process**:
1. Sort results by ID (first submitted = first position)
2. First submitted driver gets P1 and pole
3. Same pole bonus logic applies

This handles scenarios where:
- Qualifying was rain-affected
- Session was cancelled early
- Results were manually entered without times

## Domain Events

```php
$qualifier->recordEvent(new QualifierUpdated($qualifierId, $roundId));
```

**Note**: No listeners are currently registered for this event.

## What Does NOT Happen

When a qualifier is completed:

- Race results for subsequent races are NOT modified
- Round standings are NOT calculated
- Season standings are NOT calculated
- No background jobs dispatched

## Example Scenario

**Qualifier Configuration**:
- Pole bonus: 3 points
- Top 10 restriction: disabled

**Qualifying Results**:
| Driver | Fastest Lap | DNF |
|--------|-------------|-----|
| A | 1:32.456 | No |
| B | 1:31.234 | No |
| C | 1:33.789 | No |
| D | null | Yes |

**Calculation**:
1. Separate valid/invalid:
   - Valid: A, B, C (have times, not DNF)
   - Invalid: D (DNF)

2. Sort valid by fastest_lap:
   - B: 1:31.234 (P1)
   - A: 1:32.456 (P2)
   - C: 1:33.789 (P3)

3. Assign invalid positions:
   - D: P4 (placed at end)

4. Pole position:
   - B gets `hasPole = true`
   - B gets 3 pole bonus points (immediate award)

**Final Grid**:
| Position | Driver | Pole Bonus |
|----------|--------|------------|
| P1 | B | 3 points |
| P2 | A | 0 |
| P3 | C | 0 |
| P4 | D | 0 |

## Code Reference

**Main calculation method**:
```
/app/Application/Competition/Services/QualifierApplicationService.php:267-300 (calculatePolePositionPoints)
/app/Application/Competition/Services/QualifierApplicationService.php:308-412 (calculatePolePositionForResultSet)
```

**Submission order fallback**:
```
/app/Application/Competition/Services/QualifierApplicationService.php:420-464 (calculatePolePositionBySubmissionOrder)
```

**Status update**:
```
/app/Application/Competition/Services/QualifierApplicationService.php:240-259 (updateRaceResultStatuses)
```
