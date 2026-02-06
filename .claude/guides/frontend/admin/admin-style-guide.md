# Admin Dashboard Style Guide

Quick reference for styling patterns in `resources/admin/`.

## CSS Variables

```css
:root {
  /* Colors */
  --admin-primary: #3b82f6;      /* Blue-500 */
  --admin-secondary: #8b5cf6;    /* Purple-500 */
  --admin-accent: #ef4444;       /* Red-500 */

  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;       /* Gray-50 */
  --bg-tertiary: #f3f4f6;        /* Gray-100 */

  /* Borders */
  --border-light: #e5e7eb;       /* Gray-200 */
  --border-medium: #d1d5db;      /* Gray-300 */

  /* Text */
  --text-primary: #111827;       /* Gray-900 */
  --text-secondary: #6b7280;     /* Gray-500 */
  --text-muted: #9ca3af;         /* Gray-400 */

  /* Font sizes */
  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 24px;

  /* Layout */
  --sidebar-width: 16rem;
  --sidebar-collapsed-width: 5rem;
  --topbar-height: 4rem;
}
```

## Typography

- **Font**: Zalando Sans (fallback: system-ui)
- **Page titles**: `text-2xl font-bold text-gray-900`
- **Section headers**: `text-lg font-semibold text-gray-900`
- **Labels**: `text-sm font-medium text-gray-700`
- **Body text**: `text-gray-700`
- **Descriptions**: `text-gray-600`
- **Muted text**: `text-gray-400` or `text-gray-500`

## Color Patterns

### Status Colors (Badge component)
```typescript
success: 'bg-green-100 text-green-700'
info:    'bg-blue-100 text-blue-700'
warning: 'bg-yellow-100 text-yellow-700'
danger:  'bg-red-100 text-red-700'
secondary: 'bg-gray-100 text-gray-700'
purple:  'bg-purple-100 text-purple-700'
```

### Interactive States
```css
/* Hover */
hover:bg-gray-100  /* Light backgrounds */
hover:bg-gray-200  /* Buttons */

/* Active/Selected */
bg-blue-50 text-blue-700  /* Selected items */
bg-blue-100               /* Active states */
```

## Layout Patterns

### Page Structure
```vue
<div class="view-name">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Title</h1>
    <p class="text-gray-600">Description</p>
  </div>

  <!-- Content -->
  <Card class="mb-6">
    <template #content>
      <!-- Content here -->
    </template>
  </Card>
</div>
```

### Form Fields
```vue
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Label <span class="text-red-500">*</span>
  </label>
  <InputText class="w-full" />
  <small class="text-gray-500">Helper text</small>
  <small v-if="error" class="block text-red-600 mt-1">{{ error }}</small>
</div>
```

### Toggle Settings
```vue
<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
  <div class="flex-1">
    <label class="text-sm font-medium text-gray-900 cursor-pointer">Label</label>
    <p class="text-sm text-gray-600 mt-1">Description</p>
  </div>
  <ToggleSwitch v-model="value" />
</div>
```

## Spacing

- **Section gaps**: `space-y-6` or `mb-6`
- **Card padding**: PrimeVue default or `p-4`
- **Form field gaps**: `space-y-4`
- **Button gaps**: `gap-2`
- **Main content**: `p-4 min-h-screen bg-gray-50`

## Components

### Buttons
```vue
<!-- Primary actions -->
<Button label="Create" icon="pi pi-plus" severity="success" />
<Button label="Save" severity="primary" />

<!-- Table actions (icon-only) -->
<Button icon="pi pi-eye" text rounded severity="secondary" size="small" v-tooltip.top="'View'" />
<Button icon="pi pi-pencil" text rounded severity="info" size="small" v-tooltip.top="'Edit'" />
<Button icon="pi pi-trash" text rounded severity="danger" size="small" v-tooltip.top="'Delete'" />
```

### Cards
```vue
<!-- Standard card -->
<Card class="mb-6">
  <template #content>...</template>
</Card>

<!-- Card without padding (for tables) -->
<Card :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }">
  <template #content>
    <DataTable />
  </template>
</Card>
```

### Modals (BaseModal)
```vue
<BaseModal v-model:visible="visible" width="600px">
  <template #header>Title</template>
  <!-- Content -->
  <template #footer>
    <Button label="Cancel" severity="secondary" @click="close" />
    <Button label="Save" @click="save" />
  </template>
</BaseModal>
```

## Icons

- **Primary**: Phosphor Icons (`ph ph-*`)
- **Secondary**: PrimeIcons (`pi pi-*`)

```vue
<!-- Phosphor (navigation, features) -->
<PhClock :size="48" class="text-gray-400" />
<i class="ph ph-house"></i>

<!-- PrimeIcons (buttons, actions) -->
<Button icon="pi pi-plus" />
<Button icon="pi pi-trash" />
```

## DataTable Pattern

```vue
<DataTable
  :value="items"
  :loading="loading"
  :rows="15"
  :paginator="true"
  :rows-per-page-options="[15, 25, 50]"
  paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
  current-page-report-template="Showing {first} to {last} of {totalRecords} items"
  striped-rows
  responsive-layout="scroll"
>
  <template #empty>
    <EmptyState message="No items found" />
  </template>
  <template #loading>
    <LoadingState message="Loading..." />
  </template>
  <!-- Columns -->
</DataTable>
```

## Transitions

```css
/* Page transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Layout transitions */
transition-all duration-300
```

## Responsive

- **Breakpoints**: mobile (0), tablet (768px), desktop (1024px)
- **Mobile sidebar**: collapsed by default, overlay when open
- **Use VueUse**: `useBreakpoints` for responsive logic

```typescript
const breakpoints = useBreakpoints({ mobile: 0, tablet: 768, desktop: 1024 });
const isMobile = breakpoints.smaller('desktop');
```
