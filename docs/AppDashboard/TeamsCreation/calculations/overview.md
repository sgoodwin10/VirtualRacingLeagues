# Team Championship Calculations - Feature Overview

## Feature Summary

This feature implements **Team Championship Standings Calculations** that occur when a round is marked as complete. It aggregates driver points per team and stores the results in a new JSON field on the `rounds` table.

---

## Business Requirements

### What This Feature Does

1. **When a round is marked as complete**, the system will:
   - Check if `team_championship_enabled` is true for the season
   - Aggregate race points for all drivers assigned to each team
   - Apply the `teams_drivers_for_calculation` rule (use only top N drivers if set)
   - Store the calculated team standings in the round record

2. **The calculation respects**:
   - Driver team assignments via `season_drivers.team_id`
   - Season configuration for team championship
   - Variable number of drivers per team counting toward points

3. **Output**: A JSON object stored in `rounds.team_championship_results`

---

## Data Model

### New Database Field

**Table**: `rounds`
**Field**: `team_championship_results` (JSON, nullable)
**Position**: After `fastest_lap_results`

### JSON Structure

```json
{
    "standings": [
        {
            "team_id": 1,
            "total_points": 45,
            "race_result_ids": [45, 67, 68, 97]
        },
        {
            "team_id": 3,
            "total_points": 32,
            "race_result_ids": [54, 56, 76, 77]
        },
        {
            "team_id": 2,
            "total_points": 19,
            "race_result_ids": [3, 7, 9]
        }
    ]
}
```

**Field Descriptions**:
- `team_id`: Reference to `teams.id`
- `total_points`: Sum of race points from counted drivers
- `race_result_ids`: Array of `race_results.id` values that contributed to the total

---

## Configuration (Already Exists)

### Season Settings

| Field | Type | Purpose |
|-------|------|---------|
| `team_championship_enabled` | boolean | Master toggle for team championship |
| `teams_drivers_for_calculation` | int\|null | Number of top drivers to count (null = all) |

These fields already exist in the `seasons` table and are exposed in the Season domain entity.

---

## Business Rules (Confirmed)

1. **Tie-breaking**: When two or more teams have the same total points, sort alphabetically by team name
2. **Teams with no results**: Teams that have no drivers participating in a round are **excluded entirely** from the standings (not shown with 0 points)
3. **Privateer drivers**: Drivers without a team assignment (`team_id = null`) are **excluded** from team championship calculations

---

## Calculation Logic

### Algorithm

```
When round is marked complete:

1. IF season.team_championship_enabled = false
   → Skip team calculations (return early)

2. Get all race results for all races in this round

3. Get all teams for this season

4. For each team:
   a. Get all race results where driver belongs to this team
   b. Sort results by race_points (descending)
   c. IF teams_drivers_for_calculation is set:
      → Take only the top N results
   d. Sum the race_points of selected results
   e. Record the race_result_ids used

5. Sort teams by total_points (descending)

6. Build JSON object with standings array

7. Save to rounds.team_championship_results
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Team has fewer drivers than `teams_drivers_for_calculation` | Use all available drivers |
| Team has no drivers in round | **Excluded entirely** from standings |
| Driver has no team assignment (privateer) | **Excluded** from team calculations |
| `teams_drivers_for_calculation` = null | Count all drivers |
| `team_championship_enabled` = false | Skip calculation entirely |
| Two teams have equal points | **Sort alphabetically by team name** |

---

## Integration Point

### Trigger Location

**File**: `app/Application/Competition/Services/RoundApplicationService.php`
**Method**: `completeRound()`

The calculation should occur **after** driver round results are calculated and **before** the round is marked as completed.

### Current Flow (to be extended):

```
1. Mark all races as completed
2. Calculate race points for each race
3. Confirm all race results
4. Calculate round results (driver level) ← EXISTING
5. Calculate team championship results   ← NEW (insert here)
6. Mark round as completed
7. Invalidate cache
8. Dispatch RoundCompleted event
```

---

## Scope Boundaries

### In Scope (This Feature)

- Database migration for new field
- Backend calculation logic
- Storing results in database
- Unit tests for calculation logic

### Out of Scope (Future Features)

- Displaying team standings in UI
- Cumulative season-long team standings
- Drop rounds logic for teams
- Team bonus points (fastest lap, pole)
- API endpoints to retrieve team standings

---

## Technical Architecture

### DDD Layers Involved

| Layer | Components |
|-------|------------|
| **Domain** | Round entity (new method to set team results) |
| **Application** | RoundApplicationService (calculation logic) |
| **Infrastructure** | RoundRepositoryEloquent (persist JSON field) |
| **Database** | Migration for new column |

### Key Dependencies

- `Season` entity (for configuration)
- `Team` entities (for team list)
- `SeasonDriver` entities (for team assignments)
- `RaceResult` entities (for points data)

---

## Agents Required

| Task | Agent |
|------|-------|
| Database migration | `dev-be` |
| Domain entity updates | `dev-be` |
| Application service logic | `dev-be` |
| Repository updates | `dev-be` |
| Unit tests | `dev-be` |

**Note**: No frontend work required for this feature (display is a future feature).

---

## Related Files

### Existing (to be modified)

- `app/Domain/Competition/Entities/Round.php`
- `app/Application/Competition/Services/RoundApplicationService.php`
- `app/Infrastructure/Persistence/Eloquent/Models/RoundEloquent.php`
- `app/Infrastructure/Persistence/Eloquent/Repositories/RoundRepositoryEloquent.php`

### New (to be created)

- `database/migrations/YYYY_MM_DD_HHMMSS_add_team_championship_results_to_rounds_table.php`
- `tests/Unit/Domain/Competition/TeamChampionshipCalculationTest.php` (or similar)
