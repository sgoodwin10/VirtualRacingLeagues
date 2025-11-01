# Admin Dashboard Development Guide

> **Your complete reference for building features in the admin dashboard**

This guide provides everything you need to develop high-quality, maintainable features in the admin dashboard. It explains not just HOW to use patterns, but WHY they exist and when to apply them.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Directory Structure](#directory-structure)
4. [Quick Start](#quick-start)
5. [Core Concepts](#core-concepts)
6. [Important Packages](#important-packages)
7. [Design System Guidelines](#design-system-guidelines)
8. [Development Workflow](#development-workflow)
9. [Component Patterns](#component-patterns)
10. [Composables Deep Dive](#composables-deep-dive)
11. [Services & API Integration](#services--api-integration)
12. [State Management](#state-management)
13. [Routing & Navigation](#routing--navigation)
14. [Error Handling](#error-handling)
15. [Testing](#testing)
16. [Common Patterns](#common-patterns)
17. [Common Pitfalls](#common-pitfalls)
18. [Detailed Guides](#detailed-guides)

---

## Introduction

### What This Guide Covers

This is the main development guide for the **admin dashboard frontend**. It covers:

- **Architecture principles** - Understanding the layered architecture
- **Component patterns** - Building reusable, testable components
- **State management** - When to use local state vs. global state
- **API integration** - Service layer patterns and error handling
- **Testing strategies** - Writing comprehensive tests
- **Best practices** - Established patterns that ensure consistency

### Who This Guide Is For

- Frontend developers building admin dashboard features
- Developers new to the project who need to understand existing patterns
- Anyone needing a reference for consistent code patterns

### Philosophy

This codebase follows these core principles:

1. **Composition over Inheritance** - Use composables for shared logic
2. **Explicit over Implicit** - Code should be obvious and self-documenting
3. **Type Safety First** - TypeScript strict mode catches errors early
4. **Separation of Concerns** - Each layer has a clear responsibility
5. **Test with Confidence** - Comprehensive tests enable safe refactoring

---

## Architecture Overview

The admin dashboard follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│  Views (Pages)                                          │
│  - Orchestrate feature logic                           │
│  - Handle data fetching                                │
│  - Manage modals                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Components (Tables, Modals, Forms)                     │
│  - Display data                                         │
│  - Handle user interactions                            │
│  - Emit events to parent                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Composables (Reusable Logic)                           │
│  - Shared functionality                                 │
│  - Pure business logic                                  │
│  - No UI concerns                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Services (API Layer)                                   │
│  - HTTP communication                                   │
│  - Response unwrapping                                  │
│  - Error transformation                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Stores (Global State)                                  │
│  - Authentication                                       │
│  - Global UI state                                     │
│  - Shared data across features                         │
└─────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Testability** - Each layer can be tested independently with mocked dependencies

**Maintainability** - Clear responsibilities make code easier to understand and modify

**Reusability** - Composables and components can be shared across features

**Scalability** - New features follow the same patterns, making the codebase predictable

---

## Directory Structure

```
resources/admin/js/
├── app.ts                      # Vue app entry point
│
├── components/                 # Vue components
│   ├── common/                # Shared components
│   │   ├── Badge.vue          # Status badges
│   │   ├── EmptyState.vue     # Empty state placeholders
│   │   └── LoadingState.vue   # Loading indicators
│   ├── layout/                # Layout components
│   │   ├── AdminLayout.vue    # Main layout wrapper
│   │   ├── AppTopbar.vue      # Top navigation bar
│   │   └── AppSidebar.vue     # Sidebar navigation
│   ├── modals/                # Base modal components
│   │   └── BaseModal.vue      # Reusable modal wrapper
│   ├── AdminUser/             # Admin user feature
│   │   ├── AdminUsersTable.vue
│   │   └── modals/
│   │       ├── ViewAdminUserModal.vue
│   │       ├── EditAdminUserModal.vue
│   │       ├── CreateAdminUserModal.vue
│   │       └── DeleteAdminUserModal.vue
│   ├── User/                  # Regular user feature
│   ├── ActivityLog/           # Activity log feature
│   └── SiteConfig/            # Site configuration feature
│
├── composables/               # Composition functions (reusable logic)
│   ├── useModal.ts           # Modal state management
│   ├── useAsyncAction.ts     # Async operation handling
│   ├── useErrorToast.ts      # Error notifications
│   ├── useDateFormatter.ts   # Date formatting
│   ├── useNameHelpers.ts     # Name extraction/formatting
│   ├── useRoleHelpers.ts     # Role-based access control
│   ├── useStatusHelpers.ts   # Status badge helpers
│   ├── useRequestCancellation.ts  # API request cancellation
│   ├── useSiteConfig.ts      # Site configuration state
│   └── useAdminUserModals.ts # Advanced modal management
│
├── services/                  # API service layer
│   ├── api.ts                # Axios instance & CSRF handling
│   ├── authService.ts        # Authentication API
│   ├── adminUserService.ts   # Admin user CRUD
│   ├── userService.ts        # User CRUD
│   ├── activityLogService.ts # Activity logs API
│   └── siteConfigService.ts  # Site configuration API
│
├── stores/                    # Pinia state stores (global state only)
│   ├── adminStore.ts         # Admin authentication state
│   ├── layoutStore.ts        # Layout/sidebar state
│   └── siteConfigStore.ts    # Site configuration state
│
├── types/                     # TypeScript type definitions
│   ├── admin.ts              # Admin types
│   ├── user.ts               # User types
│   ├── activityLog.ts        # Activity log types
│   ├── siteConfig.ts         # Site config types
│   ├── errors.ts             # Error types & guards
│   └── primevue.ts           # PrimeVue event types
│
├── router/                    # Vue Router configuration
│   └── index.ts              # Route definitions & guards
│
├── views/                     # Page-level components
│   ├── AdminLoginView.vue    # Login page
│   ├── DashboardView.vue     # Dashboard home
│   ├── AdminUsersView.vue    # Admin users management
│   ├── UsersView.vue         # Regular users management
│   ├── ActivityLogView.vue   # Activity logs
│   └── SiteConfigView.vue    # Site configuration
│
├── utils/                     # Utility functions
│   ├── errorHandler.ts       # Service error handling
│   ├── errorMessages.ts      # Error message templates
│   └── logger.ts             # Console logging utility
│
└── constants/                 # Application constants
    ├── pagination.ts         # Pagination defaults
    └── messages.ts           # Toast message templates
```

### Directory Purposes

| Directory | Purpose | What Goes Here |
|-----------|---------|----------------|
| `components/` | Reusable UI components | Tables, modals, forms, cards |
| `composables/` | Reusable logic | State management, formatting, helpers |
| `services/` | API communication | HTTP requests, response handling |
| `stores/` | Global state | Auth, layout, shared data |
| `types/` | TypeScript types | Interfaces, types, guards |
| `views/` | Page components | Top-level pages that orchestrate features |
| `utils/` | Pure functions | Helpers, transformers, validators |
| `constants/` | Static data | Configuration, defaults, messages |

---

## Quick Start

### Adding a New Feature

Here's a 30-second overview of adding a new feature. Detailed steps are in [Development Workflow](#development-workflow).

1. **Create types** in `types/feature.ts`
2. **Create service** in `services/featureService.ts`
3. **Create composables** (if needed) in `composables/useFeatureHelpers.ts`
4. **Create table component** in `components/Feature/FeaturesTable.vue`
5. **Create modal components** in `components/Feature/modals/`
6. **Create view** in `views/FeaturesView.vue`
7. **Add route** in `router/index.ts`
8. **Add navigation** in `components/layout/AppSidebar.vue`
9. **Write tests** in `__tests__/` directories

### Running the Development Server

```bash
# Start Vite dev server with hot reload
npm run dev

# Or start all services (Laravel + Vite)
composer dev
```

Access at: `http://YOUR_DOMAIN.localhost/admin`

### Running Tests

```bash
# Run admin dashboard tests
npm run test:admin

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

---

## Core Concepts

### 1. Composition API (`<script setup>`)

We use Vue 3's Composition API exclusively with `<script setup lang="ts">` syntax.

**Why?**
- Better TypeScript support
- More explicit reactivity
- Easier to extract reusable logic
- Better tree-shaking

**Pattern:**
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Props
interface Props {
  items: Item[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Emits
interface Emits {
  (event: 'update', item: Item): void;
}

const emit = defineEmits<Emits>();

// Reactive state
const count = ref(0);
const doubleCount = computed(() => count.value * 2);

// Lifecycle
onMounted(() => {
  console.log('Component mounted');
});
</script>
```

### 2. Type Safety with TypeScript

We use **TypeScript strict mode** to catch errors at compile time.

**Why?**
- Catches bugs before runtime
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

**Pattern:**
```typescript
// Define interfaces
interface User {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
}

type UserStatus = 'active' | 'inactive' | 'suspended';

// Type function parameters and returns
function formatUser(user: User): string {
  return `${user.name} (${user.email})`;
}

// Type component props
interface Props {
  user: User;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
});
```

### 3. Separation of Concerns

Each layer has a single, clear responsibility.

**Why?**
- Easier to test in isolation
- Easier to understand and modify
- Reduces coupling between layers
- Promotes reusability

**Rules:**
- **Views** orchestrate, don't implement business logic
- **Components** display data, emit events, don't fetch data
- **Composables** contain pure business logic, no API calls
- **Services** handle API communication, unwrap responses
- **Stores** manage global state only

### 4. Props Down, Events Up

Data flows down through props, changes flow up through events.

**Why?**
- Predictable data flow
- Easier to debug
- Components remain reusable
- Parent controls state

**Pattern:**
```vue
<!-- Parent View -->
<template>
  <UsersTable
    :users="users"
    :loading="loading"
    @edit="editUser"
    @delete="deleteUser"
  />
</template>

<script setup lang="ts">
const users = ref<User[]>([]);
const loading = ref(false);

const editUser = (user: User) => {
  selectedUser.value = user;
  editDialogVisible.value = true;
};
</script>

<!-- Child Table Component -->
<script setup lang="ts">
interface Props {
  users: User[];
  loading: boolean;
}

interface Emits {
  (event: 'edit', user: User): void;
  (event: 'delete', user: User): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Component emits events, doesn't modify props
const handleEdit = (user: User) => {
  emit('edit', user);
};
</script>
```

### 5. Composables for Reusability

Extract shared logic into composables.

**Why?**
- Avoid code duplication
- Testable in isolation
- Reusable across components
- Co-locates related logic

**When to create a composable:**
- Logic used in 2+ components
- Complex logic that would clutter components
- Logic that needs isolated testing
- Stateful logic that needs reactivity

**Example:**
```typescript
// composables/useDateFormatter.ts
export function useDateFormatter() {
  const formatDate = (date: string | null): string => {
    if (!date) return 'Never';
    return format(parseISO(date), "h:mmaaa do MMM yy");
  };

  return { formatDate };
}

// Used in multiple components
const { formatDate } = useDateFormatter();
```

---

## Important Packages

### PrimeVue 4 (UI Components)

**What it is:** Comprehensive UI component library with pre-built components

**Why we use it:**
- Production-ready components (DataTable, Dialog, forms)
- Consistent design system
- Accessibility built-in
- Highly customizable

**Key components:**
- `DataTable` - Paginated tables with sorting/filtering
- `Dialog` - Modal dialogs
- `Button` - Buttons with loading states
- `InputText`, `Select`, `Calendar` - Form inputs
- `Toast` - Toast notifications
- `Card` - Content containers
- `Skeleton` - Loading placeholders

**Documentation:** Use MCP Context7 or `../../primevue-usage.md`

**Import pattern:**
```typescript
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import { useToast } from 'primevue/usetoast';
```

### Pinia 3 (State Management)

**What it is:** Official state management library for Vue 3

**Why we use it:**
- Simple, intuitive API
- Full TypeScript support
- DevTools integration
- Composable-style stores

**When to use:**
- Authentication state
- Global UI state (sidebar visibility)
- Shared data across unrelated components
- Data needing persistence (sessionStorage)

**When NOT to use:**
- Component-specific state (use local refs)
- Temporary UI state
- Data passed via props

**Pattern:**
```typescript
export const useAdminStore = defineStore('admin', () => {
  // State
  const admin = ref<Admin | null>(null);
  const isAuthenticated = ref(false);

  // Getters
  const adminRole = computed(() => admin.value?.role);

  // Actions
  async function checkAuth(): Promise<boolean> {
    // Implementation
  }

  return { admin, isAuthenticated, adminRole, checkAuth };
}, {
  persist: {
    storage: sessionStorage,
    pick: ['admin', 'isAuthenticated'], // Only persist these
  },
});
```

### Vue Router 4 (Routing)

**What it is:** Official routing library for Vue

**Why we use it:**
- Client-side navigation
- Route-based code splitting
- Navigation guards for auth
- Route meta for permissions

**Key features:**
- Nested routes with layouts
- Authentication guards
- Role-based access control
- Dynamic imports for code splitting

**Pattern:**
```typescript
{
  path: 'users',
  name: 'users',
  component: () => import('@admin/views/UsersView.vue'),
  meta: {
    title: 'Users',
    requiresAuth: true,
    requiredRole: 'admin' as AdminRole,
  },
}
```

### Tailwind CSS 4 (Styling)

**What it is:** Utility-first CSS framework

**Why we use it:**
- Rapid prototyping
- Consistent spacing/colors
- No CSS file clutter
- Responsive design utilities

**Common patterns:**
```vue
<!-- Flexbox layouts -->
<div class="flex items-center justify-between gap-4">

<!-- Grid layouts -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- Spacing -->
<div class="space-y-4">  <!-- Vertical spacing -->
<div class="mb-6">       <!-- Margin bottom -->

<!-- Typography -->
<h1 class="text-2xl font-bold text-gray-900">
<p class="text-sm text-gray-600">
```

### VueUse (Composition Utilities)

**What it is:** Collection of essential Vue composition utilities

**Why we use it:**
- Battle-tested composables
- Handles edge cases
- TypeScript support
- Tree-shakeable

**Common utilities:**
- `useDebounceFn` - Debounce function calls
- `useThrottleFn` - Throttle function calls
- `useAsyncState` - Async state management
- `useLocalStorage` - LocalStorage reactive wrapper

### TypeScript 5 (Type Safety)

**What it is:** Typed superset of JavaScript

**Why we use it:**
- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Safer refactoring

**Configuration:** Strict mode enabled

### Axios (HTTP Client)

**What it is:** Promise-based HTTP client

**Why we use it:**
- Request/response interceptors
- Request cancellation
- Automatic JSON transformation
- Better error handling than fetch

**Our wrapper:** `apiService` handles CSRF tokens and auth

### date-fns (Date Utilities)

**What it is:** Modern date utility library

**Why we use it:**
- Immutable & pure functions
- Tree-shakeable
- TypeScript support
- Better than moment.js

**Usage:** Via `useDateFormatter` composable

---

## Design System Guidelines

> **📖 Complete Styling Guide**: For comprehensive styling and design system documentation, see **[Admin Styling Guide](./admin-styling-guide.md)**

### Philosophy

**Consistency is key.** Follow established patterns unless there's a compelling reason to deviate.

**Important**: The styling guide provides detailed information on typography, colors, spacing, layout patterns, PrimeVue components, and accessibility. This section provides a quick reference, but refer to the full guide for complete details.

### Typography

**Default styling should NOT be changed** unless specifically required for:

1. **Text hierarchy** in multi-line content (headings vs body text)
2. **Emphasizing important information** (warnings, highlights)
3. **State representation** (error/success/warning messages)

**Why?**
- Visual consistency across the app
- PrimeVue components have built-in typography
- Tailwind provides semantic sizes
- Reduces decision fatigue

**Standard hierarchy:**
```vue
<!-- Page titles -->
<h1 class="text-2xl font-bold text-gray-900 mb-2">

<!-- Section headings -->
<h2 class="text-xl font-semibold text-gray-900 mb-4">

<!-- Sub-headings -->
<h3 class="text-lg font-medium text-gray-900">

<!-- Body text -->
<p class="text-gray-600">

<!-- Small text / captions -->
<small class="text-sm text-gray-500">

<!-- Error messages -->
<small class="text-red-500">
```

**When to deviate:**
```vue
<!-- ✅ Good reasons to change typography -->
<span class="text-xl font-bold text-blue-600">  <!-- Emphasize key metric -->
<p class="text-lg font-semibold">              <!-- Important callout -->
<span class="text-red-600 font-medium">       <!-- Error state -->

<!-- ❌ Avoid unnecessary changes -->
<p class="text-base text-gray-700">            <!-- Already default -->
<span class="text-md">                         <!-- Unnecessary -->
```

### Color Palette

**Semantic colors** - Use colors by meaning, not appearance:

| Purpose | Classes | When to Use |
|---------|---------|-------------|
| Primary | `text-blue-600`, `bg-blue-100` | Primary actions, links |
| Success | `text-green-600`, `bg-green-100` | Success states, active status |
| Warning | `text-yellow-600`, `bg-yellow-100` | Warnings, pending states |
| Danger | `text-red-600`, `bg-red-100` | Errors, destructive actions |
| Info | `text-blue-500`, `bg-blue-50` | Information, neutral highlights |
| Secondary | `text-gray-600`, `bg-gray-100` | Less important content |

**Status colors:**
```typescript
// Use status helpers composable
const { getStatusVariant } = useStatusHelpers();

// Returns: 'success', 'warning', 'danger', 'secondary'
const variant = getStatusVariant(user.status);
```

**Badge colors:**
```vue
<Badge variant="success" />  <!-- Active, enabled -->
<Badge variant="warning" />  <!-- Pending, inactive -->
<Badge variant="danger" />   <!-- Suspended, error -->
<Badge variant="info" />     <!-- Neutral status -->
<Badge variant="secondary" /> <!-- Default, unknown -->
```

### Spacing

**Consistent spacing** creates visual harmony:

| Spacing | Class | Use Case |
|---------|-------|----------|
| 4px | `gap-1`, `mb-1` | Tight spacing (icons + text) |
| 8px | `gap-2`, `mb-2` | Related elements (form labels) |
| 16px | `gap-4`, `mb-4` | Form fields, list items |
| 24px | `gap-6`, `mb-6` | Sections, cards |
| 32px | `gap-8`, `mb-8` | Major sections |

**Vertical spacing:**
```vue
<!-- Form fields -->
<div class="space-y-4">
  <div class="space-y-2">  <!-- Label + input -->
    <label>Name</label>
    <InputText />
  </div>
</div>

<!-- Page sections -->
<div class="mb-6">
  <h1>Title</h1>
</div>
<div class="space-y-6">  <!-- Multiple cards -->
  <Card />
  <Card />
</div>
```

**Horizontal spacing:**
```vue
<!-- Button groups -->
<div class="flex gap-2">
  <Button />
  <Button />
</div>

<!-- Toolbar -->
<div class="flex items-center justify-between gap-4">
  <InputText />
  <Button />
</div>
```

### Component Consistency

**Follow PrimeVue conventions:**

**Button variants:**
```vue
<!-- Primary action (default) -->
<Button label="Save" />

<!-- Secondary action -->
<Button label="Cancel" severity="secondary" outlined />

<!-- Destructive action -->
<Button label="Delete" severity="danger" />

<!-- Text button (less emphasis) -->
<Button icon="pi pi-eye" text rounded />
```

**Input states:**
```vue
<!-- Normal -->
<InputText v-model="value" />

<!-- Invalid (validation error) -->
<InputText v-model="value" :class="{ 'p-invalid': hasError }" />

<!-- Disabled -->
<InputText v-model="value" disabled />
```

### Responsive Design

**Mobile-first approach** with Tailwind breakpoints:

```vue
<!-- Stack on mobile, grid on desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- Flex direction changes -->
<div class="flex flex-col lg:flex-row gap-4">

<!-- Hide on mobile, show on desktop -->
<div class="hidden md:block">

<!-- Show on mobile, hide on desktop -->
<div class="block md:hidden">
```

**Breakpoints:**
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

---

## Development Workflow

### Complete Workflow for New Feature

Follow this step-by-step workflow when adding a new feature. Each step builds on the previous one.

#### Step 1: Plan the Feature

**Before writing code**, answer these questions:

- [ ] What data model do I need? (entities, types)
- [ ] What API endpoints are required?
- [ ] What permissions/roles are needed?
- [ ] Is the backend ready? If not, coordinate with backend team
- [ ] What are the UI requirements? (wireframes/mockups)

**Example:** Adding "Teams" feature
- Data: Team entity with name, members, status
- API: GET /teams (list), POST /teams (create), PUT /teams/:id (update)
- Permissions: All admins can view, only super_admin can create/delete
- UI: Table with modals for CRUD operations

#### Step 2: Create Type Definitions

Create types that match your API responses.

**File:** `types/feature.ts`

```typescript
/**
 * Team entity
 */
export interface Team {
  id: number;
  name: string;
  description: string | null;
  status: TeamStatus;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export type TeamStatus = 'active' | 'inactive' | 'archived';

/**
 * Create team request data
 */
export interface CreateTeamData {
  name: string;
  description?: string;
  status: TeamStatus;
}

/**
 * Update team request data
 */
export interface UpdateTeamData extends CreateTeamData {}

/**
 * API response for single team
 */
export interface TeamResponse {
  success: boolean;
  data: Team;
  message?: string;
}

/**
 * API response for paginated teams
 */
export interface TeamListResponse {
  data: Team[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}
```

#### Step 3: Create Service

**File:** `services/teamService.ts`

```typescript
import { apiService } from './api';
import { handleServiceError } from '@admin/utils/errorHandler';
import type {
  Team,
  TeamResponse,
  TeamListResponse,
  CreateTeamData,
  UpdateTeamData,
} from '@admin/types/team';

class TeamService {
  /**
   * Get paginated teams
   */
  async getTeams(
    page: number = 1,
    perPage: number = 15,
    signal?: AbortSignal
  ): Promise<TeamListResponse> {
    try {
      const response = await apiService.get<TeamListResponse>('/teams', {
        params: { page, per_page: perPage },
        signal,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Failed to fetch teams');
      }

      return response; // Return full pagination structure
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get single team by ID
   */
  async getTeam(id: number, signal?: AbortSignal): Promise<Team> {
    try {
      const response = await apiService.get<TeamResponse>(`/teams/${id}`, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch team');
      }

      return response.data; // Unwrap and return data
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Create new team
   */
  async createTeam(data: CreateTeamData, signal?: AbortSignal): Promise<Team> {
    try {
      const response = await apiService.post<TeamResponse>('/teams', data, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create team');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Update team
   */
  async updateTeam(id: number, data: UpdateTeamData, signal?: AbortSignal): Promise<Team> {
    try {
      const response = await apiService.put<TeamResponse>(`/teams/${id}`, data, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update team');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Delete team (soft delete)
   */
  async deleteTeam(id: number, signal?: AbortSignal): Promise<void> {
    try {
      const response = await apiService.delete<{ success: boolean; message?: string }>(
        `/teams/${id}`,
        { signal }
      );

      if (response && response.success === false) {
        throw new Error(response.message || 'Failed to delete team');
      }

      return; // Void return
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export singleton instance
export const teamService = new TeamService();
export default teamService;
```

#### Step 4: Create Composables (Optional)

**Only if you have feature-specific logic** that will be reused.

**File:** `composables/useTeamHelpers.ts`

```typescript
import type { TeamStatus } from '@admin/types/team';
import type { BadgeVariant } from '@admin/types/badge';

/**
 * Composable for team-related helper functions
 */
export function useTeamHelpers() {
  /**
   * Get human-readable label for team status
   */
  const getStatusLabel = (status: TeamStatus): string => {
    const labels: Record<TeamStatus, string> = {
      active: 'Active',
      inactive: 'Inactive',
      archived: 'Archived',
    };
    return labels[status];
  };

  /**
   * Get badge variant for team status
   */
  const getStatusVariant = (status: TeamStatus): BadgeVariant => {
    const variants: Record<TeamStatus, BadgeVariant> = {
      active: 'success',
      inactive: 'secondary',
      archived: 'warning',
    };
    return variants[status];
  };

  /**
   * Get icon for team status
   */
  const getStatusIcon = (status: TeamStatus): string => {
    const icons: Record<TeamStatus, string> = {
      active: 'pi-check-circle',
      inactive: 'pi-circle',
      archived: 'pi-archive',
    };
    return icons[status];
  };

  return {
    getStatusLabel,
    getStatusVariant,
    getStatusIcon,
  };
}
```

#### Step 5: Create Table Component

**File:** `components/Team/TeamsTable.vue`

```vue
<template>
  <DataTable
    :value="teams"
    :loading="loading"
    :rows="rowsPerPage"
    :paginator="true"
    :rows-per-page-options="[10, 15, 25, 50]"
    :total-records="totalRecords"
    :lazy="true"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    current-page-report-template="Showing {first} to {last} of {totalRecords} teams"
    striped-rows
    responsive-layout="scroll"
    @page="handlePage"
  >
    <template #empty>
      <EmptyState message="No teams found" />
    </template>

    <template #loading>
      <LoadingState message="Loading teams..." />
    </template>

    <Column field="id" header="ID" :sortable="true" style="min-width: 80px" />

    <Column field="name" header="Name" :sortable="true" style="min-width: 200px" />

    <Column field="member_count" header="Members" style="min-width: 100px">
      <template #body="{ data }">
        {{ data.member_count }}
      </template>
    </Column>

    <Column field="status" header="Status" style="min-width: 120px">
      <template #body="{ data }">
        <Badge
          :text="getStatusLabel(data.status)"
          :variant="getStatusVariant(data.status)"
          :icon="getStatusIcon(data.status)"
        />
      </template>
    </Column>

    <Column field="created_at" header="Created" style="min-width: 180px">
      <template #body="{ data }">
        {{ formatDate(data.created_at) }}
      </template>
    </Column>

    <Column header="Actions" :exportable="false" style="min-width: 140px">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            v-tooltip.top="'View'"
            icon="pi pi-eye"
            text
            rounded
            severity="info"
            size="small"
            @click="handleView(data)"
          />
          <Button
            v-if="canEdit"
            v-tooltip.top="'Edit'"
            icon="pi pi-pencil"
            text
            rounded
            severity="secondary"
            size="small"
            @click="handleEdit(data)"
          />
          <Button
            v-if="canDelete"
            v-tooltip.top="'Delete'"
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            @click="handleDelete(data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Badge from '@admin/components/common/Badge.vue';
import EmptyState from '@admin/components/common/EmptyState.vue';
import LoadingState from '@admin/components/common/LoadingState.vue';
import { useTeamHelpers } from '@admin/composables/useTeamHelpers';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import type { Team } from '@admin/types/team';
import type { DataTablePageEvent } from '@admin/types/primevue';

interface Props {
  teams: Team[];
  loading?: boolean;
  totalRecords: number;
  rowsPerPage: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface Emits {
  (event: 'view', team: Team): void;
  (event: 'edit', team: Team): void;
  (event: 'delete', team: Team): void;
  (event: 'page', pageEvent: DataTablePageEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  canEdit: true,
  canDelete: true,
});

const emit = defineEmits<Emits>();

const { getStatusLabel, getStatusVariant, getStatusIcon } = useTeamHelpers();
const { formatDate } = useDateFormatter();

const handleView = (team: Team): void => {
  emit('view', team);
};

const handleEdit = (team: Team): void => {
  emit('edit', team);
};

const handleDelete = (team: Team): void => {
  emit('delete', team);
};

const handlePage = (event: DataTablePageEvent): void => {
  emit('page', event);
};
</script>
```

#### Step 6: Create Modal Components

Create modals for each operation: view, create, edit, delete.

**File:** `components/Team/modals/CreateTeamModal.vue`

```vue
<template>
  <BaseModal
    :visible="visible"
    :width="'600px'"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <h2 class="text-xl font-semibold">Create Team</h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="space-y-2">
        <label for="name" class="block text-sm font-medium text-gray-700">
          Name <span class="text-red-500">*</span>
        </label>
        <InputText
          id="name"
          v-model="formData.name"
          :class="{ 'p-invalid': validationErrors.name }"
          class="w-full"
          placeholder="Enter team name"
        />
        <small v-if="validationErrors.name" class="text-red-500">
          {{ validationErrors.name[0] }}
        </small>
      </div>

      <div class="space-y-2">
        <label for="description" class="block text-sm font-medium text-gray-700">
          Description
        </label>
        <Textarea
          id="description"
          v-model="formData.description"
          :class="{ 'p-invalid': validationErrors.description }"
          class="w-full"
          rows="3"
          placeholder="Optional description"
        />
        <small v-if="validationErrors.description" class="text-red-500">
          {{ validationErrors.description[0] }}
        </small>
      </div>

      <div class="space-y-2">
        <label for="status" class="block text-sm font-medium text-gray-700">
          Status <span class="text-red-500">*</span>
        </label>
        <Select
          id="status"
          v-model="formData.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          :class="{ 'p-invalid': validationErrors.status }"
          class="w-full"
          placeholder="Select status"
        />
        <small v-if="validationErrors.status" class="text-red-500">
          {{ validationErrors.status[0] }}
        </small>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          @click="emit('cancel')"
          :disabled="saving"
        />
        <Button
          label="Create"
          @click="handleSubmit"
          :loading="saving"
          :disabled="saving"
        />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import type { CreateTeamData, TeamStatus } from '@admin/types/team';

interface Props {
  visible: boolean;
  saving?: boolean;
}

interface Emits {
  (event: 'update:visible', value: boolean): void;
  (event: 'save', data: CreateTeamData): void;
  (event: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
});

const emit = defineEmits<Emits>();

const formData = ref<CreateTeamData>({
  name: '',
  description: '',
  status: 'active',
});

const validationErrors = ref<Record<string, string[]>>({});

const statusOptions = [
  { label: 'Active', value: 'active' as TeamStatus },
  { label: 'Inactive', value: 'inactive' as TeamStatus },
];

// Reset form when modal closes
watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible) {
      formData.value = {
        name: '',
        description: '',
        status: 'active',
      };
      validationErrors.value = {};
    }
  }
);

const handleSubmit = (): void => {
  emit('save', formData.value);
};

// Expose method for parent to set validation errors
const setValidationErrors = (errors: Record<string, string[]>): void => {
  validationErrors.value = errors;
};

defineExpose({ setValidationErrors });
</script>
```

**Repeat for:**
- `ViewTeamModal.vue` (read-only display)
- `EditTeamModal.vue` (similar to create, but pre-filled)
- `DeleteTeamModal.vue` (confirmation dialog)

#### Step 7: Create View Component

**File:** `views/TeamsView.vue`

```vue
<template>
  <div class="teams-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Teams</h1>
      <p class="text-gray-600">Manage application teams</p>
    </div>

    <!-- Initial Loading Skeleton -->
    <div v-if="initialLoading" class="space-y-6">
      <Card>
        <template #content>
          <Skeleton height="4rem" />
        </template>
      </Card>
      <Card>
        <template #content>
          <Skeleton height="20rem" />
        </template>
      </Card>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Toolbar -->
      <Card>
        <template #content>
          <div class="flex flex-col md:flex-row justify-between gap-4">
            <InputText
              v-model="searchQuery"
              placeholder="Search teams..."
              class="w-full md:w-80"
            />
            <Button
              label="Add Team"
              icon="pi pi-plus"
              @click="openCreateDialog"
            />
          </div>
        </template>
      </Card>

      <!-- Data Table -->
      <Card :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }">
        <template #content>
          <TeamsTable
            :teams="teams"
            :loading="loading"
            :total-records="totalRecords"
            :rows-per-page="rowsPerPage"
            :can-edit="canEdit"
            :can-delete="canDelete"
            @view="viewTeam"
            @edit="editTeam"
            @delete="confirmDeleteTeam"
            @page="onPage"
          />
        </template>
      </Card>
    </div>

    <!-- Modals -->
    <ViewTeamModal
      v-model:visible="viewDialogVisible"
      :team="selectedTeam"
    />

    <CreateTeamModal
      ref="createModalRef"
      v-model:visible="createDialogVisible"
      :saving="creating"
      @save="handleCreateTeam"
      @cancel="createDialogVisible = false"
    />

    <EditTeamModal
      ref="editModalRef"
      v-model:visible="editDialogVisible"
      :team="selectedTeam"
      :saving="saving"
      @save="handleUpdateTeam"
      @cancel="editDialogVisible = false"
    />

    <DeleteTeamModal
      v-model:visible="deleteDialogVisible"
      :team="selectedTeam"
      :deleting="deleting"
      @delete="handleDeleteTeam"
      @cancel="deleteDialogVisible = false"
    />

    <!-- Toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import {
  hasValidationErrors,
  getValidationErrors,
  isRequestCancelled,
  getErrorMessage,
} from '@admin/types/errors';
import { PAGINATION } from '@admin/constants/pagination';
import type { Team, CreateTeamData, UpdateTeamData } from '@admin/types/team';
import type { DataTablePageEvent } from '@admin/types/primevue';
import { teamService } from '@admin/services/teamService';

import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';
import TeamsTable from '@admin/components/Team/TeamsTable.vue';
import ViewTeamModal from '@admin/components/Team/modals/ViewTeamModal.vue';
import CreateTeamModal from '@admin/components/Team/modals/CreateTeamModal.vue';
import EditTeamModal from '@admin/components/Team/modals/EditTeamModal.vue';
import DeleteTeamModal from '@admin/components/Team/modals/DeleteTeamModal.vue';

// State
const teams = ref<Team[]>([]);
const selectedTeam = ref<Team | null>(null);
const searchQuery = ref('');

// Loading states
const initialLoading = ref(true);
const loading = ref(false);
const creating = ref(false);
const saving = ref(false);
const deleting = ref(false);

// Pagination
const currentPage = ref(PAGINATION.DEFAULT_PAGE);
const rowsPerPage = ref(PAGINATION.DEFAULT_PAGE_SIZE);
const totalRecords = ref(0);

// Modal visibility
const viewDialogVisible = ref(false);
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

// Modal refs
const createModalRef = ref<InstanceType<typeof CreateTeamModal> | null>(null);
const editModalRef = ref<InstanceType<typeof EditTeamModal> | null>(null);

// Composables
const toast = useToast();
const adminStore = useAdminStore();
const { hasRoleAccess, getRoleLevel } = useRoleHelpers();
const { getSignal, cancel } = useRequestCancellation();

// Permissions
const canEdit = computed(() => hasRoleAccess(adminStore.adminRole, 'admin'));
const canDelete = computed(() => hasRoleAccess(adminStore.adminRole, 'super_admin'));

// Load teams
const loadTeams = async (): Promise<void> => {
  loading.value = true;
  try {
    cancel('Loading new page');
    const response = await teamService.getTeams(
      currentPage.value,
      rowsPerPage.value,
      getSignal()
    );
    teams.value = response.data;
    totalRecords.value = response.meta.total;
  } catch (error) {
    if (isRequestCancelled(error)) return;

    const message = getErrorMessage(error, 'Failed to load teams');
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
};

// Pagination handler
const onPage = (event: DataTablePageEvent): void => {
  currentPage.value = event.page + 1; // PrimeVue uses 0-based index
  rowsPerPage.value = event.rows;
  loadTeams();
};

// View team
const viewTeam = (team: Team): void => {
  selectedTeam.value = team;
  viewDialogVisible.value = true;
};

// Open create dialog
const openCreateDialog = (): void => {
  createDialogVisible.value = true;
};

// Create team
const handleCreateTeam = async (data: CreateTeamData): Promise<void> => {
  creating.value = true;
  try {
    await teamService.createTeam(data);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Team created successfully',
      life: 3000,
    });

    await loadTeams();
    createDialogVisible.value = false;
  } catch (error) {
    if (isRequestCancelled(error)) return;

    if (hasValidationErrors(error)) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors && createModalRef.value) {
        createModalRef.value.setValidationErrors(validationErrors);
      }
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please correct the errors in the form',
        life: 5000,
      });
    } else {
      const message = getErrorMessage(error, 'Failed to create team');
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      });
    }
  } finally {
    creating.value = false;
  }
};

// Edit team
const editTeam = (team: Team): void => {
  selectedTeam.value = team;
  editDialogVisible.value = true;
};

// Update team
const handleUpdateTeam = async (data: UpdateTeamData): Promise<void> => {
  if (!selectedTeam.value) return;

  saving.value = true;
  try {
    await teamService.updateTeam(selectedTeam.value.id, data);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Team updated successfully',
      life: 3000,
    });

    await loadTeams();
    editDialogVisible.value = false;
  } catch (error) {
    if (isRequestCancelled(error)) return;

    if (hasValidationErrors(error)) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors && editModalRef.value) {
        editModalRef.value.setValidationErrors(validationErrors);
      }
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please correct the errors in the form',
        life: 5000,
      });
    } else {
      const message = getErrorMessage(error, 'Failed to update team');
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      });
    }
  } finally {
    saving.value = false;
  }
};

// Confirm delete
const confirmDeleteTeam = (team: Team): void => {
  selectedTeam.value = team;
  deleteDialogVisible.value = true;
};

// Delete team
const handleDeleteTeam = async (): Promise<void> => {
  if (!selectedTeam.value) return;

  deleting.value = true;
  try {
    await teamService.deleteTeam(selectedTeam.value.id);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Team deleted successfully',
      life: 3000,
    });

    await loadTeams();
    deleteDialogVisible.value = false;
  } catch (error) {
    if (isRequestCancelled(error)) return;

    const message = getErrorMessage(error, 'Failed to delete team');
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000,
    });
  } finally {
    deleting.value = false;
  }
};

// Load data on mount
onMounted(async () => {
  await loadTeams();
  initialLoading.value = false;
});
</script>
```

#### Step 8: Add Route

**File:** `router/index.ts`

```typescript
{
  path: 'teams',
  name: 'teams',
  component: () => import('@admin/views/TeamsView.vue'),
  meta: {
    title: 'Teams',
    breadcrumb: [{ label: 'Teams' }],
    requiresAuth: true,
    requiredRole: 'admin' as AdminRole, // Only admins and super admins
  },
}
```

#### Step 9: Add Navigation

**File:** `components/layout/AppSidebar.vue`

Add to sidebar menu items:

```typescript
{
  label: 'Teams',
  icon: 'pi pi-users',
  route: '/teams',
}
```

#### Step 10: Write Tests

Create tests for service, composables, table, and view.

**File:** `services/__tests__/teamService.spec.ts`

**File:** `composables/__tests__/useTeamHelpers.spec.ts`

**File:** `components/Team/__tests__/TeamsTable.spec.ts`

**File:** `views/__tests__/TeamsView.spec.ts`

#### Step 11: Run Tests

```bash
npm run test:admin
```

#### Step 12: Test in Browser

```bash
npm run dev
```

Navigate to `http://YOUR_DOMAIN.localhost/teams`

---

## Component Patterns

### View Components (Pages)

**Purpose:** Orchestrate features, manage data, coordinate child components

**Responsibilities:**
- Load data from services
- Manage modal visibility
- Handle CRUD operations
- Display toast notifications
- Pass data to child components via props
- Handle events from child components

**Structure:**
```vue
<template>
  <div class="feature-view">
    <!-- Header -->
    <div class="mb-6">
      <h1>Title</h1>
      <p>Description</p>
    </div>

    <!-- Initial Loading (Skeleton) -->
    <div v-if="initialLoading">
      <Skeleton />
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Toolbar -->
      <Card>
        <template #content>
          <!-- Search, filters, actions -->
        </template>
      </Card>

      <!-- Data Table -->
      <Card>
        <template #content>
          <DataTable @action="handleAction" />
        </template>
      </Card>
    </div>

    <!-- Modals -->
    <CreateModal />
    <EditModal />
    <DeleteModal />

    <!-- Toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
// State management
// Data loading
// Event handlers
// Lifecycle hooks
</script>
```

**Key patterns:**
- Separate `initialLoading` (skeleton) and `loading` (spinner)
- Use `onMounted` for initial data load
- Handle pagination with 0-to-1 index conversion
- Toast for errors and success messages
- Modal refs for setting validation errors

**Example:** `/var/www/resources/admin/js/views/AdminUsersView.vue`

### Table Components

**Purpose:** Display data in paginated tables with actions

**Responsibilities:**
- Render data rows
- Emit events for user actions
- Display empty/loading states
- Handle pagination events

**Structure:**
```vue
<template>
  <DataTable
    :value="items"
    :loading="loading"
    :lazy="true"
    @page="handlePage"
  >
    <template #empty>
      <EmptyState />
    </template>

    <template #loading>
      <LoadingState />
    </template>

    <Column field="name" header="Name" />
    <Column header="Actions">
      <template #body="{ data }">
        <Button @click="emit('edit', data)" />
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
interface Props {
  items: Item[];
  loading: boolean;
}

interface Emits {
  (event: 'edit', item: Item): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>
```

**Key patterns:**
- Use composables for formatting (dates, names, status)
- Action buttons with tooltips
- Conditional rendering based on permissions
- Strongly typed props and emits

**Example:** `/var/www/resources/admin/js/components/AdminUser/AdminUsersTable.vue`

### Modal Components

**Purpose:** Display dialogs for CRUD operations

**Responsibilities:**
- Display form fields
- Handle form submission
- Show validation errors
- Emit save/cancel events

**Structure:**
```vue
<template>
  <BaseModal :visible="visible" @update:visible="emit('update:visible', $event)">
    <template #header>
      <h2>Edit Item</h2>
    </template>

    <form @submit.prevent="handleSubmit">
      <div class="space-y-2">
        <label>Name</label>
        <InputText
          v-model="formData.name"
          :class="{ 'p-invalid': validationErrors.name }"
        />
        <small v-if="validationErrors.name">
          {{ validationErrors.name[0] }}
        </small>
      </div>
    </form>

    <template #footer>
      <Button label="Cancel" @click="emit('cancel')" />
      <Button label="Save" @click="handleSubmit" :loading="saving" />
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
const formData = ref({ name: '' });
const validationErrors = ref({});

// Watch props.item to populate form
watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value = { ...newItem };
    validationErrors.value = {};
  }
});

// Expose for parent to set errors
const setValidationErrors = (errors) => {
  validationErrors.value = errors;
};

defineExpose({ setValidationErrors });
</script>
```

**Key patterns:**
- Extend `BaseModal` for consistency
- Watch item prop to populate form
- Expose `setValidationErrors` method
- Clear errors on item change
- Disable buttons during save

**Example:** `/var/www/resources/admin/js/components/AdminUser/modals/EditAdminUserModal.vue`

### Common Components

**Badge** - Status indicators

```vue
<Badge
  text="Active"
  variant="success"
  icon="pi-check-circle"
  size="sm"
/>
```

**EmptyState** - Empty table placeholder

```vue
<EmptyState message="No items found" />
```

**LoadingState** - Loading indicator

```vue
<LoadingState message="Loading items..." />
```

**BaseModal** - Reusable modal wrapper

```vue
<BaseModal :visible="visible" width="600px">
  <template #header>Title</template>
  <template #default>Content</template>
  <template #footer>Buttons</template>
</BaseModal>
```

---

## Composables Deep Dive

Composables are the heart of reusable logic. They encapsulate stateful logic that can be shared across components.

### Available Composables

#### useModal

**Purpose:** Manage modal visibility with lifecycle callbacks

**Use when:** You need open/close callbacks or confirm-before-close logic

```typescript
const { visible, openModal, closeModal } = useModal({
  onOpen: () => console.log('Opened'),
  onClose: () => console.log('Closed'),
  confirmClose: true,
  hasUnsavedChanges: () => isDirty.value,
});
```

#### useAsyncAction

**Purpose:** Handle async operations with automatic loading state

**Use when:** You need to track loading state and handle success/error callbacks

```typescript
const { execute, isLoading, error, data } = useAsyncAction<User>();

const createUser = async () => {
  await execute(
    () => userService.createUser(formData.value),
    {
      onSuccess: (user) => {
        toast.add({ severity: 'success', detail: 'Created!' });
      },
      onError: (error) => {
        showErrorToast(error);
      },
    }
  );
};
```

#### useErrorToast

**Purpose:** Display consistent error/success toast notifications

**Use when:** You need to show error or success messages

```typescript
const { showErrorToast, showSuccessToast, hasValidationErrors } = useErrorToast();

try {
  await userService.createUser(data);
  showSuccessToast('User created successfully');
} catch (error) {
  if (hasValidationErrors(error)) {
    showErrorToast(error, 'Validation failed', {
      showValidationErrors: true,
    });
  } else {
    showErrorToast(error, 'Failed to create user');
  }
}
```

#### useDateFormatter

**Purpose:** Format dates consistently

**Use when:** Displaying any date/timestamp

```typescript
const { formatDate } = useDateFormatter();

formatDate(user.created_at); // "4:43pm 3rd Aug 25"
formatDate(null); // "Never"
formatDate('invalid'); // "Invalid date"
```

#### useNameHelpers

**Purpose:** Extract and format names from entities

**Use when:** Displaying user/admin names or initials

```typescript
const { getFullName, getFirstName, getLastName, getUserInitials } = useNameHelpers();

getFullName(admin); // "John Doe"
getUserInitials(admin); // "JD"
```

#### useRoleHelpers

**Purpose:** Role-based access control

**Use when:** Checking permissions or displaying role badges

```typescript
const { hasRoleAccess, getRoleLevel, getRoleLabel, getRoleBadgeVariant } = useRoleHelpers();

// Check permission
if (hasRoleAccess(currentRole, 'admin')) {
  // Can edit
}

// Display role
<Badge
  :text="getRoleLabel(admin.role)"
  :variant="getRoleBadgeVariant(admin.role)"
/>
```

#### useStatusHelpers

**Purpose:** Work with status values

**Use when:** Displaying status badges or checking status

```typescript
const { getStatusLabel, getStatusVariant, getStatusIcon, isActive } = useStatusHelpers();

// Display status
<Badge
  :text="getStatusLabel(user.status)"
  :variant="getStatusVariant(user.status)"
  :icon="getStatusIcon(user.status)"
/>

// Check status
if (isActive(user.status)) {
  // User can login
}
```

#### useRequestCancellation

**Purpose:** Cancel pending API requests

**Use when:** Loading paginated data or handling search

```typescript
const { getSignal, cancel } = useRequestCancellation();

const loadUsers = async () => {
  cancel('Loading new page'); // Cancel previous request
  const response = await userService.getUsers(page, perPage, getSignal());
};
```

#### useAdminUserModals

**Purpose:** Comprehensive modal management for CRUD operations

**Use when:** Building complex features with multiple related modals

```typescript
const {
  viewDialogVisible,
  editDialogVisible,
  createDialogVisible,
  deleteDialogVisible,
  selectedAdminUser,
  saving,
  creating,
  deleting,
  openCreateDialog,
  openEditDialog,
  handleCreate,
  handleSave,
  handleDelete,
} = useAdminUserModals({
  toast,
  onReload: loadAdminUsers,
  currentRoleLevel,
});
```

**Features:**
- Complete CRUD operations
- Validation error handling
- Loading state management
- Modal chaining (view → edit)
- Request cancellation
- Automatic data refresh

### Creating New Composables

**When to create:**
- Logic used in 2+ components
- Complex logic cluttering components
- Logic needing isolated testing
- Stateful logic requiring reactivity

**Template:**
```typescript
/**
 * Composable for [description]
 *
 * @param options - Configuration options
 * @returns Composable functions and state
 *
 * @example
 * ```typescript
 * const { myFunction } = useMyFeature();
 * myFunction('example');
 * ```
 */
export function useMyFeature(options?: MyFeatureOptions) {
  /**
   * [Description of what this function does]
   *
   * @param param - Parameter description
   * @returns Return value description
   */
  const myFunction = (param: string): string => {
    // Implementation
    return result;
  };

  return {
    myFunction,
  };
}
```

**Checklist:**
- [ ] JSDoc comments
- [ ] TypeScript types
- [ ] Unit tests
- [ ] Used in at least one component

---

## Services & API Integration

Services handle **all API communication**. They provide a clean interface between components and the backend.

### Service Responsibilities

1. **Make HTTP requests** via `apiService`
2. **Unwrap response data** - Return actual data, not wrappers
3. **Handle errors** - Use `handleServiceError`
4. **Support request cancellation** - Accept `AbortSignal`
5. **Type responses** - Strong TypeScript types

### Service Pattern

```typescript
import { apiService } from './api';
import { handleServiceError } from '@admin/utils/errorHandler';
import type { Item, ItemResponse, ItemListResponse } from '@admin/types/item';

class ItemService {
  /**
   * Get paginated items
   */
  async getItems(
    page: number = 1,
    perPage: number = 15,
    signal?: AbortSignal
  ): Promise<ItemListResponse> {
    try {
      const response = await apiService.get<ItemListResponse>('/items', {
        params: { page, per_page: perPage },
        signal,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Failed to fetch items');
      }

      return response; // Return full pagination structure
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get single item by ID
   */
  async getItem(id: number, signal?: AbortSignal): Promise<Item> {
    try {
      const response = await apiService.get<ItemResponse>(`/items/${id}`, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch item');
      }

      return response.data; // Unwrap and return data
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Create item
   */
  async createItem(data: CreateItemData, signal?: AbortSignal): Promise<Item> {
    try {
      const response = await apiService.post<ItemResponse>('/items', data, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create item');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Update item
   */
  async updateItem(id: number, data: UpdateItemData, signal?: AbortSignal): Promise<Item> {
    try {
      const response = await apiService.put<ItemResponse>(`/items/${id}`, data, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update item');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Delete item
   */
  async deleteItem(id: number, signal?: AbortSignal): Promise<void> {
    try {
      const response = await apiService.delete<{ success: boolean; message?: string }>(
        `/items/${id}`,
        { signal }
      );

      if (response && response.success === false) {
        throw new Error(response.message || 'Failed to delete item');
      }

      return; // Void return
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export singleton
export const itemService = new ItemService();
export default itemService;
```

### Key Patterns

#### Response Unwrapping

**ALWAYS unwrap `response.data`:**

```typescript
// ✅ CORRECT - Returns unwrapped data
async getItem(id: number): Promise<Item> {
  const response = await apiService.get<ItemResponse>(`/items/${id}`);
  return response.data; // Return Item, not ItemResponse
}

// ❌ WRONG - Returns wrapper
async getItem(id: number): Promise<ItemResponse> {
  return await apiService.get<ItemResponse>(`/items/${id}`);
}
```

**Why?** Components shouldn't know about API response structure. They want the data, not the wrapper.

#### Pagination Response

For paginated endpoints, return the **full pagination structure**:

```typescript
async getItems(page: number, perPage: number): Promise<PaginatedResponse<Item>> {
  const response = await apiService.get<PaginatedResponse<Item>>('/items', {
    params: { page, per_page: perPage },
  });

  return response; // Return { data, meta, links }
}
```

**Why?** Views need pagination metadata (total, current page, etc.)

#### Error Handling

**ALWAYS use `handleServiceError`:**

```typescript
try {
  // API call
} catch (error) {
  handleServiceError(error); // Centralized error handling
}
```

**What it does:**
- Silently ignores cancelled requests
- Preserves validation errors (422) for form handling
- Converts other errors to `ApplicationError`
- Always throws (never returns)

**Why?** Consistent error handling across all services

#### Request Cancellation

Support `AbortSignal` for request cancellation:

```typescript
async getItems(page: number, perPage: number, signal?: AbortSignal): Promise<Item[]> {
  const response = await apiService.get('/items', {
    params: { page, per_page: perPage },
    signal, // Pass to axios
  });
  return response.data;
}
```

**Why?** Prevents memory leaks and race conditions

### Response Type Patterns

#### Single Resource

```typescript
export interface ItemResponse {
  success: boolean;
  data: Item;
  message?: string;
}
```

#### List (Non-Paginated)

```typescript
export interface ItemListResponse {
  success: boolean;
  data: Item[];
  message?: string;
}
```

#### Paginated List

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}
```

#### Void Operations

```typescript
export interface DeleteResponse {
  success: boolean;
  message?: string;
}
```

---

## State Management

Use Pinia stores for **global state only**. Prefer local component state for component-specific data.

### When to Use Stores

**Use Pinia when:**
- Authentication state (current admin user)
- Global UI state (sidebar visibility, theme)
- Shared data across unrelated components
- Data needing persistence (sessionStorage/localStorage)

**Use local state when:**
- Component-specific data (form values, modal visibility)
- Data passed via props
- Temporary UI state (hover, focus)

**Why?** Global state should be minimal. Too much global state makes testing harder and creates hidden dependencies.

### Store Pattern

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useFeatureStore = defineStore(
  'feature',
  () => {
    // State
    const data = ref<Data | null>(null);
    const isLoading = ref(false);

    // Getters
    const hasData = computed(() => data.value !== null);

    // Actions
    async function loadData(): Promise<void> {
      isLoading.value = true;
      try {
        const result = await featureService.getData();
        data.value = result;
      } finally {
        isLoading.value = false;
      }
    }

    function clearData(): void {
      data.value = null;
    }

    return {
      // State
      data,
      isLoading,

      // Getters
      hasData,

      // Actions
      loadData,
      clearData,
    };
  },
  {
    // Optional persistence
    persist: {
      storage: sessionStorage,
      pick: ['data'], // Only persist these
    },
  }
);
```

### Using Stores in Components

```typescript
import { useFeatureStore } from '@admin/stores/featureStore';

const featureStore = useFeatureStore();

// Access state
console.log(featureStore.data);

// Access getters
if (featureStore.hasData) {
  // ...
}

// Call actions
await featureStore.loadData();

// Watch state
watch(() => featureStore.data, (newData) => {
  console.log('Data changed:', newData);
});
```

### Persistence Pattern

Use `pinia-plugin-persistedstate` for session/local storage:

```typescript
{
  persist: {
    storage: sessionStorage, // or localStorage
    pick: ['admin', 'isAuthenticated'], // Only persist these
  },
}
```

**Do NOT persist:**
- Promises
- Loading states
- Temporary UI state

**Example:** Admin Store persists `admin` and `isAuthenticated`, but not `isLoading`

---

## Routing & Navigation

Vue Router handles client-side navigation with authentication and role-based access control.

### Route Definition

```typescript
{
  path: 'feature',
  name: 'feature',
  component: () => import('@admin/views/FeatureView.vue'),
  meta: {
    title: 'Feature',
    breadcrumb: [{ label: 'Feature' }],
    requiresAuth: true,
    requiredRole: 'admin' as AdminRole,
  },
}
```

### Route Meta Fields

| Field | Type | Purpose |
|-------|------|---------|
| `title` | `string` | Page title (appears as "Title - Admin Dashboard") |
| `breadcrumb` | `Array` | Breadcrumb trail |
| `requiresAuth` | `boolean` | Requires authentication (redirects to login) |
| `requiredRole` | `AdminRole` | Minimum role required (redirects to dashboard if insufficient) |
| `isPublic` | `boolean` | Public route (no auth required) |

### Navigation Guards

Global guard in `router/index.ts` handles:

1. **Page title updates** - Sets document title
2. **Authentication check** - Calls `checkAuth()` API
3. **Role-based access** - Checks minimum required role
4. **Login redirect** - Saves return URL in query param

**Flow:**
```
User visits /users
↓
Guard checks: requiresAuth = true
↓
Guard checks: isAuthenticated?
  → No: checkAuth() from API
    → Success: Continue
    → Fail: Redirect to /login?redirect=/users
↓
Guard checks: requiredRole = 'admin'?
  → hasRoleAccess(currentRole, 'admin')
    → Yes: Allow navigation
    → No: Redirect to / (dashboard)
```

### Programmatic Navigation

```typescript
import { useRouter } from 'vue-router';

const router = useRouter();

// Navigate to route
router.push({ name: 'users' });

// Navigate with params
router.push({ name: 'user-detail', params: { id: user.id } });

// Navigate with query
router.push({ name: 'users', query: { status: 'active' } });

// Go back
router.back();
```

---

## Error Handling

Consistent error handling across all layers.

### Service Layer

**Always use `handleServiceError`:**

```typescript
try {
  const response = await apiService.post('/items', data);
  return response.data;
} catch (error) {
  handleServiceError(error); // Centralized handling
}
```

**What it does:**
- Silently ignores cancelled requests (returns, doesn't throw)
- Preserves validation errors (422) for form handling (throws original error)
- Converts other errors to `ApplicationError` (throws new error)

### View Layer

**Pattern:**

```typescript
import {
  hasValidationErrors,
  getValidationErrors,
  isRequestCancelled,
  getErrorMessage,
} from '@admin/types/errors';
import { useErrorToast } from '@admin/composables/useErrorToast';

const { showErrorToast, showSuccessToast } = useErrorToast();

const createItem = async (formData: CreateItemData): Promise<void> => {
  creating.value = true;
  try {
    await itemService.createItem(formData);

    showSuccessToast('Item created successfully');
    await loadItems();
    createDialogVisible.value = false;
  } catch (error) {
    // Silently ignore cancelled requests
    if (isRequestCancelled(error)) {
      return;
    }

    // Handle validation errors
    if (hasValidationErrors(error)) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors && createModalRef.value) {
        createModalRef.value.setValidationErrors(validationErrors);
      }
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please correct the errors in the form',
        life: 5000,
      });
    } else {
      // Handle other errors
      const message = getErrorMessage(error, 'Failed to create item');
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      });
    }
  } finally {
    creating.value = false;
  }
};
```

### Modal Validation Errors

**Modal exposes method:**

```vue
<script setup lang="ts">
const validationErrors = ref<Record<string, string[]>>({});

const setValidationErrors = (errors: Record<string, string[]>): void => {
  validationErrors.value = errors;
};

defineExpose({ setValidationErrors });

// Clear when item changes
watch(() => props.item, () => {
  validationErrors.value = {};
});
</script>

<template>
  <InputText
    v-model="formData.name"
    :class="{ 'p-invalid': validationErrors.name }"
  />
  <small v-if="validationErrors.name" class="text-red-500">
    {{ validationErrors.name[0] }}
  </small>
</template>
```

**Parent sets errors:**

```typescript
try {
  await itemService.createItem(formData);
} catch (error) {
  if (hasValidationErrors(error)) {
    const errors = getValidationErrors(error);
    if (errors && createModalRef.value) {
      createModalRef.value.setValidationErrors(errors);
    }
  }
}
```

### Toast Notifications

**Use constants for consistency:**

```typescript
import { ERROR_MESSAGES, SUCCESS_MESSAGES, TOAST_LIFE } from '@admin/constants/messages';

// Success
toast.add({
  severity: 'success',
  summary: 'Success',
  detail: SUCCESS_MESSAGES.CREATED('User'),
  life: TOAST_LIFE.SHORT,
});

// Error
toast.add({
  severity: 'error',
  summary: 'Error',
  detail: ERROR_MESSAGES.CREATE_FAILED('user'),
  life: TOAST_LIFE.STANDARD,
});
```

---

## Testing

Write comprehensive tests for components, composables, and services.

### Test File Location

Co-locate tests with source code or use `__tests__/` directories:

```
components/
├── Team/
│   ├── TeamsTable.vue
│   └── __tests__/
│       └── TeamsTable.spec.ts
composables/
├── useTeamHelpers.ts
└── __tests__/
    └── useTeamHelpers.spec.ts
```

### Component Testing

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TeamsTable from '../TeamsTable.vue';
import type { Team } from '@admin/types/team';

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div class="datatable"><slot /></div>',
  },
}));

// Mock composables
vi.mock('@admin/composables/useDateFormatter', () => ({
  useDateFormatter: () => ({
    formatDate: (date: string | null) => (date ? 'Jan 1, 2024' : '-'),
  }),
}));

describe('TeamsTable', () => {
  const mockTeams: Team[] = [
    {
      id: 1,
      name: 'Test Team',
      status: 'active',
      member_count: 5,
      created_at: '2025-10-14T12:00:00.000000Z',
      updated_at: '2025-10-14T12:00:00.000000Z',
    },
  ];

  const defaultProps = {
    teams: mockTeams,
    loading: false,
    totalRecords: 1,
    rowsPerPage: 10,
  };

  it('renders table with teams', () => {
    const wrapper = mount(TeamsTable, {
      props: defaultProps,
    });

    expect(wrapper.find('.datatable').exists()).toBe(true);
  });

  it('emits view event when view button clicked', async () => {
    const wrapper = mount(TeamsTable, {
      props: defaultProps,
    });

    await wrapper.vm.$emit('view', mockTeams[0]);

    expect(wrapper.emitted('view')).toBeTruthy();
    expect(wrapper.emitted('view')?.[0]).toEqual([mockTeams[0]]);
  });
});
```

### Service Testing

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { teamService } from '../teamService';
import { apiService } from '../api';

vi.mock('../api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('TeamService', () => {
  const mockTeam = {
    id: 1,
    name: 'Test Team',
    status: 'active',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches team successfully', async () => {
    const mockResponse = {
      success: true,
      data: mockTeam,
    };

    vi.mocked(apiService.get).mockResolvedValueOnce(mockResponse);

    const result = await teamService.getTeam(1);

    expect(apiService.get).toHaveBeenCalledWith('/teams/1');
    expect(result).toEqual(mockTeam); // Test unwrapped data
  });
});
```

### Composable Testing

```typescript
import { describe, it, expect } from 'vitest';
import { useTeamHelpers } from '../useTeamHelpers';

describe('useTeamHelpers', () => {
  const { getStatusLabel, getStatusVariant } = useTeamHelpers();

  it('returns correct status label', () => {
    expect(getStatusLabel('active')).toBe('Active');
    expect(getStatusLabel('inactive')).toBe('Inactive');
  });

  it('returns correct badge variant', () => {
    expect(getStatusVariant('active')).toBe('success');
    expect(getStatusVariant('inactive')).toBe('secondary');
  });
});
```

### Running Tests

```bash
# Run all admin tests
npm run test:admin

# Run specific test file
npm run test:admin -- TeamsTable

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

---

## Common Patterns

### Pagination Handling

```typescript
import { PAGINATION } from '@admin/constants/pagination';
import type { DataTablePageEvent } from '@admin/types/primevue';

const currentPage = ref(PAGINATION.DEFAULT_PAGE); // 1
const rowsPerPage = ref(PAGINATION.DEFAULT_PAGE_SIZE); // 15
const totalRecords = ref(0);

const onPage = (event: DataTablePageEvent): void => {
  // PrimeVue uses 0-based index, backend uses 1-based
  currentPage.value = event.page + 1;
  rowsPerPage.value = event.rows;
  loadItems();
};

const loadItems = async (): Promise<void> => {
  const response = await itemService.getItems(
    currentPage.value,
    rowsPerPage.value
  );

  items.value = response.data;
  totalRecords.value = response.meta.total;
};
```

**Why the +1?** PrimeVue DataTable uses 0-based page index (first page = 0), but backend expects 1-based (first page = 1).

### Loading States

```typescript
// Separate initial load (skeleton) and refresh load (spinner)
const initialLoading = ref(true);
const loading = ref(false);

onMounted(async () => {
  await loadItems();
  initialLoading.value = false; // Only set on first load
});

const loadItems = async (): Promise<void> => {
  loading.value = true; // Set on every load
  try {
    // Load data
  } finally {
    loading.value = false;
  }
};
```

**Why two loading states?**
- `initialLoading` shows skeleton (better UX for first load)
- `loading` shows spinner in table (better UX for pagination/refresh)

### Form Validation

```typescript
const formData = ref<CreateItemData>({
  name: '',
  status: 'active',
});

const validationErrors = ref<Record<string, string[]>>({});

const handleSubmit = async (): Promise<void> => {
  // Clear previous errors
  validationErrors.value = {};

  try {
    await itemService.createItem(formData.value);
    showSuccessToast('Item created');
    closeModal();
  } catch (error) {
    if (hasValidationErrors(error)) {
      validationErrors.value = getValidationErrors(error) || {};
    } else {
      showErrorToast(error);
    }
  }
};

// In template
<InputText
  v-model="formData.name"
  :class="{ 'p-invalid': validationErrors.name }"
/>
<small v-if="validationErrors.name" class="text-red-500">
  {{ validationErrors.name[0] }}
</small>
```

### Modal Management

```typescript
const viewDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const selectedItem = ref<Item | null>(null);

const viewItem = (item: Item): void => {
  selectedItem.value = item;
  viewDialogVisible.value = true;
};

const editItem = (item: Item): void => {
  selectedItem.value = item;
  editDialogVisible.value = true;
};

const handleEditCancel = (): void => {
  editDialogVisible.value = false;
  selectedItem.value = null;
};
```

### Permissions Check

```typescript
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();
const { getRoleLevel, hasRoleAccess } = useRoleHelpers();

const currentRoleLevel = computed(() => {
  const role = adminStore.adminRole;
  return role ? getRoleLevel(role) : 0;
});

const canEdit = (item: Item): boolean => {
  return hasRoleAccess(adminStore.adminRole, 'admin');
};

const canDelete = (item: Item): boolean => {
  const itemLevel = getRoleLevel(item.owner_role);
  return currentRoleLevel.value >= itemLevel;
};

// In template
<Button
  v-if="canEdit(item)"
  label="Edit"
  @click="editItem(item)"
/>
```

---

## Common Pitfalls

### 1. Forgetting to Unwrap API Responses

**❌ Wrong:**
```typescript
async getUser(id: number): Promise<UserResponse> {
  return await apiService.get<UserResponse>(`/users/${id}`);
}

// Component has to do this:
const response = await userService.getUser(1);
const user = response.data; // Extra step!
```

**✅ Correct:**
```typescript
async getUser(id: number): Promise<User> {
  const response = await apiService.get<UserResponse>(`/users/${id}`);
  return response.data; // Unwrap in service
}

// Component gets what it wants:
const user = await userService.getUser(1);
```

**Why?** Components shouldn't know about API response structure.

### 2. Using Global State for Component State

**❌ Wrong:**
```typescript
// In a store
const editModalVisible = ref(false);
const selectedUser = ref(null);
```

**✅ Correct:**
```typescript
// In the component
const editModalVisible = ref(false);
const selectedUser = ref(null);
```

**Why?** Component-specific state should stay in the component. Global state creates hidden dependencies and makes testing harder.

### 3. Not Handling Request Cancellation

**❌ Wrong:**
```typescript
const loadUsers = async () => {
  const response = await userService.getUsers(page);
  users.value = response.data;
};
```

**Problem:** If user navigates away or changes page quickly, multiple requests race. Last one to complete wins, which might not be the latest request.

**✅ Correct:**
```typescript
const { getSignal, cancel } = useRequestCancellation();

const loadUsers = async () => {
  try {
    cancel('Loading new page'); // Cancel previous
    const response = await userService.getUsers(page, perPage, getSignal());
    users.value = response.data;
  } catch (error) {
    if (isRequestCancelled(error)) return; // Silent ignore
    showErrorToast(error);
  }
};
```

**Why?** Prevents memory leaks and race conditions.

### 4. Pagination Index Off-by-One

**❌ Wrong:**
```typescript
const onPage = (event: DataTablePageEvent) => {
  currentPage.value = event.page; // Wrong! 0-based
  loadUsers();
};
```

**✅ Correct:**
```typescript
const onPage = (event: DataTablePageEvent) => {
  currentPage.value = event.page + 1; // Backend expects 1-based
  loadUsers();
};
```

**Why?** PrimeVue uses 0-based index, backend uses 1-based.

### 5. Not Using Separate Loading States

**❌ Wrong:**
```typescript
const loading = ref(false);

onMounted(() => {
  loading.value = true;
  await loadUsers();
  loading.value = false;
});

// Template shows spinner on initial load (jarring)
<div v-if="loading">
  <ProgressSpinner />
</div>
```

**✅ Correct:**
```typescript
const initialLoading = ref(true);
const loading = ref(false);

onMounted(() => {
  await loadUsers();
  initialLoading.value = false; // Only set once
});

// Template shows skeleton on initial load (better UX)
<div v-if="initialLoading">
  <Skeleton height="20rem" />
</div>
<div v-else>
  <DataTable :loading="loading" />
</div>
```

**Why?** Skeleton loaders provide better perceived performance.

### 6. Forgetting to Clear Validation Errors

**❌ Wrong:**
```typescript
watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value = { ...newItem };
    // Forgot to clear errors!
  }
});
```

**Result:** Old validation errors persist when opening modal for different item.

**✅ Correct:**
```typescript
watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value = { ...newItem };
    validationErrors.value = {}; // Clear errors
  }
});
```

### 7. Not Using Composables for Shared Logic

**❌ Wrong:**
```typescript
// In multiple components:
const formatDate = (date: string | null): string => {
  if (!date) return 'Never';
  return format(parseISO(date), "h:mmaaa do MMM yy");
};
```

**✅ Correct:**
```typescript
// composables/useDateFormatter.ts
export function useDateFormatter() {
  const formatDate = (date: string | null): string => {
    if (!date) return 'Never';
    return format(parseISO(date), "h:mmaaa do MMM yy");
  };
  return { formatDate };
}

// In components:
const { formatDate } = useDateFormatter();
```

**Why?** DRY principle. Single source of truth. Easier to test and maintain.

### 8. Missing TypeScript Types

**❌ Wrong:**
```typescript
const handleEdit = (item: any) => {
  emit('edit', item);
};
```

**✅ Correct:**
```typescript
const handleEdit = (item: Item) => {
  emit('edit', item);
};
```

**Why?** TypeScript catches errors at compile time. Provides autocomplete.

### 9. Hardcoding Messages

**❌ Wrong:**
```typescript
toast.add({
  severity: 'success',
  detail: 'User created successfully',
});
```

**✅ Correct:**
```typescript
import { SUCCESS_MESSAGES } from '@admin/constants/messages';

toast.add({
  severity: 'success',
  detail: SUCCESS_MESSAGES.CREATED('User'),
});
```

**Why?** Consistency. Easier to update. Potential for i18n later.

### 10. Not Exposing Modal Methods

**❌ Wrong:**
```typescript
// Modal doesn't expose setValidationErrors
// Parent can't set validation errors

// Parent has to do this hack:
if (hasValidationErrors(error)) {
  // Can't set errors in modal!
}
```

**✅ Correct:**
```typescript
// In modal:
const setValidationErrors = (errors: Record<string, string[]>) => {
  validationErrors.value = errors;
};
defineExpose({ setValidationErrors });

// In parent:
if (hasValidationErrors(error)) {
  const errors = getValidationErrors(error);
  if (errors && createModalRef.value) {
    createModalRef.value.setValidationErrors(errors);
  }
}
```

**Why?** Parent needs to communicate validation errors to modal.

---

## Detailed Guides

This is the main entry point. For more detailed information on specific topics, see:

### Backend Guides

- **[DDD Architecture Overview](../../backend/ddd-overview.md)** - Domain-Driven Design principles
- **[Admin Backend Guide](../../backend/admin-backend-guide.md)** - Building admin features (backend)
- **[User Backend Guide](../../backend/user-backend-guide.md)** - Building user features (backend)

### Frontend Guides

- **[Admin Styling Guide](./admin-styling-guide.md)** - **COMPLETE** styling and design system guide (typography, colors, spacing, layouts, accessibility)
- **[PrimeVue Usage Guide](../../primevue-usage.md)** - PrimeVue components and patterns
- **[Admin Authentication](../../admin/admin-authentication-guide.md)** - Authentication implementation

### Package Documentation

- **PrimeVue 4** - Use MCP Context7 or official docs
- **Vue 3** - https://vuejs.org/
- **Pinia** - https://pinia.vuejs.org/
- **Vue Router** - https://router.vuejs.org/
- **Tailwind CSS** - https://tailwindcss.com/
- **VueUse** - https://vueuse.org/
- **TypeScript** - https://www.typescriptlang.org/

---

## Quick Reference

| Task | Solution |
|------|----------|
| Format date | `useDateFormatter()` |
| Get full name | `useNameHelpers()` |
| Check role permission | `useRoleHelpers()` |
| Display status badge | `useStatusHelpers()` |
| Show error toast | `useErrorToast()` |
| Handle async action | `useAsyncAction()` |
| Manage modal state | `useModal()` |
| Cancel requests | `useRequestCancellation()` |
| Complex modal management | `useAdminUserModals()` |
| Type PrimeVue event | `import type { ... } from '@admin/types/primevue'` |
| Check validation error | `hasValidationErrors(error)` |
| Get error message | `getErrorMessage(error)` |
| Unwrap API response | Return `response.data` from service |
| Handle pagination | Convert 0-based to 1-based: `event.page + 1` |

---

## Key Takeaways

### Do's ✅

- **Use composables** for shared logic
- **Unwrap API responses** in services
- **Handle errors consistently** with standard patterns
- **Type everything** with TypeScript
- **Separate loading states** (initial vs. refresh)
- **Cancel pending requests** on unmount
- **Use constants** for messages and defaults
- **Test comprehensively** - services, composables, components
- **Follow naming conventions** - PascalCase components, camelCase functions
- **Document with JSDoc** - especially composables

### Don'ts ❌

- **Don't duplicate logic** - extract to composables
- **Don't return wrapped responses** - unwrap in services
- **Don't skip TypeScript types** - even for simple code
- **Don't use global state** for component state
- **Don't forget request cancellation** - prevents leaks
- **Don't hardcode messages** - use constants
- **Don't skip tests** - maintain quality
- **Don't mix concerns** - views orchestrate, components display, services handle API
- **Don't deviate from design system** without good reason
- **Don't forget to clear validation errors** when modal closes

---

## Examples from Codebase

**Reference these for real-world patterns:**

- **View:** `/var/www/resources/admin/js/views/AdminUsersView.vue`
- **Table:** `/var/www/resources/admin/js/components/AdminUser/AdminUsersTable.vue`
- **Modal:** `/var/www/resources/admin/js/components/AdminUser/modals/EditAdminUserModal.vue`
- **Service:** `/var/www/resources/admin/js/services/adminUserService.ts`
- **Store:** `/var/www/resources/admin/js/stores/adminStore.ts`
- **Composable:** `/var/www/resources/admin/js/composables/useModal.ts`
- **Advanced Composable:** `/var/www/resources/admin/js/composables/useAdminUserModals.ts`
- **Router:** `/var/www/resources/admin/js/router/index.ts`
- **Types:** `/var/www/resources/admin/js/types/admin.ts`

---

**This guide is a living document. Update it as new patterns emerge and lessons are learned.**

**Last updated:** October 2025
