# Team Championship Calculation

This document describes how team standings are calculated when team championship is enabled for a season.

## Configuration

### Enable Team Championship

**Season settings**:

| Setting | Type | Description |
|---------|------|-------------|
| `team_championship_enabled` | boolean | Enable team standings |
| `teams_drivers_for_calculation` | int/null | Top N drivers per team (null = all) |
| `teams_drop_rounds` | boolean | Enable drop rounds for teams |
| `teams_total_drop_rounds` | int/null | Number of rounds to drop |

## Calculation Overview

### Two-Tier System

Like driver standings, team standings are calculated at two levels:

1. **Round Level**: Calculated when round completes
2. **Season Level**: Aggregated from completed rounds

### Calculation Trigger

Team championship is calculated during round completion:

```php
// In RoundApplicationService::completeRound()
if ($season->teamChampionshipEnabled()) {
    $this->calculateTeamChampionshipResults($round);
}
```

## Round-Level Team Calculation

**Method**: `calculateTeamChampionshipResults()`
**Lines**: 2019-2157 in `RoundApplicationService.php`

### Process Flow

```
1. Get final driver standings from round_results
    ↓
2. Map driver_id → team_id (from season_drivers)
    ↓
3. Group drivers by team
    ↓
4. For each team:
    ├── Get all driver points
    ├── Sort by points descending
    ├── Apply driver limit (if configured)
    └── Sum points
    ↓
5. Sort teams by total_points
    ↓
6. Store in round.team_championship_results
```

### Driver Limit

If `teams_drivers_for_calculation` is set:

```php
// Only count top N drivers per team
$sortedDrivers = collect($teamDrivers)->sortByDesc('total_points');
$countingDrivers = $sortedDrivers->take($driversForCalculation);
$teamTotal = $countingDrivers->sum('total_points');
```

**Example** (limit = 2):
```
Team Red:
  - Driver A: 25 points ← Counts
  - Driver B: 18 points ← Counts
  - Driver C: 15 points ← Does not count

Team Total: 43 points (not 58)
```

### Privateers

Drivers without a team (`team_id = null`) are excluded from team standings:

```php
// Exclude privateers
$teamDrivers = array_filter($drivers, fn($d) => $d['team_id'] !== null);
```

## Data Structure

### Round Team Championship Results

Stored in `rounds.team_championship_results`:

```json
{
  "standings": [
    {
      "position": 1,
      "team_id": 10,
      "team_name": "Red Bull Racing",
      "total_points": 50,
      "driver_ids": [123, 456],
      "driver_points": [
        {"driver_id": 123, "points": 27},
        {"driver_id": 456, "points": 23}
      ]
    },
    {
      "position": 2,
      "team_id": 11,
      "team_name": "Mercedes AMG",
      "total_points": 45,
      "driver_ids": [789, 101],
      "driver_points": [
        {"driver_id": 789, "points": 25},
        {"driver_id": 101, "points": 20}
      ]
    }
  ]
}
```

## Season-Level Aggregation

### Process

```
1. Get team_championship_results from all completed rounds
    ↓
2. Sum total_points per team across all rounds
    ↓
3. Apply team drop rounds if enabled
    ↓
4. Sort by total (or drop_total)
    ↓
5. Return team standings
```

### Team Drop Rounds

If `teams_drop_rounds = true`:

```php
// For each team:
$allRoundPoints = [50, 45, 40, 35, 30, 25];

// Drop lowest N rounds
sort($allRoundPoints); // [25, 30, 35, 40, 45, 50]
$dropped = array_slice($allRoundPoints, 0, $teamsDropRounds);
$remaining = array_slice($allRoundPoints, $teamsDropRounds);

$dropTotal = array_sum($remaining);
```

## Tie Breaking for Teams

### Current Implementation

Teams are sorted by:
1. `total_points` descending
2. `team_name` alphabetically (for ties)

```php
usort($teamStandings, function($a, $b) {
    if ($a['total_points'] !== $b['total_points']) {
        return $b['total_points'] <=> $a['total_points'];
    }
    return $a['team_name'] <=> $b['team_name'];
});
```

### Note

Currently, team tiebreakers do not use the sophisticated tiebreaker rules system that drivers use. Ties are resolved alphabetically.

## Division Handling

### With Divisions Enabled

Team standings are typically calculated across all divisions:
- Driver standings are per-division
- Team standings aggregate drivers from all divisions
- A team can have drivers in multiple divisions

### Example

```
Team Red:
  - Driver A (Pro Division): 25 points
  - Driver B (Am Division): 20 points

Team Total: 45 points (combined across divisions)
```

## Database Updates

### Round Completion

```sql
UPDATE rounds SET
    team_championship_results = '{"standings": [...]}'
WHERE id = ?
```

### Related Tables

| Table | Relationship |
|-------|-------------|
| `seasons` | Team championship configuration |
| `teams` | Team definitions |
| `season_drivers` | Driver-to-team mapping |
| `rounds` | Stored team results |

## Edge Cases

### Team with No Drivers

If a team has no drivers who scored points:
- Team appears in standings with 0 points
- Placed at bottom

### Driver Team Change Mid-Season

If a driver changes teams mid-season:
- Points earned with old team stay with old team
- Points earned with new team go to new team
- Historical accuracy maintained

### All Drivers DNF

If all team drivers DNF in a round:
- Team receives 0 points for that round
- Counts as a competed round for drop calculation

## Example Scenario

**Season Configuration**:
- Team championship: enabled
- Drivers for calculation: 2
- Team drop rounds: enabled
- Total drop rounds: 1

**Round Results**:

| Team | Driver | Points |
|------|--------|--------|
| Team A | Driver 1 | 25 |
| Team A | Driver 2 | 18 |
| Team A | Driver 3 | 15 |
| Team B | Driver 4 | 22 |
| Team B | Driver 5 | 20 |
| Privateer | Driver 6 | 12 |

**Calculation**:

Team A (limit 2):
- Top 2: Driver 1 (25) + Driver 2 (18) = 43
- Driver 3's 15 points not counted

Team B (limit 2):
- Top 2: Driver 4 (22) + Driver 5 (20) = 42

Privateer:
- Not included in team standings

**Round Team Standings**:
1. Team A: 43 points
2. Team B: 42 points

## Code Reference

**Main calculation**:
```
/app/Application/Competition/Services/RoundApplicationService.php:2019-2157 (calculateTeamChampionshipResults)
```

**Season aggregation**:
```
/app/Application/Competition/Services/SeasonApplicationService.php (team championship aggregation in getSeasonStandings)
```

**Configuration**:
```
/app/Domain/Competition/Entities/Season.php (teamChampionshipEnabled, teamsDriversForCalculation, etc.)
```
