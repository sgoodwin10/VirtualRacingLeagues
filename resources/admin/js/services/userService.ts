import { apiService } from './api';
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UserListParams,
  PaginatedResponse,
  ApiResponse,
} from '@admin/types/user';
import { handleServiceError } from '@admin/utils/errorHandler';

/**
 * User Service
 * Handles user management operations
 */
class UserService {
  /**
   * Get all users
   * Backend returns paginated results wrapped in ApiResponse
   * @param params - Optional filters for user list
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<User[]>
   */
  async getAllUsers(params?: UserListParams, signal?: AbortSignal): Promise<User[]> {
    try {
      const response = await apiService.get<ApiResponse<PaginatedResponse<User>>>('/users', {
        params,
        signal,
      });
      // Extract user data from paginated response
      if (response.success && response.data?.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get users with pagination
   * @param params - Optional filters for user list
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<PaginatedResponse<User>>
   */
  async getUsers(params?: UserListParams, signal?: AbortSignal): Promise<PaginatedResponse<User>> {
    try {
      // Backend returns: { success: true, data: [...users], meta: {...pagination} }
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
      }>('/users', {
        params,
        signal,
      });

      // Transform backend response into PaginatedResponse format
      if (response.success && response.data) {
        return {
          current_page: response.meta.current_page,
          data: response.data, // Users array from response.data
          first_page_url: `${response.meta.path}?page=1`,
          from: response.meta.from,
          last_page: response.meta.last_page,
          last_page_url: `${response.meta.path}?page=${response.meta.last_page}`,
          links: [], // Backend doesn't provide links, can be computed if needed
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

      // Return empty paginated response if no data
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

  /**
   * Get a single user by ID
   * @param id - User ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<User>
   */
  async getUser(id: string, signal?: AbortSignal): Promise<User> {
    try {
      const response = await apiService.get<ApiResponse<{ user: User; activities: unknown[] }>>(
        `/users/${id}`,
        { signal }
      );
      // Return the user from the response
      if (response.success && response.data?.user) {
        return response.data.user;
      }
      throw new Error('Failed to fetch user');
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Create a new user
   * @param payload - User data to create
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<User>
   */
  async createUser(payload: CreateUserPayload, signal?: AbortSignal): Promise<User> {
    try {
      const response = await apiService.post<ApiResponse<User>>('/users', payload, { signal });
      // Return the created user from the response
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to create user');
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Update a user
   * @param id - User ID
   * @param payload - Updated user data
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<User>
   */
  async updateUser(id: string, payload: UpdateUserPayload, signal?: AbortSignal): Promise<User> {
    try {
      const response = await apiService.put<ApiResponse<User>>(`/users/${id}`, payload, { signal });
      // Return the updated user from the response
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to update user');
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Delete (deactivate) a user
   * @param id - User ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async deleteUser(id: string, signal?: AbortSignal): Promise<void> {
    try {
      await apiService.delete<ApiResponse<null>>(`/users/${id}`, { signal });
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Restore a deactivated user
   * @param id - User ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<User>
   */
  async restoreUser(id: string, signal?: AbortSignal): Promise<User> {
    try {
      const response = await apiService.post<ApiResponse<User>>(
        `/users/${id}/restore`,
        {},
        { signal }
      );
      // Return the restored user from the response
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to restore user');
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Manually verify a user's email
   * @param id - User ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<User>
   */
  async verifyEmail(id: string, signal?: AbortSignal): Promise<User> {
    try {
      const response = await apiService.patch<ApiResponse<User>>(
        `/users/${id}/verify-email`,
        {},
        { signal }
      );
      // Return the updated user from the response
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to verify email');
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Resend verification email to a user
   * @param id - User ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async resendVerification(id: string, signal?: AbortSignal): Promise<void> {
    try {
      await apiService.post<ApiResponse<null>>(`/users/${id}/resend-verification`, {}, { signal });
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Login as a user (admin impersonation)
   * @param id - User ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<{ token: string }>
   */
  async loginAsUser(id: string, signal?: AbortSignal): Promise<{ token: string }> {
    try {
      const response = await apiService.post<ApiResponse<{ token: string }>>(
        `/users/${id}/login-as`,
        {},
        { signal }
      );
      // Return the token from the response
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to get login token');
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
