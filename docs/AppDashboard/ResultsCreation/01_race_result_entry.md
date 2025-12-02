# Race Result Entry

This document describes how race results are entered into the system, including data validation, fastest lap detection, and database storage.

## Overview

Race results are entered through a bulk API endpoint that replaces all existing results for a race. Results can be entered for both regular races and qualifiers.

## Entry Points

### API Endpoint
- **Route**: `POST /api/seasons/{seasonId}/rounds/{roundId}/races/{raceId}/results`
- **Controller**: `app/Http/Controllers/User/RaceResultController.php:31-38`
- **Method**: `store()`

### Request Format

```json
{
  "results": [
    {
      "driver_id": 42,
      "division_id": 3,
      "position": null,
      "race_time": "1:32:45.678",
      "race_time_difference": "+12.345",
      "fastest_lap": "1:25.123",
      "penalties": "5.000",
      "has_fastest_lap": false,
      "has_pole": false,
      "dnf": false
    },
    // ... more results
  ]
}
```

**Note**: The `has_fastest_lap` field sent by the frontend is IGNORED. The backend recalculates this automatically.

## Process Flow

### 1. Request Validation
**File**: `app/Http/Requests/User/BulkRaceResultsRequest.php`

```php
// Validation rules
'results' => 'required|array|min:1',
'results.*.driver_id' => 'required|integer|exists:season_drivers,id',
'results.*.division_id' => 'nullable|integer|exists:divisions,id',
'results.*.position' => 'nullable|integer|min:1',
'results.*.race_time' => 'nullable|string|regex:/^\d{1,2}:\d{2}:\d{2}\.\d{3}$/',
'results.*.fastest_lap' => 'nullable|string|regex:/^\d{1,2}:\d{2}\.\d{3}$/',
'results.*.dnf' => 'boolean',
```

**Time Format Requirements**:
- Race time: `H:MM:SS.mmm` (e.g., "1:32:45.678")
- Fastest lap: `M:SS.mmm` (e.g., "1:25.123")
- Penalties: `S.mmm` or `SS.mmm` (e.g., "5.000")
- Time difference: `+S.mmm` or `+SS.mmm` (e.g., "+12.345")

### 2. Application Service Processing
**File**: `app/Application/Competition/Services/RaceResultApplicationService.php:45-97`

```php
public function saveResults(int $raceId, BulkRaceResultsData $data): array
{
    // 1. Verify race exists
    // 2. Start database transaction
    // 3. Fetch race to check if it's a qualifier
    // 4. Delete existing results
    // 5. Create new RaceResult entities
    // 6. Calculate fastest laps (non-qualifiers only)
    // 7. Save all results
    // 8. Record creation events
    // 9. Return DTOs
}
```

### 3. Delete Existing Results
**File**: `app/Application/Competition/Services/RaceResultApplicationService.php:57`

Before creating new results, all existing results for the race are deleted:

```php
$this->raceResultRepository->deleteByRaceId($raceId);
```

This ensures a clean slate - no orphaned results remain.

### 4. Create RaceResult Entities
**File**: `app/Domain/Competition/Entities/RaceResult.php:41-77`

For each result in the request:

```php
$entity = RaceResult::create(
    raceId: $raceId,
    driverId: $resultData->driver_id,
    divisionId: $resultData->division_id,
    position: $resultData->position,
    raceTime: $resultData->race_time,
    raceTimeDifference: $resultData->race_time_difference,
    fastestLap: $resultData->fastest_lap,
    penalties: $resultData->penalties,
    hasFastestLap: false, // ALWAYS false initially
    hasPole: $resultData->has_pole,
    dnf: $resultData->dnf,
);
```

**Initial Field Values**:
- `status`: `PENDING` (enum)
- `race_points`: `0`
- `positions_gained`: `null`
- `has_fastest_lap`: `false` (recalculated next)
- `has_pole`: Value from request (for qualifiers)

### 5. Calculate Fastest Laps (Non-Qualifiers Only)
**File**: `app/Application/Competition/Services/RaceResultApplicationService.php:80-82`

For regular races (NOT qualifiers), the backend automatically determines which driver(s) had the fastest lap:

```php
if (!$race->isQualifier()) {
    $this->calculateFastestLaps($entities);
}
```

#### Algorithm
**File**: `app/Application/Competition/Services/RaceResultApplicationService.php:105-132`

1. **Group by division** (if divisions enabled):
   - Each division has its own fastest lap winner
   - Null division is treated as its own group

2. **Find minimum time per group**:
   ```php
   // Find fastest lap time in milliseconds
   foreach ($groupResults as $result) {
       $timeMs = $result->fastestLap()->toMilliseconds();
       if ($timeMs !== null && ($minTimeMs === null || $timeMs < $minTimeMs)) {
           $minTimeMs = $timeMs;
       }
   }
   ```

3. **Mark all drivers with that time**:
   - Handles ties - multiple drivers can have `has_fastest_lap = true`
   ```php
   foreach ($groupResults as $result) {
       if ($result->fastestLap()->toMilliseconds() === $minTimeMs) {
           $result->markAsFastestLap();
       }
   }
   ```

### 6. Time Value Object Parsing
**File**: `app/Domain/Competition/ValueObjects/RaceTime.php`

All times are parsed and stored using the `RaceTime` value object:

```php
RaceTime::fromString("1:32:45.678")
```

**Parsing Logic**:
- Handles multiple formats: `H:MM:SS.mmm`, `M:SS.mmm`, `SS.mmm`, `S.mmm`
- Strips leading `+` or `-` signs
- Converts to milliseconds for calculations
- Stores original string format for display
- `null` or empty string creates a "null time" object

**Methods**:
- `toMilliseconds(): ?int` - For comparisons
- `value(): ?string` - Original format for display
- `isNull(): bool` - Check if time is empty
- `equals(RaceTime $other): bool` - Compare times

### 7. Database Storage
**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/RaceResultRepository.php`

Results are saved to the `race_results` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `race_id` | bigint | Foreign key to races |
| `driver_id` | bigint | Foreign key to season_drivers |
| `division_id` | bigint (nullable) | Foreign key to divisions |
| `position` | int (nullable) | Finishing position (assigned during race completion) |
| `race_time` | string (nullable) | Full race time (H:MM:SS.mmm) |
| `race_time_difference` | string (nullable) | Time behind leader (+SS.mmm) |
| `fastest_lap` | string (nullable) | Fastest lap time (M:SS.mmm) |
| `penalties` | string (nullable) | Total penalties (SS.mmm) |
| `has_fastest_lap` | boolean | True if driver had fastest lap in division |
| `has_pole` | boolean | True if driver won pole (qualifiers only) |
| `dnf` | boolean | Did not finish |
| `status` | enum | `pending`, `confirmed` |
| `race_points` | int | Points earned (calculated on race completion) |
| `positions_gained` | int (nullable) | Positions gained/lost vs grid (calculated on race completion) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Indexes**:
- Primary key on `id`
- Index on `race_id` (for querying all results for a race)
- Unique constraint on `(race_id, driver_id)` - prevents duplicate entries

## Special Cases

### Qualifiers

For qualifiers (`race.is_qualifier = true`):
1. **Fastest lap calculation is SKIPPED** - qualifiers don't have a "fastest lap" concept
2. The `fastest_lap` field stores the qualifying lap time (their best lap)
3. `has_pole` can be set by frontend (for pole position)
4. `race_time` field is typically null (qualifiers don't have "race time")

### DNF (Did Not Finish)

When `dnf = true`:
- `position` can still be assigned (during race completion)
- `race_time` may be null or partial
- Driver gets `dnf_points` instead of position-based points
- Still eligible for standings, but ranked after finishers

### DNS (Did Not Start)

Represented by:
- `dnf = false`
- `race_time = null` (no time recorded)

During race completion:
- Assigned position after DNF drivers
- Gets `dns_points` (usually 0)

### Missing Times

If a driver's fastest lap is null or empty:
- They are excluded from fastest lap consideration
- No error - system handles gracefully

## Error Handling

### Validation Errors
**Returns**: 422 Unprocessable Entity with validation messages

Example:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "results.0.driver_id": ["The selected driver is invalid."],
    "results.1.race_time": ["The race time format is invalid."]
  }
}
```

### Race Not Found
**File**: `app/Domain/Competition/Exceptions/RaceResultException.php`
**Returns**: 404 Not Found

```json
{
  "message": "Race not found",
  "data": null,
  "status": 404
}
```

### Database Transaction Rollback

If any error occurs during save:
1. Transaction is rolled back
2. No results are saved (atomic operation)
3. Error is returned to frontend

## Response Format

### Success Response (201 Created)

```json
{
  "message": "Race results saved successfully",
  "data": [
    {
      "id": 1,
      "race_id": 5,
      "driver_id": 42,
      "division_id": 3,
      "position": null,
      "race_time": "1:32:45.678",
      "race_time_difference": "+12.345",
      "fastest_lap": "1:25.123",
      "penalties": "5.000",
      "has_fastest_lap": true,
      "has_pole": false,
      "dnf": false,
      "status": "pending",
      "race_points": 0,
      "positions_gained": null,
      "created_at": "2025-12-01 12:00:00",
      "updated_at": "2025-12-01 12:00:00"
    },
    // ... more results
  ],
  "status": 201
}
```

## Related Files

### Backend
- **Controller**: `app/Http/Controllers/User/RaceResultController.php`
- **Request**: `app/Http/Requests/User/BulkRaceResultsRequest.php`
- **Application Service**: `app/Application/Competition/Services/RaceResultApplicationService.php`
- **Domain Entity**: `app/Domain/Competition/Entities/RaceResult.php`
- **Value Object**: `app/Domain/Competition/ValueObjects/RaceTime.php`
- **Repository**: `app/Infrastructure/Persistence/Eloquent/Repositories/RaceResultRepository.php`

### Frontend
- **Component**: `resources/app/js/components/result/ResultEntryTable.vue`
- **API Service**: `resources/app/js/services/raceService.ts`

## Next Steps

After race results are entered with `status = pending`:
1. User reviews results
2. User can edit/re-submit results (which replaces all results)
3. User marks race as complete → triggers [Race Completion](./02_race_completion.md)
