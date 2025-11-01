# App Styling Guide

## Overview

The app frontend (resources/app/) uses a **utility-first CSS approach** combining:
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **PrimeVue 4** - UI component library with Aura preset theme
- **CSS Custom Properties** - Variables for consistent theming
- **Scoped styles** - Component-specific styles only when necessary

**Design Philosophy:**
- Mobile-first responsive design
- Utility classes over custom CSS
- Consistent spacing and typography
- Semantic color usage
- Accessibility built-in

---

## CSS Architecture

### File Structure
```
resources/app/
├── css/
│   └── app.css       # Global styles, PrimeVue customizations, CSS variables
└── js/
    └── components/   # Component-scoped styles (minimal, when needed)
```

### app.css Structure

The `app.css` file is organized into clear sections:

```css
/* 1. Google Fonts Import (Noto Sans) */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans...');

/* 2. Tailwind CSS Imports */
@import 'tailwindcss';
@plugin 'tailwindcss-primeui';

/* 3. CSS Custom Properties (Variables) */
:root {
  /* Custom Application Variables */
  /* PrimeVue Default CSS Variables (Aura Theme) */
}

/* 4. Global Element Styles */
body { }
h1, h2, h3, h4, h5, h6 { }
button, a, input, select, textarea { }

/* 5. Accessibility Styles */
:focus-visible { }

/* 6. Scrollbar Customization */
::-webkit-scrollbar { }

/* 7. Custom Utility Classes */
@layer utilities { }

/* 8. PrimeVue Component Customizations */
.p-panel { }
.p-card { }
.p-drawer { }
.p-dialog { }
.p-tab { }
.p-inputtext { }
.p-datatable-tbody { }
```

---

## CSS Variables (Custom Properties)

### Brand Colors

```css
:root {
  /* Brand Colors */
  --user-primary: #3b82f6;      /* Blue - Primary actions */
  --user-secondary: #8b5cf6;    /* Purple - Secondary elements */
  --user-accent: #ef4444;       /* Red - Accents and warnings */
}
```

**Usage:**
```css
.custom-button {
  background-color: var(--user-primary);
}
```

### Layout Variables

```css
:root {
  /* Layout Dimensions */
  --sidebar-width: 16rem;              /* 256px - Full sidebar */
  --sidebar-collapsed-width: 5rem;      /* 80px - Collapsed sidebar */
  --topbar-height: 4rem;                /* 64px - Top navigation bar */
}
```

**Usage:**
```css
.sidebar {
  width: var(--sidebar-width);
}
```

### Color Scheme

```css
:root {
  /* Light grey/white color scheme */
  --bg-primary: #ffffff;      /* White - Primary backgrounds */
  --bg-secondary: #f9fafb;    /* Gray 50 - Secondary backgrounds */
  --bg-tertiary: #f3f4f6;     /* Gray 100 - Tertiary backgrounds */
  --bg-white: #ffffff;        /* Pure white */

  --border-light: #e5e7eb;    /* Gray 200 - Light borders */
  --border-medium: #d1d5db;   /* Gray 300 - Medium borders */

  --text-primary: #111827;    /* Gray 900 - Primary text */
  --text-secondary: #6b7280;  /* Gray 500 - Secondary text */
  --text-muted: #9ca3af;      /* Gray 400 - Muted text */
}
```

**Usage:**
```vue
<div class="bg-tertiary border-light">
  <!-- Uses custom utility classes -->
</div>
```

### Typography

```css
:root {
  /* Font size scale */
  --font-size-base: 14px;     /* Default body text */
  --font-size-xs: 10px;       /* Extra small text */
  --font-size-sm: 12px;       /* Small text */
  --font-size-md: 13px;       /* Medium text */
  --font-size-lg: 16px;       /* Large text */
  --font-size-xl: 18px;       /* Extra large text */
  --font-size-2xl: 24px;      /* 2X large text */
}

body {
  font-family: 'Noto Sans', system-ui, -apple-system, sans-serif;
  font-size: var(--font-size-base);
}
```

### Custom Shadows

```css
:root {
  /* Custom Shadows - Reverse (upward) shadows for bottom elements */
  --shadow-reverse: 0 -2px 4px rgb(0 0 0 / 0.08);
  --shadow-reverse-md: 0 -3px 6px rgb(0 0 0 / 0.1);
  --shadow-reverse-lg: 0 -4px 8px rgb(0 0 0 / 0.12);
  --shadow-reverse-xl: 0 -6px 12px rgb(0 0 0 / 0.15);
}
```

**Usage:**
```vue
<div class="shadow-reverse-md">
  <!-- Footer with upward shadow -->
</div>
```

---

## PrimeVue Customization

### Theme Configuration

PrimeVue is configured with the **Aura preset theme** using CSS variables. The app.css file provides overrides while maintaining theme consistency.

```css
:root {
  /* PrimeVue Component Customizations */
  --p-drawer-header-padding: 1rem 1rem;
  --p-card-border-radius: 0.5rem;
  --p-card-body-gap: 0;
}
```

### PrimeVue Primary Color Scale

```css
:root {
  /* PrimeVue Primary Color Scale (Blue) */
  --p-primary-50: #eff6ff;
  --p-primary-100: #dbeafe;
  --p-primary-200: #bfdbfe;
  --p-primary-300: #93c5fd;
  --p-primary-400: #60a5fa;
  --p-primary-500: #3b82f6;   /* Main primary color */
  --p-primary-600: #2563eb;
  --p-primary-700: #1d4ed8;
  --p-primary-800: #1e40af;
  --p-primary-900: #1e3a8a;
  --p-primary-950: #172554;
}
```

### PrimeVue Surface Scale

```css
:root {
  /* PrimeVue Surface Scale (Grays) */
  --p-surface-0: #ffffff;
  --p-surface-50: #f9fafb;
  --p-surface-100: #f3f4f6;
  --p-surface-200: #e5e7eb;
  --p-surface-300: #d1d5db;
  --p-surface-400: #9ca3af;
  --p-surface-500: #6b7280;
  --p-surface-600: #4b5563;
  --p-surface-700: #374151;
  --p-surface-800: #1f2937;
  --p-surface-900: #111827;
  --p-surface-950: #030712;
}
```

### PrimeVue Text Colors

```css
:root {
  /* PrimeVue Text Colors */
  --p-text-color: #111827;
  --p-text-hover-color: #1f2937;
  --p-text-muted-color: #6b7280;
  --p-text-hover-muted-color: #4b5563;
}
```

### Component Overrides

#### 1. Panel Component

```css
.p-panel-header {
  padding: 0;
}
.p-panel-header-actions {
  border-bottom: 1px solid var(--border-light);
}
.p-panel {
  border: 0;
}
.p-panel-content {
  padding: 0;
}
```

**Purpose:** Removes default padding and borders for custom layouts.

#### 2. Card Component

```css
.p-card-body {
  padding: 0;
}
```

**Purpose:** Removes body padding for custom card layouts.

**Example usage:**
```vue
<Card class="transition-shadow duration-300 hover:shadow-lg border-blue-100 border">
  <template #header>
    <img src="..." class="w-full h-40 object-cover" />
  </template>
  <template #content>
    <!-- Custom padded content -->
  </template>
</Card>
```

#### 3. Drawer Component

```css
.p-drawer-header {
  background-color: var(--bg-tertiary);
  margin-bottom: 0;
  box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border-medium);
}
.p-drawer-content {
  padding: 16px 0 0;
}
```

**Purpose:** Styled header with tertiary background and shadow separation.

#### 4. Dialog Component

```css
.p-dialog-header {
  background-color: var(--bg-tertiary);
  border-radius: 1rem 1rem 0 0;
  margin-bottom: 0;
  box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border-medium);
}
.p-dialog-content {
  padding: 1rem;
}
.p-dialog-footer {
  background-color: var(--bg-tertiary);
  border-radius: 0 0 1rem 1rem;
  padding: 1rem;
  box-shadow: var(--shadow-reverse-md);
}
.p-dialog-close-button {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-medium);
}
.p-dialog-close-button:hover {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-md);
}
```

**Purpose:** Consistent header/footer styling with tertiary background and shadows.

#### 5. Tabs Component

```css
.p-tab.p-tab-active {
  color: var(--user-primary);
}
.p-tablist-active-bar {
  background-color: var(--user-primary);
}
.p-tablist-bar-list {
  background-color: inherit !important;
}
.p-tabpanels {
  padding: 0;
  background-color: inherit !important;
}
```

**Purpose:** Custom active tab color using brand primary.

#### 6. Input Components

```css
.p-inputtext::placeholder,
.p-inputnumber-input::placeholder,
.p-textarea::placeholder {
  color: var(--text-muted);
}
```

**Purpose:** Consistent placeholder text color.

#### 7. Password Component

```css
.p-password {
  display: inline-flex;
  position: relative;
}
.p-password-input {
  padding-right: 2.5rem;
}
.p-password .p-icon-field {
  width: 100%;
}
.p-password .p-icon-field-right > .p-inputtext {
  padding-right: 2.5rem;
}
```

**Purpose:** Proper spacing for password toggle icon.

#### 8. DataTable Component

```css
.p-datatable-tbody > tr > td {
  padding: 0.5rem 1rem;
}
.p-dataview-content {
  background-color: inherit;
}
```

**Purpose:** Consistent table cell padding and transparent background.

---

## Tailwind CSS

### Configuration

Tailwind CSS 4.0 is integrated with the **tailwindcss-primeui** plugin for seamless PrimeVue integration.

```css
@import 'tailwindcss';
@plugin 'tailwindcss-primeui';
```

### Common Utility Patterns

#### Layout

**Page Container:**
```vue
<div class="max-w-7xl mx-auto p-6">
  <!-- Page content -->
</div>
```

**Standard Padding:**
```vue
<div class="p-4">Small padding (16px)</div>
<div class="p-6">Medium padding (24px)</div>
<div class="px-4 py-8">Horizontal + vertical padding</div>
```

**Grid Layouts:**
```vue
<!-- Responsive card grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card v-for="item in items" :key="item.id">
    <!-- Card content -->
  </Card>
</div>
```

**Flex Layouts:**
```vue
<!-- Header with title and action -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-3xl font-bold">Title</h1>
  <Button label="Action" />
</div>

<!-- Icon with text -->
<div class="flex items-center gap-4">
  <PhIcon :size="24" />
  <span>Text content</span>
</div>
```

#### Typography

**Headings:**
```vue
<h1 class="text-3xl font-bold">Main Page Title</h1>
<h2 class="text-2xl font-bold">Section Title</h2>
<h3 class="text-xl font-bold">Subsection Title</h3>
<h4 class="text-lg font-bold">Card Title</h4>
```

**Body Text:**
```vue
<p>Default text (inherits text-base from body)</p>
<p class="text-sm">Small text (12px)</p>
<small class="text-xs">Extra small text (10px)</small>
```

**Text Colors:**
```vue
<p class="text-gray-900">Primary text (default)</p>
<p class="text-gray-600">Secondary text</p>
<p class="text-gray-500">Muted text</p>
<p class="text-red-600">Error text</p>
<p class="text-green-600">Success text</p>
```

#### Spacing

**Margins:**
```vue
<div class="mb-2">Small margin bottom (8px)</div>
<div class="mb-4">Medium margin bottom (16px)</div>
<div class="mb-6">Large margin bottom (24px)</div>
<div class="mt-3">Top margin (12px)</div>
```

**Gaps:**
```vue
<div class="flex gap-2">Small gap (8px)</div>
<div class="flex gap-4">Medium gap (16px)</div>
<div class="flex gap-6">Large gap (24px)</div>

<div class="space-y-4">Vertical spacing between children</div>
```

#### Colors

**Background Colors:**
```vue
<div class="bg-white">White background</div>
<div class="bg-gray-50">Light gray background</div>
<div class="bg-blue-100">Light blue background</div>
<div class="bg-tertiary">Tertiary background (custom utility)</div>
```

**Border Colors:**
```vue
<div class="border border-gray-200">Light border</div>
<div class="border border-blue-100">Blue border</div>
<div class="border-b border-slate-200">Bottom border only</div>
```

#### States & Transitions

**Hover States:**
```vue
<button class="hover:bg-slate-100 transition-colors">
  Hover effect
</button>

<a class="text-gray-600 hover:text-blue-600 transition-colors">
  Link hover
</a>

<div class="transition-shadow duration-300 hover:shadow-lg">
  Shadow on hover
</div>
```

**Group Hover:**
```vue
<div class="group">
  <PhIcon class="text-gray-400 group-hover:text-primary-500 transition-colors" />
  <span class="text-gray-600 group-hover:text-gray-800">Text</span>
</div>
```

#### Responsive Design

**Breakpoints:**
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

**Responsive Grid:**
```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns -->
</div>
```

**Responsive Text:**
```vue
<h1 class="text-2xl md:text-3xl lg:text-4xl">
  <!-- Mobile: 24px, Tablet: 30px, Desktop: 36px -->
</h1>
```

**Responsive Visibility:**
```vue
<div class="hidden md:block">Visible on tablet and up</div>
<div class="block md:hidden">Visible on mobile only</div>
```

### Custom Utility Classes

Custom utilities defined in `@layer utilities`:

```css
@layer utilities {
  /* Reverse shadows (for bottom elements) */
  .shadow-reverse {
    box-shadow: var(--shadow-reverse);
  }
  .shadow-reverse-md {
    box-shadow: var(--shadow-reverse-md);
  }
  .shadow-reverse-lg {
    box-shadow: var(--shadow-reverse-lg);
  }
  .shadow-reverse-xl {
    box-shadow: var(--shadow-reverse-xl);
  }

  /* Background colors from CSS variables */
  .bg-tertiary {
    background-color: var(--bg-tertiary);
  }
  .bg-secondary {
    background-color: var(--bg-secondary);
  }
  .bg-primary {
    background-color: var(--bg-primary);
  }
  .bg-white {
    background-color: var(--bg-white);
  }
}
```

**Usage:**
```vue
<div class="bg-tertiary shadow-reverse-md">
  Footer with upward shadow
</div>
```

---

## Typography

### Font Family

**Noto Sans** from Google Fonts:

```css
body {
  font-family: 'Noto Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

Font weights available: 100-900 (regular and italic).

### Font Sizes

| Size | Variable | Value | Tailwind Class | Usage |
|------|----------|-------|----------------|-------|
| XS | `--font-size-xs` | 10px | `text-xs` | Fine print, captions |
| SM | `--font-size-sm` | 12px | `text-sm` | Labels, small text |
| MD | `--font-size-md` | 13px | - | Medium text |
| Base | `--font-size-base` | 14px | `text-base` | Body text (default) |
| LG | `--font-size-lg` | 16px | `text-lg` | Emphasized text |
| XL | `--font-size-xl` | 18px | `text-xl` | Large text |
| 2XL | `--font-size-2xl` | 24px | `text-2xl` | Headings |

### Heading Styles

```vue
<h1 class="text-3xl font-bold text-gray-900">Page Title</h1>
<h2 class="text-2xl font-bold text-gray-900">Section Title</h2>
<h3 class="text-xl font-bold text-gray-900">Subsection Title</h3>
<h4 class="text-lg font-bold text-gray-900">Card Title</h4>
```

All headings automatically receive `color: var(--text-primary)` from global styles.

### Text Colors

| Purpose | Tailwind Class | CSS Variable | Color |
|---------|----------------|--------------|-------|
| Primary | `text-gray-900` | `--text-primary` | #111827 |
| Secondary | `text-gray-600` | `--text-secondary` | #6b7280 |
| Muted | `text-gray-500` | `--text-muted` | #9ca3af |
| Error | `text-red-600` | - | Red 600 |
| Success | `text-green-600` | - | Green 600 |
| Warning | `text-yellow-600` | - | Yellow 600 |
| Info | `text-blue-600` | - | Blue 600 |

---

## Color System

### Primary Colors

| Color | Variable | Hex | Usage |
|-------|----------|-----|-------|
| Blue | `--user-primary`, `--p-primary-500` | #3b82f6 | Primary actions, links, active states |
| Purple | `--user-secondary` | #8b5cf6 | Secondary elements, accents |
| Red | `--user-accent` | #ef4444 | Warnings, destructive actions, errors |

### Neutral Colors (Grays)

| Name | Tailwind | Hex | Usage |
|------|----------|-----|-------|
| White | `bg-white` | #ffffff | Cards, primary backgrounds |
| Gray 50 | `bg-gray-50` | #f9fafb | Secondary backgrounds |
| Gray 100 | `bg-gray-100` | #f3f4f6 | Tertiary backgrounds, hover states |
| Gray 200 | `border-gray-200` | #e5e7eb | Light borders |
| Gray 300 | `border-gray-300` | #d1d5db | Medium borders |
| Gray 400 | `text-gray-400` | #9ca3af | Muted text |
| Gray 500 | `text-gray-500` | #6b7280 | Secondary text |
| Gray 600 | `text-gray-600` | #4b5563 | Body text |
| Gray 900 | `text-gray-900` | #111827 | Primary text |

### Semantic Colors

**Success (Green):**
```vue
<div class="bg-green-100 text-green-800 border border-green-200">
  Success message
</div>
```

**Warning (Yellow):**
```vue
<div class="bg-yellow-100 text-yellow-800 border border-yellow-200">
  Warning message
</div>
```

**Error (Red):**
```vue
<div class="bg-red-100 text-red-800 border border-red-200">
  Error message
</div>
```

**Info (Blue):**
```vue
<div class="bg-blue-100 text-blue-800 border border-blue-200">
  Info message
</div>
```

### Background Colors

```vue
<!-- Primary backgrounds -->
<div class="bg-white">White</div>
<div class="bg-primary">White (custom utility)</div>

<!-- Secondary backgrounds -->
<div class="bg-gray-50">Gray 50</div>
<div class="bg-secondary">Gray 50 (custom utility)</div>

<!-- Tertiary backgrounds -->
<div class="bg-gray-100">Gray 100</div>
<div class="bg-tertiary">Gray 100 (custom utility)</div>

<!-- Colored backgrounds -->
<div class="bg-blue-50">Light blue</div>
<div class="bg-blue-100">Lighter blue</div>
```

---

## Layout Patterns

### Page Container

Standard page wrapper with max width and padding:

```vue
<template>
  <div class="max-w-7xl mx-auto p-6">
    <!-- Page content -->
  </div>
</template>
```

**Real example from LeagueList.vue:**
```vue
<template>
  <div class="max-w-7xl mx-auto p-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="mt-3 flex justify-between items-center mb-6 bg-white p-4 rounded-lg border border-blue-100">
      <PageHeader title="Your Leagues" description="Manage your racing leagues and competitions" />
      <Button label="Create League" icon="pi pi-plus" @click="openCreateDrawer" />
    </div>

    <DataView :value="leagues" :loading="isLoading">
      <template #list="{ items }">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LeagueCard v-for="league in items" :key="league.id" :league="league" />
        </div>
      </template>
    </DataView>
  </div>
</template>
```

### Card Grid

Responsive grid for cards:

```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card v-for="item in items" :key="item.id">
    <template #content>
      {{ item.name }}
    </template>
  </Card>
</div>
```

**Variations:**
```vue
<!-- Two columns max -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

<!-- Four columns on large screens -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

<!-- Auto-fit with minimum width -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
```

### Form Layout

Vertical form with consistent spacing:

```vue
<form class="space-y-4">
  <div>
    <FormLabel text="Name" required />
    <InputText v-model="form.name" />
    <FormError :error="errors.name" />
  </div>

  <div>
    <FormLabel text="Email" />
    <InputText v-model="form.email" type="email" />
  </div>

  <Button label="Submit" type="submit" />
</form>
```

Two-column form layout:

```vue
<form class="space-y-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <FormLabel text="First Name" />
      <InputText v-model="form.firstName" />
    </div>
    <div>
      <FormLabel text="Last Name" />
      <InputText v-model="form.lastName" />
    </div>
  </div>

  <div>
    <FormLabel text="Email" />
    <InputText v-model="form.email" class="w-full" />
  </div>

  <Button label="Submit" type="submit" />
</form>
```

### Flex Layouts

**Header with title and action:**
```vue
<div class="flex items-center justify-between mb-6">
  <h1 class="text-3xl font-bold">Page Title</h1>
  <Button label="Create New" icon="pi pi-plus" />
</div>
```

**Icon with text (horizontal):**
```vue
<div class="flex items-center gap-4">
  <PhIcon :size="24" class="text-gray-500" />
  <span class="text-gray-900">Content text</span>
</div>
```

**Real example from Header.vue:**
```vue
<header class="container w-full lg:mx-auto px-4 max-w-7xl mx-auto">
  <div class="flex items-center justify-between h-16">
    <router-link to="/" class="flex items-center">
      <span class="text-xl font-bold text-slate-600">{{ siteConfig.siteName }}</span>
    </router-link>

    <nav class="flex items-center gap-4">
      <router-link to="/" :class="linkStyles">
        <PhFlagCheckered :size="16" />
        Your Leagues
      </router-link>
      <button :class="linkStyles" @click="openProfileModal">
        <PhUser :size="16" />
        Profile
      </button>
    </nav>
  </div>
</header>
```

### Info Grid Pattern

**Real example from LeagueCard.vue:**
```vue
<div class="grid grid-cols-2 gap-px w-full bg-surface-200">
  <InfoItem :icon="PhGameController" title="Platforms" :text="platformNames" />
  <InfoItem :icon="PhMapPinArea" title="Timezone" :text="league.timezone" />
  <InfoItem :icon="PhTrophy" title="Competitions" :text="competitionsText" />
  <InfoItem :icon="PhSteeringWheel" title="Drivers" :text="driversText" />
</div>
```

**InfoItem.vue component:**
```vue
<template>
  <div class="flex gap-2 bg-slate-50 py-3 px-3 group">
    <component
      :is="icon"
      :size="28"
      class="shrink-0 text-slate-400 group-hover:text-primary-500 transition-colors"
    />
    <div class="flex flex-col space-y-0.5 pl-1">
      <span class="text-xs uppercase text-primary-300 group-hover:text-primary-500">{{ title }}</span>
      <span class="text-slate-600 group-hover:text-slate-800">{{ text }}</span>
    </div>
  </div>
</template>
```

---

## Component Styling Patterns

### Utility Classes First

**Always prefer Tailwind utilities over scoped styles.**

✅ **Good - Utility classes:**
```vue
<template>
  <div class="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
    <PhIcon :size="24" class="text-gray-500" />
    <span class="text-gray-900 font-medium">Content</span>
  </div>
</template>
```

❌ **Bad - Custom CSS:**
```vue
<template>
  <div class="custom-container">
    <PhIcon :size="24" />
    <span>Content</span>
  </div>
</template>

<style scoped>
.custom-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>
```

### Scoped Styles When Necessary

Use `<style scoped>` only for:
1. Complex PrimeVue component customizations
2. Component-specific animations
3. Layouts too complex for utilities

**Example - PrimeVue deep customization:**
```vue
<template>
  <Panel>
    <template #header>Custom Header</template>
    Content
  </Panel>
</template>

<style scoped>
:deep(.p-panel-header) {
  background-color: var(--bg-tertiary);
  padding: 1rem;
}
</style>
```

### PrimeVue Component Styling

**Three ways to style PrimeVue components:**

#### 1. Component Props (Preferred)

```vue
<Button
  severity="primary"
  size="large"
  variant="outlined"
  rounded
/>

<Chip severity="success" class="text-sm font-medium" />

<InputText :class="{ 'p-invalid': errors.name }" />
```

#### 2. Global CSS Overrides (app.css)

For app-wide customizations:

```css
/* app.css */
.p-dialog-header {
  background-color: var(--bg-tertiary);
}
```

#### 3. Scoped Overrides with :deep()

For component-specific customizations:

```vue
<template>
  <Dialog :visible="visible">
    <template #header>Custom Dialog</template>
    Content
  </Dialog>
</template>

<style scoped>
:deep(.p-dialog-header) {
  background-color: var(--bg-primary);
}
</style>
```

### Real Component Examples

**FormLabel.vue:**
```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  for?: string;
  required?: boolean;
  text: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  class: '',
});

const labelClasses = computed(() => {
  const baseClasses = 'block text-sm font-medium text-gray-700 mb-2';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <label :for="props.for" :class="labelClasses">
    {{ props.text }}
    <span v-if="props.required" class="text-red-500">*</span>
  </label>
</template>
```

**FormError.vue:**
```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  error?: string | string[];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  error: undefined,
  class: '',
});

const errorMessage = computed(() => {
  if (!props.error) return null;
  return Array.isArray(props.error) ? props.error[0] : props.error;
});

const errorClasses = computed(() => {
  const baseClasses = 'text-sm text-red-500 mt-1';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <small v-if="errorMessage" :class="errorClasses">
    {{ errorMessage }}
  </small>
</template>
```

**DriverStatusBadge.vue:**
```vue
<script setup lang="ts">
import { computed } from 'vue';
import Chip from 'primevue/chip';
import type { DriverStatus } from '@app/types/driver';

interface Props {
  status: DriverStatus;
}

const props = defineProps<Props>();

const chipClass = computed(() => {
  switch (props.status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'banned':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
});

const statusLabel = computed(() => {
  switch (props.status) {
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    case 'banned': return 'Banned';
    default: return props.status;
  }
});
</script>

<template>
  <Chip :label="statusLabel" :class="chipClass" class="text-sm font-medium" />
</template>
```

---

## Responsive Design

### Mobile-First Approach

**Always design for mobile first, then add responsive classes.**

```vue
<!-- Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card v-for="item in items" :key="item.id">{{ item.name }}</Card>
</div>

<!-- Mobile: small text, Tablet: base text, Desktop: large text -->
<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

<!-- Mobile: full width, Desktop: half width -->
<div class="w-full lg:w-1/2">
  <Button label="Action" class="w-full lg:w-auto" />
</div>
```

### Breakpoints

| Breakpoint | Min Width | Example |
|------------|-----------|---------|
| `sm:` | 640px | `sm:text-lg` |
| `md:` | 768px | `md:grid-cols-2` |
| `lg:` | 1024px | `lg:grid-cols-3` |
| `xl:` | 1280px | `xl:max-w-7xl` |

### Responsive Visibility

```vue
<!-- Desktop only navigation -->
<nav class="hidden md:block">
  <a href="#">Desktop Nav</a>
</nav>

<!-- Mobile only menu -->
<div class="block md:hidden">
  <button>Mobile Menu</button>
</div>

<!-- Responsive padding -->
<div class="p-4 md:p-6 lg:p-8">
  <!-- 16px mobile, 24px tablet, 32px desktop -->
</div>
```

### Responsive Examples

**Real example from LeagueList.vue:**
```vue
<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="mt-3 flex justify-between items-center mb-6 bg-white p-4 rounded-lg">
      <div class="w-1/2">
        <PageHeader title="Your Leagues" description="Manage your racing leagues" />
      </div>
      <Button label="Create League" icon="pi pi-plus" />
    </div>

    <DataView :value="leagues">
      <template #list="{ items }">
        <!-- Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LeagueCard v-for="league in items" :key="league.id" :league="league" />
        </div>
      </template>
    </DataView>
  </div>
</template>
```

---

## Styling Conventions

### Text Size Rules

**Only add text size if deviating from `text-base` (14px default).**

✅ **Good:**
```vue
<!-- Default body text - no class needed -->
<p>This is default text</p>

<!-- Specify when different -->
<h1 class="text-3xl font-bold">Large heading</h1>
<small class="text-sm">Small text</small>
<span class="text-xs">Extra small caption</span>
```

❌ **Bad:**
```vue
<!-- Redundant - text-base is already default -->
<p class="text-base">This is default text</p>
```

### Font Color Rules

**Only add font color if design requires it. Default text inherits body color.**

✅ **Good:**
```vue
<!-- Default text color - no class needed -->
<p>Default text color</p>

<!-- Specify semantic colors -->
<p class="text-gray-600">Secondary text</p>
<p class="text-red-600">Error message</p>
<p class="text-green-600">Success message</p>
```

❌ **Bad:**
```vue
<!-- Redundant - body already has default color -->
<p class="text-gray-900">Default text color</p>
```

### Scoped Styles Only When Necessary

Use scoped styles sparingly:

✅ **Good - Utilities first:**
```vue
<template>
  <div class="flex items-center gap-4 p-4 bg-white rounded-lg">
    Content
  </div>
</template>
```

✅ **Good - Scoped when needed:**
```vue
<template>
  <Dialog :visible="visible">
    <template #header>Custom</template>
  </Dialog>
</template>

<style scoped>
:deep(.p-dialog-header) {
  background: linear-gradient(to right, var(--user-primary), var(--user-secondary));
}
</style>
```

❌ **Bad - Unnecessary scoped styles:**
```vue
<template>
  <div class="container">Content</div>
</template>

<style scoped>
.container {
  display: flex;
  padding: 1rem;
}
</style>
```

---

## Accessibility

### Semantic HTML

Use semantic elements for better accessibility and SEO:

```vue
<template>
  <header>
    <nav>
      <ul>
        <li><a href="#">Link</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <h1>Article Title</h1>
      <p>Content...</p>
    </article>
  </main>

  <footer>
    <p>&copy; 2025 Company Name</p>
  </footer>
</template>
```

### ARIA Attributes

Provide labels for assistive technologies:

```vue
<!-- Icon-only button -->
<Button
  icon="pi pi-trash"
  aria-label="Delete item"
  severity="danger"
/>

<!-- Decorative images -->
<img src="banner.jpg" alt="" role="presentation" />

<!-- Informative images -->
<img src="logo.jpg" alt="Company logo" />

<!-- Loading state -->
<div role="status" aria-live="polite">
  <ProgressSpinner v-if="loading" aria-label="Loading content" />
</div>

<!-- Dialog with proper labels -->
<Dialog
  :visible="visible"
  header="Confirm Delete"
  aria-labelledby="dialog-header"
  modal
>
  <template #header>
    <h2 id="dialog-header">Confirm Delete</h2>
  </template>
  <p>Are you sure you want to delete this item?</p>
</Dialog>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```vue
<!-- Buttons are keyboard accessible by default -->
<Button label="Click me" @click="handleClick" />

<!-- Use button element, not div -->
✅ <button @click="handleClick">Action</button>
❌ <div @click="handleClick">Action</div>

<!-- Links should have href -->
✅ <a href="#section">Jump to section</a>
❌ <a @click="scrollTo">Jump to section</a>

<!-- Custom focus styles -->
<button class="focus:outline-none focus:ring-2 focus:ring-blue-500">
  Custom focus
</button>
```

**Global focus style (app.css):**
```css
:focus-visible {
  outline: 2px solid var(--user-primary);
  outline-offset: 2px;
}
```

### Color Contrast

Ensure sufficient contrast for readability:

✅ **Good contrast:**
```vue
<!-- Dark text on light background -->
<div class="bg-white text-gray-900">High contrast content</div>

<!-- Light text on dark background -->
<div class="bg-gray-900 text-white">High contrast content</div>

<!-- Error text -->
<p class="text-red-600">Error: Field is required</p>
```

❌ **Poor contrast:**
```vue
<!-- Light gray on white - hard to read -->
<div class="bg-white text-gray-300">Low contrast content</div>
```

**Test with WCAG AA standards:**
- Normal text: 4.5:1 contrast ratio minimum
- Large text (18px+): 3:1 contrast ratio minimum
- Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Form Accessibility

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Associate labels with inputs -->
    <div>
      <label for="name">Name <span class="text-red-500">*</span></label>
      <InputText
        id="name"
        v-model="form.name"
        :class="{ 'p-invalid': errors.name }"
        :aria-invalid="!!errors.name"
        aria-describedby="name-error"
        required
      />
      <small
        v-if="errors.name"
        id="name-error"
        class="text-red-500"
        role="alert"
      >
        {{ errors.name }}
      </small>
    </div>

    <!-- Required field indicator -->
    <p class="text-sm text-gray-600 mb-4">
      <span class="text-red-500">*</span> Required fields
    </p>

    <Button type="submit" label="Submit" :disabled="isSubmitting" />
  </form>
</template>
```

---

## Common Patterns

### Status Badges

**Pattern:**
```vue
<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

interface Props {
  status: 'active' | 'inactive' | 'banned';
}

const props = defineProps<Props>();

const severity = computed(() => {
  switch (props.status) {
    case 'active': return 'success';
    case 'inactive': return 'secondary';
    case 'banned': return 'danger';
    default: return 'secondary';
  }
});
</script>

<template>
  <Tag :severity="severity" :value="status" />
</template>
```

**Alternative with Chip:**
```vue
<script setup lang="ts">
import { computed } from 'vue';
import Chip from 'primevue/chip';

const chipClass = computed(() => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    case 'banned': return 'bg-red-100 text-red-800';
  }
});
</script>

<template>
  <Chip :label="status" :class="chipClass" class="text-sm font-medium" />
</template>
```

### Loading States

```vue
<template>
  <!-- Skeleton loading -->
  <div v-if="loading" class="space-y-4">
    <Skeleton height="150px" />
    <Skeleton height="150px" />
    <Skeleton height="150px" />
  </div>

  <!-- Content when loaded -->
  <div v-else>
    <Card v-for="item in items" :key="item.id">
      {{ item.name }}
    </Card>
  </div>
</template>
```

**Loading spinner:**
```vue
<template>
  <div v-if="loading" class="flex justify-center items-center py-12">
    <ProgressSpinner />
  </div>
</template>
```

### Empty States

```vue
<template>
  <div v-if="items.length === 0" class="text-center py-12">
    <PhEmptyIcon :size="64" class="text-gray-400 mb-4" />
    <h3 class="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
    <p class="text-gray-600 mb-6">Get started by creating your first item</p>
    <Button
      label="Create First Item"
      icon="pi pi-plus"
      @click="showCreateDialog = true"
    />
  </div>
</template>
```

**Real example from LeagueList.vue:**
```vue
<DataView :value="leagues">
  <template #empty>
    <div class="text-center py-12">
      <i class="pi pi-inbox text-6xl text-gray-400 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-700 mb-2">No leagues yet</h3>
      <p class="text-gray-600 mb-6">Get started by creating your first racing league</p>
      <Button
        label="Create Your First League"
        icon="pi pi-plus"
        @click="openCreateDrawer"
      />
    </div>
  </template>
</DataView>
```

### Form Validation Styling

```vue
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <FormLabel text="Name" required />
      <InputText
        v-model="form.name"
        :class="{ 'p-invalid': errors.name }"
        placeholder="Enter name"
      />
      <FormError :error="errors.name" />
    </div>

    <div>
      <FormLabel text="Email" required />
      <InputText
        v-model="form.email"
        :class="{ 'p-invalid': errors.email }"
        type="email"
      />
      <FormError :error="errors.email" />
    </div>

    <Button label="Submit" type="submit" :loading="isSubmitting" />
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';

const form = ref({ name: '', email: '' });
const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);
</script>
```

### Card with Header Image

**Real example from LeagueCard.vue:**
```vue
<template>
  <Card class="transition-shadow duration-300 hover:shadow-lg border-blue-100 border">
    <template #header>
      <div class="relative">
        <!-- Header Image -->
        <img
          v-if="headerImage"
          :src="headerImage"
          alt="Header"
          class="w-full h-40 object-cover"
        />
        <div v-else class="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600"></div>

        <!-- Logo Overlay -->
        <img
          :src="logo"
          alt="Logo"
          class="absolute -bottom-8 left-4 w-16 h-16 rounded-lg border-4 border-white shadow-lg object-cover"
        />

        <!-- Badge -->
        <div class="absolute top-0 left-0 p-2">
          <Tag severity="success" value="Active" />
        </div>

        <!-- Actions -->
        <SpeedDial
          :model="actions"
          direction="down"
          style="position: absolute; right: 4px; top: 4px"
        />
      </div>
    </template>

    <template #title>
      <div class="py-2 pl-22 pr-4 border-b border-slate-200">
        <h3 class="text-xl font-bold">Card Title</h3>
      </div>
    </template>

    <template #content>
      <div class="p-4">
        Content goes here
      </div>
    </template>

    <template #footer>
      <div class="flex w-full p-2">
        <Button label="View" class="w-full" @click="handleView" />
      </div>
    </template>
  </Card>
</template>
```

### Modal/Dialog Pattern

```vue
<template>
  <Dialog
    v-model:visible="visible"
    header="Edit Item"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="w-full max-w-2xl"
  >
    <template #header>
      <h2 class="text-xl font-bold">Edit Item</h2>
    </template>

    <!-- Form content -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <FormLabel text="Name" required />
        <InputText v-model="form.name" class="w-full" />
      </div>
    </form>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" severity="secondary" @click="visible = false" />
        <Button label="Save" @click="handleSubmit" />
      </div>
    </template>
  </Dialog>
</template>
```

### Drawer Pattern

```vue
<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :modal="true"
    class="w-full md:w-[600px]"
  >
    <template #header>
      <h2 class="text-xl font-bold">Drawer Title</h2>
    </template>

    <!-- Drawer content with padding -->
    <div class="px-6 py-4">
      <form class="space-y-4">
        <!-- Form fields -->
      </form>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end px-6 py-4">
        <Button label="Cancel" severity="secondary" @click="visible = false" />
        <Button label="Save" @click="handleSave" />
      </div>
    </template>
  </Drawer>
</template>
```

---

## Best Practices

### 1. Mobile-First Design
Always design for mobile first, then add responsive classes for larger screens.

```vue
<!-- Mobile: stack vertically, Desktop: side by side -->
<div class="flex flex-col lg:flex-row gap-4">
  <div class="w-full lg:w-1/2">Left</div>
  <div class="w-full lg:w-1/2">Right</div>
</div>
```

### 2. Consistent Spacing
Use standardized spacing scale: 4, 8, 12, 16, 24, 32px (Tailwind: 1, 2, 3, 4, 6, 8).

```vue
<div class="space-y-4"><!-- 16px vertical spacing -->
  <div class="p-4"><!-- 16px padding -->
    <div class="mb-6"><!-- 24px margin bottom -->
      Content
    </div>
  </div>
</div>
```

### 3. Utility Classes First
Prefer Tailwind utilities over custom CSS. Use scoped styles only when necessary.

### 4. Semantic Colors
Use semantic classes for consistent color meaning:

```vue
<p class="text-red-600">Error message</p>
<p class="text-green-600">Success message</p>
<p class="text-yellow-600">Warning message</p>
<p class="text-blue-600">Info message</p>
```

### 5. Accessibility
- Use semantic HTML elements
- Provide ARIA labels for screen readers
- Ensure keyboard navigation works
- Test color contrast ratios
- Add focus states for interactive elements

### 6. PrimeVue Props First
Use component props before custom styles:

```vue
<!-- Use props when available -->
<Button severity="primary" size="large" variant="outlined" />

<!-- Not custom CSS -->
<Button class="custom-button" />
```

### 7. Consistent Patterns
Follow established patterns in the codebase:

- **Forms**: Use `FormLabel`, `FormError`, `FormHelper` components
- **Status badges**: Use `Chip` or `Tag` with computed severity
- **Empty states**: Centered icon + heading + description + CTA button
- **Loading states**: Use `Skeleton` or `ProgressSpinner`

### 8. Performance
- Avoid deep nesting of utility classes
- Use Tailwind's `@apply` sparingly (prefer utilities in template)
- Lazy load images with loading="lazy"
- Use `v-show` for frequently toggled elements, `v-if` for conditional rendering

### 9. Dark Mode Ready
Use CSS variables for colors to prepare for future dark mode support:

```vue
<div class="bg-primary"><!-- Uses CSS variable -->
  Content
</div>
```

### 10. Test Responsive
- Test all breakpoints (mobile, tablet, desktop)
- Use browser dev tools responsive mode
- Test on actual mobile devices when possible

---

## Troubleshooting

### Common Issues

#### 1. PrimeVue styles not applying

**Problem:** PrimeVue component styles not rendering correctly.

**Solutions:**
- Verify PrimeVue imported in `main app file` (`resources/app/js/app.ts`)
- Check theme preset configured:
  ```ts
  import PrimeVue from 'primevue/config';
  import Aura from '@primevue/themes/aura';

  app.use(PrimeVue, {
    theme: {
      preset: Aura
    }
  });
  ```
- Check for CSS specificity issues (use browser dev tools)
- Ensure `tailwindcss-primeui` plugin loaded in app.css

#### 2. Tailwind classes not working

**Problem:** Tailwind utility classes not applying styles.

**Solutions:**
- Ensure Tailwind CSS imported in `app.css`:
  ```css
  @import 'tailwindcss';
  ```
- Check class name spelling (Tailwind classes are case-sensitive)
- Verify Tailwind config if using custom classes
- Clear Vite cache: `rm -rf node_modules/.vite`
- Restart dev server: `npm run dev`

#### 3. Custom CSS variables not working

**Problem:** CSS variables not applying values.

**Solutions:**
- Check variable defined in `app.css` `:root` section
- Use correct syntax: `var(--variable-name)`
- Verify variable scope (`:root` for global, component scope for local)
- Check for typos in variable name
- Inspect in browser dev tools to see computed value

#### 4. Scoped styles not applying to PrimeVue components

**Problem:** Scoped styles not affecting PrimeVue component internals.

**Solution:** Use `:deep()` pseudo-class to penetrate component scope:

```vue
<style scoped>
/* Won't work - scoped styles don't penetrate */
.p-button {
  background-color: red;
}

/* Will work - :deep() penetrates component */
:deep(.p-button) {
  background-color: red;
}
</style>
```

#### 5. Layout issues on mobile

**Problem:** Layout breaks or looks wrong on mobile devices.

**Solutions:**
- Check responsive classes applied (`md:`, `lg:`)
- Test on actual mobile device (not just browser responsive mode)
- Use mobile-first approach (start with mobile layout, add desktop classes)
- Check for fixed widths that don't adapt (`w-[500px]` instead of `w-full lg:w-[500px]`)
- Verify viewport meta tag in HTML: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`

#### 6. Hover states not working on mobile

**Problem:** Hover effects triggering incorrectly on touch devices.

**Solution:** Use `@media (hover: hover)` for hover-specific styles:

```vue
<style scoped>
@media (hover: hover) {
  .card:hover {
    transform: scale(1.05);
  }
}
</style>
```

Or use Tailwind's `hover:` prefix (already optimized for touch devices):

```vue
<div class="hover:bg-gray-100 transition-colors">
  <!-- Hover handled correctly -->
</div>
```

#### 7. Focus styles not visible

**Problem:** Focus outlines not showing on keyboard navigation.

**Solution:** Ensure `:focus-visible` styles not removed:

```css
/* Global styles in app.css */
:focus-visible {
  outline: 2px solid var(--user-primary);
  outline-offset: 2px;
}
```

#### 8. Fonts not loading

**Problem:** Google Fonts not applying.

**Solutions:**
- Check Google Fonts import in `app.css`:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap');
  ```
- Verify font family in body styles:
  ```css
  body {
    font-family: 'Noto Sans', system-ui, -apple-system, sans-serif;
  }
  ```
- Check network tab in dev tools for font loading errors
- Ensure no adblockers blocking Google Fonts

---

## Quick Reference

### Spacing Scale
| Tailwind | Pixels | Usage |
|----------|--------|-------|
| `1` | 4px | Minimal spacing |
| `2` | 8px | Tight spacing |
| `3` | 12px | Small spacing |
| `4` | 16px | Default spacing |
| `6` | 24px | Medium spacing |
| `8` | 32px | Large spacing |
| `12` | 48px | XL spacing |

### Common Color Classes
| Purpose | Text | Background | Border |
|---------|------|------------|--------|
| Primary | `text-gray-900` | `bg-white` | `border-gray-200` |
| Secondary | `text-gray-600` | `bg-gray-50` | `border-gray-300` |
| Muted | `text-gray-500` | `bg-gray-100` | - |
| Error | `text-red-600` | `bg-red-100` | `border-red-200` |
| Success | `text-green-600` | `bg-green-100` | `border-green-200` |
| Warning | `text-yellow-600` | `bg-yellow-100` | `border-yellow-200` |
| Info | `text-blue-600` | `bg-blue-100` | `border-blue-200` |

### Typography Scale
| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 10px | Captions, fine print |
| `text-sm` | 12px | Labels, small text |
| `text-base` | 14px | Body text (default) |
| `text-lg` | 16px | Emphasized text |
| `text-xl` | 18px | Large text |
| `text-2xl` | 24px | Headings |
| `text-3xl` | 30px | Page titles |

### Component Props Quick Reference

**Button:**
```vue
<Button
  severity="primary | secondary | success | danger | warn | info"
  size="small | large"
  variant="outlined | text"
  rounded
  :disabled="false"
  :loading="false"
/>
```

**InputText:**
```vue
<InputText
  v-model="value"
  placeholder="..."
  :disabled="false"
  :invalid="false"
  size="small | large"
/>
```

**Chip/Tag:**
```vue
<Chip
  label="..."
  severity="success | secondary | danger | warn | info"
/>
```

**Dialog:**
```vue
<Dialog
  v-model:visible="visible"
  header="..."
  :modal="true"
  :closable="true"
  :draggable="false"
/>
```

---

## Additional Resources

- **[Tailwind CSS Documentation](https://tailwindcss.com/docs)** - Official Tailwind CSS docs
- **[PrimeVue Documentation](https://primevue.org/)** - Official PrimeVue docs
- **[PrimeVue Aura Theme](https://primevue.org/themes/)** - Theme customization
- **[Phosphor Icons](https://phosphoricons.com/)** - Icon library used in app
- **[WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)** - Accessibility standards
- **[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)** - Color contrast testing

**Internal Guides:**
- `.claude/guides/frontend/app/app-dashboard-development-guide.md` - App development guide
- `.claude/guides/primevue-usage.md` - PrimeVue usage examples

---

## Summary

The app frontend uses a **utility-first approach** with Tailwind CSS, complemented by PrimeVue components and custom CSS variables for consistency. Key principles:

1. **Mobile-first responsive design**
2. **Utility classes over custom CSS**
3. **Consistent spacing and typography**
4. **Semantic color usage**
5. **Accessibility built-in**
6. **PrimeVue props first, custom styles when necessary**
7. **CSS variables for themeable colors**

Follow these patterns and conventions to maintain a consistent, maintainable, and accessible user interface.
