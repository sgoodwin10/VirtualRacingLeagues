# Driver Management MVP - Implementation Summary

**Version:** 1.0 MVP
**Created:** October 18, 2025
**Scope:** Simple League-Level Driver Management (Minimum Viable Product)

---

## Overview

This document outlines a **simplified MVP** for driver management at the league level. The focus is on core CRUD operations and basic CSV import functionality, removing all advanced features for faster delivery.

### What We're Building (MVP)

A simple driver management system that enables league managers to:
- ✅ View drivers in a league (table with pagination)
- ✅ Add drivers individually via form
- ✅ Edit league-specific driver settings (number, status, notes)
- ✅ Remove drivers from league
- ✅ Bulk import drivers via CSV paste (textarea only)
- ✅ Search and filter drivers (basic)

### What We're NOT Building (Deferred to v2)

- ❌ File upload for CSV (textarea paste only)
- ❌ CSV import preview with conflict resolution
- ❌ Multi-league support indicators
- ❌ Global driver editing (separate from league-specific)
- ❌ Advanced filters (platform, contact info, participation history)
- ❌ Bulk actions (export, bulk status changes)
- ❌ Driver statistics dashboard (keep basic counts only)
- ❌ Driver participation history view
- ❌ Season driver selection integration
- ❌ Additional platforms beyond core 3-4

---

## Architecture Overview

### Simplified Data Model

```
┌─────────────────────────────────────────────────────────┐
│ 1. GLOBAL DRIVER POOL (drivers table)                  │
│    - Drivers are global entities                       │
│    - 3-4 core platforms only (PSN, GT7, iRacing)       │
│    - No UI for global editing (league-scoped in MVP)   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. LEAGUE ASSOCIATION (league_drivers pivot)           │
│    - Links drivers to leagues                          │
│    - League-specific settings (number, status, notes)  │
│    ← MVP SCOPE: Simple CRUD + CSV import               │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Laravel 12 with DDD (simplified)
- Spatie Laravel Data for DTOs
- PHPUnit for testing

**Frontend:**
- Vue 3 Composition API + TypeScript
- PrimeVue 4 (Drawer, DataTable, Dialog, Form components)
- Pinia for state management
- Tailwind CSS 4

---

## User Experience Flow

### Entry Point

1. User navigates to **LeagueDetail.vue** (league dashboard)
2. Clicks **"Create Drivers"** button
3. A **bottom drawer slides up** (80vh height)
4. Driver management interface displays

### Main Interface (Simplified)

```
┌─────────────────────────────────────────────────────────┐
│ LEAGUE DRIVERS - [League Name]                         │
├─────────────────────────────────────────────────────────┤
│ [+ Add Driver] [Import CSV]                            │
│ [Search...] [Filter: All ▼]                            │
│                                                         │
│ Total: 50 drivers (45 active, 5 inactive)              │
│                                                         │
│ ╔═══════════════════════════════════════════════════╗  │
│ ║  #  │ Status │ Name         │ Platform  │ Actions ║  │
│ ║─────┼────────┼──────────────┼───────────┼─────────║  │
│ ║  5  │   ✓    │ John Smith   │ PSN: XX   │[Edit][×]║  │
│ ║  7  │   ✓    │ Jane Doe     │ PSN: YY   │[Edit][×]║  │
│ ║ ... │   ...  │ ...          │ ...       │   ...   ║  │
│ ╚═══════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────┘
```

### Key User Flows

**1. Add Single Driver**
- Click [+ Add Driver] → Dialog opens
- Fill form: Name, Platform ID, Email (optional), Number, Status
- Validation: At least 1 name field + 1 platform ID
- Submit → Driver created + added to league
- Success toast notification

**2. CSV Import (Simplified)**
- Click [Import CSV] → Dialog opens with textarea
- Paste CSV data (no file upload)
- Click [Import] → Backend validates and imports
- Success: "X drivers imported successfully"
- Errors: List of errors with row numbers

**3. Edit Driver**
- Click [Edit] next to driver → Dialog opens
- Edit: Number, Status, Notes (league-specific only)
- Submit → Updates saved
- Success toast notification

**4. Remove Driver**
- Click [×] next to driver → Confirmation dialog
- Confirm → Driver removed from league
- Success toast notification

---

## Database Schema (Simplified)

### drivers Table

```sql
CREATE TABLE drivers (
  id BIGINT PRIMARY KEY,

  -- Names (at least one required)
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  nickname VARCHAR(100) NULL,

  -- Contact (optional)
  email VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,

  -- Platform IDs (at least one required) - SIMPLIFIED TO 3-4 CORE PLATFORMS
  psn_id VARCHAR(255) NULL,
  gt7_id VARCHAR(255) NULL,
  iracing_id VARCHAR(255) NULL,
  iracing_customer_id INT NULL,

  -- Timestamps
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  -- Indexes
  INDEX idx_name (first_name, last_name),
  INDEX idx_psn (psn_id),
  INDEX idx_gt7 (gt7_id),
  INDEX idx_iracing (iracing_id)
);
```

**Removed platforms for MVP:**
- ❌ steam_id, steam_name
- ❌ xbox_gamertag
- ❌ custom_platform_id, custom_platform_name

### league_drivers Table (Pivot)

```sql
CREATE TABLE league_drivers (
  id BIGINT PRIMARY KEY,
  league_id BIGINT NOT NULL,
  driver_id BIGINT NOT NULL,

  -- League-specific data
  driver_number INT NULL,
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
  league_notes TEXT NULL,

  -- Timestamps
  added_to_league_at TIMESTAMP,
  updated_at TIMESTAMP,

  -- Constraints
  UNIQUE KEY unique_league_driver (league_id, driver_id),
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);
```

---

## API Endpoints (Simplified)

All routes in `routes/subdomain.php` under `app.{domain}` subdomain with `['auth:web', 'user.authenticate']` middleware.

### League Driver Management (6 endpoints)

```
GET    /api/leagues/{league}/drivers
       → List all drivers in league (paginated, searchable)

POST   /api/leagues/{league}/drivers
       → Create driver + add to league

GET    /api/leagues/{league}/drivers/{driver}
       → Get single driver in league

PUT    /api/leagues/{league}/drivers/{driver}
       → Update league-specific settings (number, status, notes)

DELETE /api/leagues/{league}/drivers/{driver}
       → Remove driver from league

POST   /api/leagues/{league}/drivers/import-csv
       → Bulk CSV import (simplified, no preview)
```

**Removed endpoints:**
- ❌ GET /api/drivers/{driver} (global driver info)
- ❌ PUT /api/drivers/{driver} (global driver update)
- ❌ POST /api/leagues/{league}/drivers/import/preview (preview step)
- ❌ GET /api/leagues/{league}/drivers/stats (advanced stats)

---

## CSV Import Format (Simplified)

### Supported Format

```csv
FirstName,LastName,PSN_ID,Email,DriverNumber
John,Smith,JohnSmith77,john@email.com,5
Jane,Doe,JaneDoe_GT,jane@email.com,7
Mike,Ross,MikeR_Racing,,3
```

**Required Columns:**
- At least `FirstName` OR `LastName`
- At least one platform ID: `PSN_ID`, `GT7_ID`, or `iRacing_ID`

**Optional Columns:**
- `Email`, `Phone`, `DriverNumber`

### Import Logic (Simplified)

```
1. Parse CSV from textarea
2. For each row:
   a. Validate: Has name + platform ID?
   b. Check: Platform ID already in THIS league?
   c. If exists: Skip with error "Driver already in league"
   d. If new: Create driver + add to league
3. Return summary:
   - Success count: "X drivers imported"
   - Error list: "Row 2: Driver with PSN 'xxx' already exists"
```

**Removed complexity:**
- ❌ Global duplicate detection across all leagues
- ❌ Preview step with conflict resolution
- ❌ Merge/update options for existing drivers
- ❌ Potential duplicate warnings

---

## Business Rules (Simplified)

### Driver Creation
- ✅ At least first name OR last name required
- ✅ At least ONE platform ID required (PSN, GT7, or iRacing)
- ✅ Email optional, phone optional
- ✅ Driver number optional (1-999)

### League Association
- ✅ Driver can only be in a league once (UNIQUE constraint)
- ✅ Same driver can be in multiple leagues (underlying architecture supports it, but no UI indicators in MVP)
- ✅ League-specific settings: number, status, notes

### Status Management
- ✅ **Active:** Normal driver (default)
- ✅ **Inactive:** Still in roster but cannot participate
- ✅ **Banned:** Blocked from league

### Validation
- ✅ Platform ID must be unique within the league
- ✅ Driver number not required to be unique
- ✅ Email format validation if provided

### Deletion
- ✅ Removes driver from league (soft delete on pivot)
- ✅ Preserves global driver record
- ✅ Can be re-added later if needed

---

## Component Architecture (Simplified)

### Frontend Components (6 total)

```
LeagueDetail.vue (existing)
└── DriverManagementDrawer.vue (NEW - bottom drawer)
    ├── DriverStatsCard.vue (NEW - simple stats)
    ├── DriverTable.vue (NEW - DataTable)
    │   └── DriverStatusBadge.vue (NEW - status chip)
    ├── DriverFormDialog.vue (NEW - add/edit form)
    └── CSVImportDialog.vue (NEW - textarea import)
```

**Removed components:**
- ❌ DriverActionMenu (use inline Edit/Delete buttons)
- ❌ CSVUploadStep, CSVPreviewStep, CSVImportSummary
- ❌ Global driver edit components

### PrimeVue Components Used

- `Drawer` (bottom drawer, 80vh)
- `DataTable` (driver list with pagination)
- `Dialog` (add/edit/import modals)
- `InputText`, `Dropdown`, `Textarea` (form fields)
- `Button` (actions)
- `Chip` (status badges)
- `Toast` (notifications)
- `ConfirmDialog` (delete confirmation)
- `Card` (stats display)
- `Skeleton` (loading states)

---

## Implementation Timeline (MVP)

**Total Estimated Time:** 8-10 working days

### Phase 1: Backend Foundation (Days 1-2)
- Migrations (drivers, league_drivers)
- Value objects (DriverName, PlatformIdentifiers - 3 platforms only)
- Entities (Driver, LeagueDriver)
- Repository interfaces and implementations

### Phase 2: Backend API (Days 3-4)
- DTOs (simplified - no preview DTOs)
- Application service (CRUD + simple CSV import)
- Controllers (6 endpoints)
- Routes
- Unit and feature tests

### Phase 3: Frontend Foundation (Days 5-6)
- Type definitions (driver.ts - simplified)
- Driver service (6 API methods)
- Driver store (Pinia)
- Service and store tests

### Phase 4: Frontend Components (Days 7-8)
- DriverStatusBadge
- DriverStatsCard (simple version)
- DriverTable (with search/filter)
- DriverFormDialog (single mode)
- CSVImportDialog (textarea only)
- DriverManagementDrawer (main container)

### Phase 5: Integration & Polish (Days 9-10)
- Integrate with LeagueDetail.vue
- End-to-end testing
- Bug fixes and UI polish
- Documentation

---

## Success Criteria (MVP)

### Functional Requirements
- ✅ League managers can view all drivers in their league
- ✅ League managers can add drivers via form (name + platform ID)
- ✅ League managers can bulk import drivers via CSV paste
- ✅ League managers can edit driver settings (number, status, notes)
- ✅ League managers can remove drivers from league
- ✅ Search works (name, platform ID)
- ✅ Filter works (status: all/active/inactive/banned)
- ✅ Validation prevents duplicate platform IDs in same league

### Technical Requirements
- ✅ Follows DDD architecture patterns
- ✅ Passes PHPStan level 8 and PSR-12
- ✅ TypeScript strict mode compliance
- ✅ 80%+ test coverage on backend
- ✅ 70%+ test coverage on frontend
- ✅ API responses under 200ms

### User Experience
- ✅ Bottom drawer opens smoothly
- ✅ Form validation provides clear errors
- ✅ CSV import shows success/error summary
- ✅ Toast notifications for all actions
- ✅ Responsive design (mobile, tablet, desktop)

---

## What's Next (Post-MVP / v2)

After MVP is stable and deployed, add:

### Phase 2 Features
1. **CSV Preview** - Show validation before import
2. **File Upload** - Support CSV file upload
3. **Multi-League Indicators** - Show when driver is in multiple leagues
4. **Global Driver Editing** - Edit driver info across all leagues
5. **Additional Platforms** - Steam, Xbox, custom platforms

### Phase 3 Features
6. **Advanced Filters** - Platform, contact info, participation history
7. **Bulk Actions** - Export, bulk status changes, merge duplicates
8. **Driver Statistics** - Participation history, performance trends
9. **Season Integration** - Select drivers from league roster for seasons

---

## Key Differences from Full Plan

| Feature | Full Plan | MVP Plan |
|---------|-----------|----------|
| CSV Import | 3-step wizard with preview | Single textarea + submit |
| Platforms | 9 platform types | 3-4 core platforms |
| Multi-league UI | Full indicators & warnings | No UI (architecture supports it) |
| Global editing | Separate dialog with warnings | Removed (v2) |
| Duplicate detection | Cross-league with merge options | Single league only |
| Filters | 8+ filter options | 2 filters (search + status) |
| Bulk actions | 10+ bulk operations | Removed (v2) |
| Components | 10+ components | 6 components |
| Timeline | 20 days | 8-10 days |

---

## Related Documentation

- **MVP Backend Plan:** `mvp-backend-plan.md` - Detailed backend implementation
- **MVP Frontend Plan:** `mvp-frontend-plan.md` - Detailed frontend implementation
- **Full Plans (Reference):**
  - `backend-plan.md` - Full v1.0 backend plan
  - `frontend-plan.md` - Full v1.0 frontend plan
  - `01_A_driver_management_doc.md` - Original requirements

---

**Document Version:** 1.0 MVP
**Last Updated:** October 18, 2025
**Status:** Ready for Implementation
**Target:** 8-10 day development cycle
