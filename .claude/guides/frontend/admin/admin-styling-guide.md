# Admin Dashboard Styling and Design System Guide

> **Related Guides**: [Admin Dashboard Development Guide](./admin-dashboard-development-guide.md)

## Table of Contents

1. [Introduction](#introduction)
2. [Typography](#typography)
3. [Color Palette](#color-palette)
4. [Spacing System](#spacing-system)
5. [Layout Patterns](#layout-patterns)
6. [PrimeVue Components](#primevue-components)
7. [Tailwind CSS Patterns](#tailwind-css-patterns)
8. [Icon Usage](#icon-usage)
9. [Accessibility](#accessibility)
10. [Do's and Don'ts](#dos-and-donts)
11. [Complete Examples](#complete-examples)

---

## Introduction

### Design System Philosophy

The admin dashboard uses a **consistent, utility-first design system** built on:

- **Tailwind CSS 4** for utility-first styling
- **PrimeVue 4 (Aura theme)** for pre-built components
- **Zalando Sans** as the primary font
- **Light, clean aesthetic** with gray/white color scheme
- **Accessibility-first** approach

### Critical Rule: DO NOT Deviate from Base Styles

**Unless you have a specific reason, NEVER change typography, font sizes, or colors.**

#### When You CAN Deviate:

✅ Creating text hierarchy in multi-line content (headings vs body)
✅ Emphasizing important information (bold, larger size)
✅ Error/success/warning/info states (semantic colors)
✅ Accessibility requirements (contrast, legibility)
✅ Component-specific styling (badges, buttons, status indicators)

#### When You MUST NOT Deviate:

❌ "This looks better in a different color"
❌ "I prefer a larger/smaller font"
❌ "Let me add some custom styling to make it unique"
❌ Personal preference or aesthetic choices
❌ Inconsistent use of colors across similar components

**The goal is consistency across the entire admin dashboard. Every table should look the same, every form should feel familiar, every button should behave predictably.**

---

## Typography

### Font Families

**Primary Font**: Zalando Sans (Google Fonts)

```css
/* Defined in resources/admin/css/app.css */
font-family: 'Zalando Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Applied globally** to the `<body>` tag. You should NEVER need to override this unless you have a very specific use case (like code blocks, which might use monospace).

### Font Sizes

**Standard Tailwind Scale** (DO NOT create custom sizes):

| Class | Size | Use Case |
|-------|------|----------|
| `text-xs` | 0.75rem (12px) | Small labels, badges, captions, helper text |
| `text-sm` | 0.875rem (14px) | **DEFAULT for body text, table cells, most content** |
| `text-base` | 1rem (16px) | Emphasized body text, form labels |
| `text-lg` | 1.125rem (18px) | Card titles, section headings |
| `text-xl` | 1.25rem (20px) | Page subtitles |
| `text-2xl` | 1.5rem (24px) | Page titles (h2) |
| `text-3xl` | 1.875rem (30px) | **Main page headings (h1)** |
| `text-4xl` | 2.25rem (36px) | Large headings (use sparingly) |

**Default sizes for common elements:**

- **Body text**: `text-sm` or `text-base`
- **Table cells**: `text-sm`
- **Buttons**: Default (PrimeVue handles this)
- **Form labels**: `text-base` or default
- **Card titles**: `text-lg` (via PrimeVue or custom)
- **Page headings (h1)**: `text-3xl`

### Font Weights

| Class | Weight | Use Case |
|-------|--------|----------|
| `font-normal` | 400 | Default body text |
| `font-medium` | 500 | Emphasized text, table headings |
| `font-semibold` | 600 | Card titles, section headings, important labels |
| `font-bold` | 700 | Strong emphasis (use sparingly) |

**Default weights for common elements:**

- **Body text**: `font-normal` (default)
- **Table headings**: Auto-handled by PrimeVue
- **Card titles**: `font-semibold` (set globally in `app.css`)
- **Page headings**: `font-bold`
- **User names in tables**: `font-medium`

### Line Heights

Use Tailwind defaults. Only override when necessary:

- `leading-tight`: Headings
- `leading-normal`: Body text (default)
- `leading-relaxed`: Long-form content

### Text Colors

**Standard text color hierarchy:**

| Class | Hex | Use Case |
|-------|-----|----------|
| `text-gray-900` | #111827 | Primary text (headings, important content) |
| `text-gray-700` | #374151 | Body text, table cells |
| `text-gray-600` | #4b5563 | Secondary text, labels |
| `text-gray-500` | #6b7280 | Muted text, placeholders |
| `text-gray-400` | #9ca3af | Disabled text, very subtle hints |

**Semantic colors** (use only for specific states):

| Class | Hex | Use Case |
|-------|-----|----------|
| `text-blue-600` | #2563eb | Links, primary actions |
| `text-green-600` | #16a34a | Success states |
| `text-red-500` | #ef4444 | Errors, destructive actions |
| `text-yellow-600` | #ca8a04 | Warnings |
| `text-purple-600` | #9333ea | Special badges (e.g., admin roles) |

### When NOT to Change Typography

**NEVER do this:**

```vue
<!-- ❌ BAD: Arbitrary font size changes -->
<p class="text-xl">This is just regular table data</p>

<!-- ❌ BAD: Random color for aesthetic reasons -->
<span class="text-purple-500">User Email</span>

<!-- ❌ BAD: Unnecessary bold -->
<td class="font-bold">{{ data.email }}</td>
```

**DO this instead:**

```vue
<!-- ✅ GOOD: Consistent default styling -->
<p class="text-sm text-gray-700">{{ data.email }}</p>

<!-- ✅ GOOD: Semantic hierarchy -->
<h1 class="text-3xl font-bold text-gray-900">Page Title</h1>
<p class="text-gray-600">Subtitle or description</p>

<!-- ✅ GOOD: Semantic color for status -->
<span class="text-red-500">(Deactivated)</span>
```

### Examples: Acceptable vs Unacceptable Deviations

**✅ Acceptable: Text Hierarchy**

```vue
<!-- Card with proper hierarchy -->
<div>
  <h2 class="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h2>
  <p class="text-sm text-gray-900">John Doe created User</p>
  <p class="text-xs text-gray-600">Additional details</p>
  <p class="text-xs text-gray-500">2 hours ago</p>
</div>
```

**✅ Acceptable: Status Indicators**

```vue
<!-- Different colors for different statuses -->
<span class="text-green-600">Active</span>
<span class="text-red-500">(Deactivated)</span>
<span class="text-yellow-600">Pending</span>
```

**❌ Unacceptable: Arbitrary Styling**

```vue
<!-- Random font sizes and colors with no semantic meaning -->
<p class="text-2xl text-pink-500">Regular table data</p>
<span class="text-xs font-bold text-indigo-400">User Email</span>
```

---

## Color Palette

### CSS Variables

Defined in `/resources/admin/css/app.css`:

```css
:root {
  /* Brand colors */
  --admin-primary: #3b82f6;       /* Blue-500 */
  --admin-secondary: #8b5cf6;     /* Violet-500 */
  --admin-accent: #ef4444;        /* Red-500 */

  /* Layout */
  --sidebar-width: 16rem;
  --sidebar-collapsed-width: 5rem;
  --topbar-height: 4rem;

  /* Light grey/white color scheme */
  --bg-primary: #ffffff;          /* White backgrounds */
  --bg-secondary: #f9fafb;        /* Gray-50 - main content area */
  --bg-tertiary: #f3f4f6;         /* Gray-100 - cards, sections */
  --border-light: #e5e7eb;        /* Gray-200 */
  --border-medium: #d1d5db;       /* Gray-300 */
  --text-primary: #111827;        /* Gray-900 */
  --text-secondary: #6b7280;      /* Gray-500 */
  --text-muted: #9ca3af;          /* Gray-400 */
}
```

### Semantic Colors (via Tailwind)

**Success** (Green):
- `bg-green-100 text-green-700` - Badge background
- `bg-green-100 text-green-600` - Icon background
- `text-green-600` - Success text

**Info/Primary** (Blue):
- `bg-blue-100 text-blue-700` - Badge background
- `bg-blue-100 text-blue-600` - Icon background
- `text-blue-600` - Links, primary actions
- `bg-blue-500 to-blue-600` - Gradient buttons, avatars

**Warning** (Yellow):
- `bg-yellow-100 text-yellow-700` - Badge background
- `bg-yellow-100 text-yellow-600` - Icon background
- `text-yellow-600` - Warning text

**Danger/Error** (Red):
- `bg-red-100 text-red-700` - Badge background
- `bg-red-100 text-red-600` - Icon background
- `text-red-500` - Error text, deactivated status

**Secondary** (Gray):
- `bg-gray-100 text-gray-700` - Badge background
- `bg-gray-100 text-gray-600` - Icon background

**Purple** (Special roles):
- `bg-purple-100 text-purple-700` - Badge background
- `bg-purple-100 text-purple-600` - Icon background

### Background Colors

| Class | Use Case |
|-------|----------|
| `bg-white` | Cards, modals, sidebar, topbar |
| `bg-gray-50` | Main content area, page background |
| `bg-gray-100` | Subtle section backgrounds, hover states |
| `bg-gray-200` | Borders (use `border-gray-200` instead) |

### Border Colors

| Class | Use Case |
|-------|----------|
| `border-gray-200` | **DEFAULT** - All borders (cards, inputs, dividers) |
| `border-gray-300` | Stronger borders (use sparingly) |
| `border-red-500` | Error state for inputs |

### When to Use Each Color

**DO:**
- Use `text-gray-900` for headings and primary content
- Use `text-gray-700` for body text in tables
- Use `text-gray-600` for secondary labels
- Use `bg-white` for cards, modals, and primary surfaces
- Use `bg-gray-50` for page backgrounds
- Use `border-gray-200` for all borders
- Use semantic colors (red/green/yellow/blue) ONLY for status/state

**DON'T:**
- Mix border colors inconsistently
- Use non-semantic colors for text (e.g., pink, orange, teal)
- Override PrimeVue component colors unless necessary
- Add custom gradients outside of avatars/specific design elements

### Accessibility Considerations

All color combinations meet **WCAG 2.1 AA standards** for contrast:

- `text-gray-900` on `bg-white`: ✅ AAA (16.1:1)
- `text-gray-700` on `bg-white`: ✅ AAA (10.7:1)
- `text-gray-600` on `bg-white`: ✅ AA (7.2:1)
- `text-blue-600` on `bg-white`: ✅ AA (5.1:1)
- Badge combinations (e.g., `text-green-700` on `bg-green-100`): ✅ AA+

**Never use:**
- Light text on light backgrounds
- Low-contrast combinations (e.g., `text-gray-400` on `bg-gray-100`)

---

## Spacing System

### Tailwind Spacing Scale

Use **Tailwind's default spacing scale** (based on 0.25rem = 4px):

| Class | Value | Common Use |
|-------|-------|------------|
| `p-0` / `m-0` | 0 | Reset |
| `p-1` / `m-1` | 0.25rem (4px) | Tiny gaps |
| `p-2` / `m-2` | 0.5rem (8px) | Badge padding |
| `p-3` / `m-3` | 0.75rem (12px) | Button padding |
| `p-4` / `m-4` | 1rem (16px) | **DEFAULT** card padding, section spacing |
| `p-6` / `m-6` | 1.5rem (24px) | Large card padding |
| `p-8` / `m-8` | 2rem (32px) | Section spacing |

### Margin Conventions

**Vertical spacing** (use `mb-*` for bottom margin):

```vue
<!-- Section spacing -->
<div class="mb-6">...</div>

<!-- Heading to content -->
<h1 class="text-3xl font-bold text-gray-900 mb-2">Title</h1>
<p class="text-gray-600">Subtitle</p>

<!-- Form field spacing -->
<div class="space-y-4">
  <div>...</div>
  <div>...</div>
</div>
```

**Horizontal spacing** (use `gap-*` with flexbox):

```vue
<!-- Button group -->
<div class="flex gap-2">
  <Button />
  <Button />
</div>

<!-- Table actions -->
<div class="flex gap-2">
  <Button icon="pi pi-eye" />
  <Button icon="pi pi-pencil" />
</div>
```

### Padding Conventions

**Cards and sections:**

```vue
<!-- Main content area -->
<div class="p-4 min-h-screen bg-gray-50">...</div>

<!-- Card content (PrimeVue handles this) -->
<Card>...</Card>

<!-- Custom section -->
<div class="p-6 bg-white rounded-lg border border-gray-200">...</div>
```

### Gap Utility (Flexbox/Grid)

**Prefer `gap-*` over margins in flex/grid containers:**

```vue
<!-- ✅ GOOD: Using gap -->
<div class="flex items-center gap-3">
  <div>Avatar</div>
  <div>Name</div>
</div>

<!-- ❌ BAD: Using margins -->
<div class="flex items-center">
  <div class="mr-3">Avatar</div>
  <div>Name</div>
</div>
```

**Common gap values:**

- `gap-2` (0.5rem): Small elements (button groups, inline items)
- `gap-3` (0.75rem): Medium elements (avatar + text)
- `gap-4` (1rem): Larger sections

### Standard Patterns

**Space-y** (vertical spacing in stacks):

```vue
<!-- Form fields -->
<form class="space-y-4">
  <div>...</div>
  <div>...</div>
</form>

<!-- List items -->
<div class="space-y-4">
  <div class="pb-4 border-b">...</div>
  <div class="pb-4 border-b">...</div>
</div>
```

**Space-x** (horizontal spacing - use sparingly, prefer `gap`):

```vue
<!-- Breadcrumbs (rare case) -->
<div class="flex items-center space-x-2">
  <span>Home</span>
  <span>/</span>
  <span>Users</span>
</div>
```

---

## Layout Patterns

### Page Layouts

**Standard page structure:**

```vue
<template>
  <div class="page-container">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Page Title</h1>
      <p class="text-gray-600">Page description or subtitle</p>
    </div>

    <!-- Main Content -->
    <Card>
      <template #title>Section Title</template>
      <template #content>
        <!-- Content here -->
      </template>
    </Card>
  </div>
</template>

<style scoped>
.page-container {
  /* No custom styles needed - handled by AdminLayout */
}
</style>
```

**Main content area** (handled by `AdminLayout.vue`):

```vue
<main :class="['transition-all duration-300 pt-16', isCollapsed ? 'ml-20' : 'ml-64']">
  <div class="p-4 min-h-screen bg-gray-50">
    <router-view />
  </div>
</main>
```

**Responsive considerations:**

- Sidebar collapses on mobile (`< 1024px`)
- Main content area adjusts margin based on sidebar state
- Tables scroll horizontally on small screens

### Card Layouts

**Using PrimeVue Card:**

```vue
<Card>
  <template #title>
    <div class="flex items-center justify-between">
      <span>Card Title</span>
      <Button icon="pi pi-refresh" text rounded size="small" />
    </div>
  </template>
  <template #content>
    <p class="text-gray-700">Card content here...</p>
  </template>
</Card>
```

**Custom card (when PrimeVue Card isn't suitable):**

```vue
<div class="bg-white rounded-lg border border-gray-200 p-6">
  <h2 class="text-lg font-semibold text-gray-900 mb-4">Card Title</h2>
  <p class="text-gray-700">Content...</p>
</div>
```

### Form Layouts

**Standard form pattern:**

```vue
<form class="space-y-4" @submit.prevent="handleSubmit">
  <!-- Text Input -->
  <div>
    <label for="field-name" class="block mb-2">Label *</label>
    <InputText
      id="field-name"
      v-model="form.fieldName"
      class="w-full"
      :invalid="hasFieldError('field_name')"
      required
    />
    <small v-if="hasFieldError('field_name')" class="text-red-500">
      {{ getFieldError('field_name') }}
    </small>
  </div>

  <!-- Select/Dropdown -->
  <div>
    <label for="status" class="block mb-2">Status *</label>
    <Select
      id="status"
      v-model="form.status"
      :options="statusOptions"
      option-label="label"
      option-value="value"
      class="w-full"
      :invalid="hasFieldError('status')"
    />
    <small v-if="hasFieldError('status')" class="text-red-500">
      {{ getFieldError('status') }}
    </small>
  </div>

  <!-- Form Actions -->
  <div class="flex justify-end gap-2 pt-4">
    <Button label="Cancel" severity="secondary" @click="handleCancel" />
    <Button label="Save" :loading="loading" type="submit" />
  </div>
</form>
```

**Form field structure:**

1. Wrapper `<div>` (no classes needed if using `space-y-4` on parent)
2. `<label>` with `block mb-2`
3. Input component with `class="w-full"` and `:invalid` binding
4. Error message with `<small class="text-red-500">`

### Table Layouts

**Using PrimeVue DataTable:**

```vue
<DataTable
  :value="items"
  :loading="loading"
  :rows="10"
  :paginator="true"
  :rows-per-page-options="[10, 25, 50]"
  striped-rows
  responsive-layout="scroll"
>
  <template #empty>
    <EmptyState message="No data found" />
  </template>

  <template #loading>
    <LoadingState message="Loading..." />
  </template>

  <Column field="name" header="Name" :sortable="true" style="min-width: 200px">
    <template #body="{ data }">
      <span class="text-sm text-gray-700">{{ data.name }}</span>
    </template>
  </Column>

  <!-- More columns... -->
</DataTable>
```

**Table cell styling:**

- Text: `text-sm text-gray-700`
- Avatars: Gradient circle with initials
- Actions: Icon buttons with tooltips
- Status: Badge component

### Modal Layouts

**Using BaseModal:**

```vue
<BaseModal
  :visible="visible"
  width="40rem"
  @update:visible="emit('update:visible', $event)"
  @close="handleClose"
>
  <template #header>Modal Title</template>

  <form class="space-y-4">
    <!-- Form fields -->
  </form>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancel" severity="secondary" @click="handleCancel" />
      <Button label="Save" :loading="loading" @click="handleSave" />
    </div>
  </template>
</BaseModal>
```

**Modal widths:**

- Small: `30rem` (forms with 1-2 fields)
- Medium: `40rem` (standard forms)
- Large: `50rem` or `60rem` (complex forms, view modals)

### Responsive Patterns

**Breakpoints** (Tailwind defaults):

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

**Common patterns:**

```vue
<!-- Hide on mobile, show on desktop -->
<div class="hidden md:block">Desktop content</div>

<!-- Show on mobile, hide on desktop -->
<div class="md:hidden">Mobile content</div>

<!-- Responsive flex direction -->
<div class="flex flex-col md:flex-row gap-4">...</div>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">...</div>
```

---

## PrimeVue Components

### Integration with Design System

PrimeVue 4 uses the **Aura theme preset** configured in the admin dashboard. Most styling is handled automatically by PrimeVue, but you can customize using:

1. **Tailwind utilities** (via `class` prop)
2. **Pass-through (PT) API** (for deep customization)
3. **Global CSS** (in `app.css`)

### Common Components

#### Buttons

**Variants:**

```vue
<!-- Primary (default) -->
<Button label="Primary" />

<!-- Secondary -->
<Button label="Secondary" severity="secondary" />

<!-- Danger -->
<Button label="Delete" severity="danger" />

<!-- Success -->
<Button label="Approve" severity="success" />

<!-- Text button -->
<Button label="Cancel" text />

<!-- Icon button -->
<Button icon="pi pi-pencil" text rounded />

<!-- With loading -->
<Button label="Save" :loading="loading" />
```

**Sizes:**

```vue
<Button label="Small" size="small" />
<Button label="Default" />
<Button label="Large" size="large" />
```

**Button groups:**

```vue
<div class="flex gap-2">
  <Button label="Cancel" severity="secondary" />
  <Button label="Save" />
</div>
```

#### DataTable

**Standard configuration:**

```vue
<DataTable
  :value="data"
  :loading="loading"
  :rows="10"
  :paginator="true"
  :rows-per-page-options="[10, 25, 50]"
  paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
  current-page-report-template="Showing {first} to {last} of {totalRecords} items"
  striped-rows
  responsive-layout="scroll"
>
  <!-- Columns -->
</DataTable>
```

**Column templates:**

```vue
<!-- Text column -->
<Column field="email" header="Email" :sortable="true" style="min-width: 250px">
  <template #body="{ data }">
    <span class="text-sm text-gray-700">{{ data.email }}</span>
  </template>
</Column>

<!-- Avatar + name column -->
<Column field="name" header="Name" :sortable="true" style="min-width: 200px">
  <template #body="{ data }">
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
        {{ getInitials(data.name) }}
      </div>
      <p class="text-sm font-medium text-gray-900">{{ data.name }}</p>
    </div>
  </template>
</Column>

<!-- Status badge column -->
<Column field="status" header="Status" :sortable="true" style="min-width: 120px">
  <template #body="{ data }">
    <Badge :text="data.status" :variant="getVariant(data.status)" />
  </template>
</Column>

<!-- Actions column -->
<Column header="Actions" :exportable="false" style="min-width: 150px">
  <template #body="{ data }">
    <div class="flex gap-2">
      <Button
        v-tooltip.top="'View'"
        icon="pi pi-eye"
        text
        rounded
        severity="secondary"
        size="small"
        @click="handleView(data)"
      />
      <Button
        v-tooltip.top="'Edit'"
        icon="pi pi-pencil"
        text
        rounded
        severity="info"
        size="small"
        @click="handleEdit(data)"
      />
    </div>
  </template>
</Column>
```

#### Forms (InputText, Select, etc.)

**InputText:**

```vue
<InputText
  v-model="form.email"
  type="email"
  class="w-full"
  :invalid="hasFieldError('email')"
  placeholder="user@example.com"
/>
```

**Select (Dropdown):**

```vue
<Select
  v-model="form.status"
  :options="statusOptions"
  option-label="label"
  option-value="value"
  class="w-full"
  :invalid="hasFieldError('status')"
  placeholder="Select status"
/>
```

**Textarea:**

```vue
<Textarea
  v-model="form.notes"
  rows="4"
  class="w-full"
  :invalid="hasFieldError('notes')"
/>
```

#### Dialog/Modal

**Use `BaseModal` component** instead of PrimeVue Dialog directly:

```vue
<BaseModal
  :visible="visible"
  width="40rem"
  @update:visible="emit('update:visible', $event)"
>
  <template #header>Title</template>
  <!-- Content -->
  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancel" severity="secondary" />
      <Button label="Save" />
    </div>
  </template>
</BaseModal>
```

#### Toast

**Setup (once in App.vue):**

```vue
<Toast position="top-right" />
```

**Usage:**

```vue
<script setup lang="ts">
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const showSuccess = () => {
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Operation completed successfully',
    life: 3000,
  });
};

const showError = () => {
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: 'Something went wrong',
    life: 5000,
  });
};
</script>
```

### Customizing PrimeVue with Tailwind

**Using `class` prop:**

```vue
<!-- Add Tailwind utilities -->
<Button label="Save" class="!bg-purple-500" />
<Card class="shadow-lg" />
<InputText class="w-full" />
```

**Note**: Use `!important` (via `!` prefix) to override PrimeVue defaults when necessary.

### Pass-Through (PT) API

**For deep customization** (use sparingly):

```vue
<DataTable
  :value="data"
  :pt="{
    root: { class: 'custom-table' },
    header: { class: 'bg-gray-100' },
  }"
>
  <!-- ... -->
</DataTable>
```

**Prefer Tailwind utilities over PT API** unless you need to target internal PrimeVue elements.

### Aura Theme Customization

**Global overrides** in `/resources/admin/css/app.css`:

```css
/* PrimeVue Card Title Styling */
.p-card .p-card-title {
  color: #111827 !important;
  font-weight: 600;
  font-size: 1.125rem;
  line-height: 1.75rem;
}

/* Ensure all headings are dark by default */
h1, h2, h3, h4, h5, h6 {
  color: #111827;
}

/* Badge on notification icon */
.p-badge {
  min-width: 1.25rem;
  height: 1.25rem;
  line-height: 1.25rem;
  font-size: 0.625rem;
}
```

**Avoid adding too many global overrides**. Prefer component-specific styling.

---

## Tailwind CSS Patterns

### Common Utility Combinations

**Card wrapper:**

```vue
<div class="bg-white rounded-lg border border-gray-200 p-6">
  <!-- Content -->
</div>
```

**Section divider:**

```vue
<div class="pb-4 border-b border-gray-200">
  <!-- Content -->
</div>
```

**Flex container (centered vertically):**

```vue
<div class="flex items-center gap-3">
  <div>Icon</div>
  <div>Text</div>
</div>
```

**Flex container (space between):**

```vue
<div class="flex items-center justify-between">
  <span>Left content</span>
  <Button />
</div>
```

**Avatar circle:**

```vue
<div class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
  JD
</div>
```

**Text truncation:**

```vue
<p class="truncate max-w-xs">Long text that will be truncated...</p>

<!-- Multi-line truncation -->
<p class="line-clamp-2">
  Long text that will be truncated after 2 lines...
</p>
```

**Hover states:**

```vue
<button class="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
  Click me
</button>
```

### Responsive Design Patterns

**Responsive grid:**

```vue
<!-- 1 column on mobile, 2 on tablet, 3 on desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

**Responsive flex:**

```vue
<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col md:flex-row gap-4">
  <div>Left</div>
  <div>Right</div>
</div>
```

**Responsive text sizes:**

```vue
<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
```

**Responsive padding:**

```vue
<div class="p-4 md:p-6 lg:p-8">
  Content
</div>
```

**Hide/show based on breakpoint:**

```vue
<!-- Mobile only -->
<div class="md:hidden">Mobile menu</div>

<!-- Desktop only -->
<div class="hidden md:block">Desktop nav</div>
```

### Dark Mode Considerations

**Currently NOT implemented** in the admin dashboard. The design system uses a light theme only.

If dark mode is added in the future:

```vue
<!-- Use dark: prefix for dark mode styles -->
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content
</div>
```

### Custom Classes vs Utilities

**Prefer utilities over custom classes:**

```vue
<!-- ✅ GOOD: Utilities -->
<div class="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
  Content
</div>

<!-- ❌ BAD: Custom class (unless reused 5+ times) -->
<div class="custom-card">
  Content
</div>

<style scoped>
.custom-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}
</style>
```

**When to use custom classes:**

- Component-specific animations
- Complex pseudo-selectors (`:nth-child`, `:before`, `:after`)
- Reused across 5+ places in the same component

**Example of acceptable custom class:**

```vue
<style scoped>
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  color: #6b7280;
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
  border: none;
  background: transparent;
}

.sidebar-item:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.sidebar-item-active {
  background-color: #dbeafe;
  color: #1d4ed8;
  font-weight: 500;
}
</style>
```

---

## Icon Usage

### PrimeIcons vs Phosphor Icons

**The admin dashboard uses BOTH icon libraries:**

1. **PrimeIcons** - Used primarily with PrimeVue components
2. **Phosphor Icons** - Used for custom components

#### PrimeIcons

**Automatically included** with PrimeVue. Use with PrimeVue components:

```vue
<!-- Buttons -->
<Button icon="pi pi-plus" />
<Button icon="pi pi-pencil" />
<Button icon="pi pi-trash" />

<!-- Icons in templates -->
<i class="pi pi-home"></i>
<i class="pi pi-user"></i>
<i class="pi pi-cog"></i>
```

**Common PrimeIcons:**

| Icon | Class | Use Case |
|------|-------|----------|
| Home | `pi pi-home` | Dashboard, breadcrumbs |
| User | `pi pi-user` | User menu, profile |
| Users | `pi pi-users` | User management |
| Cog | `pi pi-cog` | Settings |
| Bell | `pi pi-bell` | Notifications |
| Eye | `pi pi-eye` | View action |
| Pencil | `pi pi-pencil` | Edit action |
| Trash | `pi pi-trash` | Delete action |
| Plus | `pi pi-plus` | Add/Create |
| Refresh | `pi pi-refresh` | Reload |
| Search | `pi pi-search` | Search |

**Full list**: https://primevue.org/icons

#### Phosphor Icons

**Import from `@phosphor-icons/vue`:**

```vue
<script setup lang="ts">
import { PhClock, PhWarning, PhCheckCircle } from '@phosphor-icons/vue';
</script>

<template>
  <PhClock :size="24" />
  <PhWarning :size="32" class="text-yellow-500" />
  <PhCheckCircle :size="20" class="text-green-600" />
</template>
```

**Used in custom components:**

```vue
<!-- EmptyState.vue -->
<component :is="icon" :size="iconSize" :class="iconClass" class="mx-auto mb-3" />
```

**When to use Phosphor vs PrimeIcons:**

- **PrimeIcons**: PrimeVue components (buttons, menus, etc.)
- **Phosphor**: Custom components, empty states, illustrations

### Icon Sizing

**PrimeIcons:**

```vue
<!-- Small (default) -->
<i class="pi pi-user"></i>

<!-- Medium -->
<i class="pi pi-user text-xl"></i>

<!-- Large -->
<i class="pi pi-user text-2xl"></i>

<!-- Extra large -->
<i class="pi pi-user text-4xl"></i>
```

**Phosphor Icons:**

```vue
<!-- Via size prop -->
<PhClock :size="16" />  <!-- Small -->
<PhClock :size="24" />  <!-- Medium (default) -->
<PhClock :size="32" />  <!-- Large -->
<PhClock :size="48" />  <!-- Extra large -->
```

### Icon Colors

**Inherit parent color** (default):

```vue
<i class="pi pi-user"></i>
<PhClock :size="24" />
```

**Semantic colors:**

```vue
<i class="pi pi-check text-green-600"></i>
<i class="pi pi-times text-red-500"></i>
<i class="pi pi-exclamation-triangle text-yellow-600"></i>
<PhWarning :size="24" class="text-yellow-500" />
```

**Gray scale:**

```vue
<i class="pi pi-info-circle text-gray-400"></i>
<PhClock :size="48" class="text-gray-400" />
```

### When to Use Icons

**DO use icons for:**

- Action buttons (view, edit, delete)
- Navigation menu items
- Status indicators (with badges)
- Empty states
- Loading states
- Notifications

**DON'T use icons:**

- Excessively in body text
- Without clear meaning
- In place of text labels (except icon-only buttons with tooltips)

**Icon button pattern** (with tooltip):

```vue
<Button
  v-tooltip.top="'Edit'"
  icon="pi pi-pencil"
  text
  rounded
  severity="info"
  size="small"
  @click="handleEdit"
/>
```

---

## Accessibility

### Color Contrast Requirements

All color combinations meet **WCAG 2.1 AA standards** (4.5:1 for normal text, 3:1 for large text):

**Text on white backgrounds:**

| Combination | Contrast | Rating |
|-------------|----------|--------|
| `text-gray-900` on `bg-white` | 16.1:1 | AAA |
| `text-gray-700` on `bg-white` | 10.7:1 | AAA |
| `text-gray-600` on `bg-white` | 7.2:1 | AAA |
| `text-gray-500` on `bg-white` | 4.6:1 | AA |
| `text-blue-600` on `bg-white` | 5.1:1 | AA |
| `text-green-600` on `bg-white` | 4.5:1 | AA |

**Never use combinations below AA:**

❌ `text-gray-400` on `bg-white` (3.1:1 - fails AA)
❌ `text-gray-300` on `bg-white` (1.8:1 - fails AA)
❌ `text-blue-300` on `bg-white` (2.9:1 - fails AA)

### Focus States

**All interactive elements must have visible focus states.**

**Buttons** (handled by PrimeVue):

```vue
<Button label="Click me" />
<!-- Automatic focus ring via PrimeVue -->
```

**Links:**

```vue
<router-link
  to="/users"
  class="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
>
  Users
</router-link>
```

**Custom interactive elements:**

```vue
<button
  class="... focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
>
  Custom button
</button>
```

**Focus visible** (show focus only for keyboard navigation):

```vue
<button class="... focus-visible:ring-2 focus-visible:ring-blue-500">
  Button
</button>
```

### Screen Reader Considerations

**ARIA labels for icon-only buttons:**

```vue
<Button
  icon="pi pi-pencil"
  aria-label="Edit user"
  text
  rounded
/>
```

**Or use tooltips** (which also improve UX):

```vue
<Button
  v-tooltip.top="'Edit user'"
  icon="pi pi-pencil"
  text
  rounded
/>
```

**Descriptive link text:**

```vue
<!-- ❌ BAD -->
<a href="/users">Click here</a>

<!-- ✅ GOOD -->
<router-link to="/users">View all users</router-link>
```

**Form labels:**

```vue
<!-- Always use explicit labels -->
<label for="email" class="block mb-2">Email Address</label>
<InputText id="email" v-model="form.email" />

<!-- NOT placeholders only -->
❌ <InputText placeholder="Email" />
```

**Required fields:**

```vue
<label for="name" class="block mb-2">Name *</label>
<InputText id="name" v-model="form.name" required aria-required="true" />
```

### ARIA Labels

**Empty states:**

```vue
<div role="status" aria-live="polite">
  <EmptyState message="No users found" />
</div>
```

**Loading states:**

```vue
<div role="status" aria-live="polite" aria-busy="true">
  <LoadingState message="Loading users..." />
</div>
```

**Notifications:**

```vue
<!-- Toast component has built-in ARIA support -->
<Toast position="top-right" />
```

### Keyboard Navigation

**Ensure all interactive elements are keyboard accessible:**

- Tab through forms, buttons, links
- Enter/Space to activate buttons
- Escape to close modals
- Arrow keys for dropdowns (handled by PrimeVue)

**Modal dialogs** (handled by `BaseModal`):

- Trap focus within modal
- Escape to close
- Return focus to trigger element on close

---

## Do's and Don'ts

### Common Mistakes

#### ❌ DON'T: Arbitrary Typography Changes

```vue
<!-- ❌ BAD: Random font sizes -->
<p class="text-4xl">Regular table cell data</p>

<!-- ❌ BAD: Unnecessary color changes -->
<span class="text-pink-500">User email</span>

<!-- ❌ BAD: Excessive bolding -->
<td class="font-bold">{{ data.status }}</td>
```

#### ✅ DO: Consistent, Semantic Styling

```vue
<!-- ✅ GOOD: Standard table cell -->
<span class="text-sm text-gray-700">{{ data.email }}</span>

<!-- ✅ GOOD: Semantic color for status -->
<span class="text-red-500">(Deactivated)</span>

<!-- ✅ GOOD: Proper hierarchy -->
<h1 class="text-3xl font-bold text-gray-900">Page Title</h1>
<p class="text-gray-600">Subtitle</p>
```

#### ❌ DON'T: Inconsistent Spacing

```vue
<!-- ❌ BAD: Random margins -->
<div class="mb-7">...</div>
<div class="mb-5">...</div>
<div class="mb-9">...</div>

<!-- ❌ BAD: Mixing margin types -->
<div class="flex">
  <div class="mr-3">A</div>
  <div class="ml-2">B</div>
</div>
```

#### ✅ DO: Use Standard Spacing Scale

```vue
<!-- ✅ GOOD: Consistent spacing -->
<div class="mb-6">...</div>
<div class="mb-6">...</div>
<div class="mb-6">...</div>

<!-- ✅ GOOD: Use gap for flex -->
<div class="flex gap-3">
  <div>A</div>
  <div>B</div>
</div>
```

#### ❌ DON'T: Mix Border Styles

```vue
<!-- ❌ BAD: Inconsistent borders -->
<div class="border border-gray-300">...</div>
<div class="border border-gray-200">...</div>
<div class="border-2 border-gray-400">...</div>
```

#### ✅ DO: Use Consistent Border Style

```vue
<!-- ✅ GOOD: Always use gray-200 -->
<div class="border border-gray-200">...</div>
<div class="border border-gray-200">...</div>
<div class="border border-gray-200">...</div>
```

#### ❌ DON'T: Override PrimeVue Unnecessarily

```vue
<!-- ❌ BAD: Fighting with PrimeVue styles -->
<Button
  label="Save"
  class="!bg-pink-500 !text-white !px-8 !py-4 !text-2xl"
/>
```

#### ✅ DO: Use PrimeVue's Built-in Props

```vue
<!-- ✅ GOOD: Using severity and size props -->
<Button label="Save" severity="success" size="large" />
```

#### ❌ DON'T: Inline Styles

```vue
<!-- ❌ BAD: Inline styles -->
<div style="color: #ff0000; font-size: 18px; margin-bottom: 20px;">
  Content
</div>
```

#### ✅ DO: Use Tailwind Classes

```vue
<!-- ✅ GOOD: Tailwind utilities -->
<div class="text-red-500 text-lg mb-5">
  Content
</div>
```

### Best Practices

1. **Start with defaults** - Don't add styling unless you have a specific reason
2. **Use semantic colors** - Red for errors, green for success, etc.
3. **Maintain hierarchy** - Larger/bolder text for more important content
4. **Stay consistent** - If you style one table a certain way, style all tables that way
5. **Leverage PrimeVue** - Don't rebuild components that PrimeVue provides
6. **Test accessibility** - Use keyboard navigation, check contrast
7. **Follow the spacing scale** - 4, 6, 8, not 5, 7, 9
8. **Responsive by default** - Consider mobile from the start

### Code Review Checklist

Before submitting code, check:

- [ ] Are you using standard font sizes (`text-sm`, `text-base`, `text-lg`)?
- [ ] Are you using standard text colors (`text-gray-900`, `text-gray-700`, `text-gray-600`)?
- [ ] Are borders using `border-gray-200`?
- [ ] Is spacing using the standard scale (`gap-3`, `mb-6`, `p-4`)?
- [ ] Are semantic colors used correctly (red for errors, green for success)?
- [ ] Do all interactive elements have focus states?
- [ ] Do icon-only buttons have tooltips or ARIA labels?
- [ ] Is the styling consistent with other similar components?
- [ ] Have you avoided custom classes when utilities would work?
- [ ] Have you tested keyboard navigation and screen reader support?

---

## Complete Examples

### Example 1: User Table (UsersTable.vue)

**Complete, production-ready table component:**

```vue
<template>
  <DataTable
    :value="users"
    :loading="loading"
    :rows="10"
    :paginator="true"
    :rows-per-page-options="[10, 25, 50]"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    current-page-report-template="Showing {first} to {last} of {totalRecords} users"
    striped-rows
    responsive-layout="scroll"
    class="users-table"
  >
    <!-- Empty state -->
    <template #empty>
      <EmptyState message="No users found" />
    </template>

    <!-- Loading state -->
    <template #loading>
      <LoadingState message="Loading users..." />
    </template>

    <!-- Name Column with Avatar -->
    <Column field="name" header="Name" :sortable="true" style="min-width: 200px">
      <template #body="{ data }">
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm"
          >
            {{ getUserInitials(data) }}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">{{ getFullName(data) }}</p>
            <p v-if="data.deleted_at" class="text-xs text-red-500">(Deactivated)</p>
          </div>
        </div>
      </template>
    </Column>

    <!-- Email Column -->
    <Column field="email" header="Email" :sortable="true" style="min-width: 250px">
      <template #body="{ data }">
        <span class="text-sm text-gray-700">{{ data.email }}</span>
      </template>
    </Column>

    <!-- Status Column with Badge -->
    <Column field="status" header="Status" :sortable="true" style="min-width: 120px">
      <template #body="{ data }">
        <Badge
          :text="getStatusLabel(data.status)"
          :variant="getStatusVariant(data.status)"
          :icon="getStatusIcon(data.status)"
        />
      </template>
    </Column>

    <!-- Actions Column -->
    <Column header="Actions" :exportable="false" style="min-width: 150px">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            v-tooltip.top="'View'"
            icon="pi pi-eye"
            text
            rounded
            severity="secondary"
            size="small"
            @click="handleView(data)"
          />
          <Button
            v-tooltip.top="'Edit'"
            icon="pi pi-pencil"
            text
            rounded
            severity="info"
            size="small"
            @click="handleEdit(data)"
          />
          <Button
            v-if="!data.deleted_at"
            v-tooltip.top="'Deactivate'"
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            @click="handleDeactivate(data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Badge from '@admin/components/common/Badge.vue';
import EmptyState from '@admin/components/common/EmptyState.vue';
import LoadingState from '@admin/components/common/LoadingState.vue';
import type { User } from '@admin/types/user';

interface Props {
  users: User[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  view: [user: User];
  edit: [user: User];
  deactivate: [user: User];
}>();

// Helper functions
const getFullName = (user: User): string => {
  return `${user.first_name} ${user.last_name}`;
};

const getUserInitials = (user: User): string => {
  return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
};

const getStatusLabel = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusVariant = (status: string) => {
  const variants = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'danger',
  };
  return variants[status as keyof typeof variants] || 'secondary';
};

const getStatusIcon = (status: string): string => {
  const icons = {
    active: 'pi-circle-fill',
    inactive: 'pi-circle',
    suspended: 'pi-ban',
  };
  return icons[status as keyof typeof icons] || 'pi-circle';
};

const handleView = (user: User) => emit('view', user);
const handleEdit = (user: User) => emit('edit', user);
const handleDeactivate = (user: User) => emit('deactivate', user);
</script>
```

**Key styling elements:**

- Avatar: `w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600`
- User name: `text-sm font-medium text-gray-900`
- Deactivated label: `text-xs text-red-500`
- Email: `text-sm text-gray-700`
- Flex container: `flex items-center gap-3`
- Action buttons: `gap-2` spacing

### Example 2: Create User Modal (CreateUserModal.vue)

**Complete form modal:**

```vue
<template>
  <BaseModal
    :visible="visible"
    width="40rem"
    @update:visible="emit('update:visible', $event)"
    @close="handleClose"
  >
    <template #header>Create New User</template>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- First Name -->
      <div>
        <label for="create-first-name" class="block mb-2">First Name *</label>
        <InputText
          id="create-first-name"
          v-model="form.first_name"
          class="w-full"
          :invalid="hasFieldError('first_name')"
          required
        />
        <small v-if="hasFieldError('first_name')" class="text-red-500">
          {{ getFieldError('first_name') }}
        </small>
      </div>

      <!-- Last Name -->
      <div>
        <label for="create-last-name" class="block mb-2">Last Name *</label>
        <InputText
          id="create-last-name"
          v-model="form.last_name"
          class="w-full"
          :invalid="hasFieldError('last_name')"
          required
        />
        <small v-if="hasFieldError('last_name')" class="text-red-500">
          {{ getFieldError('last_name') }}
        </small>
      </div>

      <!-- Email -->
      <div>
        <label for="create-email" class="block mb-2">Email *</label>
        <InputText
          id="create-email"
          v-model="form.email"
          type="email"
          class="w-full"
          :invalid="hasFieldError('email')"
          required
        />
        <small v-if="hasFieldError('email')" class="text-red-500">
          {{ getFieldError('email') }}
        </small>
      </div>

      <!-- Status -->
      <div>
        <label for="create-status" class="block mb-2">Status *</label>
        <Select
          id="create-status"
          v-model="form.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          :invalid="hasFieldError('status')"
        />
        <small v-if="hasFieldError('status')" class="text-red-500">
          {{ getFieldError('status') }}
        </small>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          @click="emit('update:visible', false)"
        />
        <Button label="Create" :loading="loading" @click="handleSubmit" />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'user-created': [];
}>();

const loading = ref(false);
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  status: 'active',
});
const fieldErrors = ref<Record<string, string[]>>({});

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

const hasFieldError = (field: string): boolean => {
  return !!fieldErrors.value[field];
};

const getFieldError = (field: string): string | undefined => {
  return fieldErrors.value[field]?.[0];
};

const handleSubmit = async () => {
  // Submit logic
};

const handleClose = () => {
  // Reset form
};
</script>
```

**Key styling elements:**

- Form wrapper: `space-y-4`
- Label: `block mb-2`
- Input: `w-full`
- Error message: `text-red-500`
- Footer: `flex justify-end gap-2`

### Example 3: Dashboard Page (DashboardView.vue)

**Complete page layout:**

```vue
<template>
  <div class="dashboard">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome back, {{ adminName }}!</h1>
      <p class="text-gray-600">Here's what's happening with your platform today.</p>
    </div>

    <!-- Recent Activity Card -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <span>Recent Activity</span>
          <Button
            icon="pi pi-refresh"
            text
            rounded
            size="small"
            severity="secondary"
            :loading="loading"
            @click="loadActivities"
          />
        </div>
      </template>
      <template #content>
        <!-- Loading State -->
        <div v-if="loading && !recentActivity.length" class="space-y-4">
          <Skeleton v-for="i in 5" :key="i" height="80px" class="mb-3" />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!loading && !recentActivity.length"
          class="text-center py-8 text-gray-500"
        >
          <i class="pi pi-inbox text-4xl mb-3 block"></i>
          <p>No recent activity to display</p>
        </div>

        <!-- Activity List -->
        <div v-else class="space-y-4">
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            class="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-0"
          >
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                getActivityColor(activity),
              ]"
            >
              <i :class="getActivityIcon(activity)"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">{{ getActivityTitle(activity) }}</p>
              <p class="text-xs text-gray-600 mt-1">{{ activity.description }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ formatTime(activity.created_at) }}</p>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';

const recentActivity = ref([]);
const loading = ref(false);

const loadActivities = async () => {
  // Load logic
};

const getActivityColor = (activity: any): string => {
  const colors = {
    created: 'bg-green-100 text-green-600',
    updated: 'bg-blue-100 text-blue-600',
    deleted: 'bg-red-100 text-red-600',
  };
  return colors[activity.event] || 'bg-gray-100 text-gray-600';
};

const getActivityIcon = (activity: any): string => {
  const icons = {
    created: 'pi pi-plus-circle',
    updated: 'pi pi-pencil',
    deleted: 'pi pi-trash',
  };
  return icons[activity.event] || 'pi pi-circle';
};
</script>

<style scoped>
.dashboard {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
```

**Key styling elements:**

- Page header: `mb-6`
- H1: `text-3xl font-bold text-gray-900 mb-2`
- Subtitle: `text-gray-600`
- Activity item: `flex items-start gap-3 pb-4 border-b border-gray-200 last:border-0`
- Icon circle: `w-10 h-10 rounded-full flex items-center justify-center`
- Text hierarchy: `text-sm` (title), `text-xs` (details)

### Example 4: Badge Component (Badge.vue)

**Reusable badge component:**

```vue
<template>
  <span :class="['inline-flex items-center rounded-full font-medium', sizeClasses, variantClasses]">
    <i v-if="icon" :class="['pi', icon, iconSizeClass, 'mr-1.5']"></i>
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type BadgeVariant =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'secondary'
  | 'purple';

export type BadgeSize = 'sm' | 'md';

interface Props {
  text: string;
  variant?: BadgeVariant;
  icon?: string;
  size?: BadgeSize;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
});

const variantClasses = computed<string>(() => {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-700',
    info: 'bg-blue-100 text-blue-700',
    primary: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    secondary: 'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return variants[props.variant];
});

const sizeClasses = computed<string>(() => {
  const sizes: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };
  return sizes[props.size];
});

const iconSizeClass = computed<string>(() => {
  const iconSizes: Record<BadgeSize, string> = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
  };
  return iconSizes[props.size];
});
</script>
```

**Usage:**

```vue
<Badge text="Active" variant="success" icon="pi-circle-fill" />
<Badge text="Pending" variant="warning" />
<Badge text="Admin" variant="purple" size="sm" />
```

---

## Summary

### Key Takeaways

1. **Consistency is king** - Don't deviate from base styles without a specific reason
2. **Use semantic colors** - Red for errors, green for success, gray for neutral
3. **Follow the spacing scale** - 4, 6, 8, not random values
4. **Leverage PrimeVue** - Don't rebuild what's already built
5. **Accessibility first** - Test keyboard navigation, check contrast
6. **Tailwind over custom CSS** - Utilities are faster and more maintainable
7. **Typography hierarchy** - Larger/bolder for more important content
8. **Test on mobile** - Responsive design from the start

### Quick Reference

**Typography:**
- Body text: `text-sm text-gray-700`
- Headings: `text-3xl font-bold text-gray-900`
- Labels: `block mb-2`

**Colors:**
- Borders: `border-gray-200`
- Backgrounds: `bg-white`, `bg-gray-50`
- Success: `bg-green-100 text-green-700`
- Error: `text-red-500`

**Spacing:**
- Form fields: `space-y-4`
- Button groups: `flex gap-2`
- Sections: `mb-6`

**Icons:**
- PrimeIcons: `<i class="pi pi-user"></i>`
- Phosphor: `<PhClock :size="24" />`

### Need Help?

- **Main guide**: [Admin Dashboard Development Guide](./admin-dashboard-development-guide.md)
- **PrimeVue docs**: https://primevue.org
- **Tailwind docs**: https://tailwindcss.com
- **Accessibility**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated**: 2025-10-15
