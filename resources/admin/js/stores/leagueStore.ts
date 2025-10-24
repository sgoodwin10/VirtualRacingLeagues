import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { leagueService } from '@admin/services/leagueService';
import type {
  League,
  LeagueVisibility,
  LeagueStatus,
  LeagueListParams,
  PaginatedResponse,
} from '@admin/types/league';
import { logger } from '@admin/utils/logger';

/**
 * League Store
 * Manages league data with server-side pagination, filtering, and search
 *
 * Persistence:
 * - Uses pinia-plugin-persistedstate to persist filter/search state
 * - Storage: sessionStorage (cleared when browser/tab closes)
 * - Persists: searchQuery, visibilityFilter, statusFilter, platformsFilter, currentPage, rowsPerPage
 * - Does NOT persist: leagues array, loading states (fetched from server)
 */
export const useLeagueStore = defineStore(
  'league',
  () => {
    // State
    // Initialize as empty array and ensure it's never undefined
    const leagues = ref<League[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Filter and search state
    const searchQuery = ref('');
    const visibilityFilter = ref<LeagueVisibility | 'all'>('all');
    const statusFilter = ref<LeagueStatus | 'all'>('all');
    const platformsFilter = ref<number[]>([]);

    // Sorting state
    const sortBy = ref<'id' | 'name' | 'visibility' | 'status'>('id');
    const sortDirection = ref<'asc' | 'desc'>('desc');

    // Pagination state
    const currentPage = ref(1);
    const rowsPerPage = ref(15);
    const totalRecords = ref(0);
    const totalPages = ref(0);

    // Pagination meta
    const paginationMeta = ref<PaginatedResponse<League> | null>(null);

    // Getters

    /**
     * Get active leagues only
     */
    const activeLeagues = computed((): League[] => {
      return (
        leagues.value?.filter((league) => league.status === 'active' && league.is_active) ?? []
      );
    });

    /**
     * Get archived leagues
     */
    const archivedLeagues = computed((): League[] => {
      return (
        leagues.value?.filter((league) => league.status === 'archived' || league.is_archived) ?? []
      );
    });

    /**
     * Get public leagues
     */
    const publicLeagues = computed((): League[] => {
      return leagues.value?.filter((league) => league.visibility === 'public') ?? [];
    });

    /**
     * Get private leagues
     */
    const privateLeagues = computed((): League[] => {
      return leagues.value?.filter((league) => league.visibility === 'private') ?? [];
    });

    /**
     * Get total league count
     */
    const totalLeagues = computed((): number => totalRecords.value);

    /**
     * Check if currently loading
     */
    const loading = computed((): boolean => isLoading.value);

    /**
     * Get current error message
     */
    const errorMessage = computed((): string | null => error.value);

    /**
     * Check if there are any leagues
     */
    const hasLeagues = computed((): boolean => (leagues.value?.length ?? 0) > 0);

    /**
     * Get current filter state for API requests
     */
    const filterParams = computed((): LeagueListParams => {
      const params: LeagueListParams = {
        page: currentPage.value,
        per_page: rowsPerPage.value,
        sort_by: sortBy.value,
        sort_direction: sortDirection.value,
      };

      if (searchQuery.value) {
        params.search = searchQuery.value;
      }

      if (visibilityFilter.value && visibilityFilter.value !== 'all') {
        params.visibility = visibilityFilter.value;
      }

      if (statusFilter.value && statusFilter.value !== 'all') {
        params.status = statusFilter.value;
      }

      if (platformsFilter.value && platformsFilter.value.length > 0) {
        params.platform_ids = platformsFilter.value;
      }

      return params;
    });

    // Actions

    /**
     * Fetch leagues from API with current filters and pagination
     * @param signal - Optional AbortSignal for request cancellation
     */
    async function fetchLeagues(signal?: AbortSignal): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await leagueService.getLeagues(filterParams.value, signal);

        leagues.value = response.data;
        paginationMeta.value = response;
        totalRecords.value = response.total;
        totalPages.value = response.last_page;

        logger.debug('=== Leagues Loaded (Paginated) ===');
        logger.debug('Page:', currentPage.value, 'Per Page:', rowsPerPage.value);
        logger.debug('Total records:', totalRecords.value);
        logger.debug('Leagues on current page:', leagues.value?.length ?? 0);
        logger.debug('Search:', searchQuery.value);
        logger.debug('Visibility filter:', visibilityFilter.value);
        logger.debug('Status filter:', statusFilter.value);
        logger.debug('Platforms filter:', platformsFilter.value);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch leagues';
        logger.error('Failed to fetch leagues:', err);
        // Re-throw to allow caller to handle if needed
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Archive a league
     * @param leagueId - League ID to archive
     * @param signal - Optional AbortSignal for request cancellation
     */
    async function archiveLeague(leagueId: number, signal?: AbortSignal): Promise<void> {
      try {
        await leagueService.archiveLeague(leagueId, signal);
        // Refresh the list after archiving
        await fetchLeagues(signal);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to archive league';
        logger.error('Failed to archive league:', err);
        throw err;
      }
    }

    /**
     * Delete a league (placeholder - not implemented)
     * @param leagueId - League ID to delete
     * @param signal - Optional AbortSignal for request cancellation
     */
    async function deleteLeague(leagueId: number, signal?: AbortSignal): Promise<void> {
      try {
        // Placeholder - does nothing for now
        await leagueService.deleteLeague(leagueId, signal);
        // Refresh the list after deletion
        await fetchLeagues(signal);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to delete league';
        logger.error('Failed to delete league:', err);
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
     * Set visibility filter and reset to first page
     * @param visibility - Visibility to filter by
     */
    function setVisibilityFilter(visibility: LeagueVisibility | 'all'): void {
      visibilityFilter.value = visibility;
      currentPage.value = 1; // Reset to first page on filter change
    }

    /**
     * Set status filter and reset to first page
     * @param status - Status to filter by
     */
    function setStatusFilter(status: LeagueStatus | 'all'): void {
      statusFilter.value = status;
      currentPage.value = 1; // Reset to first page on filter change
    }

    /**
     * Set platforms filter and reset to first page
     * @param platformIds - Array of platform IDs to filter by
     */
    function setPlatformsFilter(platformIds: number[]): void {
      platformsFilter.value = platformIds;
      currentPage.value = 1; // Reset to first page on filter change
    }

    /**
     * Set sorting and reset to first page
     * @param field - Field to sort by
     * @param direction - Sort direction
     */
    function setSorting(
      field: 'id' | 'name' | 'visibility' | 'status',
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
      visibilityFilter.value = 'all';
      statusFilter.value = 'all';
      platformsFilter.value = [];
      sortBy.value = 'id';
      sortDirection.value = 'desc';
      currentPage.value = 1;
      rowsPerPage.value = 15;
    }

    /**
     * Clear all data and reset state
     */
    function clearLeagues(): void {
      leagues.value = [];
      error.value = null;
      totalRecords.value = 0;
      totalPages.value = 0;
      paginationMeta.value = null;
    }

    /**
     * Get league by ID from current list
     * @param leagueId - League ID to find
     */
    function getLeagueById(leagueId: number): League | undefined {
      return leagues.value?.find((l) => l.id === leagueId);
    }

    return {
      // State
      leagues,
      isLoading,
      error,
      searchQuery,
      visibilityFilter,
      statusFilter,
      platformsFilter,
      sortBy,
      sortDirection,
      currentPage,
      rowsPerPage,
      totalRecords,
      totalPages,
      paginationMeta,

      // Getters
      activeLeagues,
      archivedLeagues,
      publicLeagues,
      privateLeagues,
      totalLeagues,
      loading,
      errorMessage,
      hasLeagues,
      filterParams,

      // Actions
      fetchLeagues,
      archiveLeague,
      deleteLeague,
      setSearchQuery,
      setVisibilityFilter,
      setStatusFilter,
      setPlatformsFilter,
      setSorting,
      setPage,
      setRowsPerPage,
      resetFilters,
      clearLeagues,
      getLeagueById,
    };
  },
  {
    persist: {
      storage: sessionStorage,
      // Only persist filter/search state and pagination preferences
      // Do not persist leagues array (fetched from server)
      pick: [
        'searchQuery',
        'visibilityFilter',
        'statusFilter',
        'platformsFilter',
        'sortBy',
        'sortDirection',
        'currentPage',
        'rowsPerPage',
      ],
    },
  },
);
