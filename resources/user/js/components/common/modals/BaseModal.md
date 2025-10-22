# BaseModal Component

A highly configurable modal component for the user dashboard that wraps PrimeVue's Dialog component with additional features and TypeScript support.

## Features

- 📦 **Wraps PrimeVue Dialog** - Full access to all Dialog props and events
- 🎨 **Flexible Sizing** - Predefined sizes (sm, md, lg, xl, 2xl, 3xl, 4xl, full) or custom widths
- 🔌 **Template Slots** - Header, footer, and content customization
- ⚡ **Loading State** - Built-in loading overlay
- ♿ **Accessible** - Proper ARIA labels and keyboard navigation
- 🎯 **TypeScript** - Full type safety with comprehensive interfaces
- 🎭 **Position Control** - Center, top, bottom, left, right positioning
- 🔒 **Modal Behavior** - Configurable backdrop, dismissal, and scroll blocking

## Installation

The component is located at:

```
resources/user/js/components/common/modals/BaseModal.vue
```

Import it in your components:

```typescript
import BaseModal from '@user/components/common/modals/BaseModal.vue';
```

## Basic Usage

### Simple Modal

```vue
<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@user/components/common/modals/BaseModal.vue';
import Button from 'primevue/button';

const visible = ref(false);

const openModal = () => {
  visible.value = true;
};
</script>

<template>
  <Button label="Open Modal" @click="openModal" />

  <BaseModal v-model:visible="visible" header="Simple Modal">
    <p>This is a simple modal with default settings.</p>
  </BaseModal>
</template>
```

### Modal with Custom Footer

```vue
<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@user/components/common/modals/BaseModal.vue';
import Button from 'primevue/button';

const visible = ref(false);

const handleSave = () => {
  // Save logic
  visible.value = false;
};

const handleCancel = () => {
  visible.value = false;
};
</script>

<template>
  <BaseModal v-model:visible="visible" header="Confirm Action">
    <p>Are you sure you want to proceed?</p>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" @click="handleCancel" />
        <Button label="Confirm" @click="handleSave" />
      </div>
    </template>
  </BaseModal>
</template>
```

## Width Sizes

### Predefined Sizes

```vue
<template>
  <!-- Small (384px) -->
  <BaseModal v-model:visible="visible" width="sm" header="Small Modal">
    <p>Small modal content</p>
  </BaseModal>

  <!-- Medium (448px) -->
  <BaseModal v-model:visible="visible" width="md" header="Medium Modal">
    <p>Medium modal content</p>
  </BaseModal>

  <!-- Large (512px) - DEFAULT -->
  <BaseModal v-model:visible="visible" width="lg" header="Large Modal">
    <p>Large modal content</p>
  </BaseModal>

  <!-- Extra Large (576px) -->
  <BaseModal v-model:visible="visible" width="xl" header="XL Modal">
    <p>Extra large modal content</p>
  </BaseModal>

  <!-- 2XL (672px) -->
  <BaseModal v-model:visible="visible" width="2xl" header="2XL Modal">
    <p>2XL modal content</p>
  </BaseModal>

  <!-- 3XL (768px) -->
  <BaseModal v-model:visible="visible" width="3xl" header="3XL Modal">
    <p>3XL modal content</p>
  </BaseModal>

  <!-- 4XL (896px) -->
  <BaseModal v-model:visible="visible" width="4xl" header="4XL Modal">
    <p>4XL modal content</p>
  </BaseModal>

  <!-- Full Width -->
  <BaseModal v-model:visible="visible" width="full" header="Full Width Modal">
    <p>Full width modal content</p>
  </BaseModal>
</template>
```

### Custom Width

```vue
<template>
  <!-- Custom Tailwind class -->
  <BaseModal v-model:visible="visible" width="max-w-5xl" header="Custom Width">
    <p>Modal with custom width class</p>
  </BaseModal>

  <!-- Custom pixel value -->
  <BaseModal v-model:visible="visible" width="900px" header="Custom Pixels">
    <p>Modal with 900px width</p>
  </BaseModal>
</template>
```

## Position

```vue
<template>
  <!-- Center (default) -->
  <BaseModal v-model:visible="visible" position="center">
    <p>Centered modal</p>
  </BaseModal>

  <!-- Top -->
  <BaseModal v-model:visible="visible" position="top">
    <p>Top-aligned modal</p>
  </BaseModal>

  <!-- Bottom -->
  <BaseModal v-model:visible="visible" position="bottom">
    <p>Bottom-aligned modal</p>
  </BaseModal>

  <!-- Left -->
  <BaseModal v-model:visible="visible" position="left">
    <p>Left-aligned modal</p>
  </BaseModal>

  <!-- Right -->
  <BaseModal v-model:visible="visible" position="right">
    <p>Right-aligned modal</p>
  </BaseModal>
</template>
```

## Advanced Features

### Loading State

```vue
<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@user/components/common/modals/BaseModal.vue';
import Button from 'primevue/button';

const visible = ref(false);
const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  try {
    await someAsyncOperation();
    visible.value = false;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <BaseModal v-model:visible="visible" header="Processing" :loading="loading">
    <p>Modal content with loading state</p>

    <template #footer>
      <Button label="Submit" :disabled="loading" @click="handleSubmit" />
    </template>
  </BaseModal>
</template>
```

### Custom Header

```vue
<template>
  <BaseModal v-model:visible="visible">
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-info-circle text-blue-500" />
        <h3 class="text-xl font-bold">Custom Header with Icon</h3>
      </div>
    </template>

    <p>Modal with custom header content</p>
  </BaseModal>
</template>
```

### Draggable Modal

```vue
<template>
  <BaseModal v-model:visible="visible" header="Draggable Modal" :draggable="true">
    <p>You can drag this modal around the screen</p>
  </BaseModal>
</template>
```

### Maximizable Modal

```vue
<template>
  <BaseModal v-model:visible="visible" header="Maximizable Modal" :maximizable="true">
    <p>This modal can be maximized to full screen</p>
  </BaseModal>
</template>
```

### Non-Modal (Modeless)

```vue
<template>
  <!-- No backdrop, can interact with page behind -->
  <BaseModal v-model:visible="visible" header="Modeless Dialog" :modal="false">
    <p>You can still interact with the page behind this dialog</p>
  </BaseModal>
</template>
```

### Dismissable with Click Outside

```vue
<template>
  <BaseModal v-model:visible="visible" header="Click Outside to Close" :dismissable-mask="true">
    <p>Click the backdrop to close this modal</p>
  </BaseModal>
</template>
```

### Non-Closable Modal

```vue
<template>
  <BaseModal v-model:visible="visible" header="Important Notice" :closable="false">
    <p>This modal cannot be closed with the X button</p>

    <template #footer>
      <Button label="I Understand" @click="visible = false" />
    </template>
  </BaseModal>
</template>
```

## Event Handling

```vue
<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@user/components/common/modals/BaseModal.vue';

const visible = ref(false);

const handleShow = () => {
  console.log('Modal shown');
};

const handleHide = () => {
  console.log('Modal hidden');
};

const handleAfterHide = () => {
  console.log('Modal hide animation complete');
};

const handleMaximize = (event: Event) => {
  console.log('Modal maximized', event);
};

const handleUnmaximize = (event: Event) => {
  console.log('Modal unmaximized', event);
};
</script>

<template>
  <BaseModal
    v-model:visible="visible"
    header="Event Demo"
    :maximizable="true"
    @show="handleShow"
    @hide="handleHide"
    @after-hide="handleAfterHide"
    @maximize="handleMaximize"
    @unmaximize="handleUnmaximize"
  >
    <p>Check the console for event logs</p>
  </BaseModal>
</template>
```

## Styling

### Custom Classes

```vue
<template>
  <!-- Custom modal container class -->
  <BaseModal
    v-model:visible="visible"
    header="Styled Modal"
    class="shadow-2xl border-2 border-blue-500"
  >
    <p>Modal with custom styling</p>
  </BaseModal>

  <!-- Custom content class -->
  <BaseModal v-model:visible="visible" header="Custom Content" content-class="bg-gray-50 p-6">
    <p>Modal with styled content area</p>
  </BaseModal>
</template>
```

## Real-World Examples

### Confirmation Dialog

```vue
<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@user/components/common/modals/BaseModal.vue';
import Button from 'primevue/button';

const visible = ref(false);
const deleting = ref(false);

const confirmDelete = async () => {
  deleting.value = true;
  try {
    await deleteItem();
    visible.value = false;
  } catch (error) {
    console.error('Delete failed:', error);
  } finally {
    deleting.value = false;
  }
};
</script>

<template>
  <BaseModal v-model:visible="visible" header="Confirm Deletion" width="md" :loading="deleting">
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-3xl text-orange-500" />
        <div>
          <p class="font-semibold">Are you sure you want to delete this item?</p>
          <p class="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" :disabled="deleting" @click="visible = false" />
        <Button label="Delete" severity="danger" :loading="deleting" @click="confirmDelete" />
      </div>
    </template>
  </BaseModal>
</template>
```

### Form Modal

```vue
<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@user/components/common/modals/BaseModal.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import FormInputGroup from '@user/components/common/forms/FormInputGroup.vue';
import FormLabel from '@user/components/common/forms/FormLabel.vue';

const visible = ref(false);
const saving = ref(false);
const formData = ref({
  name: '',
  email: '',
});

const handleSubmit = async () => {
  saving.value = true;
  try {
    await saveData(formData.value);
    visible.value = false;
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <BaseModal v-model:visible="visible" header="Add User" width="2xl" :loading="saving">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <FormInputGroup>
        <FormLabel for="name" text="Name" />
        <InputText id="name" v-model="formData.name" class="w-full" />
      </FormInputGroup>

      <FormInputGroup>
        <FormLabel for="email" text="Email" />
        <InputText id="email" v-model="formData.email" type="email" class="w-full" />
      </FormInputGroup>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" :disabled="saving" @click="visible = false" />
        <Button label="Save" :loading="saving" @click="handleSubmit" />
      </div>
    </template>
  </BaseModal>
</template>
```

## Props

| Prop              | Type                                                                          | Default     | Description                                            |
| ----------------- | ----------------------------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| `visible`         | `boolean`                                                                     | -           | **Required**. Controls modal visibility                |
| `header`          | `string`                                                                      | `undefined` | Modal header text (can be overridden with header slot) |
| `width`           | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' \| 'full' \| string` | `'lg'`      | Modal width preset or custom class                     |
| `position`        | `'center' \| 'top' \| 'bottom' \| 'left' \| 'right'`                          | `'center'`  | Modal position on screen                               |
| `draggable`       | `boolean`                                                                     | `false`     | Whether modal is draggable                             |
| `closable`        | `boolean`                                                                     | `true`      | Whether to show close button                           |
| `modal`           | `boolean`                                                                     | `true`      | Whether to show backdrop overlay                       |
| `dismissableMask` | `boolean`                                                                     | `false`     | Whether clicking backdrop closes modal                 |
| `blockScroll`     | `boolean`                                                                     | `true`      | Whether to block page scroll when open                 |
| `maximizable`     | `boolean`                                                                     | `false`     | Whether to show maximize button                        |
| `showHeader`      | `boolean`                                                                     | `true`      | Whether to show header section                         |
| `loading`         | `boolean`                                                                     | `false`     | Whether to show loading overlay                        |
| `ariaLabel`       | `string`                                                                      | `undefined` | ARIA label for accessibility                           |
| `class`           | `string`                                                                      | `undefined` | Custom CSS class for modal container                   |
| `contentClass`    | `string`                                                                      | `undefined` | Custom CSS class for content area                      |
| `pt`              | `object`                                                                      | `undefined` | PrimeVue passthrough props                             |
| `unstyled`        | `boolean`                                                                     | `false`     | Remove default PrimeVue styling                        |

## Events

| Event            | Payload     | Description                             |
| ---------------- | ----------- | --------------------------------------- |
| `update:visible` | `boolean`   | Emitted when visibility should change   |
| `show`           | -           | Emitted when modal is shown             |
| `hide`           | -           | Emitted when modal is hidden            |
| `after-hide`     | -           | Emitted after hide transition completes |
| `maximize`       | `Event`     | Emitted when maximize button clicked    |
| `unmaximize`     | `Event`     | Emitted when unmaximize button clicked  |
| `dragstart`      | `DragEvent` | Emitted when drag starts                |
| `dragend`        | `DragEvent` | Emitted when drag ends                  |

## Slots

| Slot           | Props             | Description                                  |
| -------------- | ----------------- | -------------------------------------------- |
| `default`      | -                 | Main content area                            |
| `header`       | -                 | Custom header content (replaces header prop) |
| `footer`       | -                 | Footer content (typically for buttons)       |
| `container`    | Dialog slot props | Complete dialog container customization      |
| `closeicon`    | Dialog slot props | Custom close button icon                     |
| `maximizeicon` | Dialog slot props | Custom maximize button icon                  |

## TypeScript

The component is fully typed with TypeScript:

```typescript
import type { DialogProps } from 'primevue/dialog';

interface Props {
  visible: boolean;
  header?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full' | string;
  position?: DialogProps['position'];
  draggable?: boolean;
  closable?: boolean;
  modal?: boolean;
  dismissableMask?: boolean;
  blockScroll?: boolean;
  class?: string;
  contentClass?: string;
  maximizable?: boolean;
  showHeader?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  pt?: DialogProps['pt'];
  unstyled?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'show'): void;
  (e: 'hide'): void;
  (e: 'after-hide'): void;
  (e: 'maximize', value: Event): void;
  (e: 'unmaximize', value: Event): void;
  (e: 'dragstart', value: DragEvent): void;
  (e: 'dragend', value: DragEvent): void;
}
```

## Accessibility

- ✅ Proper ARIA labels via `ariaLabel` prop
- ✅ Keyboard navigation (ESC to close, when enabled)
- ✅ Focus management (traps focus within modal when open)
- ✅ Screen reader support via PrimeVue Dialog
- ✅ Semantic HTML structure

## Best Practices

1. **Always use `v-model:visible`** for two-way binding
2. **Provide meaningful headers** for context
3. **Use appropriate width** for content (don't make modals too wide or narrow)
4. **Include cancel/close actions** in footer for user control
5. **Show loading states** during async operations
6. **Use aria-label** for modals without visible headers
7. **Keep content focused** - one purpose per modal
8. **Avoid nesting modals** when possible

## Migration from Direct PrimeVue Dialog

**Before:**

```vue
<Dialog
  :visible="visible"
  header="My Modal"
  :modal="true"
  class="w-full max-w-2xl"
  @update:visible="$emit('update:visible', $event)"
>
  <p>Content</p>
  <template #footer>
    <Button label="Close" />
  </template>
</Dialog>
```

**After:**

```vue
<BaseModal v-model:visible="visible" header="My Modal" width="2xl">
  <p>Content</p>
  <template #footer>
    <Button label="Close" />
  </template>
</BaseModal>
```

## Testing

The component includes comprehensive unit tests. See `BaseModal.test.ts` for examples.

```bash
# Run tests
npm run test:user

# Run tests in watch mode
npm run test:user -- --watch

# Run with coverage
npm run test:coverage
```
