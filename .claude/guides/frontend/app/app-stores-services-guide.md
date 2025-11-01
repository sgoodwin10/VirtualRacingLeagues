# App Stores & Services Guide

> **Complete guide to state management and API integration for the User Dashboard (`resources/app/`)**

## Table of Contents
- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [Pinia Stores (State Management)](#pinia-stores-state-management)
- [API Services](#api-services)
- [Data Flow](#data-flow)
- [TypeScript Types](#typescript-types)
- [Testing](#testing)
- [Best Practices](#best-practices)

---

## Overview

The User Dashboard uses a **layered architecture** that separates concerns and makes the codebase maintainable, testable, and scalable:

```
┌─────────────────────────────────────────────────────────────┐
│  Component Layer (Vue Components)                           │
│  • User interactions                                        │
│  • Display logic                                            │
│  • Reactive state consumption                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Store Layer (Pinia Stores)                                 │
│  • State management                                         │
│  • Business logic                                           │
│  • Actions (async operations)                               │
│  • Getters (derived state)                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (API Services)                               │
│  • HTTP requests                                            │
│  • Data transformation                                      │
│  • Type safety                                              │
│  • Response extraction                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  API Client (Axios)                                         │
│  • CSRF token handling                                      │
│  • Error interceptors                                       │
│  • Authentication                                           │
└─────────────────────────────────────────────────────────────┘
```

### Why Separate Stores and Services?

1. **Single Responsibility**:
   - **Stores** manage state and business logic
   - **Services** handle HTTP communication only

2. **Testability**:
   - Mock services in store tests
   - Mock apiClient in service tests
   - Test components with mocked stores

3. **Reusability**:
   - Services can be used by multiple stores
   - Stores can be used by multiple components

4. **Type Safety**:
   - Services provide typed API responses
   - Stores provide typed state and actions

---

## Architecture Principles

### 1. Component → Store → Service → API
Components **never** call services directly. Always go through stores:

```typescript
// ❌ BAD: Component calling service directly
import { createLeague } from '@app/services/leagueService';

async function handleSubmit() {
  const league = await createLeague(formData); // DON'T DO THIS
}

// ✅ GOOD: Component calling store
import { useLeagueStore } from '@app/stores/leagueStore';

const leagueStore = useLeagueStore();

async function handleSubmit() {
  await leagueStore.createNewLeague(formData); // Correct approach
}
```

### 2. Services Extract Response Data
Services **always** extract `response.data.data` and return typed data:

```typescript
// ✅ Service extracts the data
export async function getPlatforms(): Promise<Platform[]> {
  const response: AxiosResponse<ApiResponse<Platform[]>> =
    await apiClient.get('/platforms');
  return response.data.data; // Extract here
}

// ✅ Store receives clean data
async function fetchPlatforms(): Promise<void> {
  platforms.value = await getPlatforms(); // Already extracted
}
```

### 3. Stores Handle Errors
Stores catch errors from services and set error state:

```typescript
async function fetchLeagues(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    leagues.value = await getUserLeagues();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error
      ? err.message
      : 'Failed to load leagues';
    error.value = errorMessage;
    throw err; // Re-throw for component to handle
  } finally {
    loading.value = false;
  }
}
```

---

## Pinia Stores (State Management)

### Store Pattern

All stores follow the **Composition API style** using the `setup()` function pattern:

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Entity } from '@app/types/entity';
import { getEntities, createEntity } from '@app/services/entityService';

export const useEntityStore = defineStore('entity', () => {
  // ==================== STATE ====================
  const entities = ref<Entity[]>([]);
  const currentEntity = ref<Entity | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ==================== GETTERS ====================
  const entityCount = computed(() => entities.value.length);
  const hasEntities = computed(() => entities.value.length > 0);

  // ==================== ACTIONS ====================
  async function fetchEntities(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      entities.value = await getEntities();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to load entities';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createNewEntity(data: CreateEntityForm): Promise<Entity> {
    loading.value = true;
    error.value = null;

    try {
      const entity = await createEntity(data);
      entities.value.push(entity);
      currentEntity.value = entity;
      return entity;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to create entity';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  // ==================== RETURN ====================
  return {
    // State
    entities,
    currentEntity,
    loading,
    error,

    // Getters
    entityCount,
    hasEntities,

    // Actions
    fetchEntities,
    createNewEntity,
    clearError,
  };
});
```

---

### Core Stores

#### 1. userStore - Authentication & User Profile

**Location**: `/var/www/resources/app/js/stores/userStore.ts`

**Purpose**: Manages user authentication state, profile data, and auth operations.

**Key Features**:
- Persisted state using `pinia-plugin-persistedstate`
- Concurrent auth check prevention
- Cross-subdomain logout redirect

**State**:
```typescript
const user = ref<User | null>(null);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const authCheckPromise = ref<Promise<boolean> | null>(null);
```

**Getters**:
```typescript
const userName = computed((): string => {
  if (!user.value) return 'Guest';
  return `${user.value.first_name} ${user.value.last_name}`.trim() || 'Guest';
});

const userEmail = computed((): string => user.value?.email || '');
const isEmailVerified = computed((): boolean =>
  user.value?.email_verified_at !== null
);
```

**Actions**:
- `login(credentials: LoginCredentials): Promise<void>` - Authenticate user
- `logout(): Promise<void>` - Sign out and redirect to public site
- `checkAuth(): Promise<boolean>` - Verify authentication status (prevents concurrent calls)
- `updateProfile(data): Promise<void>` - Update user profile
- `resendVerificationEmail(): Promise<void>` - Resend email verification

**Persistence Configuration**:
```typescript
{
  persist: {
    storage: localStorage,
    pick: ['user', 'isAuthenticated'], // Only persist these fields
  },
}
```

**Concurrent Auth Check Prevention**:
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

---

#### 2. siteConfigStore - Global Configuration

**Location**: `/var/www/resources/app/js/stores/siteConfigStore.ts`

**Purpose**: Manages site-wide configuration (site name, logo, etc.).

**State**:
```typescript
const siteName = ref('');
const logoUrl = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
```

**Usage**:
Called in `app.ts` before mounting the app:
```typescript
// app.ts
const siteConfigStore = useSiteConfigStore();
await siteConfigStore.fetchSiteConfig();

app.mount('#app');
```

---

#### 3. leagueStore - League Management

**Location**: `/var/www/resources/app/js/stores/leagueStore.ts`

**Purpose**: Manages leagues, platforms, timezones, and league CRUD operations.

**State**:
```typescript
const leagues = ref<League[]>([]);
const platforms = ref<Platform[]>([]);
const timezones = ref<Timezone[]>([]);
const currentLeague = ref<League | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const currentStep = ref(0); // Wizard state

// Platform configuration
const platformColumns = ref<PlatformColumn[]>([]);
const platformFormFields = ref<PlatformFormField[]>([]);
const platformCsvHeaders = ref<PlatformCsvHeader[]>([]);
```

**Getters**:
```typescript
const hasReachedFreeLimit = computed(() => {
  // Free tier allows 1 league
  return leagues.value.length >= 1;
});

const leagueCount = computed(() => leagues.value.length);

const activePlatforms = computed(() => {
  return platforms.value.filter((p) => p.id);
});
```

**Actions**:
```typescript
// Platform/Timezone data
fetchPlatforms(): Promise<void>
fetchTimezones(): Promise<void>

// Slug validation
checkSlug(name: string, leagueId?: number): Promise<SlugCheckResponse>

// League CRUD
createNewLeague(form: CreateLeagueForm): Promise<League>
fetchLeagues(): Promise<void>
fetchLeague(id: number): Promise<League>
updateExistingLeague(leagueId: number, form: UpdateLeagueForm): Promise<League>
removeLeague(id: number): Promise<void>

// Wizard management
setCurrentStep(step: number): void
resetWizard(): void

// Platform-specific configurations
fetchDriverColumnsForLeague(leagueId: number): Promise<void>
fetchDriverFormFieldsForLeague(leagueId: number): Promise<void>
fetchDriverCsvHeadersForLeague(leagueId: number): Promise<void>

// Utility
clearError(): void
```

**Free Tier Limit Logic**:
```typescript
const hasReachedFreeLimit = computed(() => {
  return leagues.value.length >= 1; // Free tier allows 1 league
});
```

---

### Domain Stores

The app includes 10 domain-specific stores following the same pattern:

| Store | Purpose | Key Features |
|-------|---------|--------------|
| **competitionStore** | Competition CRUD | Competition management for leagues |
| **seasonStore** | Season CRUD | Season management for competitions |
| **driverStore** | Driver management | Search, filter, pagination, CSV import |
| **seasonDriverStore** | Season-driver relationships | Add/remove drivers from seasons |
| **teamStore** | Team CRUD | Team management |
| **divisionStore** | Division CRUD | Division management |
| **roundStore** | Round CRUD | Round management for seasons |
| **raceStore** | Race CRUD | Race management for rounds |
| **raceSettingsStore** | Race settings | Race configuration |
| **trackStore** | Track search | Track data retrieval |

#### Example: driverStore (Advanced Features)

**Location**: `/var/www/resources/app/js/stores/driverStore.ts`

**Purpose**: Manages league drivers with search, filtering, and pagination.

**State**:
```typescript
const drivers = ref<LeagueDriver[]>([]);
const currentDriver = ref<LeagueDriver | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Pagination state
const currentPage = ref(1);
const perPage = ref(15);
const totalDrivers = ref(0);
const lastPage = ref(1);

// Filter state
const searchQuery = ref('');
const statusFilter = ref<DriverStatus | 'all'>('all');
```

**Getters**:
```typescript
const activeDrivers = computed(() =>
  drivers.value?.filter((driver) => driver.status === 'active') ?? []
);

const inactiveDrivers = computed(() =>
  drivers.value?.filter((driver) => driver.status === 'inactive') ?? []
);

const bannedDrivers = computed(() =>
  drivers.value?.filter((driver) => driver.status === 'banned') ?? []
);

const driverStats = computed((): DriverStats => ({
  total: totalDrivers.value,
  active: activeDrivers.value.length,
  inactive: inactiveDrivers.value.length,
  banned: bannedDrivers.value.length,
}));

const hasNextPage = computed(() => currentPage.value < lastPage.value);
const hasPreviousPage = computed(() => currentPage.value > 1);
```

**Actions**:
```typescript
// CRUD operations
fetchLeagueDrivers(leagueId, params?): Promise<void>
createNewDriver(leagueId, data): Promise<LeagueDriver>
fetchLeagueDriver(leagueId, driverId): Promise<LeagueDriver>
updateDriver(leagueId, driverId, data): Promise<LeagueDriver>
removeDriver(leagueId, driverId): Promise<void>
importCSV(leagueId, csvData): Promise<ImportDriversResponse>

// Filter/Search
setSearchQuery(query: string): void
setStatusFilter(status: DriverStatus | 'all'): void
resetFilters(): void

// Pagination
nextPage(): void
previousPage(): void
goToPage(page: number): void

// Utility
clearError(): void
resetStore(): void
```

**Advanced Feature - CSV Import**:
```typescript
async function importCSV(leagueId: number, csvData: string) {
  loading.value = true;
  error.value = null;

  try {
    const result = await importDriversFromCSV(leagueId, csvData);

    // Refresh the driver list after import
    await fetchLeagueDrivers(leagueId);

    return result;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error
      ? err.message
      : 'Failed to import drivers';
    error.value = errorMessage;
    throw err;
  } finally {
    loading.value = false;
  }
}
```

---

### Store Best Practices

#### 1. Keep Stores Focused (Single Responsibility)
Each store manages a single domain:

```typescript
// ✅ GOOD: Focused store
export const useDriverStore = defineStore('driver', () => {
  // Only driver-related state and actions
});

// ❌ BAD: Mixed concerns
export const useMixedStore = defineStore('mixed', () => {
  const drivers = ref([]);
  const teams = ref([]); // Should be in teamStore
  const races = ref([]); // Should be in raceStore
});
```

#### 2. Use Actions for Async Operations
All async operations should be actions:

```typescript
// ✅ GOOD: Async operation in action
async function fetchLeagues(): Promise<void> {
  loading.value = true;
  try {
    leagues.value = await getUserLeagues();
  } finally {
    loading.value = false;
  }
}

// ❌ BAD: Direct async mutation
// Don't do this in components:
leagues.value = await getUserLeagues();
```

#### 3. Use Getters for Derived State
Computed values should be getters, not actions:

```typescript
// ✅ GOOD: Getter for derived state
const activeDrivers = computed(() =>
  drivers.value.filter(d => d.status === 'active')
);

// ❌ BAD: Action for derived state
function getActiveDrivers() {
  return drivers.value.filter(d => d.status === 'active');
}
```

#### 4. Handle Errors Gracefully
Always provide user-friendly error messages:

```typescript
try {
  leagues.value = await getUserLeagues();
} catch (err: unknown) {
  // Extract meaningful error message
  const errorMessage = err instanceof Error
    ? err.message
    : 'Failed to load leagues';
  error.value = errorMessage;
  throw err; // Re-throw for component handling
}
```

#### 5. Return Promises from Actions
Allow components to await actions:

```typescript
// ✅ GOOD: Returns promise
async function createNewLeague(form: CreateLeagueForm): Promise<League> {
  loading.value = true;
  try {
    const league = await createLeague(formData);
    leagues.value.push(league);
    return league; // Component can await this
  } finally {
    loading.value = false;
  }
}
```

#### 6. Use TypeScript for Full Type Safety
Always type your state, getters, and actions:

```typescript
// ✅ GOOD: Fully typed
const leagues = ref<League[]>([]);
const currentLeague = ref<League | null>(null);

async function fetchLeague(id: number): Promise<League> {
  const league = await getLeague(id);
  return league;
}

// ❌ BAD: No types
const leagues = ref([]);
const currentLeague = ref(null);
```

---

## API Services

### API Client (`api.ts`)

**Location**: `/var/www/resources/app/js/services/api.ts`

**Purpose**: Centralized Axios instance with CSRF token handling and error interceptors.

**Configuration**:
```typescript
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',              // All requests go to /api
      withCredentials: true,        // Include cookies for CSRF
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }
}

export const apiService = new ApiService();
export const apiClient = apiService.getClient();
```

#### Request Interceptor (CSRF Token)

Automatically adds CSRF token to state-changing requests:

```typescript
this.client.interceptors.request.use((config) => {
  // Only add CSRF token for state-changing methods
  if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    const token = this.getCSRFToken();
    if (token && config.headers) {
      config.headers['X-CSRF-TOKEN'] = token;
      config.headers['X-XSRF-TOKEN'] = token;
    }
  }
  return config;
});
```

#### Response Interceptor (Error Handling)

Handles CSRF errors and unauthorized access:

```typescript
this.client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 419 CSRF token mismatch
    if (error.response?.status === 419) {
      await this.fetchCSRFToken();
      const originalRequest = error.config;
      if (originalRequest) {
        return this.client.request(originalRequest); // Retry
      }
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        // Redirect to login
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
```

#### CSRF Token Methods

```typescript
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
```

---

### Service Pattern

All services follow this pattern:

```typescript
import { apiClient } from './api';
import type { Entity, CreateEntityRequest } from '@app/types/entity';
import type { AxiosResponse } from 'axios';

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Get all entities
 */
export async function getEntities(signal?: AbortSignal): Promise<Entity[]> {
  const response: AxiosResponse<ApiResponse<Entity[]>> =
    await apiClient.get('/entities', { signal });
  return response.data.data; // Extract data
}

/**
 * Create a new entity
 */
export async function createEntity(
  data: CreateEntityRequest,
  signal?: AbortSignal
): Promise<Entity> {
  const response: AxiosResponse<ApiResponse<Entity>> =
    await apiClient.post('/entities', data, { signal });
  return response.data.data; // Extract data
}
```

**Key Points**:
1. Always extract `response.data.data` in the service
2. Type the AxiosResponse with `ApiResponse<T>`
3. Support request cancellation with `AbortSignal`
4. Return clean, typed data to stores

---

### Service Modules

#### 1. authService - Authentication

**Location**: `/var/www/resources/app/js/services/authService.ts`

**Functions**:
```typescript
login(credentials: LoginCredentials, signal?: AbortSignal): Promise<User>
logout(signal?: AbortSignal): Promise<void>
checkAuth(signal?: AbortSignal): Promise<User | null>
resendVerificationEmail(signal?: AbortSignal): Promise<void>
updateProfile(data, signal?: AbortSignal): Promise<User>
impersonate(token: string, signal?: AbortSignal): Promise<User>
```

**Example**:
```typescript
async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<User> {
  await apiService.fetchCSRFToken();

  const response = await apiClient.post<{ data: { user: User } }>(
    '/login',
    credentials,
    { signal }
  );

  return response.data.data.user;
}
```

---

#### 2. leagueService - League Management

**Location**: `/var/www/resources/app/js/services/leagueService.ts`

**Functions**:
```typescript
// Reference data
getPlatforms(): Promise<Platform[]>
getTimezones(): Promise<Timezone[]>

// Slug validation
checkSlugAvailability(name: string, leagueId?: number): Promise<SlugCheckResponse>

// League CRUD
createLeague(formData: FormData): Promise<League>
getUserLeagues(): Promise<League[]>
getLeague(id: number): Promise<League>
getLeagueById(id: string): Promise<League>
updateLeague(id: number, formData: FormData): Promise<League>
deleteLeague(id: number): Promise<void>

// Platform-specific configurations
getDriverColumns(leagueId: number): Promise<PlatformColumn[]>
getDriverFormFields(leagueId: number): Promise<PlatformFormField[]>
getDriverCsvHeaders(leagueId: number): Promise<PlatformCsvHeader[]>

// FormData builders
buildLeagueFormData(form: CreateLeagueForm): FormData
buildUpdateLeagueFormData(form: UpdateLeagueForm, originalLeague: League): FormData
```

**Example - File Upload**:
```typescript
export async function createLeague(formData: FormData): Promise<League> {
  const response: AxiosResponse<ApiResponse<League>> =
    await apiClient.post('/leagues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  return response.data.data;
}
```

---

#### 3. driverService - Driver Management

**Location**: `/var/www/resources/app/js/services/driverService.ts`

**Functions**:
```typescript
getLeagueDrivers(leagueId: number, params?: LeagueDriversQueryParams):
  Promise<PaginatedDriversResponse>
createDriver(leagueId: number, data: CreateDriverRequest): Promise<LeagueDriver>
getLeagueDriver(leagueId: number, driverId: number): Promise<LeagueDriver>
updateDriver(leagueId: number, driverId: number, data: UpdateDriverRequest):
  Promise<LeagueDriver>
removeDriverFromLeague(leagueId: number, driverId: number): Promise<void>
importDriversFromCSV(leagueId: number, csvData: string):
  Promise<ImportDriversResponse>
```

**Example - Pagination**:
```typescript
export async function getLeagueDrivers(
  leagueId: number,
  params?: LeagueDriversQueryParams,
): Promise<PaginatedDriversResponse> {
  const response: AxiosResponse<PaginatedApiResponse> =
    await apiClient.get(`/leagues/${leagueId}/drivers`, { params });

  const meta = response.data.meta || {
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 0,
  };

  return {
    data: response.data.data || [],
    meta: {
      ...meta,
      from: null,
      to: null,
    },
  };
}
```

---

#### Other Service Modules

| Service | Purpose | Key Functions |
|---------|---------|--------------|
| **competitionService** | Competition CRUD | create, read, update, delete competitions |
| **seasonService** | Season CRUD | create, read, update, delete seasons |
| **seasonDriverService** | Season-driver relationships | add/remove drivers from seasons |
| **teamService** | Team CRUD | create, read, update, delete teams |
| **divisionService** | Division CRUD | create, read, update, delete divisions |
| **roundService** | Round CRUD | create, read, update, delete rounds |
| **raceService** | Race CRUD | create, read, update, delete races |
| **raceSettingsService** | Race settings | manage race configurations |
| **trackService** | Track search | search and retrieve track data |
| **siteConfigService** | Site configuration | fetch site settings |

---

### FormData Builders

For file uploads, we use FormData builders to construct multipart/form-data requests:

**Pattern**:
```typescript
export function buildLeagueFormData(form: CreateLeagueForm): FormData {
  const formData = new FormData();

  // Required fields
  formData.append('name', form.name);
  formData.append('visibility', form.visibility);

  // Optional fields (append empty string if null/undefined)
  formData.append('timezone', form.timezone || '');
  formData.append('contact_email', form.contact_email || '');

  // File uploads
  if (form.logo) {
    formData.append('logo', form.logo);
  }
  if (form.header_image) {
    formData.append('header_image', form.header_image);
  }

  // Arrays
  form.platform_ids.forEach((id) => {
    formData.append('platform_ids[]', id.toString());
  });

  // Conditional fields
  if (form.tagline) {
    formData.append('tagline', form.tagline);
  }

  return formData;
}
```

**Key Points**:
1. Use empty strings for optional fields (avoid "null" string)
2. Append arrays with `[]` suffix
3. Only append files if they exist
4. For updates, compare with original data to minimize payload

**Update Pattern** (Laravel Method Spoofing):
```typescript
export async function updateLeague(
  id: number,
  formData: FormData
): Promise<League> {
  // Laravel doesn't handle PUT with multipart/form-data
  // Use POST with _method=PUT (method spoofing)
  formData.append('_method', 'PUT');

  const response: AxiosResponse<ApiResponse<League>> =
    await apiClient.post(`/leagues/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  return response.data.data;
}
```

---

### Service Best Practices

#### 1. Always Extract `response.data.data`
Services are the boundary between API and application:

```typescript
// ✅ GOOD: Service extracts data
export async function getLeagues(): Promise<League[]> {
  const response: AxiosResponse<ApiResponse<League[]>> =
    await apiClient.get('/leagues');
  return response.data.data; // Clean, typed data
}

// ❌ BAD: Returning raw response
export async function getLeagues() {
  return await apiClient.get('/leagues'); // Store has to extract
}
```

#### 2. Use TypeScript for API Response Types
Always type your API responses:

```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ✅ GOOD: Fully typed
const response: AxiosResponse<ApiResponse<League[]>> =
  await apiClient.get('/leagues');

// ❌ BAD: No types
const response = await apiClient.get('/leagues');
```

#### 3. Handle Errors at Service Level When Appropriate
Throw meaningful errors:

```typescript
export async function getLeague(id: number): Promise<League> {
  try {
    const response: AxiosResponse<ApiResponse<League>> =
      await apiClient.get(`/leagues/${id}`);
    return response.data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`League with ID ${id} not found`);
    }
    throw error;
  }
}
```

#### 4. Support Request Cancellation with AbortSignal
Allow components to cancel in-flight requests:

```typescript
export async function getLeagues(signal?: AbortSignal): Promise<League[]> {
  const response: AxiosResponse<ApiResponse<League[]>> =
    await apiClient.get('/leagues', { signal });
  return response.data.data;
}

// Component usage:
const abortController = new AbortController();
await leagueService.getLeagues(abortController.signal);

// Cancel if component unmounts
onUnmounted(() => abortController.abort());
```

#### 5. Keep Services Thin (No Business Logic)
Services should only handle HTTP communication:

```typescript
// ✅ GOOD: Service only makes request
export async function createLeague(formData: FormData): Promise<League> {
  const response = await apiClient.post('/leagues', formData);
  return response.data.data;
}

// ❌ BAD: Business logic in service
export async function createLeague(formData: FormData): Promise<League> {
  // Validation logic (should be in store or component)
  if (!formData.get('name')) {
    throw new Error('Name is required');
  }

  const response = await apiClient.post('/leagues', formData);

  // State mutation (should be in store)
  someGlobalState.leagues.push(response.data.data);

  return response.data.data;
}
```

---

## Data Flow

### Complete Flow Example: Creating a League

Let's follow data from user interaction to API and back:

#### 1. User Interaction (Component)

```typescript
// LeagueWizard.vue
<script setup lang="ts">
import { useLeagueStore } from '@app/stores/leagueStore';
import { useToast } from 'primevue/usetoast';
import type { CreateLeagueForm } from '@app/types/league';

const leagueStore = useLeagueStore();
const toast = useToast();

const formData = ref<CreateLeagueForm>({
  name: '',
  logo: null,
  platform_ids: [],
  timezone: '',
  visibility: 'public',
  // ... other fields
});

async function handleSubmit() {
  try {
    // Call store action
    const league = await leagueStore.createNewLeague(formData.value);

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'League created successfully',
      life: 3000,
    });

    // Navigate to league
    router.push({ name: 'league-detail', params: { id: league.id } });
  } catch (error) {
    // Handle error
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: leagueStore.error || 'Failed to create league',
      life: 5000,
    });
  }
}
</script>
```

#### 2. Store Action

```typescript
// leagueStore.ts
async function createNewLeague(form: CreateLeagueForm): Promise<League> {
  loading.value = true;
  error.value = null;

  try {
    // Build FormData
    const formData = buildLeagueFormData(form);

    // Call service
    const league = await createLeague(formData);

    // Update state
    leagues.value.push(league);
    currentLeague.value = league;

    return league;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error
      ? err.message
      : 'Failed to create league';
    error.value = errorMessage;
    throw err;
  } finally {
    loading.value = false;
  }
}
```

#### 3. Service Method

```typescript
// leagueService.ts
export async function createLeague(formData: FormData): Promise<League> {
  const response: AxiosResponse<ApiResponse<League>> =
    await apiClient.post('/leagues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

  // Extract and return clean data
  return response.data.data;
}
```

#### 4. API Client (Axios)

```typescript
// api.ts
// Request interceptor adds CSRF token
this.client.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    const token = this.getCSRFToken();
    if (token && config.headers) {
      config.headers['X-CSRF-TOKEN'] = token;
    }
  }
  return config;
});

// Makes HTTP POST request to /api/leagues
```

#### 5. Backend (Laravel)

```php
// routes/subdomain.php
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::prefix('api')->middleware(['auth:web', 'user.authenticate'])->group(function () {
        Route::post('/leagues', [LeagueController::class, 'store']);
    });
});

// LeagueController.php
public function store(CreateLeagueRequest $request): JsonResponse
{
    $data = CreateLeagueData::from($request->validated());
    $leagueData = $this->leagueService->createLeague($data);
    return ApiResponse::created($leagueData->toArray());
}
```

#### 6. Response Flow Back

**Backend → Service**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "My League",
    "slug": "my-league",
    "platform_ids": [1, 2],
    // ... other fields
  },
  "message": "League created successfully"
}
```

**Service → Store**:
```typescript
return response.data.data; // League object
```

**Store → Component**:
```typescript
const league = await leagueStore.createNewLeague(formData.value);
// league is a typed League object
```

**Component → User**:
```typescript
toast.add({
  severity: 'success',
  summary: 'Success',
  detail: 'League created successfully',
});
router.push({ name: 'league-detail', params: { id: league.id } });
```

---

### Error Handling Flow

Let's follow an error through the layers:

#### 1. API Returns Error

**Backend Response** (422 Validation Error):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name field is required."],
    "platform_ids": ["Please select at least one platform."]
  }
}
```

#### 2. Service Throws Error

```typescript
// Service doesn't catch - lets error bubble up
export async function createLeague(formData: FormData): Promise<League> {
  const response = await apiClient.post('/leagues', formData);
  return response.data.data;
  // If error, Axios throws AxiosError
}
```

#### 3. Store Catches Error

```typescript
async function createNewLeague(form: CreateLeagueForm): Promise<League> {
  loading.value = true;
  error.value = null;

  try {
    const formData = buildLeagueFormData(form);
    const league = await createLeague(formData);
    leagues.value.push(league);
    return league;
  } catch (err: unknown) {
    // Extract user-friendly message
    if (isAxiosError(err) && err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = 'Failed to create league';
    }
    throw err; // Re-throw for component
  } finally {
    loading.value = false;
  }
}
```

#### 4. Component Handles Error

```typescript
async function handleSubmit() {
  try {
    await leagueStore.createNewLeague(formData.value);
    // Success handling...
  } catch (error) {
    // Display error to user
    if (isAxiosError(error) && hasValidationErrors(error)) {
      // Show validation errors in form
      formErrors.value = error.response.data.errors;
    }

    // Show toast notification
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: leagueStore.error || 'Failed to create league',
      life: 5000,
    });
  }
}
```

#### 5. User Sees Error

- Toast notification with error message
- Inline form validation errors
- Loading state removed

---

## TypeScript Types

### Type Organization

Types are organized by domain in `/var/www/resources/app/js/types/`:

```
types/
├── index.ts              # Central type exports
├── auth.ts               # Authentication types
├── user.ts               # User types
├── league.ts             # League types
├── competition.ts        # Competition types
├── season.ts             # Season types
├── driver.ts             # Driver types
├── team.ts               # Team types
├── division.ts           # Division types
├── round.ts              # Round types
├── race.ts               # Race types
├── track.ts              # Track types
├── siteConfig.ts         # Site configuration types
├── seasonDriver.ts       # Season-driver relationship types
└── errors.ts             # Error handling types
```

### Type Categories

#### 1. Entity Interfaces

Domain entities matching backend DTOs:

```typescript
// types/league.ts
export interface League {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  header_image_url: string | null;
  platform_ids: number[];
  platforms?: Platform[];
  discord_url: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  visibility: LeagueVisibility;
  timezone: string;
  owner_user_id: number;
  contact_email: string;
  organizer_name: string;
  status: LeagueStatus;
  competitions_count: number;
  drivers_count: number;
  created_at: string;
  updated_at: string;
}
```

#### 2. Form Interfaces

Data structures for forms and user input:

```typescript
// types/league.ts
export interface CreateLeagueForm {
  // Step 1: Essentials
  name: string;
  logo: File | null;
  logo_url?: string | null;
  platform_ids: number[];
  timezone: string;
  visibility: LeagueVisibility;

  // Step 2: Branding & Description
  tagline: string;
  description: string;
  header_image: File | null;
  header_image_url?: string | null;

  // Step 3: Community & Admin
  contact_email: string;
  organizer_name: string;
  discord_url: string;
  website_url: string;
  twitter_handle: string;
  instagram_handle: string;
  youtube_url: string;
  twitch_url: string;
}
```

#### 3. Form Error Interfaces

Validation error structures:

```typescript
// types/league.ts
export interface FormErrors {
  name?: string;
  logo?: string;
  platform_ids?: string;
  timezone?: string;
  visibility?: string;
  tagline?: string;
  description?: string;
  header_image?: string;
  contact_email?: string;
  organizer_name?: string;
  discord_url?: string;
  website_url?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  youtube_url?: string;
  twitch_url?: string;
}
```

#### 4. API Response Types

Wrapper types for API responses:

```typescript
// Used in services
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Paginated responses
interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
  message?: string;
}
```

#### 5. Enum Types

Type-safe enums for domain values:

```typescript
// types/league.ts
export type LeagueVisibility = 'public' | 'private' | 'unlisted';
export type LeagueStatus = 'active' | 'archived';

// types/driver.ts
export type DriverStatus = 'active' | 'inactive' | 'banned';
```

---

### Type Guards

Type guards for runtime type checking:

**Location**: `/var/www/resources/app/js/types/errors.ts`

```typescript
import { AxiosError } from 'axios';

export interface ValidationErrors {
  [key: string]: string[];
}

export interface ApiErrorResponse {
  message: string;
  errors?: ValidationErrors;
}

// Check if error is AxiosError
export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (error as AxiosError).isAxiosError === true;
}

// Check if AxiosError has validation errors
export function hasValidationErrors(error: AxiosError<ApiErrorResponse>): boolean {
  return !!(
    error.response?.data?.errors &&
    Object.keys(error.response.data.errors).length > 0
  );
}

// Extract error message
export function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  return defaultMessage;
}
```

**Usage in Components**:
```typescript
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@app/types/errors';

async function handleSubmit() {
  try {
    await leagueStore.createNewLeague(formData.value);
  } catch (error) {
    // Type-safe error handling
    if (isAxiosError(error) && hasValidationErrors(error)) {
      formErrors.value = error.response.data.errors;
    }

    const message = getErrorMessage(error, 'An unexpected error occurred');
    toast.add({ severity: 'error', detail: message });
  }
}
```

---

### Example Type Definitions

#### Complete Entity Type

```typescript
// types/driver.ts
export interface LeagueDriver {
  // Pivot fields (league_driver relationship)
  id: number;                    // league_driver.id
  league_id: number;
  driver_id: number;
  driver_number: string | null;
  status: DriverStatus;
  notes: string | null;

  // Driver fields
  name: string;
  country: string | null;

  // Platform-specific fields (dynamic based on league platforms)
  platform_fields: Record<string, string | number | null>;

  // Timestamps
  created_at: string;
  updated_at: string;
}
```

#### Complete Form Type

```typescript
// types/driver.ts
export interface CreateDriverRequest {
  // Required fields
  name: string;
  driver_number?: string | null;
  status?: DriverStatus;

  // Optional fields
  country?: string | null;
  notes?: string | null;

  // Platform-specific fields (dynamic)
  platform_fields?: Record<string, string | number | null>;
}
```

#### Complete Error Type

```typescript
// types/driver.ts
export interface DriverFormErrors {
  name?: string;
  driver_number?: string;
  status?: string;
  country?: string;
  notes?: string;
  platform_fields?: Record<string, string>;
}
```

---

## Testing

### Testing Stores

**Pattern**:
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

  it('should initialize with default state', () => {
    const userStore = useUserStore();

    expect(userStore.user).toBeNull();
    expect(userStore.isAuthenticated).toBe(false);
    expect(userStore.isLoading).toBe(false);
  });

  it('should set user on successful login', async () => {
    const mockUser: User = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };

    vi.mocked(authService.login).mockResolvedValue(mockUser);

    const userStore = useUserStore();
    await userStore.login({
      email: 'john@example.com',
      password: 'password'
    });

    expect(userStore.user).toEqual(mockUser);
    expect(userStore.isAuthenticated).toBe(true);
    expect(userStore.userName).toBe('John Doe');
  });

  it('should handle login errors', async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new Error('Login failed')
    );

    const userStore = useUserStore();

    await expect(
      userStore.login({
        email: 'john@example.com',
        password: 'wrong'
      })
    ).rejects.toThrow('Login failed');

    expect(userStore.user).toBeNull();
    expect(userStore.isAuthenticated).toBe(false);
  });
});
```

**Key Points**:
1. Use `setActivePinia(createPinia())` before each test
2. Mock service dependencies with `vi.mock()`
3. Test state initialization, actions, getters, and error handling
4. Use `vi.clearAllMocks()` to reset mocks between tests

---

### Testing Services

**Pattern**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@app/services/authService';
import { apiClient, apiService } from '@app/services/api';
import type { User } from '@app/types/user';

vi.mock('@app/services/api');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should fetch CSRF token and login user', async () => {
      const mockUser: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        email_verified_at: null,
      };

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue();
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.login({
        email: 'john@example.com',
        password: 'password',
      });

      expect(apiService.fetchCSRFToken).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith(
        '/login',
        { email: 'john@example.com', password: 'password' },
        { signal: undefined },
      );
      expect(result).toEqual(mockUser);
    });
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
});
```

**Key Points**:
1. Mock `apiClient` and `apiService`
2. Test successful calls and error handling
3. Verify correct endpoints and payloads
4. Test return values match expected types

---

## Best Practices

### 1. Store-Service Separation

**Stores**: State management and business logic
**Services**: HTTP layer only

```typescript
// ✅ GOOD: Clear separation
// Store handles business logic
async function createNewLeague(form: CreateLeagueForm): Promise<League> {
  // Validate business rules
  if (hasReachedFreeLimit.value) {
    throw new Error('Free tier limit reached');
  }

  // Call service
  const league = await createLeague(buildLeagueFormData(form));

  // Update state
  leagues.value.push(league);
  return league;
}

// Service only handles HTTP
export async function createLeague(formData: FormData): Promise<League> {
  const response = await apiClient.post('/leagues', formData);
  return response.data.data;
}

// ❌ BAD: Service doing business logic
export async function createLeague(formData: FormData): Promise<League> {
  // Validation (should be in store)
  if (!formData.get('name')) {
    throw new Error('Name is required');
  }

  const response = await apiClient.post('/leagues', formData);

  // State mutation (should be in store)
  someStore.leagues.push(response.data.data);

  return response.data.data;
}
```

### 2. Error Handling

**Try/Catch in Actions**:
```typescript
async function fetchLeagues(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    leagues.value = await getUserLeagues();
  } catch (err: unknown) {
    // Extract user-friendly message
    const errorMessage = err instanceof Error
      ? err.message
      : 'Failed to load leagues';
    error.value = errorMessage;
    throw err; // Re-throw for component
  } finally {
    loading.value = false;
  }
}
```

**User-Friendly Error Messages**:
```typescript
// Component
async function handleSubmit() {
  try {
    await leagueStore.createNewLeague(formData.value);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'League created successfully',
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: leagueStore.error || 'An unexpected error occurred',
    });
  }
}
```

### 3. Type Safety

**Full TypeScript Coverage**:
```typescript
// ✅ GOOD: Fully typed
const leagues = ref<League[]>([]);
const currentLeague = ref<League | null>(null);
const loading = ref<boolean>(false);

async function fetchLeague(id: number): Promise<League> {
  const league = await getLeague(id);
  return league;
}

// ❌ BAD: No types
const leagues = ref([]);
const currentLeague = ref(null);
const loading = ref(false);

async function fetchLeague(id) {
  const league = await getLeague(id);
  return league;
}
```

**Type Guards for Runtime Checks**:
```typescript
import { isAxiosError, hasValidationErrors } from '@app/types/errors';

if (isAxiosError(error) && hasValidationErrors(error)) {
  formErrors.value = error.response.data.errors;
}
```

**Avoid `any`**:
```typescript
// ✅ GOOD: Proper typing
function handleError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return 'An error occurred';
}

// ❌ BAD: Using any
function handleError(err: any): string {
  return err.message;
}
```

### 4. State Management

**Keep Stores Focused**:
```typescript
// ✅ GOOD: Single responsibility
export const useDriverStore = defineStore('driver', () => {
  // Only driver-related state and actions
});

export const useTeamStore = defineStore('team', () => {
  // Only team-related state and actions
});
```

**Use Getters for Derived State**:
```typescript
// ✅ GOOD: Getter
const activeDrivers = computed(() =>
  drivers.value.filter(d => d.status === 'active')
);

// ❌ BAD: Action
function getActiveDrivers() {
  return drivers.value.filter(d => d.status === 'active');
}
```

**Use Actions for Async Operations**:
```typescript
// ✅ GOOD: Async action
async function fetchDrivers(): Promise<void> {
  drivers.value = await getLeagueDrivers(leagueId);
}

// ❌ BAD: Direct mutation
drivers.value = await getLeagueDrivers(leagueId);
```

### 5. API Calls

**Always Use Centralized apiClient**:
```typescript
// ✅ GOOD: Using apiClient
import { apiClient } from '@app/services/api';

export async function getLeagues(): Promise<League[]> {
  const response = await apiClient.get('/leagues');
  return response.data.data;
}

// ❌ BAD: Direct axios import
import axios from 'axios';

export async function getLeagues(): Promise<League[]> {
  const response = await axios.get('/api/leagues');
  return response.data.data;
}
```

**Extract Data in Service Layer**:
```typescript
// ✅ GOOD: Service extracts data
export async function getLeagues(): Promise<League[]> {
  const response = await apiClient.get('/leagues');
  return response.data.data; // Clean data
}

// Store receives clean data
leagues.value = await getUserLeagues();

// ❌ BAD: Store extracts data
export async function getLeagues() {
  return await apiClient.get('/leagues'); // Raw response
}

// Store has to extract
const response = await getUserLeagues();
leagues.value = response.data.data;
```

**Handle CSRF Tokens Automatically**:
CSRF tokens are handled automatically by the API client - no manual intervention needed:

```typescript
// ✅ API client handles CSRF automatically
export async function createLeague(formData: FormData): Promise<League> {
  const response = await apiClient.post('/leagues', formData);
  return response.data.data;
  // CSRF token is added by request interceptor
}
```

---

## Summary

### Key Takeaways

1. **Layered Architecture**: Component → Store → Service → API
2. **Never Skip Layers**: Components call stores, stores call services
3. **Services Extract Data**: Always return `response.data.data`
4. **Stores Handle Errors**: Try/catch with user-friendly messages
5. **Full Type Safety**: Use TypeScript everywhere
6. **Composition API**: Use `ref()`, `computed()`, and Pinia's `setup()` style
7. **Single Responsibility**: Keep stores and services focused
8. **Test Everything**: Mock dependencies and test all layers

### Quick Reference

**Store Pattern**:
```typescript
export const useEntityStore = defineStore('entity', () => {
  const entities = ref<Entity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchEntities(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      entities.value = await getEntities();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { entities, loading, error, fetchEntities };
});
```

**Service Pattern**:
```typescript
export async function getEntities(signal?: AbortSignal): Promise<Entity[]> {
  const response: AxiosResponse<ApiResponse<Entity[]>> =
    await apiClient.get('/entities', { signal });
  return response.data.data;
}
```

**Component Usage**:
```typescript
const entityStore = useEntityStore();

async function loadEntities() {
  try {
    await entityStore.fetchEntities();
    toast.add({ severity: 'success', detail: 'Loaded successfully' });
  } catch (error) {
    toast.add({
      severity: 'error',
      detail: entityStore.error || 'Failed to load'
    });
  }
}
```

---

## Additional Resources

- **[App Dashboard Development Guide](./app-dashboard-development-guide.md)** - Component patterns and development workflow
- **[App Styling Guide](./app-styling-guide.md)** - Design system, Tailwind CSS, PrimeVue theming
- **[PrimeVue Usage Guide](../../primevue-usage.md)** - PrimeVue V4 component examples
- **[Backend DDD Guide](../../backend/ddd-overview.md)** - Understanding backend architecture
- **[Backend User Guide](../../backend/user-backend-guide.md)** - Backend development for user features

---

**Last Updated**: 2025-10-31
