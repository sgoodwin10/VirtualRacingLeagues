# Teams Drop Rounds Feature - Frontend Implementation Plan

## Overview

This document details the Vue.js/TypeScript frontend implementation for adding team drop rounds and drivers-for-calculation settings to the Season form.

---

## 1. TypeScript Types Updates

### File: `resources/app/js/types/season.ts`

#### Update Season Interface

```typescript
export interface Season {
  id: number;
  competition_id: number;
  // ... existing fields ...

  // Settings
  race_divisions_enabled: boolean;
  team_championship_enabled: boolean;
  teams_drivers_for_calculation: number | null;  // NEW: null = "All", 1-16 = specific count
  teams_drop_rounds: boolean;                     // NEW: enable team drop rounds
  teams_total_drop_rounds: number | null;        // NEW: number of rounds to drop
  race_times_required: boolean;
  drop_round: boolean;
  total_drop_rounds: number;

  // ... rest of existing fields ...
}
```

#### Update SeasonForm Interface

```typescript
export interface SeasonForm {
  name: string;
  car_class: string;
  description: string;
  technical_specs: string;
  logo: File | null;
  logo_url: string | null;
  banner: File | null;
  banner_url: string | null;
  race_divisions_enabled: boolean;
  team_championship_enabled: boolean;
  teams_drivers_for_calculation: number | null;  // NEW
  teams_drop_rounds: boolean;                     // NEW
  teams_total_drop_rounds: number;               // NEW (use 0 as default, not null for form)
  race_times_required: boolean;
  drop_round: boolean;
  total_drop_rounds: number;
}
```

#### Update CreateSeasonRequest Interface

```typescript
export interface CreateSeasonRequest {
  name: string;
  car_class?: string;
  description?: string;
  technical_specs?: string;
  logo?: File;
  banner?: File;
  race_divisions_enabled?: boolean;
  team_championship_enabled?: boolean;
  teams_drivers_for_calculation?: number | null;  // NEW
  teams_drop_rounds?: boolean;                     // NEW
  teams_total_drop_rounds?: number;               // NEW
  race_times_required?: boolean;
  drop_round?: boolean;
  total_drop_rounds?: number;
}
```

#### Update UpdateSeasonRequest Interface

```typescript
export interface UpdateSeasonRequest {
  name?: string;
  car_class?: string | null;
  description?: string | null;
  technical_specs?: string | null;
  logo?: File | null;
  banner?: File | null;
  race_divisions_enabled?: boolean;
  team_championship_enabled?: boolean;
  teams_drivers_for_calculation?: number | null;  // NEW
  teams_drop_rounds?: boolean;                     // NEW
  teams_total_drop_rounds?: number;               // NEW
  race_times_required?: boolean;
  drop_round?: boolean;
  total_drop_rounds?: number;
}
```

---

## 2. Component Updates

### File: `resources/app/js/components/season/modals/SeasonFormDrawer.vue`

#### Script Section Updates

```typescript
// Add to imports
import Select from 'primevue/select';

// Update form reactive state
const form = reactive<SeasonForm>({
  name: '',
  car_class: '',
  description: '',
  technical_specs: '',
  logo: null,
  logo_url: null,
  banner: null,
  banner_url: null,
  race_divisions_enabled: false,
  team_championship_enabled: false,
  teams_drivers_for_calculation: null,  // NEW - null means "All"
  teams_drop_rounds: false,              // NEW
  teams_total_drop_rounds: 0,           // NEW
  race_times_required: true,
  drop_round: false,
  total_drop_rounds: 0,
});

// Add computed for dropdown options
const teamsDriversOptions = computed(() => [
  { label: 'All', value: null },
  ...Array.from({ length: 16 }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  })),
]);

// Watch team_championship_enabled to reset team settings when disabled
watch(
  () => form.team_championship_enabled,
  (enabled) => {
    if (!enabled) {
      // Reset team settings when team championship is disabled
      form.teams_drivers_for_calculation = null;
      form.teams_drop_rounds = false;
      form.teams_total_drop_rounds = 0;
    }
  },
);

// Watch teams_drop_rounds to reset total when disabled
watch(
  () => form.teams_drop_rounds,
  (enabled) => {
    if (!enabled) {
      form.teams_total_drop_rounds = 0;
    }
  },
);
```

#### Update loadSeasonData Method

```typescript
function loadSeasonData(): void {
  if (!props.season) return;

  isLoadingData.value = true;

  form.name = props.season.name;
  form.car_class = props.season.car_class || '';
  form.description = props.season.description || '';
  form.technical_specs = props.season.technical_specs || '';
  form.logo = null;
  form.logo_url = props.season.has_own_logo ? props.season.logo_url : null;
  form.banner = null;
  form.banner_url = props.season.banner_url;
  form.race_divisions_enabled = props.season.race_divisions_enabled;
  form.team_championship_enabled = props.season.team_championship_enabled;
  form.teams_drivers_for_calculation = props.season.teams_drivers_for_calculation;  // NEW
  form.teams_drop_rounds = props.season.teams_drop_rounds;                           // NEW
  form.teams_total_drop_rounds = props.season.teams_total_drop_rounds ?? 0;         // NEW
  form.race_times_required = props.season.race_times_required;
  form.drop_round = props.season.drop_round;
  form.total_drop_rounds = props.season.total_drop_rounds;

  originalName.value = props.season.name;

  isLoadingData.value = false;
}
```

#### Update resetForm Method

```typescript
function resetForm(): void {
  activeTab.value = '0';
  form.name = '';
  form.car_class = '';
  form.description = '';
  form.technical_specs = '';
  form.logo = null;
  form.logo_url = null;
  form.banner = null;
  form.banner_url = null;
  form.race_divisions_enabled = false;
  form.team_championship_enabled = false;
  form.teams_drivers_for_calculation = null;  // NEW
  form.teams_drop_rounds = false;              // NEW
  form.teams_total_drop_rounds = 0;           // NEW
  form.race_times_required = true;
  form.drop_round = false;
  form.total_drop_rounds = 0;
  originalName.value = '';
  slugPreview.value = '';
  slugStatus.value = null;
  slugSuggestion.value = null;
  clearErrors();
}
```

#### Update submitForm Method (create path)

```typescript
const created = await seasonStore.createNewSeason(props.competitionId, {
  name: form.name,
  car_class: form.car_class || undefined,
  description: form.description || undefined,
  technical_specs: form.technical_specs || undefined,
  logo: form.logo || undefined,
  banner: form.banner || undefined,
  race_divisions_enabled: form.race_divisions_enabled,
  team_championship_enabled: form.team_championship_enabled,
  teams_drivers_for_calculation: form.team_championship_enabled
    ? form.teams_drivers_for_calculation
    : undefined,                                                    // NEW
  teams_drop_rounds: form.team_championship_enabled
    ? form.teams_drop_rounds
    : undefined,                                                    // NEW
  teams_total_drop_rounds: form.team_championship_enabled && form.teams_drop_rounds
    ? form.teams_total_drop_rounds
    : undefined,                                                    // NEW
  race_times_required: form.race_times_required,
  drop_round: form.drop_round,
  total_drop_rounds: form.total_drop_rounds,
});
```

#### Update submitForm Method (update path)

```typescript
const updated = await seasonStore.updateExistingSeason(props.season.id, {
  name: form.name,
  car_class: form.car_class || null,
  description: form.description || null,
  technical_specs: form.technical_specs || null,
  logo: form.logo,
  banner: form.banner,
  race_divisions_enabled: form.race_divisions_enabled,
  team_championship_enabled: form.team_championship_enabled,
  teams_drivers_for_calculation: form.team_championship_enabled
    ? form.teams_drivers_for_calculation
    : null,                                                        // NEW
  teams_drop_rounds: form.team_championship_enabled
    ? form.teams_drop_rounds
    : false,                                                       // NEW
  teams_total_drop_rounds: form.team_championship_enabled && form.teams_drop_rounds
    ? form.teams_total_drop_rounds
    : 0,                                                           // NEW
  race_times_required: form.race_times_required,
  drop_round: form.drop_round,
  total_drop_rounds: form.total_drop_rounds,
});
```

---

## 3. Template Updates

### Add Team Championship Settings Section

Insert after the Team Championship toggle (around line 458):

```vue
<!-- Team Championship Toggle -->
<FormInputGroup>
  <div class="flex items-center gap-3">
    <Checkbox
      v-model="form.team_championship_enabled"
      input-id="team_championship"
      :binary="true"
      :disabled="isSubmitting"
    />
    <FormLabel
      for="team_championship"
      text="Enable Team Championship"
      class="mb-0 cursor-pointer"
    />
  </div>
  <FormOptionalText text="Track team standings alongside individual drivers" />
</FormInputGroup>

<!-- Team Championship Settings (conditional) -->
<div v-if="form.team_championship_enabled" class="ml-6 mt-2 space-y-2.5 border-l-2 border-blue-200 pl-4">
  <!-- Drivers for Team Calculation -->
  <FormInputGroup>
    <FormLabel for="teams_drivers_for_calculation" text="Drivers for Team Score" />
    <Select
      id="teams_drivers_for_calculation"
      v-model="form.teams_drivers_for_calculation"
      :options="teamsDriversOptions"
      option-label="label"
      option-value="value"
      placeholder="Select..."
      :disabled="isSubmitting"
      class="w-full"
      size="small"
    />
    <FormOptionalText text="How many drivers' points count per round (All = all team drivers)" />
  </FormInputGroup>

  <!-- Teams Drop Rounds Toggle -->
  <FormInputGroup>
    <div class="flex items-center gap-3">
      <Checkbox
        v-model="form.teams_drop_rounds"
        input-id="teams_drop_rounds"
        :binary="true"
        :disabled="isSubmitting"
      />
      <FormLabel
        for="teams_drop_rounds"
        text="Enable Teams Drop Rounds"
        class="mb-0 cursor-pointer"
      />
    </div>
    <FormOptionalText text="Exclude lowest scoring rounds from team standings" />
  </FormInputGroup>

  <!-- Teams Total Drop Rounds (conditional) -->
  <FormInputGroup v-if="form.teams_drop_rounds">
    <FormLabel for="teams_total_drop_rounds" text="Total Teams Drop Rounds" />
    <InputNumber
      id="teams_total_drop_rounds"
      v-model="form.teams_total_drop_rounds"
      :min="0"
      :max="10"
      :disabled="isSubmitting"
      show-buttons
      button-layout="horizontal"
      class="w-full"
      size="small"
    />
    <FormOptionalText text="Number of lowest scoring rounds to exclude from team standings" />
  </FormInputGroup>
</div>
```

---

## 4. Validation Updates

### File: `resources/app/js/composables/useSeasonValidation.ts`

If validation is needed for these fields (likely minimal since it's mostly handled by the backend):

```typescript
// Add to validation rules if needed
const validateTeamsDropRounds = (): string | null => {
  if (form.teams_drop_rounds && form.teams_total_drop_rounds < 1) {
    return 'Please specify at least 1 drop round when enabled';
  }
  return null;
};
```

---

## 5. Component Tests

### File: `resources/app/js/components/season/__tests__/SeasonFormDrawer.test.ts`

Add new test cases:

```typescript
describe('Team Championship Settings', () => {
  it('should hide team settings when team championship is disabled', async () => {
    const wrapper = mount(SeasonFormDrawer, {
      props: {
        visible: true,
        competitionId: 1,
      },
    });

    // Team championship toggle should be visible
    expect(wrapper.find('#team_championship').exists()).toBe(true);

    // Team-specific settings should be hidden
    expect(wrapper.find('#teams_drivers_for_calculation').exists()).toBe(false);
    expect(wrapper.find('#teams_drop_rounds').exists()).toBe(false);
  });

  it('should show team settings when team championship is enabled', async () => {
    const wrapper = mount(SeasonFormDrawer, {
      props: {
        visible: true,
        competitionId: 1,
      },
    });

    // Enable team championship
    await wrapper.find('#team_championship').setValue(true);

    // Team-specific settings should now be visible
    expect(wrapper.find('#teams_drivers_for_calculation').exists()).toBe(true);
    expect(wrapper.find('#teams_drop_rounds').exists()).toBe(true);
  });

  it('should show teams drop rounds total when teams drop rounds is enabled', async () => {
    const wrapper = mount(SeasonFormDrawer, {
      props: {
        visible: true,
        competitionId: 1,
      },
    });

    // Enable team championship
    await wrapper.find('#team_championship').setValue(true);

    // Total should be hidden initially
    expect(wrapper.find('#teams_total_drop_rounds').exists()).toBe(false);

    // Enable teams drop rounds
    await wrapper.find('#teams_drop_rounds').setValue(true);

    // Total should now be visible
    expect(wrapper.find('#teams_total_drop_rounds').exists()).toBe(true);
  });

  it('should reset team settings when team championship is disabled', async () => {
    const wrapper = mount(SeasonFormDrawer, {
      props: {
        visible: true,
        competitionId: 1,
      },
    });

    // Enable and configure team settings
    await wrapper.find('#team_championship').setValue(true);
    await wrapper.find('#teams_drivers_for_calculation').setValue(2);
    await wrapper.find('#teams_drop_rounds').setValue(true);

    // Disable team championship
    await wrapper.find('#team_championship').setValue(false);

    // Re-enable to check reset
    await wrapper.find('#team_championship').setValue(true);

    // Values should be reset to defaults
    expect(wrapper.vm.form.teams_drivers_for_calculation).toBe(null);
    expect(wrapper.vm.form.teams_drop_rounds).toBe(false);
  });

  it('should load existing season team settings correctly', async () => {
    const existingSeason = {
      id: 1,
      name: 'Test Season',
      team_championship_enabled: true,
      teams_drivers_for_calculation: 2,
      teams_drop_rounds: true,
      teams_total_drop_rounds: 3,
      // ... other required fields
    };

    const wrapper = mount(SeasonFormDrawer, {
      props: {
        visible: true,
        competitionId: 1,
        season: existingSeason,
        isEditMode: true,
      },
    });

    expect(wrapper.vm.form.teams_drivers_for_calculation).toBe(2);
    expect(wrapper.vm.form.teams_drop_rounds).toBe(true);
    expect(wrapper.vm.form.teams_total_drop_rounds).toBe(3);
  });

  it('should include team settings in create request when enabled', async () => {
    const seasonStore = useSeasonStore();
    const createSpy = vi.spyOn(seasonStore, 'createNewSeason');

    const wrapper = mount(SeasonFormDrawer, {
      props: {
        visible: true,
        competitionId: 1,
      },
    });

    // Fill required fields
    await wrapper.find('#name').setValue('Test Season');

    // Enable and configure team settings
    await wrapper.find('#team_championship').setValue(true);
    await wrapper.find('#teams_drivers_for_calculation').setValue(2);
    await wrapper.find('#teams_drop_rounds').setValue(true);
    await wrapper.find('#teams_total_drop_rounds').setValue(3);

    // Submit form
    await wrapper.find('form').trigger('submit');

    expect(createSpy).toHaveBeenCalledWith(1, expect.objectContaining({
      team_championship_enabled: true,
      teams_drivers_for_calculation: 2,
      teams_drop_rounds: true,
      teams_total_drop_rounds: 3,
    }));
  });
});
```

---

## 6. Implementation Checklist

### Phase 1: Types
- [ ] Update `Season` interface with new fields
- [ ] Update `SeasonForm` interface
- [ ] Update `CreateSeasonRequest` interface
- [ ] Update `UpdateSeasonRequest` interface

### Phase 2: Component Logic
- [ ] Add `Select` component import
- [ ] Add `teamsDriversOptions` computed property
- [ ] Update form reactive state with new fields
- [ ] Add watchers for conditional resets
- [ ] Update `loadSeasonData()` method
- [ ] Update `resetForm()` method
- [ ] Update `submitForm()` method for create
- [ ] Update `submitForm()` method for update

### Phase 3: Template
- [ ] Add team championship settings section
- [ ] Add drivers for calculation dropdown
- [ ] Add teams drop rounds toggle
- [ ] Add teams total drop rounds input (conditional)
- [ ] Style with proper indentation/border to show hierarchy

### Phase 4: Validation (if needed)
- [ ] Add client-side validation for teams drop rounds total

### Phase 5: Testing
- [ ] Test visibility toggling
- [ ] Test value reset on disable
- [ ] Test loading existing data
- [ ] Test form submission with team settings
- [ ] Test form submission without team settings

---

## 7. Styling Notes

### Visual Hierarchy

The team settings should be visually nested under the Team Championship toggle to show the relationship:

```
☑ Enable Team Championship
│
├─ Drivers for Team Score: [All ▼]
│
├─ ☐ Enable Teams Drop Rounds
│   └─ Total Teams Drop Rounds: [-] 0 [+]
```

Use Tailwind classes for the nested appearance:
- `ml-6` - Left margin for indentation
- `border-l-2 border-blue-200` - Left border to show grouping
- `pl-4` - Padding after border
- `space-y-2.5` - Consistent vertical spacing

### Accessibility

- All form controls have proper `id` and `for` attributes
- Use `aria-describedby` for helper text if needed
- Disabled states respect the `isSubmitting` prop
- Proper focus management for conditional fields

---

## 8. Notes for Implementation

1. **Dropdown "All" Option**: The `Select` component should display "All" but submit `null` to the backend. The `teamsDriversOptions` computed handles this mapping.

2. **Conditional Display**: Use `v-if` for sections that should not be in DOM when hidden, not `v-show`. This keeps the form cleaner and prevents validation issues.

3. **Watch Order**: The watchers for `team_championship_enabled` and `teams_drop_rounds` ensure values cascade correctly when parent toggles are disabled.

4. **Default Values**: When creating a new season, defaults are:
   - `teams_drivers_for_calculation`: `null` (All)
   - `teams_drop_rounds`: `false`
   - `teams_total_drop_rounds`: `0`

5. **Form Submission**: Only include team settings in the API request when team championship is enabled. This keeps the payload clean and aligns with backend expectations.
