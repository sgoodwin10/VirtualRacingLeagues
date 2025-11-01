# App Dashboard Development Guide

**Last Updated**: January 2025
**Application**: User Dashboard (`app.virtualracingleagues.localhost`)
**Path**: `resources/app/`

## Table of Contents

- [Overview](#overview)
- [Quick Reference](#quick-reference)
- [Architecture Overview](#architecture-overview)
- [Current Features](#current-features)
- [Technology Stack](#technology-stack)
- [Development Workflow](#development-workflow)
- [Best Practices](#best-practices)
- [Related Guides](#related-guides)

---

## Overview

The **User Dashboard** (app frontend) is an **authenticated-only** Single Page Application (SPA) that runs on the `app.virtualracingleagues.localhost` subdomain. It serves as the primary interface for authenticated users after they log in through the public site.

**Key Characteristics:**
- **Domain-driven architecture**: Components organized by feature domain (league, competition, season, driver, round)
- **Completely separate from public and admin applications**
- **All routes require authentication** via session cookies shared across subdomains
- **Type-safe**: Full TypeScript coverage with strict mode enabled
- **Modern Vue 3**: Composition API with `<script setup lang="ts">` throughout
- **Comprehensive testing**: 56 test files using Vitest

**Access URL**: `http://app.virtualracingleagues.localhost`

---

## Quick Reference

### **File Structure**

```
resources/app/
├── css/
│   └── app.css                     # Global styles, PrimeVue customizations, CSS variables
├── js/
│   ├── app.ts                      # Application entry point
│   ├── router/index.ts             # Vue Router with auth guards
│   ├── views/                      # Page-level components (3 views)
│   ├── components/                 # 54 Vue components organized by domain
│   │   ├── common/                 # Reusable UI components (forms, modals, panels)
│   │   ├── layout/                 # Layout components (Header)
│   │   ├── profile/                # Profile components
│   │   ├── league/                 # League domain components
│   │   ├── competition/            # Competition domain components
│   │   ├── season/                 # Season domain components
│   │   ├── driver/                 # Driver domain components
│   │   └── round/                  # Round/race domain components
│   ├── composables/                # 10 composition functions (validation, forms, utilities)
│   ├── stores/                     # 13 Pinia stores (Composition API style)
│   ├── services/                   # 14 API service modules (Axios-based)
│   ├── types/                      # 15 TypeScript type definition files
│   └── __tests__/                  # Test setup and utilities
└── views/
    └── app.blade.php               # Main HTML template
```

### **Statistics**

- **Components**: 54 Vue components
- **Views**: 3 main views (LeagueList, LeagueDetail, SeasonDetail)
- **Stores**: 13 Pinia stores
- **Services**: 14 API service modules
- **Composables**: 10 reusable composition functions
- **Types**: 15 TypeScript type files
- **Tests**: 56 test files with comprehensive coverage

### **Path Alias**

Use `@app` to import from `resources/app/js/`:

```typescript
// Good
import { useUserStore } from '@app/stores/userStore';
import LeagueList from '@app/views/LeagueList.vue';
import { League } from '@app/types/league';

// Bad - Don't use relative paths
import { useUserStore } from '../../stores/userStore';
```

### **Common Commands**

```bash
# Development
npm run dev                    # Start Vite dev server with HMR

# Testing
npm run test:app               # Run all app tests
npm run test:app -- --watch    # Watch mode
npm run test:ui                # Vitest UI
npm run test:coverage          # Coverage report

# Linting & Formatting
npm run lint:app               # ESLint
npm run lint:app -- --fix      # Auto-fix issues
npm run format:app             # Prettier format
npm run type-check             # TypeScript type check
```

---

## Architecture Overview

### **Domain-Driven Organization**

Components are organized **by feature domain**, not by type:

```
components/
├── common/                 # Shared UI components (forms, modals, panels)
├── layout/                 # App structure (Header)
├── league/                 # League-specific components, modals, partials
├── competition/            # Competition components
├── season/                 # Season components (with divisions/, teams/ subfolders)
├── driver/                 # Driver management components
└── round/                  # Round and race components
```

**Benefits:**
- **Feature discoverability**: All league-related components in one place
- **Co-location**: Related components, modals, and partials grouped together
- **Scalability**: Easy to add new domains without affecting others

### **Layered Architecture**

Clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│  Components (UI Layer)                              │
│  - Vue 3 Composition API                            │
│  - PrimeVue + Tailwind CSS                          │
│  - Props down, events up                            │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  Stores (State Management)                          │
│  - Pinia stores (13 stores)                         │
│  - Business logic & caching                         │
│  - Reactive state with computed getters             │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  Services (API Layer)                               │
│  - Axios HTTP client with interceptors              │
│  - CSRF protection & error handling                 │
│  - FormData builders for file uploads               │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  Backend API (Laravel)                              │
│  - RESTful endpoints at /api/*                      │
│  - Session-based authentication                     │
└─────────────────────────────────────────────────────┘
```

**Data flow:**
1. **Component** displays data and handles user interaction
2. **Component** calls **store** action (e.g., `leagueStore.fetchLeagues()`)
3. **Store** calls **service** method (e.g., `getUserLeagues()`)
4. **Service** makes HTTP request to **API**
5. **Service** returns typed data
6. **Store** updates state
7. **Component** reactively re-renders

### **Key Architectural Patterns**

1. **Composition API with TypeScript**
   - All components use `<script setup lang="ts">`
   - Type-safe props and emits with interfaces
   - Composables for reusable logic

2. **Store-Service Separation**
   - **Stores**: State management, caching, business logic
   - **Services**: HTTP layer, API calls, FormData building
   - Never call API directly from components

3. **Composables for Reusable Logic**
   - Validation composables (e.g., `useCompetitionValidation`)
   - Form management (e.g., `useProfileForm`)
   - Utilities (e.g., `useImageUrl`, `useDateFormatter`)

4. **TypeScript-First Development**
   - Interfaces for all props, emits, API responses, forms
   - Type guards for error handling
   - Strict mode enabled

5. **Error Handling Pattern**
   - Try/catch with user-friendly messages
   - Toast notifications for feedback
   - Validation error extraction from backend responses

---

## Current Features

### **1. League Management**
- **LeagueList View** (`/`)
  - Grid layout with league cards
  - Create new league (free tier: 1 league limit)
  - View league details
  - Free tier warnings

- **LeagueDetail View** (`/leagues/:id`)
  - League header with logo, hero image, visibility badge
  - League metadata (platforms, timezone, counts)
  - About section with description
  - Contact information and social media links
  - **Tabs**:
    - **Competitions**: List, create, edit, delete competitions
    - **Drivers**: Driver table with search, filter, CSV import

### **2. Competition Management**
- Competition cards with status badges
- Create/edit competition drawer with validation
- Competition settings and details
- Delete confirmation dialog

### **3. Season Management**
- **SeasonDetail View** (`/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId`)
  - Season header with edit/delete actions
  - Season settings panel
  - **Tabs**:
    - **Divisions**: Division management with create/edit/delete
    - **Teams**: Team management with create/edit/delete
    - **Season Drivers**: Season-driver relationships, add/remove drivers
    - **Rounds**: Round and race management

### **4. Driver Management**
- Driver table with DataTable component
- Search and filter by status (active, inactive, banned)
- CSV import functionality
- Driver statistics cards
- Add/edit/view driver modals
- Status badges

### **5. Round & Race Management**
- Rounds panel with expandable race lists
- Create/edit rounds and races
- Race settings management
- Track search functionality
- Qualifying session management

### **6. Profile Management**
- Profile settings modal
- Update personal information (first name, last name, email)
- Change password with validation
- Email verification status

### **7. Authentication**
- Automatic authentication check on app load
- Session-based authentication (shared with public site via cookies)
- Secure logout with redirect to public site
- Protection of all routes via navigation guards

---

## Technology Stack

### **Core Framework**
- **Vue 3.5.22** - Progressive JavaScript framework (Composition API)
- **TypeScript 5.9.3** - Type-safe JavaScript (strict mode)
- **Vite 7.0.7** - Build tool with HMR

### **State Management & Routing**
- **Pinia 3.0.3** - Vue state management (Composition API style)
- **pinia-plugin-persistedstate 4.5.0** - Persist store state to localStorage
- **Vue Router 4.5.1** - Official Vue router

### **UI Framework & Components**
- **PrimeVue 4.4.1** - Rich UI component library (Aura theme preset)
- **Tailwind CSS 4.0.0** - Utility-first CSS framework
- **tailwindcss-primeui 0.6.1** - PrimeVue + Tailwind integration
- **Phosphor Icons** - Custom icon system
- **PrimeIcons 7.0.0** - PrimeVue icon set

### **Utilities**
- **@vueuse/core 13.9.0** - Vue composition utilities
- **axios 1.11.0** - HTTP client
- **date-fns 4.1.0** - Date manipulation

### **Testing**
- **Vitest 3.2.4** - Unit testing framework
- **@vue/test-utils 2.4.6** - Vue component testing utilities
- **jsdom 27.0.0** - DOM implementation for Node.js
- **@vitest/coverage-v8 3.2.4** - Code coverage

### **Linting & Formatting**
- **ESLint 9.37.0** - JavaScript/TypeScript linter
- **Prettier 3.6.2** - Code formatter
- **TypeScript ESLint 8.46.1** - TypeScript linting rules

---

## Development Workflow

### **Adding a New Feature**

Follow this step-by-step workflow when adding new features.

#### **1. Plan the Feature**

Identify:
- What views/pages are needed?
- What state needs to be managed?
- What API endpoints are required?
- What routes need to be added?

#### **2. Backend Development (if needed)**

Follow the [User Backend Guide](../backend/user-backend-guide.md) for backend API development.

#### **3. Create Types**

Define TypeScript types for your data:

```typescript
// resources/app/js/types/myFeature.ts
export interface MyFeature {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface MyFeatureForm {
  name: string;
  description: string;
}

export interface MyFeatureFormErrors {
  name?: string;
  description?: string;
  general?: string;
}
```

#### **4. Create Service (if needed)**

Create a service for API calls:

```typescript
// resources/app/js/services/myFeatureService.ts
import { apiClient } from './api';
import type { MyFeature, MyFeatureForm } from '@app/types/myFeature';
import type { AxiosResponse } from 'axios';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export async function getMyFeatures(): Promise<MyFeature[]> {
  const response: AxiosResponse<ApiResponse<MyFeature[]>> = await apiClient.get('/my-features');
  return response.data.data;
}

export async function createMyFeature(form: MyFeatureForm): Promise<MyFeature> {
  const response: AxiosResponse<ApiResponse<MyFeature>> = await apiClient.post('/my-features', form);
  return response.data.data;
}

export async function deleteMyFeature(id: number): Promise<void> {
  await apiClient.delete(`/my-features/${id}`);
}
```

#### **5. Add Store (if complex state needed)**

Create a Pinia store for state management:

```typescript
// resources/app/js/stores/myFeatureStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MyFeature, MyFeatureForm } from '@app/types/myFeature';
import { getMyFeatures, createMyFeature, deleteMyFeature } from '@app/services/myFeatureService';

export const useMyFeatureStore = defineStore('myFeature', () => {
  // State
  const items = ref<MyFeature[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const itemCount = computed(() => items.value.length);

  // Actions
  async function fetchAll(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      items.value = await getMyFeatures();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load items';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function create(form: MyFeatureForm): Promise<MyFeature> {
    loading.value = true;
    try {
      const newItem = await createMyFeature(form);
      items.value.push(newItem);
      return newItem;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create item';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function remove(id: number): Promise<void> {
    loading.value = true;
    try {
      await deleteMyFeature(id);
      items.value = items.value.filter((item) => item.id !== id);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete item';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    items,
    loading,
    error,
    // Getters
    itemCount,
    // Actions
    fetchAll,
    create,
    remove,
  };
});
```

#### **6. Create Composable (for validation or reusable logic)**

```typescript
// resources/app/js/composables/useMyFeatureValidation.ts
import { reactive, computed } from 'vue';
import type { MyFeatureForm, MyFeatureFormErrors } from '@app/types/myFeature';

export function useMyFeatureValidation(form: MyFeatureForm) {
  const errors = reactive<MyFeatureFormErrors>({});

  function validateName(): string | undefined {
    if (!form.name || !form.name.trim()) {
      return 'Name is required';
    }
    if (form.name.length < 3) {
      return 'Name must be at least 3 characters';
    }
    return undefined;
  }

  function validateDescription(): string | undefined {
    if (!form.description || !form.description.trim()) {
      return 'Description is required';
    }
    return undefined;
  }

  function validateAll(): boolean {
    errors.name = validateName();
    errors.description = validateDescription();
    return !errors.name && !errors.description;
  }

  function clearErrors(): void {
    errors.name = undefined;
    errors.description = undefined;
    errors.general = undefined;
  }

  const hasErrors = computed(() => !!(errors.name || errors.description || errors.general));
  const isValid = computed(() => !hasErrors.value);

  return {
    errors,
    isValid,
    hasErrors,
    validateName,
    validateDescription,
    validateAll,
    clearErrors,
  };
}
```

#### **7. Create Component**

```vue
<!-- resources/app/js/components/myFeature/MyFeatureList.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useMyFeatureStore } from '@app/stores/myFeatureStore';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';

const store = useMyFeatureStore();
const toast = useToast();

onMounted(async () => {
  try {
    await store.fetchAll();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load items',
      life: 3000,
    });
  }
});

async function handleDelete(id: number): Promise<void> {
  try {
    await store.remove(id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Item deleted successfully',
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete item',
      life: 3000,
    });
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">My Feature</h1>
      <Button label="Create New" icon="pi pi-plus" @click="showCreateDialog = true" />
    </div>

    <div v-if="store.loading" class="space-y-4">
      <Skeleton height="150px" />
    </div>

    <div v-else-if="store.items.length === 0" class="text-center py-12">
      <p class="text-gray-500 mb-4">No items found</p>
      <Button label="Create First Item" @click="showCreateDialog = true" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="item in store.items" :key="item.id">
        <template #title>{{ item.name }}</template>
        <template #content>
          <p>{{ item.description }}</p>
        </template>
        <template #footer>
          <div class="flex gap-2 justify-end">
            <Button label="Edit" severity="secondary" size="small" />
            <Button
              label="Delete"
              severity="danger"
              size="small"
              @click="handleDelete(item.id)"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
```

#### **8. Create View**

```vue
<!-- resources/app/js/views/MyFeatureView.vue -->
<script setup lang="ts">
import MyFeatureList from '@app/components/myFeature/MyFeatureList.vue';
</script>

<template>
  <div>
    <MyFeatureList />
  </div>
</template>
```

#### **9. Add Route**

```typescript
// resources/app/js/router/index.ts
import MyFeatureView from '@app/views/MyFeatureView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ... existing routes
    {
      path: '/my-feature',
      name: 'myFeature',
      component: MyFeatureView,
      meta: {
        title: 'My Feature',
        requiresAuth: true, // Always true for user dashboard
      },
    },
  ],
});
```

#### **10. Add Navigation Link**

Add to Header menu or create a sidebar navigation component:

```vue
<router-link :to="{ name: 'myFeature' }" class="text-gray-700 hover:text-blue-600">
  My Feature
</router-link>
```

#### **11. Write Tests**

Create tests for services, stores, composables, and components:

```typescript
// resources/app/js/services/__tests__/myFeatureService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getMyFeatures, createMyFeature } from '../myFeatureService';
import { apiClient } from '../api';

vi.mock('../api');

describe('myFeatureService', () => {
  it('should fetch all items', async () => {
    const mockItems = [
      { id: 1, name: 'Item 1', description: 'Description 1' },
      { id: 2, name: 'Item 2', description: 'Description 2' },
    ];

    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: mockItems },
    });

    const result = await getMyFeatures();

    expect(result).toEqual(mockItems);
    expect(apiClient.get).toHaveBeenCalledWith('/my-features');
  });

  it('should create a new item', async () => {
    const mockItem = { id: 1, name: 'New Item', description: 'Description' };
    const form = { name: 'New Item', description: 'Description' };

    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: mockItem },
    });

    const result = await createMyFeature(form);

    expect(result).toEqual(mockItem);
    expect(apiClient.post).toHaveBeenCalledWith('/my-features', form);
  });
});
```

#### **12. Test Manually**

```bash
# Start dev server
npm run dev

# Navigate to http://app.virtualracingleagues.localhost
# Test the new feature
```

#### **13. Run Automated Tests**

```bash
npm run test:app              # Run all tests
npm run type-check            # TypeScript type check
npm run lint:app              # ESLint
npm run format:app            # Prettier format
```

---

## Best Practices

### **1. Component Structure**

Follow Vue 3 Composition API patterns with `<script setup>`:

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';
import type { MyType } from '@app/types/myType';

// Props
interface Props {
  item: MyType;
  isEditable?: boolean;
}

// Emits
interface Emits {
  (e: 'save', item: MyType): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composables
const router = useRouter();
const userStore = useUserStore();

// State
const count = ref(0);

// Computed
const doubleCount = computed(() => count.value * 2);

// Methods
function increment(): void {
  count.value++;
}

// Lifecycle
onMounted(() => {
  console.log('Component mounted');
});
</script>

<template>
  <div>{{ count }} - {{ doubleCount }}</div>
</template>
```

### **2. TypeScript Usage**

- Always use TypeScript for type safety
- Define interfaces for all data structures
- Use type guards for runtime type checking
- Avoid `any` - use proper types or `unknown`

```typescript
// Good
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = { id: 1, name: 'John', email: 'john@example.com' };

// Bad
const user: any = { id: 1, name: 'John', email: 'john@example.com' };
```

### **3. State Management**

- Use Pinia stores for complex state
- Keep stores focused (single responsibility)
- Use actions for async operations
- Use getters for derived state

```typescript
// Good - Focused store
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);

  async function fetchUser(): Promise<void> {
    user.value = await authService.checkAuth();
  }

  return { user, fetchUser };
});

// Bad - God store with everything
export const useAppStore = defineStore('app', () => {
  const user = ref<User | null>(null);
  const posts = ref<Post[]>([]);
  const settings = ref<Settings>({});
  // ... too many concerns
});
```

### **4. API Calls**

- Always use the centralized `apiClient`
- Handle errors gracefully
- Show user feedback (toasts, messages)
- Support request cancellation with AbortSignal

```typescript
// Good
try {
  const data = await myService.fetchData();
  toast.add({ severity: 'success', summary: 'Success!', detail: 'Data loaded', life: 3000 });
} catch (error: unknown) {
  console.error(error);
  toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data', life: 3000 });
}

// Bad - No error handling
const data = await myService.fetchData();
```

### **5. Form Handling**

- Use PrimeVue form components
- Implement client-side validation with composables
- Handle backend validation errors
- Provide clear error messages
- Disable forms during submission

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useMyFeatureValidation } from '@app/composables/useMyFeatureValidation';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const form = reactive({ name: '', description: '' });
const { errors, validateAll, clearErrors } = useMyFeatureValidation(form);
const isSubmitting = ref(false);

async function handleSubmit(): Promise<void> {
  clearErrors();
  if (!validateAll()) return;

  isSubmitting.value = true;
  try {
    // Submit form
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="mb-4">
      <label for="name" class="block mb-2">Name</label>
      <InputText
        id="name"
        v-model="form.name"
        :class="{ 'p-invalid': errors.name }"
        :disabled="isSubmitting"
      />
      <small v-if="errors.name" class="text-red-600">{{ errors.name }}</small>
    </div>

    <Button type="submit" label="Submit" :disabled="isSubmitting" :loading="isSubmitting" />
  </form>
</template>
```

### **6. Styling**

- Use Tailwind utility classes
- Use PrimeVue components for complex UI
- Follow consistent spacing and layout patterns
- Use semantic color classes

```vue
<!-- Good - Utility classes -->
<div class="max-w-7xl mx-auto p-6">
  <h1 class="text-3xl font-bold text-gray-900 mb-8">Title</h1>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Content -->
  </div>
</div>

<!-- Bad - Inline styles -->
<div style="max-width: 1200px; margin: 0 auto; padding: 32px;">
  <h1 style="font-size: 30px; font-weight: bold;">Title</h1>
</div>
```

### **7. Testing**

- Write tests for all new features (services, stores, composables, components)
- Test user interactions, not implementation
- Mock external dependencies
- Aim for high coverage on critical paths

```typescript
// Good - Test behavior
it('shows error message when form submission fails', async () => {
  const wrapper = mount(MyComponent);
  await wrapper.find('input[type="text"]').setValue('invalid');
  await wrapper.find('form').trigger('submit');
  expect(wrapper.text()).toContain('Validation error');
});

// Bad - Test implementation details
it('calls submit method', async () => {
  const wrapper = mount(MyComponent);
  wrapper.vm.submit();
  expect(wrapper.vm.submitCalled).toBe(true);
});
```

### **8. Performance**

- Use computed properties for derived state
- Implement lazy loading for routes (if needed)
- Debounce expensive operations (e.g., search)
- Use v-once for static content

```typescript
// Good - Computed property
const filteredItems = computed(() => items.value.filter((item) => item.active));

// Bad - Method called in template (re-runs on every render)
function getFilteredItems() {
  return items.value.filter((item) => item.active);
}
```

### **9. Error Handling**

- Always handle promise rejections
- Provide user-friendly error messages
- Log errors for debugging
- Use type guards for error checking

```typescript
import { isAxiosError, hasValidationErrors } from '@app/types/errors';

try {
  await riskyOperation();
} catch (error: unknown) {
  console.error('Operation failed:', error);

  if (isAxiosError(error) && hasValidationErrors(error)) {
    const validationErrors = error.response?.data?.errors;
    errors.value.name = validationErrors?.name?.[0];
  } else {
    errors.value.general = 'Something went wrong. Please try again.';
  }

  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: errors.value.general || 'Operation failed',
    life: 3000,
  });
}
```

### **10. Code Organization**

- Keep components small and focused
- Extract reusable logic to composables
- Use clear, descriptive names
- Follow consistent file naming conventions

```
// Good structure
MyComponent.vue           # Component
useMyFeature.ts          # Composable
myFeatureService.ts      # Service
myFeatureStore.ts        # Store
MyComponent.test.ts      # Test

// Bad - unclear names
comp1.vue
utils.ts
service.ts
```

---

## Related Guides

- **[App Components Guide](./app-components-guide.md)** - Component patterns, common components, PrimeVue usage
- **[App Stores & Services Guide](./app-stores-services-guide.md)** - State management, API services, data flow
- **[App Authentication Guide](./app-authentication-guide.md)** - Authentication flow, session management, guards
- **[App Styling Guide](./app-styling-guide.md)** - Design system, Tailwind CSS, PrimeVue theming
- **[User Backend Guide](../../backend/user-backend-guide.md)** - Backend API development for user features
- **[DDD Architecture Overview](../../backend/ddd-overview.md)** - Backend architecture principles

---

## Summary

The **User Dashboard** is a well-architected Vue 3 application with:

✅ **Domain-driven architecture**: Components organized by feature
✅ **Type safety**: Full TypeScript coverage with strict mode
✅ **State management**: 13 Pinia stores with Composition API
✅ **API layer**: 14 service modules with Axios interceptors
✅ **Reusable logic**: 10 composables for validation, forms, utilities
✅ **Testing**: 56 test files with Vitest
✅ **Styling**: Tailwind CSS + PrimeVue with custom theme
✅ **Authentication**: Session-based auth with subdomain sharing

**Key strengths:**
- Modern Vue 3 Composition API throughout
- Clear separation of concerns (components → stores → services → API)
- Comprehensive TypeScript types
- Excellent test coverage
- Consistent patterns and conventions
- PrimeVue integration with custom theming

For detailed information on specific topics, refer to the related guides listed above.
