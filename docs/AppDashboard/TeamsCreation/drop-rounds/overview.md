# Teams Drop Rounds Feature - Overview

## Feature Summary

This feature extends the Season configuration to add two new team championship settings:

1. **Teams Drivers for Calculation**: Configure how many driver results count towards a team's round score
2. **Teams Drop Rounds**: Allow ignoring lowest scoring rounds when calculating team standings

These settings only appear when "Team Championship" is enabled for a season.

---

## Business Requirements

### 1. Teams Drivers for Calculation

When calculating a team's score for a round, the league administrator can choose how many drivers' points contribute:

| Setting | Description | Database Value |
|---------|-------------|----------------|
| All | All team drivers' points count | `NULL` |
| 1-16 | Only top N drivers' points count per round | Integer (1-16) |

**Example Use Case**:
- Team has 4 drivers in a round
- Setting is "2"
- Only the 2 highest-scoring drivers' points count for the team's round total

### 2. Teams Drop Rounds

Similar to driver drop rounds, but specifically for team standings:

| Setting | Description |
|---------|-------------|
| Disabled | All rounds count towards team championship |
| Enabled | Lowest N rounds excluded from team standings |

When enabled, an additional field appears to set the number of rounds to drop.

---

## Database Changes

### New Fields in `seasons` Table

Add after `team_championship_enabled`:

```sql
teams_drivers_for_calculation INT NULL     -- NULL means "All", 1-16 for specific count
teams_drop_rounds             BOOLEAN      -- Enable/disable team drop rounds (default: false)
teams_total_drop_rounds       INT NULL     -- Number of rounds to drop for teams (nullable)
```

### Migration Strategy

- All existing seasons will default to:
  - `teams_drivers_for_calculation` = NULL (All drivers)
  - `teams_drop_rounds` = false
  - `teams_total_drop_rounds` = NULL

---

## UI/UX Specification

### SeasonFormDrawer.vue Updates

When "Enable Team Championship" checkbox is checked, show two new fields:

#### Field 1: Drivers for Team Calculation
- **Type**: Select/Dropdown
- **Options**: "All", "1", "2", "3", ... "16"
- **Default**: "All"
- **Label**: "Drivers for Team Calculation"
- **Helper**: "How many drivers' points count towards team round scores"

#### Field 2: Enable Teams Drop Rounds
- **Type**: Checkbox toggle (matches existing pattern)
- **Default**: Unchecked
- **Label**: "Enable Teams Drop Rounds"
- **Helper**: "Exclude lowest scoring rounds from team standings"

#### Field 3: Total Teams Drop Rounds (conditional)
- **Type**: InputNumber with buttons
- **Visibility**: Only when "Enable Teams Drop Rounds" is checked
- **Range**: 0-10 (or match driver drop rounds limit)
- **Default**: 0
- **Label**: "Total Teams Drop Rounds"
- **Helper**: "Number of lowest scoring rounds to exclude"

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  Right Column (Toggles & Settings)                      │
│                                                         │
│  ☑ Enable Race Divisions                                │
│  ☑ Enable Team Championship                    ← Toggle │
│                                                         │
│  ┌─ Team Championship Settings ────────────────────┐    │
│  │                                                 │    │
│  │  Drivers for Team Calculation                   │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │ All                                   ▼  │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │  How many drivers' points count towards team    │    │
│  │  round scores                                   │    │
│  │                                                 │    │
│  │  ☐ Enable Teams Drop Rounds                     │    │
│  │    Exclude lowest scoring rounds from team      │    │
│  │    standings                                    │    │
│  │                                                 │    │
│  │  [If checked]                                   │    │
│  │  Total Teams Drop Rounds                        │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │  [-]        0        [+]                │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ☑ Require Race Times                                   │
│  ☐ Enable Drop Round (for drivers)                      │
└─────────────────────────────────────────────────────────┘
```

---

## Affected Components

### Backend (Laravel)
1. **Migration**: New migration for 3 fields
2. **Domain Entity**: `Season.php` - Add properties and methods
3. **DTOs**: `CreateSeasonData.php`, `UpdateSeasonData.php`, `SeasonData.php`
4. **Eloquent Model**: `SeasonEloquent.php` - Add fillable fields
5. **Repository**: `EloquentSeasonRepository.php` - Map new fields
6. **Application Service**: `SeasonApplicationService.php` - Handle new settings

### Frontend (Vue/TypeScript)
1. **Types**: `season.ts` - Add new fields to interfaces
2. **Component**: `SeasonFormDrawer.vue` - Add new form fields
3. **Validation**: `useSeasonValidation.ts` - Add validation rules
4. **Store/Service**: If needed, update to handle new fields

### Testing
1. **Backend**: Unit tests for domain entity, feature tests for API
2. **Frontend**: Vitest component tests, E2E tests for form

---

## Implementation Agents

| Area | Agent | Description |
|------|-------|-------------|
| Backend | `dev-be` | Migration, Entity, DTOs, Service, Repository |
| Frontend (App) | `dev-fe-app` | Form component, types, validation |

**Not Affected**:
- `dev-fe-public` - Public site doesn't manage seasons
- `dev-fe-admin` - Admin doesn't manage season creation

---

## Implementation Order

1. **Backend First**
   - Create migration
   - Update domain entity
   - Update DTOs
   - Update Eloquent model and repository
   - Update application service
   - Add tests

2. **Frontend Second**
   - Update TypeScript types
   - Update SeasonFormDrawer component
   - Update validation composable
   - Add component tests

3. **Integration Testing**
   - Test create/edit season flow
   - Verify data persistence
   - Test conditional field visibility

---

## Acceptance Criteria

1. When "Team Championship" is disabled, new fields are hidden
2. When enabled, "Drivers for Team Calculation" dropdown appears with options All, 1-16
3. "All" option saves NULL to database
4. Numeric options save the integer value
5. "Teams Drop Rounds" toggle shows/hides the total input
6. Existing seasons default to All drivers and no drop rounds
7. All fields persist correctly on create and update
8. Validation prevents invalid combinations (e.g., drop rounds enabled with 0 total)
