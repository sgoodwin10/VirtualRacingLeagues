# Driver Table and Modals - Fixes Summary

## Issues Fixed

### 1. Name Column Display ✅
**Problem**: The DataTable was receiving data with a nested `driver` object, but the name column was trying to access properties directly on `LeagueDriver`.

**Solution**:
- Updated `LeagueDriver` type to properly reflect the API response structure with nested `driver` object
- Modified `DriverTable.vue` to use `leagueDriver.driver.display_name` instead of accessing properties directly
- Updated `getDriverName()` function to handle the nested structure

**Files Modified**:
- `/var/www/resources/user/js/types/driver.ts` - Updated type definitions
- `/var/www/resources/user/js/components/driver/DriverTable.vue` - Fixed name display logic

### 2. Edit Modal Data Loading ✅
**Problem**: Edit modal wasn't loading driver data because it expected flat structure but received nested `driver` object.

**Solution**:
- Updated `DriverFormDialog.vue` watch function to properly extract data from nested `driver` object
- Separated league-specific fields (driver_number, status, league_notes) from driver fields (name, email, platform IDs)

**Files Modified**:
- `/var/www/resources/user/js/components/driver/DriverFormDialog.vue` - Fixed data loading from nested structure

### 3. View Driver Modal ✅
**Problem**: No view modal existed.

**Solution**:
- Created new `ViewDriverModal.vue` component
- Displays all driver information in organized sections:
  - Personal Information (name, nickname, contact info)
  - Platform Identifiers (PSN, GT7, iRacing IDs)
  - League Information (driver number, status, notes, added date)
- Added "Edit" button that transitions to edit modal
- Integrated with `DriverTable` via new "View" button

**Files Created**:
- `/var/www/resources/user/js/components/driver/ViewDriverModal.vue`

**Files Modified**:
- `/var/www/resources/user/js/components/driver/DriverTable.vue` - Added view emit and button
- `/var/www/resources/user/js/components/driver/DriverManagementDrawer.vue` - Added view handlers

### 4. Platform Field Filtering ✅
**Problem**: Form showed all platform fields regardless of league's platforms.

**Solution**:
- Added `leaguePlatforms` prop to `DriverFormDialog`
- Created computed property `showPlatformFields` to determine which fields to show
- Updated validation to only require one platform ID from the league's platforms
- Conditionally render platform input fields based on league configuration

**Files Modified**:
- `/var/www/resources/user/js/components/driver/DriverFormDialog.vue` - Added platform filtering logic
- `/var/www/resources/user/js/components/driver/DriverManagementDrawer.vue` - Pass league platforms to form
- `/var/www/resources/user/js/views/LeagueDetail.vue` - Pass league platforms to drawer

### 5. DataTable Platform Columns ✅
**Problem**: DataTable showed all platform columns regardless of league's platforms.

**Solution**:
- Added `leaguePlatforms` prop to `DriverTable`
- Created computed property `hasPlatform` to determine which columns to show
- Conditionally render platform columns (PSN ID, GT7 ID, iRacing ID) based on league configuration
- Platform columns only appear if the league uses that platform

**Files Modified**:
- `/var/www/resources/user/js/components/driver/DriverTable.vue` - Added conditional platform columns

## Type System Updates

### Updated Type Definitions

```typescript
// Before - LeagueDriver extended Driver
export interface LeagueDriver extends Driver {
  driver_number: number | null;
  status: DriverStatus;
  league_notes: string | null;
  added_to_league_at: string;
}

// After - LeagueDriver has nested driver object
export interface LeagueDriver {
  id: number;
  league_id: number;
  driver_id: number;
  driver_number: number | null;
  status: DriverStatus;
  league_notes: string | null;
  added_to_league_at: string;
  driver: Driver;
}

// Updated Driver interface
export interface Driver {
  id: number;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  display_name: string;  // Added
  email: string | null;
  phone: string | null;
  psn_id: string | null;
  gt7_id: string | null;
  iracing_id: string | null;
  iracing_customer_id: number | null;
  primary_platform_id: string | null;  // Added
  created_at?: string;
  updated_at?: string;
}
```

## Test Helpers Created

Created test helper functions for creating mock data:

**File**: `/var/www/resources/user/js/__tests__/helpers/driverTestHelpers.ts`

```typescript
export function createMockDriver(overrides?: Partial<Driver>): Driver
export function createMockLeagueDriver(overrides?: Partial<LeagueDriver>): LeagueDriver
```

## Remaining Work

### Tests to Update (20 TypeScript errors remaining)

The following test files need to be updated to use the new type structure:

1. **DriverTable.test.ts** - 2 errors
   - Update mock data to use nested driver structure
   - Use `createMockLeagueDriver` helper

2. **DriverFormDialog.test.ts** - 1 error
   - Update mock driver to use nested structure
   - Add `leaguePlatforms` prop to test scenarios

3. **driverStore.test.ts** - 17 errors
   - Update all mock LeagueDriver objects to use nested structure
   - Use `createMockLeagueDriver` helper throughout
   - Update assertions to access `driver.field` instead of directly accessing fields

### How to Fix Tests

1. Import the helper:
   ```typescript
   import { createMockLeagueDriver } from '@user/__tests__/helpers/driverTestHelpers';
   ```

2. Replace old mock data:
   ```typescript
   // OLD
   const mockDriver: LeagueDriver = {
     id: 1,
     first_name: 'John',
     last_name: 'Smith',
     status: 'active',
     // ... other fields
   };

   // NEW
   const mockDriver = createMockLeagueDriver({
     id: 1,
     driver: {
       id: 1,
       first_name: 'John',
       last_name: 'Smith',
       display_name: 'John Smith',
       // ... other driver fields
     },
     status: 'active',
     // ... league-specific fields
   });
   ```

3. Update assertions:
   ```typescript
   // OLD
   expect(result.first_name).toBe('John');

   // NEW
   expect(result.driver.first_name).toBe('John');
   ```

## API Response Format

The backend API now returns drivers in this format:

```json
{
  "success": true,
  "data": [{
    "id": 2,
    "league_id": 4,
    "driver_id": 2,
    "driver_number": null,
    "status": "active",
    "league_notes": null,
    "added_to_league_at": "2025-10-19 01:11:05",
    "driver": {
      "id": 2,
      "first_name": "sf",
      "last_name": "asd",
      "nickname": "asd",
      "display_name": "sf asd",
      "email": null,
      "phone": null,
      "psn_id": "asdasdasd",
      "gt7_id": null,
      "iracing_id": null,
      "iracing_customer_id": null,
      "primary_platform_id": "PSN: asdasdasd"
    }
  }]
}
```

## Testing Checklist

Once tests are updated, verify the following functionality:

- [ ] Driver table displays names correctly
- [ ] Platform columns only show for league's platforms
- [ ] View button opens modal with all driver details
- [ ] Edit button loads correct data in edit form
- [ ] Edit form only shows platform fields for league's platforms
- [ ] Edit form requires at least one platform ID from league's platforms
- [ ] Saving edits updates the driver correctly
- [ ] Remove button works correctly

## Files Modified Summary

### Core Components
- `resources/user/js/components/driver/DriverTable.vue` - Fixed display, added view button, filtered columns
- `resources/user/js/components/driver/DriverFormDialog.vue` - Fixed edit loading, filtered platform fields
- `resources/user/js/components/driver/DriverManagementDrawer.vue` - Added view handler, passes platforms
- `resources/user/js/components/driver/ViewDriverModal.vue` - **NEW** - View driver details

### Views
- `resources/user/js/views/LeagueDetail.vue` - Pass league platforms to drawer

### Types
- `resources/user/js/types/driver.ts` - Updated LeagueDriver and Driver interfaces

### Services
- `resources/user/js/services/driverService.ts` - Fixed PaginationMeta type

### Tests
- `resources/user/js/services/__tests__/driverService.test.ts` - **UPDATED** - All tests fixed
- `resources/user/js/__tests__/helpers/driverTestHelpers.ts` - **NEW** - Test helper functions

### Tests to Update
- `resources/user/js/components/driver/__tests__/DriverTable.test.ts`
- `resources/user/js/components/driver/__tests__/DriverFormDialog.test.ts`
- `resources/user/js/stores/__tests__/driverStore.test.ts`

## Next Steps

1. Update the remaining test files using the pattern shown in `driverService.test.ts`
2. Run `npm run type-check` to verify all TypeScript errors are resolved
3. Run `npm run test:user` to ensure all tests pass
4. Manually test the driver management functionality in the browser
5. Verify edit and view modals work correctly with the nested data structure
