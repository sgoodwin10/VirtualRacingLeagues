# Admin Dashboard API Integration Guide

**Version**: 1.0
**Last Updated**: 2025-10-15

## Table of Contents

1. [Introduction](#introduction)
2. [API Service Architecture](#api-service-architecture)
3. [Service Pattern](#service-pattern)
4. [Response Handling](#response-handling)
5. [Error Handling](#error-handling)
6. [Request Cancellation](#request-cancellation)
7. [Pagination](#pagination)
8. [Type Safety](#type-safety)
9. [Existing Services Reference](#existing-services-reference)
10. [Creating New Services](#creating-new-services)
11. [Testing Services](#testing-services)
12. [Common Patterns](#common-patterns)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

---

## Introduction

### Overview

The admin dashboard uses a **layered architecture** for API integration:

```
┌─────────────────────────────────────────┐
│  Components/Views                       │  ← Present data, handle user interactions
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Stores (Pinia)                         │  ← State management, orchestration
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Services (userService, adminService)   │  ← API communication layer
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  API Service (Axios instance)           │  ← HTTP client with interceptors
└─────────────────┬───────────────────────┘
                  │
                  ▼
         Backend REST API (/api/*)
```

### Service Layer Philosophy

**Why separate services from components?**

1. **Separation of Concerns**: Components focus on presentation, services handle API communication
2. **Reusability**: Services can be used by multiple components/stores
3. **Testability**: Easy to mock services in tests
4. **Type Safety**: Centralized type definitions for API requests/responses
5. **Error Handling**: Consistent error handling across the application
6. **Request Cancellation**: Built-in support for aborting requests
7. **Single Source of Truth**: API logic in one place, easier to maintain

**Golden Rule**: Components should **never** make direct axios calls. Always use services.

---

## API Service Architecture

### Location

**File**: `resources/admin/js/services/api.ts`

### Axios Instance Configuration

```typescript
import axios, { type AxiosInstance } from 'axios';

class ApiService {
  private client: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',              // All requests prefixed with /api
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,              // Important for cookie-based sessions
    });

    this.setupInterceptors();
  }
}
```

**Key Configuration:**
- **baseURL**: `/api` - All service requests automatically prefix with this
- **withCredentials**: `true` - Enables cookie-based authentication
- **headers**: JSON by default (can be overridden for file uploads)

### Request Interceptor

**Purpose**: Automatically add CSRF token to all state-changing requests

```typescript
this.client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token for POST, PUT, PATCH, DELETE
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      const token = this.getCSRFToken();
      if (token && config.headers) {
        // Laravel checks both headers
        config.headers['X-CSRF-TOKEN'] = token;
        config.headers['X-XSRF-TOKEN'] = token;
      }
    }
    return config;
  }
);
```

**CSRF Token Sources** (in order of priority):
1. Cached token in memory
2. Meta tag: `<meta name="csrf-token" content="...">`
3. Cookie: `XSRF-TOKEN`

### Response Interceptor

**Purpose**: Handle common errors globally

```typescript
this.client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_remember');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle 419 CSRF token mismatch - retry once
    if (error.response?.status === 419) {
      return this.fetchCSRFToken()
        .then(() => this.client.request(error.config!))
        .catch(() => Promise.reject(error));
    }

    return Promise.reject(error);
  }
);
```

**Automatic Error Handling:**
- **401**: Redirects to login page
- **419**: Refreshes CSRF token and retries request once

### HTTP Methods

The API service exposes typed HTTP methods:

```typescript
// GET request
async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>

// POST request
async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>

// PUT request
async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>

// PATCH request
async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>

// DELETE request
async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
```

**All methods**:
- Return `response.data` directly (not the full axios response)
- Accept optional `AxiosRequestConfig` for request customization
- Support TypeScript generics for type-safe responses

### Usage

```typescript
import { apiService } from '@admin/services/api';

// GET request
const data = await apiService.get<User[]>('/users');

// POST request
const newUser = await apiService.post<User>('/users', { name: 'John' });

// With AbortSignal
const data = await apiService.get<User[]>('/users', { signal: abortSignal });
```

---

## Service Pattern

### Standard Service Structure

All services follow a **class-based singleton pattern**:

```typescript
import { apiService } from './api';
import { handleServiceError } from '@admin/utils/errorHandler';
import type { MyResource, MyResourcePayload, MyResourceResponse } from '@admin/types/myResource';

/**
 * My Resource Service
 * Handles CRUD operations for my resource
 */
class MyResourceService {
  /**
   * Get all resources
   * @param params - Optional filter parameters
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<MyResource[]>
   */
  async getAllResources(
    params?: FilterParams,
    signal?: AbortSignal
  ): Promise<MyResource[]> {
    try {
      const response = await apiService.get<MyResourceResponse>('/my-resources', {
        params,
        signal,
      });

      // Unwrap response
      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get single resource
   * @param id - Resource ID
   * @param signal - Optional AbortSignal
   * @returns Promise<MyResource>
   */
  async getResource(id: number, signal?: AbortSignal): Promise<MyResource> {
    try {
      const response = await apiService.get<MyResourceResponse>(`/my-resources/${id}`, {
        signal,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch resource');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Create resource
   * @param payload - Resource data
   * @param signal - Optional AbortSignal
   * @returns Promise<MyResource>
   */
  async createResource(
    payload: MyResourcePayload,
    signal?: AbortSignal
  ): Promise<MyResource> {
    try {
      const response = await apiService.post<MyResourceResponse>(
        '/my-resources',
        payload,
        { signal }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to create resource');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Update resource
   * @param id - Resource ID
   * @param payload - Updated data
   * @param signal - Optional AbortSignal
   * @returns Promise<MyResource>
   */
  async updateResource(
    id: number,
    payload: Partial<MyResourcePayload>,
    signal?: AbortSignal
  ): Promise<MyResource> {
    try {
      const response = await apiService.put<MyResourceResponse>(
        `/my-resources/${id}`,
        payload,
        { signal }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to update resource');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Delete resource
   * @param id - Resource ID
   * @param signal - Optional AbortSignal
   * @returns Promise<void>
   */
  async deleteResource(id: number, signal?: AbortSignal): Promise<void> {
    try {
      await apiService.delete<{ success: boolean }>(`/my-resources/${id}`, { signal });
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export singleton instance
export const myResourceService = new MyResourceService();
export default myResourceService;
```

### Key Principles

1. **Class-based**: Services are classes with methods
2. **Singleton Pattern**: Export a single instance, not the class
3. **TypeScript**: Full type annotations for parameters and return types
4. **JSDoc Comments**: Document all public methods
5. **Error Handling**: All methods use `try/catch` with `handleServiceError`
6. **AbortSignal**: All methods accept optional `signal` parameter
7. **Response Unwrapping**: Extract data from API response wrapper
8. **Type Safety**: Generic types for axios calls

### Method Naming Conventions

| Operation | Method Name | Example |
|-----------|-------------|---------|
| Get all (list) | `getAll{Resources}` or `get{Resources}` | `getAllUsers()`, `getUsers()` |
| Get one | `get{Resource}` | `getUser(id)` |
| Get paginated | `get{Resources}` | `getUsers(page, filters)` |
| Create | `create{Resource}` | `createUser(data)` |
| Update | `update{Resource}` | `updateUser(id, data)` |
| Delete | `delete{Resource}` | `deleteUser(id)` |
| Restore | `restore{Resource}` | `restoreUser(id)` |
| Custom action | `{verb}{Resource}` | `activateUser(id)`, `resetPassword(id)` |

---

## Response Handling

### The Critical Pattern: Response Unwrapping

**CRITICAL CONCEPT**: Laravel backend wraps all responses in a standard structure:

```typescript
{
  success: boolean;
  data: T;          // Actual data here
  message?: string;
}
```

**Services MUST unwrap responses before returning to components.**

### Why Unwrap in Services?

**Bad** ❌ (returning wrapped response):
```typescript
// Service
async getUsers(): Promise<ApiResponse<User[]>> {
  return await apiService.get<ApiResponse<User[]>>('/users');
}

// Component (has to unwrap everywhere)
const response = await userService.getUsers();
if (response.success && response.data) {
  users.value = response.data; // Tedious!
}
```

**Good** ✅ (unwrapping in service):
```typescript
// Service
async getUsers(): Promise<User[]> {
  const response = await apiService.get<ApiResponse<User[]>>('/users');
  if (response.success && response.data) {
    return response.data; // Unwrap here
  }
  return [];
}

// Component (clean usage)
users.value = await userService.getUsers(); // Simple!
```

**Benefits:**
1. Components don't need to know about wrapper structure
2. Consistent unwrapping logic in one place
3. Easier to refactor if backend response format changes
4. Cleaner component code

### Single Resource Response

**Backend Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Service Method:**
```typescript
async getUser(id: number, signal?: AbortSignal): Promise<User> {
  try {
    const response = await apiService.get<ApiResponse<User>>(`/users/${id}`, { signal });

    // Unwrap: extract data from response
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch user');
    }

    return response.data; // Return unwrapped data
  } catch (error) {
    handleServiceError(error);
  }
}
```

### List Response (Non-Paginated)

**Backend Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "User 1" },
    { "id": 2, "name": "User 2" }
  ]
}
```

**Service Method:**
```typescript
async getAllActivities(
  params?: ActivityFilterParams,
  signal?: AbortSignal
): Promise<Activity[]> {
  try {
    const response = await apiService.get<ActivityListResponse>('/activities', {
      params,
      signal,
    });

    // Unwrap and validate
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch activities');
    }

    return response.data; // Return array directly
  } catch (error) {
    handleServiceError(error);
  }
}
```

### Paginated Response

**Backend Response (Style 1: Separated meta):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "User 1" },
    { "id": 2, "name": "User 2" }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 15,
    "to": 15,
    "total": 73
  }
}
```

**Service Method (returning full pagination response):**
```typescript
async getUsers(
  params?: UserListParams,
  signal?: AbortSignal
): Promise<PaginatedResponse<User>> {
  try {
    const response = await apiService.get<{
      success: boolean;
      data: User[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;
      };
    }>('/users', { params, signal });

    // Transform into standard PaginatedResponse
    if (response.success && response.data) {
      return {
        current_page: response.meta.current_page,
        data: response.data,
        first_page_url: `${response.meta.path}?page=1`,
        from: response.meta.from,
        last_page: response.meta.last_page,
        last_page_url: `${response.meta.path}?page=${response.meta.last_page}`,
        links: [],
        next_page_url:
          response.meta.current_page < response.meta.last_page
            ? `${response.meta.path}?page=${response.meta.current_page + 1}`
            : null,
        path: response.meta.path,
        per_page: response.meta.per_page,
        prev_page_url:
          response.meta.current_page > 1
            ? `${response.meta.path}?page=${response.meta.current_page - 1}`
            : null,
        to: response.meta.to,
        total: response.meta.total,
      };
    }

    // Return empty response
    return {
      current_page: 1,
      data: [],
      first_page_url: '',
      from: 0,
      last_page: 1,
      last_page_url: '',
      links: [],
      next_page_url: null,
      path: '',
      per_page: 15,
      prev_page_url: null,
      to: 0,
      total: 0,
    };
  } catch (error) {
    handleServiceError(error);
  }
}
```

**Backend Response (Style 2: Direct paginated response):**
```json
{
  "data": [
    { "id": 1, "name": "Admin 1" }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 73
  },
  "links": {
    "first": "/api/admins?page=1",
    "last": "/api/admins?page=5",
    "prev": null,
    "next": "/api/admins?page=2"
  }
}
```

**Service Method (no unwrapping needed - already correct format):**
```typescript
async getAdminUsers(
  page: number = 1,
  perPage: number = 15,
  filters?: AdminUserFilterParams,
  signal?: AbortSignal
): Promise<AdminUserListResponse> {
  try {
    const params: Record<string, string | number | boolean> = {
      page,
      per_page: perPage,
    };

    // Add filters
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;

    const response = await apiService.get<AdminUserListResponse>('/admins', {
      params,
      signal,
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Failed to fetch admin users');
    }

    return response; // Already in correct format
  } catch (error) {
    handleServiceError(error);
  }
}
```

### Void Operations (Delete)

**Backend Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Service Method:**
```typescript
async deleteUser(id: string, signal?: AbortSignal): Promise<void> {
  try {
    // Don't need to unwrap - void operation
    await apiService.delete<ApiResponse<null>>(`/users/${id}`, { signal });
    // Success - no return value needed
  } catch (error) {
    handleServiceError(error);
  }
}
```

### Nested Data Response

**Backend Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John"
    },
    "activities": [
      { "id": 1, "description": "logged in" }
    ]
  }
}
```

**Service Method:**
```typescript
async getUser(id: string, signal?: AbortSignal): Promise<User> {
  try {
    const response = await apiService.get<ApiResponse<{ user: User; activities: Activity[] }>>(
      `/users/${id}`,
      { signal }
    );

    // Extract nested user object
    if (response.success && response.data?.user) {
      return response.data.user; // Return just the user
    }

    throw new Error('Failed to fetch user');
  } catch (error) {
    handleServiceError(error);
  }
}
```

---

## Error Handling

### handleServiceError Utility

**Location**: `resources/admin/js/utils/errorHandler.ts`

**Purpose**: Standardized error transformation and handling

```typescript
import {
  isAxiosError,
  hasValidationErrors,
  isRequestCancelled,
  getErrorMessage,
  ApplicationError,
} from '@admin/types/errors';

/**
 * Handles service errors with standardized error transformation
 *
 * Strategy:
 * - Request cancellations: Silent ignore (returns without throwing)
 * - Validation errors (422): Preserves full error for form handling
 * - Other axios errors: Converts to ApplicationError
 * - Generic errors: Re-throws as-is
 */
export function handleServiceError(error: unknown): never {
  // Silently ignore cancelled requests
  if (isRequestCancelled(error)) {
    return undefined as never;
  }

  // Preserve validation errors for form components
  if (isAxiosError(error) && hasValidationErrors(error)) {
    throw error; // Keep original AxiosError
  }

  // Convert API errors to ApplicationError
  if (isAxiosError(error)) {
    const message = getErrorMessage(error, 'An API error occurred');
    const statusCode = error.response?.status;
    throw new ApplicationError(message, 'API_ERROR', statusCode);
  }

  // Re-throw generic errors
  if (error instanceof Error) {
    throw error;
  }

  // Unknown error
  throw new ApplicationError('An unexpected error occurred', 'UNKNOWN_ERROR');
}
```

### Error Handling by Status Code

#### 422 Validation Errors

**Backend Response:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

**Service Handling:**
```typescript
async createUser(payload: CreateUserPayload, signal?: AbortSignal): Promise<User> {
  try {
    const response = await apiService.post<ApiResponse<User>>('/users', payload, { signal });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('Failed to create user');
  } catch (error) {
    // handleServiceError preserves validation errors
    // So components can extract field-level errors
    handleServiceError(error);
  }
}
```

**Component Handling:**
```typescript
import { hasValidationErrors, getValidationErrors } from '@admin/types/errors';

const createUser = async () => {
  try {
    await userService.createUser(formData.value);
    toast.add({ severity: 'success', summary: 'User created' });
  } catch (error) {
    if (hasValidationErrors(error)) {
      // Extract field errors
      const validationErrors = getValidationErrors(error);
      // Display field-specific errors
      Object.entries(validationErrors || {}).forEach(([field, messages]) => {
        toast.add({
          severity: 'error',
          summary: `${field}: ${messages[0]}`,
        });
      });
    } else {
      // Generic error
      toast.add({ severity: 'error', summary: 'Failed to create user' });
    }
  }
};
```

#### 401 Unauthorized

**Handled automatically by API service** - redirects to login page.

#### 403 Forbidden

**Backend Response:**
```json
{
  "success": false,
  "message": "You do not have permission to perform this action."
}
```

**Service Handling:**
```typescript
async deleteAdminUser(id: number, signal?: AbortSignal): Promise<void> {
  try {
    await apiService.delete(`/admins/${id}`, { signal });
  } catch (error) {
    // handleServiceError converts to ApplicationError
    // Component can catch and display error message
    handleServiceError(error);
  }
}
```

**Component Handling:**
```typescript
import { ApplicationError } from '@admin/types/errors';

const deleteUser = async (id: number) => {
  try {
    await adminUserService.deleteAdminUser(id);
    toast.add({ severity: 'success', summary: 'Admin deleted' });
  } catch (error) {
    if (error instanceof ApplicationError) {
      toast.add({ severity: 'error', summary: error.message });
    } else {
      toast.add({ severity: 'error', summary: 'Failed to delete admin' });
    }
  }
};
```

#### 419 CSRF Token Mismatch

**Handled automatically by API service** - refreshes token and retries request.

#### 500 Server Error

**Backend Response:**
```json
{
  "message": "Server Error",
  "exception": "..."
}
```

**Service Handling:**
```typescript
// Same as other errors - handleServiceError converts to ApplicationError
```

### Network Errors

**Detection:**
```typescript
import { isNetworkError } from '@admin/types/errors';

try {
  await userService.getUsers();
} catch (error) {
  if (isNetworkError(error)) {
    toast.add({
      severity: 'error',
      summary: 'Network Error',
      detail: 'Please check your internet connection',
    });
  }
}
```

### Request Cancellation

**Cancelled requests are silently ignored** - `handleServiceError` returns early without throwing.

```typescript
const { getSignal } = useRequestCancellation();

const loadUsers = async () => {
  try {
    const users = await userService.getAllUsers({}, getSignal());
    // Process users
  } catch (error) {
    // If request was cancelled, error is silently ignored
    // This block won't execute for cancelled requests
    toast.add({ severity: 'error', summary: 'Failed to load users' });
  }
};
```

---

## Request Cancellation

### useRequestCancellation Composable

**Location**: `resources/admin/js/composables/useRequestCancellation.ts`

**Purpose**: Manage request cancellation with AbortController

### Basic Usage

```typescript
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';

const { getSignal, cancel, reset, isAborted } = useRequestCancellation();

const loadData = async () => {
  try {
    const data = await userService.getAllUsers({}, getSignal());
    users.value = data;
  } catch (error) {
    // Cancelled requests are silently ignored
    if (!isRequestCancelled(error)) {
      handleError(error);
    }
  }
};

// Cancel request manually
const cancelRequest = () => {
  cancel('User cancelled');
};

// Component unmount automatically cancels pending requests
```

### Automatic Cleanup on Unmount

**The composable automatically cancels all pending requests when the component unmounts:**

```typescript
onUnmounted(() => {
  cancel('Component unmounted');
});
```

**No manual cleanup needed!**

### Cancelling on New Request

**Pattern**: Cancel previous request when starting a new one

```typescript
const { getSignal, cancel } = useRequestCancellation();

const searchUsers = async (query: string) => {
  // Cancel previous search
  cancel('New search started');

  try {
    const users = await userService.getAllUsers(
      { search: query },
      getSignal()
    );
    users.value = users;
  } catch (error) {
    if (!isRequestCancelled(error)) {
      handleError(error);
    }
  }
};

// Debounced search
watch(searchQuery, (newQuery) => {
  searchUsers(newQuery);
}, { debounce: 300 });
```

### Multiple Concurrent Requests

**Use `useMultipleRequestCancellation` for independent cancellation:**

```typescript
import { useMultipleRequestCancellation } from '@admin/composables/useRequestCancellation';

const { createSignal, cancel, cancelAll } = useMultipleRequestCancellation();

const loadUsers = async () => {
  const signal = createSignal('users');
  try {
    const users = await userService.getAllUsers({}, signal);
    users.value = users;
  } catch (error) {
    if (!isRequestCancelled(error)) handleError(error);
  }
};

const loadAdmins = async () => {
  const signal = createSignal('admins');
  try {
    const admins = await adminUserService.getAllAdminUsers({}, signal);
    admins.value = admins;
  } catch (error) {
    if (!isRequestCancelled(error)) handleError(error);
  }
};

// Cancel just the users request
cancel('users');

// Cancel all requests
cancelAll();
```

### Full Example: Search with Cancellation

```typescript
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import { userService } from '@admin/services/userService';
import { isRequestCancelled } from '@admin/types/errors';

const searchQuery = ref('');
const users = ref<User[]>([]);
const loading = ref(false);

const { getSignal, cancel } = useRequestCancellation();

const searchUsers = async () => {
  // Cancel previous search
  cancel('New search started');

  loading.value = true;

  try {
    const results = await userService.getAllUsers(
      { search: searchQuery.value },
      getSignal()
    );
    users.value = results;
  } catch (error) {
    if (!isRequestCancelled(error)) {
      toast.add({ severity: 'error', summary: 'Search failed' });
    }
  } finally {
    loading.value = false;
  }
};

// Debounced search
watch(searchQuery, searchUsers, { debounce: 300 });
</script>
```

---

## Pagination

### Laravel Pagination Structure

**Backend returns pagination in two styles:**

**Style 1: Separated meta (User API)**
```typescript
{
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}
```

**Style 2: Direct pagination (Admin API)**
```typescript
{
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
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}
```

### PaginatedResponse Type

**Location**: `resources/admin/js/types/api.ts`

```typescript
export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
```

### Service Method (Paginated)

```typescript
async getUsers(
  params?: UserListParams,
  signal?: AbortSignal
): Promise<PaginatedResponse<User>> {
  try {
    const response = await apiService.get<{
      success: boolean;
      data: User[];
      meta: PaginationMeta;
    }>('/users', { params, signal });

    if (response.success && response.data) {
      return {
        current_page: response.meta.current_page,
        data: response.data,
        first_page_url: `${response.meta.path}?page=1`,
        from: response.meta.from,
        last_page: response.meta.last_page,
        last_page_url: `${response.meta.path}?page=${response.meta.last_page}`,
        links: [],
        next_page_url:
          response.meta.current_page < response.meta.last_page
            ? `${response.meta.path}?page=${response.meta.current_page + 1}`
            : null,
        path: response.meta.path,
        per_page: response.meta.per_page,
        prev_page_url:
          response.meta.current_page > 1
            ? `${response.meta.path}?page=${response.meta.current_page - 1}`
            : null,
        to: response.meta.to,
        total: response.meta.total,
      };
    }

    // Empty response
    return {
      current_page: 1,
      data: [],
      first_page_url: '',
      from: 0,
      last_page: 1,
      last_page_url: '',
      links: [],
      next_page_url: null,
      path: '',
      per_page: 15,
      prev_page_url: null,
      to: 0,
      total: 0,
    };
  } catch (error) {
    handleServiceError(error);
  }
}
```

### Store Integration

```typescript
// Store
const fetchUsers = async (signal?: AbortSignal): Promise<void> => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await userService.getUsers(filterParams.value, signal);

    // Update state
    users.value = response.data;
    totalRecords.value = response.total;
    totalPages.value = response.last_page;
    paginationMeta.value = response;
  } catch (err) {
    error.value = getErrorMessage(err);
    throw err;
  } finally {
    isLoading.value = false;
  }
};
```

### PrimeVue DataTable Integration

**Page Index Conversion**: PrimeVue uses 0-based indexing, Laravel uses 1-based

```typescript
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import type { DataTablePageEvent } from 'primevue/datatable';

const userStore = useUserStore();

// Reactive state
const loading = computed(() => userStore.isLoading);
const users = computed(() => userStore.users);
const totalRecords = computed(() => userStore.totalRecords);

// PrimeVue uses 0-based page index
const currentPageIndex = computed(() => userStore.currentPage - 1);
const rowsPerPage = computed(() => userStore.rowsPerPage);

// Handle page change
const onPageChange = async (event: DataTablePageEvent) => {
  // Convert from 0-based to 1-based
  const laravelPage = event.page + 1;

  userStore.setPage(laravelPage);
  userStore.setRowsPerPage(event.rows);

  await userStore.fetchUsers();
};

onMounted(() => {
  userStore.fetchUsers();
});
</script>

<template>
  <DataTable
    :value="users"
    :loading="loading"
    :totalRecords="totalRecords"
    :rows="rowsPerPage"
    :first="currentPageIndex * rowsPerPage"
    lazy
    paginator
    @page="onPageChange"
  >
    <!-- Columns -->
  </DataTable>
</template>
```

### Fetching All Pages

**Pattern**: Automatically fetch all pages (for dropdowns, exports, etc.)

```typescript
async getAllAdminUsers(
  filters?: AdminUserFilterParams,
  signal?: AbortSignal
): Promise<Admin[]> {
  try {
    const allAdmins: Admin[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const perPage = 100; // Fetch 100 per request

    while (hasMorePages) {
      // Check if aborted
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      const response = await this.getAdminUsers(currentPage, perPage, filters, signal);

      allAdmins.push(...response.data);

      // Check for more pages
      hasMorePages = currentPage < response.meta.last_page;
      currentPage++;
    }

    return allAdmins;
  } catch (error) {
    handleServiceError(error);
  }
}
```

---

## Type Safety

### Request Types

**Define payload types for create/update operations:**

```typescript
// Create payload
export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  alias?: string | null;
  status?: UserStatus;
}

// Update payload (all fields optional)
export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  alias?: string | null;
  status?: UserStatus;
}

// Filter parameters
export interface UserListParams {
  search?: string;
  status?: UserStatus;
  include_deleted?: boolean;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}
```

### Response Types

**Define response types matching backend structure:**

```typescript
// Single resource response
export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

// List response
export interface UserListResponse {
  success: boolean;
  data: User[];
  message?: string;
}

// Paginated response
export interface UserPaginatedResponse {
  success: boolean;
  data: User[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

// Delete response
export interface DeleteUserResponse {
  success: boolean;
  message: string;
}
```

### Resource Types

**Define the core resource type:**

```typescript
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  name?: string; // Computed field
  email: string;
  email_verified_at: string | null;
  alias: string | null;
  uuid: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  activities?: Activity[];
}

export type UserStatus = 'active' | 'inactive' | 'suspended';
```

### Type Guards

**Create type guards for runtime type checking:**

```typescript
// Check if error has validation errors
export function hasValidationErrors(
  error: unknown
): error is AxiosError<ValidationErrorResponse> {
  return (
    isAxiosError(error) &&
    error.response?.status === 422 &&
    typeof error.response?.data === 'object' &&
    error.response?.data !== null &&
    'errors' in error.response.data
  );
}

// Check if response is paginated
export function isPaginatedResponse<T>(
  response: unknown
): response is PaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'current_page' in response &&
    'total' in response
  );
}
```

### Generic Service Methods

**Use generics for reusable service methods:**

```typescript
class ApiService {
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
}

// Usage with type safety
const user = await apiService.get<User>('/users/1');
// user is typed as User

const users = await apiService.get<User[]>('/users');
// users is typed as User[]
```

---

## Existing Services Reference

### authService

**Location**: `resources/admin/js/services/authService.ts`

**Purpose**: Authentication and session management

#### Methods

##### login

```typescript
async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<Admin>
```

**Parameters:**
- `credentials`: `{ email: string; password: string; remember?: boolean }`
- `signal`: Optional AbortSignal

**Returns**: Admin object

**Example:**
```typescript
try {
  const admin = await authService.login({
    email: 'admin@example.com',
    password: 'password123',
    remember: true,
  });
  console.log('Logged in:', admin);
} catch (error) {
  if (hasValidationErrors(error)) {
    // Handle validation errors
  }
}
```

##### logout

```typescript
async logout(signal?: AbortSignal): Promise<void>
```

**Example:**
```typescript
await authService.logout();
```

##### checkAuth

```typescript
async checkAuth(signal?: AbortSignal): Promise<Admin | null>
```

**Returns**: Admin if authenticated, null otherwise

**Example:**
```typescript
const admin = await authService.checkAuth();
if (admin) {
  console.log('Authenticated as:', admin.name);
}
```

##### getCurrentAdmin

```typescript
async getCurrentAdmin(signal?: AbortSignal): Promise<Admin | null>
```

**Example:**
```typescript
const admin = await authService.getCurrentAdmin();
```

##### hasRememberMe

```typescript
hasRememberMe(): boolean
```

**Example:**
```typescript
if (authService.hasRememberMe()) {
  // User enabled "remember me"
}
```

---

### adminUserService

**Location**: `resources/admin/js/services/adminUserService.ts`

**Purpose**: Admin user management (CRUD operations for admin accounts)

#### Methods

##### getAdminUsers

```typescript
async getAdminUsers(
  page: number = 1,
  perPage: number = 15,
  filters?: AdminUserFilterParams,
  signal?: AbortSignal
): Promise<AdminUserListResponse>
```

**Parameters:**
- `page`: Page number (1-based)
- `perPage`: Items per page
- `filters`: Optional filter parameters
- `signal`: Optional AbortSignal

**Filter Parameters:**
```typescript
interface AdminUserFilterParams {
  search?: string;
  status?: AdminStatus;
  role?: string;
  include_deleted?: boolean;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}
```

**Returns**: Paginated response with admin users

**Example:**
```typescript
const response = await adminUserService.getAdminUsers(1, 15, {
  search: 'john',
  status: 'active',
  sort_field: 'created_at',
  sort_order: 'desc',
});

console.log('Admins:', response.data);
console.log('Total:', response.meta.total);
```

##### getAllAdminUsers

```typescript
async getAllAdminUsers(
  filters?: AdminUserFilterParams,
  signal?: AbortSignal
): Promise<Admin[]>
```

**Purpose**: Fetch all admin users (auto-paginated)

**Example:**
```typescript
const allAdmins = await adminUserService.getAllAdminUsers({
  status: 'active',
});
console.log('Total admins:', allAdmins.length);
```

##### getAdminUser

```typescript
async getAdminUser(id: number, signal?: AbortSignal): Promise<Admin>
```

**Example:**
```typescript
const admin = await adminUserService.getAdminUser(5);
console.log('Admin:', admin.name);
```

##### createAdminUser

```typescript
async createAdminUser(data: AdminUserUpdateData, signal?: AbortSignal): Promise<Admin>
```

**Example:**
```typescript
const newAdmin = await adminUserService.createAdminUser({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'admin',
  status: 'active',
});
```

##### updateAdminUser

```typescript
async updateAdminUser(
  id: number,
  data: AdminUserUpdateData,
  signal?: AbortSignal
): Promise<Admin>
```

**Example:**
```typescript
const updatedAdmin = await adminUserService.updateAdminUser(5, {
  name: 'Jane Doe',
  status: 'inactive',
});
```

##### deleteAdminUser

```typescript
async deleteAdminUser(id: number, signal?: AbortSignal): Promise<void>
```

**Example:**
```typescript
await adminUserService.deleteAdminUser(5);
```

##### restoreAdminUser

```typescript
async restoreAdminUser(id: number, signal?: AbortSignal): Promise<Admin>
```

**Example:**
```typescript
const restoredAdmin = await adminUserService.restoreAdminUser(5);
```

---

### userService

**Location**: `resources/admin/js/services/userService.ts`

**Purpose**: User management (CRUD operations for end users)

#### Methods

##### getUsers

```typescript
async getUsers(params?: UserListParams, signal?: AbortSignal): Promise<PaginatedResponse<User>>
```

**Example:**
```typescript
const response = await userService.getUsers({
  page: 1,
  per_page: 20,
  search: 'john',
  status: 'active',
  include_deleted: true,
});

console.log('Users:', response.data);
console.log('Total:', response.total);
```

##### getAllUsers

```typescript
async getAllUsers(params?: UserListParams, signal?: AbortSignal): Promise<User[]>
```

**Example:**
```typescript
const allUsers = await userService.getAllUsers({
  status: 'active',
});
```

##### getUser

```typescript
async getUser(id: string, signal?: AbortSignal): Promise<User>
```

**Example:**
```typescript
const user = await userService.getUser('123');
```

##### createUser

```typescript
async createUser(payload: CreateUserPayload, signal?: AbortSignal): Promise<User>
```

**Example:**
```typescript
const newUser = await userService.createUser({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  password: 'password123',
  alias: 'johndoe',
  status: 'active',
});
```

##### updateUser

```typescript
async updateUser(
  id: string,
  payload: UpdateUserPayload,
  signal?: AbortSignal
): Promise<User>
```

**Example:**
```typescript
const updatedUser = await userService.updateUser('123', {
  first_name: 'Jane',
  status: 'suspended',
});
```

##### deleteUser

```typescript
async deleteUser(id: string, signal?: AbortSignal): Promise<void>
```

**Example:**
```typescript
await userService.deleteUser('123');
```

##### restoreUser

```typescript
async restoreUser(id: string, signal?: AbortSignal): Promise<User>
```

**Example:**
```typescript
const restoredUser = await userService.restoreUser('123');
```

---

### activityLogService

**Location**: `resources/admin/js/services/activityLogService.ts`

**Purpose**: Activity log management (viewing and cleaning logs)

#### Methods

##### getAllActivities

```typescript
async getAllActivities(
  params?: ActivityFilterParams,
  signal?: AbortSignal
): Promise<Activity[]>
```

**Example:**
```typescript
const activities = await activityLogService.getAllActivities({
  log_name: 'user',
  date_from: '2024-01-01',
  date_to: '2024-12-31',
});
```

##### getUserActivities

```typescript
async getUserActivities(
  params?: ActivityFilterParams,
  signal?: AbortSignal
): Promise<Activity[]>
```

**Example:**
```typescript
const userActivities = await activityLogService.getUserActivities();
```

##### getAdminActivities

```typescript
async getAdminActivities(
  params?: ActivityFilterParams,
  signal?: AbortSignal
): Promise<Activity[]>
```

**Example:**
```typescript
const adminActivities = await activityLogService.getAdminActivities();
```

##### getActivitiesForUser

```typescript
async getActivitiesForUser(userId: number, signal?: AbortSignal): Promise<Activity[]>
```

**Example:**
```typescript
const activities = await activityLogService.getActivitiesForUser(123);
```

##### getActivitiesForAdmin

```typescript
async getActivitiesForAdmin(adminId: number, signal?: AbortSignal): Promise<Activity[]>
```

**Example:**
```typescript
const activities = await activityLogService.getActivitiesForAdmin(5);
```

##### getActivity

```typescript
async getActivity(id: number, signal?: AbortSignal): Promise<Activity>
```

**Example:**
```typescript
const activity = await activityLogService.getActivity(456);
```

##### cleanOldActivities

```typescript
async cleanOldActivities(
  days: number = 365,
  signal?: AbortSignal
): Promise<CleanActivitiesResponse>
```

**Example:**
```typescript
const result = await activityLogService.cleanOldActivities(90);
console.log('Deleted:', result.deleted_count);
```

---

### siteConfigService

**Location**: `resources/admin/js/services/siteConfigService.ts`

**Purpose**: Site configuration management

#### Methods

##### getSiteConfig

```typescript
async getSiteConfig(signal?: AbortSignal): Promise<SiteConfig>
```

**Example:**
```typescript
const config = await siteConfigService.getSiteConfig();
console.log('Site name:', config.site_name);
```

##### updateSiteConfig

```typescript
async updateSiteConfig(
  data: UpdateSiteConfigRequest,
  signal?: AbortSignal
): Promise<SiteConfig>
```

**Parameters:**
```typescript
interface UpdateSiteConfigRequest {
  site_name: string;
  maintenance_mode: boolean;
  timezone: string;
  user_registration_enabled: boolean;
  google_tag_manager_id?: string;
  google_analytics_id?: string;
  google_search_console_code?: string;
  discord_link?: string;
  support_email?: string;
  contact_email?: string;
  admin_email?: string;
  logo?: File;
  favicon?: File;
  og_image?: File;
  remove_logo?: boolean;
  remove_favicon?: boolean;
  remove_og_image?: boolean;
}
```

**Example (text fields):**
```typescript
const updatedConfig = await siteConfigService.updateSiteConfig({
  site_name: 'My Site',
  maintenance_mode: false,
  timezone: 'America/New_York',
  user_registration_enabled: true,
  support_email: 'support@example.com',
});
```

**Example (file upload):**
```typescript
const logoFile = document.querySelector<HTMLInputElement>('#logo-input')?.files?.[0];

if (logoFile) {
  const updatedConfig = await siteConfigService.updateSiteConfig({
    site_name: config.site_name,
    maintenance_mode: config.maintenance_mode,
    timezone: config.timezone,
    user_registration_enabled: config.user_registration_enabled,
    logo: logoFile,
  });
}
```

**Note**: Uses `multipart/form-data` for file uploads with `_method=PUT` for Laravel method spoofing.

---

## Creating New Services

### When to Create a Service

Create a new service when:

1. You're adding a new resource/entity (e.g., Teams, Projects, etc.)
2. You need to communicate with a new backend API endpoint
3. You have multiple components that need to access the same API
4. You want to centralize API logic for a specific domain

**Don't create a service for:**
- One-off API calls that won't be reused
- Simple data transformations (use composables)
- UI state management (use stores)

### Service Creation Checklist

- [ ] Create service class in `resources/admin/js/services/`
- [ ] Define types in `resources/admin/js/types/`
- [ ] Implement class with singleton pattern
- [ ] Add JSDoc comments to all methods
- [ ] Use `handleServiceError` for error handling
- [ ] Accept optional `AbortSignal` in all methods
- [ ] Unwrap responses before returning
- [ ] Create tests in `resources/admin/js/services/__tests__/`
- [ ] Export singleton instance

### Complete Example: Create a Teams Service

#### Step 1: Define Types

**File**: `resources/admin/js/types/team.ts`

```typescript
/**
 * Team resource types
 */

export interface Team {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  status: TeamStatus;
  member_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type TeamStatus = 'active' | 'inactive' | 'archived';

export interface CreateTeamPayload {
  name: string;
  description?: string;
  owner_id: number;
  status?: TeamStatus;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  owner_id?: number;
  status?: TeamStatus;
}

export interface TeamListParams {
  search?: string;
  status?: TeamStatus;
  owner_id?: number;
  include_deleted?: boolean;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// Response types
export interface TeamResponse {
  success: boolean;
  data: Team;
  message?: string;
}

export interface TeamListResponse {
  data: Team[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}
```

#### Step 2: Create Service

**File**: `resources/admin/js/services/teamService.ts`

```typescript
import { apiService } from './api';
import { handleServiceError } from '@admin/utils/errorHandler';
import type {
  Team,
  CreateTeamPayload,
  UpdateTeamPayload,
  TeamListParams,
  TeamResponse,
  TeamListResponse,
} from '@admin/types/team';

/**
 * Team Service
 * Handles CRUD operations for teams
 */
class TeamService {
  /**
   * Get paginated teams
   * @param params - Optional filter parameters
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<TeamListResponse>
   */
  async getTeams(params?: TeamListParams, signal?: AbortSignal): Promise<TeamListResponse> {
    try {
      const response = await apiService.get<TeamListResponse>('/teams', {
        params,
        signal,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Failed to fetch teams');
      }

      return response;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get all teams (auto-paginated)
   * @param params - Optional filter parameters
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Team[]>
   */
  async getAllTeams(params?: TeamListParams, signal?: AbortSignal): Promise<Team[]> {
    try {
      const allTeams: Team[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const perPage = 100;

      while (hasMorePages) {
        if (signal?.aborted) {
          throw new Error('Request aborted');
        }

        const response = await this.getTeams(
          { ...params, page: currentPage, per_page: perPage },
          signal
        );

        allTeams.push(...response.data);

        hasMorePages = currentPage < response.meta.last_page;
        currentPage++;
      }

      return allTeams;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get single team by ID
   * @param id - Team ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Team>
   */
  async getTeam(id: number, signal?: AbortSignal): Promise<Team> {
    try {
      const response = await apiService.get<TeamResponse>(`/teams/${id}`, { signal });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch team');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Create a new team
   * @param payload - Team data
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Team>
   */
  async createTeam(payload: CreateTeamPayload, signal?: AbortSignal): Promise<Team> {
    try {
      const response = await apiService.post<TeamResponse>('/teams', payload, { signal });

      if (!response.success || !response.data) {
        throw new Error('Failed to create team');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Update a team
   * @param id - Team ID
   * @param payload - Updated team data
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Team>
   */
  async updateTeam(
    id: number,
    payload: UpdateTeamPayload,
    signal?: AbortSignal
  ): Promise<Team> {
    try {
      const response = await apiService.put<TeamResponse>(`/teams/${id}`, payload, { signal });

      if (!response.success || !response.data) {
        throw new Error('Failed to update team');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Delete a team (soft delete)
   * @param id - Team ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async deleteTeam(id: number, signal?: AbortSignal): Promise<void> {
    try {
      await apiService.delete<{ success: boolean }>(`/teams/${id}`, { signal });
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Restore a soft-deleted team
   * @param id - Team ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Team>
   */
  async restoreTeam(id: number, signal?: AbortSignal): Promise<Team> {
    try {
      const response = await apiService.post<TeamResponse>(
        `/teams/${id}/restore`,
        {},
        { signal }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to restore team');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export singleton instance
export const teamService = new TeamService();
export default teamService;
```

#### Step 3: Create Tests

**File**: `resources/admin/js/services/__tests__/teamService.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { teamService } from '../teamService';
import { apiService } from '../api';
import type { Team, TeamListResponse, TeamResponse } from '@admin/types/team';

// Mock apiService
vi.mock('../api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock error handler
vi.mock('@admin/utils/errorHandler', () => ({
  handleServiceError: vi.fn((error) => {
    throw error;
  }),
}));

describe('TeamService', () => {
  const mockTeam: Team = {
    id: 1,
    name: 'Engineering Team',
    description: 'Backend engineers',
    owner_id: 5,
    status: 'active',
    member_count: 10,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    deleted_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTeams', () => {
    it('successfully fetches teams', async () => {
      const mockResponse: TeamListResponse = {
        data: [mockTeam],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 15,
          to: 1,
          total: 1,
        },
        links: {
          first: '/teams?page=1',
          last: '/teams?page=1',
          prev: null,
          next: null,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await teamService.getTeams();

      expect(apiService.get).toHaveBeenCalledWith('/teams', {
        params: undefined,
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('includes filter params in request', async () => {
      const mockResponse: TeamListResponse = {
        data: [mockTeam],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 15,
          to: 1,
          total: 1,
        },
        links: {
          first: null,
          last: null,
          prev: null,
          next: null,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const params = { search: 'engineering', status: 'active' as const };
      await teamService.getTeams(params);

      expect(apiService.get).toHaveBeenCalledWith('/teams', {
        params,
        signal: undefined,
      });
    });
  });

  describe('getTeam', () => {
    it('successfully fetches a single team', async () => {
      const mockResponse: TeamResponse = {
        success: true,
        data: mockTeam,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await teamService.getTeam(1);

      expect(apiService.get).toHaveBeenCalledWith('/teams/1', { signal: undefined });
      expect(result).toEqual(mockTeam);
    });

    it('throws error if response is unsuccessful', async () => {
      const mockResponse: TeamResponse = {
        success: false,
        data: mockTeam,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await expect(teamService.getTeam(1)).rejects.toThrow('Failed to fetch team');
    });
  });

  describe('createTeam', () => {
    it('successfully creates a team', async () => {
      const payload = {
        name: 'New Team',
        description: 'A new team',
        owner_id: 5,
      };

      const mockResponse: TeamResponse = {
        success: true,
        data: { ...mockTeam, ...payload },
      };

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      const result = await teamService.createTeam(payload);

      expect(apiService.post).toHaveBeenCalledWith('/teams', payload, { signal: undefined });
      expect(result.name).toBe('New Team');
    });
  });

  describe('updateTeam', () => {
    it('successfully updates a team', async () => {
      const payload = { name: 'Updated Team' };

      const mockResponse: TeamResponse = {
        success: true,
        data: { ...mockTeam, name: 'Updated Team' },
      };

      vi.mocked(apiService.put).mockResolvedValue(mockResponse);

      const result = await teamService.updateTeam(1, payload);

      expect(apiService.put).toHaveBeenCalledWith('/teams/1', payload, { signal: undefined });
      expect(result.name).toBe('Updated Team');
    });
  });

  describe('deleteTeam', () => {
    it('successfully deletes a team', async () => {
      vi.mocked(apiService.delete).mockResolvedValue({ success: true });

      await teamService.deleteTeam(1);

      expect(apiService.delete).toHaveBeenCalledWith('/teams/1', { signal: undefined });
    });
  });

  describe('restoreTeam', () => {
    it('successfully restores a team', async () => {
      const mockResponse: TeamResponse = {
        success: true,
        data: mockTeam,
      };

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      const result = await teamService.restoreTeam(1);

      expect(apiService.post).toHaveBeenCalledWith('/teams/1/restore', {}, { signal: undefined });
      expect(result).toEqual(mockTeam);
    });
  });
});
```

#### Step 4: Use in Components

```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { teamService } from '@admin/services/teamService';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import type { Team } from '@admin/types/team';

const teams = ref<Team[]>([]);
const loading = ref(false);

const { getSignal } = useRequestCancellation();

const loadTeams = async () => {
  loading.value = true;
  try {
    const response = await teamService.getTeams({}, getSignal());
    teams.value = response.data;
  } catch (error) {
    console.error('Failed to load teams:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadTeams();
});
</script>
```

---

## Testing Services

### Testing Setup

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { myService } from '../myService';
import { apiService } from '../api';

// Mock apiService
vi.mock('../api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock error handler
vi.mock('@admin/utils/errorHandler', () => ({
  handleServiceError: vi.fn((error) => {
    throw error;
  }),
}));
```

### Testing Success Cases

```typescript
describe('getResource', () => {
  it('successfully fetches resource', async () => {
    const mockResponse = {
      success: true,
      data: { id: 1, name: 'Test' },
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await myService.getResource(1);

    expect(apiService.get).toHaveBeenCalledWith('/resources/1', { signal: undefined });
    expect(result).toEqual(mockResponse.data);
  });

  it('passes abort signal to api service', async () => {
    const mockResponse = { success: true, data: { id: 1 } };
    const abortController = new AbortController();

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    await myService.getResource(1, abortController.signal);

    expect(apiService.get).toHaveBeenCalledWith('/resources/1', {
      signal: abortController.signal,
    });
  });
});
```

### Testing Error Cases

```typescript
describe('getResource error handling', () => {
  it('throws error when response is unsuccessful', async () => {
    const mockResponse = {
      success: false,
      data: null,
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    await expect(myService.getResource(1)).rejects.toThrow('Failed to fetch resource');
  });

  it('throws error when data is missing', async () => {
    const mockResponse = {
      success: true,
      data: null,
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    await expect(myService.getResource(1)).rejects.toThrow('Failed to fetch resource');
  });

  it('handles API errors', async () => {
    const apiError = new Error('Network error');

    vi.mocked(apiService.get).mockRejectedValue(apiError);

    await expect(myService.getResource(1)).rejects.toThrow('Network error');
  });
});
```

### Testing Validation Errors

```typescript
import { AxiosError } from 'axios';

describe('createResource validation errors', () => {
  it('handles validation errors correctly', async () => {
    const validationError = {
      response: {
        status: 422,
        data: {
          message: 'Validation failed',
          errors: {
            name: ['The name field is required.'],
            email: ['The email must be a valid email address.'],
          },
        },
      },
    } as AxiosError;

    vi.mocked(apiService.post).mockRejectedValue(validationError);

    await expect(
      myService.createResource({
        name: '',
        email: 'invalid',
      })
    ).rejects.toMatchObject({
      response: {
        status: 422,
        data: {
          errors: expect.objectContaining({
            name: expect.arrayContaining([expect.any(String)]),
            email: expect.arrayContaining([expect.any(String)]),
          }),
        },
      },
    });
  });
});
```

### Testing Pagination

```typescript
describe('getAllResources', () => {
  it('fetches all pages automatically', async () => {
    const page1 = {
      data: [{ id: 1 }, { id: 2 }],
      meta: { current_page: 1, last_page: 3 },
    };
    const page2 = {
      data: [{ id: 3 }, { id: 4 }],
      meta: { current_page: 2, last_page: 3 },
    };
    const page3 = {
      data: [{ id: 5 }],
      meta: { current_page: 3, last_page: 3 },
    };

    vi.mocked(apiService.get)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2)
      .mockResolvedValueOnce(page3);

    const result = await myService.getAllResources();

    expect(result).toHaveLength(5);
    expect(apiService.get).toHaveBeenCalledTimes(3);
  });

  it('stops fetching when aborted', async () => {
    const abortController = new AbortController();

    const page1 = {
      data: [{ id: 1 }],
      meta: { current_page: 1, last_page: 3 },
    };

    vi.mocked(apiService.get).mockImplementation(async () => {
      abortController.abort();
      return page1;
    });

    await expect(myService.getAllResources({}, abortController.signal)).rejects.toThrow(
      'Request aborted'
    );
  });
});
```

---

## Common Patterns

### CRUD Operations

```typescript
// Create
const newResource = await resourceService.createResource({
  name: 'New Resource',
  description: 'Description',
});

// Read (single)
const resource = await resourceService.getResource(id);

// Read (list)
const resources = await resourceService.getAllResources({
  search: 'query',
  status: 'active',
});

// Update
const updatedResource = await resourceService.updateResource(id, {
  name: 'Updated Name',
});

// Delete
await resourceService.deleteResource(id);

// Restore
const restoredResource = await resourceService.restoreResource(id);
```

### Search/Filter

```typescript
const { getSignal, cancel } = useRequestCancellation();

const searchQuery = ref('');
const results = ref<Resource[]>([]);

watch(
  searchQuery,
  async (query) => {
    // Cancel previous search
    cancel('New search');

    if (!query) {
      results.value = [];
      return;
    }

    try {
      const response = await resourceService.getResources(
        { search: query },
        getSignal()
      );
      results.value = response.data;
    } catch (error) {
      if (!isRequestCancelled(error)) {
        handleError(error);
      }
    }
  },
  { debounce: 300 }
);
```

### File Uploads

```typescript
class FileService {
  async uploadFile(file: File, signal?: AbortSignal): Promise<FileResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiService.post<FileResponse>('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to upload file');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }
}
```

### Bulk Operations

```typescript
async bulkUpdateResources(
  ids: number[],
  data: Partial<ResourcePayload>,
  signal?: AbortSignal
): Promise<BulkUpdateResponse> {
  try {
    const response = await apiService.post<BulkUpdateResponse>(
      '/resources/bulk-update',
      {
        ids,
        data,
      },
      { signal }
    );

    if (!response.success) {
      throw new Error('Bulk update failed');
    }

    return response;
  } catch (error) {
    handleServiceError(error);
  }
}
```

### Polling (Real-time Updates)

```typescript
class JobService {
  async pollJobStatus(
    jobId: number,
    interval: number = 2000,
    signal?: AbortSignal
  ): Promise<Job> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        if (signal?.aborted) {
          reject(new Error('Polling cancelled'));
          return;
        }

        try {
          const job = await this.getJob(jobId, signal);

          if (job.status === 'completed') {
            resolve(job);
          } else if (job.status === 'failed') {
            reject(new Error('Job failed'));
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}
```

### Conditional Requests

```typescript
async getResourceIfModified(
  id: number,
  lastModified: string,
  signal?: AbortSignal
): Promise<Resource | null> {
  try {
    const response = await apiService.get<ResourceResponse>(`/resources/${id}`, {
      headers: {
        'If-Modified-Since': lastModified,
      },
      signal,
    });

    if (!response.success || !response.data) {
      return null; // Not modified
    }

    return response.data;
  } catch (error) {
    handleServiceError(error);
  }
}
```

---

## Best Practices

### 1. Response Unwrapping

**Always unwrap API responses in services** - components should receive clean data.

**Good** ✅
```typescript
async getUser(id: number): Promise<User> {
  const response = await apiService.get<ApiResponse<User>>(`/users/${id}`);
  if (response.success && response.data) {
    return response.data; // Return unwrapped
  }
  throw new Error('Failed to fetch user');
}
```

**Bad** ❌
```typescript
async getUser(id: number): Promise<ApiResponse<User>> {
  return await apiService.get<ApiResponse<User>>(`/users/${id}`); // Wrapped
}
```

### 2. Error Handling

**Always use `handleServiceError`** - never swallow errors.

**Good** ✅
```typescript
async deleteUser(id: number): Promise<void> {
  try {
    await apiService.delete(`/users/${id}`);
  } catch (error) {
    handleServiceError(error); // Standardized handling
  }
}
```

**Bad** ❌
```typescript
async deleteUser(id: number): Promise<void> {
  try {
    await apiService.delete(`/users/${id}`);
  } catch (error) {
    console.error(error); // Silent failure
  }
}
```

### 3. Type Safety

**Provide full type annotations** for parameters and return types.

**Good** ✅
```typescript
async createUser(payload: CreateUserPayload, signal?: AbortSignal): Promise<User> {
  // ...
}
```

**Bad** ❌
```typescript
async createUser(payload: any): Promise<any> {
  // ...
}
```

### 4. Request Cancellation

**Always accept optional AbortSignal** parameter.

**Good** ✅
```typescript
async getAllUsers(params?: UserListParams, signal?: AbortSignal): Promise<User[]> {
  const response = await apiService.get('/users', { params, signal });
  // ...
}
```

**Bad** ❌
```typescript
async getAllUsers(params?: UserListParams): Promise<User[]> {
  const response = await apiService.get('/users', { params }); // No signal
  // ...
}
```

### 5. Loading States

**Let stores/components manage loading state** - services should focus on API calls.

**Good** ✅
```typescript
// Service
async getUsers(): Promise<User[]> {
  const response = await apiService.get('/users');
  return response.data;
}

// Component
const loading = ref(false);

const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await userService.getUsers();
  } finally {
    loading.value = false;
  }
};
```

**Bad** ❌
```typescript
// Service with loading state
const loading = ref(false);

async getUsers(): Promise<User[]> {
  loading.value = true; // Don't do this!
  const response = await apiService.get('/users');
  loading.value = false;
  return response.data;
}
```

### 6. Validation Errors

**Preserve validation errors** for form components to handle.

**Good** ✅
```typescript
// Service preserves validation errors
async createUser(payload: CreateUserPayload): Promise<User> {
  try {
    const response = await apiService.post('/users', payload);
    return response.data;
  } catch (error) {
    handleServiceError(error); // Preserves 422 errors
  }
}

// Component extracts field errors
try {
  await userService.createUser(formData);
} catch (error) {
  if (hasValidationErrors(error)) {
    const errors = getValidationErrors(error);
    // Display field-specific errors
  }
}
```

### 7. Consistent Method Naming

**Follow naming conventions** for predictability.

```typescript
// Good ✅
getUsers()        // List
getUser(id)       // Single
createUser(data)  // Create
updateUser(id, data)  // Update
deleteUser(id)    // Delete
restoreUser(id)   // Restore

// Bad ❌
fetchUsers()
retrieveUser(id)
addUser(data)
modifyUser(id, data)
removeUser(id)
```

### 8. Documentation

**Add JSDoc comments** to all public methods.

```typescript
/**
 * Get a single user by ID
 * @param id - User ID
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise<User>
 * @throws {ApplicationError} If user not found or API error
 */
async getUser(id: number, signal?: AbortSignal): Promise<User> {
  // ...
}
```

### 9. Singleton Pattern

**Export singleton instances** instead of classes.

**Good** ✅
```typescript
class UserService {
  // ...
}

export const userService = new UserService();
export default userService;
```

**Bad** ❌
```typescript
export class UserService {
  // ...
}

// Usage requires instantiation
const service = new UserService();
```

### 10. Testing

**Test all service methods** with success and error cases.

```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('successfully fetches user', async () => { /* ... */ });
    it('throws error on failure', async () => { /* ... */ });
    it('passes abort signal', async () => { /* ... */ });
  });
});
```

---

## Troubleshooting

### CORS Issues

**Symptom**: `Access-Control-Allow-Origin` errors in console

**Causes**:
1. Missing `withCredentials: true` in axios config
2. Backend not configured for CORS

**Solution**:
```typescript
// Ensure withCredentials is true
axios.create({
  withCredentials: true, // Required for cookies
});
```

**Backend** (Laravel):
```php
// config/cors.php
'supports_credentials' => true,
```

### CSRF Token Errors

**Symptom**: 419 status code, "CSRF token mismatch"

**Causes**:
1. Missing CSRF token in request
2. Token expired
3. Session expired

**Solutions**:

**1. Ensure meta tag exists**:
```html
<!-- resources/views/admin.blade.php -->
<meta name="csrf-token" content="{{ csrf_token() }}">
```

**2. API service handles 419 automatically** - refreshes token and retries.

**3. Manual CSRF token refresh**:
```typescript
await apiService.fetchCSRFToken();
```

### 419 Errors (CSRF)

**Common Scenarios**:

**1. Session expired after inactivity**:
- Solution: API service auto-refreshes token

**2. Multiple tabs/windows**:
- Solution: Use same session storage

**3. Testing/development**:
- Solution: Disable CSRF for testing (not recommended for production)

### Network Errors

**Symptom**: "Network Error" in error message

**Causes**:
1. Backend server down
2. No internet connection
3. CORS blocking request

**Detection**:
```typescript
import { isNetworkError } from '@admin/types/errors';

try {
  await userService.getUsers();
} catch (error) {
  if (isNetworkError(error)) {
    toast.add({
      severity: 'error',
      summary: 'Network Error',
      detail: 'Please check your connection',
    });
  }
}
```

### Type Errors

**Symptom**: TypeScript compilation errors

**Common Issues**:

**1. Incorrect response type**:
```typescript
// Wrong type
const users = await apiService.get<User>('/users'); // Should be User[]

// Correct type
const users = await apiService.get<User[]>('/users');
```

**2. Missing optional properties**:
```typescript
// Define all optional properties
interface UpdateUserPayload {
  name?: string;  // Note the ?
  email?: string;
}
```

**3. Generic type not specified**:
```typescript
// Missing generic
const response = await apiService.get('/users'); // Type: unknown

// With generic
const response = await apiService.get<User[]>('/users'); // Type: User[]
```

### Request Cancellation Not Working

**Symptom**: Requests not cancelled on component unmount

**Causes**:
1. Not using `useRequestCancellation` composable
2. Not passing signal to service

**Solution**:
```typescript
const { getSignal } = useRequestCancellation();

const loadData = async () => {
  // Pass signal to service
  const data = await userService.getAllUsers({}, getSignal());
};
```

### Pagination Issues

**Symptom**: Wrong page numbers, missing data

**Common Issues**:

**1. Page index mismatch** (0-based vs 1-based):
```typescript
// PrimeVue uses 0-based, Laravel uses 1-based
const onPageChange = (event: DataTablePageEvent) => {
  const laravelPage = event.page + 1; // Convert to 1-based
  store.setPage(laravelPage);
};
```

**2. Response structure mismatch**:
```typescript
// Ensure you're accessing the correct property
const users = response.data; // Not response.data.data
```

### File Upload Failures

**Symptom**: 413 Payload Too Large, or upload fails silently

**Causes**:
1. File too large (exceeds server limit)
2. Wrong Content-Type header
3. Missing `_method` for PUT/PATCH

**Solution**:
```typescript
// Correct file upload
const formData = new FormData();
formData.append('file', file);
formData.append('_method', 'PUT'); // For Laravel method spoofing

await apiService.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

**Backend** (Laravel):
```php
// config/php.ini
upload_max_filesize = 20M
post_max_size = 20M
```

### Authentication Redirect Loop

**Symptom**: Continuous redirects to login page

**Causes**:
1. Session not persisting
2. Cookie issues
3. `withCredentials` not set

**Solution**:
```typescript
// Ensure withCredentials in axios config
axios.create({
  withCredentials: true,
});
```

**Check cookies**:
- Open DevTools → Application → Cookies
- Verify session cookie exists
- Check `SameSite` attribute

---

## Related Documentation

- **[Admin Dashboard Development Guide](./admin-dashboard-development-guide.md)** - Complete development workflow
- **[Backend Admin Guide](../../backend/admin-backend-guide.md)** - Backend API implementation
- **[Error Handling Guide](./admin-error-handling-guide.md)** - Detailed error handling patterns
- **[PrimeVue Usage Guide](../../primevue-usage.md)** - UI component integration

---

## Summary

**Key Takeaways**:

1. **Service Layer**: All API communication goes through services
2. **Response Unwrapping**: Services unwrap API responses before returning to components
3. **Error Handling**: Use `handleServiceError` for consistent error handling
4. **Request Cancellation**: Always accept `AbortSignal` parameter
5. **Type Safety**: Full TypeScript annotations for all methods
6. **Testing**: Comprehensive tests for all service methods
7. **Singleton Pattern**: Export singleton instances, not classes
8. **Pagination**: Handle both Laravel pagination styles correctly
9. **Validation Errors**: Preserve 422 errors for form components
10. **Documentation**: JSDoc comments for all public methods

**When in doubt**:
- Check existing services for patterns
- Follow the service template
- Write tests first
- Document as you code
