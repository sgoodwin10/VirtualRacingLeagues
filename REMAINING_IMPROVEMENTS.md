# Remaining User Dashboard Improvements

This document outlines the remaining improvements for the user dashboard (`resources/app`) as part of the comprehensive refactoring plan.

## ✅ Completed Tasks

### Phase 1: Foundation & Testing (COMPLETE)
- ✅ Add tests for `useProfileForm` composable (45 tests)
- ✅ Add tests for `useSeasonValidation` composable (51 tests)
- ✅ Add tests for `useSeasonDriverValidation` composable (20 tests)
- ✅ Add tests for `useRoundValidation` composable (54 tests)
- ✅ Add tests for `useRaceValidation` composable (37 tests)
- ✅ Create `useAsyncData` composable (76 lines + 11 tests)
- ✅ Create `useStoreEvents` composable (98 lines + 12 tests)
- ✅ Create API endpoints constants file (118 lines, 80+ endpoints)
- ✅ Update all 14 service files to use centralized endpoints
- ✅ Decouple `seasonStore` from `competitionStore` using events

**Total: 230 new tests, ~900 lines of production code changed**

---

## ⏳ Remaining Tasks

### Priority 1: High-Impact Refactoring (Medium Priority)

#### 1. Extract LeagueDetail.vue into Smaller Components
**Estimated Effort:** 6-8 hours
**Current State:** 892 lines in single file
**Target State:** ~200 lines main file + 6 new components

**Components to Create:**
- `resources/app/js/components/league/partials/LeagueHeader.vue`
  - Header image, logo, visibility tag, title, edit button
  - Props: `{ league: League, onEdit: () => void }`

- `resources/app/js/components/league/partials/LeagueStatsBar.vue`
  - Platform icons, timezone, competition count, driver count
  - Props: `{ league: League }`

- `resources/app/js/components/league/partials/LeagueAboutPanel.vue`
  - Description panel
  - Props: `{ description: string | null }`

- `resources/app/js/components/league/partials/LeagueContactPanel.vue`
  - Organizer name, contact email
  - Props: `{ organizerName: string, contactEmail: string | null }`

- `resources/app/js/components/league/partials/LeagueSocialMediaPanel.vue`
  - Social media links, created/updated dates
  - Props: `{ league: League }`

- `resources/app/js/components/league/partials/LeagueDriversTab.vue`
  - Search/filter toolbar, driver table, import/add buttons
  - Props: `{ leagueId: number }`
  - Emits: `{ addDriver, importCSV, viewDriver, editDriver, removeDriver }`

**Benefits:**
- Improved maintainability (smaller, focused components)
- Better testability (isolated component tests)
- Easier to understand and modify
- Reusable components

---

#### 2. Create useLeagueDrivers Composable
**Estimated Effort:** 3-4 hours
**Dependencies:** Should be done alongside LeagueDetail extraction

**Location:** `resources/app/js/composables/useLeagueDrivers.ts`

**Purpose:** Extract driver management logic from LeagueDetail.vue

**Functionality to Extract:**
- Driver loading logic (currently lines 160-171 in LeagueDetail.vue)
- Search debouncing (currently lines 94-105)
- Filter watching (currently lines 108-125)
- Driver CRUD operations (currently lines 201-346)
- CSV import logic (currently lines 305-338)

**Interface:**
```typescript
export function useLeagueDrivers(leagueId: Ref<number>) {
  return {
    // State
    drivers: Ref<Driver[]>,
    isLoading: Ref<boolean>,
    searchQuery: Ref<string>,
    selectedStatus: Ref<string>,

    // Methods
    loadDrivers: () => Promise<void>,
    addDriver: (data: CreateDriverData) => Promise<void>,
    updateDriver: (id: number, data: UpdateDriverData) => Promise<void>,
    removeDriver: (id: number) => Promise<void>,
    importFromCSV: (csv: string) => Promise<void>,
  }
}
```

**Benefits:**
- Reusable driver management logic
- Testable in isolation
- Cleaner view components
- Separation of concerns

---

#### 3. Create useCrudStore Composable
**Estimated Effort:** 4-5 hours
**Current State:** Duplicate CRUD patterns in 9+ stores
**Impact:** Reduce ~200 lines of duplicated code

**Location:** `resources/app/js/composables/useCrudStore.ts`

**Purpose:** Generic CRUD store pattern for all entity stores

**Interface:**
```typescript
export function useCrudStore<T extends { id: number }>() {
  const items = ref<T[]>([]);
  const currentItem = ref<T | null>(null);
  const { loading, error, execute, clearError } = useAsyncData<T>();

  function addItem(item: T) {
    items.value.push(item);
  }

  function updateItemInList(updatedItem: T) {
    const index = items.value.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      items.value[index] = updatedItem;
    }
    if (currentItem.value?.id === updatedItem.id) {
      currentItem.value = updatedItem;
    }
  }

  function removeItemFromList(itemId: number) {
    items.value = items.value.filter(i => i.id !== itemId);
    if (currentItem.value?.id === itemId) {
      currentItem.value = null;
    }
  }

  function resetStore() {
    items.value = [];
    currentItem.value = null;
    clearError();
  }

  return {
    items,
    currentItem,
    loading,
    error,
    execute,
    addItem,
    updateItemInList,
    removeItemFromList,
    clearError,
    resetStore,
  };
}
```

**Stores to Refactor:**
1. `leagueStore.ts`
2. `competitionStore.ts`
3. `seasonStore.ts`
4. `driverStore.ts`
5. `roundStore.ts`
6. `raceStore.ts`
7. `teamStore.ts`
8. `divisionStore.ts`
9. `trackStore.ts`

**Benefits:**
- Eliminates ~200 lines of duplicate code
- Consistent patterns across all stores
- Easier to add new stores
- Reduces bugs from copy-paste errors

---

#### 4. Standardize Nullable Type Patterns
**Estimated Effort:** 4-6 hours
**Files to Update:** 16 type files
**Current State:** Inconsistent mix of `field?: type`, `field: type | null`, `field?: type | null`

**Standardization Rules:**
- **API response types**: Use `field: type | null` (backend may return null)
- **Form input types**: Use `field?: type` (user may not provide)
- **Update/partial types**: Use `field?: type | null` (can be omitted, provided, or cleared)

**Files to Standardize:**
1. `types/season.ts` - Lines 108-128
2. `types/competition.ts` - Lines 82-92, 114-118
3. `types/division.ts` - Lines 23-33, 57-59
4. `types/race.ts` - Lines 69-95, 139-146
5. `types/round.ts` - Lines 30-31
6. `types/league.ts` - Multiple instances
7. `types/driver.ts` - Multiple instances
8. `types/user.ts` - Lines 6-8
9. `types/seasonDriver.ts` - Multiple instances
10. `types/team.ts` - Multiple instances
11. `types/track.ts` - Optional fields
12. `types/raceSettings.ts` - Optional fields
13. `types/siteConfig.ts` - Optional fields
14. `types/auth.ts` - Optional fields
15. `types/errors.ts` - Error types
16. Form types in all the above

**Process:**
1. Create type standardization guide document
2. Update types file by file
3. Run `npm run type-check` after each file
4. Fix any TypeScript errors that arise
5. Update tests to match new types

**Benefits:**
- Consistent type patterns across codebase
- Clearer intent (required vs optional vs nullable)
- Better type safety
- Easier for new developers to understand

---

#### 5. Create useDebouncedSearch Composable
**Estimated Effort:** 2-3 hours
**Current State:** Search debouncing implemented inline in LeagueDetail.vue

**Location:** `resources/app/js/composables/useDebouncedSearch.ts`

**Purpose:** Reusable search debouncing with request cancellation

**Interface:**
```typescript
export function useDebouncedSearch(
  searchQuery: Ref<string>,
  onSearch: (query: string, signal: AbortSignal) => Promise<void>,
  delay = 300
) {
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;

  const isSearching = ref(false);

  watch(searchQuery, (newValue) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Cancel previous request
    if (abortController) {
      abortController.abort();
    }

    // Debounce search
    searchTimeout = setTimeout(async () => {
      abortController = new AbortController();
      isSearching.value = true;

      try {
        await onSearch(newValue, abortController.signal);
      } catch (error) {
        if (error.name !== 'AbortError') {
          throw error;
        }
      } finally {
        isSearching.value = false;
      }
    }, delay);
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    if (abortController) {
      abortController.abort();
    }
  });

  return {
    isSearching: readonly(isSearching),
  };
}
```

**Benefits:**
- Reusable across all search implementations
- Prevents race conditions
- Automatic cleanup
- Cancels unnecessary requests

**Places to Use:**
- LeagueDetail.vue driver search
- Any future search functionality

---

#### 6. Implement Request Cancellation with AbortController
**Estimated Effort:** 3-4 hours
**Dependencies:** Requires `useDebouncedSearch` composable

**Files to Update:**
1. `services/api.ts` - Add signal support to apiClient methods
2. Update service methods used in search/filter operations to accept AbortSignal
3. Update components using search to use `useDebouncedSearch`

**Example:**
```typescript
// In api.ts
class ApiService {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }
}

// In service
export async function searchDrivers(
  leagueId: number,
  query: string,
  signal?: AbortSignal
): Promise<Driver[]> {
  const response = await apiClient.get(
    API_ENDPOINTS.drivers.list(leagueId),
    { params: { search: query }, signal }
  );
  return response.data.data;
}

// In component
const { isSearching } = useDebouncedSearch(
  searchQuery,
  async (query, signal) => {
    await driverStore.searchDrivers(leagueId, query, signal);
  }
);
```

**Benefits:**
- Prevents race conditions in search results
- Reduces unnecessary network requests
- Better UX (faster perceived performance)
- Lower server load

---

#### 7. Add Error Boundary Handling
**Estimated Effort:** 2-3 hours

**Files to Create:**
1. `composables/useErrorBoundary.ts`
2. `components/common/ErrorBoundary.vue`

**useErrorBoundary.ts:**
```typescript
import { ref, onErrorCaptured } from 'vue';

export function useErrorBoundary() {
  const error = ref<Error | null>(null);
  const errorInfo = ref<string | null>(null);

  onErrorCaptured((err, instance, info) => {
    error.value = err;
    errorInfo.value = info;

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error captured:', err);
      console.error('Component:', instance);
      console.error('Error info:', info);
    }

    // Prevent error from propagating
    return false;
  });

  function resetError() {
    error.value = null;
    errorInfo.value = null;
  }

  return {
    error: readonly(error),
    errorInfo: readonly(errorInfo),
    resetError,
  };
}
```

**ErrorBoundary.vue:**
```vue
<script setup lang="ts">
import { useErrorBoundary } from '@app/composables/useErrorBoundary';

const { error, errorInfo, resetError } = useErrorBoundary();
</script>

<template>
  <div v-if="error" class="error-boundary p-6 bg-red-50 border border-red-200 rounded-lg">
    <h2 class="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
    <p class="text-red-600 mb-4">{{ error.message }}</p>
    <button
      @click="resetError"
      class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Try again
    </button>
  </div>
  <slot v-else />
</template>
```

**Usage:**
```vue
<ErrorBoundary>
  <LeagueDetail />
</ErrorBoundary>
```

**Benefits:**
- Graceful error handling
- Prevents app crashes
- Better user experience
- Error logging for debugging

---

### Priority 2: Integration Testing (Lower Priority)

#### 8. Add Integration Tests for Critical Flows
**Estimated Effort:** 10-12 hours

**Tests to Create:**

**1. League Creation Flow**
- File: `__tests__/integration/league-creation.test.ts`
- Steps:
  1. User opens league wizard
  2. Fills step 1 (name, logo, platforms, timezone, visibility)
  3. Validates and proceeds to step 2
  4. Fills step 2 (tagline, description, header image)
  5. Proceeds to step 3
  6. Fills step 3 (contact, social media)
  7. Submits form
  8. Verifies league created in store
  9. Verifies API was called correctly
  10. Verifies user redirected to league detail

**2. Competition & Season Creation**
- File: `__tests__/integration/competition-season-creation.test.ts`
- Steps:
  1. User creates competition in league
  2. Verifies competition appears in league
  3. User creates season in competition
  4. Verifies season appears in competition
  5. Verifies stats are updated

**3. Driver Management**
- File: `__tests__/integration/driver-management.test.ts`
- Steps:
  1. User adds driver to league
  2. Verifies driver appears in table
  3. User edits driver
  4. Verifies changes reflected
  5. User removes driver
  6. Verifies driver removed

**4. CSV Import**
- File: `__tests__/integration/csv-import.test.ts`
- Steps:
  1. User opens CSV import dialog
  2. User pastes CSV data
  3. Validates format
  4. Submits import
  5. Verifies success/error handling
  6. Verifies drivers imported

**Tools Needed:**
- `@vue/test-utils` for component mounting
- `vitest` for test runner
- Mock API responses with MSW or similar
- Mock router for navigation testing

**Benefits:**
- Increased confidence in critical features
- Catches integration bugs
- Documents expected user flows
- Prevents regressions

---

## Summary Statistics

### Completed Work
- ✅ Files created: 9
- ✅ Files modified: 15
- ✅ New tests: 230
- ✅ Total tests: 1,138 (all passing)
- ✅ Lines of code changed: ~900+

### Remaining Work
- ⏳ Tasks remaining: 8
- ⏳ Estimated effort: 38-50 hours total
- ⏳ High priority: 5 tasks (~24-32 hours)
- ⏳ Lower priority: 1 task (~10-12 hours)

### Priority Breakdown

**High Impact, Quick Wins (Do First):**
1. Create `useCrudStore` composable (4-5 hours) - Eliminates ~200 lines of duplication
2. Create `useDebouncedSearch` composable (2-3 hours) - Reusable pattern
3. Add error boundary handling (2-3 hours) - Better UX

**High Impact, More Effort (Do Second):**
4. Extract LeagueDetail.vue (6-8 hours) - Improves maintainability significantly
5. Create `useLeagueDrivers` composable (3-4 hours) - Should be done with #4

**Medium Impact (Do Third):**
6. Standardize nullable types (4-6 hours) - Consistency improvements
7. Implement request cancellation (3-4 hours) - Performance improvement

**Lower Impact (Do Last):**
8. Add integration tests (10-12 hours) - Quality assurance

---

## Next Steps

**Recommended Approach:**

1. **Week 1:** Complete quick wins (#1, #2, #3) - 8-11 hours
2. **Week 2:** Extract LeagueDetail and create useLeagueDrivers (#4, #5) - 9-12 hours
3. **Week 3:** Standardize types and implement cancellation (#6, #7) - 7-10 hours
4. **Week 4:** Integration tests if time permits (#8) - 10-12 hours

**Total Timeline:** 3-4 weeks for one developer working part-time

---

## Success Metrics

Upon completion of all tasks:

- **Code Coverage:** >80% for composables and components
- **Component Size:** Average <300 lines (down from 800+)
- **Type Safety:** 0 TypeScript errors with strict mode
- **Code Duplication:** -30% through generic patterns
- **Bundle Size:** -10% through better tree-shaking
- **Test Count:** 1,200+ tests (up from 950)
- **Maintainability:** Easier to onboard new developers

---

## Notes

- All improvements are backward compatible
- No breaking changes to existing functionality
- Incremental approach allows for continuous deployment
- Each task can be completed and tested independently
- All work follows Vue 3 + TypeScript best practices
