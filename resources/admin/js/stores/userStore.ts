import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userService } from '@admin/services/userService';
import type { User, UserStatus, UserListParams, PaginatedResponse } from '@admin/types/user';
import { logger } from '@admin/utils/logger';

/**
 * User Store
 * Manages user data with server-side pagination, filtering, and search
 *
 * Persistence:
 * - Uses pinia-plugin-persistedstate to persist filter/search state
 * - Storage: sessionStorage (cleared when browser/tab closes)
 * - Persists: searchQuery, statusFilter, currentPage, rowsPerPage
 * - Does NOT persist: users array, loading states (fetched from server)
 */
export const useUserStore = defineStore(
  'user',
  () => {
    // State
    // Initialize as empty array and ensure it's never undefined
    const users = ref<User[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Filter and search state
    const searchQuery = ref('');
    const statusFilter = ref<UserStatus | 'all'>('all');

    // Pagination state
    const currentPage = ref(1);
    const rowsPerPage = ref(15);
    const totalRecords = ref(0);
    const totalPages = ref(0);

    // Pagination meta
    const paginationMeta = ref<PaginatedResponse<User> | null>(null);

    // Getters

    /**
     * Get active users only
     */
    const activeUsers = computed((): User[] => {
      return users.value?.filter((user) => user.status === 'active' && !user.deleted_at) ?? [];
    });

    /**
     * Get inactive users (includes soft-deleted)
     */
    const inactiveUsers = computed((): User[] => {
      return users.value?.filter((user) => user.status === 'inactive' || !!user.deleted_at) ?? [];
    });

    /**
     * Get suspended users
     */
    const suspendedUsers = computed((): User[] => {
      return users.value?.filter((user) => user.status === 'suspended') ?? [];
    });

    /**
     * Get total user count
     */
    const totalUsers = computed((): number => totalRecords.value);

    /**
     * Check if currently loading
     */
    const loading = computed((): boolean => isLoading.value);

    /**
     * Get current error message
     */
    const errorMessage = computed((): string | null => error.value);

    /**
     * Check if there are any users
     */
    const hasUsers = computed((): boolean => (users.value?.length ?? 0) > 0);

    /**
     * Get current filter state for API requests
     */
    const filterParams = computed((): UserListParams => {
      const params: UserListParams = {
        page: currentPage.value,
        per_page: rowsPerPage.value,
        include_deleted: true, // Always include soft-deleted users
      };

      if (searchQuery.value) {
        params.search = searchQuery.value;
      }

      if (statusFilter.value && statusFilter.value !== 'all') {
        params.status = statusFilter.value;
      }

      return params;
    });

    // Actions

    /**
     * Fetch users from API with current filters and pagination
     * @param signal - Optional AbortSignal for request cancellation
     */
    async function fetchUsers(signal?: AbortSignal): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await userService.getUsers(filterParams.value, signal);

        users.value = response.data;
        paginationMeta.value = response;
        totalRecords.value = response.total;
        totalPages.value = response.last_page;

        logger.debug('=== Users Loaded (Paginated) ===');
        logger.debug('Page:', currentPage.value, 'Per Page:', rowsPerPage.value);
        logger.debug('Total records:', totalRecords.value);
        logger.debug('Users on current page:', users.value?.length ?? 0);
        logger.debug('Search:', searchQuery.value);
        logger.debug('Status filter:', statusFilter.value);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch users';
        logger.error('Failed to fetch users:', err);
        // Re-throw to allow caller to handle if needed
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Delete (soft delete) a user
     * @param userId - User ID to delete
     * @param signal - Optional AbortSignal for request cancellation
     */
    async function deleteUser(userId: string, signal?: AbortSignal): Promise<void> {
      try {
        await userService.deleteUser(userId, signal);
        // Refresh the list after deletion
        await fetchUsers(signal);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to delete user';
        logger.error('Failed to delete user:', err);
        throw err;
      }
    }

    /**
     * Restore a soft-deleted user
     * @param userId - User ID to restore
     * @param signal - Optional AbortSignal for request cancellation
     */
    async function reactivateUser(userId: string, signal?: AbortSignal): Promise<User> {
      try {
        const restoredUser = await userService.restoreUser(userId, signal);
        // Refresh the list after restoration
        await fetchUsers(signal);
        return restoredUser;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to reactivate user';
        logger.error('Failed to reactivate user:', err);
        throw err;
      }
    }

    /**
     * Update a user
     * @param userId - User ID to update
     * @param payload - Update payload
     * @param signal - Optional AbortSignal for request cancellation
     */
    async function updateUser(
      userId: string,
      payload: Partial<User>,
      signal?: AbortSignal,
    ): Promise<User> {
      try {
        const updatedUser = await userService.updateUser(userId, payload, signal);
        // Update the user in the local list
        if (users.value) {
          const index = users.value.findIndex((u) => u.id === userId);
          if (index !== -1) {
            users.value[index] = updatedUser;
          }
        }
        return updatedUser;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to update user';
        logger.error('Failed to update user:', err);
        throw err;
      }
    }

    /**
     * Set search query and reset to first page
     * @param query - Search query string
     */
    function setSearchQuery(query: string): void {
      searchQuery.value = query;
      currentPage.value = 1; // Reset to first page on search
    }

    /**
     * Set status filter and reset to first page
     * @param status - Status to filter by
     */
    function setStatusFilter(status: UserStatus | 'all'): void {
      statusFilter.value = status;
      currentPage.value = 1; // Reset to first page on filter change
    }

    /**
     * Set current page
     * @param page - Page number (1-based)
     */
    function setPage(page: number): void {
      currentPage.value = page;
    }

    /**
     * Set rows per page and reset to first page
     * @param rows - Number of rows per page
     */
    function setRowsPerPage(rows: number): void {
      rowsPerPage.value = rows;
      currentPage.value = 1; // Reset to first page on rows per page change
    }

    /**
     * Reset all filters and pagination to defaults
     */
    function resetFilters(): void {
      searchQuery.value = '';
      statusFilter.value = 'all';
      currentPage.value = 1;
      rowsPerPage.value = 15;
    }

    /**
     * Clear all data and reset state
     */
    function clearUsers(): void {
      users.value = [];
      error.value = null;
      totalRecords.value = 0;
      totalPages.value = 0;
      paginationMeta.value = null;
    }

    /**
     * Get user by ID from current list
     * @param userId - User ID to find
     */
    function getUserById(userId: string): User | undefined {
      return users.value?.find((u) => u.id === userId);
    }

    return {
      // State
      users,
      isLoading,
      error,
      searchQuery,
      statusFilter,
      currentPage,
      rowsPerPage,
      totalRecords,
      totalPages,
      paginationMeta,

      // Getters
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      totalUsers,
      loading,
      errorMessage,
      hasUsers,
      filterParams,

      // Actions
      fetchUsers,
      deleteUser,
      reactivateUser,
      updateUser,
      setSearchQuery,
      setStatusFilter,
      setPage,
      setRowsPerPage,
      resetFilters,
      clearUsers,
      getUserById,
    };
  },
  {
    persist: {
      storage: sessionStorage,
      // Only persist filter/search state and pagination preferences
      // Do not persist users array (fetched from server)
      pick: ['searchQuery', 'statusFilter', 'currentPage', 'rowsPerPage'],
    },
  },
);
