# App Components Guide

**Path**: `/var/www/resources/app/js/components/`

This guide provides comprehensive documentation for all components in the User Dashboard (App) frontend. It covers component patterns, common components, domain-specific components, and best practices.

---

## Table of Contents

1. [Overview](#overview)
2. [Component Patterns](#component-patterns)
3. [Common Components Library](#common-components-library)
4. [Domain Components](#domain-components)
5. [PrimeVue Components](#primevue-components)
6. [Icon System](#icon-system)
7. [Component Communication](#component-communication)
8. [Component Testing](#component-testing)
9. [Best Practices](#best-practices)

---

## Overview

The app frontend follows a domain-driven component architecture with clear separation of concerns:

```
resources/app/js/components/
├── App.vue                      # Root application component
├── layout/                      # Layout components (Header, Footer, etc.)
├── common/                      # Reusable common components
│   ├── forms/                   # Form-specific components
│   ├── modals/                  # Modal/drawer components
│   └── panels/                  # Panel components
├── competition/                 # Competition domain components
├── driver/                      # Driver domain components
├── league/                      # League domain components
├── profile/                     # Profile domain components
├── round/                       # Round domain components
└── season/                      # Season domain components
    ├── divisions/               # Division sub-domain
    └── teams/                   # Team sub-domain
```

### Component Organization Principles

1. **Domain-Driven**: Components are organized by business domain (league, competition, season, driver, round)
2. **Reusability**: Common components are extracted to `common/` directory
3. **Colocated Tests**: Test files are colocated with components in `__tests__/` directories
4. **Single Responsibility**: Each component has a focused, well-defined purpose
5. **TypeScript First**: All components use TypeScript with strict typing

---

## Component Patterns

### 1. Composition API Pattern

All components use Vue 3's Composition API with `<script setup lang="ts">` syntax:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  title: string;
  description?: string;
  required?: boolean;
}

interface Emits {
  (e: 'submit', value: string): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  required: false,
});

const emit = defineEmits<Emits>();

// Local state
const isLoading = ref(false);

// Computed properties
const displayTitle = computed(() =>
  props.required ? `${props.title} *` : props.title
);

// Methods
function handleSubmit(): void {
  emit('submit', 'value');
}
</script>

<template>
  <div class="component-wrapper">
    <h3>{{ displayTitle }}</h3>
    <p v-if="description">{{ description }}</p>
  </div>
</template>
```

**Key Points:**
- Use `interface` for Props and Emits
- Use `withDefaults()` for default prop values
- Type all emits with payload types
- Use `ref` for reactive state, `computed` for derived state
- All methods have explicit return types

### 2. Props & Emits Pattern

Components follow unidirectional data flow: **props down, events up**.

#### Common Emit Patterns

**CRUD Operations:**
```typescript
interface Emits {
  (e: 'create', data: CreateData): void;
  (e: 'update', id: number, data: UpdateData): void;
  (e: 'delete', id: number): void;
  (e: 'archive', id: number): void;
}
```

**Form Events:**
```typescript
interface Emits {
  (e: 'submit', formData: FormData): void;
  (e: 'cancel'): void;
  (e: 'reset'): void;
}
```

**View Events:**
```typescript
interface Emits {
  (e: 'view', id: number): void;
  (e: 'edit', id: number): void;
  (e: 'close'): void;
}
```

#### v-model Pattern for Dialogs/Drawers

For modal/drawer visibility, use the v-model pattern:

```typescript
interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

// In parent component:
// <MyDrawer v-model:visible="isDrawerVisible" />
```

For form inputs with v-model:

```typescript
interface Props {
  modelValue: string | File | null;
}

interface Emits {
  (e: 'update:modelValue', value: string | File | null): void;
}

// In parent component:
// <ImageUpload v-model="logo" label="Upload Logo" />
```

### 3. Component Naming Conventions

**File Names**: Use PascalCase for all component files
- ✅ `LeagueCard.vue`
- ✅ `DriverFormDialog.vue`
- ❌ `league-card.vue`
- ❌ `driverFormDialog.vue`

**Domain-Prefixed Components**: Components are prefixed by their domain
- League components: `LeagueCard`, `LeagueWizardDrawer`, `LeagueVisibilityTag`
- Competition components: `CompetitionCard`, `CompetitionList`, `CompetitionFormDrawer`
- Season components: `SeasonCard`, `SeasonList`, `SeasonFormDrawer`
- Driver components: `DriverTable`, `DriverFormDialog`, `DriverStatusBadge`
- Round components: `RoundsPanel`, `RaceListItem`, `QualifierListItem`

**Subdomain Organization**: Complex domains use subdirectories
- `season/divisions/DivisionsPanel.vue`
- `season/teams/TeamsPanel.vue`
- `driver/modals/DriverFormDialog.vue`
- `league/partials/SocialMediaFields.vue`

**Common Components**: No domain prefix for reusable components
- `FormLabel`, `FormError`, `PageHeader`, `HTag`, `InfoItem`

---

## Common Components Library

### Form Components

Located in: `/var/www/resources/app/js/components/common/forms/`

#### FormLabel

Displays consistent form labels with optional required indicator.

**Props:**
```typescript
interface Props {
  for?: string;        // ID of associated input
  required?: boolean;  // Shows asterisk if true
  text: string;        // Label text
  class?: string;      // Additional CSS classes
}
```

**Usage:**
```vue
<FormLabel
  for="league-name"
  text="League Name"
  :required="true"
/>
```

**Renders:**
```html
<label for="league-name" class="block text-sm font-medium text-gray-700 mb-2">
  League Name <span class="text-red-500">*</span>
</label>
```

---

#### FormError

Displays validation error messages below form fields.

**Props:**
```typescript
interface Props {
  error?: string | string[];  // Error message(s)
  class?: string;             // Additional CSS classes
}
```

**Usage:**
```vue
<FormError :error="errors.name" />
<!-- Or with array of errors -->
<FormError :error="['Name is required', 'Name must be unique']" />
```

**Renders:**
```html
<small class="text-sm text-red-500 mt-1">
  Name is required
</small>
```

**Features:**
- Accepts single error string or array (shows first error)
- Conditionally renders (hidden if no error)
- Consistent styling

---

#### FormInputGroup

Wraps form fields with consistent spacing.

**Props:**
```typescript
interface Props {
  spacing?: string;  // Tailwind space-y class (default: 'space-y-1')
  class?: string;    // Additional CSS classes
}
```

**Usage:**
```vue
<FormInputGroup spacing="space-y-2">
  <FormLabel for="name" text="Name" required />
  <InputText id="name" v-model="form.name" />
  <FormError :error="errors.name" />
</FormInputGroup>
```

**Renders:**
```html
<div class="space-y-2">
  <!-- Children with consistent spacing -->
</div>
```

---

#### FormHelper

Displays helper text to guide users.

**Props:**
```typescript
interface Props {
  text: string;      // Helper text content
  class?: string;    // Additional CSS classes
}
```

**Usage:**
```vue
<FormHelper text="Enter a unique name for your league (max 100 characters)" />
```

**Renders:**
```html
<small class="text-sm text-gray-500 mt-1">
  Enter a unique name for your league (max 100 characters)
</small>
```

---

#### FormOptionalText

Displays "(optional)" text next to non-required fields.

**Props:**
```typescript
interface Props {
  class?: string;    // Additional CSS classes
}
```

**Usage:**
```vue
<div class="flex items-baseline gap-2">
  <FormLabel for="tagline" text="Tagline" />
  <FormOptionalText />
</div>
```

**Renders:**
```html
<span class="text-xs text-gray-500">(optional)</span>
```

---

#### FormCharacterCount

Displays character count for text inputs with max length.

**Props:**
```typescript
interface Props {
  current: number;   // Current character count
  max: number;       // Maximum allowed characters
  class?: string;    // Additional CSS classes
}
```

**Usage:**
```vue
<FormCharacterCount :current="form.name.length" :max="100" />
```

**Renders:**
```html
<small class="text-xs text-gray-500">
  45 / 100 characters
</small>
```

**Features:**
- Changes color to warning/danger as limit approaches
- Real-time character count

---

#### ImageUpload

Full-featured image upload component with validation, preview, and drag-and-drop.

**Props:**
```typescript
interface Props {
  modelValue: File | null;
  existingImageUrl?: string | null;
  label: string;
  accept?: string;                   // Default: 'image/*'
  maxFileSize?: number;              // Default: 2000000 (2MB)
  minDimensions?: { width: number; height: number };
  recommendedDimensions?: { width: number; height: number };
  required?: boolean;
  error?: string;
  previewSize?: 'small' | 'medium' | 'large';
  helperText?: string;
  labelText?: string;
}
```

**Emits:**
```typescript
interface Emits {
  (e: 'update:modelValue', value: File | null): void;
  (e: 'remove-existing'): void;
}
```

**Usage:**
```vue
<ImageUpload
  v-model="form.logo"
  label="League Logo"
  :existing-image-url="league.logo_url"
  :required="true"
  :max-file-size="2000000"
  :min-dimensions="{ width: 200, height: 200 }"
  helper-text="Upload a square logo (recommended 500x500px)"
  preview-size="medium"
  :error="errors.logo"
  @remove-existing="handleRemoveExistingLogo"
/>
```

**Features:**
- Image preview with PrimeVue Image component (with preview zoom)
- Validates file type (images only)
- Validates file size
- Validates minimum dimensions
- Shows existing image with ability to change
- Remove button for clearing selection
- Helper text and error display
- Customizable preview size

**Example with validation:**
```vue
<script setup lang="ts">
import { ref } from 'vue';
import ImageUpload from '@app/components/common/forms/ImageUpload.vue';

const logo = ref<File | null>(null);
const existingLogoUrl = ref<string | null>('https://example.com/logo.png');
const logoError = ref<string>('');

function handleRemoveExisting(): void {
  existingLogoUrl.value = null;
}
</script>

<template>
  <ImageUpload
    v-model="logo"
    label="Upload Logo"
    :existing-image-url="existingLogoUrl"
    :max-file-size="2000000"
    :min-dimensions="{ width: 200, height: 200 }"
    :error="logoError"
    @remove-existing="handleRemoveExisting"
  />
</template>
```

---

### Layout Components

Located in: `/var/www/resources/app/js/components/common/`

#### PageHeader

Displays page title and optional description.

**Props:**
```typescript
interface Props {
  title: string;
  description?: string;
}
```

**Usage:**
```vue
<PageHeader
  title="Your Leagues"
  description="Manage your racing leagues and competitions"
/>
```

**Renders:**
```html
<div class="w-full">
  <h1 class="text-3xl font-bold mb-2">Your Leagues</h1>
  <div class="text-gray-600">Manage your racing leagues and competitions</div>
</div>
```

---

#### HTag

Semantic heading component with consistent typography.

**Props:**
```typescript
interface Props {
  level?: 1 | 2 | 3 | 4 | 5 | 6;     // Default: 1
  additionalClasses?: string;         // Merged with defaults
  overrideClasses?: string;           // Replaces defaults
}
```

**Default Styles:**
- h1: `text-3xl font-bold`
- h2: `text-2xl font-bold`
- h3: `text-xl font-semibold`
- h4: `text-lg font-semibold`
- h5: `text-base font-semibold`
- h6: `text-sm font-semibold`

**Usage:**
```vue
<!-- Default h1 -->
<HTag>Main Title</HTag>

<!-- h2 with additional classes -->
<HTag :level="2" additional-classes="mb-4 text-primary">Section Title</HTag>

<!-- h3 with override classes (replaces defaults) -->
<HTag :level="3" override-classes="text-4xl font-black uppercase">Custom</HTag>
```

**When to Use:**
- Use `additionalClasses` to extend default styles
- Use `overrideClasses` when you need completely custom styling
- Prefer `HTag` over raw `<h1>`, `<h2>`, etc. for consistency

---

#### Breadcrumbs

Navigation breadcrumbs for hierarchical pages.

**Interface:**
```typescript
interface BreadcrumbItem {
  label: string;
  to?: RouteLocationRaw;  // Vue Router route (optional for current page)
  icon?: string;          // PrimeIcons class
}

interface Props {
  items: BreadcrumbItem[];           // 1-5 items supported
  separator?: string;                 // Default: 'pi-chevron-right'
  textSeparator?: boolean;            // Use text instead of icon
}
```

**Usage:**
```vue
<script setup lang="ts">
import Breadcrumbs from '@app/components/common/Breadcrumbs.vue';

const breadcrumbItems = [
  { label: 'Home', to: { name: 'home' }, icon: 'pi-home' },
  { label: 'Leagues', to: { name: 'league-list' } },
  { label: 'My League', to: { name: 'league-detail', params: { id: 1 } } },
  { label: 'Competition Settings' }, // Current page (no 'to')
];
</script>

<template>
  <Breadcrumbs :items="breadcrumbItems" />
</template>
```

**Features:**
- Automatically disables last item (current page)
- Supports Vue Router navigation
- Optional icons per item
- Accessible with ARIA labels
- Responsive design

---

#### InfoItem

Displays labeled information with an icon (commonly used in cards).

**Props:**
```typescript
interface Props {
  icon: Component;      // Phosphor icon component
  title?: string;       // Optional title above text
  text: string;         // Main text content
  centered?: boolean;   // Center alignment
}
```

**Usage:**
```vue
<script setup lang="ts">
import InfoItem from '@app/components/common/InfoItem.vue';
import { PhGameController, PhSteeringWheel } from '@phosphor-icons/vue';
</script>

<template>
  <!-- With title -->
  <InfoItem
    :icon="PhGameController"
    title="Platform"
    text="PlayStation 5"
  />

  <!-- Without title, centered -->
  <InfoItem
    :icon="PhSteeringWheel"
    text="24 Drivers"
    centered
  />
</template>
```

**Renders:**
```html
<!-- With title -->
<div class="flex gap-2 bg-slate-50 py-3 px-3 group">
  <component :is="icon" :size="28" class="..." />
  <div class="flex flex-col space-y-0.5 pl-1">
    <span class="text-xs uppercase text-primary-300">Platform</span>
    <span class="text-slate-600">PlayStation 5</span>
  </div>
</div>

<!-- Without title, centered -->
<div class="flex gap-2 bg-slate-50 py-3 px-3 group justify-center">
  <component :is="icon" :size="28" class="..." />
  <div class="flex items-center text-slate-600">24 Drivers</div>
</div>
```

**Common Usage Pattern:**
```vue
<div class="grid grid-cols-2 gap-px bg-surface-200">
  <InfoItem :icon="PhGameController" title="Platform" :text="league.platform_name" />
  <InfoItem :icon="PhMapPinArea" title="Timezone" :text="league.timezone" />
  <InfoItem :icon="PhTrophy" title="Competitions" :text="competitionsText" />
  <InfoItem :icon="PhSteeringWheel" title="Drivers" :text="driversText" />
</div>
```

---

#### BasePanel

Wrapper around PrimeVue Panel with consistent styling and v-model support.

**Props:**
```typescript
interface Props {
  collapsed?: boolean;        // v-model:collapsed support
  toggleable?: boolean;       // Can be toggled
  header?: string;            // Header text
  contentClass?: string;      // Custom content wrapper class
  footerClass?: string;       // Custom footer wrapper class
  class?: string;             // Custom panel root class
  // ... PrimeVue Panel passthrough props
}
```

**Emits:**
```typescript
interface Emits {
  (e: 'toggle', value: { originalEvent: Event; value: boolean }): void;
  (e: 'update:collapsed', value: boolean): void;
}
```

**Usage:**
```vue
<script setup lang="ts">
import { ref } from 'vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';

const isCollapsed = ref(false);
</script>

<template>
  <BasePanel
    v-model:collapsed="isCollapsed"
    header="Competition Settings"
    toggleable
    content-class="p-4"
  >
    <!-- Content -->
    <p>Panel content goes here</p>

    <!-- Footer slot -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" />
        <Button label="Save" severity="primary" />
      </div>
    </template>
  </BasePanel>
</template>
```

**Features:**
- Two-way binding with `v-model:collapsed`
- Custom slots: header, icons, default, footer
- Wrapper divs for content and footer with custom classes
- Full PrimeVue Panel API support via passthrough

---

### Modal Components

Located in: `/var/www/resources/app/js/components/common/modals/`

#### DrawerHeader

Consistent header for drawers with title and optional subtitle.

**Props:**
```typescript
interface Props {
  title: string;
  subtitle?: string;
}
```

**Usage:**
```vue
<Drawer v-model:visible="visible" position="right" class="w-full md:w-[800px]">
  <template #header>
    <DrawerHeader
      title="Create League"
      subtitle="Set up your new racing league"
    />
  </template>

  <!-- Drawer content -->
</Drawer>
```

---

#### DrawerLoading

Loading skeleton for drawer content.

**Usage:**
```vue
<Drawer v-model:visible="visible" position="right">
  <template #header>
    <DrawerHeader title="Loading..." />
  </template>

  <DrawerLoading v-if="isLoading" />
  <div v-else>
    <!-- Actual content -->
  </div>
</Drawer>
```

---

#### BaseModal

Wrapper around PrimeVue Dialog with consistent styling.

**Props:**
```typescript
interface Props {
  visible: boolean;
  header?: string;
  modal?: boolean;
  dismissableMask?: boolean;
  class?: string;
  // ... PrimeVue Dialog passthrough props
}
```

**Usage:**
```vue
<BaseModal
  v-model:visible="isModalVisible"
  header="Confirm Delete"
  :dismissable-mask="true"
>
  <p>Are you sure you want to delete this league?</p>

  <template #footer>
    <Button label="Cancel" severity="secondary" @click="isModalVisible = false" />
    <Button label="Delete" severity="danger" @click="handleDelete" />
  </template>
</BaseModal>
```

---

#### BaseModalHeader

Consistent header for modals.

**Props:**
```typescript
interface Props {
  title: string;
  subtitle?: string;
}
```

**Usage:**
```vue
<Dialog v-model:visible="visible">
  <template #header>
    <BaseModalHeader
      title="Driver Details"
      subtitle="View driver information and statistics"
    />
  </template>

  <!-- Modal content -->
</Dialog>
```

---

## Domain Components

Domain components are organized by business domain and follow consistent naming patterns.

### League Components

**Path**: `/var/www/resources/app/js/components/league/`

**Main Components:**
- `LeagueCard.vue` - Displays league information in a card layout with logo, header image, stats, and actions

**Subdirectories:**
- `modals/` - Contains `LeagueWizardDrawer.vue` for creating/editing leagues
- `partials/` - Contains:
  - `LeagueVisibilityTag.vue` - Displays visibility status (public, private, etc.)
  - `SocialMediaFields.vue` - Social media input fields for league
  - `PlatformMultiSelect.vue` - Platform selection component

**Example - LeagueCard:**
```vue
<script setup lang="ts">
import LeagueCard from '@app/components/league/LeagueCard.vue';
import type { League } from '@app/types/league';

interface Emits {
  (e: 'view', leagueId: number): void;
  (e: 'edit', leagueId: number): void;
  (e: 'delete', leagueId: number): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <LeagueCard
      v-for="league in leagues"
      :key="league.id"
      :league="league"
      @view="emit('view', $event)"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>
```

---

### Competition Components

**Path**: `/var/www/resources/app/js/components/competition/`

**Main Components:**
- `CompetitionCard.vue` - Card display with seasons, stats, and actions
- `CompetitionList.vue` - List view of competitions
- `CompetitionHeader.vue` - Page header for competition detail
- `CompetitionSettings.vue` - Competition settings form
- `CompetitionFormDrawer.vue` - Create/edit competition drawer
- `CompetitionDeleteDialog.vue` - Delete confirmation dialog

**Pattern:**
- Card components display data with actions
- Form components handle create/update
- Delete components use confirmation dialogs
- Header components provide context for detail pages

---

### Season Components

**Path**: `/var/www/resources/app/js/components/season/`

**Main Components:**
- `SeasonCard.vue` - Season card with status and stats
- `SeasonList.vue` - List of seasons
- `SeasonHeader.vue` - Season detail page header
- `SeasonSettings.vue` - Season settings form
- `SeasonDriversTable.vue` - Table of drivers in season
- `AvailableDriversTable.vue` - Table of available drivers to add

**Subdirectories:**

**`divisions/`** - Division management
- `DivisionsPanel.vue` - Main panel for division management
- `DivisionFormModal.vue` - Create/edit division form

**`teams/`** - Team management
- `TeamsPanel.vue` - Main panel for team management
- `TeamFormModal.vue` - Create/edit team form

**`modals/`** - Season-specific modals
- `SeasonFormDrawer.vue` - Create/edit season drawer
- `SeasonDeleteDialog.vue` - Delete confirmation
- `SeasonDriverManagementDrawer.vue` - Driver assignment drawer
- `SeasonDriverFormDialog.vue` - Add driver to season

**Organizational Pattern:**
```
season/
├── SeasonCard.vue                    # Main season components
├── SeasonList.vue
├── divisions/                        # Sub-domain: divisions
│   ├── DivisionsPanel.vue
│   └── DivisionFormModal.vue
├── teams/                            # Sub-domain: teams
│   ├── TeamsPanel.vue
│   └── TeamFormModal.vue
└── modals/                           # Season-specific modals
    ├── SeasonFormDrawer.vue
    └── SeasonDriverManagementDrawer.vue
```

---

### Driver Components

**Path**: `/var/www/resources/app/js/components/driver/`

**Main Components:**
- `DriverTable.vue` - Table of all drivers
- `DriverStatusBadge.vue` - Badge showing driver status
- `DriverStatsCard.vue` - Card with driver statistics
- `DriverManagementDrawer.vue` - Drawer for managing drivers
- `ViewDriverModal.vue` - Modal to view driver details

**`modals/`** subdirectory:
- `DriverFormDialog.vue` - Create/edit driver form
- `CSVImportDialog.vue` - Import drivers from CSV

**Example - DriverTable:**
```vue
<DriverTable
  :drivers="drivers"
  :loading="isLoading"
  @view="handleViewDriver"
  @edit="handleEditDriver"
  @delete="handleDeleteDriver"
/>
```

---

### Round Components

**Path**: `/var/www/resources/app/js/components/round/`

**Main Components:**
- `RoundsPanel.vue` - Main panel displaying all rounds
- `RaceListItem.vue` - Individual race item in list
- `QualifierListItem.vue` - Individual qualifier item in list

**`modals/`** subdirectory:
- `RoundFormDrawer.vue` - Create/edit round drawer
- `RaceFormDrawer.vue` - Create/edit race drawer

**Pattern:**
- Panels provide overview and management
- List items are reusable presentational components
- Form drawers handle CRUD operations

---

### Profile Components

**Path**: `/var/www/resources/app/js/components/profile/`

**Main Components:**
- `ProfileSettingsModal.vue` - User profile settings modal

---

## PrimeVue Components

PrimeVue V4 is the primary UI component library. Always use the latest PrimeVue V4 documentation.

### Commonly Used PrimeVue Components

#### Form Components

**InputText** - Text input field
```vue
<InputText
  v-model="form.name"
  placeholder="Enter league name"
  :class="{ 'p-invalid': errors.name }"
/>
```

**Textarea** - Multi-line text input
```vue
<Textarea
  v-model="form.description"
  rows="5"
  auto-resize
  placeholder="Enter description"
/>
```

**Select** - Dropdown select
```vue
<Select
  v-model="form.platform"
  :options="platforms"
  option-label="name"
  option-value="id"
  placeholder="Select platform"
/>
```

**Checkbox** - Checkbox input
```vue
<Checkbox v-model="form.isActive" :binary="true" />
```

**InputSwitch** - Toggle switch
```vue
<InputSwitch v-model="form.enabled" />
```

**Calendar** - Date picker
```vue
<Calendar
  v-model="form.startDate"
  show-icon
  date-format="yy-mm-dd"
/>
```

#### Data Display Components

**DataTable** - Powerful data table
```vue
<DataTable
  :value="drivers"
  :loading="isLoading"
  paginator
  :rows="10"
  filter-display="row"
>
  <Column field="name" header="Name" sortable />
  <Column field="status" header="Status" sortable />
  <Column header="Actions">
    <template #body="{ data }">
      <Button icon="pi pi-pencil" size="small" @click="edit(data)" />
    </template>
  </Column>
</DataTable>
```

**Card** - Content card
```vue
<Card>
  <template #header>
    <img src="header.jpg" alt="Header" />
  </template>
  <template #title>Card Title</template>
  <template #content>Card content goes here</template>
  <template #footer>
    <Button label="Action" />
  </template>
</Card>
```

**Panel** - Collapsible panel (use BasePanel wrapper)
```vue
<BasePanel header="Settings" toggleable>
  Panel content
</BasePanel>
```

#### Overlay Components

**Dialog** - Modal dialog
```vue
<Dialog
  v-model:visible="isVisible"
  header="Dialog Title"
  :modal="true"
  :style="{ width: '50vw' }"
>
  Dialog content

  <template #footer>
    <Button label="Cancel" severity="secondary" @click="isVisible = false" />
    <Button label="Save" @click="save" />
  </template>
</Dialog>
```

**Drawer** - Slide-out drawer
```vue
<Drawer
  v-model:visible="isVisible"
  position="right"
  class="w-full md:w-[800px]"
>
  <template #header>
    <DrawerHeader title="Create League" />
  </template>

  Drawer content
</Drawer>
```

**Toast** - Toast notifications
```vue
<script setup lang="ts">
import { useToast } from 'primevue/usetoast';

const toast = useToast();

function showSuccess(): void {
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'League created successfully',
    life: 3000,
  });
}
</script>

<template>
  <Toast />
  <Button label="Show Toast" @click="showSuccess" />
</template>
```

**ConfirmDialog** - Confirmation dialog
```vue
<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();

function confirmDelete(): void {
  confirm.require({
    message: 'Are you sure you want to delete this league?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteLeague(),
  });
}
</script>

<template>
  <ConfirmDialog />
  <Button label="Delete" severity="danger" @click="confirmDelete" />
</template>
```

#### Navigation Components

**TabView** - Tabbed navigation
```vue
<TabView>
  <TabPanel header="Details">
    Details content
  </TabPanel>
  <TabPanel header="Settings">
    Settings content
  </TabPanel>
</TabView>
```

**Menu** - Dropdown menu
```vue
<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';

const items: MenuItem[] = [
  { label: 'Edit', icon: 'pi pi-pencil', command: handleEdit },
  { label: 'Delete', icon: 'pi pi-trash', command: handleDelete },
];
</script>

<template>
  <Menu :model="items" />
</template>
```

#### Button Components

**Button** - Primary button component
```vue
<!-- Primary button -->
<Button label="Save" severity="primary" />

<!-- Icon button -->
<Button icon="pi pi-pencil" severity="secondary" />

<!-- Text button -->
<Button label="Cancel" text />

<!-- Outlined button -->
<Button label="Edit" outlined />

<!-- Sizes -->
<Button label="Small" size="small" />
<Button label="Large" size="large" />
```

**SpeedDial** - Floating action button
```vue
<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';

const actions: MenuItem[] = [
  { label: 'Edit', icon: 'pi pi-pencil', command: handleEdit },
  { label: 'Delete', icon: 'pi pi-trash', command: handleDelete },
];
</script>

<template>
  <SpeedDial
    :model="actions"
    direction="down"
    :button-props="{ size: 'small', rounded: true }"
    show-icon="pi pi-bars"
    hide-icon="pi pi-times"
  />
</template>
```

### Import Pattern

Always import PrimeVue components directly (not from main PrimeVue package):

```typescript
// ✅ Correct - Direct import
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

// ❌ Wrong - Don't import from main package
import { Button, InputText } from 'primevue';
```

### PrimeVue + Common Components Pattern

Combine PrimeVue components with common form components:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';

const form = ref({
  name: '',
  description: '',
});

const errors = ref({
  name: '',
  description: '',
});
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <FormInputGroup spacing="space-y-2" class="mb-4">
      <FormLabel for="name" text="League Name" required />
      <InputText
        id="name"
        v-model="form.name"
        :class="{ 'p-invalid': errors.name }"
      />
      <FormError :error="errors.name" />
    </FormInputGroup>

    <FormInputGroup spacing="space-y-2" class="mb-4">
      <FormLabel for="description" text="Description" />
      <Textarea
        id="description"
        v-model="form.description"
        rows="5"
        :class="{ 'p-invalid': errors.description }"
      />
      <FormError :error="errors.description" />
    </FormInputGroup>

    <div class="flex justify-end gap-2">
      <Button label="Cancel" severity="secondary" text @click="handleCancel" />
      <Button label="Save" severity="primary" type="submit" />
    </div>
  </form>
</template>
```

---

## Icon System

The app uses two icon systems:

### Phosphor Icons (Primary)

**Phosphor Icons** are the primary icon system for custom components and general UI.

**Installation:**
```bash
npm install @phosphor-icons/vue
```

**Import:**
```typescript
import {
  PhGameController,
  PhSteeringWheel,
  PhTrophy,
  PhCalendarBlank,
  PhMapPinArea,
  PhFlag,
} from '@phosphor-icons/vue';
```

**Usage:**
```vue
<template>
  <!-- Default size (24px) -->
  <PhGameController />

  <!-- Custom size -->
  <PhSteeringWheel :size="32" />

  <!-- Custom weight -->
  <PhTrophy :size="28" weight="bold" />

  <!-- Custom color via class -->
  <PhFlag :size="20" class="text-primary-500" />
</template>
```

**Common Icons:**
- `PhGameController` - Platform/gaming
- `PhSteeringWheel` - Drivers
- `PhTrophy` - Competitions/achievements
- `PhCalendarBlank` - Dates/schedule
- `PhMapPinArea` - Location/timezone
- `PhFlag` - Races/rounds
- `PhPencil` - Edit
- `PhTrash` - Delete
- `PhPlus` - Add/create
- `PhX` - Close/cancel

**Icon Weights:**
- `thin`
- `light`
- `regular` (default)
- `bold`
- `fill`
- `duotone`

**Styling:**
```vue
<PhGameController
  :size="28"
  weight="regular"
  class="text-slate-400 hover:text-primary-500 transition-colors"
/>
```

### PrimeIcons (PrimeVue Integration)

**PrimeIcons** are used primarily with PrimeVue components.

**Usage:**
```vue
<!-- In Button -->
<Button icon="pi pi-pencil" label="Edit" />

<!-- In Dialog -->
<Dialog header="Settings" icon="pi pi-cog">
  ...
</Dialog>

<!-- Standalone -->
<i class="pi pi-check text-green-500"></i>
```

**Common PrimeIcons:**
- `pi pi-pencil` - Edit
- `pi pi-trash` - Delete
- `pi pi-plus` - Add
- `pi pi-check` - Confirm/success
- `pi pi-times` - Close/cancel
- `pi pi-chevron-right` - Navigation
- `pi pi-exclamation-triangle` - Warning
- `pi pi-info-circle` - Information
- `pi pi-eye` - View
- `pi pi-cog` - Settings

**When to Use Each:**
- **Phosphor Icons**: Custom components, InfoItem, cards, general UI
- **PrimeIcons**: PrimeVue component props (Button, Dialog, etc.), breadcrumbs

---

## Component Communication

### Props Down, Events Up

The fundamental pattern for component communication:

```vue
<!-- Parent Component -->
<script setup lang="ts">
import { ref } from 'vue';
import DriverTable from '@app/components/driver/DriverTable.vue';
import type { Driver } from '@app/types/driver';

const drivers = ref<Driver[]>([]);

function handleEditDriver(driverId: number): void {
  // Handle edit logic
}

function handleDeleteDriver(driverId: number): void {
  // Handle delete logic
}
</script>

<template>
  <DriverTable
    :drivers="drivers"       <!-- Props down -->
    @edit="handleEditDriver"   <!-- Events up -->
    @delete="handleDeleteDriver"
  />
</template>
```

```vue
<!-- Child Component (DriverTable.vue) -->
<script setup lang="ts">
import type { Driver } from '@app/types/driver';

interface Props {
  drivers: Driver[];
}

interface Emits {
  (e: 'edit', driverId: number): void;
  (e: 'delete', driverId: number): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function editDriver(driver: Driver): void {
  emit('edit', driver.id);
}
</script>
```

### Store for Shared State

Use Pinia stores for state shared across multiple components:

```typescript
// stores/leagueStore.ts
import { defineStore } from 'pinia';
import type { League } from '@app/types/league';

export const useLeagueStore = defineStore('league', () => {
  const leagues = ref<League[]>([]);
  const isLoading = ref(false);

  async function fetchLeagues(): Promise<void> {
    isLoading.value = true;
    try {
      const response = await leagueService.getAll();
      leagues.value = response.data;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    leagues,
    isLoading,
    fetchLeagues,
  };
});
```

```vue
<!-- In Component -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useLeagueStore } from '@app/stores/leagueStore';

const leagueStore = useLeagueStore();

onMounted(async () => {
  await leagueStore.fetchLeagues();
});
</script>

<template>
  <div v-if="leagueStore.isLoading">Loading...</div>
  <LeagueCard
    v-for="league in leagueStore.leagues"
    :key="league.id"
    :league="league"
  />
</template>
```

### Composables for Shared Logic

Extract reusable logic into composables:

```typescript
// composables/useImageUrl.ts
import { ref, watch, type Ref, computed } from 'vue';

export function useImageUrl(
  urlGetter: () => string | null | undefined,
  fallbackUrl?: string,
) {
  const url = ref<string | null>(null);
  const hasError = ref(false);
  const isLoading = ref(false);

  const displayUrl = computed(() => {
    if (hasError.value && fallbackUrl) return fallbackUrl;
    return url.value || fallbackUrl || '';
  });

  watch(urlGetter, (newUrl) => {
    url.value = newUrl || null;
    hasError.value = false;
  }, { immediate: true });

  function handleLoad(): void {
    isLoading.value = false;
    hasError.value = false;
  }

  function handleError(): void {
    isLoading.value = false;
    hasError.value = true;
  }

  return {
    url,
    displayUrl,
    hasError,
    isLoading,
    handleLoad,
    handleError,
  };
}
```

```vue
<!-- In Component -->
<script setup lang="ts">
import { useImageUrl } from '@app/composables/useImageUrl';
import type { League } from '@app/types/league';

interface Props {
  league: League;
}

const props = defineProps<Props>();

const logo = useImageUrl(
  () => props.league.logo_url,
  '/images/default-league-logo.png'
);
</script>

<template>
  <img
    :src="logo.displayUrl.value"
    alt="League logo"
    @load="logo.handleLoad"
    @error="logo.handleError"
  />
</template>
```

---

## Component Testing

All components should have corresponding test files in `__tests__/` directories.

### Basic Test Pattern

```typescript
// components/common/__tests__/HTag.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HTag from '../HTag.vue';

describe('HTag', () => {
  it('renders h1 tag by default', () => {
    const wrapper = mount(HTag, {
      slots: {
        default: 'Test Heading',
      },
    });

    const h1 = wrapper.find('h1');
    expect(h1.exists()).toBe(true);
    expect(h1.text()).toBe('Test Heading');
  });

  it('applies default h1 classes', () => {
    const wrapper = mount(HTag, {
      slots: {
        default: 'Test Heading',
      },
    });

    const h1 = wrapper.find('h1');
    expect(h1.classes()).toContain('text-3xl');
    expect(h1.classes()).toContain('font-bold');
  });
});
```

### Mounting with Stubs

For components using PrimeVue or other complex dependencies:

```typescript
import { mountWithStubs } from '@app/__tests__/setup';
import ImageUpload from '../ImageUpload.vue';

// Stub complex child components
const FormLabelStub = {
  name: 'FormLabel',
  props: ['text', 'required'],
  template: '<label>{{ text }}<span v-if="required">*</span></label>',
};

describe('ImageUpload', () => {
  it('shows file upload component when no file is selected', () => {
    const wrapper = mountWithStubs(ImageUpload, {
      props: {
        modelValue: null,
        label: 'Upload Logo',
      },
      global: {
        stubs: {
          FormLabel: FormLabelStub,
        },
      },
    });

    const fileUpload = wrapper.findComponent({ name: 'FileUpload' });
    expect(fileUpload.exists()).toBe(true);
  });
});
```

### Testing Props and Emits

```typescript
import { mount } from '@vue/test-utils';
import LeagueCard from '../LeagueCard.vue';

describe('LeagueCard', () => {
  it('emits view event when view button is clicked', async () => {
    const league = {
      id: 1,
      name: 'Test League',
      // ... other properties
    };

    const wrapper = mount(LeagueCard, {
      props: { league },
    });

    const viewButton = wrapper.find('[aria-label="View league"]');
    await viewButton.trigger('click');

    expect(wrapper.emitted('view')).toBeTruthy();
    expect(wrapper.emitted('view')?.[0]).toEqual([1]);
  });
});
```

### Testing User Interactions

```typescript
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import DriverFormDialog from '../DriverFormDialog.vue';

describe('DriverFormDialog', () => {
  it('validates required fields on submit', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
      },
    });

    // Find and click submit button
    const submitButton = wrapper.find('[type="submit"]');
    await submitButton.trigger('click');
    await nextTick();

    // Check for validation errors
    expect(wrapper.text()).toContain('Name is required');
    expect(wrapper.emitted('submit')).toBeFalsy();
  });
});
```

### Testing with Pinia Stores

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mountWithStubs } from '@app/__tests__/setup';
import Header from '../Header.vue';
import { useUserStore } from '@app/stores/userStore';

describe('Header', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('displays user menu when authenticated', () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const userStore = useUserStore();
    userStore.user = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };
    userStore.isAuthenticated = true;

    const wrapper = mountWithStubs(Header, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('Profile');
    expect(wrapper.text()).toContain('Logout');
  });
});
```

---

## Best Practices

### 1. Keep Components Small and Focused

Each component should have a single, well-defined responsibility:

**✅ Good - Focused components:**
```
LeagueCard.vue           - Display league information
LeagueWizardDrawer.vue   - Create/edit league form
LeagueVisibilityTag.vue  - Display visibility status
```

**❌ Bad - Too many responsibilities:**
```
LeagueComponent.vue      - Does everything (display, edit, delete, etc.)
```

### 2. Use TypeScript for All Props/Emits

Always define explicit TypeScript interfaces:

```typescript
// ✅ Good - Explicit types
interface Props {
  league: League;
  isLoading: boolean;
}

interface Emits {
  (e: 'update', id: number, data: UpdateLeagueData): void;
  (e: 'delete', id: number): void;
}

// ❌ Bad - No types
const props = defineProps(['league', 'isLoading']);
const emit = defineEmits(['update', 'delete']);
```

### 3. Extract Reusable Logic to Composables

Don't repeat logic across components:

```typescript
// ✅ Good - Composable
// composables/useImageUrl.ts
export function useImageUrl(urlGetter: () => string | null, fallback?: string) {
  // Reusable image loading logic
}

// Use in multiple components
const logo = useImageUrl(() => props.league.logo_url, '/default-logo.png');
const header = useImageUrl(() => props.league.header_url);

// ❌ Bad - Duplicated logic in each component
// Each component has its own image loading logic
```

### 4. Use PrimeVue Components for Complex UI

Don't reinvent the wheel:

```vue
<!-- ✅ Good - Use PrimeVue DataTable -->
<DataTable :value="drivers" paginator :rows="10">
  <Column field="name" header="Name" sortable />
</DataTable>

<!-- ❌ Bad - Build your own complex table from scratch -->
<table>
  <!-- Hundreds of lines of custom table logic -->
</table>
```

### 5. Follow Consistent Patterns

Use established patterns from existing components:

**Form Pattern:**
```vue
<FormInputGroup spacing="space-y-2" class="mb-4">
  <FormLabel for="name" text="Name" required />
  <InputText
    id="name"
    v-model="form.name"
    :class="{ 'p-invalid': errors.name }"
  />
  <FormError :error="errors.name" />
</FormInputGroup>
```

**Modal Pattern:**
```vue
<Drawer v-model:visible="isVisible" position="right" class="w-full md:w-[800px]">
  <template #header>
    <DrawerHeader title="Title" subtitle="Subtitle" />
  </template>

  <DrawerLoading v-if="isLoading" />
  <div v-else>
    <!-- Content -->
  </div>
</Drawer>
```

**Card Pattern:**
```vue
<Card>
  <template #header>
    <!-- Header image or visual -->
  </template>
  <template #title>
    <HTag :level="3">{{ title }}</HTag>
  </template>
  <template #content>
    <BasePanel>
      <div class="grid grid-cols-2 gap-px bg-surface-200">
        <InfoItem :icon="PhIcon" title="Label" :text="value" />
      </div>
    </BasePanel>
  </template>
  <template #footer>
    <Button label="Action" />
  </template>
</Card>
```

### 6. Write Tests for All Components

Every component should have a test file:

```
components/
├── driver/
│   ├── DriverTable.vue
│   └── __tests__/
│       └── DriverTable.test.ts
```

Minimum test coverage:
- Component renders correctly
- Props are displayed properly
- Events are emitted correctly
- User interactions work as expected

### 7. Use Semantic HTML and Accessibility

Always consider accessibility:

```vue
<!-- ✅ Good - Accessible -->
<button
  type="button"
  aria-label="Delete league"
  @click="handleDelete"
>
  <PhTrash :size="20" />
</button>

<!-- ❌ Bad - Not accessible -->
<div @click="handleDelete">
  <PhTrash :size="20" />
</div>
```

### 8. Prefer Composition Over Inheritance

Use composables and slots instead of extending components:

```vue
<!-- ✅ Good - Composable -->
<script setup lang="ts">
import { useImageUrl } from '@app/composables/useImageUrl';
const logo = useImageUrl(() => props.league.logo_url);
</script>

<!-- ❌ Bad - Don't extend components -->
<script>
export default {
  extends: SomeOtherComponent,
  // ...
}
</script>
```

### 9. Keep Styling Consistent

Use Tailwind utility classes and follow the design system:

```vue
<!-- ✅ Good - Tailwind utilities -->
<div class="p-4 bg-white rounded-lg shadow-md border border-gray-200">
  <h3 class="text-xl font-semibold mb-2">Title</h3>
</div>

<!-- ❌ Bad - Custom CSS for everything -->
<div class="custom-card">
  <h3 class="custom-title">Title</h3>
</div>

<style scoped>
.custom-card { /* ... */ }
.custom-title { /* ... */ }
</style>
```

### 10. Document Complex Components

Add JSDoc comments for complex components:

```typescript
/**
 * ImageUpload Component
 *
 * Full-featured image upload component with validation, preview, and drag-and-drop.
 *
 * Features:
 * - Image preview with zoom
 * - File type validation
 * - File size validation
 * - Dimension validation
 * - Existing image handling
 *
 * @example
 * ```vue
 * <ImageUpload
 *   v-model="logo"
 *   label="League Logo"
 *   :max-file-size="2000000"
 *   :min-dimensions="{ width: 200, height: 200 }"
 * />
 * ```
 */
```

---

## Summary

This guide covers the complete component architecture for the app frontend:

1. **Component Patterns**: Composition API, props/emits, naming conventions
2. **Common Components**: Reusable form, layout, modal components
3. **Domain Components**: League, competition, season, driver, round components
4. **PrimeVue Integration**: How to use PrimeVue components effectively
5. **Icon Systems**: Phosphor Icons and PrimeIcons
6. **Communication**: Props down, events up, stores, composables
7. **Testing**: Comprehensive testing patterns
8. **Best Practices**: 10 essential best practices for component development

For styling guidelines, see: [App Styling Guide](./app-styling-guide.md)

For composables and services, see additional documentation (to be created).

---

**Last Updated**: 2025-10-31
**Vue Version**: 3.x
**PrimeVue Version**: 4.x
**TypeScript**: Strict mode enabled
