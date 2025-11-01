# Admin Dashboard Composables Guide

**Version:** 1.0
**Last Updated:** 2025-10-15

> **Related Guides:**
> - [Admin Dashboard Development Guide](./admin-dashboard-development-guide.md) - Main development workflow
> - [Components Guide](./admin-components-guide.md) - Component patterns and catalog

## Table of Contents

1. [Introduction](#introduction)
2. [Available Composables](#available-composables)
3. [Core Composables](#core-composables)
4. [Helper Composables](#helper-composables)
5. [Advanced Composables](#advanced-composables)
6. [Creating Custom Composables](#creating-custom-composables)
7. [Composable Patterns](#composable-patterns)
8. [Testing Composables](#testing-composables)
9. [Best Practices](#best-practices)
10. [Complete Examples](#complete-examples)

---

## Introduction

### What Are Composables?

Composables are **reusable functions** that leverage Vue's Composition API to encapsulate and share stateful logic across components. They are the Vue 3 equivalent of mixins or React hooks, but more flexible and type-safe.

**Key Benefits:**

- **Code Reusability:** Share logic across multiple components without duplication
- **Better Organization:** Keep components focused by extracting complex logic
- **Type Safety:** Full TypeScript support with proper type inference
- **Testability:** Composables can be tested independently of components
- **Flexibility:** Can use other composables, providing infinite composability

### When to Create a Composable

✅ **DO create a composable when:**

- Logic is used in 2+ components
- Logic involves reactive state management
- Logic is complex enough to warrant separate testing
- Logic has clear input/output boundaries
- Logic handles cross-cutting concerns (modals, errors, formatting)

❌ **DON'T create a composable when:**

- Logic is used in only one place (keep it in the component)
- Logic is purely presentational (use a computed property)
- Logic is just a simple utility function (create a util instead)
- Logic doesn't involve reactivity (use a regular function)

### Composition API Benefits

The admin dashboard uses the **Composition API exclusively** with `<script setup>`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useModal } from '@admin/composables/useModal';

// Composables are called at the top level
const { visible, openModal, closeModal } = useModal();

// Component logic follows
const handleClick = () => {
  openModal();
};
</script>
```

**Why Composition API?**

- Better TypeScript support and type inference
- More flexible code organization
- Easier to extract and reuse logic
- Better tree-shaking for smaller bundles
- More intuitive than Options API for complex logic

---

## Available Composables

The admin dashboard provides these composables:

| Composable | Purpose | Category |
|------------|---------|----------|
| `useModal` | Modal visibility and lifecycle management | Core |
| `useAsyncAction` | Async operations with loading states | Core |
| `useErrorToast` | Consistent error message display | Core |
| `useRequestCancellation` | AbortController management for API calls | Core |
| `useDateFormatter` | Date formatting utilities | Helper |
| `useNameHelpers` | Name parsing and display utilities | Helper |
| `useRoleHelpers` | Admin role level and display utilities | Helper |
| `useStatusHelpers` | Status badge and icon utilities | Helper |
| `useSiteConfig` | Site configuration management | Advanced |
| `useAdminUserModals` | Complete admin user modal orchestration | Advanced |

---

## Core Composables

### useModal

**Purpose:** Manage modal visibility state with lifecycle callbacks and unsaved changes confirmation.

**Location:** `/var/www/resources/admin/js/composables/useModal.ts`

#### API Reference

```typescript
interface UseModalOptions {
  onOpen?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
  confirmClose?: boolean;
  hasUnsavedChanges?: () => boolean;
  confirmMessage?: string;
}

interface UseModalReturn {
  visible: Ref<boolean>;
  openModal: () => Promise<void>;
  closeModal: (force?: boolean) => Promise<void>;
  toggleModal: () => Promise<void>;
}

function useModal(options?: UseModalOptions): UseModalReturn
```

#### Basic Usage

```vue
<script setup lang="ts">
import { useModal } from '@admin/composables/useModal';
import Dialog from 'primevue/dialog';

const { visible, openModal, closeModal } = useModal();
</script>

<template>
  <Button label="Open Modal" @click="openModal" />

  <Dialog
    v-model:visible="visible"
    header="My Dialog"
    @update:visible="(val) => !val && closeModal()"
  >
    <p>Modal content here</p>
    <template #footer>
      <Button label="Close" @click="closeModal" />
    </template>
  </Dialog>
</template>
```

#### With Lifecycle Callbacks

```typescript
const { visible, openModal, closeModal } = useModal({
  onOpen: async () => {
    console.log('Modal opened');
    // Load data when modal opens
    await loadUserData();
  },
  onClose: () => {
    console.log('Modal closed');
    // Reset form when modal closes
    resetForm();
  }
});
```

#### With Unsaved Changes Confirmation

```typescript
const formData = ref({ name: '', email: '' });
const originalData = ref({ name: '', email: '' });

const { visible, openModal, closeModal } = useModal({
  confirmClose: true,
  hasUnsavedChanges: () => {
    return JSON.stringify(formData.value) !== JSON.stringify(originalData.value);
  },
  confirmMessage: 'You have unsaved changes. Discard them?',
  onClose: () => {
    // Only called if user confirms or no unsaved changes
    formData.value = { name: '', email: '' };
  }
});

// Force close without confirmation (e.g., after successful save)
const handleSave = async () => {
  await saveData();
  closeModal(true); // Force close, skips confirmation
};
```

#### Multiple Related Modals

```typescript
const {
  view: { visible: viewVisible, openModal: openView, closeModal: closeView },
  edit: { visible: editVisible, openModal: openEdit, closeModal: closeEdit },
  delete: { visible: deleteVisible, openModal: openDelete, closeModal: closeDelete }
} = useModalGroup({
  view: {},
  edit: {
    onClose: () => resetEditForm()
  },
  delete: {
    onClose: () => selectedItem.value = null
  }
});
```

#### Common Pitfalls

❌ **Don't:** Manually set `visible.value` when using callbacks:

```typescript
// BAD - bypasses onClose callback
const handleCancel = () => {
  visible.value = false; // onClose won't be called!
};
```

✅ **Do:** Use the provided methods:

```typescript
// GOOD - calls onClose callback
const handleCancel = async () => {
  await closeModal();
};
```

---

### useAsyncAction

**Purpose:** Handle async operations with automatic loading state management, error handling, and callbacks.

**Location:** `/var/www/resources/admin/js/composables/useAsyncAction.ts`

#### API Reference

```typescript
interface AsyncActionOptions<T> {
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
  onFinally?: () => void | Promise<void>;
  logErrors?: boolean;
  errorMessage?: string;
  throwOnError?: boolean;
}

interface AsyncActionResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
}

interface UseAsyncActionReturn<T> {
  isLoading: Ref<boolean>;
  error: Ref<unknown | null>;
  data: Ref<T | null>;
  execute: (
    asyncFn: () => Promise<T>,
    options?: AsyncActionOptions<T>
  ) => Promise<AsyncActionResult<T>>;
  reset: () => void;
}

function useAsyncAction<T = unknown>(): UseAsyncActionReturn<T>
```

#### Basic Usage

```typescript
import { useAsyncAction } from '@admin/composables/useAsyncAction';
import type { User } from '@admin/types/user';

const { execute, isLoading, error, data } = useAsyncAction<User>();

const loadUser = async (userId: number) => {
  const result = await execute(
    () => userService.getUser(userId)
  );

  if (result.success) {
    console.log('User loaded:', result.data);
  } else {
    console.error('Failed to load user:', result.error);
  }
};
```

#### With Callbacks

```typescript
const { execute, isLoading } = useAsyncAction<User>();
const toast = useToast();

const createUser = async (formData: CreateUserData) => {
  await execute(
    () => userService.createUser(formData),
    {
      onSuccess: (user) => {
        toast.add({
          severity: 'success',
          detail: 'User created successfully'
        });
        router.push(`/users/${user.id}`);
      },
      onError: (error) => {
        showErrorToast(error, 'Failed to create user');
      },
      onFinally: () => {
        closeModal();
      }
    }
  );
};
```

#### Multiple Independent Actions

```typescript
// Each action has its own independent loading state
const {
  execute: executeCreate,
  isLoading: creating
} = useAsyncAction<User>();

const {
  execute: executeUpdate,
  isLoading: updating
} = useAsyncAction<User>();

const {
  execute: executeDelete,
  isLoading: deleting
} = useAsyncAction<void>();

// Use in template
<Button
  label="Create"
  :loading="creating"
  @click="handleCreate"
/>
<Button
  label="Update"
  :loading="updating"
  @click="handleUpdate"
/>
<Button
  label="Delete"
  :loading="deleting"
  @click="handleDelete"
/>
```

#### With Error Handling Options

```typescript
const { execute } = useAsyncAction<User>();

// Option 1: Handle errors via callback
await execute(
  () => userService.deleteUser(userId),
  {
    logErrors: true,
    errorMessage: 'Failed to delete user',
    onError: (error) => {
      // Custom error handling
      if (isAxiosError(error) && error.response?.status === 409) {
        showWarning('Cannot delete user with active sessions');
      }
    }
  }
);

// Option 2: Throw errors for try/catch handling
try {
  await execute(
    () => userService.deleteUser(userId),
    { throwOnError: true }
  );
} catch (error) {
  // Handle error in traditional try/catch
  handleError(error);
}
```

#### Reset State

```typescript
const { execute, data, error, reset } = useAsyncAction<User>();

// Load user
await execute(() => userService.getUser(userId));

// Later, reset all state
reset(); // data, error, isLoading all reset to initial values
```

#### Common Pitfalls

❌ **Don't:** Forget to use the result:

```typescript
// BAD - ignoring the result means you can't check success
execute(() => userService.createUser(data));
```

✅ **Do:** Check the result or use callbacks:

```typescript
// GOOD - check result
const result = await execute(() => userService.createUser(data));
if (result.success) {
  // Handle success
}

// OR use callbacks
await execute(
  () => userService.createUser(data),
  { onSuccess: handleSuccess }
);
```

---

### useErrorToast

**Purpose:** Display consistent error messages from API calls, validation errors, and exceptions using PrimeVue Toast.

**Location:** `/var/www/resources/admin/js/composables/useErrorToast.ts`

#### API Reference

```typescript
interface ErrorToastOptions {
  customMessage?: string;
  life?: number;
  showValidationErrors?: boolean;
}

interface UseErrorToastReturn {
  showErrorToast: (
    error: unknown,
    fallbackMessage?: string,
    options?: ErrorToastOptions
  ) => void;
  showSuccessToast: (
    message: string,
    summary?: string,
    life?: number
  ) => void;
  showWarningToast: (
    message: string,
    summary?: string,
    life?: number
  ) => void;
  showInfoToast: (
    message: string,
    summary?: string,
    life?: number
  ) => void;
  hasValidationErrors: (error: unknown) => boolean;
  extractValidationErrors: (error: unknown) => Record<string, string[]> | null;
}

function useErrorToast(): UseErrorToastReturn
```

#### Basic Usage

```typescript
import { useErrorToast } from '@admin/composables/useErrorToast';

const { showErrorToast } = useErrorToast();

try {
  await userService.createUser(data);
} catch (error) {
  // Automatically extracts message from Error, AxiosError, or string
  showErrorToast(error, 'Failed to create user');
}
```

#### Error Message Extraction

The composable intelligently extracts error messages:

```typescript
// 1. AxiosError with Laravel API response
const axiosError = {
  response: {
    data: {
      message: 'The email has already been taken.'
    }
  }
};
showErrorToast(axiosError); // Shows: "The email has already been taken."

// 2. Standard Error instance
const error = new Error('Network timeout');
showErrorToast(error); // Shows: "Network timeout"

// 3. String error
const stringError = 'Something went wrong';
showErrorToast(stringError); // Shows: "Something went wrong"

// 4. Unknown error type
const unknownError = { weird: 'object' };
showErrorToast(unknownError); // Shows: "An unexpected error occurred"
```

#### Validation Errors

```typescript
try {
  await userService.createUser(data);
} catch (error) {
  showErrorToast(error, 'Failed to create user', {
    showValidationErrors: true
  });
  // Shows summary toast + individual toasts for each field error
}
```

#### Custom Messages and Duration

```typescript
showErrorToast(error, 'Operation Failed', {
  customMessage: 'The server is currently unavailable. Please try again later.',
  life: 10000 // 10 seconds
});
```

#### Success/Warning/Info Toasts

```typescript
const {
  showSuccessToast,
  showWarningToast,
  showInfoToast
} = useErrorToast();

// Success
showSuccessToast('User created successfully');
showSuccessToast('Operation completed', 'Success', 5000);

// Warning
showWarningToast('This action cannot be undone');
showWarningToast('Low disk space', 'Warning', 6000);

// Info
showInfoToast('System maintenance scheduled for tonight');
showInfoToast('New features available', 'Info', 4000);
```

#### Check for Validation Errors

```typescript
const { hasValidationErrors, extractValidationErrors } = useErrorToast();

try {
  await userService.updateUser(userId, data);
} catch (error) {
  if (hasValidationErrors(error)) {
    const validationErrors = extractValidationErrors(error);
    // validationErrors: { email: ['Email is required'], ... }

    // Set errors on form fields
    setFormErrors(validationErrors);
  } else {
    showErrorToast(error, 'Failed to update user');
  }
}
```

#### Real-World Example

```typescript
// From UsersView.vue
const { showErrorToast, showSuccessToast } = useErrorToast();

const handleReactivate = async (user: User) => {
  try {
    await userStore.reactivateUser(user.id, getSignal());
    showSuccessToast('User reactivated successfully');
  } catch (error) {
    // Silently ignore cancelled requests
    if (isRequestCancelled(error)) {
      return;
    }

    showErrorToast(error, 'Failed to reactivate user');
  }
};
```

---

### useRequestCancellation

**Purpose:** Manage request cancellation with AbortController, including automatic cleanup on component unmount.

**Location:** `/var/www/resources/admin/js/composables/useRequestCancellation.ts`

#### API Reference

```typescript
interface UseRequestCancellationReturn {
  getSignal: () => AbortSignal;
  cancel: (reason?: string) => void;
  reset: () => void;
  isAborted: () => boolean;
}

function useRequestCancellation(): UseRequestCancellationReturn

interface UseMultipleRequestCancellationReturn {
  createSignal: (key: string) => AbortSignal;
  cancel: (key: string, reason?: string) => void;
  cancelAll: (reason?: string) => void;
  isAborted: (key: string) => boolean;
}

function useMultipleRequestCancellation(): UseMultipleRequestCancellationReturn
```

#### Basic Usage

```typescript
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';

const { getSignal, cancel } = useRequestCancellation();

const loadData = async () => {
  try {
    // Pass signal to service method
    const data = await userService.getAllUsers({}, getSignal());
    // Process data...
  } catch (error) {
    if (isRequestCancelled(error)) {
      // Request was cancelled, no need to show error
      return;
    }
    // Handle other errors...
  }
};

// Cancel when needed (e.g., user navigates away or starts new search)
const handleSearch = () => {
  cancel('Starting new search');
  loadData();
};

// Automatically cancelled on component unmount
```

#### Cancel and Reload Pattern

```typescript
const { getSignal, cancel: cancelRequests } = useRequestCancellation();

const loadUsers = async () => {
  try {
    // Cancel any pending requests before starting a new one
    cancelRequests('Loading new data');

    await userStore.fetchUsers(getSignal());
  } catch (error) {
    if (isRequestCancelled(error)) {
      return;
    }
    showErrorToast(error, 'Failed to load users');
  }
};

// Watch for filter changes
watch(statusFilter, () => {
  loadUsers(); // Automatically cancels previous request
});
```

#### Multiple Independent Requests

```typescript
const { createSignal, cancel, cancelAll } = useMultipleRequestCancellation();

const loadUsers = async () => {
  const signal = createSignal('users');
  try {
    const users = await userService.getAllUsers({}, signal);
    // Process users...
  } catch (error) {
    if (isRequestCancelled(error)) return;
    showErrorToast(error, 'Failed to load users');
  }
};

const loadAdmins = async () => {
  const signal = createSignal('admins');
  try {
    const admins = await adminService.getAllAdmins({}, signal);
    // Process admins...
  } catch (error) {
    if (isRequestCancelled(error)) return;
    showErrorToast(error, 'Failed to load admins');
  }
};

// Cancel specific request
cancel('users');

// Or cancel all requests
cancelAll('User navigated away');
```

#### Real-World Example

```typescript
// From UsersView.vue
const { getSignal, cancel: cancelRequests } = useRequestCancellation();

const loadUsers = async () => {
  try {
    cancelRequests('Loading new data');
    await userStore.fetchUsers(getSignal());
  } catch (error) {
    if (isRequestCancelled(error)) {
      return;
    }
    showErrorToast(error, 'Failed to load users');
  }
};

// Debounced search
const debouncedLoadUsers = useDebounceFn(() => {
  loadUsers();
}, 500);

watch(searchQuery, () => {
  debouncedLoadUsers(); // Previous request cancelled automatically
});
```

#### Common Pitfalls

❌ **Don't:** Forget to check for cancelled requests:

```typescript
// BAD - shows error toast even for cancelled requests
try {
  await userService.getUsers(getSignal());
} catch (error) {
  showErrorToast(error); // Will show error even for cancellation
}
```

✅ **Do:** Always check for cancellation:

```typescript
// GOOD - ignores cancelled requests
try {
  await userService.getUsers(getSignal());
} catch (error) {
  if (isRequestCancelled(error)) {
    return; // Silent return for cancellation
  }
  showErrorToast(error);
}
```

---

## Helper Composables

### useDateFormatter

**Purpose:** Consistent date formatting throughout the admin dashboard using date-fns.

**Location:** `/var/www/resources/admin/js/composables/useDateFormatter.ts`

#### API Reference

```typescript
interface UseDateFormatterReturn {
  formatDate: (
    dateString: string | null | undefined,
    formatString?: string
  ) => string;
  formatRelativeTime: (
    dateString: string | null | undefined
  ) => string;
}

function useDateFormatter(): UseDateFormatterReturn
```

#### Basic Usage

```typescript
import { useDateFormatter } from '@admin/composables/useDateFormatter';

const { formatDate, formatRelativeTime } = useDateFormatter();

// Default format: "4:43pm 3rd Aug 25"
const formatted = formatDate('2025-08-03T16:43:00Z');

// Custom format
const custom = formatDate('2025-08-03T16:43:00Z', 'PPpp');
// "Aug 3rd, 2025 at 4:43 PM"

// ISO format
const iso = formatDate('2025-08-03T16:43:00Z', 'yyyy-MM-dd');
// "2025-08-03"

// Relative time
const relative = formatRelativeTime('2025-08-03T16:43:00Z');
// "2 hours ago"
```

#### Null/Invalid Handling

```typescript
formatDate(null); // "Never"
formatDate(undefined); // "Never"
formatDate(''); // "Never"
formatDate('invalid-date'); // "Invalid date"
```

#### In Components

```vue
<script setup lang="ts">
import { useDateFormatter } from '@admin/composables/useDateFormatter';

const { formatDate } = useDateFormatter();

const user = ref<User>({
  id: 1,
  name: 'John Doe',
  created_at: '2025-08-03T16:43:00Z',
  updated_at: '2025-08-05T10:30:00Z'
});
</script>

<template>
  <div>
    <p>Created: {{ formatDate(user.created_at) }}</p>
    <p>Updated: {{ formatDate(user.updated_at, 'PPpp') }}</p>
  </div>
</template>
```

#### Common Format Strings

```typescript
// Time formats
formatDate(date, 'HH:mm:ss'); // "16:43:00"
formatDate(date, 'h:mm a'); // "4:43 PM"

// Date formats
formatDate(date, 'yyyy-MM-dd'); // "2025-08-03"
formatDate(date, 'dd/MM/yyyy'); // "03/08/2025"
formatDate(date, 'MMM do, yyyy'); // "Aug 3rd, 2025"

// Combined formats
formatDate(date, 'PPpp'); // "Aug 3rd, 2025 at 4:43 PM"
formatDate(date, 'yyyy-MM-dd HH:mm:ss'); // "2025-08-03 16:43:00"

// Default (custom format)
formatDate(date); // "4:43pm 3rd Aug 25"
```

---

### useNameHelpers

**Purpose:** Parse and format names from entities (User, Admin, etc.) with various name field structures.

**Location:** `/var/www/resources/admin/js/composables/useNameHelpers.ts`

#### API Reference

```typescript
interface NamedEntity {
  name?: string;
  first_name?: string;
  last_name?: string;
}

interface UseNameHelpersReturn {
  getFullName: (entity: NamedEntity) => string;
  getFirstName: (entity: NamedEntity) => string;
  getLastName: (entity: NamedEntity) => string;
  getUserInitials: (entity: NamedEntity) => string;
  getDisplayName: (entity: NamedEntity, email?: string) => string;
  hasCompleteName: (entity: NamedEntity) => boolean;
}

function useNameHelpers(): UseNameHelpersReturn
```

#### Basic Usage

```typescript
import { useNameHelpers } from '@admin/composables/useNameHelpers';

const {
  getFullName,
  getFirstName,
  getLastName,
  getUserInitials
} = useNameHelpers();

const user = { first_name: 'John', last_name: 'Doe' };

getFullName(user); // "John Doe"
getFirstName(user); // "John"
getLastName(user); // "Doe"
getUserInitials(user); // "JD"
```

#### Different Name Structures

```typescript
// Entity with separate first/last names
const user1 = { first_name: 'John', last_name: 'Doe' };
getFullName(user1); // "John Doe"

// Entity with combined name field
const user2 = { name: 'John Doe' };
getFullName(user2); // "John Doe"
getFirstName(user2); // "John"
getLastName(user2); // "Doe"

// Entity with only first name
const user3 = { first_name: 'John' };
getFullName(user3); // "John"

// Entity with only last name
const user4 = { last_name: 'Doe' };
getFullName(user4); // "Doe"

// Entity with no name
const user5 = {};
getFullName(user5); // "Unknown"
```

#### User Initials for Avatars

```typescript
const { getUserInitials } = useNameHelpers();

getUserInitials({ first_name: 'John', last_name: 'Doe' }); // "JD"
getUserInitials({ name: 'John Doe' }); // "JD"
getUserInitials({ first_name: 'John' }); // "J"
getUserInitials({ name: 'Madonna' }); // "M"
getUserInitials({}); // "U" (Unknown)

// Multi-word first name
getUserInitials({ name: 'Mary Jane Watson' }); // "MW"
```

#### Display Name with Fallback

```typescript
const { getDisplayName } = useNameHelpers();

const user1 = { first_name: 'John', last_name: 'Doe' };
getDisplayName(user1, 'john@example.com'); // "John Doe"

const user2 = {}; // No name
getDisplayName(user2, 'unknown@example.com'); // "unknown@example.com"
getDisplayName(user2); // "Unknown User"
```

#### Check for Complete Name

```typescript
const { hasCompleteName } = useNameHelpers();

hasCompleteName({ first_name: 'John', last_name: 'Doe' }); // true
hasCompleteName({ name: 'John Doe' }); // true
hasCompleteName({ first_name: 'John' }); // false
hasCompleteName({ name: 'Madonna' }); // false (no space)
```

#### Real-World Example

```vue
<script setup lang="ts">
import { useNameHelpers } from '@admin/composables/useNameHelpers';
import type { User } from '@admin/types/user';

const { getFullName, getUserInitials } = useNameHelpers();

defineProps<{
  user: User;
}>();
</script>

<template>
  <div class="user-card">
    <!-- Avatar with initials -->
    <div class="avatar">
      {{ getUserInitials(user) }}
    </div>

    <!-- Full name -->
    <h3>{{ getFullName(user) }}</h3>

    <!-- Email as subtitle -->
    <p class="text-sm text-gray-600">{{ user.email }}</p>
  </div>
</template>
```

---

### useRoleHelpers

**Purpose:** Handle admin role hierarchies, levels, labels, and badge styling.

**Location:** `/var/www/resources/admin/js/composables/useRoleHelpers.ts`

#### API Reference

```typescript
type AdminRole = 'super_admin' | 'admin' | 'moderator';

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 3,
  admin: 2,
  moderator: 1,
};

interface UseRoleHelpersReturn {
  getRoleLevel: (role: AdminRole | null) => number;
  hasRoleAccess: (currentRole: AdminRole | null, requiredRole: AdminRole) => boolean;
  getRoleLabel: (role: AdminRole) => string;
  getRoleBadgeVariant: (role: AdminRole) => 'danger' | 'warning' | 'info';
}

function useRoleHelpers(): UseRoleHelpersReturn
```

#### Basic Usage

```typescript
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const {
  getRoleLevel,
  hasRoleAccess,
  getRoleLabel,
  getRoleBadgeVariant
} = useRoleHelpers();

getRoleLevel('super_admin'); // 3
getRoleLevel('admin'); // 2
getRoleLevel('moderator'); // 1
getRoleLevel(null); // 0

getRoleLabel('super_admin'); // "Super Admin"
getRoleLabel('admin'); // "Admin"
getRoleLabel('moderator'); // "Moderator"

getRoleBadgeVariant('super_admin'); // "danger"
getRoleBadgeVariant('admin'); // "warning"
getRoleBadgeVariant('moderator'); // "info"
```

#### Role-Based Access Control

```typescript
const { hasRoleAccess } = useRoleHelpers();

// Check if admin has access to perform action
const currentRole = 'admin';
const canDeleteUsers = hasRoleAccess(currentRole, 'admin'); // true
const canManageAdmins = hasRoleAccess(currentRole, 'super_admin'); // false

// In template
const canEdit = computed(() => {
  return hasRoleAccess(adminStore.adminRole, 'admin');
});
```

#### Role Badge Display

```vue
<script setup lang="ts">
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';
import Badge from 'primevue/badge';

const { getRoleLabel, getRoleBadgeVariant } = useRoleHelpers();

defineProps<{
  role: AdminRole;
}>();
</script>

<template>
  <Badge
    :value="getRoleLabel(role)"
    :severity="getRoleBadgeVariant(role)"
  />
</template>
```

#### Permission Checks

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();

const canManageAdmins = computed(() => {
  return hasRoleAccess(adminStore.adminRole, 'super_admin');
});

const canEditUsers = computed(() => {
  return hasRoleAccess(adminStore.adminRole, 'admin');
});
</script>

<template>
  <div>
    <Button
      v-if="canManageAdmins"
      label="Manage Admins"
      @click="goToAdminUsers"
    />
    <Button
      v-if="canEditUsers"
      label="Edit User"
      @click="editUser"
    />
  </div>
</template>
```

#### Real-World Example

```typescript
// From router/index.ts - Route guard
router.beforeEach((to, from, next) => {
  const adminStore = useAdminStore();
  const { hasRoleAccess } = useRoleHelpers();

  const requiredRole = to.meta.requiredRole as AdminRole | undefined;

  if (requiredRole && !hasRoleAccess(adminStore.adminRole, requiredRole)) {
    // Redirect to unauthorized page
    next({ name: 'unauthorized' });
  } else {
    next();
  }
});
```

---

### useStatusHelpers

**Purpose:** Handle status labels, badge variants, icons, and status checks for both Admin and User entities.

**Location:** `/var/www/resources/admin/js/composables/useStatusHelpers.ts`

#### API Reference

```typescript
type Status = 'active' | 'inactive' | 'suspended';
type StatusBadgeVariant = 'success' | 'secondary' | 'danger';

interface UseStatusHelpersReturn {
  getStatusLabel: (status: Status) => string;
  getStatusVariant: (status: Status) => StatusBadgeVariant;
  getStatusIcon: (status: Status) => string;
  isActive: (status: Status) => boolean;
  isInactive: (status: Status) => boolean;
  isSuspended: (status: Status) => boolean;
}

function useStatusHelpers(): UseStatusHelpersReturn
```

#### Basic Usage

```typescript
import { useStatusHelpers } from '@admin/composables/useStatusHelpers';

const {
  getStatusLabel,
  getStatusVariant,
  getStatusIcon
} = useStatusHelpers();

getStatusLabel('active'); // "Active"
getStatusLabel('inactive'); // "Inactive"
getStatusLabel('suspended'); // "Suspended"

getStatusVariant('active'); // "success"
getStatusVariant('inactive'); // "secondary"
getStatusVariant('suspended'); // "danger"

getStatusIcon('active'); // "pi-circle-fill"
getStatusIcon('inactive'); // "pi-circle"
getStatusIcon('suspended'); // "pi-ban"
```

#### Status Badge Display

```vue
<script setup lang="ts">
import { useStatusHelpers } from '@admin/composables/useStatusHelpers';
import Badge from 'primevue/badge';
import type { User } from '@admin/types/user';

const { getStatusLabel, getStatusVariant } = useStatusHelpers();

defineProps<{
  user: User;
}>();
</script>

<template>
  <Badge
    :value="getStatusLabel(user.status)"
    :severity="getStatusVariant(user.status)"
  />
</template>
```

#### Status Checks

```typescript
const { isActive, isInactive, isSuspended } = useStatusHelpers();

const user = { status: 'active' };

isActive(user.status); // true
isInactive(user.status); // false
isSuspended(user.status); // false

// Conditional rendering
const canEdit = computed(() => {
  return isActive(user.value.status) || isInactive(user.value.status);
});

const showWarning = computed(() => {
  return isSuspended(user.value.status);
});
```

#### Status Icon Display

```vue
<script setup lang="ts">
import { useStatusHelpers } from '@admin/composables/useStatusHelpers';
import type { User } from '@admin/types/user';

const { getStatusIcon, getStatusLabel } = useStatusHelpers();

defineProps<{
  user: User;
}>();
</script>

<template>
  <div class="flex items-center gap-2">
    <i :class="['pi', getStatusIcon(user.status)]" />
    <span>{{ getStatusLabel(user.status) }}</span>
  </div>
</template>
```

#### Real-World Example

```vue
<!-- From UsersTable.vue -->
<script setup lang="ts">
import { useStatusHelpers } from '@admin/composables/useStatusHelpers';
import Badge from 'primevue/badge';

const { getStatusLabel, getStatusVariant } = useStatusHelpers();
</script>

<template>
  <DataTable :value="users">
    <Column field="status" header="Status">
      <template #body="{ data }">
        <Badge
          :value="getStatusLabel(data.status)"
          :severity="getStatusVariant(data.status)"
        />
      </template>
    </Column>
  </DataTable>
</template>
```

---

## Advanced Composables

### useSiteConfig

**Purpose:** Manage site configuration with reactive state, loading states, validation errors, and API integration.

**Location:** `/var/www/resources/admin/js/composables/useSiteConfig.ts`

#### API Reference

```typescript
interface ValidationErrors {
  [field: string]: string[];
}

interface UseSiteConfigReturn {
  // State
  config: Ref<SiteConfig | null>;
  loading: Ref<boolean>;
  saving: Ref<boolean>;
  error: Ref<string | null>;
  validationErrors: Ref<ValidationErrors>;

  // Methods
  fetchConfig: () => Promise<void>;
  updateConfig: (data: UpdateSiteConfigRequest) => Promise<boolean>;
  clearValidationErrors: () => void;
  getFieldError: (fieldName: string) => string | null;
  hasFieldError: (fieldName: string) => boolean;
}

function useSiteConfig(): UseSiteConfigReturn
```

#### Basic Usage

```typescript
import { useSiteConfig } from '@admin/composables/useSiteConfig';

const {
  config,
  loading,
  saving,
  error,
  validationErrors,
  fetchConfig,
  updateConfig,
  getFieldError,
  hasFieldError,
} = useSiteConfig();

// Fetch on mount
onMounted(async () => {
  await fetchConfig();
});

// Update config
const handleSave = async () => {
  const success = await updateConfig({
    app_name: 'My Application',
    app_url: 'https://example.com',
  });

  if (success) {
    showSuccessToast('Configuration updated successfully');
  }
};
```

#### With Form Validation

```vue
<script setup lang="ts">
import { useSiteConfig } from '@admin/composables/useSiteConfig';
import { useErrorToast } from '@admin/composables/useErrorToast';

const {
  config,
  loading,
  saving,
  updateConfig,
  getFieldError,
  hasFieldError,
} = useSiteConfig();

const { showSuccessToast } = useErrorToast();

const formData = ref({
  app_name: '',
  app_url: '',
});

const handleSave = async () => {
  const success = await updateConfig(formData.value);

  if (success) {
    showSuccessToast('Settings saved successfully');
  }
  // Validation errors are automatically set in validationErrors ref
};
</script>

<template>
  <form @submit.prevent="handleSave">
    <div class="field">
      <label for="app_name">Application Name</label>
      <InputText
        id="app_name"
        v-model="formData.app_name"
        :invalid="hasFieldError('app_name')"
      />
      <small v-if="hasFieldError('app_name')" class="p-error">
        {{ getFieldError('app_name') }}
      </small>
    </div>

    <div class="field">
      <label for="app_url">Application URL</label>
      <InputText
        id="app_url"
        v-model="formData.app_url"
        :invalid="hasFieldError('app_url')"
      />
      <small v-if="hasFieldError('app_url')" class="p-error">
        {{ getFieldError('app_url') }}
      </small>
    </div>

    <Button
      type="submit"
      label="Save Changes"
      :loading="saving"
    />
  </form>
</template>
```

#### Clear Validation Errors

```typescript
const { clearValidationErrors } = useSiteConfig();

// Clear when user starts editing
watch(formData, () => {
  clearValidationErrors();
}, { deep: true });
```

#### Real-World Example

```typescript
// From SiteConfigView.vue
const {
  config,
  loading,
  saving,
  error,
  fetchConfig,
  updateConfig,
  getFieldError,
  hasFieldError,
} = useSiteConfig();

const { showSuccessToast, showErrorToast } = useErrorToast();

const formData = ref<UpdateSiteConfigRequest>({
  app_name: '',
  app_url: '',
  admin_email: '',
  maintenance_mode: false,
});

onMounted(async () => {
  await fetchConfig();

  if (config.value) {
    formData.value = {
      app_name: config.value.app_name,
      app_url: config.value.app_url,
      admin_email: config.value.admin_email,
      maintenance_mode: config.value.maintenance_mode,
    };
  }
});

const handleSubmit = async () => {
  const success = await updateConfig(formData.value);

  if (success) {
    showSuccessToast('Configuration updated successfully');
  } else if (error.value) {
    showErrorToast(error.value, 'Failed to update configuration');
  }
};
```

---

### useAdminUserModals

**Purpose:** Orchestrate all admin user modal states and actions (create, view, edit, delete, reactivate) in a single composable.

**Location:** `/var/www/resources/admin/js/composables/useAdminUserModals.ts`

**This is an advanced example** showing how to compose multiple concerns into a single composable for complex features.

#### API Reference

```typescript
interface UseAdminUserModalsOptions {
  toast: ToastServiceMethods;
  onReload: () => Promise<void>;
  currentRoleLevel: Ref<number>;
  isEditingOwnProfile?: Ref<boolean>;
}

interface UseAdminUserModalsReturn {
  // Modal visibility states
  viewDialogVisible: Ref<boolean>;
  editDialogVisible: Ref<boolean>;
  createDialogVisible: Ref<boolean>;
  deleteDialogVisible: Ref<boolean>;

  // Selected admin user state
  selectedAdminUser: Ref<Admin | null>;

  // Modal refs
  createModalRef: Ref<ModalWithValidation | null>;

  // Loading states
  saving: Ref<boolean>;
  creating: Ref<boolean>;
  deleting: Ref<boolean>;

  // Modal handlers - opening
  openCreateDialog: () => void;
  openViewDialog: (user: Admin) => void;
  openEditDialog: (user: Admin, isOwnProfile?: boolean) => void;
  openDeleteDialog: (user: Admin) => void;
  openEditFromView: (user: Admin, isOwnProfile: boolean) => void;
  openDeleteFromView: () => void;

  // Modal handlers - closing
  handleEditCancel: () => void;
  handleCreateCancel: () => void;
  handleDeleteCancel: () => void;

  // Action handlers
  handleCreate: (formData: AdminUserUpdateData) => Promise<void>;
  handleSave: (formData: AdminUserUpdateData, adminToUpdate?: Admin | null) => Promise<Admin | undefined>;
  handleDelete: (user: Admin) => Promise<void>;
  handleReactivate: (user: Admin) => Promise<void>;
}

function useAdminUserModals(options: UseAdminUserModalsOptions): UseAdminUserModalsReturn
```

#### Basic Usage

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';
import { useAdminUserModals } from '@admin/composables/useAdminUserModals';

const toast = useToast();
const adminStore = useAdminStore();
const { getRoleLevel } = useRoleHelpers();

const currentRoleLevel = computed(() => getRoleLevel(adminStore.adminRole));

const {
  // Modal states
  viewDialogVisible,
  editDialogVisible,
  createDialogVisible,
  deleteDialogVisible,
  selectedAdminUser,
  createModalRef,

  // Loading states
  saving,
  creating,
  deleting,

  // Handlers
  openCreateDialog,
  openViewDialog,
  openEditDialog,
  openDeleteDialog,
  handleCreate,
  handleSave,
  handleDelete,
  handleReactivate,
  handleEditCancel,
  handleCreateCancel,
  handleDeleteCancel,
} = useAdminUserModals({
  toast,
  onReload: loadAdminUsers,
  currentRoleLevel,
});
</script>

<template>
  <div>
    <Button label="Add Admin User" @click="openCreateDialog" />

    <AdminUsersTable
      :admin-users="adminUsers"
      @view="openViewDialog"
      @edit="openEditDialog"
      @deactivate="openDeleteDialog"
      @reactivate="handleReactivate"
    />

    <ViewAdminUserModal
      v-model:visible="viewDialogVisible"
      :admin-user="selectedAdminUser"
      @edit="openEditFromView"
      @delete="openDeleteFromView"
    />

    <EditAdminUserModal
      v-model:visible="editDialogVisible"
      :admin-user="selectedAdminUser"
      :saving="saving"
      @save="handleSave"
      @cancel="handleEditCancel"
    />

    <CreateAdminUserModal
      ref="createModalRef"
      v-model:visible="createDialogVisible"
      :saving="creating"
      @save="handleCreate"
      @cancel="handleCreateCancel"
    />

    <DeleteAdminUserModal
      v-model:visible="deleteDialogVisible"
      :admin-user="selectedAdminUser"
      :deleting="deleting"
      @delete="handleDelete"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>
```

#### Features

**1. Automatic Modal State Management:**

```typescript
// No need to manually manage visibility
openCreateDialog(); // Sets createDialogVisible to true
handleCreateCancel(); // Sets createDialogVisible to false
```

**2. Automatic API Calls with Error Handling:**

```typescript
// Create handler includes:
// - API call
// - Loading state
// - Success toast
// - Error handling
// - Validation error display
// - Reload data
// - Close modal
await handleCreate(formData);
```

**3. Validation Error Integration:**

```typescript
// Validation errors are automatically passed to modal
const { createModalRef } = useAdminUserModals({...});

// Modal receives validation errors and displays them
// No manual error handling needed in view
```

**4. Modal Transitions:**

```typescript
// Open edit from view modal
openEditFromView(user, isOwnProfile);
// Closes view modal, opens edit modal, preserves selected user

// Open delete from view modal
openDeleteFromView();
// Closes view modal, opens delete modal, preserves selected user
```

#### Why This Pattern?

This composable demonstrates **composable composition** - it doesn't use other composables internally, but it provides the same benefits:

- **Single Source of Truth:** All admin user modal logic in one place
- **Reusability:** Can be used in any view that manages admin users
- **Testability:** All logic can be tested independently
- **Consistency:** Same behavior across different views
- **Maintainability:** Changes to modal logic only need to be made once

---

## Creating Custom Composables

### When to Create a Composable

Create a composable when you have:

1. **Reusable reactive logic** used across multiple components
2. **Complex state management** that clutters components
3. **Side effects** that need cleanup (timers, subscriptions, etc.)
4. **Integration with external libraries** (PrimeVue, axios, etc.)
5. **Cross-cutting concerns** (logging, analytics, error handling)

### Structure and Conventions

#### File Structure

```
resources/admin/js/composables/
├── __tests__/                    # Tests alongside composables
│   ├── useModal.spec.ts
│   └── useCustomFeature.spec.ts
├── useModal.ts                   # Modal management
├── useAsyncAction.ts             # Async operations
└── useCustomFeature.ts           # Your custom composable
```

#### Naming Conventions

✅ **DO:**

- Prefix with `use` (e.g., `useModal`, `useCustomFeature`)
- Use camelCase (e.g., `useAsyncAction`, not `use-async-action`)
- Name after the feature, not implementation (e.g., `useModal`, not `useVisibility`)
- Export types alongside composable (e.g., `UseModalOptions`, `UseModalReturn`)

❌ **DON'T:**

- Use generic names (e.g., `useUtils`, `useHelpers`)
- Use abbreviations (e.g., `useMod` instead of `useModal`)
- Mix concerns (e.g., `useModalAndToast` - split into two composables)

### Basic Template

```typescript
import { ref, type Ref } from 'vue';

/**
 * Options for configuring the composable
 */
export interface UseCustomFeatureOptions {
  /**
   * Option description
   * @default defaultValue
   */
  option?: string;
}

/**
 * Return type for useCustomFeature composable
 */
export interface UseCustomFeatureReturn {
  /**
   * Reactive state
   */
  state: Ref<string>;

  /**
   * Method description
   * @param param - Parameter description
   */
  doSomething: (param: string) => void;
}

/**
 * Composable for [feature description]
 *
 * [Detailed description of what this composable does]
 *
 * @example
 * ```typescript
 * const { state, doSomething } = useCustomFeature();
 *
 * doSomething('value');
 * console.log(state.value);
 * ```
 *
 * @param options - Configuration options
 * @returns Object with state and methods
 */
export function useCustomFeature(
  options: UseCustomFeatureOptions = {}
): UseCustomFeatureReturn {
  const { option = 'default' } = options;

  // State
  const state = ref<string>('');

  // Methods
  const doSomething = (param: string): void => {
    state.value = param;
  };

  return {
    state,
    doSomething,
  };
}
```

### TypeScript Patterns

#### Generic Composables

```typescript
export function useAsyncAction<T = unknown>(): UseAsyncActionReturn<T> {
  const data = ref<T | null>(null);

  const execute = async (fn: () => Promise<T>): Promise<AsyncActionResult<T>> => {
    const result = await fn();
    data.value = result;
    return { success: true, data: result };
  };

  return {
    data: data as Ref<T | null>,
    execute,
  };
}

// Usage with type inference
const { data, execute } = useAsyncAction<User>();
// data is typed as Ref<User | null>
```

#### Proper Ref Typing

```typescript
// ❌ Don't lose reactivity
const state = ref('hello');
return { state: state.value }; // Returns string, not Ref<string>

// ✅ Return the ref
const state = ref('hello');
return { state }; // Returns Ref<string>

// ✅ Explicitly type if needed
const state = ref<string | null>(null);
return { state: state as Ref<string | null> };
```

#### Options with Defaults

```typescript
interface UseModalOptions {
  confirmClose?: boolean;
  confirmMessage?: string;
}

export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const {
    confirmClose = false,
    confirmMessage = 'Are you sure?',
  } = options;

  // Use options...
}
```

### Testing Composables

#### Basic Test Template

```typescript
import { describe, it, expect, vi } from 'vitest';
import { useCustomFeature } from '../useCustomFeature';

describe('useCustomFeature', () => {
  describe('Basic functionality', () => {
    it('should initialize with default state', () => {
      const { state } = useCustomFeature();

      expect(state.value).toBe('');
    });

    it('should update state when method is called', () => {
      const { state, doSomething } = useCustomFeature();

      doSomething('new value');

      expect(state.value).toBe('new value');
    });
  });

  describe('With options', () => {
    it('should use provided options', () => {
      const { state } = useCustomFeature({
        option: 'custom',
      });

      // Test option behavior
    });
  });
});
```

#### Testing Lifecycle Hooks

```typescript
import { describe, it, expect, vi } from 'vitest';
import { onUnmounted } from 'vue';

describe('useRequestCancellation', () => {
  it('should cancel requests on unmount', () => {
    let unmountCallback: (() => void) | undefined;

    // Mock onUnmounted
    vi.mock('vue', async () => {
      const actual = await vi.importActual('vue');
      return {
        ...actual,
        onUnmounted: (cb: () => void) => {
          unmountCallback = cb;
        },
      };
    });

    const { getSignal, isAborted } = useRequestCancellation();

    expect(isAborted()).toBe(false);

    // Simulate unmount
    unmountCallback?.();

    expect(isAborted()).toBe(true);
  });
});
```

#### Testing with Mocks

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useErrorToast } from '../useErrorToast';

// Mock PrimeVue useToast
const mockAdd = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: mockAdd,
  }),
}));

describe('useErrorToast', () => {
  beforeEach(() => {
    mockAdd.mockClear();
  });

  it('should show error toast', () => {
    const { showErrorToast } = useErrorToast();

    showErrorToast(new Error('Test error'));

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'Test error',
      life: 5000,
    });
  });
});
```

### Documentation Requirements

Every composable should have:

1. **JSDoc comment** with description
2. **TypeScript interfaces** for options and return types
3. **Usage examples** in JSDoc
4. **Parameter descriptions** for all options
5. **Return value descriptions** for all returned properties

**Example:**

```typescript
/**
 * Composable for managing modal visibility state and lifecycle
 *
 * This composable provides a standardized way to handle modal state management,
 * including open/close callbacks and optional confirmation for unsaved changes.
 *
 * @example Basic usage
 * ```typescript
 * const { visible, openModal, closeModal } = useModal();
 * ```
 *
 * @example With callbacks
 * ```typescript
 * const { visible, openModal, closeModal } = useModal({
 *   onOpen: () => console.log('Modal opened'),
 *   onClose: () => console.log('Modal closed'),
 * });
 * ```
 *
 * @param options - Configuration options for modal behavior
 * @returns Object with modal state and control methods
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  // Implementation...
}
```

---

## Composable Patterns

### State Management in Composables

#### Local State

```typescript
export function useCounter() {
  const count = ref(0);

  const increment = () => {
    count.value++;
  };

  return { count, increment };
}

// Each component gets independent state
const counter1 = useCounter(); // count starts at 0
const counter2 = useCounter(); // count starts at 0 (independent)
```

#### Shared State (Singleton)

```typescript
// Declare state outside the function
const count = ref(0);

export function useSharedCounter() {
  const increment = () => {
    count.value++;
  };

  return { count, increment };
}

// All components share the same state
const counter1 = useSharedCounter(); // count is 0
counter1.increment(); // count is 1
const counter2 = useSharedCounter(); // count is still 1 (shared)
```

#### Computed State

```typescript
export function useFullName() {
  const firstName = ref('');
  const lastName = ref('');

  const fullName = computed(() => {
    return `${firstName.value} ${lastName.value}`.trim() || 'Unknown';
  });

  return {
    firstName,
    lastName,
    fullName,
  };
}
```

### Composables Using Other Composables

```typescript
export function useUserManagement() {
  // Use other composables
  const { execute, isLoading } = useAsyncAction<User>();
  const { showErrorToast, showSuccessToast } = useErrorToast();
  const { getSignal } = useRequestCancellation();

  const users = ref<User[]>([]);

  const loadUsers = async () => {
    const result = await execute(
      () => userService.getAllUsers({}, getSignal()),
      {
        onSuccess: (data) => {
          users.value = data;
          showSuccessToast('Users loaded successfully');
        },
        onError: (error) => {
          showErrorToast(error, 'Failed to load users');
        },
      }
    );

    return result;
  };

  return {
    users,
    isLoading,
    loadUsers,
  };
}
```

### Lifecycle Hooks in Composables

```typescript
import { onMounted, onUnmounted, watch } from 'vue';

export function useWebSocket(url: string) {
  const ws = ref<WebSocket | null>(null);
  const connected = ref(false);

  // Setup on mount
  onMounted(() => {
    ws.value = new WebSocket(url);

    ws.value.onopen = () => {
      connected.value = true;
    };

    ws.value.onclose = () => {
      connected.value = false;
    };
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
  });

  return {
    connected,
  };
}
```

### Provide/Inject in Composables

```typescript
import { provide, inject, type InjectionKey, type Ref } from 'vue';

// Define injection key
const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme');

// Provider composable
export function useThemeProvider() {
  const theme = ref<'light' | 'dark'>('light');

  provide(ThemeKey, theme);

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  };

  return {
    theme,
    toggleTheme,
  };
}

// Consumer composable
export function useTheme() {
  const theme = inject(ThemeKey);

  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return {
    theme,
  };
}

// Usage in parent component
const { theme, toggleTheme } = useThemeProvider();

// Usage in child component
const { theme } = useTheme(); // Receives theme from parent
```

### Error Handling in Composables

```typescript
export function useSafeAction<T>() {
  const error = ref<Error | null>(null);
  const isLoading = ref(false);

  const execute = async (fn: () => Promise<T>): Promise<T | null> => {
    error.value = null;
    isLoading.value = true;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Unknown error');
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    execute,
    error,
    isLoading,
  };
}
```

---

## Testing Composables

### Unit Testing Strategies

#### Test in Isolation

```typescript
import { describe, it, expect } from 'vitest';
import { useModal } from '../useModal';

describe('useModal', () => {
  it('should initialize with visible as false', () => {
    const { visible } = useModal();

    expect(visible.value).toBe(false);
  });

  it('should open modal', async () => {
    const { visible, openModal } = useModal();

    await openModal();

    expect(visible.value).toBe(true);
  });
});
```

#### Test with Options

```typescript
describe('useModal with options', () => {
  it('should call onOpen callback', async () => {
    const onOpen = vi.fn();
    const { openModal } = useModal({ onOpen });

    await openModal();

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
```

#### Test Reactivity

```typescript
import { nextTick } from 'vue';

describe('useCounter reactivity', () => {
  it('should update reactive state', async () => {
    const { count, increment } = useCounter();

    expect(count.value).toBe(0);

    increment();
    await nextTick(); // Wait for reactivity

    expect(count.value).toBe(1);
  });
});
```

### Mocking Dependencies

#### Mock External Services

```typescript
import { vi } from 'vitest';

// Mock the service module
vi.mock('@admin/services/userService', () => ({
  userService: {
    getAllUsers: vi.fn().mockResolvedValue([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]),
  },
}));

describe('useUserManagement', () => {
  it('should load users', async () => {
    const { users, loadUsers } = useUserManagement();

    await loadUsers();

    expect(users.value).toHaveLength(2);
  });
});
```

#### Mock Composables

```typescript
import { vi } from 'vitest';

// Mock nested composable
vi.mock('@admin/composables/useErrorToast', () => ({
  useErrorToast: () => ({
    showErrorToast: vi.fn(),
    showSuccessToast: vi.fn(),
  }),
}));

describe('useUserManagement', () => {
  it('should show success toast after loading', async () => {
    const { loadUsers } = useUserManagement();

    await loadUsers();

    // Test behavior without actual toast display
  });
});
```

### Testing Lifecycle Hooks

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('useRequestCancellation lifecycle', () => {
  it('should cancel on unmount', () => {
    // Track unmount callback
    let unmountCallback: (() => void) | undefined;

    // Mock onUnmounted
    const mockOnUnmounted = vi.fn((cb) => {
      unmountCallback = cb;
    });

    vi.mock('vue', () => ({
      onUnmounted: mockOnUnmounted,
    }));

    const { isAborted } = useRequestCancellation();

    expect(mockOnUnmounted).toHaveBeenCalled();
    expect(isAborted()).toBe(false);

    // Trigger unmount
    unmountCallback?.();

    expect(isAborted()).toBe(true);
  });
});
```

### Examples from Codebase

See these test files for complete examples:

- `/var/www/resources/admin/js/composables/__tests__/useModal.spec.ts`
- `/var/www/resources/admin/js/composables/__tests__/useErrorToast.spec.ts`
- `/var/www/resources/admin/js/composables/__tests__/useDateFormatter.spec.ts`
- `/var/www/resources/admin/js/composables/__tests__/useNameHelpers.spec.ts`

---

## Best Practices

### 1. Naming Conventions

✅ **DO:**

```typescript
// Use "use" prefix
export function useModal() { }
export function useAsyncAction() { }
export function useDateFormatter() { }

// Use descriptive names
export function useAdminUserModals() { } // Clear purpose
export function useRoleHelpers() { } // Clear purpose
```

❌ **DON'T:**

```typescript
// Missing "use" prefix
export function modal() { }

// Too generic
export function useUtils() { }

// Abbreviations
export function useMod() { }
```

### 2. Return Value Patterns

✅ **DO:** Return object with named properties:

```typescript
export function useModal() {
  return {
    visible,
    openModal,
    closeModal,
  };
}

// Usage: destructure what you need
const { visible, openModal } = useModal();
```

❌ **DON'T:** Return array (loses clarity):

```typescript
export function useModal() {
  return [visible, openModal, closeModal];
}

// Usage: unclear what each position means
const [v, open, close] = useModal();
```

### 3. Side Effects

✅ **DO:** Clean up side effects:

```typescript
export function useInterval(callback: () => void, delay: number) {
  let intervalId: number;

  onMounted(() => {
    intervalId = setInterval(callback, delay);
  });

  onUnmounted(() => {
    clearInterval(intervalId); // Clean up
  });
}
```

❌ **DON'T:** Leave side effects running:

```typescript
export function useInterval(callback: () => void, delay: number) {
  setInterval(callback, delay); // Never cleared!
}
```

### 4. Type Safety

✅ **DO:** Provide full TypeScript support:

```typescript
export interface UseModalOptions {
  onOpen?: () => void;
  confirmClose?: boolean;
}

export interface UseModalReturn {
  visible: Ref<boolean>;
  openModal: () => Promise<void>;
}

export function useModal(
  options: UseModalOptions = {}
): UseModalReturn {
  // Implementation
}
```

❌ **DON'T:** Use `any` or skip types:

```typescript
export function useModal(options: any): any {
  // No type safety
}
```

### 5. Documentation

✅ **DO:** Document thoroughly:

```typescript
/**
 * Composable for managing modal visibility state and lifecycle
 *
 * @example
 * ```typescript
 * const { visible, openModal } = useModal({
 *   onOpen: () => console.log('opened')
 * });
 * ```
 *
 * @param options - Configuration options
 * @returns Modal state and methods
 */
export function useModal(
  options: UseModalOptions = {}
): UseModalReturn {
  // ...
}
```

❌ **DON'T:** Skip documentation:

```typescript
// No docs
export function useModal(options = {}) {
  // ...
}
```

### 6. Single Responsibility

✅ **DO:** Focus on one concern:

```typescript
// useModal - handles ONLY modal state
export function useModal() { }

// useErrorToast - handles ONLY toast messages
export function useErrorToast() { }
```

❌ **DON'T:** Mix multiple concerns:

```typescript
// useModalWithToast - too many concerns
export function useModalWithToast() {
  // Modal logic
  // Toast logic
  // API calls
  // Form validation
  // ...too much!
}
```

### 7. Composability

✅ **DO:** Use other composables:

```typescript
export function useUserManagement() {
  const { execute, isLoading } = useAsyncAction();
  const { showErrorToast } = useErrorToast();
  const { getSignal } = useRequestCancellation();

  // Compose behavior from other composables
}
```

### 8. Default Values

✅ **DO:** Provide sensible defaults:

```typescript
export function useModal(options: UseModalOptions = {}) {
  const {
    confirmClose = false, // Default: no confirmation
    confirmMessage = 'Are you sure?', // Default message
  } = options;
}
```

### 9. Error Handling

✅ **DO:** Handle errors gracefully:

```typescript
export function useAsyncAction<T>() {
  const execute = async (fn: () => Promise<T>) => {
    try {
      const result = await fn();
      return { success: true, data: result };
    } catch (error) {
      // Log error
      logger.error('Action failed', error);
      // Return error state
      return { success: false, error };
    }
  };
}
```

### 10. Testing

✅ **DO:** Write comprehensive tests:

```typescript
describe('useModal', () => {
  describe('Basic functionality', () => {
    it('should initialize correctly', () => { });
    it('should open modal', () => { });
    it('should close modal', () => { });
  });

  describe('With callbacks', () => {
    it('should call onOpen', () => { });
    it('should call onClose', () => { });
  });

  describe('Edge cases', () => {
    it('should handle null values', () => { });
    it('should handle errors', () => { });
  });
});
```

---

## Complete Examples

### Example 1: useToggle

A simple composable for toggling boolean state:

```typescript
import { ref, type Ref } from 'vue';

/**
 * Options for useToggle composable
 */
export interface UseToggleOptions {
  /**
   * Initial state
   * @default false
   */
  initialValue?: boolean;

  /**
   * Callback when toggled on
   */
  onToggleOn?: () => void;

  /**
   * Callback when toggled off
   */
  onToggleOff?: () => void;
}

/**
 * Return type for useToggle composable
 */
export interface UseToggleReturn {
  /**
   * Current toggle state
   */
  value: Ref<boolean>;

  /**
   * Toggle the state
   */
  toggle: () => void;

  /**
   * Set to true
   */
  setTrue: () => void;

  /**
   * Set to false
   */
  setFalse: () => void;
}

/**
 * Composable for managing boolean toggle state with callbacks
 *
 * @example
 * ```typescript
 * const { value, toggle, setTrue, setFalse } = useToggle({
 *   initialValue: false,
 *   onToggleOn: () => console.log('Turned on'),
 *   onToggleOff: () => console.log('Turned off'),
 * });
 *
 * toggle(); // Flips value and calls appropriate callback
 * setTrue(); // Sets to true and calls onToggleOn
 * setFalse(); // Sets to false and calls onToggleOff
 * ```
 *
 * @param options - Configuration options
 * @returns Toggle state and methods
 */
export function useToggle(options: UseToggleOptions = {}): UseToggleReturn {
  const {
    initialValue = false,
    onToggleOn,
    onToggleOff,
  } = options;

  const value = ref(initialValue);

  const setTrue = (): void => {
    if (!value.value) {
      value.value = true;
      onToggleOn?.();
    }
  };

  const setFalse = (): void => {
    if (value.value) {
      value.value = false;
      onToggleOff?.();
    }
  };

  const toggle = (): void => {
    if (value.value) {
      setFalse();
    } else {
      setTrue();
    }
  };

  return {
    value,
    toggle,
    setTrue,
    setFalse,
  };
}

// Tests
import { describe, it, expect, vi } from 'vitest';

describe('useToggle', () => {
  it('should initialize with default value', () => {
    const { value } = useToggle();
    expect(value.value).toBe(false);
  });

  it('should initialize with provided value', () => {
    const { value } = useToggle({ initialValue: true });
    expect(value.value).toBe(true);
  });

  it('should toggle value', () => {
    const { value, toggle } = useToggle();

    expect(value.value).toBe(false);
    toggle();
    expect(value.value).toBe(true);
    toggle();
    expect(value.value).toBe(false);
  });

  it('should call callbacks', () => {
    const onToggleOn = vi.fn();
    const onToggleOff = vi.fn();

    const { toggle } = useToggle({
      onToggleOn,
      onToggleOff,
    });

    toggle(); // Turn on
    expect(onToggleOn).toHaveBeenCalledTimes(1);
    expect(onToggleOff).not.toHaveBeenCalled();

    toggle(); // Turn off
    expect(onToggleOn).toHaveBeenCalledTimes(1);
    expect(onToggleOff).toHaveBeenCalledTimes(1);
  });
});
```

### Example 2: useLocalStorage

A composable for syncing reactive state with localStorage:

```typescript
import { ref, watch, type Ref } from 'vue';

/**
 * Composable for syncing reactive state with localStorage
 *
 * @example
 * ```typescript
 * const { value, clear } = useLocalStorage<string>('theme', 'light');
 *
 * // Automatically synced with localStorage
 * value.value = 'dark'; // Saved to localStorage['theme']
 *
 * // Clear from localStorage
 * clear(); // Resets to default value
 * ```
 *
 * @param key - localStorage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Reactive value and clear method
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): {
  value: Ref<T>;
  clear: () => void;
} {
  // Try to load from localStorage
  const loadFromStorage = (): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const value = ref<T>(loadFromStorage()) as Ref<T>;

  // Watch for changes and sync to localStorage
  watch(
    value,
    (newValue) => {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Failed to save ${key} to localStorage:`, error);
      }
    },
    { deep: true }
  );

  const clear = (): void => {
    localStorage.removeItem(key);
    value.value = defaultValue;
  };

  return {
    value,
    clear,
  };
}

// Usage
const { value: theme, clear: clearTheme } = useLocalStorage<'light' | 'dark'>('theme', 'light');

// Change theme
theme.value = 'dark'; // Automatically saved to localStorage

// Reset to default
clearTheme(); // theme.value is now 'light'
```

### Example 3: useDebounce

A composable for debouncing reactive values:

```typescript
import { ref, watch, type Ref } from 'vue';

/**
 * Composable for debouncing reactive values
 *
 * @example
 * ```typescript
 * const searchQuery = ref('');
 * const { debouncedValue } = useDebounce(searchQuery, 500);
 *
 * // searchQuery updates immediately
 * // debouncedValue updates after 500ms of no changes
 * watch(debouncedValue, (newValue) => {
 *   performSearch(newValue);
 * });
 * ```
 *
 * @param source - Source ref to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(
  source: Ref<T>,
  delay: number
): {
  debouncedValue: Ref<T>;
} {
  const debouncedValue = ref<T>(source.value) as Ref<T>;
  let timeoutId: number | undefined;

  watch(source, (newValue) => {
    // Clear previous timeout
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  return {
    debouncedValue,
  };
}

// Usage in component
const searchQuery = ref('');
const { debouncedValue: debouncedSearchQuery } = useDebounce(searchQuery, 500);

// Watch debounced value for API calls
watch(debouncedSearchQuery, (newQuery) => {
  if (newQuery) {
    performSearch(newQuery);
  }
});
```

---

## Summary

### Key Takeaways

1. **Composables are functions** that use Composition API to share reactive logic
2. **Always prefix with "use"** and follow naming conventions
3. **Return objects** with named properties for clarity
4. **Provide TypeScript types** for all options and return values
5. **Document thoroughly** with JSDoc and examples
6. **Test independently** with comprehensive unit tests
7. **Clean up side effects** in `onUnmounted`
8. **Compose composables** to build complex functionality
9. **Keep focused** on single responsibility
10. **Handle errors gracefully** and provide fallbacks

### When to Use What

- **useModal**: Modal visibility and lifecycle
- **useAsyncAction**: Any async operation with loading states
- **useErrorToast**: Display error messages
- **useRequestCancellation**: API calls that should be cancellable
- **useDateFormatter**: Display dates consistently
- **useNameHelpers**: Parse and display names
- **useRoleHelpers**: Admin role checks and display
- **useStatusHelpers**: Status badges and checks
- **useSiteConfig**: Site configuration management
- **useAdminUserModals**: Complex modal orchestration (advanced)

### Next Steps

- Read the [Admin Dashboard Development Guide](./admin-dashboard-development-guide.md) for overall workflow
- Review [Components Guide](./admin-components-guide.md) for component patterns
- Explore existing composables in `/var/www/resources/admin/js/composables/`
- Write tests when creating custom composables
- Follow the established patterns for consistency

---

**Questions or issues?** Refer to the main [Admin Dashboard Development Guide](./admin-dashboard-development-guide.md) or review the source code of existing composables for examples.
