# BaseModalHeader Component

A reusable header component for modal dialogs that provides consistent styling with flexible customization options.

## Features

- Default professional styling (text-lg, font-semibold, text-gray-900)
- Support for both title prop and slot-based content
- Flexible class handling:
  - Merge additional classes with defaults
  - Completely override default classes
- Full TypeScript support

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | The title text to display in the header |
| `class` | `string` | `undefined` | Additional CSS classes to merge with defaults |
| `overrideClass` | `boolean` | `false` | When true, uses only the provided class instead of merging |

## Basic Usage

### Simple Title

```vue
<BaseModalHeader title="Add Driver" />
```

**Output:**
```html
<div class="text-lg font-semibold text-gray-900">Add Driver</div>
```

### Title with Additional Classes

Merges your classes with the defaults:

```vue
<BaseModalHeader title="Add Driver" class="text-xl" />
```

**Output:**
```html
<div class="text-lg font-semibold text-gray-900 text-xl">Add Driver</div>
```

### Title with Complete Override

When you need full control over styling:

```vue
<BaseModalHeader
  title="Add Driver"
  class="text-2xl font-bold text-blue-600"
  :override-class="true"
/>
```

**Output:**
```html
<div class="text-2xl font-bold text-blue-600">Add Driver</div>
```

### Using Slot for Custom Content

The default slot allows for complex header content:

```vue
<BaseModalHeader>
  <div class="flex items-center gap-2">
    <ph-user-plus :size="20" />
    <span>Add New Driver</span>
  </div>
</BaseModalHeader>
```

**Output:**
```html
<div class="text-lg font-semibold text-gray-900">
  <div class="flex items-center gap-2">
    <ph-user-plus :size="20"></ph-user-plus>
    <span>Add New Driver</span>
  </div>
</div>
```

## Complete Examples

### In DriverFormDialog

```vue
<template>
  <BaseModal :visible="visible" width="2xl" @update:visible="$emit('update:visible', $event)">
    <template #header>
      <BaseModalHeader :title="dialogTitle" />
    </template>

    <!-- Modal content -->
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseModal from '@user/components/common/modals/BaseModal.vue';
import BaseModalHeader from '@user/components/common/modals/BaseModalHeader.vue';

const dialogTitle = computed(() => {
  return mode.value === 'create' ? 'Add Driver' : 'Edit Driver';
});
</script>
```

### Custom Styled Header

```vue
<template>
  <BaseModal :visible="visible">
    <template #header>
      <BaseModalHeader
        title="Important Notice"
        class="text-red-600"
      />
    </template>

    <!-- Modal content -->
  </BaseModal>
</template>
```

### Complex Header with Icon

```vue
<template>
  <BaseModal :visible="visible">
    <template #header>
      <BaseModalHeader>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <ph-users :size="24" class="text-blue-600" />
            </div>
            <div>
              <div class="text-lg font-semibold">Manage Team</div>
              <div class="text-sm text-gray-500">5 members</div>
            </div>
          </div>
          <Button icon="pi pi-times" text rounded @click="closeModal" />
        </div>
      </BaseModalHeader>
    </template>

    <!-- Modal content -->
  </BaseModal>
</template>
```

## When to Use

### Use BaseModalHeader when:
- You need a consistent header style across modals
- You want to maintain design system standards
- You need flexibility to add icons or additional elements
- You want to avoid repeating header markup

### Use custom header when:
- The modal requires completely unique styling
- The header needs complex interactions
- You need absolute control over the HTML structure

## Design Decisions

### Default Classes
The component uses these default classes to match the design system:
- `text-lg` - Standard header text size
- `font-semibold` - Professional weight
- `text-gray-900` - High contrast for readability

### Class Merging vs Override
The component provides two modes:
1. **Merge mode** (default): Adds your classes to the defaults
   - Use when you want to enhance the base styles
   - Example: Adding `uppercase` or `tracking-wide`
2. **Override mode**: Replaces all default classes
   - Use when you need complete control
   - Example: Different color scheme for warning modals

### Slot Priority
When both `title` prop and slot content are provided, the slot takes precedence. This allows maximum flexibility while maintaining a simple API for common cases.

## Testing

The component has comprehensive test coverage including:
- ✅ Rendering with title prop
- ✅ Rendering with slot content
- ✅ Slot priority over title prop
- ✅ Default class application
- ✅ Class merging behavior
- ✅ Class override behavior
- ✅ TypeScript prop validation
- ✅ Edge cases (empty content, special characters)

Run tests:
```bash
npm run test:user -- BaseModalHeader.test.ts
```

## Accessibility

- Uses semantic HTML (`<div>` as header container)
- Maintains proper text contrast (text-gray-900 on white background)
- Supports custom ARIA attributes via slot content when needed
- Works with screen readers (text content is always accessible)

## Related Components

- `BaseModal` - The parent modal component
- `DrawerHeader` - Similar header component for drawer/sidebar panels
- `PageHeader` - Page-level header component
