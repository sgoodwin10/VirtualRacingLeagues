# Season Creation MVP - Project Summary

**Version:** 2.0
**Date:** October 23, 2025
**Status:** ✅ Requirements Confirmed - Ready for Implementation

---

## Overview

This document provides a high-level summary of the Season Creation MVP feature for the Virtual Racing Leagues application. A season represents a time-bound championship period within a competition, containing drivers, and eventually divisions, teams, and rounds.

---

## Critical Architectural Change

**IMPORTANT:** The original specification planned for drivers to be created/imported directly at the season level. However, **drivers are already implemented at the league level**. This changes the season-driver relationship fundamentally:

### Original Plan (Deprecated)
```
Season
  └─ Drivers (created directly in season)
```

### New Architecture (Implemented)
```
League
  └─ League Drivers (existing)
      └─ Competition
          └─ Season
              └─ Season Drivers (references to league drivers)
```

**Key Implications:**
- Drivers are NOT created at the season level
- Seasons **assign** existing league drivers to the season
- The `season_drivers` table is a pivot/assignment table, NOT a driver repository
- All driver CRUD operations remain at the league level
- Seasons can only select from drivers that belong to their competition's league

---

## MVP Scope

### In Scope

#### Season Management
- ✅ Create season (basic info, branding, settings)
- ✅ Update season details
- ✅ View season information
- ✅ Delete season (soft delete)
- ✅ List seasons for a competition
- ✅ Archive/activate/complete season (status management)

#### Season-Driver Assignment
- ✅ View available league drivers
- ✅ Add league drivers to season
- ✅ Remove drivers from season
- ✅ Set driver status (active, reserve, withdrawn)
- ✅ Add season-specific notes to drivers
- ✅ List drivers assigned to season

#### Season Attributes
- ✅ Basic information (name, car class, description, technical specs)
- ✅ Branding (logo, banner image)
- ✅ Unique slug generation
- ✅ Team championship toggle (enables team features in future)
- ✅ Status management (setup → active → completed → archived)

### Out of Scope (Future Features)

- ❌ Divisions (skill-based groupings)
- ❌ Teams (team championship)
- ❌ Rounds (race calendar)
- ❌ CSV import
- ❌ Bulk operations
- ❌ Season templates
- ❌ Driver statistics/standings (requires rounds/results)
- ❌ Auto-division assignment
- ❌ Drag and drop UI

---

## ✅ Confirmed Business Rules

All stakeholder questions have been answered. Here are the confirmed requirements:

### Season Lifecycle Management
- ✅ **Deletion with Drivers:** Seasons CAN be deleted even if they have drivers assigned (soft delete)
- ✅ **Archived Season Editing:** Archived seasons CANNOT be edited. Must be restored to `completed` status first
- ✅ **Deletion Cascade:** Season deletion (soft delete) cascades to `season_drivers` pivot table, but preserves league drivers

### Driver Assignment Rules
- ✅ **Driver Removal:** Drivers CAN be removed from a season at any time (for MVP, no results yet)
- ✅ **No Driver Limit:** NO maximum number of drivers per season
- ✅ **Reserve Promotion:** Reserve drivers CAN be promoted to active status at any time

### UI/UX Patterns
- ✅ **Season Creation:** Uses a **drawer** (slide-out), consistent with league/competition creation
- ✅ **Season Editing:** Uses the **same drawer** style as creation
- ✅ **Driver Assignment:** Uses a **separate drawer** (not inline on season detail page)
- ✅ **Create Button Placement:** "Create Season" button appears in multiple locations on Competition Detail page (header, empty state, tabs)

### Image Handling
- ✅ **Logo Inheritance:** Season logo inherits from competition by default, with option to upload custom logo
- ✅ **Logo Specifications:** 500x500px maximum, 2MB file size limit, PNG/JPG formats
- ✅ **Banner Specifications:** 1920x400px maximum, 5MB file size limit, PNG/JPG formats

### Validation Rules
- ✅ **Duplicate Names:** Two seasons CAN have the same name within the same competition (slugs handle uniqueness)
- ✅ **Profanity Filtering:** NO profanity filtering - any name is allowed

### Permissions & Access Control
- ✅ **Who Can Manage:** Only league owners and users with league admin permissions can create/view/edit/delete seasons
- ✅ **View-Only Permission:** NO separate view-only permission for MVP (might change in future)

---

## User Journey

### 1. Creating a Season

**Entry Point:** Competition Detail View

1. User clicks "Create Season" button on Competition Detail page (appears in multiple locations: header, empty state, tabs)
2. **Drawer** opens with season creation form (consistent with league/competition creation)
3. User fills in:
   - Season name (required)
   - Car class/restrictions (optional)
   - Description (optional)
   - Technical specifications (optional)
   - Logo (optional, inherits from competition)
   - Banner image (optional)
   - Team championship toggle
4. System validates and creates season with unique slug
5. User is redirected to Season Detail view

### 2. Viewing Season Details

**Entry Point:** Competition Detail View → Season List → Click Season

Season Detail view shows:
- **Header:** Season name, logo, banner, status, action buttons
- **Tabs:**
  - **Overview:** Season information, metadata, statistics
  - **Drivers:** List of drivers assigned to season
  - **Settings:** Edit season details, archive/delete

### 3. Assigning Drivers to Season

**Entry Point:** Season Detail View → Drivers Tab → "Add Drivers" Button

1. **Separate drawer** opens showing two panels:
   - **Left Panel:** Available league drivers (not yet in season)
   - **Right Panel:** Current season drivers
2. User selects drivers from available list
3. User can optionally set:
   - Status (active, reserve, withdrawn)
   - Season-specific notes
4. User clicks "Add to Season"
5. Drivers move to the "Season Drivers" panel

### 4. Managing Season Drivers

From the Season Drivers table, users can:
- View driver status
- Edit driver status
- Add/edit season-specific notes
- Remove driver from season

---

## Technical Architecture

### Backend (Laravel DDD)

**Domain Layer:**
- `Season` entity (business logic)
- `SeasonDriver` entity (assignment logic)
- Value objects: `SeasonName`, `SeasonSlug`, `SeasonStatus`, `SeasonDriverStatus`
- Domain events: `SeasonCreated`, `SeasonUpdated`, `DriverAddedToSeason`, etc.
- Repository interfaces

**Application Layer:**
- `SeasonApplicationService` (season CRUD)
- `SeasonDriverApplicationService` (driver assignments)
- DTOs for data transfer

**Infrastructure Layer:**
- `seasons` table (season data)
- `season_drivers` table (pivot/assignment)
- Eloquent models (anemic)
- Repository implementations

**Interface Layer:**
- `SeasonController` (thin, 3-5 lines per method)
- `SeasonDriverController` (thin)
- API routes on `app.virtualracingleagues.localhost/api/seasons`

### Frontend (Vue 3 + TypeScript)

**Components:**
- `SeasonFormDrawer` - Create/edit season
- `SeasonDetail` view - Season detail page with tabs
- `SeasonDriverManagementDrawer` - Assign drivers to season
- `AvailableDriversTable` - League drivers not in season
- `SeasonDriversTable` - Drivers assigned to season
- `SeasonDriverFormDialog` - Edit season-driver status/notes

**State Management:**
- `seasonStore` (Pinia) - Season CRUD
- `seasonDriverStore` (Pinia) - Season-driver assignments
- Reuses existing `driverStore` for league drivers

**Services:**
- `seasonService.ts` - API calls for seasons
- `seasonDriverService.ts` - API calls for season-driver assignments

**Types:**
- `season.ts` - Season interfaces
- `seasonDriver.ts` - Season-driver interfaces

---

## Database Schema

### `seasons` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `competition_id` | bigint | FK to competitions (cascade delete) |
| `name` | varchar(100) | Season name |
| `slug` | varchar(150) | Unique slug per competition |
| `car_class` | varchar(150) | Car restrictions (nullable) |
| `description` | text | Rich text description (nullable) |
| `technical_specs` | text | Technical specifications (nullable) |
| `logo_url` | varchar(255) | Logo image path (nullable) |
| `banner_url` | varchar(255) | Banner image path (nullable) |
| `team_championship_enabled` | boolean | Enable team features (default: false) |
| `status` | enum | setup, active, completed, archived |
| `created_by_user_id` | bigint | FK to users |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `deleted_at` | timestamp | Soft delete (nullable) |

**Indexes:**
- Unique: `competition_id + slug`
- Index: `competition_id`, `status`, `created_by_user_id`

### `season_drivers` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `season_id` | bigint | FK to seasons (cascade delete) |
| `league_driver_id` | bigint | FK to league_drivers (cascade delete) |
| `status` | enum | active, reserve, withdrawn (default: active) |
| `notes` | text | Season-specific notes (nullable) |
| `added_at` | timestamp | When driver was added to season |
| `updated_at` | timestamp | |

**Indexes:**
- Unique: `season_id + league_driver_id` (driver can only be in season once)
- Index: `season_id`, `league_driver_id`, `status`

---

## API Endpoints

### Season Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seasons?competition_id={id}` | List seasons for competition |
| POST | `/api/seasons` | Create new season |
| GET | `/api/seasons/{id}` | Get season details |
| PUT | `/api/seasons/{id}` | Update season |
| DELETE | `/api/seasons/{id}` | Soft delete season |
| POST | `/api/seasons/{id}/archive` | Archive season |
| POST | `/api/seasons/{id}/activate` | Activate season |
| POST | `/api/seasons/{id}/complete` | Complete season |
| POST | `/api/seasons/{id}/restore` | Restore deleted season |

### Season-Driver Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seasons/{id}/drivers` | List drivers in season |
| POST | `/api/seasons/{id}/drivers` | Add driver(s) to season |
| PUT | `/api/seasons/{id}/drivers/{driverId}` | Update season-driver |
| DELETE | `/api/seasons/{id}/drivers/{driverId}` | Remove driver from season |
| GET | `/api/seasons/{id}/drivers/stats` | Get driver statistics |
| POST | `/api/seasons/{id}/drivers/bulk` | Bulk add drivers |

---

## Business Rules

### Season Creation
- Season name is required (3-100 characters)
- Slug is auto-generated from name
- Slug must be unique per competition
- If slug conflict, append `-01`, `-02`, etc.
- Status defaults to `setup`
- Team championship disabled by default
- Logo inherits from competition if not provided

### Season-Driver Assignment
- Driver must belong to the competition's league
- Driver can only be added to a season once
- Driver can be in multiple seasons across different competitions
- Status defaults to `active`
- Notes are optional and season-specific
- Removing driver from season does NOT delete the driver from league

### Status Transitions
- `setup` → `active` → `completed` → `archived`
- Cannot modify archived seasons
- Archived seasons can be restored to `completed` status

### Slug Generation
- Generated from season name (lowercase, hyphens)
- Examples: "Winter 2025" → "winter-2025"
- Unique per league + competition + season
- Conflict resolution: "winter-2025-01", "winter-2025-02", etc.

---

## Implementation Timeline

### Phase 1: Backend Foundation (Week 1)
- Domain layer (entities, value objects, events)
- Repository interfaces
- Unit tests

### Phase 2: Backend Application (Week 2)
- Application services
- DTOs
- Database migrations
- Repository implementations

### Phase 3: Backend Interface (Week 2-3)
- Controllers
- Routes
- Form requests
- Feature tests

### Phase 4: Frontend Foundation (Week 3)
- Types
- Services
- Stores
- Composables

### Phase 5: Frontend Components (Week 3-4)
- Season CRUD components
- Season detail view
- Season-driver management UI

### Phase 6: Integration & Testing (Week 4)
- End-to-end testing
- Bug fixes
- Performance optimization
- Documentation

**Total Estimated Time:** 4 weeks

---

## Future Enhancements (Post-MVP)

1. **Divisions**
   - Create skill-based groupings
   - Assign drivers to divisions
   - Manage division order and metadata

2. **Teams**
   - Create teams when team_championship_enabled
   - Assign drivers to teams
   - Calculate team standings

3. **Rounds**
   - Create race calendar
   - Configure race settings per round
   - Enter results

4. **CSV Import**
   - Bulk add drivers to season via CSV
   - Import driver data
   - Error handling and preview

5. **Bulk Operations**
   - Bulk status updates
   - Bulk driver assignment
   - Bulk driver removal

6. **Season Templates**
   - Clone previous season structure
   - Import settings from template
   - Quick setup for recurring seasons

7. **Advanced Features**
   - Auto-division assignment based on skill
   - Driver eligibility rules
   - Reserve driver management
   - Registration windows
   - Promotion/relegation system

---

## Success Criteria

### Functional Requirements
- ✅ Users can create seasons for competitions
- ✅ Users can update season details
- ✅ Users can view season information
- ✅ Users can assign league drivers to seasons
- ✅ Users can manage season-driver status and notes
- ✅ Users can remove drivers from seasons
- ✅ Unique slugs are generated automatically
- ✅ Status transitions work correctly

### Technical Requirements
- ✅ Follows DDD architecture patterns
- ✅ 100% test coverage for domain layer
- ✅ 80%+ test coverage for application layer
- ✅ All endpoints documented and tested
- ✅ TypeScript strict mode compliance
- ✅ Responsive UI on mobile/desktop

### Performance Requirements
- ✅ Season list loads in < 1 second
- ✅ Season detail page loads in < 2 seconds
- ✅ Driver assignment completes in < 1 second
- ✅ Image uploads complete in < 5 seconds

### User Experience Requirements
- ✅ Intuitive navigation from competition to season
- ✅ Clear visual feedback on all actions
- ✅ Helpful error messages
- ✅ Empty states guide users to next action
- ✅ Consistent UI patterns with rest of application

---

## Related Documentation

- **[Backend Architecture Plan](backend.md)** - Detailed backend DDD implementation plan (v1.1 - Updated)
- **[Frontend Implementation Plan](frontend.md)** - Detailed frontend Vue/TypeScript plan (v2.0 - Updated)
- **[Season Creation Original Spec](../05_season_creation.md)** - Original feature specification
- **[Stakeholder Answers](answers.md)** - Confirmed answers to planning questions
- **[DDD Overview](.claude/guides/backend/ddd-overview.md)** - Backend architecture patterns
- **[User Backend Guide](.claude/guides/backend/user-backend-guide.md)** - User context development
- **[Admin Dashboard Guide](.claude/guides/frontend/admin-dashboard-development-guide.md)** - Frontend patterns

---

## Ready for Implementation

✅ **All stakeholder questions answered**
✅ **Business rules confirmed**
✅ **Backend plan updated (v1.1)**
✅ **Frontend plan updated (v2.0)**
✅ **No ambiguity remaining**

**Implementation can begin immediately following the 6-phase timeline outlined above.**

---

**Last Updated:** October 23, 2025
**Status:** Requirements confirmed - Ready for implementation
**Estimated Completion:** 4 weeks from start date
