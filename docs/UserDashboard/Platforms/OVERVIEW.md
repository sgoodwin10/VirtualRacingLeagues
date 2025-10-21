# Dynamic Platform-Based Driver Management System - Overview

## Purpose

Implement a comprehensive system where league platforms dictate the user interface and data structure for driver management across three key areas:

1. **DataTable** - Display only relevant platform ID columns
2. **Create/Edit Forms** - Show only platform fields for the league's platforms
3. **CSV Import/Export** - Dynamic headers and validation for platform compatibility

## Problem Statement

Currently, the driver management system shows hardcoded platform fields (PSN ID, GT7 ID, iRacing ID) regardless of which platforms a league actually uses. This creates:

- **User confusion**: Users see irrelevant fields for platforms they don't use
- **Data quality issues**: No validation that drivers have compatible platform IDs
- **Maintenance burden**: Adding new platforms requires code changes in multiple places
- **Inconsistent UX**: DataTable, forms, and CSV all handle platforms differently

## Solution Overview

Create a centralized configuration system where:

1. **Backend**: Domain service (`DriverPlatformColumnService`) determines which platform fields are relevant for a given league's platforms
2. **Frontend**: Components dynamically render fields/columns based on backend configuration
3. **Single Source of Truth**: Platform-to-field mappings defined once, used everywhere

## Architecture Principles

### Backend (Laravel DDD)
- **Domain Layer**: `DriverPlatformColumnService` contains business logic for platform field configuration
- **Application Layer**: Orchestrates use cases (get columns, get form fields, validate CSV)
- **Interface Layer**: Thin controllers expose configuration via API endpoints

### Frontend (Vue 3)
- **State Management**: League store fetches and caches platform configurations
- **Component Composition**: Components accept configuration as props, render dynamically
- **Type Safety**: TypeScript interfaces ensure consistency across components

## User Experience Goals

### For League Admins
- ✅ See only relevant platform fields when managing drivers
- ✅ Download CSV templates with correct headers for their league's platforms
- ✅ Get clear validation errors when importing incompatible drivers
- ✅ Consistent experience across DataTable, forms, and CSV

### For Developers
- ✅ Add new platforms without changing component code
- ✅ Single configuration point for platform-to-field mappings
- ✅ Type-safe implementation with comprehensive tests
- ✅ Clear separation of concerns (domain logic vs presentation)

## Key Design Decisions

### 1. Platform Field Mapping Location
**Decision**: Frontend config file with backend as source of truth for metadata
**Rationale**: Platforms are developer-managed, not admin-managed. Frontend config is simple and sufficient.

### 2. Form Field Scope
**Decision**: Show only platform fields for current league's platforms
**Rationale**: League-specific context reduces confusion. Users focus on relevant fields only.

### 3. CSV Validation
**Decision**: Validate platform compatibility during import
**Rationale**: Prevents data quality issues. Drivers must have at least one platform ID matching the league.

### 4. Multi-League Driver Editing
**Decision**: Edit form shows fields for current league context only
**Rationale**: Simplifies UX. Future enhancement can show all fields if needed.

### 5. Column Configuration Structure
**Decision**: Backend returns complete metadata (labels, types, validation)
**Rationale**: Better separation of concerns. Frontend just renders, backend owns business rules.

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User navigates to League Drivers page                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend fetches:                                           │
│ - GET /api/leagues/{id}/driver-columns                      │
│ - GET /api/leagues/{id}/driver-form-fields                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend:                                                    │
│ 1. Fetch League entity                                      │
│ 2. Extract platform_ids: [1, 2] (GT7, iRacing)             │
│ 3. DriverPlatformColumnService::getColumnsForLeague([1,2])  │
│ 4. Returns: [psn_id, gt7_id, iracing_id, iracing_customer_id] │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend stores configuration in League Store               │
│ - platformColumns: [...]                                    │
│ - platformFormFields: [...]                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Components render dynamically:                              │
│ - DriverTable: v-for over platformColumns                   │
│ - DriverFormDialog: v-for over platformFormFields           │
│ - CSVImportDialog: expects platformCsvHeaders               │
└─────────────────────────────────────────────────────────────┘
```

## Current Platform-to-Field Mappings

| Platform ID | Platform Name                | Driver Fields                          |
|-------------|------------------------------|----------------------------------------|
| 1           | Gran Turismo 7               | `psn_id`, `gt7_id`                     |
| 2           | iRacing                      | `iracing_id`, `iracing_customer_id`    |
| 3           | Assetto Corsa Competizione   | *(No fields yet)*                      |
| 4           | rFactor 2                    | *(No fields yet)*                      |
| 5           | Automobilista 2              | *(No fields yet)*                      |
| 6           | F1 24                        | *(No fields yet)*                      |

## Example Use Case

### Scenario: Gran Turismo 7 Only League

1. **League Creation**: Admin selects "Gran Turismo 7" as platform
2. **Driver DataTable**: Shows columns: Driver #, Name, Email, **PSN ID**, **GT7 ID**, Actions
   - iRacing columns are hidden
3. **Add Driver Form**: Shows fields:
   - First Name, Last Name, Email *(base fields)*
   - **PSN ID**, **GT7 ID** *(platform fields)*
   - No iRacing fields
4. **CSV Template**: Headers: `First Name, Last Name, Email, PSN ID, GT7 ID`
5. **CSV Import**:
   - ✅ Valid: Driver has `psn_id` populated
   - ✅ Valid: Driver has `gt7_id` populated
   - ✅ Valid: Driver has both `psn_id` and `gt7_id` populated
   - ❌ Invalid: Driver has no `psn_id` or `gt7_id` (validation error)

## Implementation Timeline

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| 1 | Backend Foundation (Domain Service, Application Service, Controllers) | 45 min |
| 2 | Frontend Infrastructure (Store, Types, Config) | 30 min |
| 3 | DataTable Refactoring | 20 min |
| 4 | Form Refactoring | 25 min |
| 5 | CSV Import/Export Refactoring | 30 min |
| **Total** | | **~2.5 hours** |

## Success Criteria

### Backend
- ✅ `DriverPlatformColumnService` returns correct configurations for any platform combination
- ✅ API endpoints provide complete metadata (labels, types, validation rules)
- ✅ CSV import rejects drivers without compatible platform IDs
- ✅ All domain service methods have unit tests
- ✅ All endpoints have feature tests

### Frontend
- ✅ DataTable shows/hides columns based on league platforms
- ✅ Create/Edit forms show only relevant platform fields
- ✅ CSV template downloads with correct headers
- ✅ CSV validation displays clear, actionable error messages
- ✅ All components have unit tests
- ✅ Type-safe TypeScript implementation

### User Experience
- ✅ No irrelevant fields shown to users
- ✅ Consistent platform handling across all interfaces
- ✅ Clear validation errors with row numbers for CSV imports
- ✅ One-click CSV template download

## MVP Scope

### Included
- ✅ Dynamic columns, forms, and CSV based on league platforms
- ✅ Platform compatibility validation for CSV imports
- ✅ Backend configuration API endpoints
- ✅ League-specific context (current league's platforms only)
- ✅ Comprehensive test coverage

### Not Included (Future Enhancements)
- ❌ User preferences for column visibility/order
- ❌ Admin interface to add/configure platforms dynamically
- ❌ Cross-league driver editing (show all platform fields)
- ❌ Bulk edit platform IDs across multiple leagues
- ❌ Platform field history/audit log
- ❌ Custom platform field types beyond text/number

## Related Documentation

- [Backend Implementation Guide](./BACKEND.md) - Detailed backend architecture and implementation
- [Frontend Implementation Guide](./FRONTEND.md) - Detailed frontend architecture and implementation
- [Testing Strategy](../../testing/FRONTEND_TESTING_GUIDE.md) - Component and integration testing approach

## Migration Path

### Current State
- Hardcoded platform columns in `DriverTable.vue`
- Hardcoded platform fields in `DriverFormDialog.vue`
- Static CSV headers with no validation

### Future State
- Dynamic rendering based on backend configuration
- Centralized platform field management
- Robust validation and error handling

### Backward Compatibility
- ✅ No database schema changes required
- ✅ Existing driver data remains valid
- ✅ API changes are additive (new endpoints, no breaking changes)
- ✅ Frontend changes are internal (no route changes)
