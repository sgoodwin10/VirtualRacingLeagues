# Division Ordering - Frontend Implementation Plan

## Overview

This document provides a detailed implementation plan for adding drag-and-drop division ordering functionality to the Vue.js frontend. The implementation will allow users to reorder divisions via drag-and-drop in the DivisionsPanel component, with the ordering respected across all UI components that display divisions.

## Architecture Pattern

**Optimistic Update Pattern**: Update UI immediately, rollback on API failure
- Immediate visual feedback improves UX
- Prevents user confusion from delayed updates
- Graceful error handling with toast notifications

## Implementation Steps

---

## 1. Type Updates

### File: `/var/www/resources/app/js/types/division.ts`

#### 1.1 Update Division Interface

Add the `order` field to the main Division interface:

```typescript
export interface Division {
  id: number;
  season_id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  order: number; // NEW: Division order (0-indexed)
  created_at: string;
  updated_at: string;
}
```

#### 1.2 Add Reorder Payload Type

Create a new payload type for the reorder API request:

```typescript
/**
 * Reorder divisions request
 * Sends the new order as an array of division IDs
 */
export interface ReorderDivisionsPayload {
  order: number[]; // Array of division IDs in the new order
}
```

**Rationale**: The payload sends division IDs in the desired order, matching the backend API contract.

---

## 2. Service Updates

### File: `/var/www/resources/app/js/services/divisionService.ts`

#### 2.1 Add Reorder Function

Add a new function to handle the reorder API call:

```typescript
/**
 * Reorder divisions
 * @param seasonId - Season ID
 * @param payload - New division order (array of division IDs)
 */
export async function reorderDivisions(
  seasonId: number,
  payload: ReorderDivisionsPayload,
): Promise<Division[]> {
  const response: AxiosResponse<ApiResponse<Division[]>> = await apiClient.post(
    API_ENDPOINTS.seasons.reorderDivisions(seasonId),
    payload,
  );
  return response.data.data;
}
```

**Notes**:
- Returns the updated divisions array from the backend
- Backend returns divisions with updated `order` values
- Follows existing service patterns (async/await, typed response)

---

## 3. API Endpoints Constants

### File: `/var/www/resources/app/js/constants/apiEndpoints.ts`

#### 3.1 Add Reorder Endpoint

Add the new endpoint to the `seasons` object:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints ...

  seasons: {
    // ... existing season endpoints ...
    divisions: (seasonId: number) => `/seasons/${seasonId}/divisions`,
    divisionDetail: (seasonId: number, divisionId: number) =>
      `/seasons/${seasonId}/divisions/${divisionId}`,
    reorderDivisions: (seasonId: number) => `/seasons/${seasonId}/divisions/reorder`, // NEW
    divisionDriverCount: (seasonId: number, divisionId: number) =>
      `/seasons/${seasonId}/divisions/${divisionId}/driver-count`,
    // ... rest of season endpoints ...
  },
} as const;
```

---

## 4. Store Updates

### File: `/var/www/resources/app/js/stores/divisionStore.ts`

#### 4.1 Add Sorted Divisions Getter

Add a computed getter that returns divisions sorted by the `order` field:

```typescript
// Add to imports
import { reorderDivisions as reorderDivisionsApi } from '@app/services/divisionService';

// Add after existing getters (around line 58)

/**
 * Get divisions sorted by order field
 */
const sortedDivisions = computed(() => {
  return [...divisions.value].sort((a, b) => a.order - b.order);
});
```

**Rationale**:
- Always returns divisions in the correct order
- Components can use `sortedDivisions` instead of `divisions` to respect ordering
- Reactive - updates automatically when divisions or order changes

#### 4.2 Add Reorder Action with Optimistic Update

Add a new action to handle reordering with optimistic UI update pattern:

```typescript
/**
 * Reorder divisions with optimistic update
 * Updates UI immediately, rolls back on error
 */
async function reorderDivisions(
  seasonId: number,
  newOrder: number[], // Array of division IDs in new order
): Promise<void> {
  // Store the original divisions for rollback
  const previousDivisions = [...divisions.value];

  setLoading(true);
  setError(null);

  try {
    // Optimistic update: Update the order field in local state immediately
    const updatedDivisions = divisions.value.map((division) => {
      const newOrderIndex = newOrder.indexOf(division.id);
      return newOrderIndex !== -1
        ? { ...division, order: newOrderIndex }
        : division;
    });

    // Apply optimistic update
    setItems(updatedDivisions);

    // Make API call
    const payload: ReorderDivisionsPayload = { order: newOrder };
    const serverDivisions = await reorderDivisionsApi(seasonId, payload);

    // Update with server response (in case of any differences)
    setItems(serverDivisions);
  } catch (err: unknown) {
    // Rollback to previous state on error
    setItems(previousDivisions);

    const errorMessage = err instanceof Error ? err.message : 'Failed to reorder divisions';
    setError(errorMessage);
    throw err;
  } finally {
    setLoading(false);
  }
}
```

**Optimistic Update Flow**:
1. **Store Original State**: Keep a copy for rollback
2. **Update UI Immediately**: Apply new order locally without waiting for API
3. **Call API**: Send request to backend
4. **Update from Server**: Replace local state with server response (source of truth)
5. **Rollback on Error**: Restore original state if API fails

#### 4.3 Export New Getter and Action

Update the return statement to include the new getter and action:

```typescript
return {
  // State
  divisions,
  loading,
  error,

  // Getters
  getDivisionById,
  getDivisionsBySeasonId,
  divisionCount,
  hasDivisions,
  sortedDivisions, // NEW

  // Actions
  fetchDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  reorderDivisions, // NEW
  getDriverCount,
  assignDriverDivision,

  // Utility
  clearError,
  resetStore,
};
```

---

## 5. DivisionsPanel Component Updates

### File: `/var/www/resources/app/js/components/season/divisions/DivisionsPanel.vue`

#### 5.1 Install PrimeVue Row Reorder Dependencies

**Note**: PrimeVue DataTable has built-in row reorder support. No additional libraries needed.

#### 5.2 Update Script Setup

```typescript
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useDivisionStore } from '@app/stores/divisionStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import type { Division } from '@app/types/division';
import type { DataTableRowReorderEvent } from 'primevue/datatable'; // NEW

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { PhPlus, PhDotsSixVertical } from '@phosphor-icons/vue'; // PhDotsSixVertical NEW

import DivisionFormModal from './DivisionFormModal.vue';

// ... existing Props interface ...

const confirm = useConfirm();
const toast = useToast();
const divisionStore = useDivisionStore();
const seasonDriverStore = useSeasonDriverStore();

const showDivisionModal = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const selectedDivision = ref<Division | null>(null);
const isReordering = ref(false); // NEW: Track reordering state

// Use sortedDivisions from store for proper ordering
const divisions = computed(() => divisionStore.sortedDivisions); // CHANGED
const loading = computed(() => divisionStore.loading);

// ... existing onMounted, loadDivisions, handle functions ...

/**
 * Handle row reorder event from DataTable
 */
async function handleRowReorder(event: DataTableRowReorderEvent): Promise<void> {
  isReordering.value = true;

  try {
    // Extract the new order of division IDs
    const newOrder = event.value.map((division: Division) => division.id);

    // Call store action to reorder (optimistic update)
    await divisionStore.reorderDivisions(props.seasonId, newOrder);

    // Success toast
    toast.add({
      severity: 'success',
      summary: 'Order Updated',
      detail: 'Division order has been updated successfully',
      life: 3000,
    });
  } catch (error: unknown) {
    // Error toast (state already rolled back by store)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update division order';
    toast.add({
      severity: 'error',
      summary: 'Reorder Failed',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isReordering.value = false;
  }
}

// ... rest of existing functions ...
</script>
```

#### 5.3 Update Template

Update the DataTable to enable row reordering:

```vue
<template>
  <div>
    <!-- ... existing disabled state ... -->

    <!-- Enabled State -->
    <div v-else>
      <!-- Header Row -->
      <div class="mb-3">
        <span class="text-sm text-gray-600">
          {{ divisions.length }} division{{ divisions.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- DataTable with Row Reorder -->
      <DataTable
        :value="divisions"
        :loading="loading || isReordering"
        :reorderableRows="true"
        @row-reorder="handleRowReorder"
        striped-rows
        responsive-layout="scroll"
        class="text-sm"
      >
        <template #empty>
          <div class="text-center py-8">
            <i class="pi pi-trophy text-3xl text-gray-400 mb-2"></i>
            <p class="text-gray-600">No divisions created yet</p>
            <p class="text-sm text-gray-500 mt-1">
              Click "Add Division" to create your first division
            </p>
          </div>
        </template>

        <template #loading>
          <div class="text-center py-6 text-gray-500">
            {{ isReordering ? 'Updating order...' : 'Loading divisions...' }}
          </div>
        </template>

        <!-- NEW: Drag Handle Column -->
        <Column :rowReorder="true" headerStyle="width: 3rem" :reorderableColumn="false">
          <template #body>
            <PhDotsSixVertical
              :size="20"
              class="cursor-grab text-gray-400 hover:text-gray-600 transition-colors"
            />
          </template>
        </Column>

        <!-- Division Name Column (with logo and description) -->
        <Column field="name" header="Division">
          <template #body="{ data }">
            <div class="flex items-start gap-2">
              <img
                v-if="data.logo_url"
                :src="data.logo_url"
                :alt="data.name"
                class="w-8 h-8 rounded object-cover flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="font-semibold">{{ data.name }}</p>
                <p v-if="data.description" class="text-xs text-gray-500 mt-1 truncate">
                  {{ truncateDescription(data.description, 50) }}
                </p>
              </div>
            </div>
          </template>
        </Column>

        <!-- Actions Column (edit, delete) -->
        <Column header="Actions" :exportable="false" style="width: 8rem">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                icon="pi pi-pencil"
                size="small"
                outlined
                severity="secondary"
                :disabled="isReordering"
                @click="handleEditDivision(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                outlined
                severity="danger"
                :disabled="isReordering"
                @click="handleDeleteDivision(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <!-- Add Division Button (footer) -->
      <div v-if="raceDivisionsEnabled" class="mt-2">
        <button
          type="button"
          class="flex items-center justify-center gap-2 w-full p-2 bg-white rounded border-2 border-dashed border-slate-300 hover:border-primary-400 hover:bg-primary-50/20 transition-all cursor-pointer group text-slate-500 hover:text-primary-600"
          :disabled="isReordering"
          @click.stop="handleAddDivision"
        >
          <PhPlus :size="16" weight="bold" class="text-slate-400 group-hover:text-primary-500" />
          <span class="text-sm font-medium">Add Division</span>
        </button>
      </div>
    </div>

    <!-- ... existing DivisionFormModal ... -->
  </div>
</template>
```

**Key Changes**:
1. `:reorderableRows="true"` - Enables row reordering on DataTable
2. `@row-reorder="handleRowReorder"` - Event handler for reorder
3. New Column with `:rowReorder="true"` - Adds drag handle column
4. `PhDotsSixVertical` icon for drag handle (6 vertical dots)
5. `isReordering` state disables actions during reorder operation
6. Loading message changes based on operation type

**Visual Feedback**:
- Drag handle shows on hover (cursor-grab)
- Buttons disabled during reorder
- Loading message indicates "Updating order..." during reorder
- Toast notifications for success/failure

---

## 6. Other Component Updates

### 6.1 ResultDivisionTabs Component

**File**: `/var/www/resources/app/js/components/result/ResultDivisionTabs.vue`

**Status**: ✅ **No changes required**

**Rationale**: This component receives `divisions` as a prop from parent. The parent component should pass sorted divisions from the store.

**Parent component responsibility**: Ensure divisions are passed in sorted order.

**Example parent usage**:
```typescript
// In parent component
const divisions = computed(() => divisionStore.sortedDivisions);
```

### 6.2 RoundResultsModal Component

**File**: `/var/www/resources/app/js/components/round/modals/RoundResultsModal.vue`

**Update Required**: ✅ **Verify divisions are sorted**

The component receives divisions from the API response. Backend must return divisions sorted by `order`.

**Backend responsibility**: API endpoint `/rounds/{roundId}/results` must return divisions sorted by `order` field.

**Frontend verification** (if needed):
```typescript
// If backend doesn't guarantee order, sort locally:
const sortedDivisions = computed(() => {
  return [...divisions.value].sort((a, b) => a.order - b.order);
});
```

### 6.3 SeasonStandingsPanel Component

**File**: `/var/www/resources/app/js/components/season/panels/SeasonStandingsPanel.vue`

**Update Required**: ✅ **Verify divisions are sorted**

Similar to RoundResultsModal - relies on API response from `/seasons/{seasonId}/standings`.

**Backend responsibility**: Ensure API returns divisions sorted by `order`.

**Frontend verification** (if needed):
```typescript
// Sort divisions if backend doesn't guarantee order
const divisionsWithStandings = computed(() => {
  if (!standingsData.value || !isDivisionStandings(standingsData.value.standings)) {
    return [];
  }
  return [...standingsData.value.standings].sort((a, b) => {
    // Assuming division data includes order field
    return (a.order ?? 0) - (b.order ?? 0);
  });
});
```

---

## 7. UI/UX Details

### 7.1 Drag Handle Icon

**Icon**: `PhDotsSixVertical` from `@phosphor-icons/vue`
- Size: 20px
- Color: Gray-400 (default), Gray-600 (hover)
- Cursor: `cursor-grab` (indicates draggable)

**Rationale**:
- Six vertical dots is a universally recognized drag handle pattern
- Phosphor Icons already used throughout the app
- Consistent with existing icon system

### 7.2 Visual Feedback During Drag

**PrimeVue DataTable provides built-in drag feedback**:
- Row elevation during drag
- Placeholder/drop zone indicator
- Smooth animations

**Additional custom styling** (optional):
```css
/* Add to component <style scoped> if needed */
.p-datatable .p-datatable-tbody > tr.p-datatable-dragpoint-top > td {
  border-top: 2px solid var(--primary-color);
}

.p-datatable .p-datatable-tbody > tr.p-datatable-dragpoint-bottom > td {
  border-bottom: 2px solid var(--primary-color);
}
```

### 7.3 Toast Notifications

**Success Toast**:
```typescript
toast.add({
  severity: 'success',
  summary: 'Order Updated',
  detail: 'Division order has been updated successfully',
  life: 3000,
});
```

**Error Toast**:
```typescript
toast.add({
  severity: 'error',
  summary: 'Reorder Failed',
  detail: errorMessage,
  life: 5000, // Longer duration for errors
});
```

### 7.4 Disable Actions During Reorder

**Disabled elements**:
- Edit button (`:disabled="isReordering"`)
- Delete button (`:disabled="isReordering"`)
- Add Division button (`:disabled="isReordering"`)
- DataTable loading state shows "Updating order..."

**Rationale**: Prevents conflicting operations during reorder API call.

---

## 8. Testing Strategy

### 8.1 Store Unit Tests

**File**: `/var/www/resources/app/js/stores/__tests__/divisionStore.test.ts`

**New Tests**:

```typescript
describe('Division Store - Reordering', () => {
  describe('sortedDivisions getter', () => {
    it('returns divisions sorted by order field', () => {
      divisionStore.divisions = [
        { id: 1, name: 'Division B', order: 1, /* ... */ },
        { id: 2, name: 'Division A', order: 0, /* ... */ },
        { id: 3, name: 'Division C', order: 2, /* ... */ },
      ];

      const sorted = divisionStore.sortedDivisions;

      expect(sorted[0].name).toBe('Division A'); // order: 0
      expect(sorted[1].name).toBe('Division B'); // order: 1
      expect(sorted[2].name).toBe('Division C'); // order: 2
    });

    it('handles empty divisions array', () => {
      divisionStore.divisions = [];
      expect(divisionStore.sortedDivisions).toEqual([]);
    });
  });

  describe('reorderDivisions action', () => {
    it('performs optimistic update', async () => {
      const initialDivisions = [
        { id: 1, name: 'Division A', order: 0, /* ... */ },
        { id: 2, name: 'Division B', order: 1, /* ... */ },
      ];
      divisionStore.divisions = initialDivisions;

      // Mock API call (doesn't resolve immediately)
      const apiPromise = new Promise((resolve) => {
        setTimeout(() => resolve([
          { id: 2, name: 'Division B', order: 0 },
          { id: 1, name: 'Division A', order: 1 },
        ]), 100);
      });
      vi.spyOn(divisionService, 'reorderDivisions').mockReturnValue(apiPromise);

      // Trigger reorder
      const reorderPromise = divisionStore.reorderDivisions(1, [2, 1]);

      // Check optimistic update happened immediately
      await nextTick();
      expect(divisionStore.sortedDivisions[0].id).toBe(2);
      expect(divisionStore.sortedDivisions[1].id).toBe(1);

      // Wait for API to complete
      await reorderPromise;

      // Verify final state matches server response
      expect(divisionStore.sortedDivisions[0].id).toBe(2);
      expect(divisionStore.sortedDivisions[0].order).toBe(0);
    });

    it('rolls back on API error', async () => {
      const initialDivisions = [
        { id: 1, name: 'Division A', order: 0, /* ... */ },
        { id: 2, name: 'Division B', order: 1, /* ... */ },
      ];
      divisionStore.divisions = [...initialDivisions];

      // Mock API failure
      vi.spyOn(divisionService, 'reorderDivisions').mockRejectedValue(
        new Error('Network error')
      );

      // Attempt reorder
      await expect(
        divisionStore.reorderDivisions(1, [2, 1])
      ).rejects.toThrow('Network error');

      // Verify rollback to original state
      expect(divisionStore.divisions).toEqual(initialDivisions);
      expect(divisionStore.sortedDivisions[0].id).toBe(1);
      expect(divisionStore.error).toBe('Network error');
    });

    it('calls API with correct payload', async () => {
      vi.spyOn(divisionService, 'reorderDivisions').mockResolvedValue([]);

      await divisionStore.reorderDivisions(123, [3, 1, 2]);

      expect(divisionService.reorderDivisions).toHaveBeenCalledWith(
        123,
        { order: [3, 1, 2] }
      );
    });
  });
});
```

### 8.2 Component Tests

**File**: `/var/www/resources/app/js/components/season/divisions/__tests__/DivisionsPanel.test.ts`

**New Tests**:

```typescript
describe('DivisionsPanel - Reordering', () => {
  it('renders drag handle column', async () => {
    divisionStore.divisions = mockDivisions;
    wrapper = createWrapper({ raceDivisionsEnabled: true });

    await wrapper.vm.$nextTick();

    // Check for drag handle icon (PhDotsSixVertical)
    expect(wrapper.findComponent(PhDotsSixVertical).exists()).toBe(true);
  });

  it('enables row reordering on DataTable', () => {
    wrapper = createWrapper({ raceDivisionsEnabled: true });

    const dataTable = wrapper.findComponent(DataTable);
    expect(dataTable.props('reorderableRows')).toBe(true);
  });

  it('handles row reorder event', async () => {
    divisionStore.divisions = mockDivisions;
    vi.spyOn(divisionStore, 'reorderDivisions').mockResolvedValue();

    wrapper = createWrapper({ raceDivisionsEnabled: true });

    const dataTable = wrapper.findComponent(DataTable);

    // Simulate row reorder (swap first two divisions)
    await dataTable.vm.$emit('row-reorder', {
      value: [mockDivisions[1], mockDivisions[0]],
    });

    expect(divisionStore.reorderDivisions).toHaveBeenCalledWith(
      1,
      [2, 1] // New order: Division 2, Division 1
    );
  });

  it('shows success toast on successful reorder', async () => {
    const toastAdd = vi.fn();
    vi.spyOn(divisionStore, 'reorderDivisions').mockResolvedValue();
    vi.mocked(useToast).mockReturnValue({ add: toastAdd });

    wrapper = createWrapper({ raceDivisionsEnabled: true });

    const dataTable = wrapper.findComponent(DataTable);
    await dataTable.vm.$emit('row-reorder', { value: [mockDivisions[1]] });

    await wrapper.vm.$nextTick();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Order Updated',
      })
    );
  });

  it('shows error toast on failed reorder', async () => {
    const toastAdd = vi.fn();
    vi.spyOn(divisionStore, 'reorderDivisions').mockRejectedValue(
      new Error('API Error')
    );
    vi.mocked(useToast).mockReturnValue({ add: toastAdd });

    wrapper = createWrapper({ raceDivisionsEnabled: true });

    const dataTable = wrapper.findComponent(DataTable);
    await dataTable.vm.$emit('row-reorder', { value: [mockDivisions[1]] });

    await wrapper.vm.$nextTick();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Reorder Failed',
      })
    );
  });

  it('disables actions during reordering', async () => {
    // Mock slow API call
    const slowPromise = new Promise((resolve) => setTimeout(resolve, 1000));
    vi.spyOn(divisionStore, 'reorderDivisions').mockReturnValue(slowPromise);

    wrapper = createWrapper({ raceDivisionsEnabled: true });

    const dataTable = wrapper.findComponent(DataTable);
    dataTable.vm.$emit('row-reorder', { value: mockDivisions });

    await wrapper.vm.$nextTick();

    // Check that buttons are disabled
    const buttons = wrapper.findAllComponents(Button);
    buttons.forEach((button) => {
      expect(button.props('disabled')).toBe(true);
    });
  });

  it('uses sortedDivisions from store', async () => {
    // Set unsorted divisions in store
    divisionStore.divisions = [
      { id: 2, order: 1, name: 'Second', /* ... */ },
      { id: 1, order: 0, name: 'First', /* ... */ },
    ];

    wrapper = createWrapper({ raceDivisionsEnabled: true });

    await wrapper.vm.$nextTick();

    // Verify component displays sorted divisions
    const displayedDivisions = wrapper.vm.divisions;
    expect(displayedDivisions[0].name).toBe('First');
    expect(displayedDivisions[1].name).toBe('Second');
  });
});
```

### 8.3 Service Tests

**File**: `/var/www/resources/app/js/services/__tests__/divisionService.test.ts`

**New Tests**:

```typescript
describe('divisionService - reorderDivisions', () => {
  it('calls correct API endpoint with payload', async () => {
    const mockResponse = {
      data: {
        data: [
          { id: 2, order: 0, /* ... */ },
          { id: 1, order: 1, /* ... */ },
        ],
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const result = await reorderDivisions(123, { order: [2, 1] });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/seasons/123/divisions/reorder',
      { order: [2, 1] }
    );
    expect(result).toEqual(mockResponse.data.data);
  });

  it('handles API errors', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      new Error('Network error')
    );

    await expect(
      reorderDivisions(123, { order: [1, 2] })
    ).rejects.toThrow('Network error');
  });
});
```

---

## 9. Accessibility Considerations

### 9.1 Keyboard Navigation

**PrimeVue DataTable row reorder support**:
- ✅ Keyboard navigation built-in
- Arrow keys to navigate rows
- Space/Enter to pick up/drop rows

**Additional ARIA attributes** (if needed):
```vue
<Column :rowReorder="true">
  <template #body>
    <PhDotsSixVertical
      :size="20"
      role="button"
      tabindex="0"
      aria-label="Drag to reorder division"
      class="cursor-grab"
    />
  </template>
</Column>
```

### 9.2 Screen Reader Support

**Announcements**:
- Success toast: "Order Updated. Division order has been updated successfully"
- Error toast: "Reorder Failed. [Error message]"
- Loading state: "Updating order..." (announced by screen readers)

---

## 10. Edge Cases and Error Handling

### 10.1 Network Failure

**Handling**:
- Optimistic update immediately shows new order
- On API failure: Rollback to previous state
- Show error toast with details
- User can retry manually

### 10.2 Concurrent Edits

**Scenario**: User A reorders divisions while User B creates/deletes a division

**Handling**:
- Backend validation ensures consistency
- Frontend refetches divisions after create/delete operations
- Optimistic update only affects current user's UI
- Server response is the source of truth

### 10.3 Empty State

**Scenario**: No divisions exist

**Handling**:
- Drag handle column not shown (no rows to reorder)
- "Add Division" button is the primary action
- Empty state message guides user

### 10.4 Single Division

**Scenario**: Only one division exists

**Handling**:
- Drag handle is shown but dragging has no effect
- User can still add more divisions
- No validation errors

---

## 11. Performance Considerations

### 11.1 Optimistic Update Performance

**Benefits**:
- Immediate UI feedback (no waiting for API)
- Perceived performance improvement
- Better UX during slow network conditions

**Trade-offs**:
- Temporary inconsistency if API fails
- Rollback can be jarring if user continues interacting
- Mitigated by: Disabling actions during reorder

### 11.2 Reactivity Performance

**Computed `sortedDivisions`**:
- Runs on every divisions array change
- Efficient: Shallow copy + sort is fast for small arrays
- Divisions typically < 10 items per season
- No performance concerns

---

## 12. Implementation Checklist

### Phase 1: Types and Services
- [ ] Add `order` field to Division interface
- [ ] Add ReorderDivisionsPayload type
- [ ] Add reorderDivisions service function
- [ ] Add reorderDivisions API endpoint constant
- [ ] Write unit tests for service function

### Phase 2: Store Updates
- [ ] Add sortedDivisions computed getter
- [ ] Add reorderDivisions action with optimistic update
- [ ] Export new getter and action
- [ ] Write unit tests for sortedDivisions getter
- [ ] Write unit tests for reorderDivisions action (optimistic update + rollback)

### Phase 3: DivisionsPanel Component
- [ ] Import PhDotsSixVertical icon
- [ ] Add isReordering state
- [ ] Change divisions computed to use sortedDivisions
- [ ] Add handleRowReorder function
- [ ] Add drag handle column to DataTable
- [ ] Enable reorderableRows on DataTable
- [ ] Add @row-reorder event handler
- [ ] Update loading message based on isReordering state
- [ ] Disable actions during reorder
- [ ] Write component tests for reordering functionality

### Phase 4: Other Components
- [ ] Verify ResultDivisionTabs uses sorted divisions
- [ ] Verify RoundResultsModal displays divisions in correct order
- [ ] Verify SeasonStandingsPanel displays divisions in correct order
- [ ] Update parent components to pass sortedDivisions if needed

### Phase 5: Testing and Refinement
- [ ] Run all unit tests (`npm run test:app`)
- [ ] Manual testing: Drag and drop divisions
- [ ] Test optimistic update (inspect UI before API completes)
- [ ] Test rollback (simulate API failure)
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test keyboard navigation
- [ ] Test screen reader announcements
- [ ] Test empty state
- [ ] Test single division
- [ ] Run TypeScript checks (`npm run type-check`)
- [ ] Run linter (`npm run lint:app`)
- [ ] Run formatter (`npm run format:app`)

### Phase 6: Documentation
- [ ] Update component README if needed
- [ ] Add JSDoc comments to new functions
- [ ] Document any breaking changes
- [ ] Update this implementation plan with any learnings

---

## 13. Example Usage Flow

### User Interaction Flow

1. **User navigates to Season Details page**
   - DivisionsPanel loads divisions from API
   - Divisions displayed in order (sorted by `order` field)

2. **User hovers over division row**
   - Drag handle (6 vertical dots) becomes visible
   - Cursor changes to `grab`

3. **User drags division to new position**
   - Row elevates during drag (visual feedback)
   - Drop zone indicator shows where row will be placed
   - Other rows shift to make space

4. **User drops division**
   - DataTable emits `@row-reorder` event
   - `handleRowReorder` function executes:
     - UI updates immediately (optimistic update)
     - API call sent to backend
     - Success toast shown
     - Loading state clears

5. **If API fails**
   - UI rolls back to previous order
   - Error toast shown with details
   - User can retry

---

## 14. Dependencies

### Required Packages

All packages already installed:
- ✅ `primevue` (v4.x) - DataTable with row reorder
- ✅ `@phosphor-icons/vue` - PhDotsSixVertical icon
- ✅ `pinia` - State management
- ✅ `axios` - HTTP client
- ✅ `vitest` - Testing framework
- ✅ `@vue/test-utils` - Component testing

**No additional dependencies required**.

---

## 15. Related Backend Requirements

**This frontend plan assumes the backend provides**:

1. **API Endpoint**: `POST /api/seasons/{season}/divisions/reorder`
   - Request payload: `{ "order": [3, 1, 2] }` (array of division IDs)
   - Response: Updated divisions array with `order` field

2. **Division Model**: Includes `order` field (integer, 0-indexed)

3. **Sorted Divisions**: All API responses return divisions sorted by `order`:
   - `GET /api/seasons/{season}/divisions`
   - `GET /api/rounds/{round}/results`
   - `GET /api/seasons/{season}/standings`

**See**: `docs/AppDashboard/DivisionOrdering/backend.md` for backend implementation details.

---

## 16. Future Enhancements

### Potential Improvements (Out of Scope for Initial Implementation)

1. **Undo/Redo**: Add undo button after reorder
2. **Batch Reorder**: Allow multiple drag operations before saving
3. **Visual Preview**: Show order numbers during drag
4. **Animations**: Smooth transitions when order changes
5. **Auto-save Indicator**: Show "Saving..." vs "Saved" status
6. **Conflict Resolution**: Handle concurrent reorder operations from multiple users

---

## 17. Summary

This implementation adds drag-and-drop division ordering using:

- **PrimeVue DataTable** built-in row reorder feature
- **Optimistic update pattern** for immediate UI feedback
- **Pinia store** for centralized state management
- **Sorted divisions getter** for consistent ordering across all components
- **Comprehensive error handling** with rollback on failure
- **Toast notifications** for user feedback
- **Accessible** drag handle with keyboard support

**Benefits**:
- Intuitive UX (drag-and-drop is familiar)
- Fast UI updates (optimistic updates)
- Reliable (rollback on errors)
- Maintainable (follows existing patterns)
- Testable (comprehensive test coverage)
- Accessible (keyboard navigation + screen reader support)

**Estimated Implementation Time**: 4-6 hours
- Phase 1-2 (Types, Services, Store): 1-2 hours
- Phase 3 (Component Updates): 2-3 hours
- Phase 4-5 (Testing): 1-2 hours

---

## Appendix A: PrimeVue DataTable Row Reorder Reference

**Official Documentation**: https://primevue.org/datatable/#row_reorder

**Key Props**:
- `:reorderableRows="true"` - Enables row reordering
- `@row-reorder="handler"` - Event emitted when rows are reordered

**Event Payload** (`DataTableRowReorderEvent`):
```typescript
interface DataTableRowReorderEvent {
  originalEvent: Event;      // Original DOM event
  value: any[];              // New array of items in reordered sequence
  dragIndex: number;         // Index of dragged row
  dropIndex: number;         // Index where row was dropped
}
```

**Column Configuration**:
```vue
<Column :rowReorder="true" headerStyle="width: 3rem" />
```

**Built-in Features**:
- Visual feedback during drag (row elevation)
- Drop zone indicators
- Keyboard navigation support
- Touch device support

---

## Appendix B: TypeScript Type Definitions

**Complete type definitions for reference**:

```typescript
// Division with order field
export interface Division {
  id: number;
  season_id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

// Reorder payload
export interface ReorderDivisionsPayload {
  order: number[];
}

// DataTable row reorder event (from PrimeVue)
interface DataTableRowReorderEvent {
  originalEvent: Event;
  value: any[];
  dragIndex: number;
  dropIndex: number;
}
```

---

**End of Implementation Plan**
