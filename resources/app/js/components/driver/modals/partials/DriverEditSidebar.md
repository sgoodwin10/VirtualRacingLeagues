# DriverEditSidebar Component

A sidebar navigation component for the driver form dialog that displays section navigation and general server errors.

## Props

### `activeSection` (required)
- **Type**: `SectionId` (`'basic' | 'additional'`)
- **Description**: The currently active section in the form

### `generalError` (optional)
- **Type**: `string`
- **Description**: A general error message to display at the bottom of the sidebar. Use this for server errors that don't map to specific form fields.

## Events

### `change-section`
Emitted when a user clicks on a section navigation button.

**Payload**: `SectionId` - The ID of the section to navigate to

## Usage

### Basic Usage
```vue
<DriverEditSidebar
  :active-section="activeSection"
  @change-section="handleSectionChange"
/>
```

### With General Error
```vue
<DriverEditSidebar
  :active-section="activeSection"
  :general-error="serverError"
  @change-section="handleSectionChange"
/>
```

## Error Display Behavior

- When `generalError` is not provided or is an empty string, no error is displayed
- When `generalError` has a value, a red alert box appears at the bottom of the sidebar below the navigation sections
- The error box includes a warning icon and the error message
- The error message text wraps and is styled with red color scheme

## Example: Handling Server Errors

```vue
<script setup lang="ts">
import { ref } from 'vue';
import DriverEditSidebar from './DriverEditSidebar.vue';

const activeSection = ref<'basic' | 'additional'>('basic');
const serverError = ref('');

async function saveDriver(data) {
  try {
    await api.createDriver(data);
    serverError.value = ''; // Clear error on success
  } catch (error) {
    // Set server error for display in sidebar
    serverError.value = error.message || 'Failed to save driver';
  }
}
</script>

<template>
  <DriverEditSidebar
    :active-section="activeSection"
    :general-error="serverError"
    @change-section="activeSection = $event"
  />
</template>
```

## Styling

The error container uses CSS custom properties from the application's design system:
- `--red`: Error text and border color
- `--red-dim`: Error background color
- `--border`: Top border separator color

The error box is positioned at the bottom of the sidebar with a top border to separate it from the navigation sections.
