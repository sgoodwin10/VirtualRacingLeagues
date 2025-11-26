# Race Results Feature - Overview

## Purpose

Allow users to upload or manually enter results for races and qualifiers. These results will be used to calculate round standings, championship points, and determine fastest lap/pole position holders.

---

## Feature Scope (MVP)

### In Scope
- Create new `race_results` database table
- Modal UI for entering results (CSV paste + manual entry)
- Support for divisions (when `raceDivisionsEnabled` on season)
- Auto-matching drivers from CSV data
- Real-time time calculations (race_time from race_time_difference)
- Auto-sorting by race time (or qualifying time for qualifiers)
- Penalty time additions with automatic re-sorting
- Save results with `pending` status

### Out of Scope (Future Phase)
- Changing result status to `confirmed`
- Calculating final points from results
- Determining pole position and fastest lap awards
- Result history/audit logging

---

## User Workflow

1. Navigate to a Race Event (Race or Qualifier within a Round)
2. Click "Enter Results" button on the race
3. Modal opens with two sections:
   - **Top**: CSV paste textarea
   - **Bottom**: Division tabs (or single list if no divisions) with driver result entry
4. Option A: Paste CSV data → auto-populates matching driver rows
5. Option B: Manually enter times for each driver
6. Save results to database

---

## Key Business Rules

### Time Handling
- Time format: `hh:mm:ss.ms` (milliseconds can be 1-3 digits, variable length)
- If CSV provides both `race_time` and `race_time_difference`, use `race_time` only
- `race_time_difference` is time off the fastest driver in that division
- When only `race_time_difference` is provided, calculate actual `race_time`:
  ```
  race_time = fastest_driver_race_time + race_time_difference
  ```
- This calculation must be real-time as users edit the fastest driver's time

### Penalties
- Penalty time is added to `race_time` for sorting purposes
- When a penalty is added/changed, the table automatically re-sorts
- Penalty does not change the stored `race_time`, only affects final position

### Qualifying Mode
- When the race is a qualifier (`is_qualifier = true`):
  - Hide `race_time` and `race_time_difference` columns
  - Only show `fastest_lap_time` column
  - Sort by `fastest_lap_time` (ascending)

### Race Mode
- Show all columns: `driver`, `race_time`, `race_time_difference`, `fastest_lap_time`, `penalties`
- Sort by `race_time + penalties` (ascending)

### Division Handling
- If `season.raceDivisionsEnabled = true`:
  - Show tabs/accordion for each division
  - Each division shows only its assigned drivers
  - Calculations (race_time_difference) are per-division
- If `season.raceDivisionsEnabled = false`:
  - Show a single flat list of all season drivers

### Driver Selection
- Each driver can only appear once in the results
- Dropdown should disable/remove already-selected drivers
- Validate no duplicate drivers before saving

### Position Storage
- Store finishing position in the database (allows manual override if needed)
- Position is calculated from sorted times but stored for persistence

---

## CSV Format

### Fields
```csv
driver,race_time,race_time_difference,fastest_lap_time
```

### Rules
- First row is header (required)
- `driver` field used for matching (by name)
- `race_time` and `race_time_difference` - if both provided, use `race_time`
- Times in format: `hh:mm:ss.ms` or `+hh:mm:ss.ms` for differences

### Example - Race
```csv
driver,race_time,race_time_difference,fastest_lap_time
John Smith,01:23:45.678,,01:32.456
Jane Doe,+00:00:02.104,,01:33.012
Bob Wilson,01:23:50.890,,01:32.890
```

### Example - Qualifying
```csv
driver,fastest_lap_time
John Smith,01:32.456
Jane Doe,01:33.012
Bob Wilson,01:32.890
```

---

## Data Model

### New Table: `race_results`

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| race_id | bigint FK | Reference to races table |
| driver_id | bigint FK | Reference to season_drivers table |
| position | int | Finishing position (stored, calculated from times) |
| race_time | time(3) | Race completion time (hh:mm:ss.ms) |
| race_time_difference | time(3) | Time behind leader |
| fastest_lap | time(3) | Fastest lap time |
| penalties | time(3) | Total penalty time |
| has_fastest_lap | boolean | Driver has race fastest lap |
| has_pole | boolean | Driver has pole position |
| status | enum | 'pending', 'confirmed' |
| race_points | int | Points earned (calculated later) |
| created_at | timestamp | Record creation time |
| updated_at | timestamp | Last update time |

### Relationships
- `race_results` belongs to `races` (via `race_id`)
- `race_results` belongs to `season_drivers` (via `driver_id`)
- A race can have many results
- A driver can have one result per race

---

## UI Components

### Modal Structure
```
+--------------------------------------------------+
|  [Race Name] Results                         [X] |
+--------------------------------------------------+
|  +--------------------------------------------+  |
|  | CSV Import                                 |  |
|  | [Paste CSV data here...]                   |  |
|  | [Parse CSV] button                         |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | [Division 1] [Division 2] [Division 3]    |  |  <- Tabs (if divisions)
|  +--------------------------------------------+  |
|  | # | Driver     | Time    | Diff  | FL | Pen |  |
|  |---|------------|---------|-------|----|----|  |
|  | 1 | [Select v] | [mask]  | [mask]|[ms]|[ms]|  |
|  | 2 | [Select v] | [mask]  | [mask]|[ms]|[ms]|  |
|  | 3 | [Select v] | [mask]  | [mask]|[ms]|[ms]|  |
|  +--------------------------------------------+  |
|                                                  |
|  [Cancel]                           [Save]       |
+--------------------------------------------------+
```

### Key PrimeVue Components
- `Dialog` or drawer (BaseModal) - Modal container
- `Textarea` - CSV input
- `TabView` / `Accordion` - Division switching
- `DataTable` - Results grid (if needed, or custom table)
- `Select` - Driver dropdown
- `InputMask` - Time inputs with mask `99:99:99.999` (allowing variable ms)
- `Button` - Actions

---

## Implementation Agents

| Layer | Agent | Responsibility |
|-------|-------|----------------|
| Backend | `dev-be` | Domain entities, DTOs, repository, controller, migrations |
| Frontend | `dev-fe-app` | Vue components, Pinia store, services, types |

---

## Dependencies

### Backend
- Existing `Race` entity and model
- Existing `SeasonDriver` entity and model
- Existing `Division` entity and model

### Frontend
- Existing race/round views and components
- Existing season store with drivers/divisions
- PrimeVue InputMask, Select, Dialog components

---

## File Structure (Planned)

### Backend
```
app/
├── Domain/Competition/
│   ├── Entities/RaceResult.php
│   ├── ValueObjects/
│   │   ├── RaceTime.php
│   │   └── RaceResultStatus.php
│   ├── Events/
│   │   ├── RaceResultCreated.php
│   │   └── RaceResultUpdated.php
│   ├── Exceptions/
│   │   └── RaceResultException.php
│   └── Repositories/RaceResultRepositoryInterface.php
├── Application/Competition/
│   ├── Services/RaceResultApplicationService.php
│   └── DTOs/
│       ├── CreateRaceResultData.php
│       ├── UpdateRaceResultData.php
│       └── RaceResultData.php
├── Infrastructure/Persistence/Eloquent/
│   ├── Models/RaceResult.php
│   └── Repositories/EloquentRaceResultRepository.php
└── Http/Controllers/User/RaceResultController.php

database/migrations/
└── 2025_xx_xx_create_race_results_table.php
```

### Frontend
```
resources/app/js/
├── types/raceResult.ts
├── services/raceResultService.ts
├── stores/raceResultStore.ts
├── components/result/
│   ├── RaceResultModal.vue
│   ├── ResultCsvImport.vue
│   ├── ResultDivisionTabs.vue
│   └── ResultEntryTable.vue
└── composables/useRaceTimeCalculation.ts
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/races/{raceId}/results` | Get all results for a race |
| POST | `/races/{raceId}/results` | Create/update results (bulk) |
| DELETE | `/races/{raceId}/results` | Delete all results for a race |

Note: Using bulk operations since results are typically entered all at once.

---

## Testing Strategy

### Backend
- Unit tests for `RaceTime` value object
- Unit tests for `RaceResult` entity business logic
- Feature tests for API endpoints

### Frontend
- Unit tests for time calculation composable
- Component tests for ResultEntryTable
- Integration tests for CSV parsing logic


# Plans
Backend `docs/AppDashboard/ResultsCreation/01_backend_plan.md`
Front End `docs/AppDashboard/ResultsCreation/02_frontend_plan.md`