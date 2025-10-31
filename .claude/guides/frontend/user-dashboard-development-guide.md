# User Dashboard Development Guide

**Last Updated**: January 2025
**Application**: User Dashboard (`app.virtualracingleagues.localhost`)
**Path**: `resources/app/`

## Table of Contents

- [Overview](#overview)
- [Current Features](#current-features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Pinia Store (State Management)](#pinia-store-state-management)
- [Authentication System](#authentication-system)
- [Profile Management](#profile-management)
- [Routing & Navigation](#routing--navigation)
- [Services Layer](#services-layer)
- [Components](#components)
- [Views](#views)
- [Testing](#testing)
- [Development Workflow](#development-workflow)
- [Best Practices](#best-practices)

---

## Overview

The **User Dashboard** is an **authenticated-only** Single Page Application (SPA) that runs on the `app.virtualracingleagues.localhost` subdomain. It serves as the primary interface for authenticated users after they log in through the public site.

**Key Characteristics:**
- Completely separate from public and admin applications
- All routes require authentication
- Shares session cookies with public site via subdomain configuration
- Users who are not authenticated are automatically redirected to the public site login page

**Access URL**: `http://app.virtualracingleagues.localhost`

---

## Current Features

### 1. Dashboard Home
- Welcome message with user's first name
- Quick action cards for common tasks
- Account status overview
- Email verification status indicator

### 2. Profile Management
- View and edit profile information (first name, last name, email)
- Change password functionality
- Email verification status
- Real-time validation
- Success/error feedback via toast notifications

### 3. Authentication
- Automatic authentication check on app load
- Session-based authentication (shared with public site)
- Secure logout with redirect to public site
- Protection of all routes via navigation guards

---

## Technology Stack

### Core Framework
- **Vue 3.5.22** - Progressive JavaScript framework
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Vite 7.0.7** - Build tool with HMR (Hot Module Replacement)

### State Management & Routing
- **Pinia 3.0.3** - Vue state management
- **pinia-plugin-persistedstate 4.5.0** - Persist store state to localStorage
- **Vue Router 4.5.1** - Official Vue router

### UI Framework & Components
- **PrimeVue 4.4.1** - Rich UI component library
- **@primevue/themes 4.4.1** - Aura theme preset
- **PrimeIcons 7.0.0** - Icon set
- **Tailwind CSS 4.0.0** - Utility-first CSS framework
- **tailwindcss-primeui 0.6.1** - PrimeVue + Tailwind integration

### Utilities
- **@vueuse/core 13.9.0** - Vue composition utilities
- **axios 1.11.0** - HTTP client
- **date-fns 4.1.0** - Date manipulation

### Testing
- **Vitest 3.2.4** - Unit testing framework
- **@vue/test-utils 2.4.6** - Vue component testing utilities
- **jsdom 27.0.0** - DOM implementation for Node.js
- **@vitest/coverage-v8 3.2.4** - Code coverage

### Linting & Formatting
- **ESLint 9.37.0** - JavaScript/TypeScript linter
- **Prettier 3.6.2** - Code formatter
- **TypeScript ESLint 8.46.1** - TypeScript linting rules

---

## Architecture Overview

```
resources/app/
├── css/
│   └── app.css                    # Tailwind CSS entry point
└── js/
    ├── app.ts                     # Application entry point
    ├── components/                # Vue components
    │   ├── App.vue               # Root component
    │   ├── layout/               # Layout components
    │   │   └── Header.vue        # App header with user menu
    │   └── __tests__/            # Component tests
    ├── router/                    # Vue Router configuration
    │   └── index.ts              # Routes & navigation guards
    ├── services/                  # API & business logic services
    │   ├── api.ts                # Axios client & interceptors
    │   ├── authService.ts        # Authentication service
    │   └── __tests__/            # Service tests
    ├── stores/                    # Pinia stores
    │   ├── userStore.ts          # User state management
    │   └── __tests__/            # Store tests
    ├── types/                     # TypeScript types & interfaces
    │   ├── auth.ts               # Authentication types
    │   ├── user.ts               # User type definitions
    │   ├── errors.ts             # Error type guards
    │   └── index.ts              # Type exports
    ├── views/                     # Page-level components
    │   ├── HomeView.vue          # Dashboard home page
    │   └── ProfileView.vue       # User profile page
    └── __tests__/                 # Test setup & utilities
        └── setup/
            ├── index.ts          # Test configuration
            ├── testUtils.ts      # Test helpers
            └── primevueStubs.ts  # PrimeVue component stubs
```

### Path Alias

Use `@user` to import from `resources/app/js/`:

```typescript
// Good
import { useUserStore } from '@app/stores/userStore';
import HomeView from '@app/views/HomeView.vue';

// Bad - Don't use relative paths
import { useUserStore } from '../../stores/userStore';
```

---

## Pinia Store (State Management)

### User Store (`userStore.ts`)

**Location**: `resources/app/js/stores/userStore.ts`

The user store manages all user-related state and authentication logic.

#### State

```typescript
{
  user: User | null,              // Current user data
  isAuthenticated: boolean,       // Authentication status
  isLoading: boolean,             // Loading state for async operations
}
```

#### Getters

```typescript
userName: string                  // Full name or 'Guest'
userFirstName: string             // User's first name
userLastName: string              // User's last name
userEmail: string                 // User's email
isEmailVerified: boolean          // Email verification status
```

#### Actions

```typescript
// Authentication
login(credentials: LoginCredentials): Promise<void>
logout(): Promise<void>
checkAuth(): Promise<boolean>

// Profile Management
updateProfile(data: ProfileUpdateData): Promise<void>
resendVerificationEmail(): Promise<void>

// Internal helpers
setUser(userData: User): void
clearAuth(): void
```

#### Persistence

The store uses `pinia-plugin-persistedstate` to persist state to localStorage:

```typescript
{
  persist: {
    storage: localStorage,
    pick: ['user', 'isAuthenticated'],  // Only persist these fields
  }
}
```

This ensures users remain authenticated across page refreshes.

#### Usage Example

```vue
<script setup lang="ts">
import { useUserStore } from '@app/stores/userStore';

const userStore = useUserStore();

// Access state
console.log(userStore.user);
console.log(userStore.isAuthenticated);

// Access getters
console.log(userStore.userName);
console.log(userStore.isEmailVerified);

// Call actions
await userStore.checkAuth();
await userStore.logout();
await userStore.updateProfile({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
});
</script>
```

---

## Authentication System

### How Authentication Works

1. **Login Flow** (happens on public site):
   - User logs in on `virtualracingleagues.localhost`
   - Backend sets session cookie with domain `.virtualracingleagues.localhost`
   - User is redirected to `app.virtualracingleagues.localhost`
   - Cookie is automatically shared across subdomains

2. **Auth Check Flow** (user dashboard):
   - On app load, router navigation guard calls `userStore.checkAuth()`
   - `authService.checkAuth()` makes request to `/api/me` endpoint
   - Backend validates session and returns user data
   - Store is updated with user data
   - User can access protected routes

3. **Logout Flow**:
   - User clicks logout
   - `userStore.logout()` calls `authService.logout()`
   - Backend destroys session
   - Store clears user data
   - User is redirected to public site login page

### Session Configuration

**Environment Variables** (`.env`):
```env
SESSION_DOMAIN=.virtualracingleagues.localhost  # Leading dot enables subdomain sharing
SESSION_DRIVER=database
SESSION_SAME_SITE=lax
```

**Sanctum Domains** (`config/sanctum.php`):
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS',
    'virtualracingleagues.localhost,app.virtualracingleagues.localhost'
))
```

### Navigation Guards

**Location**: `resources/app/js/router/index.ts:39-60`

All routes in the user dashboard require authentication:

```typescript
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  // Set page title
  const title = to.meta.title as string;
  document.title = title ? `${title} - User Dashboard` : 'User Dashboard';

  // Check authentication status
  const isAuthenticated = await userStore.checkAuth();

  if (!isAuthenticated) {
    // Redirect to public site login with return URL
    const publicDomain = getPublicDomain();
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${publicDomain}/login?redirect=${returnUrl}`;
    next(false);
    return;
  }

  // User is authenticated, allow navigation
  next();
});
```

---

## Profile Management

### Update Profile Feature

**View**: `resources/app/js/views/ProfileView.vue`

Users can update their profile information including:
- First name
- Last name
- Email address
- Password (optional)

#### Workflow

1. **Form initialization** (`onMounted`):
   - Pre-fill form with current user data from store

2. **Client-side validation**:
   - Required field checks
   - Password strength validation (min 8 characters)
   - Password confirmation match
   - Current password required for password changes

3. **Submission**:
   - Call `userStore.updateProfile(data)`
   - Handle success: Show toast, clear password fields, update store
   - Handle errors: Display validation errors inline

4. **Backend validation**:
   - Laravel Form Request validation
   - Unique email check (if email changed)
   - Current password verification (for password changes)

#### Example Form Handling

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@app/stores/userStore';
import { useToast } from 'primevue/usetoast';

const userStore = useUserStore();
const toast = useToast();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const currentPassword = ref('');

onMounted(() => {
  if (userStore.user) {
    firstName.value = userStore.user.first_name;
    lastName.value = userStore.user.last_name;
    email.value = userStore.user.email;
  }
});

const handleSubmit = async () => {
  try {
    const updateData: any = {
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
    };

    if (password.value) {
      updateData.password = password.value;
      updateData.password_confirmation = passwordConfirmation.value;
      updateData.current_password = currentPassword.value;
    }

    await userStore.updateProfile(updateData);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Profile updated successfully',
      life: 3000,
    });
  } catch (error) {
    // Handle errors
  }
};
</script>
```

---

## Routing & Navigation

### Current Routes

**Location**: `resources/app/js/router/index.ts`

| Path | Name | Component | Description |
|------|------|-----------|-------------|
| `/` | `home` | `HomeView.vue` | Dashboard home page |
| `/profile` | `profile` | `ProfileView.vue` | User profile settings |

**All routes have `meta.requiresAuth: true`** (enforced by navigation guard)

### Adding a New Route

1. Create the view component:
```vue
<!-- resources/app/js/views/MyNewView.vue -->
<script setup lang="ts">
// Component logic
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- View content -->
  </div>
</template>
```

2. Add route to router:
```typescript
// resources/app/js/router/index.ts
import MyNewView from '@app/views/MyNewView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ... existing routes
    {
      path: '/my-new-page',
      name: 'myNewPage',
      component: MyNewView,
      meta: {
        title: 'My New Page',
        requiresAuth: true,  // Always true for user dashboard
      },
    },
  ],
});
```

3. Add navigation link:
```vue
<router-link to="/my-new-page">My New Page</router-link>

<!-- OR using named routes (preferred) -->
<router-link :to="{ name: 'myNewPage' }">My New Page</router-link>
```

---

## Services Layer

### API Service (`api.ts`)

**Location**: `resources/app/js/services/api.ts`

Centralized Axios client with CSRF protection and error handling.

#### Features

- Base URL: `/api`
- Credentials: `withCredentials: true`
- CSRF token handling (automatic from cookies)
- 419 CSRF error recovery (auto-retry)
- 401 Unauthorized redirect to login

#### Usage

```typescript
import { apiClient } from '@app/services/api';

// GET request
const response = await apiClient.get<{ data: { user: User } }>('/me');
const user = response.data.data.user;

// POST request
const response = await apiClient.post('/profile', {
  first_name: 'John',
  last_name: 'Doe',
});

// PUT request
const response = await apiClient.put('/profile', data);

// DELETE request
await apiClient.delete('/resource/1');
```

### Auth Service (`authService.ts`)

**Location**: `resources/app/js/services/authService.ts`

Handles all authentication-related API calls.

#### Methods

```typescript
class AuthService {
  // Login user (typically called from public site)
  login(credentials: LoginCredentials, signal?: AbortSignal): Promise<User>

  // Logout user
  logout(signal?: AbortSignal): Promise<void>

  // Check authentication status
  checkAuth(signal?: AbortSignal): Promise<User | null>

  // Resend email verification
  resendVerificationEmail(signal?: AbortSignal): Promise<void>

  // Update user profile
  updateProfile(data: ProfileUpdateData, signal?: AbortSignal): Promise<User>
}
```

#### Usage Example

```typescript
import { authService } from '@app/services/authService';

// Check if user is authenticated
const user = await authService.checkAuth();
if (user) {
  console.log('User is authenticated:', user);
}

// Update profile
const updatedUser = await authService.updateProfile({
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
});

// Logout
await authService.logout();
```

---

## Components

### Root Component (`App.vue`)

**Location**: `resources/app/js/components/App.vue`

The root component that wraps the entire application.

```vue
<template>
  <div id="app">
    <Header />
    <main>
      <router-view />
    </main>
  </div>
</template>
```

### Header Component (`Header.vue`)

**Location**: `resources/app/js/components/layout/Header.vue`

Application header with user menu and logout functionality.

#### Features
- Displays "User Dashboard" logo/title
- User menu button with username
- Dropdown menu with:
  - Profile link
  - Logout action

#### Usage

```vue
<script setup lang="ts">
import { useUserStore } from '@app/stores/userStore';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

const menuItems = computed(() => [
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => router.push({ name: 'profile' }),
  },
  {
    separator: true,
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: handleLogout,
  },
]);

async function handleLogout() {
  await userStore.logout();
}
</script>

<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <router-link to="/" class="flex items-center">
          <span class="text-xl font-bold text-blue-600">User Dashboard</span>
        </router-link>

        <nav class="flex items-center gap-4">
          <Button
            type="button"
            :label="userStore.userName"
            icon="pi pi-user"
            severity="secondary"
            outlined
            @click="toggleUserMenu"
          />
          <Menu ref="userMenu" :model="menuItems" :popup="true" />
        </nav>
      </div>
    </div>
  </header>
</template>
```

---

## Views

### HomeView (`HomeView.vue`)

**Location**: `resources/app/js/views/HomeView.vue`
**Route**: `/` (home)

Dashboard landing page with:
- Welcome message (personalized with user's first name)
- Quick action cards
- Account status overview
- Email verification status

### ProfileView (`ProfileView.vue`)

**Location**: `resources/app/js/views/ProfileView.vue`
**Route**: `/profile` (profile)

Profile management page with:
- Personal information form (first name, last name, email)
- Password change section
- Email verification status indicator
- Form validation
- Success/error notifications

---

## Testing

### Running Tests

```bash
# Run all user dashboard tests
npm run test:user

# Run tests in watch mode
npm run test:user -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Setup

**Location**: `resources/app/js/__tests__/setup/`

- `index.ts` - Vitest configuration
- `testUtils.ts` - Custom test utilities (mount helpers, mock router, etc.)
- `primevueStubs.ts` - PrimeVue component stubs for testing

### Writing Tests
- Tests should focus on basic functionality and confirmation that the component works.
- Minimum amount of tests. Just the critical parts of components.

#### Component Test Example

```typescript
// resources/app/js/components/MyComponent.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [createTestingPinia()],
      },
    });

    expect(wrapper.text()).toContain('Expected text');
  });

  it('handles user interaction', async () => {
    const wrapper = mount(MyComponent);

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
```

#### Store Test Example

```typescript
// resources/app/js/stores/__tests__/userStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../userStore';

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with default state', () => {
    const store = useUserStore();

    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('sets user data correctly', () => {
    const store = useUserStore();
    const mockUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };

    store.setUser(mockUser);

    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
    expect(store.userName).toBe('John Doe');
  });
});
```

#### Service Test Example

```typescript
// resources/app/js/services/__tests__/authService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { authService } from '../authService';
import { apiClient } from '../api';

vi.mock('../api');

describe('Auth Service', () => {
  it('checkAuth returns user data on success', async () => {
    const mockUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { user: mockUser } },
    });

    const result = await authService.checkAuth();

    expect(result).toEqual(mockUser);
    expect(apiClient.get).toHaveBeenCalledWith('/me', { signal: undefined });
  });

  it('checkAuth returns null on error', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

    const result = await authService.checkAuth();

    expect(result).toBeNull();
  });
});
```

---

## Development Workflow

### Adding a New Feature

Follow this step-by-step workflow when adding new features to the user dashboard.

#### 1. Plan the Feature

Identify:
- What views/pages are needed?
- What state needs to be managed?
- What API endpoints are required?
- What routes need to be added?

#### 2. Backend Development (if needed)

Follow the [User Backend Guide](../backend/user-backend-guide.md) for backend development.

#### 3. Create Types

Define TypeScript types for your data:

```typescript
// resources/app/js/types/myFeature.ts
export interface MyFeatureData {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface CreateMyFeatureData {
  name: string;
  description: string;
}
```

#### 4. Create Service (if needed)

Create a service for API calls:

```typescript
// resources/app/js/services/myFeatureService.ts
import { apiClient } from './api';
import type { MyFeatureData, CreateMyFeatureData } from '@app/types/myFeature';

class MyFeatureService {
  async getAll(signal?: AbortSignal): Promise<MyFeatureData[]> {
    const response = await apiClient.get<{ data: MyFeatureData[] }>('/my-feature', { signal });
    return response.data.data;
  }

  async create(data: CreateMyFeatureData, signal?: AbortSignal): Promise<MyFeatureData> {
    const response = await apiClient.post<{ data: MyFeatureData }>('/my-feature', data, { signal });
    return response.data.data;
  }

  async delete(id: number, signal?: AbortSignal): Promise<void> {
    await apiClient.delete(`/my-feature/${id}`, { signal });
  }
}

export const myFeatureService = new MyFeatureService();
```

#### 5. Add Store (if complex state needed)

Create a Pinia store for state management:

```typescript
// resources/app/js/stores/myFeatureStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MyFeatureData } from '@app/types/myFeature';
import { myFeatureService } from '@app/services/myFeatureService';

export const useMyFeatureStore = defineStore('myFeature', () => {
  // State
  const items = ref<MyFeatureData[]>([]);
  const isLoading = ref(false);

  // Actions
  async function fetchAll(): Promise<void> {
    isLoading.value = true;
    try {
      items.value = await myFeatureService.getAll();
    } finally {
      isLoading.value = false;
    }
  }

  async function createItem(data: CreateMyFeatureData): Promise<void> {
    const newItem = await myFeatureService.create(data);
    items.value.push(newItem);
  }

  async function deleteItem(id: number): Promise<void> {
    await myFeatureService.delete(id);
    items.value = items.value.filter(item => item.id !== id);
  }

  return {
    items,
    isLoading,
    fetchAll,
    createItem,
    deleteItem,
  };
});
```

#### 6. Create View Component

```vue
<!-- resources/app/js/views/MyFeatureView.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useMyFeatureStore } from '@app/stores/myFeatureStore';
import Button from 'primevue/button';
import Card from 'primevue/card';

const store = useMyFeatureStore();

onMounted(async () => {
  await store.fetchAll();
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">My Feature</h1>

    <Card v-for="item in store.items" :key="item.id" class="mb-4">
      <template #title>{{ item.name }}</template>
      <template #content>
        <p>{{ item.description }}</p>
      </template>
    </Card>
  </div>
</template>
```

#### 7. Add Route

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
        requiresAuth: true,
      },
    },
  ],
});
```

#### 8. Add Navigation Link

Add to Header menu or create a sidebar navigation component:

```vue
<router-link :to="{ name: 'myFeature' }">My Feature</router-link>
```

#### 9. Write Tests

Create tests for:
- Service methods
- Store actions
- View component
- User interactions

#### 10. Test Manually

```bash
# Start dev server
npm run dev

# Navigate to http://app.virtualracingleagues.localhost
# Test the new feature
```

#### 11. Run Automated Tests

```bash
npm run test:user
npm run type-check
npm run lint:user
```

---

## Best Practices

### 1. Component Structure

Follow Vue 3 Composition API patterns with `<script setup>`:

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';

// Composables
const router = useRouter();
const userStore = useUserStore();

// State
const count = ref(0);

// Computed
const doubleCount = computed(() => count.value * 2);

// Methods
function increment() {
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

### 2. TypeScript Usage

- Always use TypeScript for type safety
- Define interfaces for all data structures
- Use type guards for runtime type checking
- Avoid `any` - use proper types or `unknown`

```typescript
// Good
interface User {
  id: number;
  name: string;
}

const user: User = { id: 1, name: 'John' };

// Bad
const user: any = { id: 1, name: 'John' };
```

### 3. State Management

- Use Pinia stores for complex state
- Keep stores focused (single responsibility)
- Use actions for async operations
- Use getters for derived state

```typescript
// Good - Focused store
const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);

  async function fetchUser() {
    user.value = await api.getUser();
  }

  return { user, fetchUser };
});

// Bad - God store with everything
const useAppStore = defineStore('app', () => {
  const user = ref<User | null>(null);
  const posts = ref<Post[]>([]);
  const settings = ref<Settings>({});
  // ... too many concerns
});
```

### 4. API Calls

- Always use the centralized `apiClient`
- Handle errors gracefully
- Show user feedback (toasts, messages)
- Support request cancellation with AbortSignal

```typescript
// Good
try {
  const data = await myService.fetchData();
  toast.add({ severity: 'success', summary: 'Success!' });
} catch (error) {
  console.error(error);
  toast.add({ severity: 'error', summary: 'Error!' });
}

// Bad - No error handling
const data = await myService.fetchData();
```

### 5. Form Handling

- Use PrimeVue form components
- Implement client-side validation
- Handle backend validation errors
- Provide clear error messages
- Disable forms during submission

```vue
<InputText
  v-model="email"
  type="email"
  :class="{ 'p-invalid': emailError }"
  :disabled="isSubmitting"
/>
<small v-if="emailError" class="text-red-600">{{ emailError }}</small>
```

### 6. Styling

- Use Tailwind utility classes
- Use PrimeVue components for complex UI
- Follow consistent spacing and layout patterns
- Use semantic color classes

```vue
<!-- Good - Utility classes -->
<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-gray-900 mb-8">Title</h1>
</div>

<!-- Bad - Inline styles -->
<div style="max-width: 1200px; margin: 0 auto; padding: 32px;">
  <h1 style="font-size: 30px; font-weight: bold;">Title</h1>
</div>
```

### 7. Testing

- Write tests for all new features
- Test user interactions, not implementation
- Mock external dependencies
- Aim for high coverage on critical paths

```typescript
// Good - Test behavior
it('shows error message when login fails', async () => {
  const wrapper = mount(LoginForm);
  await wrapper.find('input[type="email"]').setValue('invalid@email');
  await wrapper.find('form').trigger('submit');
  expect(wrapper.text()).toContain('Invalid credentials');
});

// Bad - Test implementation details
it('calls login method', async () => {
  const wrapper = mount(LoginForm);
  wrapper.vm.login();
  expect(wrapper.vm.loginCalled).toBe(true);
});
```

### 8. Performance

- Use computed properties for derived state
- Implement lazy loading for routes (if needed)
- Debounce expensive operations
- Use v-once for static content

```typescript
// Good - Computed property
const filteredItems = computed(() =>
  items.value.filter(item => item.active)
);

// Bad - Method called in template
function getFilteredItems() {
  return items.value.filter(item => item.active);
}
```

### 9. Error Handling

- Always handle promise rejections
- Provide user-friendly error messages
- Log errors for debugging
- Implement global error handler if needed

```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: 'Something went wrong. Please try again.',
  });
}
```

### 10. Code Organization

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

## Summary

The User Dashboard is a modern, type-safe Vue 3 application with:

- **Robust authentication** via shared session cookies
- **State management** with Pinia and persistence
- **Rich UI** with PrimeVue and Tailwind CSS
- **Comprehensive testing** with Vitest
- **Type safety** with TypeScript
- **Clean architecture** with services, stores, and components

For questions or contributions, refer to the main [CLAUDE.md](/var/www/CLAUDE.md) file or consult the backend development guides.

---

**Related Documentation**:
- [Admin Dashboard Development Guide](./admin-dashboard-development-guide.md)
- [User Backend Guide](../backend/user-backend-guide.md)
- [DDD Architecture Overview](../backend/ddd-overview.md)
