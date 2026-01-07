# Frontend Implementation Plan

## Agent: `dev-fe-app`

This document details the frontend implementation for the Season Form Split Modal component.

---

## Design Decisions Summary

| Decision | Choice |
|----------|--------|
| Coexistence | New component exists alongside `SeasonFormDrawer.vue` |
| Image Upload | Simplified UI with remove existing image capability |
| Mobile Layout | Sidebar collapses to horizontal tab bar |
| Animations | Vue Transition components |

---

## Component Architecture

```
SeasonFormSplitModal.vue (Main Component)
├── Uses: BaseModal
├── Contains:
│   ├── SplitModalHeader (inline - custom header)
│   ├── SplitModalSidebar.vue (desktop only, hidden on mobile)
│   ├── SplitModalTabBar.vue (mobile only, hidden on desktop)
│   └── Main Content Area (with Vue Transitions)
│       ├── BasicInfoSection (inline)
│       ├── DriverSettingsSection (inline)
│       │   └── TiebreakerRulesList.vue
│       ├── TeamSettingsSection (inline)
│       └── BrandingSection (inline)
│           └── SimpleImageUpload.vue (×2: logo, banner)
└── Footer (Cancel + Submit buttons)

Supporting Components:
├── SplitModalNavItem.vue (used by Sidebar and TabBar)
├── SplitModalStatusSummary.vue (used by Sidebar, collapsible on mobile)
├── SettingCard.vue (toggleable setting with nested options)
├── TiebreakerRulesList.vue (draggable rules ordering)
└── SimpleImageUpload.vue (simplified upload with remove)
```

---

## Step-by-Step Implementation

### Phase 1: Create Supporting Components

#### 1.1 SplitModalNavItem.vue
**Location**: `resources/app/js/components/season/modals/partials/SplitModalNavItem.vue`

```typescript
interface Props {
  label: string;
  icon: Component; // Phosphor icon
  active: boolean;
  badge?: string | number;
  badgeActive?: boolean;
  compact?: boolean; // For tab bar mode
}

interface Emits {
  (e: 'click'): void;
}
```

**Features**:
- Displays navigation item with icon and label
- Active state highlighting (cyan background)
- Optional badge with active/inactive styling
- Compact mode for tab bar (icon only or abbreviated label)
- Click handler for section navigation

---

#### 1.2 SplitModalStatusSummary.vue
**Location**: `resources/app/js/components/season/modals/partials/SplitModalStatusSummary.vue`

```typescript
interface Props {
  divisionsEnabled: boolean;
  teamsEnabled: boolean;
  dropRoundsEnabled: boolean;
  tiebreakersEnabled: boolean;
  collapsible?: boolean; // For mobile view
}
```

**Features**:
- Displays real-time status of 4 key settings
- ON (green) / OFF (gray) indicators
- Updates reactively as form toggles change
- Collapsible mode for mobile (accordion-style)

---

#### 1.3 SettingCard.vue
**Location**: `resources/app/js/components/season/modals/partials/SettingCard.vue`

```typescript
interface Props {
  modelValue: boolean;
  title: string;
  description: string;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

// Slots
defineSlots<{
  default(): unknown; // Nested options content
}>();
```

**Features**:
- Card with checkbox toggle on the left
- Title and description
- Active state styling (border + background)
- Default slot for nested options (shown when active with Vue Transition)

---

#### 1.4 SimpleImageUpload.vue
**Location**: `resources/app/js/components/season/modals/partials/SimpleImageUpload.vue`

```typescript
interface Props {
  modelValue: File | null;
  existingImageUrl?: string | null;
  label: string;
  aspectRatio?: 'square' | 'wide'; // square for logo, wide for banner
  recommendedSize?: string; // e.g., "500x500px" or "1920x400px"
  maxFileSize?: number; // bytes
  accept?: string;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: File | null): void;
  (e: 'remove-existing'): void;
}
```

**Features**:
- Simplified dashed-border upload box (matching design-2.html)
- Shows upload icon, label, and recommended size hint
- Preview of selected/existing image
- **Remove button for existing images** (critical requirement)
- Hover state with cyan border
- Click to open file picker
- Drag and drop support (optional enhancement)

**Template Structure**:
```vue
<template>
  <div class="upload-box" :class="{ 'upload-box--square': aspectRatio === 'square' }">
    <!-- Empty State: Upload prompt -->
    <template v-if="!hasImage">
      <div class="upload-icon">
        <PhUpload :size="18" />
      </div>
      <div class="upload-label">{{ label }}</div>
      <div class="upload-hint">{{ recommendedSize }}</div>
      <input type="file" :accept="accept" @change="onFileSelect" />
    </template>

    <!-- Preview State: Image with remove button -->
    <template v-else>
      <div class="preview-container">
        <img :src="previewUrl" :alt="label" />
        <button class="remove-btn" @click.stop="removeImage">
          <PhX :size="14" />
        </button>
      </div>
    </template>
  </div>
</template>
```

---

#### 1.5 TiebreakerRulesList.vue
**Location**: `resources/app/js/components/season/modals/partials/TiebreakerRulesList.vue`

```typescript
interface Props {
  modelValue: SeasonTiebreakerRule[];
  loading?: boolean;
  error?: string | null;
}

interface Emits {
  (e: 'update:modelValue', value: SeasonTiebreakerRule[]): void;
}
```

**Features**:
- Displays ordered list of tiebreaker rules
- Numbered badges (1, 2, 3...) with orange background
- Drag handle icons
- Integration with PrimeVue OrderList
- Loading spinner and error states
- Compact design matching design-2.html

---

#### 1.6 SplitModalSidebar.vue (Desktop)
**Location**: `resources/app/js/components/season/modals/partials/SplitModalSidebar.vue`

```typescript
interface Props {
  activeSection: string;
  form: SeasonForm; // For status summary
}

interface Emits {
  (e: 'section-change', section: string): void;
}
```

**Features**:
- Navigation section with 4 items using `SplitModalNavItem`
- Status summary section at bottom using `SplitModalStatusSummary`
- Hidden on mobile (lg:flex)

---

#### 1.7 SplitModalTabBar.vue (Mobile)
**Location**: `resources/app/js/components/season/modals/partials/SplitModalTabBar.vue`

```typescript
interface Props {
  activeSection: string;
}

interface Emits {
  (e: 'section-change', section: string): void;
}
```

**Features**:
- Horizontal tab bar with 4 tabs
- Uses `SplitModalNavItem` in compact mode
- Active tab indicator (bottom border or background)
- Visible only on mobile (flex lg:hidden)
- Scrollable if needed on very small screens

---

### Phase 2: Create Main Component

#### 2.1 SeasonFormSplitModal.vue
**Location**: `resources/app/js/components/season/modals/SeasonFormSplitModal.vue`

**Props & Emits** (same as SeasonFormDrawer):
```typescript
interface Props {
  visible: boolean;
  competitionId: number;
  season?: Season | null;
  isEditMode?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'season-saved', season: Season): void;
  (e: 'hide'): void;
}
```

**State Management**:
```typescript
// Section navigation
const activeSection = ref<'basic' | 'driver' | 'team' | 'branding'>('basic');

// Form state (same as existing SeasonFormDrawer)
const form = reactive<InternalSeasonForm>({
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
  race_times_required: true,
  drop_round: false,
  total_drop_rounds: 0,
  teams_drivers_for_calculation: 'all',
  teams_drop_rounds: false,
  teams_total_drop_rounds: null,
  round_totals_tiebreaker_rules_enabled: false,
});

// Track if existing images should be removed
const removeExistingLogo = ref(false);
const removeExistingBanner = ref(false);

// Tiebreaker rules (same as existing)
const orderedRules = ref<SeasonTiebreakerRule[]>([]);
const isLoadingRules = ref(false);
const tiebreakerRulesError = ref<string | null>(null);

// Slug preview (same as existing)
const slugPreview = ref('');
const slugStatus = ref<'checking' | 'available' | 'taken' | 'error' | 'timeout' | null>(null);
const slugSuggestion = ref<string | null>(null);
```

**Template Structure with Vue Transitions**:
```vue
<template>
  <BaseModal
    v-model:visible="localVisible"
    :header="modalTitle"
    width="5xl"
    :closable="!isSubmitting"
    :dismissable-mask="false"
    :loading="isLoadingData"
    :show-header="false"
    content-class="p-0"
    @hide="emit('hide')"
  >
    <!-- Custom Header -->
    <div class="modal-header">
      <div class="header-left">
        <div class="header-icon">
          <PhLayers :size="18" weight="bold" />
        </div>
        <div>
          <div class="modal-title">//SEASON_CONFIGURATION</div>
          <div class="modal-subtitle">{{ isEditMode ? 'Edit season settings' : 'Create new racing season' }}</div>
        </div>
      </div>
      <button class="modal-close" @click="handleCancel">
        <PhX :size="18" />
      </button>
    </div>

    <!-- Mobile Tab Bar -->
    <SplitModalTabBar
      :active-section="activeSection"
      class="lg:hidden"
      @section-change="activeSection = $event"
    />

    <!-- Split Layout -->
    <div class="split-layout">
      <!-- Desktop Sidebar -->
      <SplitModalSidebar
        :active-section="activeSection"
        :form="form"
        class="hidden lg:flex"
        @section-change="activeSection = $event"
      />

      <!-- Main Content with Transitions -->
      <main class="main-content">
        <Transition name="section-fade" mode="out-in">
          <!-- Basic Info Section -->
          <section v-if="activeSection === 'basic'" key="basic" class="content-section">
            <div class="section-header">
              <div class="section-title">//Basic Information</div>
              <div class="section-desc">Core season details and description</div>
            </div>
            <!-- Form fields... -->
          </section>

          <!-- Driver Settings Section -->
          <section v-else-if="activeSection === 'driver'" key="driver" class="content-section">
            <div class="section-header">
              <div class="section-title">//Driver Settings</div>
              <div class="section-desc">Configure driver championship options</div>
            </div>
            <!-- Setting cards... -->
          </section>

          <!-- Team Settings Section -->
          <section v-else-if="activeSection === 'team'" key="team" class="content-section">
            <div class="section-header">
              <div class="section-title">//Team Championship</div>
              <div class="section-desc">Configure team standings and scoring</div>
            </div>
            <!-- Team settings... -->
          </section>

          <!-- Branding Section -->
          <section v-else-if="activeSection === 'branding'" key="branding" class="content-section">
            <div class="section-header">
              <div class="section-title">//Branding Assets</div>
              <div class="section-desc">Custom logo and banner for this season</div>
            </div>
            <!-- SimpleImageUpload components... -->
          </section>
        </Transition>

        <!-- Mobile Status Summary (collapsible) -->
        <SplitModalStatusSummary
          :divisions-enabled="form.race_divisions_enabled"
          :teams-enabled="form.team_championship_enabled"
          :drop-rounds-enabled="form.drop_round"
          :tiebreakers-enabled="form.round_totals_tiebreaker_rules_enabled"
          :collapsible="true"
          class="lg:hidden"
        />
      </main>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" variant="ghost" :disabled="isSubmitting" @click="handleCancel" />
        <Button
          :label="isEditMode ? 'Save Changes' : 'Create Season'"
          variant="primary"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <template #icon>
            <PhCheck :size="14" />
          </template>
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
```

---

### Phase 3: Vue Transition Animations

#### 3.1 Section Transition
```css
/* Section fade transition */
.section-fade-enter-active,
.section-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.section-fade-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.section-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
```

#### 3.2 Nested Options Transition (in SettingCard)
```vue
<template>
  <div class="setting-card" :class="{ active: modelValue }" @click="toggle">
    <!-- Checkbox, title, description... -->

    <Transition name="nested-expand">
      <div v-if="modelValue && $slots.default" class="nested-options">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style>
.nested-expand-enter-active,
.nested-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.nested-expand-enter-from,
.nested-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  margin-top: 0;
}
</style>
```

---

### Phase 4: Responsive Design

#### 4.1 Breakpoint Strategy
- **Desktop (lg: 1024px+)**: Sidebar visible, tab bar hidden
- **Mobile (<1024px)**: Sidebar hidden, tab bar visible

#### 4.2 CSS Media Queries
```css
/* Split Layout */
.split-layout {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 70vh;
}

@media (min-width: 1024px) {
  .split-layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    min-height: 500px;
  }
}

/* Sidebar (desktop only) */
.sidebar {
  display: none;
}

@media (min-width: 1024px) {
  .sidebar {
    display: flex;
    flex-direction: column;
    background: var(--modal-bg-panel);
    border-right: 1px solid var(--modal-border);
  }
}

/* Tab Bar (mobile only) */
.tab-bar {
  display: flex;
  background: var(--modal-bg-panel);
  border-bottom: 1px solid var(--modal-border);
  overflow-x: auto;
}

@media (min-width: 1024px) {
  .tab-bar {
    display: none;
  }
}
```

---

### Phase 5: Styling

#### 5.1 CSS Variables (Design System)
```css
:root {
  /* Dark theme - matching design-2.html */
  --modal-bg-dark: #0d1117;
  --modal-bg-panel: #161b22;
  --modal-bg-card: #1c2128;
  --modal-bg-elevated: #21262d;
  --modal-bg-highlight: #272d36;
  --modal-text-primary: #e6edf3;
  --modal-text-secondary: #8b949e;
  --modal-text-muted: #6e7681;
  --modal-cyan: #58a6ff;
  --modal-cyan-dim: rgba(88, 166, 255, 0.15);
  --modal-green: #7ee787;
  --modal-green-dim: rgba(126, 231, 135, 0.15);
  --modal-orange: #f0883e;
  --modal-orange-dim: rgba(240, 136, 62, 0.15);
  --modal-red: #f85149;
  --modal-border: #30363d;
  --modal-radius: 6px;
  --modal-font-mono: 'IBM Plex Mono', 'SF Mono', monospace;
}
```

#### 5.2 Key Component Styles (See design-2.html for complete CSS)

---

### Phase 6: Testing

#### 6.1 Unit Tests
**Location**: `resources/app/js/components/season/modals/__tests__/`

```typescript
// SeasonFormSplitModal.test.ts
describe('SeasonFormSplitModal', () => {
  describe('rendering', () => {
    it('renders modal when visible is true');
    it('displays correct title for create mode');
    it('displays correct title for edit mode');
    it('shows sidebar on desktop viewport');
    it('shows tab bar on mobile viewport');
  });

  describe('navigation', () => {
    it('starts with Basic Info section active');
    it('navigates to Driver Settings on sidebar click');
    it('navigates to Driver Settings on tab click');
    it('applies transition classes during navigation');
  });

  describe('status summary', () => {
    it('shows OFF for all settings by default');
    it('shows ON when divisions enabled');
    it('shows ON when teams enabled');
    it('shows ON when drop rounds enabled');
    it('shows ON when tiebreakers enabled');
  });

  describe('form validation', () => {
    it('requires season name');
    it('validates name minimum length');
    it('shows slug preview on name input');
  });

  describe('image upload', () => {
    it('allows selecting new logo');
    it('allows selecting new banner');
    it('allows removing existing logo');
    it('allows removing existing banner');
    it('shows preview of selected image');
  });

  describe('submission', () => {
    it('calls create API in create mode');
    it('calls update API in edit mode');
    it('includes remove flags when existing images removed');
    it('emits season-saved on success');
    it('shows error toast on failure');
  });

  describe('coexistence', () => {
    it('does not affect SeasonFormDrawer functionality');
    it('uses same store and service as SeasonFormDrawer');
  });
});

// partials/__tests__/SimpleImageUpload.test.ts
describe('SimpleImageUpload', () => {
  it('renders upload prompt when no image');
  it('renders preview when image selected');
  it('renders preview when existing image URL provided');
  it('shows remove button on preview');
  it('emits update:modelValue on file select');
  it('emits remove-existing when remove clicked');
  it('clears file and emits null when remove clicked');
});

// partials/__tests__/SettingCard.test.ts
describe('SettingCard', () => {
  it('renders title and description');
  it('toggles on click');
  it('shows nested content when active');
  it('hides nested content when inactive');
  it('applies active styling');
  it('animates nested options with transition');
});

// partials/__tests__/SplitModalTabBar.test.ts
describe('SplitModalTabBar', () => {
  it('renders all 4 tabs');
  it('highlights active tab');
  it('emits section-change on tab click');
  it('is scrollable on small screens');
});
```

---

## Implementation Order

1. **Create partials folder**: `resources/app/js/components/season/modals/partials/`

2. **Implement SplitModalNavItem.vue** - Simple nav item (shared by sidebar + tab bar)

3. **Implement SplitModalStatusSummary.vue** - Status display with collapsible mode

4. **Implement SettingCard.vue** - Toggleable setting card with Vue Transition

5. **Implement SimpleImageUpload.vue** - Simplified upload with remove capability

6. **Implement TiebreakerRulesList.vue** - Draggable rules list

7. **Implement SplitModalSidebar.vue** - Desktop sidebar

8. **Implement SplitModalTabBar.vue** - Mobile tab bar

9. **Implement SeasonFormSplitModal.vue** - Main component
   - Copy form logic from SeasonFormDrawer.vue
   - Replace template with split-panel layout
   - Add Vue Transitions
   - Add responsive classes
   - Add styling

10. **Write unit tests** for all components

11. **Integration testing** - Manual testing with real data on desktop + mobile

---

## Estimated LOC

| File | Lines |
|------|-------|
| SeasonFormSplitModal.vue | ~650 |
| SplitModalSidebar.vue | ~100 |
| SplitModalTabBar.vue | ~80 |
| SplitModalNavItem.vue | ~70 |
| SplitModalStatusSummary.vue | ~100 |
| SettingCard.vue | ~120 |
| SimpleImageUpload.vue | ~150 |
| TiebreakerRulesList.vue | ~120 |
| Tests | ~500 |
| **Total** | **~1890** |

---

## Dependencies

- Vue 3.5+ (Transition component built-in)
- PrimeVue 4 (InputText, Textarea, InputNumber, Select, OrderList)
- Tailwind CSS 4
- @vueuse/core (useDebounceFn, useBreakpoints for responsive detection)
- @phosphor-icons/vue (PhLayers, PhX, PhCheck, PhUpload, etc.)
- Existing common components (BaseModal, FormInputGroup, FormLabel, FormError, Button)
- Existing season store/service/types (no changes needed)

---

## Notes

- This component **coexists** with `SeasonFormDrawer.vue` - both can be used independently
- The parent component decides which modal to show (e.g., via a prop or feature flag)
- Form logic is copied from SeasonFormDrawer to maintain consistency while allowing independent evolution
- Consider extracting shared form logic into a composable in the future if both components need to stay in sync
