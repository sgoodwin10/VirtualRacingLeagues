/**
 * Season-Driver Store
 * Manages season-driver assignment state and operations
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  SeasonDriver,
  AddDriverToSeasonRequest,
  UpdateSeasonDriverRequest,
  SeasonDriverQueryParams,
  SeasonDriverStatus,
  SeasonDriverStats,
  PaginatedSeasonDriversResponse,
  AvailableDriver,
} from '@app/types/seasonDriver';
import type { LeagueDriversQueryParams } from '@app/types/driver';
import {
  getSeasonDrivers,
  getAvailableDrivers,
  addDriverToSeason,
  updateSeasonDriver,
  removeDriverFromSeason,
  getSeasonDriverStats,
} from '@app/services/seasonDriverService';

export const useSeasonDriverStore = defineStore('seasonDriver', () => {
  // State
  const seasonDrivers = ref<SeasonDriver[]>([]);
  const availableDrivers = ref<AvailableDriver[]>([]);
  const loading = ref(false);
  const loadingAvailable = ref(false);
  const error = ref<string | null>(null);
  const stats = ref<SeasonDriverStats>({
    total: 0,
    active: 0,
    reserve: 0,
    withdrawn: 0,
    unassigned_to_division: 0,
    unassigned_to_team: 0,
  });

  // Pagination for season drivers
  const currentPage = ref(1);
  const perPage = ref(25);
  const totalDrivers = ref(0);
  const lastPage = ref(1);

  // Pagination for available drivers
  const availablePage = ref(1);
  const availablePerPage = ref(10);
  const totalAvailable = ref(0);
  const availableLastPage = ref(1);

  // Filters
  const searchQuery = ref('');
  const statusFilter = ref<SeasonDriverStatus | 'all'>('all');
  const availableSearchQuery = ref('');
  const divisionFilter = ref<number | null>(null);
  const teamFilter = ref<number | null>(null);

  // Sorting
  const sortField = ref<string>('driver_name');
  const sortOrder = ref<'asc' | 'desc'>('asc');

  // Getters
  const activeDrivers = computed(() => seasonDrivers.value.filter((sd) => sd.status === 'active'));

  const reserveDrivers = computed(() =>
    seasonDrivers.value.filter((sd) => sd.status === 'reserve'),
  );

  const withdrawnDrivers = computed(() =>
    seasonDrivers.value.filter((sd) => sd.status === 'withdrawn'),
  );

  const driverCount = computed(() => seasonDrivers.value.length);

  const hasDrivers = computed(() => seasonDrivers.value.length > 0);

  const hasNextPage = computed(() => currentPage.value < lastPage.value);
  const hasPreviousPage = computed(() => currentPage.value > 1);

  const hasNextAvailablePage = computed(() => availablePage.value < availableLastPage.value);
  const hasPreviousAvailablePage = computed(() => availablePage.value > 1);

  // Actions

  /**
   * Fetch all season-driver assignments for a season
   */
  async function fetchSeasonDrivers(
    seasonId: number,
    params?: SeasonDriverQueryParams,
  ): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const queryParams: SeasonDriverQueryParams = {
        page: params?.page || currentPage.value,
        per_page: params?.per_page || perPage.value,
        search: params?.search || searchQuery.value || undefined,
        status: params?.status || (statusFilter.value !== 'all' ? statusFilter.value : undefined),
        division_id:
          params?.division_id !== undefined
            ? params.division_id
            : divisionFilter.value || undefined,
        team_id: params?.team_id !== undefined ? params.team_id : teamFilter.value || undefined,
        order_by: params?.order_by || sortField.value || undefined,
        order_direction: params?.order_direction || sortOrder.value || undefined,
      };

      const response: PaginatedSeasonDriversResponse = await getSeasonDrivers(
        seasonId,
        queryParams,
      );

      seasonDrivers.value = response.data;
      currentPage.value = response.meta.current_page;
      perPage.value = response.meta.per_page;
      totalDrivers.value = response.meta.total;
      lastPage.value = response.meta.last_page;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load season drivers';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch available league drivers (not in season)
   */
  async function fetchAvailableDrivers(
    seasonId: number,
    leagueId: number,
    params?: LeagueDriversQueryParams,
  ): Promise<void> {
    loadingAvailable.value = true;
    error.value = null;

    try {
      const queryParams: LeagueDriversQueryParams = {
        page: params?.page || availablePage.value,
        per_page: params?.per_page || availablePerPage.value,
        search: params?.search || availableSearchQuery.value || undefined,
      };

      const response = await getAvailableDrivers(seasonId, leagueId, queryParams);

      availableDrivers.value = response.data;
      availablePage.value = response.meta.current_page;
      availablePerPage.value = response.meta.per_page;
      totalAvailable.value = response.meta.total;
      availableLastPage.value = response.meta.last_page;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load available drivers';
      error.value = errorMessage;
      throw err;
    } finally {
      loadingAvailable.value = false;
    }
  }

  /**
   * Fetch season-driver statistics
   */
  async function fetchStats(seasonId: number): Promise<void> {
    try {
      stats.value = await getSeasonDriverStats(seasonId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load driver stats';
      error.value = errorMessage;
      throw err;
    }
  }

  /**
   * Add driver to season
   */
  async function addDriver(
    seasonId: number,
    data: AddDriverToSeasonRequest,
  ): Promise<SeasonDriver> {
    loading.value = true;
    error.value = null;

    try {
      const seasonDriver = await addDriverToSeason(seasonId, data);
      seasonDrivers.value.push(seasonDriver);

      // Remove from available drivers if present
      availableDrivers.value = availableDrivers.value.filter((d) => d.id !== data.league_driver_id);

      // Update pagination metadata
      totalDrivers.value += 1;
      lastPage.value = Math.ceil(totalDrivers.value / perPage.value);

      // Optimistically update stats based on the new driver's status
      stats.value.total += 1;
      if (seasonDriver.status === 'active') {
        stats.value.active += 1;
      } else if (seasonDriver.status === 'reserve') {
        stats.value.reserve += 1;
      } else if (seasonDriver.status === 'withdrawn') {
        stats.value.withdrawn += 1;
      }

      // Update unassigned counts
      if (!seasonDriver.division_id) {
        stats.value.unassigned_to_division += 1;
      }
      if (!seasonDriver.team_id) {
        stats.value.unassigned_to_team += 1;
      }

      return seasonDriver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add driver to season';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update season-driver metadata
   */
  async function updateDriver(
    seasonId: number,
    seasonDriverId: number,
    data: UpdateSeasonDriverRequest,
  ): Promise<SeasonDriver> {
    loading.value = true;
    error.value = null;

    try {
      const updatedSeasonDriver = await updateSeasonDriver(seasonId, seasonDriverId, data);

      // Update in local state
      const index = seasonDrivers.value.findIndex((sd) => sd.id === seasonDriverId);
      if (index !== -1) {
        seasonDrivers.value[index] = updatedSeasonDriver;
      }

      // Re-fetch stats from API to ensure accuracy
      await fetchStats(seasonId);

      return updatedSeasonDriver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update season driver';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Remove driver from season
   */
  async function removeDriver(seasonId: number, leagueDriverId: number): Promise<void> {
    error.value = null;

    try {
      await removeDriverFromSeason(seasonId, leagueDriverId);

      // Remove from local state
      seasonDrivers.value = seasonDrivers.value.filter(
        (sd) => sd.league_driver_id !== leagueDriverId,
      );

      // Update pagination metadata
      totalDrivers.value = Math.max(0, totalDrivers.value - 1);
      lastPage.value = Math.ceil(totalDrivers.value / perPage.value);

      // Re-fetch stats from API to ensure accuracy
      await fetchStats(seasonId);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove driver from season';
      error.value = errorMessage;
      throw err;
    }
  }

  /**
   * Update local driver properties (team_name, division_name)
   * Use this after external updates (team assignment, division assignment)
   * to keep local state in sync without a full refetch
   */
  function updateLocalDriverProperty(
    driverId: number,
    property: keyof SeasonDriver,
    value: unknown,
  ): void {
    const driver = seasonDrivers.value.find((d) => d.id === driverId);
    if (driver) {
      // @ts-expect-error - Dynamic property assignment
      driver[property] = value;
    }
  }

  // Filters and pagination
  function setSearchQuery(query: string): void {
    searchQuery.value = query;
    currentPage.value = 1;
  }

  function setStatusFilter(status: SeasonDriverStatus | 'all'): void {
    statusFilter.value = status;
    currentPage.value = 1;
  }

  function setAvailableSearchQuery(query: string): void {
    availableSearchQuery.value = query;
    availablePage.value = 1;
  }

  function setDivisionFilter(divisionId: number | null): void {
    divisionFilter.value = divisionId;
    currentPage.value = 1;
  }

  function setTeamFilter(teamId: number | null): void {
    teamFilter.value = teamId;
    currentPage.value = 1;
  }

  function setSortField(field: string): void {
    sortField.value = field;
  }

  function setSortOrder(order: 'asc' | 'desc'): void {
    sortOrder.value = order;
  }

  function nextPage(): void {
    if (hasNextPage.value) {
      currentPage.value += 1;
    }
  }

  function previousPage(): void {
    if (hasPreviousPage.value) {
      currentPage.value -= 1;
    }
  }

  function goToPage(page: number): void {
    if (page >= 1 && page <= lastPage.value) {
      currentPage.value = page;
    }
  }

  function nextAvailablePage(): void {
    if (hasNextAvailablePage.value) {
      availablePage.value += 1;
    }
  }

  function previousAvailablePage(): void {
    if (hasPreviousAvailablePage.value) {
      availablePage.value -= 1;
    }
  }

  function goToAvailablePage(page: number): void {
    if (page >= 1 && page <= availableLastPage.value) {
      availablePage.value = page;
    }
  }

  // Utility
  function resetFilters(): void {
    searchQuery.value = '';
    statusFilter.value = 'all';
    availableSearchQuery.value = '';
    divisionFilter.value = null;
    teamFilter.value = null;
    sortField.value = 'driver_name';
    sortOrder.value = 'asc';
    currentPage.value = 1;
    availablePage.value = 1;
  }

  function clearError(): void {
    error.value = null;
  }

  function resetStore(): void {
    seasonDrivers.value = [];
    availableDrivers.value = [];
    loading.value = false;
    loadingAvailable.value = false;
    error.value = null;
    stats.value = {
      total: 0,
      active: 0,
      reserve: 0,
      withdrawn: 0,
      unassigned_to_division: 0,
      unassigned_to_team: 0,
    };
    currentPage.value = 1;
    perPage.value = 25;
    totalDrivers.value = 0;
    lastPage.value = 1;
    availablePage.value = 1;
    availablePerPage.value = 10;
    totalAvailable.value = 0;
    availableLastPage.value = 1;
    searchQuery.value = '';
    statusFilter.value = 'all';
    availableSearchQuery.value = '';
    divisionFilter.value = null;
    teamFilter.value = null;
    sortField.value = 'driver_name';
    sortOrder.value = 'asc';
  }

  return {
    // State
    seasonDrivers,
    availableDrivers,
    loading,
    loadingAvailable,
    error,
    stats,
    currentPage,
    perPage,
    totalDrivers,
    lastPage,
    availablePage,
    availablePerPage,
    totalAvailable,
    availableLastPage,
    searchQuery,
    statusFilter,
    availableSearchQuery,
    divisionFilter,
    teamFilter,
    sortField,
    sortOrder,

    // Getters
    activeDrivers,
    reserveDrivers,
    withdrawnDrivers,
    driverCount,
    hasDrivers,
    hasNextPage,
    hasPreviousPage,
    hasNextAvailablePage,
    hasPreviousAvailablePage,

    // Actions
    fetchSeasonDrivers,
    fetchAvailableDrivers,
    fetchStats,
    addDriver,
    updateDriver,
    removeDriver,
    updateLocalDriverProperty,

    // Filters
    setSearchQuery,
    setStatusFilter,
    setAvailableSearchQuery,
    setDivisionFilter,
    setTeamFilter,
    setSortField,
    setSortOrder,
    nextPage,
    previousPage,
    goToPage,
    nextAvailablePage,
    previousAvailablePage,
    goToAvailablePage,

    // Utility
    resetFilters,
    clearError,
    resetStore,
  };
});
