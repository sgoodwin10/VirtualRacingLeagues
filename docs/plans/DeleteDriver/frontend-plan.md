# Delete Driver Feature - Frontend Implementation Plan

## Overview

Add driver status filtering (Active/Deleted) to the user dashboard, implement restore functionality for deleted drivers, and verify all views correctly display deleted drivers in historical data.

## Current State Analysis

### User Dashboard (resources/app)

**LeagueDrivers.vue** (`resources/app/js/views/LeagueDrivers.vue`)
- Main driver management view for a league
- Uses `useLeagueDrivers` composable
- Has "Remove Driver" action that calls `removeDriver()`
- No status filter currently exists

**DriversView.vue** (`resources/app/js/views/season/DriversView.vue`)
- Season drivers view (per plan document)
- Uses `useSeasonDriverStore`
- Manages drivers within a season context
- Plan specifies adding status filter here

**Driver Store** (`resources/app/js/stores/driverStore.ts`)
- Already has `statusFilter` state
- Filter values: `'active' | 'inactive' | 'banned' | null`
- Need to add: `'deleted'` status support

**Driver Service** (`resources/app/js/services/driverService.ts`)
- `getLeagueDrivers()` accepts `LeagueDriversQueryParams`
- Need to add `deleted_status` parameter

### Public Site (resources/public)

**StandingsRow.vue** (`resources/public/js/components/landing/StandingsRow.vue`)
- Displays driver standings
- Must continue showing deleted drivers

**VrlDriverCell.vue** (`resources/public/js/components/common/tables/cells/VrlDriverCell.vue`)
- Renders driver name in cells
- Must handle deleted drivers (no visual change needed)

**HeroSection.vue** (`resources/public/js/components/landing/sections/HeroSection.vue`)
- May show driver standings/results
- Verify deleted drivers display correctly

### Admin Dashboard (resources/admin)

**DriverDataTable.vue** (`resources/admin/js/components/drivers/DriverDataTable.vue`)
- Already shows deleted status with badge
- Already has correct behavior
- Verify no changes needed

## Implementation Steps

### Phase 1: App Dashboard - Driver Store & Service

**File: `resources/app/js/types/driver.ts`**

Add new type for deleted status:
```typescript
export type DriverDeletedStatus = 'active' | 'deleted' | 'all';

export interface LeagueDriversQueryParams {
  search?: string;
  status?: 'active' | 'inactive' | 'banned';
  deleted_status?: DriverDeletedStatus;  // NEW
  page?: number;
  per_page?: number;
}
```

**File: `resources/app/js/constants/apiEndpoints.ts`**

Add restore endpoint:
```typescript
export const API_ENDPOINTS = {
  leagues: {
    // ... existing
    driverRestore: (leagueId: number, driverId: number) =>
      `/api/leagues/${leagueId}/drivers/${driverId}/restore`,
  },
};
```

**File: `resources/app/js/services/driverService.ts`**

Update `getLeagueDrivers()` to include `deleted_status` param:
```typescript
export async function getLeagueDrivers(
  leagueId: number,
  params?: LeagueDriversQueryParams,
  signal?: AbortSignal,
): Promise<PaginatedDriversResponse> {
  // params already supports deleted_status via type
  const response = await apiClient.get(
    API_ENDPOINTS.leagues.drivers(leagueId),
    { params, signal },
  );
  // ...
}
```

Add new restore function:
```typescript
/**
 * Restore a soft-deleted driver
 * @param leagueId - League ID
 * @param driverId - Driver ID
 */
export async function restoreDriver(leagueId: number, driverId: number): Promise<void> {
  await apiClient.post(API_ENDPOINTS.leagues.driverRestore(leagueId, driverId));
}
```

**File: `resources/app/js/stores/driverStore.ts`**

Add deleted status filter state and restore action:
```typescript
interface DriverStoreState {
  // ... existing
  deletedStatusFilter: DriverDeletedStatus;  // NEW
}

export const useDriverStore = defineStore('driver', {
  state: (): DriverStoreState => ({
    // ... existing
    deletedStatusFilter: 'active',  // Default to active
  }),

  actions: {
    setDeletedStatusFilter(status: DriverDeletedStatus) {
      this.deletedStatusFilter = status;
    },

    async fetchLeagueDrivers(leagueId: number, params?: LeagueDriversQueryParams, signal?: AbortSignal) {
      // Include deleted_status in params
      const queryParams = {
        ...params,
        deleted_status: this.deletedStatusFilter,
      };
      // ... rest of fetch logic
    },

    // NEW: Restore a deleted driver
    async restoreDriver(leagueId: number, driverId: number) {
      await driverService.restoreDriver(leagueId, driverId);
      // Refresh the driver list after restore
      await this.fetchLeagueDrivers(leagueId);
    },
  },
});
```

### Phase 2: App Dashboard - LeagueDrivers View

**File: `resources/app/js/views/LeagueDrivers.vue`**

Add status filter dropdown in the header area:

```vue
<script setup lang="ts">
// Add import
import Dropdown from 'primevue/dropdown';
import type { DriverDeletedStatus } from '@app/types/driver';

// Add state
const deletedStatusFilter = ref<DriverDeletedStatus>('active');
const deletedStatusOptions = [
  { label: 'Active Drivers', value: 'active' },
  { label: 'Deleted Drivers', value: 'deleted' },
  { label: 'All Drivers', value: 'all' },
];

// Watch for filter changes
watch(deletedStatusFilter, async (newStatus) => {
  driverStore.setDeletedStatusFilter(newStatus);
  await loadDrivers();
});
</script>

<template>
  <!-- Add in header/toolbar area -->
  <Dropdown
    v-model="deletedStatusFilter"
    :options="deletedStatusOptions"
    option-label="label"
    option-value="value"
    placeholder="Filter by Status"
    class="w-48"
  />
</template>
```

Update "Remove Driver" action:
- Change label from "Remove" to "Delete"
- Update confirmation dialog text
- Success toast: "Driver deleted successfully"

**File: `resources/app/js/components/league/partials/LeagueDriversTab.vue`**

If filter is here instead of parent view:
- Add the same dropdown component
- Emit filter changes to parent or use store directly

### Phase 3: App Dashboard - DriversView (Season Context)

**File: `resources/app/js/views/season/DriversView.vue`**

Per the plan document, this view needs a status filter:

```vue
<script setup lang="ts">
// Add filter state
const driverStatusFilter = ref<'active' | 'deleted'>('active');

// Options for the filter
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Deleted', value: 'deleted' },
];
</script>

<template>
  <!-- Add filter UI -->
  <SelectButton
    v-model="driverStatusFilter"
    :options="statusOptions"
    option-label="label"
    option-value="value"
    class="mb-4"
  />
</template>
```

### Phase 4: App Dashboard - Driver Table Display

**File: `resources/app/js/components/driver/DriverTable.vue`**

Add visual indicator for deleted drivers:
```vue
<template>
  <Column field="status" header="Status">
    <template #body="{ data }">
      <Tag
        v-if="data.driver?.deleted_at"
        severity="danger"
        value="Deleted"
      />
      <Tag
        v-else
        :severity="getStatusSeverity(data.status)"
        :value="data.status"
      />
    </template>
  </Column>
</template>
```

### Phase 4b: App Dashboard - Restore Functionality

**File: `resources/app/js/composables/useLeagueDrivers.ts`**

Add restore function to composable:
```typescript
export function useLeagueDrivers(leagueId: Ref<number>, options: UseLeagueDriversOptions = {}) {
  const driverStore = useDriverStore();

  // ... existing code

  // NEW: Restore a deleted driver
  async function restoreDriver(driverId: number): Promise<void> {
    try {
      await driverStore.restoreDriver(leagueId.value, driverId);
      options.onSuccess?.('Driver restored successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore driver';
      options.onError?.(message);
      throw error;
    }
  }

  return {
    // ... existing
    restoreDriver,  // NEW
  };
}
```

**File: `resources/app/js/views/LeagueDrivers.vue`**

Add restore handler and UI:
```vue
<script setup lang="ts">
// Add to destructured composable return
const { loadDrivers, addDriver, updateDriver, removeDriver, restoreDriver, importFromCSV } = useLeagueDrivers(...);

// Add restore handler
function handleRestoreDriver(driver: LeagueDriver): void {
  confirm.require({
    message: `Are you sure you want to restore ${getDriverName(driver)}?`,
    header: 'Confirm Restore',
    icon: 'pi pi-refresh',
    acceptLabel: 'Restore',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-success',
    accept: async () => {
      await restoreDriver(driver.driver_id);
    },
  });
}
</script>

<template>
  <!-- In driver table actions column -->
  <Button
    v-if="driver.deleted_at"
    icon="pi pi-refresh"
    severity="success"
    text
    rounded
    @click="handleRestoreDriver(driver)"
    v-tooltip="'Restore Driver'"
  />
</template>
```

**File: `resources/app/js/components/league/partials/LeagueDriversTab.vue`**

Add restore action to table row actions:
```vue
<template>
  <!-- Add restore button for deleted drivers -->
  <Button
    v-if="driver.deleted_at"
    icon="pi pi-refresh"
    severity="success"
    text
    rounded
    @click="$emit('restore-driver', driver)"
    v-tooltip="'Restore'"
  />
</template>

<script setup lang="ts">
// Add to emits
const emit = defineEmits<{
  // ... existing
  'restore-driver': [driver: LeagueDriver];
}>();
</script>
```

### Phase 5: Update Composables

**File: `resources/app/js/composables/useLeagueDrivers.ts`**

Ensure deleted status filter is reactive:
```typescript
export function useLeagueDrivers(leagueId: Ref<number>, options: UseLeagueDriversOptions = {}) {
  const driverStore = useDriverStore();

  // Watch for deleted status filter changes (add to existing watchers)
  watch(
    () => driverStore.deletedStatusFilter,
    () => {
      loadDrivers();
    },
  );

  // ... rest of composable
}
```

### Phase 6: Public Site Verification

**Files to verify (no changes expected, just confirmation):**

1. **`resources/public/js/components/landing/StandingsRow.vue`**
   - Verify driver data displays regardless of deleted status
   - Backend must return deleted drivers in standings data

2. **`resources/public/js/components/landing/sections/HeroSection.vue`**
   - Verify any driver displays work correctly

3. **`resources/public/js/components/leagues/rounds/RoundsSection.vue`**
   - Verify race results show all drivers including deleted

4. **Result display components**
   - Search for components showing race results
   - Verify deleted drivers appear in results

### Phase 7: Admin Dashboard Verification

**File: `resources/admin/js/components/drivers/DriverDataTable.vue`**

Current state (already correct):
- Shows deleted status badge
- Can view/manage deleted drivers
- Delete button only for non-deleted

Verification:
- Confirm no changes needed
- Test that admin can still view deleted driver details
- Test that admin can see which leagues deleted driver belonged to

### Phase 8: Update Tests

**File: `resources/app/js/components/driver/__tests__/DriverTable.test.ts`**
- Add tests for deleted driver display
- Test status badge rendering
- Test filter functionality

**File: `resources/app/js/components/driver/__tests__/DriverFormDialog.test.ts`**
- May need updates if form behavior changes

**File: `resources/app/js/views/__tests__/LeagueDrivers.test.ts`** (if exists)
- Add tests for status filter
- Test filter state persistence
- Test API calls with filter params

## UI/UX Considerations

### Status Filter Placement
- Place prominently in header/toolbar area
- Use SelectButton or Dropdown component
- Clear visual indication of current filter

### Visual Indicators for Deleted Drivers
- Use Tag component with "danger" severity
- Red/muted styling to indicate deleted status
- Do NOT hide deleted drivers when viewing historical data

### Restore Button Placement
- Show restore button ONLY for deleted drivers
- Use green/success color for restore action
- Icon: `pi-refresh` or similar "undo" icon
- Place in actions column alongside other row actions

### Confirmation Dialog Updates

**Delete Confirmation:**
```
Current: "Are you sure you want to remove {name} from this league?"
New: "Are you sure you want to delete {name}? The driver will be marked as deleted but will still appear in race results and standings."
```

**Restore Confirmation:**
```
"Are you sure you want to restore {name}? The driver will be marked as active and appear in the active drivers list."
```

### Toast Messages
```
Delete: "Driver deleted successfully"
Restore: "Driver restored successfully"
```

### Action Visibility Rules

| Driver State | Delete Button | Restore Button | Edit Button |
|--------------|---------------|----------------|-------------|
| Active       | ✅ Visible    | ❌ Hidden      | ✅ Visible  |
| Deleted      | ❌ Hidden     | ✅ Visible     | ❌ Hidden   |

## Component Summary

| Component | Change Required | Priority |
|-----------|-----------------|----------|
| `LeagueDrivers.vue` | Add status filter, restore handler | High |
| `DriversView.vue` | Add status filter | High |
| `driverStore.ts` | Add deleted status state, restore action | High |
| `driverService.ts` | Add param to API call, add restore function | High |
| `DriverTable.vue` | Add deleted badge, restore button | High |
| `useLeagueDrivers.ts` | Watch filter state, add restore function | High |
| `LeagueDriversTab.vue` | Add filter, restore emit | Medium |
| `apiEndpoints.ts` | Add restore endpoint | High |
| `driver.ts` (types) | Add DriverDeletedStatus type | High |
| Public components | Verify only | Low |
| Admin components | Verify only | Low |

## Agent Assignments

### `dev-fe-app` Agent
1. Update `resources/app/js/types/driver.ts` - Add DriverDeletedStatus type
2. Update `resources/app/js/constants/apiEndpoints.ts` - Add restore endpoint
3. Update `resources/app/js/services/driverService.ts` - Add deleted_status param, add restoreDriver function
4. Update `resources/app/js/stores/driverStore.ts` - Add deleted status state, add restoreDriver action
5. Update `resources/app/js/composables/useLeagueDrivers.ts` - Watch filter state, add restoreDriver function
6. Update `resources/app/js/views/LeagueDrivers.vue` - Add status filter, add restore handler
7. Update `resources/app/js/views/season/DriversView.vue` - Add status filter
8. Update `resources/app/js/components/driver/DriverTable.vue` - Add deleted badge, add restore button
9. Update `resources/app/js/components/league/partials/LeagueDriversTab.vue` - Add restore emit
10. Update relevant tests in `resources/app/js/`

### `dev-fe-public` Agent
1. Verify `resources/public/js/components/landing/StandingsRow.vue`
2. Verify `resources/public/js/components/common/tables/cells/VrlDriverCell.vue`
3. Verify other public components showing driver data
4. Confirm no code changes needed (or make if necessary)

### `dev-fe-admin` Agent
1. Verify `resources/admin/js/components/drivers/DriverDataTable.vue`
2. Confirm existing behavior is correct
3. Make any minor adjustments if needed


## Testing Checklist

### Delete Functionality Tests
- [ ] Status filter defaults to "Active"
- [ ] Changing filter reloads driver list
- [ ] "Active" shows only non-deleted drivers
- [ ] "Deleted" shows only deleted drivers
- [ ] "All" shows both active and deleted
- [ ] Delete action soft-deletes driver
- [ ] Deleted driver shows "Deleted" badge
- [ ] Delete confirmation dialog has correct message

### Restore Functionality Tests
- [ ] Restore button only visible for deleted drivers
- [ ] Restore button hidden for active drivers
- [ ] Restore confirmation dialog shows correct message
- [ ] Restore action calls correct API endpoint
- [ ] Driver list refreshes after restore
- [ ] Restored driver appears in active list
- [ ] Success toast shows "Driver restored successfully"
- [ ] Error handling works for failed restore

### Visual Tests
- [ ] Status filter is clearly visible
- [ ] Deleted badge is styled correctly
- [ ] Restore button uses success/green styling
- [ ] Filter state persists during session
- [ ] Loading states work with filters

### Historical Data Tests
- [ ] Deleted driver appears in race results
- [ ] Deleted driver appears in standings
- [ ] Deleted driver appears in season driver list (historical view)

### Cross-Application Tests
- [ ] Public site shows deleted drivers in results
- [ ] Admin can still view deleted drivers
- [ ] Activity log shows deletion correctly
- [ ] Activity log shows restoration correctly
