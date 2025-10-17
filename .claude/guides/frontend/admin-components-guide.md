# Admin Dashboard Components Guide

**Last Updated:** 2025-10-15
**For:** Admin Dashboard (`/var/www/resources/admin/js/components/`)

This comprehensive guide covers the component architecture, patterns, and best practices for building components in the admin dashboard.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Component Types](#component-types)
3. [BaseModal Component](#basemodal-component)
4. [Common Components](#common-components)
5. [Feature Components](#feature-components)
6. [Component Communication](#component-communication)
7. [Component Lifecycle](#component-lifecycle)
8. [Component Testing](#component-testing)
9. [Common Patterns](#common-patterns)
10. [Best Practices](#best-practices)
11. [Complete Examples](#complete-examples)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

### Component Architecture Philosophy

The admin dashboard follows a **component-driven architecture** with clear separation of concerns:

- **Single Responsibility**: Each component does one thing well
- **Composition over Inheritance**: Build complex UIs from simple components
- **Props Down, Events Up**: Unidirectional data flow
- **Type Safety**: Full TypeScript support for all props and emits
- **Testability**: All components are unit-testable
- **Reusability**: Common patterns extracted into shared components

### File Structure

```
resources/admin/js/components/
├── App.vue                      # Root application component
├── layout/                      # Layout components
│   ├── AdminLayout.vue          # Main layout wrapper
│   ├── AppSidebar.vue           # Sidebar navigation
│   └── AppTopbar.vue            # Top navigation bar
├── modals/                      # Modal components
│   └── BaseModal.vue            # Base modal wrapper
├── common/                      # Shared/reusable components
│   ├── Badge.vue                # Status badge
│   ├── EmptyState.vue           # Empty state display
│   └── LoadingState.vue         # Loading state display
├── User/                        # User feature components
│   ├── UsersTable.vue           # User data table
│   └── modals/                  # User-specific modals
│       ├── CreateUserModal.vue
│       ├── EditUserModal.vue
│       └── ViewUserModal.vue
├── AdminUser/                   # Admin user feature components
│   ├── AdminUsersTable.vue
│   └── modals/
│       ├── CreateAdminUserModal.vue
│       ├── EditAdminUserModal.vue
│       ├── ViewAdminUserModal.vue
│       └── DeleteAdminUserModal.vue
├── ActivityLog/                 # Activity log components
│   ├── ActivityLogTable.vue
│   └── ActivityLogDetailModal.vue
└── SiteConfig/                  # Site configuration components
    ├── SiteConfigForm.vue
    ├── ApplicationSettings.vue
    ├── IdentitySettings.vue
    ├── EmailSettings.vue
    ├── TrackingSettings.vue
    └── FileUpload/
        ├── ImageUpload.vue
        └── FilePreview.vue
```

### Import Path Alias

**ALWAYS use `@admin/` for imports:**

```typescript
// ✅ CORRECT
import BaseModal from '@admin/components/modals/BaseModal.vue';
import { useUserStore } from '@admin/stores/userStore';
import type { User } from '@admin/types/user';

// ❌ WRONG
import BaseModal from '../../../components/modals/BaseModal.vue';
import { useUserStore } from '../../stores/userStore';
```

---

## Component Types

### 1. View Components (Pages)

View components are rendered by Vue Router and represent full pages.

**Location:** `resources/admin/js/views/`

**Characteristics:**
- Orchestrate multiple child components
- Manage page-level state
- Handle route params and query strings
- Coordinate data fetching
- Handle errors and loading states

**Example:** `UsersView.vue`

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useDebounceFn } from '@vueuse/core';
import { useUserStore } from '@admin/stores/userStore';
import UsersTable from '@admin/components/User/UsersTable.vue';

// Store
const userStore = useUserStore();
const { users, loading, searchQuery } = storeToRefs(userStore);

// Local state
const initialLoading = ref(true);

// Load data
const loadUsers = async () => {
  try {
    await userStore.fetchUsers();
  } catch (error) {
    // Handle error
  }
};

// Debounced search
const debouncedLoadUsers = useDebounceFn(() => {
  loadUsers();
}, 500);

watch(searchQuery, () => {
  debouncedLoadUsers();
});

onMounted(async () => {
  await loadUsers();
  initialLoading.value = false;
});
</script>

<template>
  <div>
    <h1>Users</h1>

    <!-- Initial loading skeleton -->
    <div v-if="initialLoading">
      <Skeleton height="20rem" />
    </div>

    <!-- Main content -->
    <div v-else>
      <UsersTable :users="users ?? []" :loading="loading" />
    </div>
  </div>
</template>
```

### 2. Table Components

Display data in tabular format using PrimeVue DataTable.

**Location:** `resources/admin/js/components/{Feature}/{Feature}Table.vue`

**Characteristics:**
- Receive data via props
- Emit events for user actions (view, edit, delete)
- Handle empty and loading states
- Support pagination, sorting, filtering
- Fully typed props and emits

**Example:** `UsersTable.vue`

```vue
<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Badge from '@admin/components/common/Badge.vue';
import EmptyState from '@admin/components/common/EmptyState.vue';
import LoadingState from '@admin/components/common/LoadingState.vue';
import type { User } from '@admin/types/user';

export interface UsersTableProps {
  users: User[];
  loading?: boolean;
}

export interface UsersTableEmits {
  (event: 'view', user: User): void;
  (event: 'edit', user: User): void;
  (event: 'deactivate', user: User): void;
  (event: 'reactivate', user: User): void;
}

withDefaults(defineProps<UsersTableProps>(), {
  loading: false,
});

const emit = defineEmits<UsersTableEmits>();

const handleView = (user: User): void => {
  emit('view', user);
};
</script>

<template>
  <DataTable
    :value="users"
    :loading="loading"
    :rows="10"
    :paginator="true"
    striped-rows
    responsive-layout="scroll"
  >
    <!-- Empty state -->
    <template #empty>
      <EmptyState message="No users found" />
    </template>

    <!-- Loading state -->
    <template #loading>
      <LoadingState message="Loading users..." />
    </template>

    <!-- Columns -->
    <Column field="name" header="Name" :sortable="true">
      <template #body="{ data }">
        {{ data.first_name }} {{ data.last_name }}
      </template>
    </Column>

    <!-- Actions -->
    <Column header="Actions">
      <template #body="{ data }">
        <Button
          icon="pi pi-eye"
          text
          rounded
          @click="handleView(data)"
        />
      </template>
    </Column>
  </DataTable>
</template>
```

### 3. Modal Components

Modal dialogs extending BaseModal for create/edit/view/delete operations.

**Location:** `resources/admin/js/components/{Feature}/modals/`

**Characteristics:**
- Extend BaseModal component
- Use `v-model:visible` for visibility control
- Emit events on success (user-created, user-updated)
- Handle form validation
- Reset state on close

**Naming Convention:**
- `Create{Feature}Modal.vue` - Create new entity
- `Edit{Feature}Modal.vue` - Edit existing entity
- `View{Feature}Modal.vue` - View entity details (read-only)
- `Delete{Feature}Modal.vue` - Confirm deletion (optional, can use ConfirmDialog)

### 4. Form Components

Complex forms broken into logical sections.

**Location:** `resources/admin/js/components/{Feature}/`

**Characteristics:**
- Manage form state
- Handle validation errors
- Emit submit/cancel events
- Support tabbed interfaces for complex forms

### 5. Layout Components

Core layout structure components.

**Location:** `resources/admin/js/components/layout/`

**Components:**
- `AdminLayout.vue` - Main layout wrapper with sidebar and topbar
- `AppSidebar.vue` - Sidebar navigation
- `AppTopbar.vue` - Top navigation bar

### 6. Common/Reusable Components

Shared components used across multiple features.

**Location:** `resources/admin/js/components/common/`

**Components:**
- `Badge.vue` - Status badges
- `EmptyState.vue` - Empty state displays
- `LoadingState.vue` - Loading state displays

---

## BaseModal Component

### Overview

`BaseModal` is a wrapper around PrimeVue's `Dialog` component that provides:
- Consistent styling across all modals
- Simplified API
- Default pass-through (pt) configuration
- TypeScript support

**Location:** `/var/www/resources/admin/js/components/modals/BaseModal.vue`

### Why BaseModal Exists

**Problems it solves:**
1. **Consistency**: Ensures all modals have the same look and feel
2. **DRY**: Avoids repeating Dialog configuration in every modal
3. **Maintainability**: Changes to modal styling happen in one place
4. **Type Safety**: Full TypeScript support for props and emits
5. **Simplicity**: Cleaner API than raw Dialog component

### Props

```typescript
export interface BaseModalProps {
  visible: boolean;              // Required - controls visibility
  modal?: boolean;               // Default: true - modal overlay
  dismissableMask?: boolean;     // Default: true - click mask to close
  closable?: boolean;            // Default: true - show close icon
  draggable?: boolean;           // Default: false - draggable modal
  width?: string;                // Default: '600px' - modal width
  pt?: DialogPassThroughOptions; // Custom pass-through styles
  ptOptions?: any;               // Pass-through options
}
```

### Emits

```typescript
export interface BaseModalEmits {
  (event: 'update:visible', value: boolean): void; // v-model:visible
  (event: 'close'): void;                          // Emitted when closed
}
```

### Slots

- **`header`**: Modal header content
- **`default`**: Modal body content
- **`footer`**: Modal footer content (typically buttons)

### Complete Usage Example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'user-created': [];
}>();

const form = ref({
  name: '',
  email: '',
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  try {
    // Submit form...
    emit('user-created');
    emit('update:visible', false);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  // Reset form
  form.value = { name: '', email: '' };
};
</script>

<template>
  <BaseModal
    :visible="props.visible"
    width="40rem"
    @update:visible="emit('update:visible', $event)"
    @close="handleClose"
  >
    <!-- Header -->
    <template #header>
      Create New User
    </template>

    <!-- Body -->
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="name" class="block mb-2">Name *</label>
        <InputText
          id="name"
          v-model="form.name"
          class="w-full"
          required
        />
      </div>

      <div>
        <label for="email" class="block mb-2">Email *</label>
        <InputText
          id="email"
          v-model="form.email"
          type="email"
          class="w-full"
          required
        />
      </div>
    </form>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          @click="emit('update:visible', false)"
        />
        <Button
          label="Create"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
```

### Customizing Styles

BaseModal uses PrimeVue's pass-through (pt) system. You can override styles:

```vue
<BaseModal
  :visible="visible"
  :pt="{
    header: { class: 'bg-blue-600 text-white' },
    content: { class: 'p-8' }
  }"
>
  <!-- ... -->
</BaseModal>
```

### Default Styling

BaseModal provides these default styles:

```typescript
const defaultPt: DialogPassThroughOptions = {
  header: {
    class: 'border-b border-gray-200 bg-gray-50 py-3 px-4 rounded-t-lg shadow-md shadow-gray-900/75',
  },
  content: {
    class: 'bg-white p-4',
  },
  footer: {
    class: 'border-t border-gray-200 bg-gray-50 p-4 rounded-b-lg',
  },
  pcCloseButton: {
    root: {
      class: 'bg-white border border-gray-100 rounded-full hover:bg-gray-200',
    },
  },
};
```

---

## Common Components

### Badge Component

Display status badges with consistent styling.

**Location:** `/var/www/resources/admin/js/components/common/Badge.vue`

#### Props

```typescript
export type BadgeVariant =
  | 'success'    // Green - active, completed
  | 'info'       // Blue - information
  | 'warning'    // Yellow - warning
  | 'danger'     // Red - error, deleted
  | 'primary'    // Blue - primary action
  | 'secondary'  // Gray - default
  | 'purple';    // Purple - admin, special

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  text: string;                  // Required - text to display
  variant?: BadgeVariant;        // Default: 'secondary'
  icon?: string;                 // PrimeIcons class (e.g., 'pi-check-circle')
  size?: BadgeSize;              // Default: 'md'
}
```

#### Usage Examples

```vue
<script setup lang="ts">
import Badge from '@admin/components/common/Badge.vue';
</script>

<template>
  <!-- Basic badge -->
  <Badge text="Active" />

  <!-- Success badge with icon -->
  <Badge
    text="Active"
    variant="success"
    icon="pi-check-circle"
  />

  <!-- Warning badge -->
  <Badge
    text="Pending"
    variant="warning"
    icon="pi-exclamation-triangle"
  />

  <!-- Danger badge -->
  <Badge
    text="Suspended"
    variant="danger"
    icon="pi-ban"
  />

  <!-- Small badge -->
  <Badge
    text="New"
    variant="info"
    size="sm"
  />

  <!-- Admin badge -->
  <Badge
    text="Admin"
    variant="purple"
    icon="pi-shield"
  />
</template>
```

#### Color Mappings

| Variant | Background | Text Color | Use Case |
|---------|-----------|-----------|----------|
| `success` | `bg-green-100` | `text-green-700` | Active status, successful actions |
| `info` | `bg-blue-100` | `text-blue-700` | Information, user type |
| `primary` | `bg-blue-100` | `text-blue-700` | Primary actions |
| `warning` | `bg-yellow-100` | `text-yellow-700` | Warnings, pending status |
| `danger` | `bg-red-100` | `text-red-700` | Errors, suspended, deleted |
| `secondary` | `bg-gray-100` | `text-gray-700` | Default, neutral |
| `purple` | `bg-purple-100` | `text-purple-700` | Admin, special items |

### EmptyState Component

Display empty state with icon and message.

**Location:** `/var/www/resources/admin/js/components/common/EmptyState.vue`

#### Props

```typescript
export interface EmptyStateProps {
  icon?: Component;              // Default: PhClock (Phosphor icon)
  message?: string;              // Default: 'No data found'
  iconSize?: number;             // Default: 48
  iconClass?: string;            // Default: 'text-gray-400'
  messageClass?: string;         // Default: 'text-gray-600'
}
```

#### Usage Examples

```vue
<script setup lang="ts">
import EmptyState from '@admin/components/common/EmptyState.vue';
import { PhUsers, PhInbox } from '@phosphor-icons/vue';
</script>

<template>
  <!-- Basic empty state -->
  <EmptyState message="No users found" />

  <!-- Custom icon -->
  <EmptyState
    :icon="PhUsers"
    message="No users in this category"
  />

  <!-- Custom styling -->
  <EmptyState
    :icon="PhInbox"
    message="Your inbox is empty"
    :icon-size="64"
    icon-class="text-blue-400"
    message-class="text-blue-600 font-medium"
  />

  <!-- In DataTable -->
  <DataTable :value="users">
    <template #empty>
      <EmptyState message="No users found" />
    </template>
  </DataTable>
</template>
```

### LoadingState Component

Display loading state with spinning icon and message.

**Location:** `/var/www/resources/admin/js/components/common/LoadingState.vue`

#### Props

```typescript
export interface LoadingStateProps {
  icon?: Component;              // Default: PhCircleNotch
  message?: string;              // Default: 'Loading...'
  iconSize?: number;             // Default: 48
  spin?: boolean;                // Default: true
  iconClass?: string;            // Default: 'text-blue-500'
  messageClass?: string;         // Default: 'text-gray-600'
}
```

#### Usage Examples

```vue
<script setup lang="ts">
import LoadingState from '@admin/components/common/LoadingState.vue';
import { PhSpinner, PhCircleNotch } from '@phosphor-icons/vue';
</script>

<template>
  <!-- Basic loading state -->
  <LoadingState message="Loading users..." />

  <!-- Custom icon -->
  <LoadingState
    :icon="PhSpinner"
    message="Processing..."
  />

  <!-- Custom styling -->
  <LoadingState
    message="Fetching data..."
    :icon-size="64"
    icon-class="text-green-500"
    message-class="text-green-600 font-medium"
  />

  <!-- In DataTable -->
  <DataTable :value="users" :loading="loading">
    <template #loading>
      <LoadingState message="Loading users..." />
    </template>
  </DataTable>

  <!-- Page-level loading -->
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <LoadingState message="Loading page..." />
  </div>
</template>
```

---

## Feature Components

### Organization Pattern

Feature components are organized by domain/feature:

```
components/
├── User/                    # User management
│   ├── UsersTable.vue
│   └── modals/
│       ├── CreateUserModal.vue
│       ├── EditUserModal.vue
│       └── ViewUserModal.vue
├── AdminUser/               # Admin user management
│   ├── AdminUsersTable.vue
│   └── modals/
│       └── ...
├── ActivityLog/             # Activity logging
│   ├── ActivityLogTable.vue
│   └── ActivityLogDetailModal.vue
└── SiteConfig/              # Site configuration
    ├── SiteConfigForm.vue
    ├── IdentitySettings.vue
    └── ...
```

### Naming Conventions

1. **Table Components**: `{Feature}Table.vue` (e.g., `UsersTable.vue`)
2. **Form Components**: `{Feature}Form.vue` (e.g., `SiteConfigForm.vue`)
3. **Modal Components**: `{Action}{Feature}Modal.vue` (e.g., `CreateUserModal.vue`)
4. **Section Components**: `{Section}Settings.vue` (e.g., `IdentitySettings.vue`)

### Feature Component Structure

Each feature should have:

1. **Table Component** - Display list of entities
2. **Create Modal** - Create new entity
3. **Edit Modal** - Edit existing entity
4. **View Modal** - View entity details (optional)
5. **Delete Modal** - Confirm deletion (optional, can use ConfirmDialog)

---

## Component Communication

### Props Down, Events Up

The fundamental pattern for component communication:

```vue
<!-- Parent Component -->
<script setup lang="ts">
import { ref } from 'vue';
import UsersTable from '@admin/components/User/UsersTable.vue';
import type { User } from '@admin/types/user';

const users = ref<User[]>([]);

const handleView = (user: User) => {
  console.log('View user:', user);
};
</script>

<template>
  <!-- Props down -->
  <UsersTable
    :users="users"
    :loading="false"
    @view="handleView"
  />
  <!-- Events up -->
</template>
```

### When to Use Stores vs Props

#### Use Props When:
- Data is only needed by immediate child components
- Data is local to a feature
- Parent manages the state

#### Use Stores (Pinia) When:
- Data is shared across multiple views
- Data needs to persist across navigation
- Complex state management is required
- API calls need to be centralized

**Example:**

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@admin/stores/userStore';

// Use store for shared state
const userStore = useUserStore();
const { users, loading } = storeToRefs(userStore);

// Load data through store
onMounted(() => {
  userStore.fetchUsers();
});
</script>

<template>
  <!-- Pass store data as props to child -->
  <UsersTable
    :users="users ?? []"
    :loading="loading"
  />
</template>
```

### Event Typing

Always type your events for type safety:

```typescript
// Define emits interface
export interface UsersTableEmits {
  (event: 'view', user: User): void;
  (event: 'edit', user: User): void;
  (event: 'deactivate', user: User): void;
  (event: 'reactivate', user: User): void;
}

// Use in component
const emit = defineEmits<UsersTableEmits>();

// Emit events with full type safety
const handleView = (user: User): void => {
  emit('view', user); // TypeScript knows 'view' requires a User
};
```

### v-model Pattern

For two-way binding (e.g., modal visibility):

```vue
<!-- Child Component (Modal) -->
<script setup lang="ts">
defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();
</script>

<template>
  <BaseModal
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
  >
    <!-- ... -->
  </BaseModal>
</template>

<!-- Parent Component -->
<template>
  <CreateUserModal v-model:visible="createModalVisible" />
</template>
```

---

## Component Lifecycle

### Best Practices

#### 1. onMounted - Initial Data Loading

```typescript
import { ref, onMounted } from 'vue';

const users = ref<User[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    users.value = await userService.getUsers();
  } catch (error) {
    // Handle error
  } finally {
    loading.value = false;
  }
});
```

#### 2. onUnmounted - Cleanup

```typescript
import { onUnmounted } from 'vue';

const intervalId = ref<number | null>(null);

onMounted(() => {
  intervalId.value = setInterval(() => {
    // Do something
  }, 1000);
});

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
});
```

#### 3. watch - Reactive Changes

```typescript
import { ref, watch } from 'vue';

const searchQuery = ref('');

// Watch with debounce
const debouncedSearch = useDebounceFn(() => {
  loadUsers();
}, 500);

watch(searchQuery, () => {
  debouncedSearch();
});

// Watch multiple sources
watch(
  [searchQuery, statusFilter],
  ([newQuery, newStatus]) => {
    loadUsers(newQuery, newStatus);
  }
);

// Watch with immediate
watch(
  () => props.userId,
  (newId) => {
    loadUserDetails(newId);
  },
  { immediate: true }
);
```

#### 4. computed - Derived State

```typescript
import { computed } from 'vue';

const form = ref({
  name: '',
  email: '',
});

// Computed validation
const isFormValid = computed(() => {
  return form.value.name.trim().length > 0
    && form.value.email.includes('@');
});

// Use in template
<Button
  label="Submit"
  :disabled="!isFormValid"
/>
```

---

## Component Testing

### Testing Strategy

1. **Unit Tests**: Test component logic in isolation
2. **Mock Dependencies**: Mock services, stores, and child components
3. **Test User Interactions**: Simulate clicks, inputs, etc.
4. **Test Props and Emits**: Verify component API
5. **Test Edge Cases**: Empty states, errors, loading

### Testing Tools

- **Vitest**: Test runner
- **@vue/test-utils**: Vue component testing utilities
- **vi.mock()**: Mock modules and dependencies

### Complete Test Example

**File:** `/var/www/resources/admin/js/components/modals/__tests__/BaseModal.spec.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseModal from '../BaseModal.vue';

// Mock PrimeVue Dialog
vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: `
      <div v-if="visible" class="p-dialog">
        <div class="p-dialog-header">
          <slot name="header"></slot>
        </div>
        <div class="p-dialog-content">
          <slot></slot>
        </div>
        <div class="p-dialog-footer">
          <slot name="footer"></slot>
        </div>
        <button class="p-dialog-close" @click="$emit('update:visible', false)"></button>
      </div>
    `,
    props: ['visible', 'modal', 'dismissableMask', 'closable', 'draggable', 'style', 'pt', 'ptOptions'],
    emits: ['update:visible'],
  },
}));

describe('BaseModal', () => {
  it('renders when visible is true', () => {
    const wrapper = mount(BaseModal, {
      props: { visible: true },
    });

    expect(wrapper.find('.p-dialog').exists()).toBe(true);
  });

  it('does not render when visible is false', () => {
    const wrapper = mount(BaseModal, {
      props: { visible: false },
    });

    expect(wrapper.find('.p-dialog').exists()).toBe(false);
  });

  it('emits update:visible when dialog closes', async () => {
    const wrapper = mount(BaseModal, {
      props: { visible: true },
    });

    await wrapper.find('.p-dialog-close').trigger('click');

    expect(wrapper.emitted('update:visible')).toBeTruthy();
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
  });

  it('emits close event when dialog is closed', async () => {
    const wrapper = mount(BaseModal, {
      props: { visible: true },
    });

    const vm = wrapper.vm as any;
    await vm.handleVisibleChange(false);

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('renders all slots', () => {
    const wrapper = mount(BaseModal, {
      props: { visible: true },
      slots: {
        header: '<h2>Title</h2>',
        default: '<p>Content</p>',
        footer: '<button>Action</button>',
      },
    });

    expect(wrapper.html()).toContain('Title');
    expect(wrapper.html()).toContain('Content');
    expect(wrapper.html()).toContain('Action');
  });

  it('applies default props correctly', () => {
    const wrapper = mount(BaseModal, {
      props: { visible: true },
    });

    expect(wrapper.props('modal')).toBe(true);
    expect(wrapper.props('dismissableMask')).toBe(true);
    expect(wrapper.props('closable')).toBe(true);
    expect(wrapper.props('draggable')).toBe(false);
    expect(wrapper.props('width')).toBe('600px');
  });

  it('accepts custom width', () => {
    const wrapper = mount(BaseModal, {
      props: {
        visible: true,
        width: '800px',
      },
    });

    expect(wrapper.props('width')).toBe('800px');
  });
});
```

### Testing Table Components

**File:** `/var/www/resources/admin/js/components/User/__tests__/UsersTable.spec.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UsersTable from '../UsersTable.vue';
import type { User } from '@admin/types/user';

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div class="users-table"><slot /></div>',
    props: ['value', 'loading', 'rows', 'paginator'],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="column"><slot /></div>',
    props: ['field', 'header', 'sortable'],
  },
}));

// Mock composables
vi.mock('@admin/composables/useDateFormatter', () => ({
  useDateFormatter: () => ({
    formatDate: (date: string) => 'Jan 1, 2024',
  }),
}));

describe('UsersTable', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      status: 'active',
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
  ];

  it('renders the table with users', () => {
    const wrapper = mount(UsersTable, {
      props: {
        users: mockUsers,
        loading: false,
      },
    });

    expect(wrapper.find('.users-table').exists()).toBe(true);
  });

  it('emits view event when view button is clicked', async () => {
    const wrapper = mount(UsersTable, {
      props: { users: mockUsers },
    });

    await wrapper.vm.$emit('view', mockUsers[0]);

    expect(wrapper.emitted('view')).toBeTruthy();
    expect(wrapper.emitted('view')?.[0]).toEqual([mockUsers[0]]);
  });

  it('handles empty users array', () => {
    const wrapper = mount(UsersTable, {
      props: {
        users: [],
        loading: false,
      },
    });

    expect(wrapper.props('users')).toEqual([]);
  });
});
```

### Testing Modal Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateUserModal from '../CreateUserModal.vue';

// Mock BaseModal
vi.mock('@admin/components/modals/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div v-if="visible"><slot name="header" /><slot /><slot name="footer" /></div>',
    props: ['visible', 'width'],
    emits: ['update:visible', 'close'],
  },
}));

// Mock service
vi.mock('@admin/services/userService', () => ({
  userService: {
    createUser: vi.fn().mockResolvedValue({ id: '1' }),
  },
}));

describe('CreateUserModal', () => {
  it('renders when visible', () => {
    const wrapper = mount(CreateUserModal, {
      props: { visible: true },
    });

    expect(wrapper.html()).toContain('Create New User');
  });

  it('emits user-created on successful submit', async () => {
    const wrapper = mount(CreateUserModal, {
      props: { visible: true },
    });

    // Fill form
    // Click submit
    // Assert emit

    expect(wrapper.emitted('user-created')).toBeTruthy();
  });

  it('displays validation errors', async () => {
    // Test validation error handling
  });
});
```

---

## Common Patterns

### 1. Loading States

#### Pattern: Initial vs Refresh Loading

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Skeleton from 'primevue/skeleton';

const initialLoading = ref(true);
const refreshLoading = ref(false);
const users = ref<User[]>([]);

const loadUsers = async () => {
  try {
    refreshLoading.value = true;
    users.value = await userService.getUsers();
  } finally {
    refreshLoading.value = false;
  }
};

onMounted(async () => {
  await loadUsers();
  initialLoading.value = false;
});
</script>

<template>
  <!-- Initial loading: Show skeleton -->
  <div v-if="initialLoading">
    <Skeleton height="20rem" />
  </div>

  <!-- Content loaded -->
  <div v-else>
    <!-- Refresh loading: Show spinner on table -->
    <UsersTable :users="users" :loading="refreshLoading" />
  </div>
</template>
```

### 2. Empty States

```vue
<template>
  <DataTable :value="users">
    <template #empty>
      <EmptyState
        :icon="PhUsers"
        message="No users found"
      />
    </template>
  </DataTable>
</template>
```

### 3. Error States

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useErrorToast } from '@admin/composables/useErrorToast';

const { showErrorToast } = useErrorToast();
const error = ref<Error | null>(null);

const loadUsers = async () => {
  try {
    error.value = null;
    // Load users
  } catch (err) {
    error.value = err as Error;
    showErrorToast(err, 'Failed to load users');
  }
};
</script>

<template>
  <!-- Error state -->
  <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded">
    <p class="text-red-700">{{ error.message }}</p>
    <Button
      label="Retry"
      severity="danger"
      outlined
      @click="loadUsers"
    />
  </div>

  <!-- Content -->
  <div v-else>
    <!-- ... -->
  </div>
</template>
```

### 4. Skeleton Loading

```vue
<script setup lang="ts">
import Skeleton from 'primevue/skeleton';
import Card from 'primevue/card';

const initialLoading = ref(true);
</script>

<template>
  <div v-if="initialLoading" class="space-y-6">
    <!-- Header skeleton -->
    <Card>
      <template #content>
        <Skeleton height="4rem" />
      </template>
    </Card>

    <!-- Table skeleton -->
    <Card>
      <template #content>
        <Skeleton height="20rem" />
      </template>
    </Card>
  </div>

  <div v-else>
    <!-- Actual content -->
  </div>
</template>
```

### 5. Debounced Search

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import InputText from 'primevue/inputtext';

const searchQuery = ref('');

const loadUsers = async () => {
  // Load users with search query
};

// Debounce: wait 500ms after user stops typing
const debouncedLoadUsers = useDebounceFn(() => {
  loadUsers();
}, 500);

watch(searchQuery, () => {
  debouncedLoadUsers();
});
</script>

<template>
  <InputText
    v-model="searchQuery"
    placeholder="Search users..."
    class="w-full"
  />
</template>
```

### 6. Form Validation

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getValidationErrors, hasValidationErrors } from '@admin/types/errors';

const form = ref({
  name: '',
  email: '',
});

const fieldErrors = ref<Record<string, string[]>>({});

const getFieldError = (fieldName: string): string | undefined => {
  return fieldErrors.value[fieldName]?.[0];
};

const hasFieldError = (fieldName: string): boolean => {
  return !!fieldErrors.value[fieldName];
};

const handleSubmit = async () => {
  fieldErrors.value = {};

  try {
    await userService.createUser(form.value);
  } catch (error) {
    if (hasValidationErrors(error)) {
      const errors = getValidationErrors(error);
      if (errors) {
        fieldErrors.value = errors;
      }
    }
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>Name *</label>
      <InputText
        v-model="form.name"
        :invalid="hasFieldError('name')"
        class="w-full"
      />
      <small v-if="hasFieldError('name')" class="text-red-500">
        {{ getFieldError('name') }}
      </small>
    </div>
  </form>
</template>
```

---

## Best Practices

### 1. Single Responsibility Principle

Each component should have one clear purpose:

```vue
<!-- ❌ BAD: Component does too much -->
<script setup lang="ts">
// Handles users, settings, and navigation
</script>

<!-- ✅ GOOD: Component has single responsibility -->
<script setup lang="ts">
// UsersTable.vue - Only displays users in a table
</script>
```

### 2. Prop Validation

Always define prop types and defaults:

```typescript
// ✅ GOOD: Full type safety
export interface UsersTableProps {
  users: User[];
  loading?: boolean;
}

withDefaults(defineProps<UsersTableProps>(), {
  loading: false,
});

// ❌ BAD: No types
defineProps({
  users: Array,
  loading: Boolean,
});
```

### 3. Event Naming

Use kebab-case for event names:

```vue
<!-- ✅ GOOD -->
<template>
  <UsersTable
    @view="handleView"
    @user-created="handleUserCreated"
    @status-changed="handleStatusChanged"
  />
</template>

<!-- ❌ BAD: camelCase events -->
<template>
  <UsersTable
    @viewUser="handleView"
    @userCreated="handleUserCreated"
  />
</template>
```

### 4. TypeScript Usage

Use TypeScript for everything:

```typescript
// ✅ GOOD: Fully typed
import type { User } from '@admin/types/user';

const users = ref<User[]>([]);

const handleView = (user: User): void => {
  // TypeScript ensures 'user' is correct type
};

// ❌ BAD: No types
const users = ref([]);

const handleView = (user) => {
  // No type safety
};
```

### 5. Composables for Reusable Logic

Extract common logic into composables:

```typescript
// composables/useUserActions.ts
export function useUserActions() {
  const { showErrorToast, showSuccessToast } = useErrorToast();
  const userStore = useUserStore();

  const deactivateUser = async (userId: string) => {
    try {
      await userStore.deleteUser(userId);
      showSuccessToast('User deactivated');
    } catch (error) {
      showErrorToast(error, 'Failed to deactivate user');
    }
  };

  return {
    deactivateUser,
  };
}

// Use in component
const { deactivateUser } = useUserActions();
```

### 6. Avoid Deep Prop Drilling

Use stores or provide/inject for deeply nested data:

```typescript
// ❌ BAD: Prop drilling
<GrandParent :user="user">
  <Parent :user="user">
    <Child :user="user">
      <!-- Finally use user -->
    </Child>
  </Parent>
</GrandParent>

// ✅ GOOD: Use store
const { currentUser } = storeToRefs(useUserStore());
```

### 7. Clean Up Side Effects

Always clean up in `onUnmounted`:

```typescript
import { onMounted, onUnmounted } from 'vue';

const controller = ref<AbortController | null>(null);

onMounted(() => {
  controller.value = new AbortController();
});

onUnmounted(() => {
  // Cancel pending requests
  controller.value?.abort();
});
```

### 8. Component Documentation

Document complex components:

```typescript
/**
 * UsersTable Component
 *
 * Displays a paginated, sortable table of users with actions.
 *
 * @example
 * ```vue
 * <UsersTable
 *   :users="users"
 *   :loading="loading"
 *   @view="handleView"
 *   @edit="handleEdit"
 * />
 * ```
 */
export interface UsersTableProps {
  // ...
}
```

---

## Complete Examples

### Example 1: Full CRUD Modal Set

**CreateUserModal.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { userService } from '@admin/services/userService';
import { getValidationErrors, hasValidationErrors } from '@admin/types/errors';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'user-created': [];
}>();

const toast = useToast();
const loading = ref(false);

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  alias: '',
  password: '',
  status: 'active' as 'active' | 'inactive' | 'suspended',
});

const fieldErrors = ref<Record<string, string[]>>({});

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

const resetForm = () => {
  form.value = {
    first_name: '',
    last_name: '',
    email: '',
    alias: '',
    password: '',
    status: 'active',
  };
  fieldErrors.value = {};
};

const getFieldError = (fieldName: string): string | undefined => {
  return fieldErrors.value[fieldName]?.[0];
};

const hasFieldError = (fieldName: string): boolean => {
  return !!fieldErrors.value[fieldName];
};

const handleSubmit = async () => {
  loading.value = true;
  fieldErrors.value = {};

  try {
    await userService.createUser({
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      alias: form.value.alias || null,
      password: form.value.password,
      status: form.value.status,
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'User created successfully',
      life: 3000,
    });

    resetForm();
    emit('user-created');
  } catch (error) {
    if (hasValidationErrors(error)) {
      const errors = getValidationErrors(error);
      if (errors) {
        fieldErrors.value = errors;
        toast.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Please correct the errors in the form',
          life: 3000,
        });
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create user',
        life: 3000,
      });
    }
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  resetForm();
};
</script>

<template>
  <BaseModal
    :visible="props.visible"
    width="40rem"
    @update:visible="emit('update:visible', $event)"
    @close="handleClose"
  >
    <template #header>Create New User</template>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="create-first-name" class="block mb-2">First Name *</label>
        <InputText
          id="create-first-name"
          v-model="form.first_name"
          class="w-full"
          :invalid="hasFieldError('first_name')"
          required
        />
        <small v-if="hasFieldError('first_name')" class="text-red-500">
          {{ getFieldError('first_name') }}
        </small>
      </div>

      <div>
        <label for="create-last-name" class="block mb-2">Last Name *</label>
        <InputText
          id="create-last-name"
          v-model="form.last_name"
          class="w-full"
          :invalid="hasFieldError('last_name')"
          required
        />
        <small v-if="hasFieldError('last_name')" class="text-red-500">
          {{ getFieldError('last_name') }}
        </small>
      </div>

      <div>
        <label for="create-email" class="block mb-2">Email *</label>
        <InputText
          id="create-email"
          v-model="form.email"
          type="email"
          class="w-full"
          :invalid="hasFieldError('email')"
          required
        />
        <small v-if="hasFieldError('email')" class="text-red-500">
          {{ getFieldError('email') }}
        </small>
      </div>

      <div>
        <label for="create-password" class="block mb-2">Password *</label>
        <InputText
          id="create-password"
          v-model="form.password"
          type="password"
          class="w-full"
          :invalid="hasFieldError('password')"
          required
        />
        <small v-if="hasFieldError('password')" class="text-red-500">
          {{ getFieldError('password') }}
        </small>
      </div>

      <div>
        <label for="create-status" class="block mb-2">Status *</label>
        <Select
          id="create-status"
          v-model="form.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          :invalid="hasFieldError('status')"
        />
        <small v-if="hasFieldError('status')" class="text-red-500">
          {{ getFieldError('status') }}
        </small>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          @click="emit('update:visible', false)"
        />
        <Button
          type="button"
          label="Create"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
```

### Example 2: Complex Table Component

**ActivityLogTable.vue** (excerpt showing advanced patterns)

```vue
<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Badge, { type BadgeVariant } from '@admin/components/common/Badge.vue';
import EmptyState from '@admin/components/common/EmptyState.vue';
import LoadingState from '@admin/components/common/LoadingState.vue';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import type { Activity, EventType, Causer } from '@admin/types/activityLog';

export interface ActivityLogTableProps {
  activities: Activity[];
  loading?: boolean;
  showEvent?: boolean;
  showSubject?: boolean;
  paginator?: boolean;
  rowsPerPage?: number;
}

export interface ActivityLogTableEmits {
  (event: 'view-details', activity: Activity): void;
}

withDefaults(defineProps<ActivityLogTableProps>(), {
  loading: false,
  showEvent: true,
  showSubject: true,
  paginator: true,
  rowsPerPage: 10,
});

const emit = defineEmits<ActivityLogTableEmits>();

const { formatDate } = useDateFormatter();

const formatEvent = (event: EventType): string => {
  return event.charAt(0).toUpperCase() + event.slice(1);
};

const getEventVariant = (event: EventType): BadgeVariant => {
  const variants: Record<EventType, BadgeVariant> = {
    created: 'success',
    updated: 'info',
    deleted: 'danger',
  };
  return variants[event] || 'secondary';
};

const getCauserName = (causer: Causer): string => {
  if (causer.first_name && causer.last_name) {
    return `${causer.first_name} ${causer.last_name}`;
  }
  if (causer.name) {
    return causer.name;
  }
  return causer.email;
};

const handleViewDetails = (activity: Activity): void => {
  emit('view-details', activity);
};
</script>

<template>
  <DataTable
    :value="activities"
    :loading="loading"
    :rows="rowsPerPage"
    :paginator="paginator"
    striped-rows
    responsive-layout="scroll"
  >
    <template #empty>
      <EmptyState message="No activities found" />
    </template>

    <template #loading>
      <LoadingState message="Loading activities..." />
    </template>

    <!-- Columns with conditional rendering -->
    <Column field="id" header="ID" :sortable="true">
      <template #body="{ data }">
        <span class="font-mono text-sm">{{ data.id }}</span>
      </template>
    </Column>

    <Column v-if="showEvent" field="event" header="Event">
      <template #body="{ data }">
        <Badge
          v-if="data.event"
          :text="formatEvent(data.event)"
          :variant="getEventVariant(data.event)"
        />
      </template>
    </Column>

    <Column header="Performed By">
      <template #body="{ data }">
        <div v-if="data.causer">
          <p class="text-sm font-medium">{{ getCauserName(data.causer) }}</p>
          <p class="text-xs text-gray-500">ID: {{ data.causer.id }}</p>
        </div>
        <span v-else class="text-gray-400">System</span>
      </template>
    </Column>

    <Column header="Actions">
      <template #body="{ data }">
        <Button
          v-tooltip.top="'View Details'"
          icon="pi pi-eye"
          text
          rounded
          @click="handleViewDetails(data)"
        />
      </template>
    </Column>
  </DataTable>
</template>
```

---

## Troubleshooting

### Common Issues

#### 1. Component Not Rendering

**Problem:** Component doesn't show up

**Solutions:**
- Check if component is registered/imported
- Verify props are passed correctly
- Check v-if/v-show conditions
- Use Vue DevTools to inspect component tree

```vue
<!-- Check import -->
<script setup lang="ts">
import UsersTable from '@admin/components/User/UsersTable.vue';
// ✅ Component imported

// Check props
const users = ref<User[]>([]);
console.log('Users:', users.value); // Debug
</script>

<template>
  <!-- Check conditions -->
  <UsersTable v-if="users.length > 0" :users="users" />
</template>
```

#### 2. Props Not Updating

**Problem:** Child component doesn't react to prop changes

**Solutions:**
- Ensure props are reactive (ref/reactive)
- Don't destructure props without toRefs
- Check if prop is being mutated in child (don't!)

```typescript
// ❌ BAD: Lost reactivity
const { users } = defineProps<{ users: User[] }>();

// ✅ GOOD: Keep reactivity
const props = defineProps<{ users: User[] }>();
// Use: props.users
```

#### 3. Events Not Emitting

**Problem:** Parent doesn't receive emitted events

**Solutions:**
- Check event name matches (kebab-case vs camelCase)
- Verify emit is called correctly
- Check parent has event listener

```vue
<!-- Child -->
<script setup lang="ts">
const emit = defineEmits<{
  'user-created': [];
}>();

// ✅ Correct
emit('user-created');

// ❌ Wrong - typo
emit('userCreated');
</script>

<!-- Parent -->
<template>
  <!-- ✅ Correct -->
  <CreateUserModal @user-created="handleUserCreated" />

  <!-- ❌ Wrong - missing listener -->
  <CreateUserModal />
</template>
```

#### 4. Modal Not Closing

**Problem:** Modal stays open after action

**Solutions:**
- Ensure v-model:visible is bound correctly
- Check if update:visible event is emitted
- Verify parent updates visible state

```vue
<!-- Child (Modal) -->
<script setup lang="ts">
const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

// Close modal
emit('update:visible', false);
</script>

<!-- Parent -->
<template>
  <!-- ✅ Correct: v-model binding -->
  <CreateUserModal v-model:visible="visible" />

  <!-- ❌ Wrong: missing v-model -->
  <CreateUserModal :visible="visible" />
</template>
```

#### 5. TypeScript Errors

**Problem:** TypeScript complains about types

**Solutions:**
- Import types correctly
- Define prop/emit interfaces
- Use proper type assertions

```typescript
// ✅ Import type
import type { User } from '@admin/types/user';

// ✅ Define interfaces
export interface UsersTableProps {
  users: User[];
}

// ✅ Type component state
const users = ref<User[]>([]);

// ❌ Wrong: any type
const users = ref([]);
```

#### 6. Styles Not Applied

**Problem:** Component styles don't work

**Solutions:**
- Check if scoped styles affect child components
- Use :deep() for nested styling
- Verify Tailwind classes are correct

```vue
<style scoped>
/* ❌ Won't affect child components */
.child-class {
  color: red;
}

/* ✅ Will affect child components */
:deep(.child-class) {
  color: red;
}
</style>
```

---

## Summary

This guide covered the complete component architecture for the admin dashboard:

1. **Component Types**: Views, tables, modals, forms, layouts, common
2. **BaseModal**: Centralized modal wrapper for consistency
3. **Common Components**: Badge, EmptyState, LoadingState
4. **Communication**: Props down, events up, stores for shared state
5. **Lifecycle**: onMounted, onUnmounted, watch, computed
6. **Testing**: Unit tests with Vitest and @vue/test-utils
7. **Patterns**: Loading states, empty states, error handling, debouncing
8. **Best Practices**: Single responsibility, type safety, clean code

### Key Takeaways

- **Always use `@admin/` imports**
- **Type everything with TypeScript**
- **Extend BaseModal for consistency**
- **Use common components (Badge, EmptyState, LoadingState)**
- **Follow props down, events up**
- **Test all components**
- **Clean up side effects in onUnmounted**

### Related Documentation

- **[Admin Dashboard Development Guide](./admin-dashboard-development-guide.md)** - Complete development workflow
- **[PrimeVue Usage Guide](../primevue-usage.md)** - PrimeVue component examples
- **[CLAUDE.md](/var/www/CLAUDE.md)** - Project overview and architecture

---

**Need help?** Refer to existing components in `/var/www/resources/admin/js/components/` for real-world examples.
