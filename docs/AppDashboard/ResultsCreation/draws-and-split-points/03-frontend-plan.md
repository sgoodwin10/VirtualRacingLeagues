# Round Tiebreaker Rules - Frontend Implementation Plan

**Agent**: `dev-fe-app`

The frontend changes are primarily in the **App Dashboard** (`resources/app/`), specifically in the Season form and types.

## Key Business Rules

1. **Tie-handling ONLY applies when tiebreaker is DISABLED**:
   - Tied drivers receive the **SAME position** (e.g., both "3rd")
   - Tied drivers receive the **SAME round points** (not split/averaged)
   - Next driver **skips positions** (e.g., 5th, not 4th)

2. **When tiebreaker is ENABLED**:
   - Rules determine a winner → normal position assignment (3rd, 4th, 5th...)
   - Only if NO rule breaks the tie do drivers share position

3. **Tiebreaker toggle and rule ordering can be changed at any time** - not restricted to season setup status

4. **Qualifying races are EXCLUDED** from the "Best Result from All Races" countback rule (backend handles this)

---

## Phase 1: TypeScript Types

### Modify: Season Types
**File**: `resources/app/js/types/season.ts`

Add new interfaces:

```typescript
// New interface for tiebreaker rule (from API)
export interface TiebreakerRule {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  default_order: number;
}

// New interface for season-specific rule configuration
export interface SeasonTiebreakerRule {
  id: number;
  season_id: number;
  rule_id: number;
  rule_name: string;
  rule_slug: string;
  rule_description: string | null;
  order: number;
}

// New interface for tiebreaker resolution information
export interface TiebreakerResolution {
  drivers: number[];
  rule_applied: string;
  winner_id: number;
  explanation: string;
  data: Record<string, unknown>;
}

// New interface for tiebreaker information (stored on Round)
export interface TiebreakerInformation {
  tie_groups_resolved: number;
  resolutions: TiebreakerResolution[];
  unresolved_ties: { drivers: number[] }[];
  human_readable_summary: string;
}

// Modify existing Season interface
export interface Season {
  // ... existing properties ...
  round_totals_tiebreaker_rules_enabled: boolean;
  tiebreaker_rules?: SeasonTiebreakerRule[];
}

// Modify existing Round interface (if exists)
export interface Round {
  // ... existing properties ...
  tiebreaker_information?: TiebreakerInformation | null;
}

// Modify SeasonForm interface
export interface SeasonForm {
  // ... existing properties ...
  round_totals_tiebreaker_rules_enabled: boolean;
}

// Also update InternalSeasonForm (used in SeasonFormDrawer)
export interface InternalSeasonForm {
  // ... existing properties ...
  round_totals_tiebreaker_rules_enabled: boolean;
}

// Modify CreateSeasonRequest interface
export interface CreateSeasonRequest {
  // ... existing properties ...
  round_totals_tiebreaker_rules_enabled?: boolean;
}

// Modify UpdateSeasonRequest interface
export interface UpdateSeasonRequest {
  // ... existing properties ...
  round_totals_tiebreaker_rules_enabled?: boolean;
}
```

---

## Phase 2: API Endpoints Constants

### Modify: API Endpoints
**File**: `resources/app/js/constants/apiEndpoints.ts`

Add new endpoint constants:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints ...

  tiebreakerRules: {
    // Get all available tiebreaker rules
    list: () => '/api/tiebreaker-rules',

    // Get season's configured tiebreaker rules
    forSeason: (seasonId: number) => `/api/seasons/${seasonId}/tiebreaker-rules`,

    // Update season's tiebreaker rules order
    updateOrder: (seasonId: number) => `/api/seasons/${seasonId}/tiebreaker-rules`,
  },
};
```

---

## Phase 3: API Services

### Modify: Season Service
**File**: `resources/app/js/services/seasonService.ts`

Add new API methods (using `get*` naming convention to match existing patterns):

```typescript
import type { TiebreakerRule, SeasonTiebreakerRule } from '@app/types/season';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

// Get all available tiebreaker rules
export async function getTiebreakerRules(): Promise<TiebreakerRule[]> {
  const response = await apiClient.get(API_ENDPOINTS.tiebreakerRules.list());
  return response.data.data;
}

// Get season's tiebreaker rules with order
export async function getSeasonTiebreakerRules(
  seasonId: number
): Promise<SeasonTiebreakerRule[]> {
  const response = await apiClient.get(API_ENDPOINTS.tiebreakerRules.forSeason(seasonId));
  return response.data.data;
}

// Update season's tiebreaker rules order
export async function updateSeasonTiebreakerRulesOrder(
  seasonId: number,
  ruleOrder: { rule_id: number; order: number }[]
): Promise<void> {
  await apiClient.put(API_ENDPOINTS.tiebreakerRules.updateOrder(seasonId), { rules: ruleOrder });
}
```

---

## Phase 4: Season Store Updates

### Modify: Season Store
**File**: `resources/app/js/stores/seasonStore.ts`

**IMPORTANT**: The store uses **setup syntax** with `ref()`, NOT options API with `state()`.

Add state and actions using the correct setup syntax:

```typescript
import { ref } from 'vue';
import type { TiebreakerRule } from '@app/types/season';
import { getTiebreakerRules, updateSeasonTiebreakerRulesOrder } from '@app/services/seasonService';

export const useSeasonStore = defineStore('season', () => {
  // ... existing state ...

  // NEW: Tiebreaker rules state (using ref, not options API)
  const availableTiebreakerRules = ref<TiebreakerRule[]>([]);
  const isLoadingTiebreakerRules = ref(false);

  // NEW: Fetch available tiebreaker rules (cached)
  async function fetchTiebreakerRules(): Promise<void> {
    // Return early if already loaded (caching)
    if (availableTiebreakerRules.value.length > 0) return;

    isLoadingTiebreakerRules.value = true;
    try {
      availableTiebreakerRules.value = await getTiebreakerRules();
    } finally {
      isLoadingTiebreakerRules.value = false;
    }
  }

  // NEW: Update tiebreaker rules order for a season
  async function updateTiebreakerRulesOrder(
    seasonId: number,
    ruleOrder: { rule_id: number; order: number }[]
  ): Promise<void> {
    await updateSeasonTiebreakerRulesOrder(seasonId, ruleOrder);
    // Optionally emit event for cross-store communication
    // storeEvents.emit('season:tiebreaker-rules-updated', { seasonId, ruleOrder });
  }

  // NEW: Clear tiebreaker rules cache (useful for testing or force refresh)
  function clearTiebreakerRulesCache(): void {
    availableTiebreakerRules.value = [];
  }

  return {
    // ... existing returns ...

    // NEW: Tiebreaker state and actions
    availableTiebreakerRules,
    isLoadingTiebreakerRules,
    fetchTiebreakerRules,
    updateTiebreakerRulesOrder,
    clearTiebreakerRulesCache,
  };
});
```

---

## Phase 5: SeasonFormDrawer Updates

### Modify: SeasonFormDrawer
**File**: `resources/app/js/components/season/modals/SeasonFormDrawer.vue`

#### Script Changes

Add imports:
```typescript
import OrderList from 'primevue/orderlist';
import Message from 'primevue/message';
import { useSeasonStore } from '@app/stores/seasonStore';
import { getSeasonTiebreakerRules } from '@app/services/seasonService';
import type { SeasonTiebreakerRule } from '@app/types/season';
```

Add to form reactive (InternalSeasonForm):
```typescript
const form = reactive<InternalSeasonForm>({
  // ... existing fields ...
  round_totals_tiebreaker_rules_enabled: false,
});
```

Add state for rule ordering:
```typescript
const orderedRules = ref<SeasonTiebreakerRule[]>([]);
const isLoadingRules = ref(false);
const tiebreakerRulesError = ref<string | null>(null);
```

Get store reference:
```typescript
const seasonStore = useSeasonStore();
```

Add watch for tiebreaker toggle:
```typescript
// Watch tiebreaker enabled toggle
watch(
  () => form.round_totals_tiebreaker_rules_enabled,
  async (enabled) => {
    tiebreakerRulesError.value = null;

    if (enabled && props.isEditMode && props.season) {
      // Edit mode: Load existing rules for this season
      isLoadingRules.value = true;
      try {
        orderedRules.value = await getSeasonTiebreakerRules(props.season.id);
      } catch (error) {
        tiebreakerRulesError.value = 'Failed to load tiebreaker rules';
        console.error('Failed to load season tiebreaker rules:', error);
      } finally {
        isLoadingRules.value = false;
      }
    } else if (enabled) {
      // Create mode: Use default order from available rules
      isLoadingRules.value = true;
      try {
        await seasonStore.fetchTiebreakerRules();
        orderedRules.value = seasonStore.availableTiebreakerRules.map((rule, index) => ({
          id: 0,
          season_id: 0,
          rule_id: rule.id,
          rule_name: rule.name,
          rule_slug: rule.slug,
          rule_description: rule.description,
          order: index + 1,
        }));
      } catch (error) {
        tiebreakerRulesError.value = 'Failed to load tiebreaker rules';
        console.error('Failed to load tiebreaker rules:', error);
      } finally {
        isLoadingRules.value = false;
      }
    } else {
      // Disabled: Clear rules
      orderedRules.value = [];
    }
  }
);
```

Update `loadSeasonData()`:
```typescript
function loadSeasonData(): void {
  if (!props.season) return;
  // ... existing code ...
  form.round_totals_tiebreaker_rules_enabled = props.season.round_totals_tiebreaker_rules_enabled ?? false;

  if (props.season.tiebreaker_rules && props.season.tiebreaker_rules.length > 0) {
    orderedRules.value = [...props.season.tiebreaker_rules].sort((a, b) => a.order - b.order);
  }
}
```

Update `resetForm()`:
```typescript
function resetForm(): void {
  // ... existing code ...
  form.round_totals_tiebreaker_rules_enabled = false;
  orderedRules.value = [];
  tiebreakerRulesError.value = null;
}
```

Update `submitForm()` to include tiebreaker enabled flag:
```typescript
async function submitForm(): Promise<void> {
  // ... existing validation ...

  const submitData = {
    // ... existing fields ...
    round_totals_tiebreaker_rules_enabled: form.round_totals_tiebreaker_rules_enabled,
  };

  try {
    let savedSeason: Season;

    if (props.isEditMode && props.season) {
      savedSeason = await seasonStore.updateSeason(props.season.id, submitData);
    } else {
      savedSeason = await seasonStore.createSeason(submitData);
    }

    // After season is saved, update rule order if tiebreaker is enabled
    if (form.round_totals_tiebreaker_rules_enabled && orderedRules.value.length > 0) {
      const ruleOrder = orderedRules.value.map((rule, index) => ({
        rule_id: rule.rule_id,
        order: index + 1,
      }));

      try {
        await seasonStore.updateTiebreakerRulesOrder(savedSeason.id, ruleOrder);
      } catch (error) {
        // Show warning toast but don't fail the whole operation
        toast.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Season saved, but tiebreaker rule order could not be updated',
          life: 5000,
        });
        console.error('Failed to update tiebreaker rules order:', error);
      }
    }

    // ... existing success handling ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

#### Template Changes

Add tiebreaker section in the right column (after Team Championship panel, around line 632):

```vue
<!-- Round Tiebreaker Rules Toggle -->
<FormInputGroup>
  <div class="flex items-center gap-3">
    <Checkbox
      v-model="form.round_totals_tiebreaker_rules_enabled"
      input-id="tiebreaker_rules"
      :binary="true"
      :disabled="isSubmitting"
    />
    <FormLabel
      for="tiebreaker_rules"
      text="Enable Tiebreaker Rules"
      class="mb-0 cursor-pointer"
    />
  </div>
  <FormOptionalText text="Apply rules to determine standings when drivers have equal points" />
</FormInputGroup>

<!-- Tiebreaker Rules Configuration Panel -->
<BasePanel
  v-if="form.round_totals_tiebreaker_rules_enabled"
  class="bg-amber-50/50 border-amber-200"
>
  <div class="p-3 space-y-2.5">
    <div class="flex items-center gap-2 mb-2">
      <i class="pi pi-sort-alt text-amber-600"></i>
      <h4 class="font-semibold text-amber-900">Tiebreaker Rule Priority</h4>
    </div>

    <p class="text-sm text-gray-600 mb-3">
      Drag and drop to reorder. Rules are applied from top to bottom until a tie is broken.
    </p>

    <!-- Error State -->
    <Message v-if="tiebreakerRulesError" severity="error" :closable="false" class="mb-3">
      {{ tiebreakerRulesError }}
    </Message>

    <!-- Loading State -->
    <div v-else-if="isLoadingRules" class="flex justify-center py-4">
      <i class="pi pi-spinner pi-spin text-amber-600 text-xl"></i>
    </div>

    <!-- Empty State -->
    <Message v-else-if="orderedRules.length === 0" severity="warn" :closable="false">
      No tiebreaker rules available. Please contact support.
    </Message>

    <!-- Rule Ordering List -->
    <OrderList
      v-else
      v-model="orderedRules"
      :list-style="{ height: 'auto', minHeight: '150px' }"
      data-key="rule_id"
      :disabled="isSubmitting"
    >
      <template #item="{ item, index }">
        <div class="flex items-center gap-3 py-2 px-3 bg-white rounded border border-gray-200 hover:border-amber-300 transition-colors">
          <span class="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
            {{ index + 1 }}
          </span>
          <div class="flex-1">
            <span class="text-sm font-medium text-gray-800">
              {{ item.rule_name }}
            </span>
            <p v-if="item.rule_description" class="text-xs text-gray-500 mt-0.5">
              {{ item.rule_description }}
            </p>
          </div>
          <i class="pi pi-bars text-gray-400 cursor-move"></i>
        </div>
      </template>
    </OrderList>

    <Message severity="info" :closable="false" class="mt-3">
      <small>
        If no rule breaks the tie, drivers will share the same position and receive identical points.
      </small>
    </Message>
  </div>
</BasePanel>
```

---

## Phase 6: Display Tiebreaker Information (Round Results)

If there's a component that displays round results, it should show the tiebreaker explanation.

### Location to Update
Look for round results display components, likely in:
- `resources/app/js/components/round/` or similar

Add display of tiebreaker information:

```vue
<script setup lang="ts">
import type { TiebreakerInformation } from '@app/types/season';

const props = defineProps<{
  round: {
    // ... other props
    tiebreaker_information?: TiebreakerInformation | null;
  };
}>();

const hasTiebreakerInfo = computed(() => {
  return props.round.tiebreaker_information &&
    props.round.tiebreaker_information.tie_groups_resolved > 0;
});
</script>

<template>
  <!-- Tiebreaker Explanation (if exists) -->
  <div
    v-if="hasTiebreakerInfo"
    class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
  >
    <div class="flex items-start gap-2">
      <i class="pi pi-info-circle text-amber-600 mt-0.5"></i>
      <div>
        <h5 class="font-semibold text-amber-900 text-sm mb-1">
          Tiebreaker Applied
          <span class="font-normal text-amber-700">
            ({{ round.tiebreaker_information.tie_groups_resolved }} tie{{ round.tiebreaker_information.tie_groups_resolved > 1 ? 's' : '' }} resolved)
          </span>
        </h5>
        <p class="text-sm text-amber-800">
          {{ round.tiebreaker_information.human_readable_summary }}
        </p>

        <!-- Show unresolved ties if any -->
        <p
          v-if="round.tiebreaker_information.unresolved_ties.length > 0"
          class="text-sm text-amber-700 mt-2"
        >
          <i class="pi pi-exclamation-triangle mr-1"></i>
          {{ round.tiebreaker_information.unresolved_ties.length }} tie(s) could not be resolved - drivers share position.
        </p>
      </div>
    </div>
  </div>
</template>
```

---

## Phase 7: Validation Updates

### Modify: useSeasonValidation (if needed)
**File**: `resources/app/js/composables/useSeasonValidation.ts`

No specific validation needed for the boolean toggle. The rule ordering is handled client-side and validated by the backend FormRequest.

---

## Phase 8: Tests

### Component Tests
**File**: `resources/app/js/components/season/modals/__tests__/SeasonFormDrawer.test.ts`

Add tests for:
- Tiebreaker toggle visibility and behavior
- Rule ordering panel appears when toggle enabled
- Rule reordering updates local state (OrderList v-model)
- Submit includes tiebreaker enabled flag
- Edit mode loads existing rule configuration
- Error handling when rules fail to load
- Empty state when no rules available

```typescript
describe('SeasonFormDrawer - Tiebreaker Rules', () => {
  it('should show tiebreaker toggle in the form');
  it('should show rule ordering panel when tiebreaker is enabled');
  it('should hide rule ordering panel when tiebreaker is disabled');
  it('should load default rules when enabling tiebreaker in create mode');
  it('should load existing rules when enabling tiebreaker in edit mode');
  it('should update rule order when items are reordered');
  it('should include tiebreaker_enabled flag in submit data');
  it('should save rule order after season is saved');
  it('should show error message when rules fail to load');
  it('should show warning toast if rule order save fails but season save succeeds');
});
```

---

## Implementation Order

1. TypeScript types (`types/season.ts`)
2. API endpoint constants (`constants/apiEndpoints.ts`)
3. API service methods (`services/seasonService.ts`)
4. Store updates (`stores/seasonStore.ts`) - **Use setup syntax with ref()**
5. SeasonFormDrawer updates (template + script)
6. Round results display (if applicable)
7. Tests

---

## File Summary

### New Files
| File | Type |
|------|------|
| None | (No new files - composable skipped for MVP) |

### Modified Files
| File | Changes |
|------|---------|
| `resources/app/js/types/season.ts` | Add tiebreaker interfaces (TiebreakerRule, SeasonTiebreakerRule, TiebreakerInformation, etc.) |
| `resources/app/js/constants/apiEndpoints.ts` | Add tiebreakerRules endpoint constants |
| `resources/app/js/services/seasonService.ts` | Add getTiebreakerRules, getSeasonTiebreakerRules, updateSeasonTiebreakerRulesOrder |
| `resources/app/js/stores/seasonStore.ts` | Add state (ref) and actions for tiebreaker rules |
| `resources/app/js/components/season/modals/SeasonFormDrawer.vue` | Add toggle, OrderList panel, watch, and submit logic |
| `resources/app/js/components/season/modals/__tests__/SeasonFormDrawer.test.ts` | Add tiebreaker tests |

---

## PrimeVue Components Used

| Component | Purpose |
|-----------|---------|
| `Checkbox` | Toggle for enabling tiebreaker rules |
| `OrderList` | Drag-and-drop rule ordering |
| `Message` | Info/error/warning messages |
| `BasePanel` | Container for rule configuration |

### OrderList Usage Notes (PrimeVue V4)

PrimeVue's `OrderList` component provides built-in drag-and-drop:

```vue
<OrderList
  v-model="orderedRules"
  data-key="rule_id"
  :list-style="{ height: 'auto' }"
  :disabled="isSubmitting"
>
  <template #item="{ item, index }">
    <!-- Custom item template -->
  </template>
</OrderList>
```

The `v-model` automatically updates the array order when items are dragged.

**Note**: Verify PrimeVue V4 API compatibility. The component may require custom CSS to match the application's design system.

---

## UI/UX Considerations

1. **Clear Visual Hierarchy**: Number badges show priority order
2. **Immediate Feedback**: Drag cursor and visual cues for draggable items
3. **Helpful Context**: Info message explains behavior when no rule breaks tie
4. **Color Scheme**: Amber theme differentiates from other settings (blue for teams)
5. **Loading States**: Spinner while fetching rules
6. **Error States**: Clear error messages when things go wrong
7. **Empty States**: Helpful message if no rules are available
8. **Responsive**: Panel adjusts to column layout
9. **Rule Descriptions**: Show description text under rule names for clarity

---

## Notes for Implementation

1. **OrderList Styling**: May need custom CSS to match existing design system
2. **API Error Handling**: Toast notifications for failed saves (warn severity, not error)
3. **Optimistic Updates**: Local state updates immediately; API call happens on form submit
4. **Cache Management**: Rules are cached in store; use `clearTiebreakerRulesCache()` if needed
5. **Composable Skipped**: `useTiebreakerRules` composable is NOT needed for MVP since the logic is only used in SeasonFormDrawer. Extract to composable only if tiebreaker UI is needed in multiple components later.
6. **Form Data Builders**: If the project uses `buildCreateSeasonFormData` / `buildUpdateSeasonFormData`, update those functions to include `round_totals_tiebreaker_rules_enabled`.

---

## Integration with Backend

The frontend expects the following API responses:

### GET /api/tiebreaker-rules
```json
{
  "data": [
    {
      "id": 1,
      "name": "Highest Qualifying Position",
      "slug": "highest-qualifying-position",
      "description": "Driver with the higher qualifying position wins the tiebreaker",
      "is_active": true,
      "default_order": 1
    },
    // ...
  ]
}
```

### GET /api/seasons/{id}/tiebreaker-rules
```json
{
  "data": [
    {
      "id": 1,
      "season_id": 42,
      "rule_id": 1,
      "rule_name": "Highest Qualifying Position",
      "rule_slug": "highest-qualifying-position",
      "rule_description": "Driver with the higher qualifying position wins the tiebreaker",
      "order": 1
    },
    // ...
  ]
}
```

### PUT /api/seasons/{id}/tiebreaker-rules
Request:
```json
{
  "rules": [
    { "rule_id": 2, "order": 1 },
    { "rule_id": 1, "order": 2 },
    { "rule_id": 3, "order": 3 }
  ]
}
```

Response: `200 OK` or validation errors
