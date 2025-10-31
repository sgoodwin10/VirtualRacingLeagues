# Teams Creation Feature - Summary

## Overview
Add team management functionality to seasons, allowing drivers to be organized into teams for championship tracking. This is an optional, season-specific feature that only activates when `team_championship_enabled` is true.

## Core Requirements

### Business Rules
1. **Season-specific**: Teams belong to a single season and don't span across seasons
2. **Optional membership**: Drivers can choose to join a team or remain as "Privateer" (no team)
3. **Conditional feature**: Feature only visible/active when `season.team_championship_enabled` is true
4. **No soft delete**: Teams are permanently deleted (hard delete)
5. **Cascade behavior**: When a team is deleted, all drivers become "Privateer" automatically

### Data Model
**Team Entity:**
- `id` (primary key)
- `season_id` (foreign key to seasons table)
- `name` (string, 2-60 characters, not unique)
- `logo_url` (nullable string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**SeasonDriver Update:**
- Add `team_id` (nullable foreign key to teams table)
- NULL means driver is "Privateer"

### Validation Rules
- Team name: Required, 2-60 characters
- Team logo: Optional, standard image validation (jpg, png, svg, max 2MB)
- Team name doesn't need to be unique across season (can have duplicate names)

## User Interface Changes

### 1. Season Detail Page - Drivers Tab
**Layout Change:**
- Split into 75% (left) / 25% (right) columns
- Left: Season Drivers Table (existing)
- Right: Teams Management Panel (new)

**Teams Panel (25% width):**
- **When disabled**: Display message "Teams not enabled for this season"
- **When enabled**: Display teams management interface
  - Header with "Add Team" button
  - DataTable showing all teams
  - Columns: Team Name (with logo), Actions (Edit/Delete)
  - Empty state: "No teams created yet"

### 2. Season Drivers Table
**Team Column Behavior:**
- **When disabled**: Hide team column entirely
- **When enabled**: Show team column with inline editor
  - Display current team name (or "Privateer" if none)
  - Click to activate inline dropdown selector
  - Dropdown options:
    - "Privateer" (special option for no team)
    - List of all season teams
  - Auto-save on selection change

### 3. Team Form Modal
**Add/Edit Team:**
- Modal title: "Add Team" / "Edit Team"
- Fields:
  1. Team Name (required, 2-60 chars)
  2. Team Logo (optional, image upload with preview)
- Actions:
  - Cancel button
  - Save button (disabled if invalid)
- Use `BaseModal.vue` component
- Similar layout to `SeasonFormDrawer.vue` for logo handling

### 4. Delete Team Confirmation
**Confirmation Dialog:**
- Message: "Delete [Team Name]?"
- Show affected drivers count: "X drivers will become Privateer"
- Warning: "This action cannot be undone"
- Actions:
  - Cancel button
  - Delete button (danger style)

## API Endpoints

### Teams Management
```
GET    /api/seasons/{seasonId}/teams           - List all teams
POST   /api/seasons/{seasonId}/teams           - Create team
PUT    /api/seasons/{seasonId}/teams/{teamId}  - Update team
DELETE /api/seasons/{seasonId}/teams/{teamId}  - Delete team
```

### Driver Team Assignment
```
PUT    /api/seasons/{seasonId}/drivers/{driverId}/team  - Assign/change driver's team
```

**Request body for team assignment:**
```json
{
  "team_id": 123  // or null for "Privateer"
}
```

## Technical Implementation

### Backend (Laravel DDD)
**Domain Layer:**
- `Domain/Team/Entities/Team.php`
- `Domain/Team/ValueObjects/TeamName.php`
- `Domain/Team/Events/TeamCreated.php`, `TeamUpdated.php`, `TeamDeleted.php`
- `Domain/Team/Exceptions/TeamNotFoundException.php`, `InvalidTeamNameException.php`
- `Domain/Team/Repositories/TeamRepositoryInterface.php`

**Application Layer:**
- `Application/Team/Services/TeamApplicationService.php`
- `Application/Team/DTOs/TeamData.php`, `CreateTeamData.php`, `UpdateTeamData.php`

**Infrastructure Layer:**
- `Infrastructure/Persistence/Eloquent/Models/Team.php`
- `Infrastructure/Persistence/Eloquent/Repositories/EloquentTeamRepository.php`
- Migration: `create_teams_table.php`
- Migration: `add_team_id_to_season_drivers_table.php`

**Interface Layer:**
- `Http/Controllers/User/TeamController.php`
- `Http/Requests/User/CreateTeamRequest.php`, `UpdateTeamRequest.php`
- `Http/Requests/User/AssignDriverTeamRequest.php`

### Frontend (Vue 3 + TypeScript)
**Types:**
- `resources/app/js/types/team.ts`

**API Service:**
- `resources/app/js/services/teamService.ts`

**Pinia Store:**
- `resources/app/js/stores/teamStore.ts`

**Components:**
- `resources/app/js/components/season/teams/TeamFormModal.vue` (Add/Edit)
- `resources/app/js/components/season/teams/TeamsPanel.vue` (25% sidebar)
- Update: `resources/app/js/components/season/SeasonDriversTable.vue` (inline team editor)

**Views:**
- Update: `resources/app/js/views/SeasonDetail.vue` (new 75/25 layout)

**Tests:**
- `resources/app/js/components/season/teams/__tests__/TeamFormModal.test.ts`
- `resources/app/js/components/season/teams/__tests__/TeamsPanel.test.ts`
- `resources/app/js/stores/__tests__/teamStore.test.ts`

## MVP Scope
This is an MVP implementation focused on core functionality:
- ✅ Basic team CRUD operations
- ✅ Logo upload/display
- ✅ Driver team assignment
- ✅ Inline editing in drivers table
- ❌ Team statistics/standings (future)
- ❌ Team colors/branding (future)
- ❌ Team members management view (future)
- ❌ Bulk driver assignment (future)

## Success Criteria
1. ✅ Users can create/edit/delete teams when championship is enabled
2. ✅ Drivers can be assigned to teams via inline dropdown
3. ✅ Team column hidden when championship disabled
4. ✅ Deleting team removes all driver assignments
5. ✅ Team logos display correctly throughout UI
6. ✅ All operations work without page reload
7. ✅ Proper validation and error handling
8. ✅ Comprehensive test coverage

## References
- Season Form Drawer: `resources/app/js/components/season/modals/SeasonFormDrawer.vue`
- Base Modal: `resources/app/js/components/common/modals/BaseModal.vue`
- Season Drivers Table: `resources/app/js/components/season/SeasonDriversTable.vue`
- Admin Backend Guide: `.claude/guides/backend/admin-backend-guide.md` (DDD patterns)
- Admin Frontend Guide: `.claude/guides/frontend/admin-dashboard-development-guide.md` (component patterns)
