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
} from '@user/types/driver';
import {
  getLeagueDrivers,
  createDriver,
  getLeagueDriver,
  updateDriver as updateDriverService,
  removeDriverFromLeague,
  importDriversFromCSV,
} from '@user/services/driverService';

export const useDriverStore = defineStore('driver', () => {
  // State
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
   */
  async function fetchLeagueDrivers(
    leagueId: number,
    params?: LeagueDriversQueryParams
  ): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const queryParams: LeagueDriversQueryParams = {
        page: params?.page ?? currentPage.value,
        per_page: params?.per_page ?? perPage.value,
        search: params?.search ?? (searchQuery.value || undefined),
        status: params?.status ?? (statusFilter.value !== 'all' ? statusFilter.value : undefined),
      };

      const response: PaginatedDriversResponse = await getLeagueDrivers(leagueId, queryParams);

      drivers.value = response.data;
      currentPage.value = response.meta.current_page;
      perPage.value = response.meta.per_page;
      totalDrivers.value = response.meta.total;
      lastPage.value = response.meta.last_page;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drivers';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new driver and add to league
   * @param leagueId - League ID
   * @param data - Driver creation data
   */
  async function createNewDriver(
    leagueId: number,
    data: CreateDriverRequest
  ): Promise<LeagueDriver> {
    loading.value = true;
    error.value = null;

    try {
      const driver = await createDriver(leagueId, data);
      // Refresh the driver list to get updated pagination
      await fetchLeagueDrivers(leagueId);
      return driver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create driver';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a specific driver in a league
   * @param leagueId - League ID
   * @param driverId - Driver ID
   */
  async function fetchLeagueDriver(leagueId: number, driverId: number): Promise<LeagueDriver> {
    loading.value = true;
    error.value = null;

    try {
      const driver = await getLeagueDriver(leagueId, driverId);
      currentDriver.value = driver;
      return driver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load driver';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
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
    data: UpdateDriverRequest
  ): Promise<LeagueDriver> {
    loading.value = true;
    error.value = null;

    try {
      const updatedDriver = await updateDriverService(leagueId, driverId, data);

      // Update in local state
      // Note: driverId is the actual driver ID, so we need to find by driver_id, not id
      const index = drivers.value.findIndex((d) => d.driver_id === driverId);
      if (index !== -1) {
        drivers.value[index] = updatedDriver;
      }

      // Update current driver if it's the one being edited
      if (currentDriver.value?.driver_id === driverId) {
        currentDriver.value = updatedDriver;
      }

      return updatedDriver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update driver';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Remove a driver from league
   * @param leagueId - League ID
   * @param driverId - Driver ID
   */
  async function removeDriver(leagueId: number, driverId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await removeDriverFromLeague(leagueId, driverId);

      // Remove from local state
      // Note: driverId is the actual driver ID, so we need to filter by driver_id, not id
      drivers.value = drivers.value.filter((d) => d.driver_id !== driverId);

      // Update total count
      totalDrivers.value = Math.max(0, totalDrivers.value - 1);

      // Clear current driver if it was the one removed
      if (currentDriver.value?.driver_id === driverId) {
        currentDriver.value = null;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove driver';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Import drivers from CSV
   * @param leagueId - League ID
   * @param csvData - CSV string data
   */
  async function importCSV(leagueId: number, csvData: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await importDriversFromCSV(leagueId, csvData);

      // Refresh the driver list after import
      await fetchLeagueDrivers(leagueId);

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import drivers';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
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
   * Clear error message
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Reset store to initial state
   */
  function resetStore(): void {
    drivers.value = [];
    currentDriver.value = null;
    loading.value = false;
    error.value = null;
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
