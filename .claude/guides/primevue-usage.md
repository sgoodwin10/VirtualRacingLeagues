# PrimeVue Usage Guide

PrimeVue is configured for both User and Admin dashboards with the **Aura theme preset**.

## What's Installed

- **primevue** (v4.4.1) - UI component library with 90+ components
- **primeicons** (v7.0.0) - 250+ icons designed for PrimeVue

## Configuration

PrimeVue is configured in both dashboard entry points:
- `resources/user/js/app.ts`
- `resources/admin/js/app.ts`

### Current Configuration

```typescript
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false,
    },
  },
});
```

### Theme Options

- **Aura** - Modern, clean design (currently active)
- **Lara** - Previous default theme
- **Nora** - Alternative modern theme

To change themes, update the import in `app.ts`:
```typescript
import Lara from '@primevue/themes/lara';
// or
import Nora from '@primevue/themes/nora';
```

## Using PrimeVue Components

### Basic Example

```vue
<template>
  <div>
    <Button label="Click Me" icon="pi pi-check" @click="handleClick" />
    <InputText v-model="username" placeholder="Username" />
    <Dropdown
      v-model="selectedCity"
      :options="cities"
      optionLabel="name"
      placeholder="Select a City"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';

const username = ref('');
const selectedCity = ref();
const cities = ref([
  { name: 'New York', code: 'NY' },
  { name: 'Rome', code: 'RM' },
  { name: 'London', code: 'LDN' },
  { name: 'Paris', code: 'PRS' }
]);

const handleClick = () => {
  console.log('Button clicked!');
};
</script>
```

### PrimeIcons Usage

```vue
<template>
  <!-- Direct icon usage -->
  <i class="pi pi-check"></i>
  <i class="pi pi-times"></i>
  <i class="pi pi-search"></i>

  <!-- With PrimeVue components -->
  <Button icon="pi pi-check" label="Save" />
  <Button icon="pi pi-times" label="Cancel" />
</template>
```

## Popular Components

### Form Components
- **InputText** - Text input
- **InputNumber** - Number input with formatting
- **Textarea** - Multi-line text input
- **Dropdown** - Select dropdown
- **MultiSelect** - Multiple selection dropdown
- **Calendar** - Date picker
- **Checkbox** - Checkbox input
- **RadioButton** - Radio button
- **InputSwitch** - Toggle switch

### Data Display
- **DataTable** - Feature-rich table with sorting, filtering, pagination
- **DataView** - List/grid data display
- **Timeline** - Vertical/horizontal timeline
- **Tree** - Hierarchical tree structure
- **TreeTable** - Tree with table features

### Overlay
- **Dialog** - Modal dialog
- **Sidebar** - Slide-in panel
- **OverlayPanel** - Popup overlay
- **ConfirmDialog** - Confirmation dialog
- **Toast** - Notification messages

### Navigation
- **Menu** - Vertical menu
- **Menubar** - Horizontal menu bar
- **Breadcrumb** - Breadcrumb navigation
- **TabView** - Tabbed interface
- **Steps** - Step indicator
- **PanelMenu** - Collapsible menu

### Buttons
- **Button** - Standard button
- **SplitButton** - Button with dropdown menu
- **SpeedDial** - Floating action button

### Data Tables Example

```vue
<template>
  <DataTable :value="products" tableStyle="min-width: 50rem">
    <Column field="code" header="Code"></Column>
    <Column field="name" header="Name"></Column>
    <Column field="category" header="Category"></Column>
    <Column field="quantity" header="Quantity"></Column>
    <Column field="price" header="Price">
      <template #body="slotProps">
        {{ formatCurrency(slotProps.data.price) }}
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const products = ref([
  { code: 'P001', name: 'Product 1', category: 'Electronics', quantity: 10, price: 99.99 },
  { code: 'P002', name: 'Product 2', category: 'Clothing', quantity: 25, price: 49.99 },
]);

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};
</script>
```

### Dialog Example

```vue
<template>
  <Button label="Show Dialog" @click="visible = true" />

  <Dialog
    v-model:visible="visible"
    header="Confirm Action"
    :modal="true"
    :style="{ width: '450px' }"
  >
    <p>Are you sure you want to proceed?</p>
    <template #footer>
      <Button label="Cancel" icon="pi pi-times" @click="visible = false" text />
      <Button label="Confirm" icon="pi pi-check" @click="confirm" autofocus />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

const visible = ref(false);

const confirm = () => {
  console.log('Confirmed!');
  visible.value = false;
};
</script>
```

## TypeScript Support

PrimeVue has full TypeScript support. Import types when needed:

```typescript
import type { DataTableFilterMeta } from 'primevue/datatable';
import type { MenuItem } from 'primevue/menuitem';
```

## Styling with Tailwind CSS

PrimeVue components work alongside Tailwind CSS. You can:

1. Use PrimeVue's built-in Aura theme (current setup)
2. Apply Tailwind classes to PrimeVue components:

```vue
<Button class="mt-4 px-6" label="Custom Styled" />
```

3. Use unstyled mode for full Tailwind control (advanced):

```typescript
// In app.ts
app.use(PrimeVue, {
  unstyled: true,
  pt: myTailwindPreset // Pass-through attributes
});
```

## Resources

- **Official Documentation**: https://primevue.org/
- **Component Showcase**: https://primevue.org/showcase/
- **PrimeIcons**: https://primevue.org/icons/
- **Themes**: https://primevue.org/theming/
- **Templates**: https://primevue.org/templates/

## Examples in This Project

Both dashboards have PrimeVue configured and ready to use:

**User Dashboard** (`resources/user/`):
- Aura theme preset
- Light mode by default
- Configured in `resources/user/js/app.ts`

**Admin Dashboard** (`resources/admin/`):
- Aura theme preset
- Dark mode support
- Configured in `resources/admin/js/app.ts`

## Quick Start

1. Import the component you need:
```typescript
import Button from 'primevue/button';
```

2. Use it in your template:
```vue
<Button label="Click Me" @click="handleClick" />
```

3. That's it! PrimeVue is already configured globally.

## Common Patterns

### Form with Validation
```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col">
        <label for="username">Username</label>
        <InputText
          id="username"
          v-model="username"
          :invalid="!!errors.username"
          aria-describedby="username-help"
        />
        <small v-if="errors.username" class="text-red-600">{{ errors.username }}</small>
      </div>

      <Button type="submit" label="Submit" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const username = ref('');
const errors = ref<{ username?: string }>({});

const handleSubmit = () => {
  errors.value = {};
  if (!username.value) {
    errors.value.username = 'Username is required';
    return;
  }
  console.log('Submitted:', username.value);
};
</script>
```

### Toast Notifications
```vue
<template>
  <Toast />
  <Button label="Show Success" @click="showSuccess" />
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

const toast = useToast();

const showSuccess = () => {
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Message sent',
    life: 3000
  });
};
</script>
```

## Need Help?

- Check the [PrimeVue Documentation](https://primevue.org/)
- Browse component examples in the [Showcase](https://primevue.org/showcase/)
- Search [PrimeVue GitHub Discussions](https://github.com/primefaces/primevue/discussions)
