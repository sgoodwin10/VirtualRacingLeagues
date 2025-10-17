# Admin Authentication & Authorization Guide

> **Complete guide to authentication and authorization in the Admin Dashboard**
>
> Last updated: 2025-10-15

## Table of Contents

1. [Introduction](#1-introduction)
2. [Authentication Flow](#2-authentication-flow)
3. [Admin Store (`adminStore.ts`)](#3-admin-store-adminstorets)
4. [Authentication Service (`authService.ts`)](#4-authentication-service-authservicets)
5. [Route Guards](#5-route-guards)
6. [Authorization (Role-Based Access)](#6-authorization-role-based-access)
7. [Protected Routes](#7-protected-routes)
8. [Component-Level Authorization](#8-component-level-authorization)
9. [Login Component (`AdminLoginView.vue`)](#9-login-component-adminloginviewvue)
10. [Common Patterns](#10-common-patterns)
11. [Security Best Practices](#11-security-best-practices)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Introduction

### Overview

The admin dashboard implements a comprehensive authentication and role-based authorization system that ensures only authorized administrators can access protected resources.

**Key characteristics:**
- **Session-based authentication** with optional "Remember Me" for 30 days
- **Role-based authorization** with hierarchical permissions (moderator < admin < super_admin)
- **Route-level guards** to protect entire pages
- **Component-level authorization** for granular UI control
- **CSRF protection** for all state-changing requests
- **Automatic session expiry handling** with redirects

### How It Differs from User Authentication

| Aspect | Admin Authentication | User Authentication |
|--------|---------------------|---------------------|
| **Guard** | `auth:admin` | `auth:web` |
| **API Prefix** | `/api` | `/api` |
| **Base Path** | `/` | `/` |
| **Store** | `useAdminStore()` | `useUserStore()` (if exists) |
| **Roles** | super_admin, admin, moderator | None (or user-specific roles) |
| **Persistence** | sessionStorage (cleared on tab close) | localStorage (persists across sessions) |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AdminLoginView.vue                       │
│              (Login form with validation)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ├──> authService.login()
                         │    (API: POST /api/login)
                         │
                         ├──> adminStore.login()
                         │    (State management)
                         │
                         ├──> router.beforeEach()
                         │    (Route guard checks auth)
                         │
                         ├──> adminStore.checkAuth()
                         │    (Verify session on navigation)
                         │
                         └──> Component renders
                              (Role-based UI elements)
```

---

## 2. Authentication Flow

### Login Process (Step by Step)

```
1. User visits /login
   └─> AdminLoginView.vue renders

2. User enters credentials (email, password, remember?)
   └─> Form validation runs (client-side)

3. User submits form
   ├─> authService.login() called
   ├─> GET /api/csrf-cookie (fetch CSRF token)
   ├─> POST /api/login with credentials
   │   └─> Backend validates and creates session
   │
   ├─> adminStore.setAdmin(adminData)
   │   ├─> admin.value = adminData
   │   ├─> isAuthenticated.value = true
   │   └─> Store persisted to sessionStorage
   │
   └─> router.replace({ name: 'dashboard' })
       └─> User redirected to dashboard

4. Router navigation guard runs
   ├─> adminStore.checkAuth() verifies session
   ├─> GET /api/auth/check
   └─> Session valid → allow access
```

### Session Management

**Storage Strategy:**
- **sessionStorage** (NOT localStorage) for security
- Cleared when browser tab/window closes
- Persists across page refreshes within same session

**What's Persisted:**
```typescript
// Only essential auth data is persisted
{
  admin: Admin | null,          // Full admin object
  isAuthenticated: boolean      // Auth flag
}

// NOT persisted (temporary state):
// - isLoading
// - authCheckPromise
```

**Pinia Persistence Configuration:**
```typescript
// resources/admin/js/stores/adminStore.ts
{
  persist: {
    storage: sessionStorage,
    pick: ['admin', 'isAuthenticated'],
  },
}
```

### Token Handling

**CSRF Protection:**
- Laravel's CSRF token required for all state-changing requests (POST, PUT, PATCH, DELETE)
- Automatically added by `apiService` interceptor
- Token fetched from `/csrf-cookie` endpoint before login

**CSRF Flow:**
```typescript
// Automatic CSRF handling in apiService
this.client.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const token = this.getCSRFToken();
    if (token && config.headers) {
      config.headers['X-CSRF-TOKEN'] = token;
      config.headers['X-XSRF-TOKEN'] = token;
    }
  }
  return config;
});
```

**CSRF Token Mismatch (419) Handling:**
- Automatically detected by response interceptor
- Token refreshed and request retried
- Transparent to user

### Logout Process

```
1. User clicks logout button
   └─> adminStore.logout() called

2. API logout request
   ├─> POST /api/logout
   └─> Backend destroys session

3. Clear local state
   ├─> adminStore.clearAuth()
   │   ├─> admin.value = null
   │   ├─> isAuthenticated.value = false
   │   └─> sessionStorage cleared (via pinia plugin)
   │
   └─> localStorage 'admin_remember' removed

4. Redirect to login
   └─> router.push({ name: 'login' })
```

### Auto-Logout / Session Expiry

**401 Unauthorized Handling:**
```typescript
// Automatic redirect on 401 (apiService interceptor)
this.client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('admin_remember');

      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

**When 401 Occurs:**
- Session expired on backend
- User logged out from another tab/window
- Session invalidated by admin action
- Backend authentication failure

**Behavior:**
- Automatic redirect to `/login`
- Return URL preserved (via route guard query param)
- Auth state cleared
- User sees login form

---

## 3. Admin Store (`adminStore.ts`)

**Location:** `/var/www/resources/admin/js/stores/adminStore.ts`

### State Management

The admin store is the central hub for authentication state in the admin dashboard.

### State

```typescript
const admin = ref<Admin | null>(null);              // Current admin user data
const isAuthenticated = ref(false);                 // Authentication status
const isLoading = ref(false);                       // Loading state for auth operations
const authCheckPromise = ref<Promise<boolean> | null>(null); // Cached auth check promise
```

### Getters

#### `adminName`
```typescript
const adminName = computed((): string => admin.value?.name || 'Administrator');
```
Returns the admin's display name or default 'Administrator'.

#### `adminEmail`
```typescript
const adminEmail = computed((): string => admin.value?.email || '');
```
Returns the admin's email address.

#### `adminRole`
```typescript
const adminRole = computed((): AdminRole | null => admin.value?.role || null);
```
Returns the admin's role: `'super_admin'`, `'admin'`, `'moderator'`, or `null`.

#### `hasRole`
```typescript
const hasRole = computed(() => (role: AdminRole): boolean => {
  return admin.value?.role === role;
});
```
Check if admin has a specific role (exact match only).

**Example:**
```typescript
const adminStore = useAdminStore();
if (adminStore.hasRole('super_admin')) {
  // Only super admins can do this
}
```

#### `isSuperAdmin`
```typescript
const isSuperAdmin = computed((): boolean => {
  return admin.value?.role === 'super_admin';
});
```
Check if admin is a super admin (highest privilege level).

#### `isAdmin`
```typescript
const isAdmin = computed((): boolean => {
  return admin.value?.role === 'super_admin' || admin.value?.role === 'admin';
});
```
Check if admin is at least admin level (admin or super_admin).

### Actions

#### `login(credentials: LoginCredentials): Promise<void>`

Authenticate admin with credentials.

**Parameters:**
```typescript
interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;  // Remember for 30 days
}
```

**Example:**
```typescript
const adminStore = useAdminStore();

try {
  await adminStore.login({
    email: 'admin@example.com',
    password: 'password123',
    remember: true,
  });

  // Success! Admin is now authenticated
  router.push({ name: 'dashboard' });
} catch (error) {
  // Handle error (validation, network, etc.)
  console.error('Login failed:', error);
}
```

**What it does:**
1. Calls `authService.login(credentials)`
2. Receives admin data from API
3. Calls `setAdmin(adminData)` to update state
4. Triggers site config fetch
5. State persisted to sessionStorage

**Throws:**
- `AxiosError` with validation errors (422)
- `ApplicationError` for API errors
- Generic `Error` for other failures

#### `logout(): Promise<void>`

Logout the current admin.

**Example:**
```typescript
const adminStore = useAdminStore();

try {
  await adminStore.logout();
  // User logged out, state cleared
  router.push({ name: 'login' });
} catch (error) {
  // Logout can fail, but state is still cleared
  console.error('Logout error:', error);
}
```

**What it does:**
1. Calls `authService.logout()`
2. Backend destroys session
3. Calls `clearAuth()` to reset state
4. Clears remember-me preference
5. State removed from sessionStorage

**Note:** Even if API call fails, local state is cleared for security.

#### `checkAuth(): Promise<boolean>`

Check authentication status with the backend.

**Returns:** `true` if authenticated, `false` otherwise

**Example:**
```typescript
const adminStore = useAdminStore();

const isAuthenticated = await adminStore.checkAuth();
if (isAuthenticated) {
  console.log('User is authenticated:', adminStore.admin);
} else {
  console.log('User is not authenticated');
  router.push({ name: 'login' });
}
```

**What it does:**
1. Checks if an auth check is already in progress (returns cached promise)
2. Calls `authService.checkAuth()`
3. If admin data returned: calls `setAdmin(adminData)`, returns `true`
4. If no admin data: calls `clearAuth()`, returns `false`
5. Handles errors gracefully (returns `false` on error)

**Features:**
- **Promise caching:** Prevents concurrent auth checks (multiple route guards won't make duplicate requests)
- **Graceful error handling:** Returns `false` instead of throwing
- **State synchronization:** Updates store with latest admin data from backend

**Use cases:**
- Route guard verification (every protected route navigation)
- Component mount auth check
- Manual auth verification after sensitive operations

#### `setAdmin(adminData: Admin): void`

Set admin data and mark as authenticated. **Internal use only.**

**What it does:**
1. Sets `admin.value = adminData`
2. Sets `isAuthenticated.value = true`
3. Triggers `siteConfigStore.fetchSiteConfig()`

#### `clearAuth(): void`

Clear authentication state. **Internal use only.**

**What it does:**
1. Sets `admin.value = null`
2. Sets `isAuthenticated.value = false`
3. Calls `siteConfigStore.clearConfig()`

### Complete API Reference

```typescript
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();

// State
adminStore.admin;              // Admin | null
adminStore.isAuthenticated;    // boolean
adminStore.isLoading;          // boolean

// Getters
adminStore.adminName;          // string
adminStore.adminEmail;         // string
adminStore.adminRole;          // AdminRole | null
adminStore.hasRole('admin');   // boolean
adminStore.isSuperAdmin;       // boolean
adminStore.isAdmin;            // boolean

// Actions
await adminStore.login(credentials);
await adminStore.logout();
await adminStore.checkAuth();
```

---

## 4. Authentication Service (`authService.ts`)

**Location:** `/var/www/resources/admin/js/services/authService.ts`

### Overview

The `authService` is a singleton service that handles all HTTP requests for authentication operations.

### Methods

#### `login(credentials: LoginCredentials, signal?: AbortSignal): Promise<Admin>`

Authenticate user with credentials.

**Parameters:**
- `credentials`: Email, password, and optional remember flag
- `signal`: Optional AbortSignal for request cancellation

**Returns:** `Admin` object on success

**Example:**
```typescript
import { authService } from '@admin/services/authService';

try {
  const admin = await authService.login({
    email: 'admin@example.com',
    password: 'secret123',
    remember: true,
  });

  console.log('Logged in as:', admin.name);
} catch (error) {
  if (isAxiosError(error) && hasValidationErrors(error)) {
    // Handle validation errors (e.g., invalid credentials)
    console.error('Validation errors:', error.response?.data?.errors);
  } else {
    // Handle other errors
    console.error('Login failed:', error);
  }
}
```

**Flow:**
1. GET `/api/csrf-cookie` (fetch CSRF token)
2. POST `/api/login` with credentials
3. Store "remember me" preference if enabled
4. Return admin data

**Throws:**
- `AxiosError` (validation errors preserved for form handling)
- `ApplicationError` (for other API errors)

#### `logout(signal?: AbortSignal): Promise<void>`

Logout current admin.

**Example:**
```typescript
import { authService } from '@admin/services/authService';

try {
  await authService.logout();
  console.log('Logged out successfully');
} catch (error) {
  console.error('Logout error (non-critical):', error);
}
// Remember me preference is cleared regardless of API result
```

**Flow:**
1. POST `/api/logout`
2. Clear remember-me preference
3. Backend destroys session

**Note:** Always clears local data even if API call fails (security measure).

#### `checkAuth(signal?: AbortSignal): Promise<Admin | null>`

Check if user is authenticated and get admin data.

**Returns:** `Admin` object if authenticated, `null` otherwise

**Example:**
```typescript
import { authService } from '@admin/services/authService';

const admin = await authService.checkAuth();
if (admin) {
  console.log('Authenticated as:', admin.name, admin.role);
} else {
  console.log('Not authenticated');
}
```

**Flow:**
1. GET `/api/auth/check`
2. Return admin data if authenticated
3. Return `null` if not authenticated or error occurs

**Note:** Never throws errors (returns `null` on error for graceful handling).

#### `getCurrentAdmin(signal?: AbortSignal): Promise<Admin | null>`

Get current admin from session.

**Example:**
```typescript
import { authService } from '@admin/services/authService';

const admin = await authService.getCurrentAdmin();
if (admin) {
  console.log('Current admin:', admin);
}
```

**Flow:**
1. GET `/api/auth/me`
2. Return admin data or `null`

#### `hasRememberMe(): boolean`

Check if remember-me is enabled.

**Example:**
```typescript
import { authService } from '@admin/services/authService';

if (authService.hasRememberMe()) {
  console.log('User has remember-me enabled');
}
```

#### `isSessionLikelyExpired(): boolean`

Check if session is likely expired based on local state.

**Example:**
```typescript
import { authService } from '@admin/services/authService';

if (authService.isSessionLikelyExpired()) {
  // Prompt user to log in again
  console.warn('Session may have expired');
}
```

### Error Handling

The `authService` uses a standardized error handling approach:

1. **Validation Errors (422):** Preserved as `AxiosError` for form handling
2. **Other API Errors:** Transformed to `ApplicationError`
3. **Network Errors:** Transformed to `ApplicationError`
4. **Cancelled Requests:** Silently ignored

**Example error handling:**
```typescript
import { authService } from '@admin/services/authService';
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@admin/types/errors';

try {
  await authService.login(credentials);
} catch (error) {
  if (isAxiosError(error) && hasValidationErrors(error)) {
    // Validation error (422) - show field errors
    const errors = error.response?.data?.errors;
    console.error('Validation errors:', errors);
  } else {
    // Other error - show generic message
    const message = getErrorMessage(error, 'Login failed');
    console.error(message);
  }
}
```

---

## 5. Route Guards

**Location:** `/var/www/resources/admin/js/router/index.ts`

### How Route Guards Work

Vue Router's **global navigation guard** (`router.beforeEach`) runs before every route navigation to verify authentication and authorization.

```
User navigates to /users
        ↓
router.beforeEach() runs
        ↓
Check if route requires auth (meta.requiresAuth)
        ↓
Call adminStore.checkAuth() to verify session
        ↓
If not authenticated → redirect to /login?redirect=/users
        ↓
If authenticated → check role requirements (meta.requiredRole)
        ↓
If insufficient role → redirect to / (dashboard)
        ↓
Allow navigation
```

### Route Meta Fields

```typescript
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;           // Page title (set in document.title)
    breadcrumb?: Array<{ label: string }>; // Breadcrumb trail
    requiresAuth?: boolean;   // Require authentication
    requiredRole?: AdminRole; // Require specific role (hierarchical)
    isPublic?: boolean;       // Public route (no auth check)
  }
}
```

### `requiresAuth` Meta Field

Mark a route as requiring authentication.

**Example:**
```typescript
{
  path: '/admin',
  component: AdminLayout,
  meta: {
    requiresAuth: true,  // Must be authenticated
  },
  children: [
    {
      path: '',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'Dashboard',
        requiresAuth: true,
      },
    },
  ],
}
```

**Behavior:**
- If `requiresAuth: true` and user is NOT authenticated:
  - Redirect to `/login?redirect=/original-path`
  - Return URL preserved for post-login redirect

- If `requiresAuth: false` or omitted:
  - No auth check (route is public)

### Authentication Check Before Navigation

**Implementation:**
```typescript
router.beforeEach(async (to, _from, next) => {
  const adminStore = useAdminStore();

  // Set page title
  const title = to.meta.title as string;
  document.title = title ? `${title} - Admin Dashboard` : 'Admin Dashboard';

  // Check if route is public
  const isPublicRoute = to.meta.isPublic === true;
  if (isPublicRoute) {
    // If already authenticated and going to login, redirect to dashboard
    if (to.name === 'login' && adminStore.isAuthenticated) {
      next({ name: 'dashboard' });
      return;
    }
    next();
    return;
  }

  // Check if route requires authentication
  const requiresAuth = to.meta.requiresAuth === true;
  if (requiresAuth) {
    // Always check auth status to ensure it's current
    const isAuthenticated = await adminStore.checkAuth();

    if (!isAuthenticated) {
      // Redirect to login with return URL
      next({
        name: 'login',
        query: { redirect: to.fullPath },
      });
      return;
    }

    // Check role-based access (see next section)
  }

  // Allow navigation
  next();
});
```

### Redirect to Login with Return URL

**Query parameter preservation:**
```typescript
// User tries to access /users
// Not authenticated → redirect to:
/login?redirect=/users

// After successful login:
const returnUrl = route.query.redirect as string;
if (returnUrl) {
  router.push(returnUrl); // Go back to /users
} else {
  router.push({ name: 'dashboard' }); // Default to dashboard
}
```

**Handling in login component:**
```typescript
// AdminLoginView.vue
const handleSubmit = async () => {
  await adminStore.login(credentials);

  // Check for return URL
  const returnUrl = router.currentRoute.value.query.redirect as string;
  if (returnUrl && returnUrl.startsWith('/admin')) {
    await router.replace(returnUrl);
  } else {
    await router.replace({ name: 'dashboard' });
  }
};
```

---

## 6. Authorization (Role-Based Access)

### Admin Roles

**Available roles:**
```typescript
type AdminRole = 'super_admin' | 'admin' | 'moderator';
```

**Role hierarchy:**
```
super_admin (level 3)
    ↑
   admin (level 2)
    ↑
moderator (level 1)
```

### Role Hierarchy and Levels

**Hierarchy mapping:**
```typescript
// resources/admin/js/composables/useRoleHelpers.ts
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 3,
  admin: 2,
  moderator: 1,
} as const;
```

**Permission inheritance:**
- **super_admin:** Full access to everything
- **admin:** Can access admin-level and moderator-level features
- **moderator:** Can only access moderator-level features

**Access check logic:**
```
if (currentRoleLevel >= requiredRoleLevel) {
  // Access granted
}
```

**Examples:**
- `admin` (level 2) accessing route requiring `moderator` (level 1): **ALLOWED** (2 >= 1)
- `moderator` (level 1) accessing route requiring `admin` (level 2): **DENIED** (1 < 2)
- `super_admin` (level 3) accessing anything: **ALLOWED** (3 >= any)

### `requiredRole` Meta Field in Routes

Specify minimum role required to access a route.

**Example:**
```typescript
{
  path: 'admin-users',
  name: 'admin-users',
  component: () => import('@admin/views/AdminUsersView.vue'),
  meta: {
    title: 'Admin Users',
    requiresAuth: true,
    requiredRole: 'admin' as AdminRole, // Only admin and super_admin
  },
},
{
  path: 'site-config',
  name: 'site-config',
  component: () => import('@admin/views/SiteConfigView.vue'),
  meta: {
    title: 'Site Configuration',
    requiresAuth: true,
    requiredRole: 'super_admin' as AdminRole, // Only super_admin
  },
},
```

**Behavior:**
- User navigates to route with `requiredRole`
- Router guard checks: `hasRoleAccess(currentRole, requiredRole)`
- If insufficient role:
  - Redirect to dashboard
  - Log warning: "Access denied: Required role {role}"
- If sufficient role:
  - Allow navigation

**Guard implementation:**
```typescript
// Check role-based access
const requiredRole = to.meta.requiredRole as AdminRole | undefined;

if (requiredRole) {
  const { hasRoleAccess } = useRoleHelpers();
  const hasRequiredRole = hasRoleAccess(adminStore.adminRole, requiredRole);

  if (!hasRequiredRole) {
    // Redirect to dashboard if user doesn't have required role
    logger.warn(`Access denied: Required role ${requiredRole}`);
    next({ name: 'dashboard' });
    return;
  }
}
```

### `useRoleHelpers` Composable

**Location:** `/var/www/resources/admin/js/composables/useRoleHelpers.ts`

#### `getRoleLevel(role: AdminRole | null): number`

Get the hierarchical level of a role.

**Example:**
```typescript
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const { getRoleLevel } = useRoleHelpers();

getRoleLevel('super_admin'); // 3
getRoleLevel('admin');       // 2
getRoleLevel('moderator');   // 1
getRoleLevel(null);          // 0
```

#### `hasRoleAccess(currentRole: AdminRole | null, requiredRole: AdminRole): boolean`

Check if a role has access to perform actions requiring a minimum role level.

**Example:**
```typescript
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const { hasRoleAccess } = useRoleHelpers();

hasRoleAccess('super_admin', 'moderator'); // true (3 >= 1)
hasRoleAccess('admin', 'moderator');       // true (2 >= 1)
hasRoleAccess('moderator', 'admin');       // false (1 < 2)
hasRoleAccess(null, 'moderator');          // false (0 < 1)
```

#### `getRoleLabel(role: AdminRole): string`

Get human-readable label for a role.

**Example:**
```typescript
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const { getRoleLabel } = useRoleHelpers();

getRoleLabel('super_admin'); // 'Super Admin'
getRoleLabel('admin');       // 'Admin'
getRoleLabel('moderator');   // 'Moderator'
```

#### `getRoleBadgeVariant(role: AdminRole): 'danger' | 'warning' | 'info'`

Get badge variant for UI styling.

**Example:**
```typescript
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const { getRoleBadgeVariant } = useRoleHelpers();

getRoleBadgeVariant('super_admin'); // 'danger' (red)
getRoleBadgeVariant('admin');       // 'warning' (orange)
getRoleBadgeVariant('moderator');   // 'info' (blue)
```

**Usage in template:**
```vue
<template>
  <Tag :severity="getRoleBadgeVariant(admin.role)">
    {{ getRoleLabel(admin.role) }}
  </Tag>
</template>
```

### Checking Permissions in Components

**Example 1: Check if current user can access feature**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();

// Check if user can manage admin users
const canManageAdmins = computed(() =>
  hasRoleAccess(adminStore.adminRole, 'admin')
);
</script>

<template>
  <Button
    v-if="canManageAdmins"
    label="Manage Admins"
    @click="openAdminManagement"
  />
</template>
```

**Example 2: Check specific role**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();
</script>

<template>
  <!-- Only super admins see this -->
  <div v-if="adminStore.isSuperAdmin">
    <h2>Super Admin Controls</h2>
    <Button label="Manage System Settings" severity="danger" />
  </div>
</template>
```

**Example 3: Disable actions based on role**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();

const canDelete = computed(() =>
  hasRoleAccess(adminStore.adminRole, 'admin')
);
</script>

<template>
  <Button
    label="Delete User"
    severity="danger"
    :disabled="!canDelete"
    @click="deleteUser"
  />
</template>
```

---

## 7. Protected Routes

### How to Make a Route Require Authentication

**Step 1:** Add `requiresAuth: true` to route meta:

```typescript
{
  path: 'my-protected-page',
  name: 'my-protected-page',
  component: () => import('@admin/views/MyProtectedView.vue'),
  meta: {
    title: 'My Protected Page',
    requiresAuth: true,  // ← Add this
  },
}
```

**Step 2:** That's it! The global navigation guard handles the rest.

### How to Make a Route Require Specific Role

**Step 1:** Add both `requiresAuth: true` and `requiredRole`:

```typescript
{
  path: 'super-admin-only',
  name: 'super-admin-only',
  component: () => import('@admin/views/SuperAdminView.vue'),
  meta: {
    title: 'Super Admin Only',
    requiresAuth: true,
    requiredRole: 'super_admin' as AdminRole,  // ← Add this
  },
}
```

**Role levels:**
- `requiredRole: 'moderator'` → moderator, admin, super_admin can access
- `requiredRole: 'admin'` → admin, super_admin can access
- `requiredRole: 'super_admin'` → only super_admin can access

### Examples from Router

**Example 1: Public route (login)**
```typescript
{
  path: '/login',
  name: 'login',
  component: AdminLoginView,
  meta: {
    title: 'Login',
    isPublic: true,  // No auth check
  },
}
```

**Example 2: Protected route (any authenticated admin)**
```typescript
{
  path: 'users',
  name: 'users',
  component: () => import('@admin/views/UsersView.vue'),
  meta: {
    title: 'Users',
    requiresAuth: true,  // Any authenticated admin
  },
}
```

**Example 3: Admin-level route**
```typescript
{
  path: 'admin-users',
  name: 'admin-users',
  component: () => import('@admin/views/AdminUsersView.vue'),
  meta: {
    title: 'Admin Users',
    requiresAuth: true,
    requiredRole: 'admin' as AdminRole,  // Only admin and super_admin
  },
}
```

**Example 4: Super admin-only route**
```typescript
{
  path: 'site-config',
  name: 'site-config',
  component: () => import('@admin/views/SiteConfigView.vue'),
  meta: {
    title: 'Site Configuration',
    requiresAuth: true,
    requiredRole: 'super_admin' as AdminRole,  // Only super_admin
  },
}
```

**Example 5: Parent route with protected children**
```typescript
{
  path: '/',
  component: AdminLayout,
  meta: {
    requiresAuth: true,  // Protect entire admin section
  },
  children: [
    // All children inherit requiresAuth
    { path: '', name: 'dashboard', component: DashboardView },
    { path: 'users', name: 'users', component: UsersView },
  ],
}
```

### Redirect Behavior

**Unauthenticated user:**
```
User visits: /users
      ↓
Not authenticated
      ↓
Redirect: /login?redirect=/users
      ↓
User logs in successfully
      ↓
Redirect: /users (return URL)
```

**Insufficient role:**
```
Moderator visits: /site-config (requires super_admin)
      ↓
Authenticated but insufficient role
      ↓
Redirect: / (dashboard)
      ↓
Console warning: "Access denied: Required role super_admin"
```

**Authenticated user visiting login:**
```
User visits: /login
      ↓
Already authenticated
      ↓
Redirect: / (dashboard)
```

---

## 8. Component-Level Authorization

### Showing/Hiding Elements Based on Role

**Pattern 1: Using `isSuperAdmin` / `isAdmin`**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();
</script>

<template>
  <!-- Only super admins see this -->
  <Button
    v-if="adminStore.isSuperAdmin"
    label="Delete All Data"
    severity="danger"
  />

  <!-- Admins and super admins see this -->
  <Button
    v-if="adminStore.isAdmin"
    label="Manage Settings"
  />
</template>
```

**Pattern 2: Using `hasRoleAccess`**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();

const canEditUsers = computed(() =>
  hasRoleAccess(adminStore.adminRole, 'admin')
);
</script>

<template>
  <Button
    v-if="canEditUsers"
    label="Edit User"
    @click="openEditModal"
  />
</template>
```

**Pattern 3: Using `hasRole` (exact match)**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();
</script>

<template>
  <!-- Only moderators see this (not admins or super admins) -->
  <Message v-if="adminStore.hasRole('moderator')" severity="info">
    You have limited access as a moderator.
  </Message>
</template>
```

### Disabling Actions Based on Permissions

**Example: Disable button for insufficient role**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();

const canDelete = computed(() =>
  hasRoleAccess(adminStore.adminRole, 'admin')
);
</script>

<template>
  <Button
    label="Delete"
    severity="danger"
    :disabled="!canDelete"
    @click="handleDelete"
  />

  <small v-if="!canDelete" class="text-gray-500">
    Admin role required to delete items
  </small>
</template>
```

### Checking if User Can Edit/Delete

**Example: Table actions**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();

const canEdit = computed(() =>
  hasRoleAccess(adminStore.adminRole, 'moderator') // Moderators can edit
);

const canDelete = computed(() =>
  hasRoleAccess(adminStore.adminRole, 'admin') // Only admins can delete
);
</script>

<template>
  <DataTable :value="users">
    <Column field="name" header="Name" />
    <Column header="Actions">
      <template #body="{ data }">
        <Button
          v-if="canEdit"
          icon="pi pi-pencil"
          class="p-button-sm"
          @click="editUser(data)"
        />
        <Button
          v-if="canDelete"
          icon="pi pi-trash"
          class="p-button-sm p-button-danger"
          @click="deleteUser(data)"
        />
      </template>
    </Column>
  </DataTable>
</template>
```

### Examples with Buttons and Modals

**Example 1: Show modal only for admins**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();

const showCreateButton = computed(() =>
  hasRoleAccess(adminStore.adminRole, 'admin')
);

const showCreateModal = ref(false);

const openCreateModal = () => {
  if (!showCreateButton.value) {
    toast.add({
      severity: 'error',
      summary: 'Access Denied',
      detail: 'Admin role required',
    });
    return;
  }
  showCreateModal.value = true;
};
</script>

<template>
  <Button
    v-if="showCreateButton"
    label="Create Admin User"
    icon="pi pi-plus"
    @click="openCreateModal"
  />

  <Dialog
    v-model:visible="showCreateModal"
    header="Create Admin User"
  >
    <!-- Modal content -->
  </Dialog>
</template>
```

**Example 2: Conditional menu items**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();

const menuItems = computed(() => [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    to: { name: 'dashboard' },
  },
  {
    label: 'Users',
    icon: 'pi pi-users',
    to: { name: 'users' },
  },
  // Only show for admins
  ...(hasRoleAccess(adminStore.adminRole, 'admin') ? [{
    label: 'Admin Users',
    icon: 'pi pi-shield',
    to: { name: 'admin-users' },
  }] : []),
  // Only show for super admins
  ...(adminStore.isSuperAdmin ? [{
    label: 'Site Config',
    icon: 'pi pi-cog',
    to: { name: 'site-config' },
  }] : []),
]);
</script>

<template>
  <Menu :model="menuItems" />
</template>
```

---

## 9. Login Component (`AdminLoginView.vue`)

**Location:** `/var/www/resources/admin/js/views/AdminLoginView.vue`

### Form Structure

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <i class="pi pi-shield text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p class="text-gray-600">Enter your credentials to access the admin panel</p>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Login Form -->
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              :class="{ 'p-invalid': emailError }"
              class="w-full"
              :disabled="isSubmitting"
              autocomplete="email"
              @input="clearEmailError"
            />
            <small v-if="emailError" class="text-red-600 mt-1 block">
              {{ emailError }}
            </small>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :class="{ 'p-invalid': passwordError }"
              class="w-full"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="current-password"
              @input="clearPasswordError"
            />
            <small v-if="passwordError" class="text-red-600 mt-1 block">
              {{ passwordError }}
            </small>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center">
            <Checkbox
              v-model="remember"
              input-id="remember"
              :binary="true"
              :disabled="isSubmitting"
            />
            <label for="remember" class="ml-2 text-sm text-gray-700 cursor-pointer">
              Remember me for 30 days
            </label>
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Sign In"
            icon="pi pi-sign-in"
            :loading="isSubmitting"
            :disabled="!isFormValid || isSubmitting"
            class="w-full"
            severity="primary"
          />
        </form>
      </div>
    </div>
  </div>
</template>
```

### Validation

**Client-side validation:**
```typescript
const validateEmail = (): boolean => {
  emailError.value = '';

  if (!email.value.trim()) {
    emailError.value = 'Email is required';
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address';
    return false;
  }

  return true;
};

const validatePassword = (): boolean => {
  passwordError.value = '';

  if (!password.value.trim()) {
    passwordError.value = 'Password is required';
    return false;
  }

  return true;
};

const isFormValid = computed(() => {
  return email.value.trim() !== '' && password.value.trim() !== '';
});
```

**Form validation runs:**
1. On submit (before API call)
2. Field errors cleared on input

### Error Handling

**Comprehensive error handling:**
```typescript
const handleSubmit = async (): Promise<void> => {
  // Clear previous errors
  errorMessage.value = '';
  emailError.value = '';
  passwordError.value = '';

  // Validate form
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isEmailValid || !isPasswordValid) {
    return;
  }

  isSubmitting.value = true;

  try {
    await adminStore.login({
      email: email.value,
      password: password.value,
      remember: remember.value,
    });

    // Redirect to dashboard on success
    await router.replace({ name: 'dashboard' });
  } catch (error: any) {
    // Handle different types of errors with user-friendly messages
    if (isAxiosError(error)) {
      if (hasValidationErrors(error)) {
        // Validation error (422)
        const serverMessage = error.response?.data?.message;
        if (serverMessage && serverMessage.includes('credentials')) {
          errorMessage.value = 'Login unsuccessful. Please check your credentials and try again.';
        } else {
          errorMessage.value = serverMessage || 'Login unsuccessful. Please check your credentials and try again.';
        }
      } else if (error.response?.status === 401) {
        errorMessage.value = 'Login unsuccessful. Please check your credentials and try again.';
      } else if (error.response?.status === 429) {
        errorMessage.value = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage.value = 'Server error. Please try again later.';
      } else {
        errorMessage.value = 'Login unsuccessful. Please check your credentials and try again.';
      }
    } else {
      const message = getErrorMessage(error, 'Login failed. Please check your credentials and try again.');
      errorMessage.value = message;
    }
  } finally {
    isSubmitting.value = false;
  }
};
```

**Error types handled:**
- **422 Validation Error:** Invalid credentials
- **401 Unauthorized:** Authentication failed
- **429 Too Many Requests:** Rate limiting
- **5xx Server Error:** Backend issues
- **Network Error:** Connection issues

### Redirect After Login

**Return URL handling:**
```typescript
const router = useRouter();
const route = useRoute();

const handleSubmit = async () => {
  await adminStore.login(credentials);

  // Check for return URL in query params
  const returnUrl = route.query.redirect as string;

  if (returnUrl && returnUrl.startsWith('/')) {
    // Valid return URL → redirect there
    await router.replace(returnUrl);
  } else {
    // No return URL or invalid → default to dashboard
    await router.replace({ name: 'dashboard' });
  }
};
```

**Security note:** Always validate that return URL starts with `/` to prevent open redirect vulnerabilities.

### Complete Example

See the full component at: `/var/www/resources/admin/js/views/AdminLoginView.vue`

---

## 10. Common Patterns

### Checking Authentication in Components

**Pattern 1: On component mount**
```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useAdminStore } from '@admin/stores/adminStore';
import { useRouter } from 'vue-router';

const adminStore = useAdminStore();
const router = useRouter();

onMounted(async () => {
  // Verify auth on mount (if not using route guards)
  const isAuthenticated = await adminStore.checkAuth();
  if (!isAuthenticated) {
    router.push({ name: 'login' });
  }
});
</script>
```

**Pattern 2: Reactive auth state**
```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();

const isAuthenticated = computed(() => adminStore.isAuthenticated);
</script>

<template>
  <div v-if="isAuthenticated">
    <h1>Welcome, {{ adminStore.adminName }}!</h1>
  </div>
  <div v-else>
    <p>Please log in to continue.</p>
  </div>
</template>
```

### Displaying Different UI Based on Role

**Pattern 1: Conditional rendering**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();
</script>

<template>
  <div>
    <!-- Everyone sees this -->
    <h1>Dashboard</h1>

    <!-- Only admins and super admins -->
    <section v-if="adminStore.isAdmin">
      <h2>Admin Tools</h2>
      <Button label="Manage Users" />
    </section>

    <!-- Only super admins -->
    <section v-if="adminStore.isSuperAdmin">
      <h2>Super Admin Tools</h2>
      <Button label="System Settings" severity="danger" />
    </section>

    <!-- Only moderators (exact match) -->
    <Message v-if="adminStore.hasRole('moderator')" severity="info">
      You have moderator permissions.
    </Message>
  </div>
</template>
```

**Pattern 2: Different layouts per role**
```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();

const dashboardItems = computed(() => {
  const items = [
    { title: 'Overview', icon: 'pi-chart-bar', to: '/' },
    { title: 'Users', icon: 'pi-users', to: '/users' },
  ];

  // Add admin-only items
  if (adminStore.isAdmin) {
    items.push(
      { title: 'Admin Users', icon: 'pi-shield', to: '/admin-users' },
      { title: 'Settings', icon: 'pi-cog', to: '/settings' },
    );
  }

  // Add super admin-only items
  if (adminStore.isSuperAdmin) {
    items.push(
      { title: 'Site Config', icon: 'pi-sliders-h', to: '/site-config' },
    );
  }

  return items;
});
</script>

<template>
  <div class="dashboard-grid">
    <Card v-for="item in dashboardItems" :key="item.title">
      <template #title>
        <i :class="`pi ${item.icon}`" />
        {{ item.title }}
      </template>
      <template #content>
        <router-link :to="item.to">
          <Button label="Go" />
        </router-link>
      </template>
    </Card>
  </div>
</template>
```

### Protecting Actions (Edit, Delete)

**Pattern 1: Table with conditional actions**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();

const canEdit = computed(() => hasRoleAccess(adminStore.adminRole, 'moderator'));
const canDelete = computed(() => hasRoleAccess(adminStore.adminRole, 'admin'));
</script>

<template>
  <DataTable :value="items">
    <Column field="name" header="Name" />
    <Column header="Actions">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            v-if="canEdit"
            icon="pi pi-pencil"
            @click="editItem(data)"
          />
          <Button
            v-if="canDelete"
            icon="pi pi-trash"
            severity="danger"
            @click="deleteItem(data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
```

**Pattern 2: Function guard**
```vue
<script setup lang="ts">
import { useAdminStore } from '@admin/stores/adminStore';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';
import { useToast } from 'primevue/usetoast';

const adminStore = useAdminStore();
const { hasRoleAccess } = useRoleHelpers();
const toast = useToast();

const deleteItem = (item: Item) => {
  // Check permission before action
  if (!hasRoleAccess(adminStore.adminRole, 'admin')) {
    toast.add({
      severity: 'error',
      summary: 'Access Denied',
      detail: 'Admin role required to delete items',
      life: 3000,
    });
    return;
  }

  // Proceed with delete
  confirmDialog({
    message: `Delete ${item.name}?`,
    accept: () => performDelete(item),
  });
};
</script>
```

### Handling 401/403 Responses

**401 Unauthorized (not authenticated):**
```typescript
// Handled automatically by apiService interceptor
// resources/admin/js/services/api.ts

this.client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('admin_remember');

      // Redirect to login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

**403 Forbidden (insufficient permissions):**
```typescript
// Handle in component or service
try {
  await userService.deleteUser(userId);
} catch (error) {
  if (isAxiosError(error) && error.response?.status === 403) {
    toast.add({
      severity: 'error',
      summary: 'Access Denied',
      detail: 'You do not have permission to perform this action',
      life: 5000,
    });
  } else {
    // Handle other errors
  }
}
```

### Session Expiry Handling

**Automatic handling:**
- 401 response → automatic redirect to login
- Return URL preserved via route guard
- No manual intervention required

**Manual check (if needed):**
```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAdminStore } from '@admin/stores/adminStore';
import { useRouter } from 'vue-router';

const adminStore = useAdminStore();
const router = useRouter();

let sessionCheckInterval: NodeJS.Timeout;

onMounted(() => {
  // Check session every 5 minutes
  sessionCheckInterval = setInterval(async () => {
    const isAuthenticated = await adminStore.checkAuth();
    if (!isAuthenticated) {
      router.push({
        name: 'login',
        query: { message: 'Your session has expired. Please log in again.' }
      });
    }
  }, 5 * 60 * 1000); // 5 minutes
});

onUnmounted(() => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }
});
</script>
```

---

## 11. Security Best Practices

### Never Expose Admin Routes/API to Regular Users

**Backend protection:**
```php
// routes/api.php
Route::prefix('admin/api')
    ->middleware(['auth:admin', 'admin.authenticate'])
    ->group(function () {
        // All admin API routes protected by guard
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
    });
```

**Frontend protection:**
- Route guards check authentication before rendering
- API calls include credentials (cookies)
- Admin routes completely separate from user routes

### Always Check Permissions on Backend

**Never trust frontend checks alone!**

❌ **BAD:**
```typescript
// Only frontend check (can be bypassed)
if (adminStore.isAdmin) {
  await api.delete(`/users/${id}`);
}
```

✅ **GOOD:**
```typescript
// Frontend check for UX
if (adminStore.isAdmin) {
  await api.delete(`/users/${id}`); // Backend also checks!
}

// Backend ALSO checks (can't be bypassed)
// app/Http/Controllers/Admin/UserController.php
public function destroy(User $user): JsonResponse
{
    // Always verify permission on backend
    if (!Auth::guard('admin')->user()->hasRole('admin')) {
        return ApiResponse::forbidden('Insufficient permissions');
    }

    $user->delete();
    return ApiResponse::success();
}
```

### Frontend Auth is for UX Only

**Frontend checks:**
- Show/hide UI elements
- Disable buttons
- Redirect to appropriate pages
- Provide better user experience

**Backend checks:**
- Actual security enforcement
- Cannot be bypassed
- Database-level validation
- Authorization middleware

### Token Storage Security

**Session storage (used by admin):**
- ✅ Cleared when tab/window closes
- ✅ Not accessible across different origins
- ✅ More secure for sensitive admin access
- ❌ Cleared when browser restarts

**Local storage (NOT used by admin):**
- ✅ Persists across sessions
- ❌ Never cleared automatically
- ❌ Accessible by all scripts on domain
- ❌ Less secure (XSS vulnerability)

**Why sessionStorage for admin:**
```typescript
// Pinia config
{
  persist: {
    storage: sessionStorage,  // NOT localStorage!
    pick: ['admin', 'isAuthenticated'],
  },
}
```

### CSRF Protection

**Automatic CSRF handling:**
```typescript
// GET /admin/api/csrf-cookie → receive token
// Subsequent requests include X-CSRF-TOKEN header
// Laravel verifies token on state-changing requests

// apiService handles this automatically
this.client.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const token = this.getCSRFToken();
    config.headers['X-CSRF-TOKEN'] = token;
  }
  return config;
});
```

**Laravel CSRF middleware:**
```php
// All admin API routes protected
Route::prefix('admin/api')
    ->middleware(['web', 'auth:admin'])  // 'web' includes CSRF
    ->group(function () {
        // CSRF automatically verified
    });
```

**CSRF token mismatch (419):**
- Automatically detected
- Token refreshed
- Request retried
- Transparent to user

---

## 12. Troubleshooting

### Common Authentication Issues

#### Issue: Login successful but immediately redirected back to login

**Symptoms:**
- Login request returns 200 OK
- User redirected to dashboard
- Immediately redirected back to login

**Causes:**
1. **Session not persisting (cookies not set)**
   - Check `withCredentials: true` in axios config
   - Verify `SESSION_DOMAIN` in `.env`
   - Check browser cookie settings

2. **CSRF token mismatch**
   - Check `/csrf-cookie` endpoint is called first
   - Verify CSRF token in request headers

**Fix:**
```typescript
// apiService.ts
this.client = axios.create({
  baseURL: '/api',
  withCredentials: true,  // MUST be true!
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
```

```env
# .env
SESSION_DOMAIN=.yourdomain.localhost
SESSION_SECURE_COOKIE=false  # true only for HTTPS
```

#### Issue: "401 Unauthorized" on every request after login

**Symptoms:**
- Login succeeds
- Subsequent API calls return 401
- User immediately logged out

**Causes:**
1. **Wrong authentication guard**
   - Backend using `auth:web` instead of `auth:admin`

2. **Session not being sent**
   - `withCredentials: true` missing

3. **CORS issues**
   - Frontend and backend on different domains without proper CORS config

**Fix:**
```php
// routes/api.php
Route::prefix('admin/api')
    ->middleware(['auth:admin'])  // NOT auth:web!
    ->group(function () {
        // Routes
    });
```

```typescript
// apiService.ts
withCredentials: true,  // Required for cookies
```

### Redirect Loops

#### Issue: Infinite redirect between login and dashboard

**Symptoms:**
- Login → dashboard → login → dashboard (loop)
- Browser console shows multiple redirects
- Eventually get "Too many redirects" error

**Causes:**
1. **Route guard not recognizing authentication**
   - `checkAuth()` returning false even after successful login

2. **Session not persisting**
   - Cookies not being set or read correctly

3. **Conflicting route guards**
   - Multiple guards checking auth incorrectly

**Fix:**
```typescript
// router/index.ts
router.beforeEach(async (to, _from, next) => {
  const adminStore = useAdminStore();

  // Check if route is public FIRST
  const isPublicRoute = to.meta.isPublic === true;
  if (isPublicRoute) {
    // Prevent loop: if authenticated going to login, redirect to dashboard
    if (to.name === 'login' && adminStore.isAuthenticated) {
      next({ name: 'dashboard' });
      return;
    }
    next();
    return;
  }

  // Then check auth for protected routes
  // ...
});
```

#### Issue: Return URL causes redirect loop

**Symptoms:**
- Login with `?redirect=/admin/login`
- Causes infinite loop

**Fix:**
```typescript
// AdminLoginView.vue
const handleSubmit = async () => {
  await adminStore.login(credentials);

  const returnUrl = route.query.redirect as string;

  // Validate return URL (prevent redirecting back to login)
  if (returnUrl && returnUrl.startsWith('/') && !returnUrl.includes('/login')) {
    await router.replace(returnUrl);
  } else {
    await router.replace({ name: 'dashboard' });
  }
};
```

### Session Not Persisting

#### Issue: User logged out on page refresh

**Symptoms:**
- Login successful
- Page refresh → logged out
- Session not persisting across page loads

**Causes:**
1. **Using localStorage instead of sessionStorage** (vice versa)
   - If want persistence across sessions: use localStorage
   - If want security (clear on close): use sessionStorage

2. **Pinia persistence not configured**
   - Store not persisting at all

3. **Backend session not persisting**
   - Session driver misconfigured
   - Session lifetime too short

**Fix:**
```typescript
// adminStore.ts
export const useAdminStore = defineStore('admin', () => {
  // Store logic
}, {
  persist: {
    storage: sessionStorage,  // or localStorage for persistence
    pick: ['admin', 'isAuthenticated'],
  },
});
```

```env
# .env
SESSION_DRIVER=cookie
SESSION_LIFETIME=120  # 120 minutes
SESSION_SECURE_COOKIE=false  # true only for HTTPS
SESSION_SAME_SITE=lax
```

### 401 Errors

#### Issue: Random 401 errors during normal use

**Symptoms:**
- User authenticated
- Some requests work, others return 401
- Inconsistent behavior

**Causes:**
1. **CSRF token expired**
   - Token not refreshed
   - 419 handling not working

2. **Session expired on backend**
   - `SESSION_LIFETIME` too short
   - "Remember me" not working

3. **Mixed authentication guards**
   - Some routes using `auth:web`, others `auth:admin`

**Fix:**
```typescript
// api.ts - Auto-refresh CSRF on 419
this.client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 419 CSRF token mismatch
    if (error.response?.status === 419) {
      return this.fetchCSRFToken()
        .then(() => {
          const originalRequest = error.config;
          if (originalRequest) {
            return this.client.request(originalRequest);
          }
          return Promise.reject(error);
        });
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_remember');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
```

```php
// config/session.php
'lifetime' => env('SESSION_LIFETIME', 120),  // Increase if needed
```

#### Issue: 401 immediately after successful login

**Symptoms:**
- POST `/api/login` returns 200
- Next request (e.g., `/api/auth/check`) returns 401

**Causes:**
- Session cookie not being sent with subsequent requests
- `withCredentials: true` missing
- CORS misconfiguration

**Fix:**
```typescript
// apiService.ts
this.client = axios.create({
  baseURL: '/api',
  withCredentials: true,  // CRITICAL for cookies!
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
```

```php
// config/cors.php
'supports_credentials' => true,
```

---

## Summary

### Quick Reference

**Authentication:**
```typescript
import { useAdminStore } from '@admin/stores/adminStore';

const adminStore = useAdminStore();

// Login
await adminStore.login({ email, password, remember });

// Logout
await adminStore.logout();

// Check auth
const isAuth = await adminStore.checkAuth();

// Get current admin
console.log(adminStore.admin);
console.log(adminStore.adminRole);
```

**Authorization:**
```typescript
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const { hasRoleAccess, getRoleLabel } = useRoleHelpers();

// Check role access
const canEdit = hasRoleAccess(adminStore.adminRole, 'moderator');
const canDelete = hasRoleAccess(adminStore.adminRole, 'admin');

// Check specific roles
const isSuperAdmin = adminStore.isSuperAdmin;
const isAdmin = adminStore.isAdmin;
const hasRole = adminStore.hasRole('moderator');
```

**Route Protection:**
```typescript
{
  path: 'protected',
  meta: {
    requiresAuth: true,           // Require authentication
    requiredRole: 'admin',        // Require specific role
  },
}
```

**Component Authorization:**
```vue
<template>
  <Button
    v-if="adminStore.isAdmin"
    label="Admin Action"
  />
</template>
```

### Related Guides

- **[Admin Dashboard Development Guide](./.claude/guides/frontend/admin-dashboard-development-guide.md)** - Complete development workflow
- **[Admin Backend Guide](./.claude/guides/backend/admin-backend-guide.md)** - Backend authentication implementation

---

**Last Updated:** 2025-10-15
**Version:** 1.0.0
**Maintainer:** Admin Dashboard Team
