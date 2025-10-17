# Admin Services Development Guide

This guide documents the standard patterns and best practices for developing services in the admin dashboard.

## Overview

Services are responsible for:
- Making API calls to the backend
- Unwrapping response data
- Handling errors consistently
- Returning typed data to components

## Standard Service Pattern

### Response Unwrapping

**All services must unwrap `response.data` immediately and return the actual data type, not the wrapper.**

#### Pattern 1: Single Resource with ApiResponse Wrapper

For endpoints that return `{ success: true, data: T, message?: string }`:

```typescript
async getItem(id: number): Promise<Item> {
  try {
    const response = await apiService.get<ItemResponse>(`/items/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch item');
    }

    return response.data; // Unwrap and return data
  } catch (error) {
    handleServiceError(error);
  }
}
```

**Type Definition:**
```typescript
export interface ItemResponse {
  success: boolean;
  data: Item;
  message?: string;
}
```

#### Pattern 2: List with ApiResponse Wrapper

For endpoints that return `{ success: true, data: T[], message?: string }`:

```typescript
async getItems(params?: FilterParams): Promise<Item[]> {
  try {
    const response = await apiService.get<ItemListResponse>('/items', {
      params,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch items');
    }

    return response.data; // Return unwrapped array
  } catch (error) {
    handleServiceError(error);
  }
}
```

**Type Definition:**
```typescript
export interface ItemListResponse {
  success: boolean;
  data: Item[];
  message?: string;
}
```

#### Pattern 3: Pagination Response (Direct Structure)

For paginated endpoints that return `{ data: T[], meta: {...}, links: {...} }`:

```typescript
async getPaginatedItems(page: number = 1, perPage: number = 15): Promise<PaginatedItemResponse> {
  try {
    const response = await apiService.get<PaginatedItemResponse>('/items', {
      params: { page, per_page: perPage },
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Failed to fetch items');
    }

    return response; // Return full pagination structure
  } catch (error) {
    handleServiceError(error);
  }
}
```

**Type Definition:**
```typescript
export interface PaginatedItemResponse {
  data: Item[];
  meta: PaginationMeta;
  links: PaginationLinks;
}
```

#### Pattern 4: Nested ApiResponse with Pagination

For paginated endpoints wrapped in ApiResponse `{ success: true, data: { current_page, data: T[], ... } }`:

```typescript
async getUsers(params?: UserListParams): Promise<PaginatedResponse<User>> {
  try {
    const response = await apiService.get<ApiResponse<PaginatedResponse<User>>>('/users', {
      params,
    });

    // Unwrap ApiResponse and return paginated data
    if (response.success && response.data) {
      return response.data;
    }

    // Return empty paginated structure
    return {
      current_page: 1,
      data: [],
      // ... other required pagination fields
    };
  } catch (error) {
    handleServiceError(error);
  }
}
```

**Type Definition:**
```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

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

#### Pattern 5: Custom Response Structures

For authentication or other custom endpoints:

```typescript
async login(credentials: LoginCredentials): Promise<Admin> {
  try {
    await apiService.get('/csrf-cookie');

    const response = await apiService.post<LoginResponse>('/login', credentials);

    if (!response.success || !response.admin) {
      throw new Error(response.message || 'Login failed');
    }

    return response.admin; // Return the admin object
  } catch (error) {
    handleServiceError(error);
  }
}
```

**Type Definition:**
```typescript
export interface LoginResponse {
  success: boolean;
  admin: Admin;
  message?: string;
}
```

#### Pattern 6: Void Operations (Delete, Logout)

For operations that don't return data:

```typescript
async deleteItem(id: number): Promise<void> {
  try {
    const response = await apiService.delete<DeleteResponse>(`/items/${id}`);

    // Check if deletion explicitly failed
    if (response && response.success === false) {
      throw new Error(response.message || 'Failed to delete item');
    }

    // Success - no return value needed
    return;
  } catch (error) {
    handleServiceError(error);
  }
}
```

**Type Definition:**
```typescript
export interface DeleteResponse {
  success: boolean;
  message?: string;
}
```

### Error Handling

**Always use `handleServiceError` from `@admin/utils/errorHandler`:**

```typescript
import { handleServiceError } from '@admin/utils/errorHandler';

try {
  // API call
} catch (error) {
  handleServiceError(error);
}
```

**The error handler:**
- Preserves validation errors (422) for form handling
- Converts other API errors to `ApplicationError` with message and status
- Re-throws generic `Error` objects
- Wraps unknown errors in `ApplicationError`

**Never returns** - always throws, so TypeScript knows the function never completes normally.

### Service Class Structure

```typescript
import { apiService } from './api';
import type { Item, ItemResponse, ItemListResponse } from '@admin/types/item';
import { handleServiceError } from '@admin/utils/errorHandler';

/**
 * Item Service
 * Handles CRUD operations for items
 */
class ItemService {
  /**
   * Get all items
   */
  async getAllItems(): Promise<Item[]> {
    try {
      const response = await apiService.get<ItemListResponse>('/items');

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch items');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get a single item by ID
   */
  async getItem(id: number): Promise<Item> {
    try {
      const response = await apiService.get<ItemResponse>(`/items/${id}`);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch item');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Create a new item
   */
  async createItem(data: CreateItemData): Promise<Item> {
    try {
      const response = await apiService.post<ItemResponse>('/items', data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create item');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Update an item
   */
  async updateItem(id: number, data: UpdateItemData): Promise<Item> {
    try {
      const response = await apiService.put<ItemResponse>(`/items/${id}`, data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update item');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(id: number): Promise<void> {
    try {
      const response = await apiService.delete<DeleteResponse>(`/items/${id}`);

      if (response && response.success === false) {
        throw new Error(response.message || 'Failed to delete item');
      }

      return;
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export a singleton instance
export const itemService = new ItemService();
export default itemService;
```

## Testing Services

### Standard Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { itemService } from '../itemService';
import { apiService } from '../api';
import type { Item, ItemResponse, ItemListResponse } from '@admin/types/item';

// Mock the apiService
vi.mock('../api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ItemService', () => {
  const mockItem: Item = {
    id: 1,
    name: 'Test Item',
    created_at: '2025-10-14T12:00:00.000000Z',
    updated_at: '2025-10-14T12:00:00.000000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getItem', () => {
    it('should fetch single item successfully', async () => {
      const mockResponse: ItemResponse = {
        success: true,
        data: mockItem,
      };

      vi.mocked(apiService.get).mockResolvedValueOnce(mockResponse);

      const result = await itemService.getItem(1);

      expect(apiService.get).toHaveBeenCalledWith('/items/1');
      expect(result).toEqual(mockItem); // Test unwrapped data
    });

    it('should throw error when response is unsuccessful', async () => {
      const mockResponse: ItemResponse = {
        success: false,
        data: null as any,
        message: 'Item not found',
      };

      vi.mocked(apiService.get).mockResolvedValueOnce(mockResponse);

      await expect(itemService.getItem(999)).rejects.toThrow('Item not found');
    });
  });
});
```

### Mock Response Pattern

**Always use the full response structure in mocks:**

```typescript
// ✅ CORRECT - Full response structure
const mockResponse: ItemResponse = {
  success: true,
  data: mockItem,
  message: 'Success',
};
vi.mocked(apiService.get).mockResolvedValueOnce(mockResponse);

// ❌ WRONG - Direct data return
vi.mocked(apiService.get).mockResolvedValueOnce(mockItem);
```

## Key Principles

1. **Unwrap Immediately**: Services unwrap response data and return the actual type
2. **Type Safety**: Use proper TypeScript types for all responses
3. **Consistent Errors**: Always use `handleServiceError` for error handling
4. **Validate Responses**: Check `success` flag and data existence before returning
5. **Document Methods**: Add JSDoc comments explaining what each method does
6. **Singleton Pattern**: Export a single instance for consistency

## Common Mistakes to Avoid

### ❌ Returning Wrapped Response

```typescript
// WRONG - Returns the wrapper
async getItem(id: number): Promise<ItemResponse> {
  const response = await apiService.get<ItemResponse>(`/items/${id}`);
  return response; // Returns { success, data, message }
}
```

### ✅ Returning Unwrapped Data

```typescript
// CORRECT - Returns the data
async getItem(id: number): Promise<Item> {
  const response = await apiService.get<ItemResponse>(`/items/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to fetch item');
  }

  return response.data; // Returns just the Item
}
```

### ❌ Inconsistent Error Handling

```typescript
// WRONG - Manually handling errors
catch (error: any) {
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  throw error;
}
```

### ✅ Using Standard Error Handler

```typescript
// CORRECT - Use handleServiceError
catch (error) {
  handleServiceError(error);
}
```

### ❌ Missing Response Validation

```typescript
// WRONG - No validation
async getItem(id: number): Promise<Item> {
  const response = await apiService.get<ItemResponse>(`/items/${id}`);
  return response.data; // Could be undefined!
}
```

### ✅ Validating Before Returning

```typescript
// CORRECT - Validate success and data
async getItem(id: number): Promise<Item> {
  const response = await apiService.get<ItemResponse>(`/items/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to fetch item');
  }

  return response.data;
}
```

## Migration Checklist

When standardizing an existing service:

- [ ] Identify the actual response structure from the backend
- [ ] Create proper TypeScript interfaces for responses
- [ ] Update service methods to unwrap `response.data`
- [ ] Change return types from wrapper types to actual data types
- [ ] Validate responses before returning data
- [ ] Use `handleServiceError` for all error handling
- [ ] Update tests to mock full response structures
- [ ] Update test assertions to expect unwrapped data
- [ ] Verify all tests pass
- [ ] Update component usage if necessary

## Questions?

If you're unsure about a pattern:
1. Check existing services: `adminUserService`, `authService`, `userService`
2. Review this guide
3. Look at test examples in `__tests__` directories
