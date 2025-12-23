# Round Tiebreaker Rules - Feature Overview

## Problem Statement

When multiple drivers finish a round with the same total race points, the current system determines ordering based on driver name. This leads to incorrect standings.

**Example scenario:**
| Driver   | Quali Pos | R1 pts | R2 pts | R3 pts | Total | Current Behavior |
|----------|-----------|--------|--------|--------|-------|------------------|
| Driver 3 | 7         | 3      | 10     | 1      | 14    | Places higher (alphabetically) |
| Driver 4 | 6         | 2      | 1      | 11     | 14    | Places lower (alphabetically) |

Both drivers have 14 points, but Driver 3 is ranked higher simply due to alphabetical ordering - not racing merit.

## Solution

Implement a configurable **Round Tiebreaker Rules** system at the season level that allows leagues to define how tied drivers should be ordered.

### Key Features

1. **Season-level toggle**: `round_totals_tiebreaker_rules_enabled` (boolean)
2. **Configurable rule ordering**: Drag-and-drop interface to prioritize rules
3. **Default rules copied on season creation**: Each new season gets the default rule set
4. **Human-readable explanations**: Record why a driver placed higher

## Behavior Modes

> **Key Clarification**: Tie-handling (shared positions, identical points, position skipping) **ONLY applies when tiebreaker is DISABLED**. When tiebreaker is enabled, rules determine a winner and normal position assignment occurs.

### Mode 1: Tiebreaker Disabled (Default)

When `round_totals_tiebreaker_rules_enabled = false`:
- Tied drivers receive the **SAME position** (both shown as "3rd")
- Tied drivers receive the **SAME round points** (not split/averaged)
- Points assigned based on the highest position in the tie group
- The next driver after a tie group **skips positions** accordingly
- **NO implicit tiebreakers** - time-based or best-result sorting is NOT applied

**Example:**
| Position | Driver   | Race Pts | Round Points | Notes |
|----------|----------|----------|--------------|-------|
| 1st      | Driver 2 | 20       | 25           | |
| 2nd      | Driver 1 | 16       | 20           | |
| **3rd**  | Driver 3 | 14       | **16**       | Tied - both get 3rd place points |
| **3rd**  | Driver 4 | 14       | **16**       | Tied - both get 3rd place points |
| 5th      | Driver 5 | 8        | 11           | Skips 4th position |

**Important**:
- Both tied drivers receive identical 3rd place points (16 pts each)
- Points are NOT split or averaged (not 16+14)/2 = 15 each)
- The next driver (Driver 5) is placed 5th, not 4th
- Driver order within a tie group is arbitrary (no sorting by time or best result)

**Implementation Note**: This is a change from existing behavior. Currently, `sortDriversWithTieBreaking()` applies implicit tiebreakers (best race result, then time). When tiebreaker is disabled, these implicit tiebreakers must be skipped so drivers truly share positions.

### Mode 2: Tiebreaker Enabled

When `round_totals_tiebreaker_rules_enabled = true`:
- Apply tiebreaker rules sequentially until a **winner is determined**
- Winners get their actual position (3rd), losers get next position (4th)
- Record the reason in `round_totals_tiebreaker_rules_information`
- **Only if NO rule breaks the tie**: drivers share the position (same as Mode 1)

**Example with tiebreaker enabled:**
| Position | Driver   | Race Pts | Round Points | Notes |
|----------|----------|----------|--------------|-------|
| 1st      | Driver 2 | 20       | 25           | |
| 2nd      | Driver 1 | 16       | 20           | |
| **3rd**  | Driver 4 | 14       | **16**       | Won tiebreaker (better quali P6 vs P7) |
| **4th**  | Driver 3 | 14       | **14**       | Lost tiebreaker |
| 5th      | Driver 5 | 8        | 11           | |

## Available Tiebreaker Rules

### Rule 1: Highest Qualifying Position
- Compare qualifying race positions
- Driver with higher qualifying position wins the tiebreaker
- **Example**: Driver 4 (P6) beats Driver 3 (P7)

### Rule 2: Race 1 Best Result
- Compare finishing positions in Race 1
- Driver with higher Race 1 finish wins
- Falls back to name if no Race 1 exists

### Rule 3: Best Result from All Races (Countback)
- Compare best single race finish across all races
- **Qualifying races are EXCLUDED** - only main races count
- If tied, compare second-best, then third-best, etc.
- Most comprehensive tiebreaker

**Example countback:**
| Driver   | Best | 2nd Best | 3rd Best |
|----------|------|----------|----------|
| Driver 3 | P1   | P3       | P10      |
| Driver 4 | P1   | P2       | P11      |

Both have P1 as best result. Driver 4 wins due to P2 being better than P3.

**Note**: Only main race results are compared, not qualifying positions.

## Rule Application Process

1. Calculate round race totals for all drivers
2. Identify groups of drivers with identical totals
3. For each tied group:
   a. Apply first tiebreaker rule
   b. If resolved → update standings, record explanation
   c. If not resolved → apply next rule
   d. Continue until resolved or no rules remain
4. Update `round_totals_tiebreaker_rules_information` with human-readable explanation

## Information Tracking

The `rounds.round_totals_tiebreaker_rules_information` field stores explanations like:
- "Driver 4 had a higher qualifying position (P6) than Driver 3 (P7)"
- "Driver 3 placed higher using countback: both had P1 best finish, but Driver 3's second-best (P2) beat Driver 4's (P3)"

## Database Schema Changes

### New Tables

1. **`round_tiebreaker_rules`** - Master list of available rules
   - `id`, `name`, `slug` (unique)

2. **`season_round_tiebreaker_rules`** - Season-specific rule configuration
   - `id`, `season_id`, `round_tiebreaker_rule_id`, `order`

### Modified Tables

1. **`seasons`** - Add `round_totals_tiebreaker_rules_enabled` (boolean, default false)

2. **`rounds`** - Add `round_totals_tiebreaker_rules_information` (text, nullable)

## Configuration Rules

- **Tiebreaker can be enabled/disabled at any time** during the season lifecycle
- **Rule ordering can be changed at any time** - not restricted to setup status
- Changes apply to future round completions only (already-completed rounds retain their calculated results)
- When a season is created with tiebreaker enabled, default rules are copied automatically

## Round Completion Flow

The tiebreaker logic is triggered when a round is marked as "completed":

**Frontend Trigger**: `resources/app/js/components/round/RoundsPanel.vue`
- `handleToggleCompletion()` function (line ~610) calls `roundStore.completeRound(round.id)`

**Store → Service → API Flow**:
1. `roundStore.completeRound()` → `roundService.completeRound(roundId)`
2. PUT request to `/api/rounds/{roundId}/complete`
3. `RoundController::complete()` → `RoundApplicationService::completeRound()`

**Backend Calculation Point**: `app/Application/Competition/Services/RoundApplicationService.php`
- `completeRound()` method orchestrates the completion process
- `calculateAndStoreRoundResults()` method (line ~481) is where round standings are calculated
- `sortDriversWithTieBreaking()` method (line ~932) contains existing tie-breaking logic
- **Tiebreaker logic should be injected here** to apply configurable rules

**Existing Tie-Breaking Logic** (in `sortDriversWithTieBreaking`):
1. DNF/DNS drivers placed at bottom
2. Sort by total race points (descending)
3. Time-based sorting when all have 0 points
4. Best single race result as secondary tiebreaker
5. Final tiebreaker by time comparison

## Implementation Scope

### Backend (Laravel/PHP)
- Database migrations
- Domain entities and value objects
- Repository implementations
- Application service methods
- Tiebreaker calculation logic
- API endpoints

### Frontend (Vue.js)
- Season form toggle for enabling tiebreaker
- Drag-and-drop rule ordering interface
- Display tiebreaker information on round results

## Agents to Use

| Component | Agent | Scope |
|-----------|-------|-------|
| Backend | `dev-be` | Database, domain layer, services, API |
| User Dashboard | `dev-fe-app` | SeasonFormDrawer modifications |
| Public Dashboard | `dev-fe-public` | Display tiebreaker info (if applicable) |
| Admin Dashboard | `dev-fe-admin` | Admin-level management (if applicable) |

## Files to Modify

### Backend
- `app/Domain/Competition/Entities/Season.php`
- `app/Domain/Competition/Entities/Round.php`
- `app/Infrastructure/Persistence/Eloquent/Models/SeasonEloquent.php`
- `app/Infrastructure/Persistence/Eloquent/Models/Round.php`
- `app/Application/Competition/Services/RoundApplicationService.php`
- `app/Application/Competition/Services/SeasonApplicationService.php`
- New: Tiebreaker domain entities and services
- New: Database migrations

### Frontend
- `resources/app/js/components/season/modals/SeasonFormDrawer.vue`
- `resources/app/js/types/season.ts`
- `resources/app/js/stores/seasonStore.ts`
- New: Tiebreaker rule ordering component
