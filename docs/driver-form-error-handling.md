# Driver Form Error Handling - Implementation Guide

## Overview

This document describes the implementation of server-side error handling in the driver form that allows displaying errors that don't correspond to specific form fields.

## Problem Statement

When creating or editing a driver, the API can return errors that don't map to a specific form field. For example:
```json
{
  "success": false,
  "message": "Driver with platform ID 'Nik_Makozi' is already in league 1"
}
```

These errors needed a place to be displayed in the UI in a visually distinct way.

## Solution

The solution adds a general error display at the bottom of the `DriverEditSidebar` component that appears when a server error is set.

### Components Modified

#### 1. DriverEditSidebar.vue
**Location**: `/var/www/resources/app/js/components/driver/modals/partials/DriverEditSidebar.vue`

**Changes**:
- Added `generalError` prop (optional string)
- Added error display section at the bottom of the sidebar
- Error is displayed in a red alert box with warning icon
- Error only shows when `generalError` has a value

**Props**:
```typescript
interface Props {
  activeSection: SectionId;
  generalError?: string;
}
```

#### 2. DriverFormDialog.vue
**Location**: `/var/www/resources/app/js/components/driver/modals/DriverFormDialog.vue`

**Changes**:
- Added `generalError` ref to store server errors
- Added `setServerError(message: string)` method exposed via `defineExpose`
- Clear `generalError` in `validateForm()` and `resetForm()` methods
- Pass `generalError` to `DriverEditSidebar` component

**New Method**:
```typescript
const setServerError = (message: string): void => {
  generalError.value = message;
};
```

#### 3. DriverManagementDrawer.vue
**Location**: `/var/www/resources/app/js/components/driver/DriverManagementDrawer.vue`

**Changes**:
- Added `driverFormDialogRef` to hold reference to `DriverFormDialog`
- Updated error handling in `handleSaveDriver` to call `setServerError` on the form dialog
- Keeps existing toast notification for consistency

**Error Handling Pattern**:
```typescript
try {
  await driverStore.createNewDriver(props.leagueId, data);
  // ... show success toast
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Failed to save driver';

  // Display error in form sidebar
  if (driverFormDialogRef.value) {
    driverFormDialogRef.value.setServerError(errorMessage);
  }

  // Also show toast notification
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: errorMessage,
    life: 5000,
  });
}
```

## Usage

### Setting a Server Error

Parent components that use `DriverFormDialog` can set server errors by:

1. Adding a ref to the dialog:
```vue
<DriverFormDialog
  ref="driverFormDialogRef"
  v-model:visible="showDriverForm"
  :mode="formMode"
  :driver="selectedDriver"
  :league-id="leagueId"
  @save="handleSaveDriver"
/>
```

2. Calling `setServerError` in error handlers:
```typescript
const driverFormDialogRef = ref<InstanceType<typeof DriverFormDialog> | null>(null);

async function handleSave(data) {
  try {
    await saveDriver(data);
  } catch (error) {
    if (driverFormDialogRef.value) {
      driverFormDialogRef.value.setServerError(error.message);
    }
  }
}
```

### Error Clearing

Errors are automatically cleared when:
- Form validation runs (when user clicks save)
- Form is reset
- Modal is closed

## Testing

### Test Files Created/Updated

1. **DriverEditSidebar.test.ts** (NEW)
   - Tests for section navigation
   - Tests for error display behavior
   - Tests for error removal/updates

2. **DriverFormDialog.test.ts** (UPDATED)
   - Tests for `setServerError` method
   - Tests for error propagation to sidebar
   - Tests for error clearing

### Running Tests

```bash
# Run sidebar tests
npx vitest run resources/app/js/components/driver/modals/partials/DriverEditSidebar.test.ts

# Run form dialog tests
npx vitest run resources/app/js/components/driver/DriverFormDialog.test.ts

# Run all driver component tests
npm run test:app -- driver
```

## Visual Design

The error is displayed at the bottom of the sidebar with:
- Red background (`var(--red-dim)`)
- Red border (`var(--red)`)
- Warning icon (PhWarning from Phosphor Icons)
- Red text color
- Word wrapping for long messages
- Top border separator from navigation sections

## Example Error Messages

- "Driver with platform ID 'Nik_Makozi' is already in league 1"
- "Failed to create driver: Database connection error"
- "Invalid driver data: Missing required platform ID"

## Future Enhancements

Possible improvements for the future:
1. Support for multiple error messages
2. Dismissible errors (close button)
3. Different error severity levels (warning, error, info)
4. Auto-dismiss after a timeout
5. Error animation/transitions
