# Tiebreaker Rules

This document describes how ties are resolved in the standings calculation when multiple drivers have the same points.

## Configuration

### Enable Tiebreakers

**Season setting**: `round_totals_tiebreaker_rules_enabled = true`

### Configure Rules

Rules are stored in the `season_round_tiebreaker_rules` junction table, with an `order` column determining priority.

## Available Tiebreaker Rules

### 1. Highest Qualifying Position

**Slug**: `highest-qualifying-position`

**Logic**:
- Compare best qualifying position across all qualifying sessions
- Lower position number wins (P1 beats P2)

**Example**:
- Driver A: Best qualifying = P3
- Driver B: Best qualifying = P1
- **Winner**: Driver B

### 2. Race 1 Best Result

**Slug**: `race-1-best-result`

**Logic**:
- Compare finish position in Race 1 (race_number = 1, non-qualifier)
- Lower position number wins

**Example**:
- Driver A: Race 1 finish = P4
- Driver B: Race 1 finish = P2
- **Winner**: Driver B

### 3. Best Result from All Races

**Slug**: `best-result-all-races`

**Logic**:
- Countback comparison of all race results
- Compare best result, then 2nd best, then 3rd best, etc.
- Excludes qualifying races (only main races)

**Example**:
```
Driver A: [P1, P3, P5]
Driver B: [P2, P2, P4]

Compare 1st best: P1 vs P2 → Driver A wins
```

If first best is equal:
```
Driver A: [P2, P3, P5]
Driver B: [P2, P2, P4]

Compare 1st best: P2 vs P2 → Tie
Compare 2nd best: P3 vs P2 → Driver B wins
```

## Application Process

### Domain Service

**File**: `/app/Domain/Competition/Services/RoundTiebreakerDomainService.php`

This is a pure domain service with no Laravel dependencies.

### Algorithm

```
1. Group drivers by total_points
    ↓
2. For each tied group (2+ drivers with same points):
    │
    ├── Try Rule 1 (in configured order)
    │   ├── If winner determined → Record resolution
    │   └── If still tied → Continue to next rule
    │
    ├── Try Rule 2
    │   ├── If winner determined → Record resolution
    │   └── If still tied → Continue to next rule
    │
    └── Try Rule 3
        ├── If winner determined → Record resolution
        └── If still tied → Mark as unresolved
    ↓
3. Apply resolutions to standings
    - Re-sort based on tiebreaker winners
    - Assign sequential positions
    ↓
4. Store tiebreaker information
```

### Resolution Recording

Each resolution records:
- Which drivers were tied
- Which rule resolved the tie
- Who won
- Explanation text

## Two Modes of Position Assignment

### Mode 1: Tiebreaker DISABLED

Tied drivers **share the same position**, and the next position is skipped:

```
Position 1: Driver A (25 points)
Position 2: Driver B (20 points)  ← Tied
Position 2: Driver C (20 points)  ← Tied
Position 4: Driver D (15 points)  ← Position 3 skipped
```

### Mode 2: Tiebreaker ENABLED

All positions are **sequential**:

```
Position 1: Driver A (25 points)
Position 2: Driver B (20 points)  ← Won tiebreaker
Position 3: Driver C (20 points)  ← Lost tiebreaker
Position 4: Driver D (15 points)
```

## Stored Tiebreaker Information

**Field**: `rounds.round_totals_tiebreaker_rules_information` (JSON)

### Structure

```json
{
  "resolutions": [
    {
      "driver_ids": [123, 456],
      "rule_slug": "highest-qualifying-position",
      "winner_id": 123,
      "explanation": "Driver 123 won with qualifying position 1 vs position 3",
      "resolved": true
    },
    {
      "driver_ids": [789, 101],
      "rule_slug": "best-result-all-races",
      "winner_id": null,
      "explanation": "Tie could not be resolved - identical results",
      "resolved": false
    }
  ],
  "applied_rules": ["highest-qualifying-position", "best-result-all-races"],
  "had_unresolved_ties": true
}
```

### Fields Explained

| Field | Description |
|-------|-------------|
| `resolutions` | Array of tie resolution attempts |
| `driver_ids` | The drivers who were tied |
| `rule_slug` | Which rule was applied |
| `winner_id` | The winning driver (null if unresolved) |
| `explanation` | Human-readable explanation |
| `resolved` | Whether the tie was successfully resolved |
| `applied_rules` | All rules that were used |
| `had_unresolved_ties` | Whether any ties remain |

## Domain Events

When tiebreakers are applied:

```php
$round->recordEvent(new RoundTiebreakerApplied(
    $round->id(),
    $tiebreakerInformation
));
```

## Implementation Details

### Rule Application Order

Rules are applied in the order specified in `season_round_tiebreaker_rules.order`:

```php
$rules = SeasonRoundTiebreakerRule::where('season_id', $seasonId)
    ->orderBy('order')
    ->get();

foreach ($rules as $rule) {
    $result = $this->applyRule($rule->slug, $tiedDrivers);
    if ($result->resolved) {
        break; // Stop at first resolution
    }
}
```

### Best Result Countback Logic

```php
function countbackCompare($driverAResults, $driverBResults) {
    // Sort both result sets by position (best first)
    sort($driverAResults);
    sort($driverBResults);

    // Compare position by position
    for ($i = 0; $i < max(count($driverAResults), count($driverBResults)); $i++) {
        $posA = $driverAResults[$i] ?? PHP_INT_MAX;
        $posB = $driverBResults[$i] ?? PHP_INT_MAX;

        if ($posA < $posB) return -1; // A wins
        if ($posB < $posA) return 1;  // B wins
    }

    return 0; // Still tied
}
```

## Edge Cases

### No Qualifying Session

If `highest-qualifying-position` is configured but round has no qualifier:
- Rule is skipped
- Next rule in order is tried

### DNF in Comparison Race

DNF positions are treated as worse than any finish:
- DNF typically assigned position after all finishers
- In countback, DNF is effectively "infinity" position

### Multiple Drivers Tied

If more than 2 drivers are tied:
- Tiebreaker determines relative order among all
- Each pair comparison uses same rules
- Results in full ordering of the tied group

### Identical Records

If all tiebreaker rules fail to resolve:
- Tie marked as "unresolved"
- Drivers may share position
- Admin notification may be needed

## Example Scenario

**Configuration**:
1. Highest Qualifying Position
2. Best Result from All Races

**Tied Drivers** (both 50 points):
- Driver A: Qualified P3, Race results [P1, P5, P3]
- Driver B: Qualified P1, Race results [P2, P4, P4]

**Resolution**:
1. Try "Highest Qualifying Position":
   - Driver A: P3
   - Driver B: P1
   - **Winner: Driver B** (P1 < P3)

**Stored Information**:
```json
{
  "resolutions": [
    {
      "driver_ids": [101, 102],
      "rule_slug": "highest-qualifying-position",
      "winner_id": 102,
      "explanation": "Driver B won with qualifying position 1 vs position 3",
      "resolved": true
    }
  ],
  "applied_rules": ["highest-qualifying-position"],
  "had_unresolved_ties": false
}
```

## Code Reference

**Domain service**:
```
/app/Domain/Competition/Services/RoundTiebreakerDomainService.php
```

**Application integration**:
```
/app/Application/Competition/Services/RoundApplicationService.php:966-1131 (sortDriversWithTieBreaking)
```

**Database tables**:
- `round_tiebreaker_rules` - Available rules
- `season_round_tiebreaker_rules` - Season configuration
