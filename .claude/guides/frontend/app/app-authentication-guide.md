# App Authentication Guide

## Overview

The user dashboard (`app.virtualracingleagues.localhost`) uses **session-based authentication** with cookies shared across subdomains. This guide explains the complete authentication architecture, implementation patterns, and best practices.

### Key Concepts

- **Session-Based Authentication**: Laravel session cookies authenticate users across requests
- **Subdomain Cookie Sharing**: Single session works across `virtualracingleagues.localhost` and `app.virtualracingleagues.localhost`
- **Protected Application**: ALL routes in the user dashboard require authentication
- **Automatic Redirects**: Unauthenticated users automatically redirected to public login
- **Persistent State**: User authentication state persists across page refreshes

## Authentication Architecture

### Session-Based Authentication

The application uses Laravel's built-in session authentication with cookies:

1. **Session Cookie**: Created on backend after successful login
2. **Subdomain Sharing**: Cookie accessible on all subdomains via `SESSION_DOMAIN=.virtualracingleagues.localhost`
3. **CSRF Protection**: XSRF-TOKEN cookie provides CSRF token for state-changing requests
4. **Automatic Validation**: Backend validates session on every API request

### Multi-Application Auth Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. User Login on Public Site (virtualracingleagues.localhost)      │
│    - User submits credentials                                       │
│    - Backend validates and creates session                          │
│    - Session cookie set with domain: .virtualracingleagues.localhost│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Redirect to App Subdomain (app.virtualracingleagues.localhost)  │
│    - Browser navigates to app subdomain                             │
│    - Session cookie automatically included (subdomain sharing)      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. App Checks Authentication                                        │
│    - Router guard calls userStore.checkAuth()                       │
│    - API request to /api/me includes session cookie                 │
│    - Backend validates session and returns user data                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Access Granted                                                   │
│    - User data stored in Pinia store                                │
│    - State persisted to localStorage                                │
│    - User can access protected routes                               │
└─────────────────────────────────────────────────────────────────────┘
```

**Session Configuration (`.env`)**:
```env
SESSION_DOMAIN=.virtualracingleagues.localhost  # Leading dot enables subdomain sharing
SESSION_DRIVER=database                          # Store sessions in database
SESSION_SAME_SITE=lax                           # Prevent CSRF, allow cross-subdomain
```

**Sanctum Configuration**:
```env
SANCTUM_STATEFUL_DOMAINS=virtualracingleagues.localhost,app.virtualracingleagues.localhost
```

This tells Laravel to trust these domains for stateful (session-based) authentication.

## Application Entry Point

### App Initialization (`resources/app/js/app.ts`)

The application initializes with specific authentication considerations:

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from '@app/router';
import App from '@app/components/App.vue';
import { useSiteConfigStore } from '@app/stores/siteConfigStore';

// PrimeVue imports...
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';

const app = createApp(App);
const pinia = createPinia();

// Register persistence plugin to save state to localStorage
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(PrimeVue, { theme: { preset: Aura } });
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);

// Initialize site configuration before mounting
const siteConfigStore = useSiteConfigStore();
siteConfigStore.fetchConfig().finally(() => {
  // Mount app regardless of config load success (will use defaults)
  app.mount('#user-app');
});
```

**Key Points**:

1. **Pinia Persistence Plugin**: Registered BEFORE `app.use(pinia)` to enable state persistence
2. **Site Config Fetch**: Happens BEFORE mounting to ensure config available
3. **Graceful Degradation**: App mounts even if config fetch fails (uses defaults)

## Router Guard

### Global Authentication Guard

Location: `resources/app/js/router/index.ts`

**ALL routes require authentication**. The router guard ensures unauthenticated users cannot access any page.

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LeagueList,
      meta: {
        title: 'My Leagues',
        requiresAuth: true,
      },
    },
    // All other routes...
  ],
});

// Get public site domain from environment
const getPublicDomain = (): string => {
  // Extract domain without 'app.' subdomain
  // e.g., http://app.virtualracingleagues.localhost -> http://virtualracingleagues.localhost
  return import.meta.env.VITE_APP_URL.replace('//app.', '//');
};

// Navigation guard - ALL routes require authentication
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  // Set page title
  const title = to.meta.title as string;
  document.title = title ? `${title} - User Dashboard` : 'User Dashboard';

  // All routes require authentication - check auth status
  const isAuthenticated = await userStore.checkAuth();

  if (!isAuthenticated) {
    // Redirect to public site login with return URL
    const publicDomain = getPublicDomain();
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${publicDomain}/login?redirect=${returnUrl}`;
    next(false); // Cancel navigation since we're doing a full page redirect
    return;
  }

  // User is authenticated, allow navigation
  next();
});

export default router;
```

### Guard Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to route (e.g., /leagues/123)                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. beforeEach guard triggered                                   │
│    - Set page title from route meta                             │
│    - Call userStore.checkAuth()                                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. checkAuth() makes API call to /api/me                        │
│    - If authenticated: returns true, user data stored           │
│    - If not authenticated: returns false                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
         ┌────────────────┴────────────────┐
         │                                  │
         ▼                                  ▼
┌──────────────────┐            ┌──────────────────────┐
│ Authenticated    │            │ Not Authenticated    │
│ - next()         │            │ - Redirect to public │
│ - Allow nav      │            │ - next(false)        │
└──────────────────┘            └──────────────────────┘
```

**Key Features**:

1. **Concurrent Auth Check Prevention**: Uses `authCheckPromise` to prevent multiple simultaneous auth checks
2. **Return URL Preservation**: Redirects include `?redirect=` param to return user to intended page after login
3. **Full Page Redirect**: Uses `window.location.href` instead of Vue Router for cross-subdomain navigation
4. **Page Title Management**: Sets document title from route meta

## User Store Authentication

### userStore Implementation

Location: `resources/app/js/stores/userStore.ts`

The central authentication state manager using Pinia.

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@app/types/user';
import { authService } from '@app/services/authService';

export const useUserStore = defineStore(
  'user',
  () => {
    // State
    const user = ref<User | null>(null);
    const isAuthenticated = ref(false);
    const isLoading = ref(false);
    const authCheckPromise = ref<Promise<boolean> | null>(null);

    // Getters
    const userName = computed((): string => {
      if (!user.value) return 'Guest';
      return `${user.value.first_name} ${user.value.last_name}`.trim() || 'Guest';
    });
    const userFirstName = computed((): string => user.value?.first_name || '');
    const userLastName = computed((): string => user.value?.last_name || '');
    const userEmail = computed((): string => user.value?.email || '');
    const isEmailVerified = computed((): boolean => user.value?.email_verified_at !== null);

    // Actions
    async function checkAuth(): Promise<boolean> {
      // Prevent concurrent auth checks
      if (authCheckPromise.value) {
        return authCheckPromise.value;
      }

      authCheckPromise.value = (async () => {
        try {
          const userData = await authService.checkAuth();

          if (userData) {
            setUser(userData);
            return true;
          } else {
            clearAuth();
            return false;
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          clearAuth();
          return false;
        } finally {
          authCheckPromise.value = null;
        }
      })();

      return authCheckPromise.value;
    }

    async function logout(): Promise<void> {
      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        clearAuth();
        // Redirect to public site login page with logout flag
        const publicDomain = getPublicDomain();
        window.location.href = `${publicDomain}/login?logout=1`;
      }
    }

    function setUser(userData: User): void {
      user.value = userData;
      isAuthenticated.value = true;
    }

    function clearAuth(): void {
      user.value = null;
      isAuthenticated.value = false;
    }

    // Other actions: login, updateProfile, resendVerificationEmail...

    return {
      user,
      isAuthenticated,
      isLoading,
      userName,
      userFirstName,
      userLastName,
      userEmail,
      isEmailVerified,
      login,
      logout,
      checkAuth,
      updateProfile,
      resendVerificationEmail,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['user', 'isAuthenticated'],
    },
  },
);
```

### checkAuth() Implementation

**Purpose**: Verify if user has valid session and fetch user data.

```typescript
async function checkAuth(): Promise<boolean> {
  // Prevent concurrent auth checks
  if (authCheckPromise.value) {
    return authCheckPromise.value;
  }

  authCheckPromise.value = (async () => {
    try {
      const userData = await authService.checkAuth();

      if (userData) {
        setUser(userData);
        return true;
      } else {
        clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuth();
      return false;
    } finally {
      authCheckPromise.value = null;
    }
  })();

  return authCheckPromise.value;
}
```

**Key Features**:

1. **Concurrent Check Prevention**: If `authCheckPromise` exists, return the existing promise instead of making another API call
2. **Promise Management**: Store promise in ref, clear when complete
3. **Graceful Error Handling**: Clear auth state on any error
4. **Boolean Return**: Returns `true` if authenticated, `false` otherwise

**Why Prevent Concurrent Checks?**

Without this pattern, rapid route navigation could trigger multiple simultaneous `/api/me` requests:
- User navigates from `/` to `/leagues/1`
- Both routes trigger `checkAuth()`
- Two identical API calls in flight

With the pattern, the second call reuses the first promise.

### logout() Implementation

**Purpose**: Destroy session on backend and redirect to public login.

```typescript
async function logout(): Promise<void> {
  try {
    await authService.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuth();
    // Redirect to public site login page with logout flag
    const publicDomain = getPublicDomain();
    window.location.href = `${publicDomain}/login?logout=1`;
  }
}
```

**Key Features**:

1. **Always Clear State**: `finally` block ensures local state cleared even if API call fails
2. **Logout Flag**: `?logout=1` param tells public site to clear its auth store
3. **Full Page Redirect**: Uses `window.location.href` for cross-subdomain navigation

**Why Use `?logout=1` Flag?**

The public site has its own auth store. When user logs out from app subdomain:
1. App subdomain calls `/api/logout` (destroys session)
2. App subdomain redirects to public site with `?logout=1`
3. Public site detects flag and clears its own store
4. Ensures both applications show logged-out state

### Persistence

The store uses `pinia-plugin-persistedstate` to persist authentication across page refreshes:

```typescript
{
  persist: {
    storage: localStorage,
    pick: ['user', 'isAuthenticated'],
  },
}
```

**What Gets Persisted**:
- `user`: User object with id, name, email, etc.
- `isAuthenticated`: Boolean flag

**What Doesn't Get Persisted**:
- `isLoading`: Temporary UI state
- `authCheckPromise`: Runtime promise reference

**Storage Key**: `user` (default key based on store name)

**Why Persist?**

Without persistence:
1. User refreshes page
2. Store resets to initial state (`user: null`, `isAuthenticated: false`)
3. Router guard triggers, sees not authenticated
4. Redirects to login (even though session valid!)

With persistence:
1. User refreshes page
2. Store loads from localStorage (`isAuthenticated: true`)
3. Router guard still calls `checkAuth()` to verify session
4. If session valid: continues; if expired: redirects to login

## Authentication Service

### authService Module

Location: `resources/app/js/services/authService.ts`

Class-based service that handles all authentication API calls.

```typescript
import { apiClient, apiService } from './api';
import type { User } from '@app/types/user';
import type { LoginCredentials } from '@app/types/auth';

class AuthService {
  async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<User> {
    await apiService.fetchCSRFToken();

    const response = await apiClient.post<{ data: { user: User } }>('/login', credentials, {
      signal,
    });

    return response.data.data.user;
  }

  async logout(signal?: AbortSignal): Promise<void> {
    try {
      await apiClient.post('/logout', {}, { signal });
    } catch (error) {
      // Always clear local state even if API call fails
      console.error('Logout API error:', error);
    }
  }

  async checkAuth(signal?: AbortSignal): Promise<User | null> {
    try {
      const response = await apiClient.get<{ data: { user: User } }>('/me', { signal });
      return response.data.data.user;
    } catch {
      return null;
    }
  }

  async resendVerificationEmail(signal?: AbortSignal): Promise<void> {
    await apiClient.post('/email/resend', {}, { signal });
  }

  async updateProfile(
    data: {
      first_name: string;
      last_name: string;
      email: string;
      password?: string;
      password_confirmation?: string;
      current_password?: string;
    },
    signal?: AbortSignal,
  ): Promise<User> {
    const response = await apiClient.put<{ data: { user: User } }>('/profile', data, { signal });
    return response.data.data.user;
  }

  async impersonate(token: string, signal?: AbortSignal): Promise<User> {
    await apiService.fetchCSRFToken();

    const response = await apiClient.post<{ data: { user: User } }>(
      '/impersonate',
      { token },
      { signal },
    );

    return response.data.data.user;
  }
}

export const authService = new AuthService();
```

### checkAuth() Method

```typescript
async checkAuth(signal?: AbortSignal): Promise<User | null> {
  try {
    const response = await apiClient.get<{ data: { user: User } }>('/me', { signal });
    return response.data.data.user;
  } catch {
    return null;
  }
}
```

**API Endpoint**: `GET /api/me`

**Returns**:
- `User` object if authenticated
- `null` if not authenticated or any error

**Features**:
- **Graceful Error Handling**: Returns `null` on any error (network, 401, etc.)
- **AbortSignal Support**: Allows cancelling in-flight requests
- **No Throwing**: Never throws, always returns null on failure

### logout() Method

```typescript
async logout(signal?: AbortSignal): Promise<void> {
  try {
    await apiClient.post('/logout', {}, { signal });
  } catch (error) {
    // Always clear local state even if API call fails
    console.error('Logout API error:', error);
  }
}
```

**API Endpoint**: `POST /api/logout`

**Features**:
- **Error Suppression**: Logs errors but doesn't throw
- **Network Failure Safe**: Clears local state even if API unreachable

## API Client Authentication

### CSRF Protection

Location: `resources/app/js/services/api.ts`

```typescript
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      withCredentials: true,  // Send cookies with every request
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for CSRF token
    this.client.interceptors.request.use((config) => {
      if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
        const token = this.getCSRFToken();
        if (token && config.headers) {
          config.headers['X-CSRF-TOKEN'] = token;
          config.headers['X-XSRF-TOKEN'] = token;
        }
      }
      return config;
    });

    // Response interceptor for errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 419 CSRF token mismatch
        if (error.response?.status === 419) {
          await this.fetchCSRFToken();
          const originalRequest = error.config;
          if (originalRequest) {
            return this.client.request(originalRequest);
          }
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          if (!window.location.pathname.includes('/login')) {
            if (window.location.hostname.includes('app.')) {
              window.location.href = `${import.meta.env.VITE_APP_URL}/login`;
            } else {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private getCSRFToken(): string | null {
    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find((c) => c.trim().startsWith('XSRF-TOKEN='));
    if (!xsrfCookie) return null;
    const tokenValue = xsrfCookie.split('=')[1];
    return tokenValue ? decodeURIComponent(tokenValue) : null;
  }

  async fetchCSRFToken(): Promise<void> {
    await this.client.get('/csrf-cookie');
  }
}
```

**Key Features**:

1. **Automatic CSRF Token Injection**: Request interceptor adds token to all state-changing requests
2. **419 Error Auto-Retry**: If CSRF token invalid, fetch fresh token and retry request
3. **401 Auto-Redirect**: If session expired, automatically redirect to login
4. **withCredentials**: Ensures session cookies sent with every request

### Session Validation

Every API request includes the session cookie:

```typescript
withCredentials: true  // Send cookies with every request
```

Backend validates session cookie and returns:
- **200 OK**: Session valid, request processed
- **401 Unauthorized**: Session invalid/expired, user must re-authenticate
- **419 CSRF Mismatch**: CSRF token invalid (auto-retried)

## Environment Configuration

### Required Environment Variables

```env
# Session Configuration (Critical for subdomain auth)
SESSION_DOMAIN=.virtualracingleagues.localhost   # Leading dot enables subdomain sharing
SESSION_DRIVER=database                          # Store sessions in database
SESSION_SAME_SITE=lax                           # Prevent CSRF while allowing subdomain sharing
SESSION_LIFETIME=120                            # Session timeout in minutes

# Sanctum Stateful Domains
SANCTUM_STATEFUL_DOMAINS=virtualracingleagues.localhost,app.virtualracingleagues.localhost

# Vite Configuration
VITE_APP_URL=http://virtualracingleagues.localhost  # Public site URL
VITE_APP_DOMAIN=app.virtualracingleagues.localhost  # App subdomain
```

**Variable Explanations**:

| Variable | Purpose | Critical Detail |
|----------|---------|-----------------|
| `SESSION_DOMAIN` | Determines which domains can access session cookie | **MUST** have leading dot (`.virtualracingleagues.localhost`) |
| `SESSION_DRIVER` | Where sessions stored | Use `database` for production, `file` for local dev |
| `SESSION_SAME_SITE` | CSRF protection level | `lax` allows cross-subdomain but prevents cross-site |
| `SANCTUM_STATEFUL_DOMAINS` | Trusted domains for stateful auth | Comma-separated list of all app domains |
| `VITE_APP_URL` | Public site URL | Used to construct redirect URLs |

**Why Leading Dot in SESSION_DOMAIN?**

```
.virtualracingleagues.localhost  ✅  Works on virtualracingleagues.localhost AND app.virtualracingleagues.localhost
virtualracingleagues.localhost   ❌  Only works on virtualracingleagues.localhost
```

## Authentication Flow Examples

### 1. First Visit Flow (Not Authenticated)

User navigates to `app.virtualracingleagues.localhost` for the first time:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User enters app.virtualracingleagues.localhost in browser   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Browser loads HTML, JS, CSS                                  │
│    - App initializes (app.ts)                                   │
│    - Pinia store created                                        │
│    - Router created                                             │
│    - App mounts to #user-app                                    │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Router tries to navigate to / (home route)                   │
│    - beforeEach guard triggered                                 │
│    - Calls userStore.checkAuth()                                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. checkAuth() makes API call                                   │
│    - GET /api/me                                                │
│    - No session cookie (user never logged in)                   │
│    - Backend returns 401 Unauthorized                           │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. authService.checkAuth() returns null                         │
│    - userStore.checkAuth() returns false                        │
│    - Router guard sees not authenticated                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Redirect to public login                                     │
│    - URL: http://virtualracingleagues.localhost/login?redirect=│
│           http://app.virtualracingleagues.localhost/           │
│    - User sees login form                                       │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. User logs in on public site                                  │
│    - Backend creates session                                    │
│    - Session cookie set (domain: .virtualracingleagues.localhost)│
│    - Public site redirects to return URL                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Back to app subdomain (with session cookie!)                │
│    - Router guard calls checkAuth() again                       │
│    - GET /api/me with session cookie                            │
│    - Backend validates session, returns user data               │
│    - Navigation allowed                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Authenticated User Flow

User with valid session visits app:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to app.virtualracingleagues.localhost        │
│    - Session cookie already in browser                          │
│    - LocalStorage has persisted user state                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. App initializes                                              │
│    - Pinia loads persisted state from localStorage              │
│    - user: { id: 1, first_name: "John", ... }                  │
│    - isAuthenticated: true                                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Router guard calls checkAuth()                               │
│    - Even though localStorage says authenticated                │
│    - Still verify session with backend                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. GET /api/me with session cookie                              │
│    - Backend validates session                                  │
│    - Returns user data                                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Store updates with fresh user data                           │
│    - isAuthenticated: true                                      │
│    - Navigation allowed                                         │
│    - Component renders with user data                           │
└─────────────────────────────────────────────────────────────────┘
```

**Why Check Auth Even With Persisted State?**

LocalStorage can be stale:
- User logged out from another tab
- Session expired on backend
- Admin disabled user account

Always verify session on navigation to ensure security.

### 3. Logout Flow

User clicks logout button in Header:

```vue
<script setup lang="ts">
import { useUserStore } from '@app/stores/userStore';

const userStore = useUserStore();

async function handleLogout() {
  await userStore.logout();
  // Note: logout() will redirect to public site, no need to push route
}
</script>

<template>
  <button @click="handleLogout">
    Logout
  </button>
</template>
```

**Flow**:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks Logout button                                    │
│    - Calls userStore.logout()                                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. userStore.logout() calls authService.logout()                │
│    - POST /api/logout                                           │
│    - Backend destroys session                                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Store clears local state (in finally block)                  │
│    - user: null                                                 │
│    - isAuthenticated: false                                     │
│    - LocalStorage updated                                       │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Redirect to public login                                     │
│    - URL: http://virtualracingleagues.localhost/login?logout=1 │
│    - Public site sees logout=1 flag                             │
│    - Public site clears its auth store                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Session Expired Flow

User has been idle, session expires on backend:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates or makes API call                             │
│    - Session cookie sent with request                           │
│    - Backend checks session: EXPIRED                            │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Backend returns 401 Unauthorized                             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Axios response interceptor catches 401                       │
│    - Checks not already on login page                           │
│    - Redirects to public login                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. User must re-authenticate                                    │
│    - Login on public site                                       │
│    - Redirected back to app                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Automatic Redirect Code**:

```typescript
// In api.ts response interceptor
if (error.response?.status === 401) {
  if (!window.location.pathname.includes('/login')) {
    if (window.location.hostname.includes('app.')) {
      window.location.href = `${import.meta.env.VITE_APP_URL}/login`;
    } else {
      window.location.href = '/login';
    }
  }
}
```

## Testing Authentication

### Testing Router Guard

Mock router and store to test authentication logic:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@app/stores/userStore';

describe('Router Auth Guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should redirect unauthenticated users to public login', async () => {
    const userStore = useUserStore();
    vi.spyOn(userStore, 'checkAuth').mockResolvedValue(false);

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          component: { template: '<div>Home</div>' },
          meta: { requiresAuth: true },
        },
      ],
    });

    // Add guard
    router.beforeEach(async (to, from, next) => {
      const isAuthenticated = await userStore.checkAuth();
      if (!isAuthenticated) {
        window.location.href = '/login';
        next(false);
      } else {
        next();
      }
    });

    await router.push('/');

    // Should not navigate
    expect(router.currentRoute.value.path).not.toBe('/');
  });

  it('should allow authenticated users to navigate', async () => {
    const userStore = useUserStore();
    vi.spyOn(userStore, 'checkAuth').mockResolvedValue(true);

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          component: { template: '<div>Home</div>' },
          meta: { requiresAuth: true },
        },
      ],
    });

    router.beforeEach(async (to, from, next) => {
      const isAuthenticated = await userStore.checkAuth();
      if (!isAuthenticated) {
        next(false);
      } else {
        next();
      }
    });

    await router.push('/');

    expect(router.currentRoute.value.path).toBe('/');
  });
});
```

### Testing userStore

From `resources/app/js/stores/__tests__/userStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@app/stores/userStore';
import { authService } from '@app/services/authService';
import type { User } from '@app/types/user';

vi.mock('@app/services/authService');

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should check auth and set user if authenticated', async () => {
    const mockUser: User = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: '2024-01-01T00:00:00.000Z',
    };

    vi.mocked(authService.checkAuth).mockResolvedValue(mockUser);

    const userStore = useUserStore();
    const result = await userStore.checkAuth();

    expect(result).toBe(true);
    expect(userStore.user).toEqual(mockUser);
    expect(userStore.isAuthenticated).toBe(true);
  });

  it('should check auth and clear user if not authenticated', async () => {
    vi.mocked(authService.checkAuth).mockResolvedValue(null);

    const userStore = useUserStore();
    const result = await userStore.checkAuth();

    expect(result).toBe(false);
    expect(userStore.user).toBeNull();
    expect(userStore.isAuthenticated).toBe(false);
  });

  it('should clear user on logout even if API call fails', async () => {
    const userStore = useUserStore();
    userStore.user = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };
    userStore.isAuthenticated = true;

    vi.mocked(authService.logout).mockRejectedValue(new Error('API error'));

    await userStore.logout();

    expect(userStore.user).toBeNull();
    expect(userStore.isAuthenticated).toBe(false);
  });
});
```

### Testing authService

From `resources/app/js/services/__tests__/authService.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@app/services/authService';
import { apiClient } from '@app/services/api';
import type { User } from '@app/types/user';

vi.mock('@app/services/api');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAuth', () => {
    it('should return user if authenticated', async () => {
      const mockUser: User = {
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

      expect(apiClient.get).toHaveBeenCalledWith('/me', { signal: undefined });
      expect(result).toEqual(mockUser);
    });

    it('should return null if not authenticated', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Unauthorized'));

      const result = await authService.checkAuth();

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should not throw error if logout fails', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      await expect(authService.logout()).resolves.not.toThrow();
    });
  });
});
```

## Common Scenarios

### 1. Adding a Protected Route

All routes are protected by default. Just add the route:

```typescript
// resources/app/js/router/index.ts
{
  path: '/settings',
  name: 'settings',
  component: () => import('@app/views/Settings.vue'),
  meta: {
    title: 'Settings',
    requiresAuth: true,  // This is the default, can omit
  },
}
```

The global `beforeEach` guard handles authentication for ALL routes.

### 2. Checking Auth Status in Components

```vue
<script setup lang="ts">
import { useUserStore } from '@app/stores/userStore';

const userStore = useUserStore();

// Access user data
console.log('User:', userStore.user);
console.log('Is authenticated:', userStore.isAuthenticated);
console.log('User name:', userStore.userName);
console.log('Email verified:', userStore.isEmailVerified);
</script>

<template>
  <div>
    <h1>Welcome, {{ userStore.userName }}!</h1>

    <div v-if="!userStore.isEmailVerified" class="alert">
      Please verify your email address.
      <button @click="userStore.resendVerificationEmail()">
        Resend Verification Email
      </button>
    </div>

    <p>Email: {{ userStore.userEmail }}</p>
  </div>
</template>
```

### 3. Handling Profile Updates

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@app/stores/userStore';
import { useToast } from 'primevue/usetoast';

const userStore = useUserStore();
const toast = useToast();

const firstName = ref(userStore.userFirstName);
const lastName = ref(userStore.userLastName);
const email = ref(userStore.userEmail);

async function handleSave() {
  try {
    await userStore.updateProfile({
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
    });

    toast.add({
      severity: 'success',
      summary: 'Profile Updated',
      detail: 'Your profile has been updated successfully',
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update profile',
      life: 3000,
    });
  }
}
</script>

<template>
  <form @submit.prevent="handleSave">
    <InputText v-model="firstName" placeholder="First Name" />
    <InputText v-model="lastName" placeholder="Last Name" />
    <InputText v-model="email" placeholder="Email" type="email" />

    <Button type="submit" :loading="userStore.isLoading">
      Save Changes
    </Button>
  </form>
</template>
```

### 4. Email Verification Banner

```vue
<script setup lang="ts">
import { useUserStore } from '@app/stores/userStore';
import { useToast } from 'primevue/usetoast';

const userStore = useUserStore();
const toast = useToast();

async function resendVerification() {
  try {
    await userStore.resendVerificationEmail();
    toast.add({
      severity: 'success',
      summary: 'Email Sent',
      detail: 'Verification email sent successfully',
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Send Failed',
      detail: 'Failed to send verification email',
      life: 3000,
    });
  }
}
</script>

<template>
  <div v-if="!userStore.isEmailVerified" class="verification-banner">
    <p>Your email address is not verified.</p>
    <Button @click="resendVerification" severity="warning" size="small">
      Resend Verification Email
    </Button>
  </div>
</template>

<style scoped>
.verification-banner {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

## Troubleshooting

### Common Issues

#### 1. Redirect Loop

**Symptoms**: App keeps redirecting between app subdomain and public login.

**Causes**:
- `SESSION_DOMAIN` missing leading dot
- `SANCTUM_STATEFUL_DOMAINS` doesn't include app subdomain
- Backend session configuration incorrect

**Solution**:
```env
# ❌ Wrong
SESSION_DOMAIN=virtualracingleagues.localhost

# ✅ Correct
SESSION_DOMAIN=.virtualracingleagues.localhost

# ✅ Correct
SANCTUM_STATEFUL_DOMAINS=virtualracingleagues.localhost,app.virtualracingleagues.localhost
```

Clear cookies and try again.

#### 2. 401 Errors on Every Request

**Symptoms**: Every API call returns 401, even after login.

**Causes**:
- `withCredentials` not set to `true` in axios
- CORS configuration incorrect
- `SESSION_SAME_SITE` set to `strict` (should be `lax`)

**Solution**:
```typescript
// Verify in api.ts
this.client = axios.create({
  baseURL: '/api',
  withCredentials: true,  // ✅ Must be true
});
```

```env
# ✅ Correct
SESSION_SAME_SITE=lax
```

#### 3. CSRF Token Mismatch (419)

**Symptoms**: POST/PUT/DELETE requests fail with 419 error.

**Causes**:
- XSRF-TOKEN cookie missing
- Request interceptor not adding token
- Token expired

**Solution**:

The app automatically retries 419 errors:
```typescript
// In api.ts - already implemented
if (error.response?.status === 419) {
  await this.fetchCSRFToken();  // Fetch fresh token
  const originalRequest = error.config;
  if (originalRequest) {
    return this.client.request(originalRequest);  // Retry
  }
}
```

If issue persists:
1. Clear cookies
2. Check browser console for XSRF-TOKEN cookie
3. Verify `/csrf-cookie` endpoint working

#### 4. User State Not Persisting

**Symptoms**: User logged out after page refresh, even though session valid.

**Causes**:
- `pinia-plugin-persistedstate` not installed
- Plugin not registered
- LocalStorage blocked/disabled

**Solution**:
```typescript
// Verify in app.ts
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);  // ✅ Must register BEFORE app.use(pinia)
```

Check browser console for localStorage errors.

#### 5. Logout Not Working

**Symptoms**: Click logout, but user still authenticated.

**Causes**:
- `authService.logout()` not called
- Backend not destroying session
- Store not clearing state

**Solution**:

Verify logout flow:
```vue
<script setup lang="ts">
const userStore = useUserStore();

async function handleLogout() {
  await userStore.logout();  // ✅ Calls service, clears state, redirects
}
</script>
```

Check network tab: POST `/api/logout` should return 200/204.

## Security Considerations

### 1. Never Store Passwords

**❌ Wrong**:
```typescript
const password = ref('');
localStorage.setItem('password', password.value);  // NEVER DO THIS
```

**✅ Correct**:
```typescript
// Only store user data, not credentials
const user = ref<User | null>(null);
// Backend handles password hashing and validation
```

### 2. Session Timeout

Sessions automatically expire after `SESSION_LIFETIME` minutes (default 120).

**Backend Configuration** (`.env`):
```env
SESSION_LIFETIME=120  # 2 hours
```

**Frontend Handling**:
- 401 interceptor automatically redirects to login
- No manual session timeout tracking needed

### 3. CSRF Protection

**Always Enabled** for state-changing requests (POST, PUT, PATCH, DELETE).

**Automatic Implementation**:
```typescript
// Request interceptor adds token
config.headers['X-CSRF-TOKEN'] = token;
config.headers['X-XSRF-TOKEN'] = token;
```

**Backend Verification**:
Laravel automatically validates CSRF tokens on all state-changing requests.

### 4. Secure Cookies

**Configuration** (`.env`):
```env
SESSION_SAME_SITE=lax       # Prevents CSRF attacks
SESSION_SECURE_COOKIE=false # Set to true in production (HTTPS)
```

**Cookie Attributes**:
- `HttpOnly`: True (prevents JavaScript access)
- `Secure`: True in production (HTTPS only)
- `SameSite=Lax`: Prevents CSRF, allows subdomain sharing

### 5. XSS Protection

**Vue Template Auto-Escaping**:
```vue
<template>
  <!-- ✅ Safe - Vue auto-escapes -->
  <p>{{ userStore.userName }}</p>

  <!-- ❌ Dangerous - use v-html only with sanitized content -->
  <div v-html="userInput"></div>
</template>
```

**Never Render Unsanitized User Input**:
```typescript
// ❌ Wrong
element.innerHTML = userInput;

// ✅ Correct
element.textContent = userInput;
```

## Best Practices

### 1. Always Use userStore for Auth

**❌ Wrong**:
```typescript
// Don't check auth in components directly
const isLoggedIn = ref(false);

async function checkLogin() {
  const response = await fetch('/api/me');
  isLoggedIn.value = response.ok;
}
```

**✅ Correct**:
```vue
<script setup lang="ts">
import { useUserStore } from '@app/stores/userStore';

const userStore = useUserStore();

// Use store getters
if (userStore.isAuthenticated) {
  console.log('User:', userStore.user);
}
</script>
```

### 2. Handle 401 Errors Gracefully

The axios interceptor handles 401 automatically, but you can add user feedback:

```typescript
import { useToast } from 'primevue/usetoast';

const toast = useToast();

async function fetchData() {
  try {
    const data = await apiClient.get('/data');
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      toast.add({
        severity: 'warn',
        summary: 'Session Expired',
        detail: 'Please log in again',
        life: 3000,
      });
    }
    throw error;
  }
}
```

### 3. Check Auth Status Before Protected Actions

Even though routes are protected, double-check for sensitive operations:

```typescript
async function deleteAccount() {
  // Double-check authentication
  if (!userStore.isAuthenticated) {
    toast.add({
      severity: 'error',
      summary: 'Not Authenticated',
      detail: 'Please log in to continue',
    });
    return;
  }

  // Proceed with deletion
  await apiClient.delete('/account');
}
```

### 4. Use Return URL for Redirects

When redirecting to login, preserve intended destination:

```typescript
// ✅ Correct - includes return URL
const returnUrl = encodeURIComponent(window.location.href);
window.location.href = `${publicDomain}/login?redirect=${returnUrl}`;

// After login, public site redirects back to return URL
```

### 5. Test Auth Flows Thoroughly

**Test Scenarios**:
- ✅ Login → Access protected route
- ✅ Logout → Redirect to login
- ✅ Session expiry → Auto-redirect
- ✅ Concurrent auth checks → Single API call
- ✅ Page refresh → State persists
- ✅ Multiple tabs → Logout affects all

**Example Test**:
```typescript
it('should handle session expiry', async () => {
  const userStore = useUserStore();

  // Set authenticated state
  userStore.user = mockUser;
  userStore.isAuthenticated = true;

  // Mock expired session
  vi.mocked(authService.checkAuth).mockResolvedValue(null);

  // Check auth
  const result = await userStore.checkAuth();

  // Should clear state
  expect(result).toBe(false);
  expect(userStore.user).toBeNull();
  expect(userStore.isAuthenticated).toBe(false);
});
```

---

## Summary

The app subdomain authentication system provides:

✅ **Seamless Subdomain Auth**: Login once on public site, access app immediately
✅ **Automatic Protection**: All routes require authentication by default
✅ **Graceful Error Handling**: Session expiry and 401 errors handled automatically
✅ **State Persistence**: User data persists across page refreshes
✅ **CSRF Protection**: Automatic token management for all state-changing requests
✅ **Type Safety**: Full TypeScript support across store, services, and components

**Key Takeaways**:
- Session cookies shared via `SESSION_DOMAIN=.virtualracingleagues.localhost`
- Router guard checks auth on every navigation
- userStore manages authentication state with Pinia
- authService handles all API communication
- Axios interceptors provide automatic 401/419 handling
- State persists to localStorage via pinia-plugin-persistedstate

**Remember**: The authentication flow is designed to be invisible to users. When implemented correctly, users log in once and seamlessly access all protected resources until they explicitly log out or their session expires.
