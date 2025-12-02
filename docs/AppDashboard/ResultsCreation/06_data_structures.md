# Data Structures Reference

This document provides a comprehensive reference for all data structures used in the results creation process, including database schemas, JSON structures, and DTO formats.

## Database Tables

### race_results

**Purpose**: Store individual driver results for each race/qualifier

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | bigint | NO | Primary key |
| race_id | bigint | NO | Foreign key to races table |
| driver_id | bigint | NO | Foreign key to season_drivers table |
| division_id | bigint | YES | Foreign key to divisions table |
| position | int | YES | Finishing position (assigned during race completion) |
| race_time | string | YES | Full race time (H:MM:SS.mmm) |
| race_time_difference | string | YES | Time behind leader (+SS.mmm) |
| fastest_lap | string | YES | Fastest lap time (M:SS.mmm) |
| penalties | string | YES | Total penalties (SS.mmm) |
| has_fastest_lap | boolean | NO | True if driver had fastest lap in division |
| has_pole | boolean | NO | True if driver won pole (qualifiers only) |
| dnf | boolean | NO | Did not finish |
| status | enum | NO | 'pending' or 'confirmed' |
| race_points | int | NO | Points earned (calculated on race completion) |
| positions_gained | int | YES | Positions gained/lost vs grid |
| created_at | timestamp | NO | |
| updated_at | timestamp | NO | |

**Indexes**:
- Primary key on `id`
- Index on `race_id`
- Unique constraint on `(race_id, driver_id)`

**Lifecycle**:
1. **Entry**: Created with `status = 'pending'`, `race_points = 0`
2. **Race Completion**: `status` → `'confirmed'`, `race_points` calculated, `position` assigned
3. **Round Completion**: No changes (already completed in step 2)

### races

**Relevant Columns for Results**:

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| round_id | bigint | Foreign key to rounds |
| is_qualifier | boolean | True if this is a qualifying session |
| status | enum | 'scheduled' or 'completed' |
| race_points | boolean | Enable point calculation for this race |
| points_system | json | Position-based points (e.g., [25,18,15,...]) |
| fastest_lap | int | Bonus points for fastest lap |
| fastest_lap_top_10 | boolean | Restrict fastest lap bonus to top 10 |
| qualifying_pole | int | Bonus points for pole position (qualifiers) |
| qualifying_pole_top_10 | boolean | Restrict pole bonus to top 10 |
| dnf_points | int | Points for DNF drivers |
| dns_points | int | Points for DNS drivers |
| grid_source | enum | 'manual', 'qualifying', 'previous_race', 'reverse_grid' |
| grid_source_race_id | bigint | Race ID for grid source |

### rounds

**Relevant Columns for Results**:

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| season_id | bigint | Foreign key to seasons |
| status | enum | 'scheduled' or 'completed' |
| round_points | boolean | Enable round points mode |
| points_system | json | Round points by position (e.g., [25,18,15,...]) |
| fastest_lap | int | Round-level fastest lap bonus |
| fastest_lap_top_10 | boolean | Restrict to top 10 in standings |
| qualifying_pole | int | Round-level pole bonus |
| qualifying_pole_top_10 | boolean | Restrict to top 10 in standings |
| **round_results** | **json** | **Calculated round standings (see below)** |
| **qualifying_results** | **json** | **Cross-division qualifying rankings** |
| **race_time_results** | **json** | **Cross-division race time rankings** |
| **fastest_lap_results** | **json** | **Cross-division fastest lap rankings** |

**Lifecycle**:
1. **Creation**: `status = 'scheduled'`, all JSON fields = null
2. **Round Completion**: `status` → `'completed'`, JSON fields populated with calculated results
3. **Season Standings**: Read JSON fields to aggregate season standings

## JSON Structures

### round_results (Without Divisions)

**Stored in**: `rounds.round_results`

```json
{
  "standings": [
    {
      "position": 1,
      "driver_id": 42,
      "driver_name": "John Doe",
      "race_points": 50,
      "fastest_lap_points": 1,
      "pole_position_points": 1,
      "round_points": 25,
      "total_points": 27,
      "total_positions_gained": 5
    },
    {
      "position": 2,
      "driver_id": 43,
      "driver_name": "Jane Smith",
      "race_points": 43,
      "fastest_lap_points": 0,
      "pole_position_points": 0,
      "round_points": 18,
      "total_points": 18,
      "total_positions_gained": -2
    }
  ]
}
```

**Field Descriptions**:
- `position`: Finishing position in round (1, 2, 3, ...)
- `driver_id`: Season driver ID (FK to season_drivers)
- `driver_name`: Display name (denormalized for performance)
- `race_points`: Sum of all race points from all races/qualifiers
- `fastest_lap_points`: Fastest lap bonus (race-level tally OR round-level award)
- `pole_position_points`: Pole bonus (race-level tally OR round-level award)
- `round_points`: Points based on standings position (round points mode only)
- `total_points`: Final points for this round (mode-dependent)
  - Race points mode: `total_points = race_points`
  - Round points mode: `total_points = round_points + fastest_lap_points + pole_position_points`
- `total_positions_gained`: Sum of positions_gained from all races

### round_results (With Divisions)

**Stored in**: `rounds.round_results`

```json
{
  "standings": [
    {
      "division_id": 1,
      "division_name": "Pro",
      "results": [
        {
          "position": 1,
          "driver_id": 42,
          "driver_name": "John Doe",
          "race_points": 50,
          "fastest_lap_points": 1,
          "pole_position_points": 1,
          "round_points": 25,
          "total_points": 27,
          "total_positions_gained": 5
        }
      ]
    },
    {
      "division_id": 2,
      "division_name": "Am",
      "results": [
        {
          "position": 1,
          "driver_id": 50,
          "driver_name": "Bob Wilson",
          "race_points": 43,
          "fastest_lap_points": 1,
          "pole_position_points": 0,
          "round_points": 25,
          "total_points": 26,
          "total_positions_gained": 3
        }
      ]
    }
  ]
}
```

**Structure**:
- Top level: Array of divisions
- Each division: `division_id`, `division_name`, and `results` array
- `results`: Array of driver standings (same format as without divisions)

### qualifying_results

**Stored in**: `rounds.qualifying_results`

**Purpose**: Cross-division ranking of all qualifying lap times

```json
[
  {
    "position": 1,
    "race_result_id": 123,
    "time_ms": 85123
  },
  {
    "position": 2,
    "race_result_id": 124,
    "time_ms": 85456
  },
  {
    "position": 3,
    "race_result_id": 125,
    "time_ms": 85789
  }
]
```

**Field Descriptions**:
- `position`: Overall qualifying position (1 = fastest)
- `race_result_id`: FK to race_results table (to fetch driver info)
- `time_ms`: Qualifying lap time in milliseconds

**Data Source**: All results where `race.is_qualifier = true`, sorted by `fastest_lap` time

### race_time_results

**Stored in**: `rounds.race_time_results`

**Purpose**: Cross-division ranking of best race times per driver

```json
[
  {
    "position": 1,
    "race_result_id": 130,
    "time_ms": 5434567
  },
  {
    "position": 2,
    "race_result_id": 131,
    "time_ms": 5445678
  }
]
```

**Field Descriptions**:
- `position`: Overall race time position (1 = fastest)
- `race_result_id`: FK to race_results table (best race for this driver)
- `time_ms`: Race time in milliseconds

**Data Source**: Best `race_time` per driver from all non-qualifier races, excluding DNF

### fastest_lap_results

**Stored in**: `rounds.fastest_lap_results`

**Purpose**: Cross-division ranking of all fastest laps

```json
[
  {
    "position": 1,
    "race_result_id": 135,
    "time_ms": 85123
  },
  {
    "position": 2,
    "race_result_id": 136,
    "time_ms": 85234
  }
]
```

**Field Descriptions**:
- `position`: Overall fastest lap position (1 = fastest)
- `race_result_id`: FK to race_results table
- `time_ms`: Fastest lap time in milliseconds

**Data Source**: All `fastest_lap` times from non-qualifier races

## DTO Structures

### CreateRaceResultData

**File**: `app/Application/Competition/DTOs/CreateRaceResultData.php`

**Used for**: Race result entry API request

```php
CreateRaceResultData {
    driver_id: int
    division_id: ?int
    position: ?int
    race_time: ?string           // "H:MM:SS.mmm"
    race_time_difference: ?string // "+SS.mmm"
    fastest_lap: ?string          // "M:SS.mmm"
    penalties: ?string            // "SS.mmm"
    has_fastest_lap: bool         // IGNORED by backend
    has_pole: bool
    dnf: bool
}
```

**Example**:
```json
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
}
```

### RaceResultData

**File**: `app/Application/Competition/DTOs/RaceResultData.php`

**Used for**: API responses after result entry/completion

```php
RaceResultData {
    id: int
    race_id: int
    driver_id: int
    division_id: ?int
    position: ?int
    race_time: ?string
    race_time_difference: ?string
    fastest_lap: ?string
    penalties: ?string
    has_fastest_lap: bool
    has_pole: bool
    dnf: bool
    status: string               // "pending" or "confirmed"
    race_points: int
    positions_gained: ?int
    created_at: string
    updated_at: string
    driver: ?array              // Optional driver info
}
```

### RoundData

**File**: `app/Application/Competition/DTOs/RoundData.php`

**Used for**: Round API responses

```php
RoundData {
    id: int
    season_id: int
    round_number: int
    name: ?string
    slug: string
    status: string              // "scheduled" or "completed"
    round_results: ?array       // JSON structure as documented above
    qualifying_results: ?array  // JSON structure as documented above
    race_time_results: ?array   // JSON structure as documented above
    fastest_lap_results: ?array // JSON structure as documented above
    scheduled_at: ?string
    timezone: string
    // ... other fields omitted for brevity
}
```

### RoundResultsData

**File**: `app/Application/Competition/DTOs/RoundResultsData.php`

**Used for**: Round results detail API response (includes race events)

```php
RoundResultsData {
    round: array {              // Round summary
        id: int
        round_number: int
        name: ?string
        status: string
        round_results: ?array
        qualifying_results: ?array
        race_time_results: ?array
        fastest_lap_results: ?array
    }
    divisions: array<DivisionData>
    race_events: array<RaceEventResultData>
}
```

### RaceEventResultData

**File**: `app/Application/Competition/DTOs/RaceEventResultData.php`

**Used for**: Individual race with results in RoundResultsData

```php
RaceEventResultData {
    id: int
    race_number: int
    name: ?string
    is_qualifier: bool
    status: string
    race_points: bool
    results: array<RaceResultData>
}
```

## API Response Formats

### POST /api/.../races/{raceId}/results

**Success (201 Created)**:
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
    }
  ],
  "status": 201
}
```

### POST /api/.../rounds/{roundId}/complete

**Success (200 OK)**:
```json
{
  "message": "Round marked as completed",
  "data": {
    "id": 5,
    "season_id": 3,
    "round_number": 2,
    "name": "Spa Weekend",
    "status": "completed",
    "round_results": {
      "standings": [
        {
          "position": 1,
          "driver_id": 42,
          "driver_name": "John Doe",
          "race_points": 50,
          "fastest_lap_points": 1,
          "pole_position_points": 1,
          "round_points": 25,
          "total_points": 27,
          "total_positions_gained": 5
        }
      ]
    },
    "qualifying_results": [
      {
        "position": 1,
        "race_result_id": 123,
        "time_ms": 85123
      }
    ],
    "race_time_results": [
      {
        "position": 1,
        "race_result_id": 130,
        "time_ms": 5434567
      }
    ],
    "fastest_lap_results": [
      {
        "position": 1,
        "race_result_id": 135,
        "time_ms": 85123
      }
    ],
    "created_at": "2025-11-01 10:00:00",
    "updated_at": "2025-12-01 12:00:00"
  },
  "status": 200
}
```

### GET /api/seasons/{seasonId}/standings

**Success (200 OK) - Without Divisions**:
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
      }
    ],
    "has_divisions": false
  },
  "status": 200
}
```

**Success (200 OK) - With Divisions**:
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

## Time Format Specifications

### Race Time Format

**Pattern**: `H:MM:SS.mmm` or `M:SS.mmm` or `SS.mmm`

**Examples**:
- `1:32:45.678` (1 hour, 32 minutes, 45.678 seconds)
- `32:45.678` (32 minutes, 45.678 seconds)
- `45.678` (45.678 seconds)

**Storage**: String in database
**Conversion**: RaceTime value object converts to milliseconds for calculations

### Fastest Lap Format

**Pattern**: `M:SS.mmm` or `SS.mmm`

**Examples**:
- `1:25.123` (1 minute, 25.123 seconds)
- `85.123` (85.123 seconds)

### Time Difference Format

**Pattern**: `+SS.mmm` or `+S.mmm`

**Examples**:
- `+12.345` (12.345 seconds behind)
- `+5.000` (5 seconds behind)

### Penalty Format

**Pattern**: `SS.mmm` or `S.mmm`

**Examples**:
- `5.000` (5 second penalty)
- `10.500` (10.5 second penalty)

## Related Files

### DTOs
- `app/Application/Competition/DTOs/CreateRaceResultData.php`
- `app/Application/Competition/DTOs/RaceResultData.php`
- `app/Application/Competition/DTOs/RoundData.php`
- `app/Application/Competition/DTOs/RoundResultsData.php`
- `app/Application/Competition/DTOs/RaceEventResultData.php`

### Value Objects
- `app/Domain/Competition/ValueObjects/RaceTime.php`
- `app/Domain/Competition/ValueObjects/PointsSystem.php`
- `app/Domain/Competition/ValueObjects/RaceResultStatus.php`

### Migrations
- `database/migrations/2025_10_25_022500_create_race_results_table.php`
- `database/migrations/2025_11_29_125418_add_round_results_to_rounds_table.php`
- `database/migrations/2025_11_30_014903_add_positions_gained_to_race_results_table.php`
- `database/migrations/2025_11_30_015934_add_cross_division_results_to_rounds_table.php`
