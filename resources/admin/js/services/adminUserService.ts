import { apiService } from './api';
import type {
  Admin,
  AdminUserListResponse,
  AdminUserResponse,
  AdminUserUpdateData,
  DeleteAdminUserResponse,
  AdminStatus,
} from '@admin/types/admin';
import { logger } from '@admin/utils/logger';
import { handleServiceError } from '@admin/utils/errorHandler';

/**
 * Parameters for filtering and searching admin users
 */
export interface AdminUserFilterParams {
  /** Search query (searches name, email) */
  search?: string;
  /** Filter by status */
  status?: AdminStatus;
  /** Filter by role */
  role?: string;
  /** Include soft-deleted users */
  include_deleted?: boolean;
  /** Sort field */
  sort_field?: string;
  /** Sort direction */
  sort_order?: 'asc' | 'desc';
}

/**
 * Admin User Service
 * Handles CRUD operations for admin users
 */
class AdminUserService {
  /**
   * Get paginated admin users with optional filtering and search
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 15)
   * @param filters - Optional filter parameters for search and filtering
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Paginated admin user response with data, meta, and links
   */
  async getAdminUsers(
    page: number = 1,
    perPage: number = 15,
    filters?: AdminUserFilterParams,
    signal?: AbortSignal,
  ): Promise<AdminUserListResponse> {
    try {
      // Build query parameters
      const params: Record<string, string | number | boolean> = {
        page,
        per_page: perPage,
      };

      // Add filter parameters if provided
      if (filters?.search) {
        params.search = filters.search;
      }
      if (filters?.status) {
        params.status = filters.status;
      }
      if (filters?.role) {
        params.role = filters.role;
      }
      if (filters?.include_deleted !== undefined) {
        params.include_deleted = filters.include_deleted;
      }
      if (filters?.sort_field) {
        params.sort_field = filters.sort_field;
      }
      if (filters?.sort_order) {
        params.sort_order = filters.sort_order;
      }

      const response = await apiService.get<AdminUserListResponse>('/admins', {
        params,
        signal,
      });

      logger.debug('=== Admin User Service - Paginated Response ===');
      logger.debug('Page:', page, 'Per Page:', perPage);
      logger.debug('Filters:', filters);
      logger.debug('Response structure:', {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        dataLength: response.data?.length,
        hasMeta: !!response.meta,
        hasLinks: !!response.links,
      });
      logger.debug('Meta info:', response.meta);
      logger.debug('Links info:', response.links);

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Failed to fetch admin users');
      }

      return response;
    } catch (error) {
      logger.error('Admin User Service Error:', error);
      handleServiceError(error);
    }
  }

  /**
   * Get all admin users (optimized with automatic pagination)
   * Fetches all pages automatically using proper pagination
   *
   * Performance considerations:
   * - Uses per_page=100 to minimize API calls
   * - Automatically fetches subsequent pages until all data is retrieved
   * - For very large datasets (>1000 users), consider using getAdminUsers() with manual pagination
   * - Memory safety: Warns and stops if total exceeds 5000 records
   *
   * @param filters - Optional filter parameters
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Array of all admin users matching the filters
   * @throws Error if dataset exceeds memory threshold (5000 records)
   */
  async getAllAdminUsers(filters?: AdminUserFilterParams, signal?: AbortSignal): Promise<Admin[]> {
    try {
      const allAdmins: Admin[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const perPage = 100; // Fetch 100 records per request to minimize API calls
      const MEMORY_THRESHOLD = 5000; // Maximum records to prevent memory exhaustion

      while (hasMorePages) {
        // Check if request was aborted
        if (signal?.aborted) {
          throw new Error('Request aborted');
        }

        const response = await this.getAdminUsers(currentPage, perPage, filters, signal);

        // Memory safety check: Warn if total exceeds threshold
        if (response.meta.total > MEMORY_THRESHOLD) {
          const errorMessage = `Dataset too large: ${response.meta.total} records exceed memory threshold of ${MEMORY_THRESHOLD}. Use getAdminUsers() with manual pagination instead.`;
          logger.error(errorMessage);
          throw new Error(errorMessage);
        }

        allAdmins.push(...response.data);

        // Check if there are more pages
        hasMorePages = currentPage < response.meta.last_page;
        currentPage++;

        logger.debug('Fetched page', currentPage - 1, 'of', response.meta.last_page);
      }

      logger.debug('Total admin users fetched:', allAdmins.length);

      return allAdmins;
    } catch (error) {
      logger.error('Admin User Service Error:', error);
      handleServiceError(error);
    }
  }

  /**
   * Get a single admin user by ID
   * @param id - Admin user ID
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getAdminUser(id: number, signal?: AbortSignal): Promise<Admin> {
    try {
      const response = await apiService.get<AdminUserResponse>(`/admins/${id}`, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch admin user');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Create a new admin user
   * @param data - Admin user data
   * @param signal - Optional AbortSignal for request cancellation
   */
  async createAdminUser(data: AdminUserUpdateData, signal?: AbortSignal): Promise<Admin> {
    try {
      const response = await apiService.post<AdminUserResponse>('/admins', data, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create admin user');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Update an admin user
   * @param id - Admin user ID
   * @param data - Updated admin user data
   * @param signal - Optional AbortSignal for request cancellation
   */
  async updateAdminUser(
    id: number,
    data: AdminUserUpdateData,
    signal?: AbortSignal,
  ): Promise<Admin> {
    try {
      const response = await apiService.put<AdminUserResponse>(`/admins/${id}`, data, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update admin user');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Delete (soft delete) an admin user
   * @param id - Admin user ID
   * @param signal - Optional AbortSignal for request cancellation
   */
  async deleteAdminUser(id: number, signal?: AbortSignal): Promise<void> {
    try {
      const response = await apiService.delete<DeleteAdminUserResponse>(`/admins/${id}`, {
        signal,
      });

      // The API returns { success: true, message: '...' } on successful deletion
      // If success is explicitly false, throw an error
      if (response && response.success === false) {
        throw new Error(response.message || 'Failed to delete admin user');
      }

      // If we get here, the deletion was successful (no need to return anything)
      return;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Restore a soft-deleted admin user
   * @param id - Admin user ID
   * @param signal - Optional AbortSignal for request cancellation
   */
  async restoreAdminUser(id: number, signal?: AbortSignal): Promise<Admin> {
    try {
      const response = await apiService.post<AdminUserResponse>(
        `/admins/${id}/restore`,
        {},
        { signal },
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to restore admin user');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export a singleton instance
export const adminUserService = new AdminUserService();
export default adminUserService;
