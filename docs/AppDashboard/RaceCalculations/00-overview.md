# Race Calculations Overview

This documentation describes the backend calculations that are triggered when races, qualifiers, and rounds are marked as "completed" in the Virtual Racing Leagues application.

## Table of Contents

1. [Race Completion](./01-race-completion.md) - What happens when a race is marked completed
2. [Qualifier Completion](./02-qualifier-completion.md) - What happens when a qualifier is marked completed
3. [Round Completion](./03-round-completion.md) - What happens when a round is marked completed
4. [Standings Calculation](./04-standings-calculation.md) - How driver and season standings work
5. [Tiebreaker Rules](./05-tiebreaker-rules.md) - How ties are resolved
6. [Team Championship](./06-team-championship.md) - Team standings calculation

## System Architecture

### Calculation Hierarchy

```
Season Level (Aggregated on-demand)
    └── Round Level (Calculated on round completion)
        └── Race Level (Calculated on race completion)
            └── Race Results (Individual driver results)
```

### Key Principles

1. **Bottom-up Calculation**: Race results feed into round standings, which feed into season standings
2. **Stored vs Calculated**: Round standings are pre-calculated and stored; season standings are aggregated on-demand
3. **Synchronous Processing**: All calculations happen within database transactions (no background jobs)
4. **Cache Invalidation**: Redis cache is cleared after calculations to ensure fresh data

## Entry Points

### Frontend Triggers

| Action | API Endpoint | Service Method |
|--------|-------------|----------------|
| Toggle race completed | `PUT /races/{id}` | `RaceApplicationService::updateRace()` |
| Toggle qualifier completed | `PUT /qualifiers/{id}` | `QualifierApplicationService::updateQualifier()` |
| Complete round | `PUT /rounds/{id}/complete` | `RoundApplicationService::completeRound()` |
| Uncomplete round | `PUT /rounds/{id}/uncomplete` | `RoundApplicationService::uncompleteRound()` |

### Vue Components

- `RaceListItem.vue` - Toggles race status
- `QualifierListItem.vue` - Toggles qualifier status
- `RoundsPanel.vue` - Handles round completion toggle

## Key Files

### Application Services
- `/app/Application/Competition/Services/RaceApplicationService.php`
- `/app/Application/Competition/Services/QualifierApplicationService.php`
- `/app/Application/Competition/Services/RoundApplicationService.php`
- `/app/Application/Competition/Services/SeasonApplicationService.php`

### Domain Entities
- `/app/Domain/Competition/Entities/Race.php`
- `/app/Domain/Competition/Entities/RaceResult.php`
- `/app/Domain/Competition/Entities/Round.php`
- `/app/Domain/Competition/Entities/Season.php`

### Domain Services
- `/app/Domain/Competition/Services/RoundTiebreakerDomainService.php`

### Controllers
- `/app/Http/Controllers/User/RaceController.php`
- `/app/Http/Controllers/User/QualifierController.php`
- `/app/Http/Controllers/User/RoundController.php`

## Configuration Options

### Race Level
- `race_points` (boolean) - Enable position-based points
- `fastest_lap` (int) - Bonus points for fastest lap
- `fastest_lap_top_10` (boolean) - Restrict FL bonus to top 10

### Qualifier Level
- `qualifying_pole` (int) - Bonus points for pole position
- `qualifying_pole_top_10` (boolean) - Restrict pole bonus to top 10

### Round Level
- `round_points` (boolean) - Enable round-level points
- `points_system` (JSON) - Position to points mapping

### Season Level
- `race_divisions_enabled` (boolean) - Enable divisions
- `drop_round` (boolean) - Enable drop rounds
- `total_drop_rounds` (int) - Number of rounds to drop
- `team_championship_enabled` (boolean) - Enable team standings
- `round_totals_tiebreaker_rules_enabled` (boolean) - Enable tiebreakers

## Database Tables

| Table | Purpose |
|-------|---------|
| `races` | Race configuration and status |
| `race_results` | Individual driver results |
| `rounds` | Round configuration and stored results |
| `seasons` | Season configuration |
| `divisions` | Division definitions |
| `season_drivers` | Driver-to-team mappings |
| `round_tiebreaker_rules` | Available tiebreaker rules |
| `season_round_tiebreaker_rules` | Season tiebreaker configuration |

## Calculation Flow Summary

```
Individual Race Marked Completed
    ├── Race results status → CONFIRMED
    ├── Calculate positions (by race time)
    ├── Calculate race points
    ├── Award fastest lap bonus
    └── Calculate positions gained

Individual Qualifier Marked Completed
    ├── Qualifier results status → CONFIRMED
    ├── Calculate grid positions (by lap time)
    ├── Identify pole position
    └── Award pole bonus (if not restricted to top 10)

Round Marked Completed
    ├── Cascade completion to all races/qualifiers
    ├── Calculate driver standings
    │   ├── Aggregate race points
    │   ├── Apply tiebreaker rules
    │   └── Award round-level bonuses
    ├── Calculate team championship (if enabled)
    ├── Store results in round entity
    └── Invalidate cache
```
