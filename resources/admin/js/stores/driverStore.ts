import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { driverService } from '@admin/services/driverService';
import type { Driver, DriverListParams, PaginatedDriverResponse } from '@admin/types/driver';
import { logger } from '@admin/utils/logger';

/**
 * Driver Store
 * Manages driver data with server-side pagination, filtering, and search
 *
 * Persistence:
 * - Uses pinia-plugin-persistedstate to persist filter/search state
 * - Storage: sessionStorage (cleared when browser/tab closes)
 * - Persists: searchQuery, statusFilter, currentPage, rowsPerPage, sortBy, sortDirection
 * - Does NOT persist: drivers array, loading states (fetched from server)
 */
export const useDriverStore = defineStore(
  'driver',
  () => {
    // State
    const drivers = ref<Driver[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Filter and search state
    const searchQuery = ref('');

    // Sorting state
    const sortBy = ref<
      'created_at' | 'updated_at' | 'first_name' | 'last_name' | 'nickname' | 'email'
    >('created_at');
    const sortDirection = ref<'asc' | 'desc'>('desc');

    // Pagination state
    const currentPage = ref(1);
    const rowsPerPage = ref(15);
    const totalRecords = ref(0);
    const totalPages = ref(0);

    // Pagination meta
    const paginationMeta = ref<PaginatedDriverResponse | null>(null);

    // Getters

    /**
     * Get active drivers only (not deleted)
     */
    const activeDrivers = computed((): Driver[] => {
      return drivers.value?.filter((driver) => !driver.deleted_at) ?? [];
    });

    /**
     * Get deleted drivers
     */
    const deletedDrivers = computed((): Driver[] => {
      return drivers.value?.filter((driver) => !!driver.deleted_at) ?? [];
    });

    /**
     * Get total driver count
     */
    const totalDrivers = computed((): number => totalRecords.value);

    /**
     * Check if currently loading
     */
    const loading = computed((): boolean => isLoading.value);

    /**
     * Get current error message
     */
    const errorMessage = computed((): string | null => error.value);

    /**
     * Check if there are any drivers
     */
    const hasDrivers = computed((): boolean => (drivers.value?.length ?? 0) > 0);

    /**
     * Get current filter state for API requests
     */
    const filterParams = computed((): DriverListParams => {
      const params: DriverListParams = {
        page: currentPage.value,
        per_page: rowsPerPage.value,
        order_by: sortBy.value,
        order_direction: sortDirection.value,
      };

      if (searchQuery.value) {
        params.search = searchQuery.value;
      }

      return params;
    });

    // Actions

    /**
     * Fetch drivers from API with current filters and pagination
     * @param signal - Optional AbortSignal for request cancellation
     */
    async function fetchDrivers(signal?: AbortSignal): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await driverService.getDrivers(filterParams.value, signal);

        drivers.value = response.data;
        paginationMeta.value = response;
        totalRecords.value = response.total;
        totalPages.value = response.last_page;

        logger.debug('=== Drivers Loaded (Paginated) ===');
        logger.debug('Page:', currentPage.value, 'Per Page:', rowsPerPage.value);
        logger.debug('Total records:', totalRecords.value);
        logger.debug('Drivers on current page:', drivers.value?.length ?? 0);
        logger.debug('Search:', searchQuery.value);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch drivers';
        logger.error('Failed to fetch drivers:', err);
        // Re-throw to allow caller to handle if needed
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Delete a driver
     * @param driverId - Driver ID to delete
     * @param signal - Optional AbortSignal for request cancellation
     */
    async function deleteDriver(driverId: number, signal?: AbortSignal): Promise<void> {
      try {
        await driverService.deleteDriver(driverId, signal);

        // If we're deleting the last item on the current page (and not on page 1),
        // move to the previous page before refetching
        if (drivers.value.length === 1 && currentPage.value > 1) {
          currentPage.value = currentPage.value - 1;
        }

        // Refresh the list after deletion (uses current filterParams which includes currentPage)
        await fetchDrivers(signal);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to delete driver';
        logger.error('Failed to delete driver:', err);
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
     * Set sorting and reset to first page
     * @param field - Field to sort by
     * @param direction - Sort direction
     */
    function setSorting(
      field: 'created_at' | 'updated_at' | 'first_name' | 'last_name' | 'nickname' | 'email',
      direction: 'asc' | 'desc',
    ): void {
      sortBy.value = field;
      sortDirection.value = direction;
      currentPage.value = 1; // Reset to first page on sort change
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
      sortBy.value = 'created_at';
      sortDirection.value = 'desc';
      currentPage.value = 1;
      rowsPerPage.value = 15;
    }

    /**
     * Clear all data and reset state
     */
    function clearDrivers(): void {
      drivers.value = [];
      error.value = null;
      totalRecords.value = 0;
      totalPages.value = 0;
      paginationMeta.value = null;
    }

    /**
     * Get driver by ID from current list
     * @param driverId - Driver ID to find
     */
    function getDriverById(driverId: number): Driver | undefined {
      return drivers.value?.find((d) => d.id === driverId);
    }

    return {
      // State
      drivers,
      isLoading,
      error,
      searchQuery,
      sortBy,
      sortDirection,
      currentPage,
      rowsPerPage,
      totalRecords,
      totalPages,
      paginationMeta,

      // Getters
      activeDrivers,
      deletedDrivers,
      totalDrivers,
      loading,
      errorMessage,
      hasDrivers,
      filterParams,

      // Actions
      fetchDrivers,
      deleteDriver,
      setSearchQuery,
      setSorting,
      setPage,
      setRowsPerPage,
      resetFilters,
      clearDrivers,
      getDriverById,
    };
  },
  {
    persist: {
      storage: sessionStorage,
      // Only persist filter/search state and pagination preferences
      // Do not persist drivers array (fetched from server)
      pick: ['searchQuery', 'sortBy', 'sortDirection', 'currentPage', 'rowsPerPage'],
    },
  },
);
