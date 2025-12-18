/**
 * Driver Store
 * Manages driver-related state for league driver management
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  LeagueDriver,
  CreateDriverRequest,
  UpdateDriverRequest,
  DriverStatus,
  PaginatedDriversResponse,
  LeagueDriversQueryParams,
  DriverStats,
} from '@app/types/driver';
import {
  getLeagueDrivers,
  createDriver,
  getLeagueDriver,
  updateDriver as updateDriverService,
  removeDriverFromLeague,
  importDriversFromCSV,
} from '@app/services/driverService';
import { useCrudStore } from '@app/composables/useCrudStore';

/**
 * Note on ID fields in LeagueDriver:
 * - driver_id: The actual driver ID (used for all API operations)
 * - id: The league_driver pivot table record ID (not used for API calls)
 * - league_id: The league ID
 *
 * Always use driver_id when making API calls or finding/filtering drivers.
 */
export const useDriverStore = defineStore('driver', () => {
  // Use CRUD composable
  const crud = useCrudStore<LeagueDriver>();
  const {
    items: drivers,
    currentItem: currentDriver,
    loading,
    error,
    setLoading,
    setError,
    setItems,
    setCurrentItem,
    clearError,
    resetStore: resetCrudStore,
  } = crud;

  // Pagination state
  const currentPage = ref(1);
  const perPage = ref(15);
  const totalDrivers = ref(0);
  const lastPage = ref(1);

  // Filter state
  const searchQuery = ref('');
  const statusFilter = ref<DriverStatus | 'all'>('all');

  // Getters
  const activeDrivers = computed(() => {
    return drivers.value?.filter((driver) => driver.status === 'active') ?? [];
  });

  const inactiveDrivers = computed(() => {
    return drivers.value?.filter((driver) => driver.status === 'inactive') ?? [];
  });

  const bannedDrivers = computed(() => {
    return drivers.value?.filter((driver) => driver.status === 'banned') ?? [];
  });

  const driverStats = computed((): DriverStats => {
    return {
      total: totalDrivers.value,
      active: activeDrivers.value.length,
      inactive: inactiveDrivers.value.length,
      banned: bannedDrivers.value.length,
    };
  });

  const hasNextPage = computed(() => {
    return currentPage.value < lastPage.value;
  });

  const hasPreviousPage = computed(() => {
    return currentPage.value > 1;
  });

  // Actions

  /**
   * Fetch drivers for a specific league
   * @param leagueId - League ID
   * @param params - Optional query parameters
   * @param signal - Optional AbortSignal for request cancellation
   */
  async function fetchLeagueDrivers(
    leagueId: number,
    params?: LeagueDriversQueryParams,
    signal?: AbortSignal,
  ): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const queryParams: LeagueDriversQueryParams = {
        page: params?.page ?? currentPage.value,
        per_page: params?.per_page ?? perPage.value,
        search: params?.search ?? (searchQuery.value || undefined),
        status: params?.status ?? (statusFilter.value !== 'all' ? statusFilter.value : undefined),
      };

      const response: PaginatedDriversResponse = await getLeagueDrivers(
        leagueId,
        queryParams,
        signal,
      );

      setItems(response.data);
      currentPage.value = response.meta.current_page;
      perPage.value = response.meta.per_page;
      totalDrivers.value = response.meta.total;
      lastPage.value = response.meta.last_page;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drivers';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new driver and add to league
   * @param leagueId - League ID
   * @param data - Driver creation data
   */
  async function createNewDriver(
    leagueId: number,
    data: CreateDriverRequest,
  ): Promise<LeagueDriver> {
    setLoading(true);
    setError(null);

    try {
      const driver = await createDriver(leagueId, data);

      // Optimistic update: Add to local state
      drivers.value.push(driver);
      totalDrivers.value += 1;
      lastPage.value = Math.ceil(totalDrivers.value / perPage.value);

      return driver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create driver';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch a specific driver in a league
   * @param leagueId - League ID
   * @param driverId - Driver ID
   */
  async function fetchLeagueDriver(leagueId: number, driverId: number): Promise<LeagueDriver> {
    setLoading(true);
    setError(null);

    try {
      const driver = await getLeagueDriver(leagueId, driverId);
      setCurrentItem(driver);
      return driver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load driver';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update driver and league-specific settings
   * @param leagueId - League ID
   * @param driverId - Driver ID
   * @param data - Update data (both driver fields and league settings)
   */
  async function updateDriver(
    leagueId: number,
    driverId: number,
    data: UpdateDriverRequest,
  ): Promise<LeagueDriver> {
    setLoading(true);
    setError(null);

    try {
      const updatedDriver = await updateDriverService(leagueId, driverId, data);

      // Update in local state (use driver_id for matching)
      const index = drivers.value.findIndex((d) => d.driver_id === driverId);
      if (index !== -1) {
        drivers.value[index] = updatedDriver;
      }

      // Update current driver if it's the one being edited
      if (currentDriver.value?.driver_id === driverId) {
        setCurrentItem(updatedDriver);
      }

      return updatedDriver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update driver';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Remove a driver from league
   * @param leagueId - League ID
   * @param driverId - Driver ID
   */
  async function removeDriver(leagueId: number, driverId: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      await removeDriverFromLeague(leagueId, driverId);

      // Remove from local state
      // Note: driverId is the actual driver ID, so we need to filter by driver_id, not id
      drivers.value = drivers.value.filter((d) => d.driver_id !== driverId);

      // Update total count
      totalDrivers.value = Math.max(0, totalDrivers.value - 1);

      // Clear current driver if it was the one removed
      if (currentDriver.value?.driver_id === driverId) {
        setCurrentItem(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove driver';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Import drivers from CSV
   * @param leagueId - League ID
   * @param csvData - CSV string data
   */
  async function importCSV(leagueId: number, csvData: string) {
    setLoading(true);
    setError(null);

    try {
      const result = await importDriversFromCSV(leagueId, csvData);

      // Note: CSV import can add many drivers at once and may affect pagination/filters
      // For this case, a full refetch is justified to ensure proper pagination state
      await fetchLeagueDrivers(leagueId);

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import drivers';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Set search query and reset to first page
   * @param query - Search query string
   */
  function setSearchQuery(query: string): void {
    searchQuery.value = query;
    currentPage.value = 1;
  }

  /**
   * Set status filter and reset to first page
   * @param status - Status filter
   */
  function setStatusFilter(status: DriverStatus | 'all'): void {
    statusFilter.value = status;
    currentPage.value = 1;
  }

  /**
   * Go to next page
   */
  function nextPage(): void {
    if (hasNextPage.value) {
      currentPage.value += 1;
    }
  }

  /**
   * Go to previous page
   */
  function previousPage(): void {
    if (hasPreviousPage.value) {
      currentPage.value -= 1;
    }
  }

  /**
   * Go to specific page
   * @param page - Page number
   */
  function goToPage(page: number): void {
    if (page >= 1 && page <= lastPage.value) {
      currentPage.value = page;
    }
  }

  /**
   * Reset filters to defaults
   */
  function resetFilters(): void {
    searchQuery.value = '';
    statusFilter.value = 'all';
    currentPage.value = 1;
  }

  /**
   * Reset store to initial state
   */
  function resetStore(): void {
    resetCrudStore();
    currentPage.value = 1;
    perPage.value = 15;
    totalDrivers.value = 0;
    lastPage.value = 1;
    searchQuery.value = '';
    statusFilter.value = 'all';
  }

  return {
    // State
    drivers,
    currentDriver,
    loading,
    error,
    currentPage,
    perPage,
    totalDrivers,
    lastPage,
    searchQuery,
    statusFilter,

    // Getters
    activeDrivers,
    inactiveDrivers,
    bannedDrivers,
    driverStats,
    hasNextPage,
    hasPreviousPage,

    // Actions
    fetchLeagueDrivers,
    createNewDriver,
    fetchLeagueDriver,
    updateDriver,
    removeDriver,
    importCSV,
    setSearchQuery,
    setStatusFilter,
    nextPage,
    previousPage,
    goToPage,
    resetFilters,
    clearError,
    resetStore,
  };
});
