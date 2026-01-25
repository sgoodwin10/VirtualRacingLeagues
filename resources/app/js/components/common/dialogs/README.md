# VrlConfirmDialog Component

A custom confirmation dialog component for the VRL app dashboard.

## Quick Start

```vue
<script setup lang="ts">
import { useVrlConfirm } from '@app/composables/useVrlConfirm';
import { VrlConfirmDialog } from '@app/components/common/dialogs';
import { PhWarning } from '@phosphor-icons/vue';

const {
  isVisible,
  options,
  isLoading,
  showConfirmation,
  handleAccept,
  handleReject,
} = useVrlConfirm();

function handleDelete() {
  showConfirmation({
    header: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    icon: PhWarning,
    iconColor: 'var(--red)',
    iconBgColor: 'var(--red-dim)',
    acceptLabel: 'Delete',
    acceptVariant: 'danger',
    onAccept: async () => {
      // Your async operation
      await deleteItem();
    },
  });
}
</script>

<template>
  <div>
    <!-- Your component content -->
    <Button @click="handleDelete">Delete</Button>

    <!-- Confirmation Dialog -->
    <VrlConfirmDialog
      v-model:visible="isVisible"
      v-bind="options"
      :loading="isLoading"
      @accept="handleAccept"
      @reject="handleReject"
    />
  </div>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | - | Controls dialog visibility (use with v-model) |
| `header` | `string` | `'Confirm'` | Dialog header text |
| `message` | `string` | - | Main message content |
| `icon` | `Component` | - | Phosphor icon component |
| `iconColor` | `string` | `'var(--orange)'` | Icon color (CSS value) |
| `iconBgColor` | `string` | `'var(--orange-dim)'` | Icon background color |
| `acceptLabel` | `string` | `'Confirm'` | Confirm button label |
| `rejectLabel` | `string` | `'Cancel'` | Cancel button label |
| `acceptVariant` | `ButtonVariant` | `'danger'` | Confirm button variant |
| `rejectVariant` | `ButtonVariant` | `'secondary'` | Cancel button variant |
| `loading` | `boolean` | `false` | Loading state |
| `disabled` | `boolean` | `false` | Disabled state |
| `modal` | `boolean` | `true` | Show as modal with backdrop |
| `closable` | `boolean` | `true` | Show close button |
| `dismissableMask` | `boolean` | `false` | Click outside to close |

## Emits

- `update:visible` - Emitted when visibility changes
- `accept` - Emitted when confirm button is clicked
- `reject` - Emitted when cancel button is clicked
- `hide` - Emitted when dialog is hidden

## Slots

### Header Slot
```vue
<VrlConfirmDialog v-model:visible="visible" v-bind="options">
  <template #header>
    <div class="custom-header">
      <!-- Custom header content -->
    </div>
  </template>
</VrlConfirmDialog>
```

### Default Slot (Content)
```vue
<VrlConfirmDialog v-model:visible="visible" v-bind="options">
  <template #default>
    <div class="custom-content">
      <!-- Custom content -->
    </div>
  </template>
</VrlConfirmDialog>
```

### Footer Slot
```vue
<VrlConfirmDialog v-model:visible="visible" v-bind="options">
  <template #footer>
    <div class="custom-footer">
      <!-- Custom buttons or actions -->
    </div>
  </template>
</VrlConfirmDialog>
```

## Examples

### Delete Confirmation
```typescript
showConfirmation({
  header: 'Delete Competition',
  message: 'Are you sure you want to permanently delete this competition?',
  icon: PhWarning,
  iconColor: 'var(--red)',
  iconBgColor: 'var(--red-dim)',
  acceptLabel: 'Delete',
  acceptVariant: 'danger',
  onAccept: async () => {
    await deleteCompetition();
    toast.add({ severity: 'success', summary: 'Deleted' });
  },
});
```

### Archive Confirmation
```typescript
showConfirmation({
  header: 'Archive Season',
  message: 'Are you sure you want to archive this season?',
  icon: PhArchive,
  iconColor: 'var(--orange)',
  iconBgColor: 'var(--orange-dim)',
  acceptLabel: 'Archive',
  acceptVariant: 'warning',
  onAccept: async () => {
    await archiveSeason();
  },
});
```

### Success Confirmation
```typescript
showConfirmation({
  header: 'Complete Season',
  message: 'Mark this season as completed?',
  icon: PhCheck,
  iconColor: 'var(--green)',
  iconBgColor: 'var(--green-dim)',
  acceptLabel: 'Complete',
  acceptVariant: 'success',
  onAccept: async () => {
    await completeSeason();
  },
});
```

## Color Conventions

| Action | iconColor | iconBgColor | Icon |
|--------|-----------|-------------|------|
| Delete | `var(--red)` | `var(--red-dim)` | `PhWarning`, `PhTrash` |
| Warning | `var(--orange)` | `var(--orange-dim)` | `PhWarning` |
| Archive | `var(--orange)` | `var(--orange-dim)` | `PhArchive` |
| Unarchive | `var(--green)` | `var(--green-dim)` | `PhInbox` |
| Success | `var(--green)` | `var(--green-dim)` | `PhCheck` |
| Info | `var(--cyan)` | `var(--cyan-dim)` | `PhInfo` |

## Button Variants

- `primary` - Blue primary button
- `secondary` - Gray secondary button (default for reject)
- `danger` - Red danger button (default for accept)
- `success` - Green success button
- `warning` - Orange warning button
- `outline` - Outlined button
- `ghost` - Text-only button

## Common Phosphor Icons

Import from `@phosphor-icons/vue`:

- `PhWarning` - Warning/danger
- `PhTrash` - Delete
- `PhArchive` - Archive
- `PhInbox` - Unarchive/restore
- `PhCheck` - Success/confirm
- `PhInfo` - Information
- `PhX` - Cancel/close

## Testing

The component and composable have comprehensive test coverage:

- **VrlConfirmDialog**: 54 tests covering rendering, interactions, states, and slots
- **useVrlConfirm**: 24 tests covering state management, async operations, and error handling

Run tests:
```bash
npm run test:app -- VrlConfirm
```

## See Also

- [Implementation Guide](/.claude/vrl-confirm-dialog-implementation.md)
- [useVrlConfirm Composable](/resources/app/js/composables/useVrlConfirm.ts)
