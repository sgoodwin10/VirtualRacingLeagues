# Results Creation Process - Overview

This document provides a comprehensive overview of how race results, round completions, and season standings are calculated and stored in the Virtual Racing Leagues application.

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Key Concepts](#key-concepts)
3. [Process Flow](#process-flow)
4. [Architecture](#architecture)
5. [Related Documents](#related-documents)

## High-Level Overview

The results creation process involves three main stages:

1. **Race Result Entry** - Users enter individual driver results for races (including qualifiers)
2. **Race Completion** - When a race is marked complete, points are calculated per race
3. **Round Completion** - When a round is completed, all race results are aggregated into round standings
4. **Season Standings** - Season-wide standings are calculated on-demand by aggregating completed round results

### Data Flow

```
Race Results (individual driver times)
    ↓
Race Completion (calculate race points per driver)
    ↓
Round Completion (aggregate all race results)
    ↓
Round Results (stored in rounds.round_results JSON field)
    ↓
Season Standings (calculated on-demand from all completed rounds)
```

## Key Concepts

### 1. Races vs Qualifiers

- **Races**: Regular race events with position-based scoring
- **Qualifiers**: Special race events (race_number = 0 or is_qualifier = true) that determine grid positions for races
  - Have `qualifying_format` (e.g., "one_shot", "best_of_3")
  - Store fastest lap times in `race_results.fastest_lap` field
  - Can award pole position bonus points

### 2. Two Point Calculation Modes

The system supports two distinct modes for calculating points:

#### Mode 1: Race Points Mode (`round.round_points = false`)
- **Race-level bonuses**: Fastest lap and pole bonuses are awarded during individual race completion
- **Bonuses included in race_points**: The `race_results.race_points` field includes both position points AND bonuses
- **Round standings**: Calculated by summing `race_points` from all races
- **Use case**: Traditional championship where each race awards bonuses independently

#### Mode 2: Round Points Mode (`round.round_points = true`)
- **Round-level bonuses**: Single fastest lap and pole bonus awarded across ALL races in the round
- **Race points separate**: The `race_results.race_points` contains ONLY position-based points
- **Round standings**: Calculated by `race_points` sum, then bonuses awarded based on final position
- **Round points**: Additional points awarded based on final standings position using `round.points_system`
- **Total points**: `round_points + fastest_lap_points + pole_position_points` (NOT including race_points)
- **Use case**: Weekend format where bonuses are awarded once for the entire weekend

### 3. Division Support

The system supports optional race divisions:

- **Without Divisions** (`season.race_divisions_enabled = false`):
  - All drivers compete in a single standings table
  - One set of round results

- **With Divisions** (`season.race_divisions_enabled = true`):
  - Separate standings per division
  - Round results contain multiple division standings
  - Cross-division results track best times across all divisions

### 4. Data Storage Locations

| Data | Storage Location | Format | When Calculated |
|------|-----------------|--------|-----------------|
| Race results | `race_results` table | Row per driver | When results entered |
| Race points | `race_results.race_points` | Integer | When race completed |
| Positions gained | `race_results.positions_gained` | Integer (nullable) | When race completed |
| Round results | `rounds.round_results` | JSON | When round completed |
| Cross-division results | `rounds.qualifying_results`, `rounds.race_time_results`, `rounds.fastest_lap_results` | JSON | When round completed |
| Season standings | Not stored (calculated on-demand) | - | On API request |

## Process Flow

### 1. Race Result Entry
**Triggers:** User submits race results via UI
**File:** `app/Application/Competition/Services/RaceResultApplicationService.php:45`

```
1. User enters driver times/positions
2. Frontend sends bulk results to API
3. Delete existing race results (if any)
4. Create new RaceResult entities
5. Calculate fastest lap per division (for non-qualifiers)
6. Save to database
```

**Result:** Race results stored in `race_results` table with `status = pending`

### 2. Race Completion
**Triggers:** User clicks "Complete" on race OR round completion cascades to races
**Files:**
- `app/Application/Competition/Services/RaceApplicationService.php:466-502`
- `app/Http/Controllers/User/RaceController.php` (if manual race completion)

```
1. Race status changed to "completed"
2. All race results status changed to "confirmed"
3. IF race_points enabled:
   - Separate finishers, DNF, DNS
   - Sort finishers by race_time
   - Assign positions (1, 2, 3...)
   - Calculate race points from points_system
   - Handle fastest lap bonus (race-level or round-level)
   - Handle pole position (qualifiers only)
   - Calculate positions_gained (if grid_source set)
4. Save race results with calculated values
```

**Result:** Race results have `race_points` and `positions_gained` calculated

### 3. Round Completion
**Triggers:** User clicks "Complete Round" button
**Files:**
- `app/Application/Competition/Services/RoundApplicationService.php:317-396`
- `app/Http/Controllers/User/RoundController.php:93-104`

```
1. Fetch round and authorize user
2. Check if divisions enabled
3. CASCADE: Mark all races as completed (triggers race point calculation)
4. Fetch all race results for the round
5. Calculate round standings:
   - Aggregate race points per driver
   - Apply round-level bonuses (if round_points enabled)
   - Assign round points based on standings position
   - Sort drivers by total points with tie-breaking
6. Calculate cross-division results (qualifying, race time, fastest lap)
7. Store results in rounds.round_results JSON field
8. Mark round as completed
```

**Result:** Round marked complete, `round_results` JSON populated

### 4. Season Standings
**Triggers:** User views season standings page
**Files:**
- `app/Application/Competition/Services/SeasonApplicationService.php:564-597`
- `app/Http/Controllers/User/SeasonController.php:188-192`

```
1. Fetch all rounds for season
2. Filter to completed rounds with round_results populated
3. Aggregate total_points across all rounds per driver
4. Sort by total points descending
5. Assign season positions
6. Return standings (not stored)
```

**Result:** Season standings returned as JSON response

## Architecture

This application follows **Domain-Driven Design (DDD)** principles:

### Layers

```
┌─────────────────────────────────────────┐
│  Interface Layer (Controllers)          │  Thin controllers (3-5 lines)
│  - RoundController                      │
│  - RaceController                       │
│  - SeasonController                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Application Layer (Services, DTOs)     │  Orchestration, transactions
│  - RoundApplicationService              │
│  - RaceApplicationService               │
│  - SeasonApplicationService             │
│  - RaceResultApplicationService         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Domain Layer (Entities, VOs)           │  Business logic (pure PHP)
│  - Round entity                         │
│  - Race entity                          │
│  - RaceResult entity                    │
│  - RaceTime value object                │
│  - PointsSystem value object            │
└─────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────┐
│  Infrastructure Layer (Repositories)     │  Database persistence
│  - RoundRepository                      │
│  - RaceRepository                       │
│  - RaceResultRepository                 │
└─────────────────────────────────────────┘
```

### Key Files

| Layer | File | Purpose |
|-------|------|---------|
| **Controllers** | `app/Http/Controllers/User/RoundController.php` | Round CRUD and completion endpoints |
| | `app/Http/Controllers/User/RaceController.php` | Race CRUD endpoints |
| | `app/Http/Controllers/User/SeasonController.php` | Season endpoints including standings |
| **Application Services** | `app/Application/Competition/Services/RoundApplicationService.php` | Round orchestration, point calculation |
| | `app/Application/Competition/Services/RaceApplicationService.php` | Race completion, race point calculation |
| | `app/Application/Competition/Services/SeasonApplicationService.php` | Season standings aggregation |
| | `app/Application/Competition/Services/RaceResultApplicationService.php` | Result entry and fastest lap calculation |
| **Domain Entities** | `app/Domain/Competition/Entities/Round.php` | Round business logic |
| | `app/Domain/Competition/Entities/Race.php` | Race and qualifier logic |
| | `app/Domain/Competition/Entities/RaceResult.php` | Individual result logic |
| **Value Objects** | `app/Domain/Competition/ValueObjects/RaceTime.php` | Time parsing and conversion |
| | `app/Domain/Competition/ValueObjects/PointsSystem.php` | Points array management |

## Related Documents

- [01_race_result_entry.md](./01_race_result_entry.md) - How race results are entered and stored
- [02_race_completion.md](./02_race_completion.md) - Race completion and point calculation
- [03_round_completion.md](./03_round_completion.md) - Round completion and standings calculation
- [04_season_standings.md](./04_season_standings.md) - Season standings aggregation
- [05_points_calculation.md](./05_points_calculation.md) - Detailed points calculation logic
- [06_data_structures.md](./06_data_structures.md) - JSON structure of stored results
