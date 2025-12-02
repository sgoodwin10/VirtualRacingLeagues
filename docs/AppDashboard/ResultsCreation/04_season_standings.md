# Season Standings Calculation

This document describes how season-wide standings are calculated by aggregating results from all completed rounds.

## Overview

Season standings are **NOT stored** in the database. They are calculated on-demand whenever requested, by aggregating `total_points` from all completed rounds.

**Key Principle**: Season standings are the cumulative sum of round standings across all completed rounds in the season.

## Entry Points

### API Endpoint
- **Route**: `GET /api/seasons/{seasonId}/standings`
- **Controller**: `app/Http/Controllers/User/SeasonController.php:188-192`
- **Method**: `standings()`

### Request Format
No body required - just a GET request to the endpoint.

## Process Flow

### Step 1: Fetch Season and Check Divisions
**File**: `app/Application/Competition/Services/SeasonApplicationService.php:564-568`

```php
public function getSeasonStandings(int $seasonId): array
{
    // Fetch season to check if divisions are enabled
    $season = $this->seasonRepository->findById($seasonId);
    $hasDivisions = $season->raceDivisionsEnabled();
```

### Step 2: Fetch All Completed Rounds
**File**: `app/Application/Competition/Services/SeasonApplicationService.php:570-576`

```php
    // Fetch all rounds with results (completed rounds only)
    $rounds = $this->roundRepository->findBySeasonId($seasonId);

    // Filter to completed rounds with round_results populated
    $completedRounds = array_filter($rounds, function ($round) {
        return $round->status()->isCompleted() && $round->roundResults() !== null;
    });
```

**Filters**:
- Round must have `status = 'completed'`
- Round must have `round_results` field populated (not null)

**Why both checks?**
- A round could be marked complete without results (edge case)
- Only rounds with calculated results should count toward standings

### Step 3: Handle No Completed Rounds
**File**: `app/Application/Competition/Services/SeasonApplicationService.php:578-584`

```php
    if (empty($completedRounds)) {
        // No completed rounds yet
        return [
            'standings' => $hasDivisions ? [] : [],
            'has_divisions' => $hasDivisions,
        ];
    }
```

**Returns**: Empty standings array

### Step 4: Aggregate Standings

Two paths depending on division configuration:

#### Without Divisions
**File**: `app/Application/Competition/Services/SeasonApplicationService.php:586-596`

```php
    if ($hasDivisions) {
        return [
            'standings' => $this->aggregateStandingsWithDivisions($completedRounds),
            'has_divisions' => true,
        ];
    }

    return [
        'standings' => $this->aggregateStandingsWithoutDivisions($completedRounds),
        'has_divisions' => false,
    ];
}
```

## Aggregation Without Divisions

**File**: `app/Application/Competition/Services/SeasonApplicationService.php:605-676`

### Step 4a: Extract Unique Driver IDs
```php
$driverIds = [];
foreach ($rounds as $round) {
    $roundResults = $round->roundResults();
    if ($roundResults === null || !isset($roundResults['standings'])) {
        continue;
    }

    foreach ($roundResults['standings'] as $standing) {
        $driverIds[$standing['driver_id']] = true;
    }
}
$driverIds = array_keys($driverIds);
```

**Purpose**: Collect all drivers who appear in any completed round.

### Step 4b: Batch Fetch Driver Names
```php
$driverNames = $this->batchFetchDriverNames($driverIds);
```

**Optimization**: Single database query fetches all driver names.

### Step 4c: Aggregate Points Per Driver
```php
$driverTotals = [];
$driverRoundData = [];

foreach ($rounds as $round) {
    $roundResults = $round->roundResults();
    if ($roundResults === null || !isset($roundResults['standings'])) {
        continue;
    }

    $roundId = $round->id();
    $roundNumber = $round->roundNumber()->value();

    foreach ($roundResults['standings'] as $standing) {
        $driverId = $standing['driver_id'];
        $points = $standing['total_points']; // KEY: Use total_points from round

        if (!isset($driverTotals[$driverId])) {
            $driverTotals[$driverId] = [
                'driver_id' => $driverId,
                'driver_name' => $driverNames[$driverId] ?? 'Unknown Driver',
                'total_points' => 0,
            ];
            $driverRoundData[$driverId] = [];
        }

        // Sum total_points across all rounds
        $driverTotals[$driverId]['total_points'] += $points;

        // Track per-round breakdown
        $driverRoundData[$driverId][] = [
            'round_id' => $roundId,
            'round_number' => $roundNumber,
            'points' => $points,
        ];
    }
}
```

**Key Point**: Uses `total_points` from round standings, which differs by mode:
- **Race Points Mode**: `total_points = race_points` (with bonuses included)
- **Round Points Mode**: `total_points = round_points + bonuses` (NOT including race_points)

### Step 4d: Sort by Total Points
```php
uasort($driverTotals, fn($a, $b) => $b['total_points'] <=> $a['total_points']);
```

**Sorting**: Descending by total points (highest first)

**Note**: No tie-breaking at season level. If two drivers have same points, PHP's stable sort determines order.

### Step 4e: Build Final Standings with Positions
```php
$standings = [];
$position = 1;
foreach ($driverTotals as $driverId => $data) {
    $standings[] = [
        'position' => $position++,
        'driver_id' => $data['driver_id'],
        'driver_name' => $data['driver_name'],
        'total_points' => $data['total_points'],
        'rounds' => $driverRoundData[$driverId], // Per-round breakdown
    ];
}

return $standings;
```

**Result Structure**:
```php
[
    [
        'position' => 1,
        'driver_id' => 42,
        'driver_name' => 'John Doe',
        'total_points' => 127,
        'rounds' => [
            ['round_id' => 1, 'round_number' => 1, 'points' => 50],
            ['round_id' => 2, 'round_number' => 2, 'points' => 52],
            ['round_id' => 3, 'round_number' => 3, 'points' => 25],
        ]
    ],
    // ... more drivers
]
```

## Aggregation With Divisions

**File**: `app/Application/Competition/Services/SeasonApplicationService.php:684-792`

Very similar to without divisions, but groups by division:

### Step 4a: Extract Driver and Division IDs
```php
$driverIds = [];
$divisionIds = [];

foreach ($rounds as $round) {
    $roundResults = $round->roundResults();
    if ($roundResults === null || !isset($roundResults['standings'])) {
        continue;
    }

    foreach ($roundResults['standings'] as $divisionStanding) {
        $divisionId = $divisionStanding['division_id'] ?? 0;
        if ($divisionId > 0) {
            $divisionIds[$divisionId] = true;
        }

        foreach ($divisionStanding['results'] as $standing) {
            $driverIds[$standing['driver_id']] = true;
        }
    }
}
```

### Step 4b: Batch Fetch Names
```php
$driverNames = $this->batchFetchDriverNames($driverIds);
$divisionNames = $this->batchFetchDivisionNames($divisionIds);
```

### Step 4c: Aggregate Points Per Driver Per Division
```php
$divisionDriverTotals = [];
$divisionDriverRoundData = [];

foreach ($rounds as $round) {
    $roundResults = $round->roundResults();
    if ($roundResults === null || !isset($roundResults['standings'])) {
        continue;
    }

    $roundId = $round->id();
    $roundNumber = $round->roundNumber()->value();

    foreach ($roundResults['standings'] as $divisionStanding) {
        $divisionId = $divisionStanding['division_id'] ?? 0;
        $divisionName = $divisionId === 0
            ? 'No Division'
            : ($divisionNames[$divisionId] ?? 'Unknown Division');

        if (!isset($divisionDriverTotals[$divisionId])) {
            $divisionDriverTotals[$divisionId] = [
                'division_id' => $divisionId === 0 ? null : $divisionId,
                'division_name' => $divisionName,
                'drivers' => [],
            ];
            $divisionDriverRoundData[$divisionId] = [];
        }

        foreach ($divisionStanding['results'] as $standing) {
            $driverId = $standing['driver_id'];
            $points = $standing['total_points'];

            if (!isset($divisionDriverTotals[$divisionId]['drivers'][$driverId])) {
                $divisionDriverTotals[$divisionId]['drivers'][$driverId] = [
                    'driver_id' => $driverId,
                    'driver_name' => $driverNames[$driverId] ?? 'Unknown Driver',
                    'total_points' => 0,
                ];
                $divisionDriverRoundData[$divisionId][$driverId] = [];
            }

            // Sum points across rounds
            $divisionDriverTotals[$divisionId]['drivers'][$driverId]['total_points'] += $points;

            // Track per-round breakdown
            $divisionDriverRoundData[$divisionId][$driverId][] = [
                'round_id' => $roundId,
                'round_number' => $roundNumber,
                'points' => $points,
            ];
        }
    }
}
```

### Step 4d: Build Final Standings Per Division
```php
$standings = [];
foreach ($divisionDriverTotals as $divisionId => $divisionData) {
    // Sort drivers by total points descending
    uasort($divisionData['drivers'], fn($a, $b) => $b['total_points'] <=> $a['total_points']);

    // Build driver standings with positions
    $drivers = [];
    $position = 1;
    foreach ($divisionData['drivers'] as $driverId => $driverData) {
        $drivers[] = [
            'position' => $position++,
            'driver_id' => $driverData['driver_id'],
            'driver_name' => $driverData['driver_name'],
            'total_points' => $driverData['total_points'],
            'rounds' => $divisionDriverRoundData[$divisionId][$driverId],
        ];
    }

    $standings[] = [
        'division_id' => $divisionData['division_id'],
        'division_name' => $divisionData['division_name'],
        'drivers' => $drivers,
    ];
}

return $standings;
```

**Result Structure**:
```php
[
    [
        'division_id' => 1,
        'division_name' => 'Pro',
        'drivers' => [
            [
                'position' => 1,
                'driver_id' => 42,
                'driver_name' => 'John Doe',
                'total_points' => 127,
                'rounds' => [
                    ['round_id' => 1, 'round_number' => 1, 'points' => 50],
                    ['round_id' => 2, 'round_number' => 2, 'points' => 52],
                    ['round_id' => 3, 'round_number' => 3, 'points' => 25],
                ]
            ],
            // ... more drivers
        ]
    ],
    [
        'division_id' => 2,
        'division_name' => 'Am',
        'drivers' => [ /* ... */ ]
    ]
]
```

## Response Format

### Without Divisions

```json
{
  "message": "Success",
  "data": {
    "standings": [
      {
        "position": 1,
        "driver_id": 42,
        "driver_name": "John Doe",
        "total_points": 127,
        "rounds": [
          {
            "round_id": 1,
            "round_number": 1,
            "points": 50
          },
          {
            "round_id": 2,
            "round_number": 2,
            "points": 52
          },
          {
            "round_id": 3,
            "round_number": 3,
            "points": 25
          }
        ]
      },
      {
        "position": 2,
        "driver_id": 43,
        "driver_name": "Jane Smith",
        "total_points": 98,
        "rounds": [
          {
            "round_id": 1,
            "round_number": 1,
            "points": 36
          },
          {
            "round_id": 2,
            "round_number": 2,
            "points": 43
          },
          {
            "round_id": 3,
            "round_number": 3,
            "points": 19
          }
        ]
      }
    ],
    "has_divisions": false
  },
  "status": 200
}
```

### With Divisions

```json
{
  "message": "Success",
  "data": {
    "standings": [
      {
        "division_id": 1,
        "division_name": "Pro",
        "drivers": [
          {
            "position": 1,
            "driver_id": 42,
            "driver_name": "John Doe",
            "total_points": 127,
            "rounds": [
              {
                "round_id": 1,
                "round_number": 1,
                "points": 50
              },
              {
                "round_id": 2,
                "round_number": 2,
                "points": 52
              },
              {
                "round_id": 3,
                "round_number": 3,
                "points": 25
              }
            ]
          }
        ]
      },
      {
        "division_id": 2,
        "division_name": "Am",
        "drivers": [
          {
            "position": 1,
            "driver_id": 50,
            "driver_name": "Bob Wilson",
            "total_points": 98,
            "rounds": [
              {
                "round_id": 1,
                "round_number": 1,
                "points": 36
              },
              {
                "round_id": 2,
                "round_number": 2,
                "points": 43
              },
              {
                "round_id": 3,
                "round_number": 3,
                "points": 19
              }
            ]
          }
        ]
      }
    ],
    "has_divisions": true
  },
  "status": 200
}
```

## Performance Considerations

### Why Not Store Season Standings?

**Advantages of calculating on-demand:**
1. **Always accurate**: No risk of stale data
2. **Simpler logic**: No need to update season standings when rounds change
3. **Easier maintenance**: One source of truth (round results)
4. **Recalculation**: If a round is uncompleted or recalculated, season standings automatically update

**Performance:**
- Minimal overhead: Just summing numbers from JSON fields
- Batch queries prevent N+1 issues
- Typically < 50ms for most seasons

### Optimization Strategies

**File**: `app/Application/Competition/Services/SeasonApplicationService.php:800-842`

1. **Batch Fetch Driver Names**:
   ```php
   private function batchFetchDriverNames(array $seasonDriverIds): array
   {
       $seasonDrivers = SeasonDriverEloquent::with('leagueDriver.driver')
           ->whereIn('id', $seasonDriverIds)
           ->get();

       $driverNames = [];
       foreach ($seasonDrivers as $seasonDriver) {
           $driverNames[$seasonDriver->id] = $seasonDriver->leagueDriver->driver->name;
       }

       return $driverNames;
   }
   ```

2. **Batch Fetch Division Names**:
   ```php
   private function batchFetchDivisionNames(array $divisionIds): array
   {
       $divisions = Division::whereIn('id', $divisionIds)->get();

       $divisionNames = [];
       foreach ($divisions as $division) {
           $divisionNames[$division->id] = $division->name;
       }

       return $divisionNames;
   }
   ```

**Result**: Exactly 3 database queries regardless of number of drivers/rounds:
1. Fetch rounds
2. Fetch driver names
3. Fetch division names (if divisions enabled)

## Edge Cases

### Driver Didn't Compete in All Rounds
- Driver appears in season standings with points from rounds they competed in
- Rounds they didn't compete in are simply not in their `rounds` array
- No penalty for missing rounds (unless configured at business logic level)

### Round Uncompleted After Being Completed
- If a round is uncompleted (status changed back to scheduled):
  - Round is excluded from season standings calculation
  - Season standings automatically recalculate without that round's points

### Round Results Recalculated
- If round results are recalculated (e.g., race results changed and round re-completed):
  - New `round_results` JSON replaces old one
  - Season standings automatically reflect new values on next request

### Driver Participated But DNF'd All Races
- If driver DNF'd every race in a round:
  - They are EXCLUDED from round standings (DNF check in round calculation)
  - They do NOT appear in season standings for that round
  - Effectively 0 points for that round

### Division Changes Mid-Season
**This is NOT supported**. Division configuration must be consistent across the entire season:
- If `season.race_divisions_enabled` changes mid-season, existing round results may become inconsistent
- System assumes division configuration is set once at season start

## Related Files

### Application Layer
- **Service**: `app/Application/Competition/Services/SeasonApplicationService.php`
  - Method: `getSeasonStandings()` (line 564)
  - Method: `aggregateStandingsWithoutDivisions()` (line 605)
  - Method: `aggregateStandingsWithDivisions()` (line 684)
  - Method: `batchFetchDriverNames()` (line 800)
  - Method: `batchFetchDivisionNames()` (line 825)

### Controller
- **Controller**: `app/Http/Controllers/User/SeasonController.php`
  - Method: `standings()` (line 188)

### Frontend
- **Component**: `resources/app/js/components/season/panels/SeasonStandingsPanel.vue`
- **API Service**: `resources/app/js/services/seasonService.ts`
- **Types**: `resources/app/js/types/seasonStandings.ts`

## Summary

**Season standings are calculated on-demand by:**
1. Fetching all completed rounds
2. Summing `total_points` from each round's `round_results` JSON
3. Sorting by total points descending
4. Returning formatted standings with per-round breakdown

**No database writes** - standings exist only in API response.
