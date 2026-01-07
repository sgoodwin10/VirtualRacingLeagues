# Edit League Modal - Frontend Implementation Plan

## Agent: `dev-fe-app`

This document outlines the detailed frontend implementation plan for the Edit League Modal component.

## Phase 1: Core Modal Structure

### 1.1 Create Main Modal Component

**File:** `resources/app/js/components/league/modals/EditLeagueModal.vue`

```typescript
// Props
interface Props {
  visible: boolean;
  isEditMode?: boolean;
  leagueId?: number;
}

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'league-saved'): void;
}

// State
- activeSection: ref<'basic' | 'contact' | 'media' | 'social'>('basic')
- form: reactive<CreateLeagueForm>({...})
- errors: reactive<FormErrors>({})
- isSubmitting: ref(false)
- isLoadingLeague: ref(false)
- slugAvailable: ref<boolean | null>(null)
- generatedSlug: ref<string>('')
```

**Key Features:**
- Use `BaseModal` as wrapper with `width="4xl"` (~960px)
- Split layout using CSS Grid: `grid-template-columns: 200px 1fr`
- Dark theme styling via CSS custom properties
- Section-based content rendering

### 1.2 Create Modal Header Component

**File:** `resources/app/js/components/league/modals/partials/EditLeagueHeader.vue`

```vue
<template>
  <div class="modal-header">
    <div class="header-left">
      <div class="header-icon">
        <PhFlag :size="18" weight="bold" />
      </div>
      <div>
        <div class="modal-title">//LEAGUE_CONFIGURATION</div>
        <div class="modal-subtitle">{{ subtitle }}</div>
      </div>
    </div>
    <button class="modal-close" @click="$emit('close')">
      <PhX :size="18" />
    </button>
  </div>
</template>
```

**Props:**
- `subtitle: string` - "Create new racing league" or "Edit [league name]"
- Emit: `close`

### 1.3 Create Sidebar Navigation Component

**File:** `resources/app/js/components/league/modals/partials/EditLeagueSidebar.vue`

```typescript
interface Props {
  activeSection: string;
  completionStatus: {
    name: string | null;
    platformsCount: number;
    visibility: string;
    mediaCount: number;
  };
  progress: number;
}

interface Emits {
  (e: 'navigate', section: string): void;
}
```

**Navigation Items:**
```typescript
const sections = [
  { id: 'basic', label: 'Basic Info', icon: PhFile, required: true },
  { id: 'contact', label: 'Contact', icon: PhUser },
  { id: 'media', label: 'Media', icon: PhImage },
  { id: 'social', label: 'Social Links', icon: PhLink },
];
```

**Status Summary Component (inline):**
- Name: Shows truncated name or "--"
- Platforms: Shows count
- Visibility: Shows "PUBLIC" or "UNLISTED"
- Media: Shows "X/3" count
- Progress bar with gradient fill

## Phase 2: Form Section Components

### 2.1 Basic Info Section

**File:** `resources/app/js/components/league/modals/partials/sections/BasicInfoSection.vue`

**Props:**
```typescript
interface Props {
  form: CreateLeagueForm;
  errors: FormErrors;
  slugAvailable: boolean | null;
  generatedSlug: string;
  suggestedSlug: string | null;
  isCheckingSlug: boolean;
  platforms: Platform[];
  timezones: Timezone[];
  visibilityOptions: VisibilityOption[];
}
```

**Form Fields:**
1. **League Name** with slug indicator
   - Use `InputText` from PrimeVue
   - Show slug preview inline with animated indicator
   - Display availability status (green dot = available, red = taken)

2. **Tagline**
   - `InputText` with maxlength="150"
   - Helper text below

3. **Platforms** (use new `PlatformChips.vue`)
   - Chip-style selection instead of MultiSelect
   - Required field

4. **Description**
   - `Editor` from PrimeVue with limited toolbar
   - Same config as LeagueWizardDrawer

5. **Visibility** (use new `VisibilityToggle.vue`)
   - Segmented control with status panel

6. **Timezone**
   - `Select` from PrimeVue with filter

### 2.2 Contact Section

**File:** `resources/app/js/components/league/modals/partials/sections/ContactSection.vue`

**Form Fields:**
1. **Contact Email**
   - `InputText` type="email"
   - Helper text: "Visible to league members for inquiries"

2. **Contact Name**
   - `InputText` with maxlength="100"
   - Helper text: "Displayed as the league organizer"

### 2.3 Media Section

**File:** `resources/app/js/components/league/modals/partials/sections/MediaSection.vue`

**Layout:** 3-column grid for uploads

**Components:**
1. **Info Banner** (use `InfoBox.vue`)
   - Blue info banner explaining all media is optional

2. **Logo Upload**
   - Use `ImageUpload.vue`
   - Square aspect ratio
   - Helper: "400x400px"

3. **Banner Upload**
   - Use `ImageUpload.vue`
   - Helper: "200-800px wide"

4. **Header Image Upload**
   - Use `ImageUpload.vue`
   - Helper: "1200x400px"

### 2.4 Social Links Section

**File:** `resources/app/js/components/league/modals/partials/sections/SocialSection.vue`

**Reuse:** `SocialMediaFields.vue` component with custom styling

Apply the design-1.html social input styling:
- Icon prefix in addon
- 2-column grid layout

## Phase 3: New Reusable Components

### 3.1 Platform Chips Component

**File:** `resources/app/js/components/common/forms/PlatformChips.vue`

```typescript
interface Props {
  modelValue: number[];
  platforms: Platform[];
  error?: string;
  required?: boolean;
}
```

**Template Structure:**
```vue
<template>
  <FormInputGroup>
    <FormLabel text="Platforms" :required="required" />
    <div class="platform-chips">
      <button
        v-for="platform in platforms"
        :key="platform.id"
        type="button"
        class="platform-chip"
        :class="{ selected: isSelected(platform.id) }"
        @click="toggle(platform.id)"
      >
        <component :is="getPlatformIcon(platform.slug)" :size="16" />
        {{ platform.name }}
      </button>
    </div>
    <FormHelper text="Select all platforms your league supports" />
    <FormError :error="error" />
  </FormInputGroup>
</template>
```

**Styling:**
```css
.platform-chip {
  @apply flex items-center gap-2 px-4 py-2;
  @apply bg-[var(--bg-card)] border border-[var(--border)] rounded-md;
  @apply cursor-pointer transition-all text-sm text-[var(--text-secondary)];
}
.platform-chip:hover {
  @apply border-[var(--cyan)] text-[var(--text-primary)];
}
.platform-chip.selected {
  @apply bg-[var(--cyan-dim)] border-[var(--cyan)] text-[var(--cyan)];
}
```

### 3.2 Visibility Toggle Component

**File:** `resources/app/js/components/common/forms/VisibilityToggle.vue`

```typescript
interface Props {
  modelValue: 'public' | 'unlisted';
  error?: string;
}

const options = [
  { value: 'public', label: 'Public', icon: PhGlobe },
  { value: 'unlisted', label: 'Unlisted', icon: PhEyeSlash },
];

const statusConfig = {
  public: {
    title: 'Discoverable in Search',
    description: 'Your league will appear in search results and can be found by anyone...',
    colorClass: 'public',
  },
  unlisted: {
    title: 'Link Access Only',
    description: 'Your league is hidden from search. Only people with a direct link...',
    colorClass: 'unlisted',
  },
};
```

**Template Structure:**
```vue
<template>
  <FormInputGroup>
    <FormLabel text="Visibility" />

    <!-- Segmented Control -->
    <div class="visibility-toggle">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="visibility-option"
        :class="{ active: modelValue === option.value, [option.value]: true }"
        @click="$emit('update:modelValue', option.value)"
      >
        <component :is="option.icon" :size="16" />
        {{ option.label }}
      </button>
    </div>

    <!-- Status Panel -->
    <div class="visibility-status" :class="modelValue">
      <div class="visibility-status-icon">
        <component :is="currentIcon" :size="16" />
      </div>
      <div class="visibility-status-content">
        <div class="visibility-status-title">{{ currentStatus.title }}</div>
        <div class="visibility-status-desc">{{ currentStatus.description }}</div>
      </div>
    </div>

    <FormError :error="error" />
  </FormInputGroup>
</template>
```

## Phase 4: Styling

### 4.1 CSS Variables

Add to `resources/app/css/app.css` or component styles:

```css
:root {
  --bg-dark: #0d1117;
  --bg-panel: #161b22;
  --bg-card: #1c2128;
  --bg-elevated: #21262d;
  --bg-highlight: #272d36;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  --cyan: #58a6ff;
  --cyan-dim: rgba(88, 166, 255, 0.15);
  --green: #7ee787;
  --green-dim: rgba(126, 231, 135, 0.15);
  --orange: #f0883e;
  --orange-dim: rgba(240, 136, 62, 0.15);
  --red: #f85149;
  --border: #30363d;
  --radius: 6px;
}
```

### 4.2 Component-Specific Styles

Each component should include scoped styles matching design-1.html aesthetics:
- Monospace fonts for labels (`font-family: var(--font-mono)`)
- Terminal-style section headers (`//SECTION_NAME`)
- Subtle animations on interactions
- Focus states with cyan glow

## Phase 5: Logic & State Management

### 5.1 Form State Management

```typescript
// In EditLeagueModal.vue
const form = reactive<CreateLeagueForm>({
  name: '',
  logo: null,
  logo_url: undefined,
  platform_ids: [],
  timezone: '',
  visibility: 'public',
  tagline: '',
  description: '',
  banner: null,
  banner_url: undefined,
  header_image: null,
  header_image_url: undefined,
  contact_email: '',
  organizer_name: '',
  discord_url: '',
  website_url: '',
  twitter_handle: '',
  instagram_handle: '',
  youtube_url: '',
  twitch_url: '',
});
```

### 5.2 Completion Status Computation

```typescript
const completionStatus = computed(() => ({
  name: form.name.trim() || null,
  platformsCount: form.platform_ids.length,
  visibility: form.visibility.toUpperCase(),
  mediaCount: [form.logo, form.banner, form.header_image].filter(Boolean).length,
}));

const progress = computed(() => {
  let score = 0;
  const total = 100;

  // Required fields (80% weight)
  if (form.name.trim()) score += 40;
  if (form.platform_ids.length > 0) score += 40;

  // Optional fields (20% weight)
  if (form.tagline) score += 5;
  if (form.description) score += 5;
  if (form.contact_email) score += 5;
  if (completionStatus.value.mediaCount > 0) score += 5;

  return Math.min(score, total);
});
```

### 5.3 Section Navigation

```typescript
const activeSection = ref<'basic' | 'contact' | 'media' | 'social'>('basic');

const navigateToSection = (section: string) => {
  activeSection.value = section as typeof activeSection.value;
};
```

### 5.4 Slug Checking (Debounced)

Reuse logic from `LeagueWizardDrawer.vue`:
```typescript
const debouncedName = useDebounce(computed(() => form.name), 500);

watch(debouncedName, async (newName) => {
  if (!newName?.trim()) {
    slugAvailable.value = null;
    return;
  }
  await checkSlugAvailability();
});
```

## Phase 6: Testing

### Unit Tests

**File:** `resources/app/js/components/league/modals/__tests__/EditLeagueModal.test.ts`

Test cases:
1. Modal renders with correct structure
2. Navigation between sections works
3. Form fields update state correctly
4. Validation errors display properly
5. Submit button enables when required fields filled
6. Platform chips select/deselect
7. Visibility toggle updates status panel
8. Slug checking displays correct status
9. Progress bar updates on field changes
10. Edit mode loads existing league data

**File:** `resources/app/js/components/common/forms/__tests__/PlatformChips.test.ts`

Test cases:
1. Renders all platforms
2. Toggle selection on click
3. Emits updated model value
4. Shows error state

**File:** `resources/app/js/components/common/forms/__tests__/VisibilityToggle.test.ts`

Test cases:
1. Renders both options
2. Active state on selected option
3. Status panel updates on change
4. Emits model value updates

## Phase 7: Migration (Replace LeagueWizardDrawer)

### 7.1 Find All Usages

Search for all imports and usages of `LeagueWizardDrawer`:

```bash
grep -r "LeagueWizardDrawer" resources/app/js/
```

Expected locations:
- Views that display league creation/editing UI
- Parent components controlling modal state

### 7.2 Update Imports

Replace imports in each file:

```typescript
// Before
import LeagueWizardDrawer from '@app/components/league/modals/LeagueWizardDrawer.vue';

// After
import EditLeagueModal from '@app/components/league/modals/EditLeagueModal.vue';
```

### 7.3 Update Component Usage

The props interface is identical, so usage should be a simple rename:

```vue
<!-- Before -->
<LeagueWizardDrawer
  v-model:visible="showLeagueModal"
  :is-edit-mode="isEditing"
  :league-id="selectedLeagueId"
  @league-saved="onLeagueSaved"
/>

<!-- After -->
<EditLeagueModal
  v-model:visible="showLeagueModal"
  :is-edit-mode="isEditing"
  :league-id="selectedLeagueId"
  @league-saved="onLeagueSaved"
/>
```

### 7.4 Cleanup

After all usages are migrated and verified working:

1. Delete `LeagueWizardDrawer.vue`:
   ```bash
   rm resources/app/js/components/league/modals/LeagueWizardDrawer.vue
   ```

2. Remove any related test files if they exist

3. Update any documentation references

### 7.5 Verification Checklist

Before deleting the old component, verify:

- [ ] Create league flow works
- [ ] Edit league flow works
- [ ] All form fields save correctly
- [ ] Slug checking works
- [ ] Image uploads work
- [ ] Validation errors display correctly
- [ ] Modal opens and closes properly
- [ ] No console errors

## Implementation Order

1. **Phase 1**: Core modal structure and header
2. **Phase 2**: Section components (Basic first, then others)
3. **Phase 3**: Reusable components (PlatformChips, VisibilityToggle)
4. **Phase 4**: Apply styling across all components
5. **Phase 5**: Wire up state management and form logic
6. **Phase 6**: Write tests
7. **Phase 7**: Migration - Replace LeagueWizardDrawer usages and cleanup

## Dependencies

- PrimeVue components: `Dialog`, `InputText`, `Select`, `Editor`
- Phosphor Icons: `PhFlag`, `PhFile`, `PhUser`, `PhImage`, `PhLink`, `PhGlobe`, `PhEyeSlash`, `PhX`, `PhDesktop`, `PhGameController`
- VueUse: `useDebounce`
- Existing components: `BaseModal`, `FormLabel`, `FormInputGroup`, `FormError`, `FormHelper`, `ImageUpload`, `SocialMediaFields`, `InfoBox`, `Button`
