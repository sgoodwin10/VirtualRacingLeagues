# Divisions Feature - Summary

## Overview
Add division management functionality to seasons, allowing drivers to be organized into divisions for race organization and standings tracking. This is an optional, season-specific feature that only activates when `race_divisions_enabled` is true.

## Core Requirements

### Business Rules
1. **Season-specific**: Divisions belong to a single season and don't span across seasons
2. **Optional membership**: Drivers can choose to join a division or remain without one
3. **Conditional feature**: Feature only visible/active when `season.race_divisions_enabled` is true
4. **No soft delete**: Divisions are permanently deleted (hard delete)
5. **Cascade behavior**: When a division is deleted, all drivers lose their division assignment automatically (division_id set to NULL)
6. **Independent from Teams**: Divisions and Teams are independent features - a driver can belong to both a team AND a division simultaneously

### Data Model
**Division Entity:**
- `id` (primary key)
- `season_id` (foreign key to seasons table)
- `name` (string, 2-60 characters, not unique)
- `description` (text, 10-500 characters, **required**)
- `logo_url` (nullable string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**SeasonDriver Update:**
- Add `division_id` (nullable foreign key to divisions table)
- NULL means driver has no division

### Validation Rules
- Division name: Required, 2-60 characters
- Division description: **Required**, 10-500 characters
- Division logo: Optional, standard image validation (jpg, png, svg, max 2MB)
- Division name doesn't need to be unique across season (can have duplicate names)

## User Interface Changes

### 1. Season Detail Page - Drivers Tab
**Layout Change:**
- Split into 75% (left) / 25% (right) columns
- Left: Season Drivers Table (existing)
- Right: Divisions Management Panel (new)

**Divisions Panel (25% width):**
- **When disabled**: Display message "Divisions not enabled for this season"
- **When enabled**: Display divisions management interface
  - Header with "Add Division" button
  - DataTable showing all divisions
  - Columns: Division Name (with logo + description preview), Actions (Edit/Delete)
  - Empty state: "No divisions created yet"

### 2. Season Drivers Table
**Division Column Behavior:**
- **When disabled**: Hide division column entirely
- **When enabled**: Show division column with inline editor
  - Display current division name (or "No Division" if none)
  - Click to activate inline dropdown selector
  - Dropdown options:
    - "No Division" (special option for no division)
    - List of all season divisions
  - Auto-save on selection change

**Column Order (when both Teams and Divisions enabled):**
- Name, Discord ID, Platform Fields, **Team**, **Division**, Actions

### 3. Division Form Modal
**Add/Edit Division:**
- Modal title: "Add Division" / "Edit Division"
- Fields:
  1. Division Name (required, 2-60 chars)
  2. **Description (required, 10-500 chars, textarea)**
  3. Division Logo (optional, image upload with preview)
- Actions:
  - Cancel button
  - Save button (disabled if invalid)
- Use `BaseModal.vue` component
- Similar layout to `SeasonFormDrawer.vue` for logo handling
- Description shown as textarea with character counter

### 4. Delete Division Confirmation
**Confirmation Dialog:**
- Message: "Delete [Division Name]?"
- Show affected drivers count: "X drivers will have no division"
- Warning: "This action cannot be undone"
- Actions:
  - Cancel button
  - Delete button (danger style)

### 5. Season Header Stats
**Additional Stat (when enabled):**
- Show "Divisions: X" chip/badge in season header
- Display total_divisions count in stats section

## API Endpoints

### Divisions Management
```
GET    /api/seasons/{seasonId}/divisions              - List all divisions
POST   /api/seasons/{seasonId}/divisions              - Create division
PUT    /api/seasons/{seasonId}/divisions/{divisionId} - Update division
DELETE /api/seasons/{seasonId}/divisions/{divisionId} - Delete division
GET    /api/seasons/{seasonId}/divisions/{divisionId}/driver-count - Get driver count
```

### Driver Division Assignment
```
PUT    /api/seasons/{seasonId}/drivers/{driverId}/division  - Assign/change driver's division
```

**Request body for division assignment:**
```json
{
  "division_id": 123  // or null for "No Division"
}
```

**Request body for create/update division:**
```json
{
  "name": "Pro Division",
  "description": "Professional tier racing division for experienced drivers",
  "logo": "<file>"  // optional
}
```

## Technical Implementation

### Backend (Laravel DDD)
**Domain Layer:**
- `Domain/Division/Entities/Division.php`
- `Domain/Division/ValueObjects/DivisionName.php`
- `Domain/Division/ValueObjects/DivisionDescription.php` *(new - validates 10-500 chars)*
- `Domain/Division/Events/DivisionCreated.php`, `DivisionUpdated.php`, `DivisionDeleted.php`
- `Domain/Division/Exceptions/DivisionNotFoundException.php`, `InvalidDivisionNameException.php`, `InvalidDivisionDescriptionException.php`
- `Domain/Division/Repositories/DivisionRepositoryInterface.php`

**Application Layer:**
- `Application/Division/Services/DivisionApplicationService.php`
- `Application/Division/DTOs/DivisionData.php`, `CreateDivisionData.php`, `UpdateDivisionData.php`

**Infrastructure Layer:**
- `Infrastructure/Persistence/Eloquent/Models/Division.php`
- `Infrastructure/Persistence/Eloquent/Repositories/EloquentDivisionRepository.php`
- Migration: `create_divisions_table.php`
- Migration: `add_division_id_to_season_drivers_table.php`

**Interface Layer:**
- `Http/Controllers/User/DivisionController.php`
- `Http/Requests/User/CreateDivisionRequest.php`, `UpdateDivisionRequest.php`
- `Http/Requests/User/AssignDriverDivisionRequest.php`

### Frontend (Vue 3 + TypeScript)
**Types:**
- `resources/app/js/types/division.ts`

**API Service:**
- `resources/app/js/services/divisionService.ts`

**Pinia Store:**
- `resources/app/js/stores/divisionStore.ts`

**Components:**
- `resources/app/js/components/season/divisions/DivisionFormModal.vue` (Add/Edit with description field)
- `resources/app/js/components/season/divisions/DivisionsPanel.vue` (25% sidebar)
- Update: `resources/app/js/components/season/SeasonDriversTable.vue` (inline division editor)
- Update: `resources/app/js/components/season/SeasonHeader.vue` (add divisions stat)

**Views:**
- Update: `resources/app/js/views/SeasonDetail.vue` (new 75/25 layout)

**Tests:**
- `resources/app/js/components/season/divisions/__tests__/DivisionFormModal.test.ts`
- `resources/app/js/components/season/divisions/__tests__/DivisionsPanel.test.ts`
- `resources/app/js/stores/__tests__/divisionStore.test.ts`

## Key Differences from Teams

1. **Description Field (REQUIRED)**:
   - Teams: No description field
   - Divisions: `description` field is **required** (10-500 characters)
   - Validated in backend via `DivisionDescription` value object
   - Shown as textarea in form modal with character counter
   - Preview shown in divisions table (truncated with `line-clamp-1`)

2. **Season Setting**:
   - Teams: Controlled by `team_championship_enabled` flag
   - Divisions: Controlled by `race_divisions_enabled` flag

3. **Independence**:
   - Teams and Divisions can be enabled independently or together
   - When both enabled, drivers can belong to both a team AND a division
   - Columns appear side-by-side in drivers table

4. **Use Case**:
   - Teams: For championship standings and team scoring
   - Divisions: For race organization (e.g., skill-based divisions, regional splits)

## MVP Scope
This is an MVP implementation focused on core functionality:
- ✅ Basic division CRUD operations
- ✅ Logo upload/display
- ✅ **Required description field** (10-500 chars)
- ✅ Driver division assignment
- ✅ Inline editing in drivers table
- ❌ Division statistics/standings (future)
- ❌ Division colors/branding (future)
- ❌ Division members management view (future)
- ❌ Bulk driver assignment (future)
- ❌ Multi-division support per driver (future - currently 1:1)

## Success Criteria
1. ✅ Users can create/edit/delete divisions when feature is enabled
2. ✅ Divisions require name AND description (10-500 chars)
3. ✅ Drivers can be assigned to divisions via inline dropdown
4. ✅ Division column hidden when feature disabled
5. ✅ Deleting division removes all driver assignments (sets to NULL)
6. ✅ Division logos display correctly throughout UI
7. ✅ Divisions work independently from teams
8. ✅ Drivers can belong to both team and division simultaneously
9. ✅ All operations work without page reload
10. ✅ Proper validation and error handling
11. ✅ Comprehensive test coverage

## Architectural Decisions

### Q1: Should divisions be tied to a season setting?
**Answer:** YES - controlled by existing `race_divisions_enabled` flag in seasons table

### Q2: Can drivers belong to divisions directly?
**Answer:** YES - via `division_id` in `season_drivers` table

### Q3: Relationship between teams and divisions?
**Answer:** INDEPENDENT - seasons can have:
- Only teams
- Only divisions
- Both teams AND divisions
- Neither

### Q4: Cascade behavior on delete?
**Answer:** SET NULL - when division deleted, `division_id` in `season_drivers` becomes NULL (drivers remain in season)

## References
- Teams Creation Docs: `docs/UserDashboard/TeamsCreation/`
- Backend Plan: `docs/UserDashboard/DivisionCreation/backend-plan.md`
- Frontend Plan: `docs/UserDashboard/DivisionCreation/frontend-plan.md`
- Season Form Drawer: `resources/app/js/components/season/modals/SeasonFormDrawer.vue`
- Base Modal: `resources/app/js/components/common/modals/BaseModal.vue`
- Season Drivers Table: `resources/app/js/components/season/SeasonDriversTable.vue`
- Admin Backend Guide: `.claude/guides/backend/admin-backend-guide.md`
- Admin Frontend Guide: `.claude/guides/frontend/admin-dashboard-development-guide.md`

## Implementation Order

1. **Backend Implementation** (use `dev-be` agent):
   - Database migrations
   - Domain layer (entities, value objects, events, exceptions)
   - Application layer (services, DTOs)
   - Infrastructure layer (Eloquent models, repositories)
   - Interface layer (controllers, requests, routes)
   - Tests

2. **Frontend Implementation** (use `dev-fe-user` agent):
   - TypeScript types
   - API service
   - Pinia store
   - Components (form modal, panel)
   - View updates
   - Tests

3. **Integration Testing**:
   - Manual testing of all CRUD operations
   - Test conditional rendering based on `race_divisions_enabled`
   - Test both teams + divisions enabled scenario
   - Edge case testing

## Notes

1. **File Storage**: Division logos stored in `storage/app/public/divisions/season-{id}/`
2. **Hard Delete**: Divisions are permanently deleted (no soft delete)
3. **Cascade Behavior**: Database handles setting division_id to null on division deletion
4. **Authorization**: All routes protected by `auth:web` and `user.authenticate` middleware
5. **Validation**:
   - DivisionName value object enforces 2-60 character limit
   - **DivisionDescription value object enforces 10-500 character limit (REQUIRED)**
6. **Image Validation**: Max 2MB, JPG/PNG/SVG only
7. **Season Control**: Feature controlled by `race_divisions_enabled` flag
8. **Dual Features**: Can coexist with Teams feature - both can be enabled simultaneously
