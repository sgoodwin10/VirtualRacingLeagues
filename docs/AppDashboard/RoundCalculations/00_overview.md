# Round Completion Calculations Overview

This documentation describes all the backend calculations triggered when a round is marked as "completed" in the system.

## Entry Point

| Component | Details |
|-----------|---------|
| **API Endpoint** | `PUT /rounds/{roundId}/complete` |
| **Controller** | `/var/www/app/Http/Controllers/User/RoundController.php` |
| **Method** | `complete()` (lines 102-120) |
| **Service** | `RoundApplicationService::completeRound()` (line 377) |

## Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. DB Transaction Start                                        │
├─────────────────────────────────────────────────────────────────┤
│  2. Authorization (league owner only)                           │
├─────────────────────────────────────────────────────────────────┤
│  3. Fetch Round & Season (check divisions)                      │
├─────────────────────────────────────────────────────────────────┤
│  4. Get All Races for Round (sorted by race_number)             │
├─────────────────────────────────────────────────────────────────┤
│  5. cascadeRaceCompletion()                                     │
│     ├── Mark all races as completed                             │
│     ├── Calculate race points (positions, bonuses)              │
│     └── Mark results as confirmed                               │
├─────────────────────────────────────────────────────────────────┤
│  6. calculateAndStoreRoundResults()                             │
│     ├── Aggregate driver points across races                    │
│     ├── Apply round-level bonuses                               │
│     └── Calculate cross-division results                        │
│         ├── qualifying_results (fastest quali laps)             │
│         ├── race_time_results (fastest finish times)            │
│         └── fastest_lap_results (fastest laps from races)       │
├─────────────────────────────────────────────────────────────────┤
│  7. calculateTeamChampionshipResults()                          │
│     └── Aggregate driver points per team                        │
├─────────────────────────────────────────────────────────────────┤
│  8. round.complete() - Set status to "completed"                │
├─────────────────────────────────────────────────────────────────┤
│  9. Save & Dispatch Events                                      │
├─────────────────────────────────────────────────────────────────┤
│  10. DB Transaction Commit                                      │
├─────────────────────────────────────────────────────────────────┤
│  11. Invalidate Cache (roundResultsCache.forget)                │
└─────────────────────────────────────────────────────────────────┘
```

## Results Storage

All calculated results are stored as JSON in the `rounds` table:

| Column | Contains | Calculation Method |
|--------|----------|-------------------|
| `round_results` | Driver standings with points | `calculateRoundResults()` |
| `qualifying_results` | Cross-division qualifying ranking | `calculateCrossDivisionResults()` |
| `race_time_results` | Cross-division race time ranking | `calculateCrossDivisionResults()` |
| `fastest_lap_results` | Cross-division fastest lap ranking | `calculateCrossDivisionResults()` |
| `team_championship_results` | Team standings | `calculateTeamChampionshipResults()` |
| `tiebreaker_information` | Tiebreaker details (if used) | `RoundTiebreakerDomainService` |

## Key Dependencies

```
Race Completion (positions, race_points)
    ↓
Round Results (aggregates race_points, applies bonuses)
    ↓
Team Championship (uses round_results total_points)
```

**Critical Order**:
1. Must calculate race points first - provides base data
2. Must calculate round results second - provides driver standings
3. Must calculate team championship last - depends on driver standings

## Documentation Files

| File | Description |
|------|-------------|
| [01_round_results.md](./01_round_results.md) | Driver championship standings calculation |
| [02_qualifying_results.md](./02_qualifying_results.md) | Cross-division qualifying rankings |
| [03_race_time_results.md](./03_race_time_results.md) | Cross-division race time rankings |
| [04_fastest_lap_results.md](./04_fastest_lap_results.md) | Cross-division fastest lap rankings |
| [05_team_championship_results.md](./05_team_championship_results.md) | Team championship standings |

## Key Files Reference

### Application Layer
- `/var/www/app/Application/Competition/Services/RoundApplicationService.php`
  - `completeRound()` (line 377)
  - `cascadeRaceCompletion()` (line 431)
  - `calculateAndStoreRoundResults()` (line 484)
  - `calculateRoundResults()` (line 723)
  - `calculateCrossDivisionResults()` (line 1876)
  - `calculateTeamChampionshipResults()` (line 2019)

- `/var/www/app/Application/Competition/Services/RaceApplicationService.php`
  - `calculateRacePoints()` (line 592)
  - `calculatePointsForResultSet()` (line 631)

### Domain Layer
- `/var/www/app/Domain/Competition/Entities/Round.php`
- `/var/www/app/Domain/Competition/Entities/RaceResult.php`
- `/var/www/app/Domain/Competition/ValueObjects/RaceTime.php`
- `/var/www/app/Domain/Competition/ValueObjects/PointsSystem.php`

### Infrastructure Layer
- `/var/www/app/Infrastructure/Cache/RoundResultsCacheService.php`
- `/var/www/app/Infrastructure/Persistence/Eloquent/Models/Round.php`

### Tests
- `/var/www/tests/Feature/RoundPointsCalculationTest.php`
- `/var/www/tests/Feature/TeamChampionshipCalculationTest.php`

## Two Operating Modes

The calculation system supports two modes controlled by `round.round_points`:

### Mode 1: Race Points Mode (`round_points = false`)
- Bonuses awarded at individual race level
- `total_points = race_points` (sum of all race points including bonuses)
- Traditional championship where each race awards bonuses independently

### Mode 2: Round Points Mode (`round_points = true`)
- Bonuses awarded at round level (single winner across ALL races)
- Positions determined by `race_points` (without bonuses)
- Round points assigned based on standings position
- `total_points = round_points + fastest_lap_points + pole_position_points`
- **Race points are NOT included in total_points!**
