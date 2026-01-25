# VrlConfirmDialog Custom Component Implementation

## Overview

This document describes the implementation of a custom confirmation dialog system for the app dashboard, replacing PrimeVue's `ConfirmDialog` and `useConfirm` with a custom `VrlConfirmDialog` component and `useVrlConfirm` composable.

## Motivation

- **Consistent Styling**: Ensure confirmation dialogs match the app's design system
- **Custom Button Components**: Use the custom Button component instead of PrimeVue's default buttons
- **Better TypeScript Support**: Full type safety throughout the confirmation flow
- **Small Dialog Size**: Dialogs are appropriately sized (not full width)
- **Phosphor Icons**: Support for Phosphor icons instead of PrimeIcons
- **Customizable**: Flexible slots and props for various use cases

## Implementation

### 1. Components Created

#### `VrlConfirmDialog.vue`
Location: `/var/www/resources/app/js/components/common/dialogs/VrlConfirmDialog.vue`

A custom confirmation dialog component that wraps PrimeVue's Dialog with:
- Custom header with icon support (Phosphor icons)
- Configurable icon colors and background colors
- Custom button components with variants
- Slots for header, content, and footer customization
- Loading and disabled states
- Small, centered dialog (32rem width)

**Key Features:**
- Props for header, message, icon, button labels, variants
- Emits: `accept`, `reject`, `update:visible`, `hide`
- Uses custom Button component
- Supports slots for full customization
- TypeScript interfaces for props and emits

#### `useVrlConfirm` Composable
Location: `/var/www/resources/app/js/composables/useVrlConfirm.ts`

A composable for managing VRL confirmation dialogs with:
- Reactive state for dialog visibility and options
- Duplicate prevention
- Loading state management
- Async/await support for accept callbacks
- Error handling

**Key Features:**
- Returns: `isVisible`, `options`, `isLoading`, `showConfirmation`, `handleAccept`, `handleReject`, `close`
- Prevents duplicate dialogs
- Handles async operations with loading state
- Automatically closes dialog after accept/reject

### 2. Usage Pattern

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

function confirmDelete() {
  showConfirmation({
    header: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    icon: PhWarning,
    iconColor: 'var(--red)',
    iconBgColor: 'var(--red-dim)',
    acceptLabel: 'Delete',
    acceptVariant: 'danger',
    onAccept: async () => {
      await deleteItem();
      // Handle success/error here
    },
  });
}
</script>

<template>
  <!-- Component content -->

  <!-- Confirmation Dialog -->
  <VrlConfirmDialog
    v-model:visible="isVisible"
    v-bind="options"
    :loading="isLoading"
    @accept="handleAccept"
    @reject="handleReject"
  />
</template>
```

### 3. Components Updated

The following components have been updated to use the new VrlConfirmDialog:

1. **CompetitionFormDrawer.vue**
   - Delete competition confirmation

2. **CompetitionCard.vue**
   - Delete competition confirmation
   - Archive season confirmation
   - Unarchive season confirmation
   - Delete season confirmation

### 4. Tests

#### VrlConfirmDialog Component Tests
Location: `/var/www/resources/app/js/components/common/dialogs/__tests__/VrlConfirmDialog.test.ts`

Comprehensive test suite covering:
- Rendering (header, message, icons, buttons)
- Visibility state management
- Button actions (accept, reject)
- Button states (loading, disabled)
- Button variants
- Dialog options (modal, closable, dismissableMask)
- Slots (header, content, footer)
- Icon styling (colors, background colors)

**Test Results:** All 54 tests passing

#### useVrlConfirm Composable Tests
Location: `/var/www/resources/app/js/composables/__tests__/useVrlConfirm.test.ts`

Comprehensive test suite covering:
- Initial state
- showConfirmation functionality
- Duplicate prevention
- close functionality
- handleAccept with async support
- handleReject functionality
- Error handling
- Full workflow tests

**Test Results:** All 24 tests passing

### 5. File Structure

```
resources/app/js/
├── components/
│   └── common/
│       └── dialogs/
│           ├── VrlConfirmDialog.vue          # Custom dialog component
│           ├── index.ts                       # Barrel export
│           └── __tests__/
│               └── VrlConfirmDialog.test.ts  # Component tests
├── composables/
│   ├── useVrlConfirm.ts                      # Composable for dialog state
│   └── __tests__/
│       └── useVrlConfirm.test.ts             # Composable tests
└── components/
    └── competition/
        ├── CompetitionFormDrawer.vue         # Updated to use VrlConfirmDialog
        └── CompetitionCard.vue               # Updated to use VrlConfirmDialog
```

## Migration Guide

### Migrating from `useConfirmDialog` to `useVrlConfirm`

**Before:**
```vue
<script setup lang="ts">
import { useConfirmDialog } from '@app/composables/useConfirmDialog';

const { showConfirmation } = useConfirmDialog();

function confirmDelete() {
  showConfirmation({
    message: 'Are you sure?',
    header: 'Delete Item',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    onAccept: () => handleDelete(),
  });
}
</script>
```

**After:**
```vue
<script setup lang="ts">
import { useVrlConfirm } from '@app/composables/useVrlConfirm';
import { VrlConfirmDialog } from '@app/components/common/dialogs';
import { PhWarning } from '@phosphor-icons/vue';

const {
  isVisible: confirmVisible,
  options: confirmOptions,
  isLoading: confirmLoading,
  showConfirmation,
  handleAccept: handleConfirmAccept,
  handleReject: handleConfirmReject,
} = useVrlConfirm();

function confirmDelete() {
  showConfirmation({
    message: 'Are you sure?',
    header: 'Delete Item',
    icon: PhWarning,
    iconColor: 'var(--red)',
    iconBgColor: 'var(--red-dim)',
    acceptLabel: 'Delete',
    acceptVariant: 'danger',
    onAccept: async () => {
      await handleDelete();
    },
  });
}
</script>

<template>
  <!-- ... component content ... -->

  <!-- Add this at the end of the template -->
  <VrlConfirmDialog
    v-model:visible="confirmVisible"
    v-bind="confirmOptions"
    :loading="confirmLoading"
    @accept="handleConfirmAccept"
    @reject="handleConfirmReject"
  />
</template>
```

### Migrating from PrimeVue's `useConfirm`

**Before:**
```vue
<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();

function confirmDelete() {
  confirm.require({
    message: 'Are you sure?',
    header: 'Delete Item',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await handleDelete();
    },
  });
}
</script>
```

**After:** (Same as above)

### Key Changes

1. **Icons**: Replace `'pi pi-icon-name'` with Phosphor icon components (e.g., `PhWarning`, `PhTrash`, `PhArchive`)
2. **Icon Colors**: Add `iconColor` and `iconBgColor` props using CSS variables
3. **Button Labels**: Use `acceptLabel` and `rejectLabel` instead of relying on defaults
4. **Button Variants**: Use `acceptVariant` and `rejectVariant` (e.g., `'danger'`, `'success'`, `'warning'`)
5. **Callbacks**: Use `onAccept` instead of `accept` (with `async` support)
6. **Component**: Add `<VrlConfirmDialog>` to template with v-bind and event handlers

## Remaining Work

The following components still use the old PrimeVue confirmation system and should be migrated:

### Direct `useConfirm` Usage (10 files)
1. `/var/www/resources/app/js/components/round/RoundsPanel.vue`
2. `/var/www/resources/app/js/components/season/SeasonDriversTable.vue`
3. `/var/www/resources/app/js/views/LeagueDrivers.vue`
4. `/var/www/resources/app/js/components/season/teams/TeamsPanel.vue`
5. `/var/www/resources/app/js/components/season/divisions/DivisionsPanel.vue`
6. `/var/www/resources/app/js/components/driver/DriverManagementDrawer.vue`
7. `/var/www/resources/app/js/components/season/SeasonSettings.vue`
8. `/var/www/resources/app/js/components/league/LeagueCard.vue`
9. `/var/www/resources/app/js/components/result/ResultDivisionTabs.vue`

### Note About `ConfirmDialog` in AppLayout
- The `<ConfirmDialog />` component in `AppLayout.vue` should remain until all components are migrated
- Once all components use `VrlConfirmDialog`, the PrimeVue ConfirmDialog can be removed from AppLayout

## Benefits

1. **Consistency**: All confirmation dialogs now have a consistent look and feel
2. **Type Safety**: Full TypeScript support throughout
3. **Flexibility**: Easy to customize with props and slots
4. **Better UX**: Smaller, more appropriate dialog sizes
5. **Custom Buttons**: Uses the app's custom Button component with variants
6. **Icon System**: Uses Phosphor icons matching the rest of the app
7. **Loading States**: Built-in loading state management for async operations
8. **Testability**: Well-tested components and composables

## Color Conventions

The following CSS variables are commonly used for icon colors:

- **Danger/Delete**: `iconColor: 'var(--red)'`, `iconBgColor: 'var(--red-dim)'`
- **Warning/Archive**: `iconColor: 'var(--orange)'`, `iconBgColor: 'var(--orange-dim)'`
- **Success/Confirm**: `iconColor: 'var(--green)'`, `iconBgColor: 'var(--green-dim)'`
- **Info**: `iconColor: 'var(--cyan)'`, `iconBgColor: 'var(--cyan-dim)'`

## Common Phosphor Icons

- **Delete**: `PhTrash` or `PhWarning`
- **Archive**: `PhArchive`
- **Unarchive**: `PhInbox`
- **Warning**: `PhWarning`
- **Success**: `PhCheck`
- **Info**: `PhInfo`
