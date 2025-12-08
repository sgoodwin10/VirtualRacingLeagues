import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useDebounceFn } from '@vueuse/core';
import {
  publicApi,
  type FetchLeaguesParams,
  type PaginationMeta,
} from '@public/services/publicApi';
import type { PublicLeague, Platform } from '@public/types/public';

export interface UsePublicLeaguesOptions {
  syncWithUrl?: boolean;
}

export function usePublicLeagues(options: UsePublicLeaguesOptions = {}) {
  const router = useRouter();
  const route = useRoute();
  const { syncWithUrl = true } = options;

  // Data refs
  const leagues = ref<PublicLeague[]>([]);
  const platforms = ref<Platform[]>([]);
  const paginationMeta = ref<PaginationMeta | null>(null);

  // State refs
  const isLoading = ref(false);
  const isLoadingPlatforms = ref(false);
  const error = ref<string | null>(null);
  const isMounted = ref(false);

  // Filter refs
  const currentPage = ref(1);
  const perPage = ref(12);
  const searchQuery = ref('');
  const selectedPlatformId = ref<number | null>(null);

  // Computed values
  const totalPages = computed(() => paginationMeta.value?.last_page ?? 0);
  const totalRecords = computed(() => paginationMeta.value?.total ?? 0);
  const isEmpty = computed(() => !isLoading.value && leagues.value.length === 0);
  const hasResults = computed(() => leagues.value.length > 0);

  function initializeFromUrl(): void {
    if (!syncWithUrl) return;
    const page = parseInt(route.query.page as string, 10);
    const search = route.query.search as string;
    const platformId = parseInt(route.query.platform as string, 10);

    if (!isNaN(page) && page > 0) currentPage.value = page;
    if (search) searchQuery.value = search;
    if (!isNaN(platformId) && platformId > 0) selectedPlatformId.value = platformId;
  }

  function updateUrl(): void {
    if (!syncWithUrl) return;
    const query: Record<string, string> = {};

    if (currentPage.value > 1) query.page = String(currentPage.value);
    if (searchQuery.value) query.search = searchQuery.value;
    if (selectedPlatformId.value) query.platform = String(selectedPlatformId.value);

    router.replace({ query });
  }

  async function fetchLeagues(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const params: FetchLeaguesParams = {
        page: currentPage.value,
        per_page: perPage.value,
      };

      if (searchQuery.value.trim()) {
        params.search = searchQuery.value.trim();
      }

      if (selectedPlatformId.value) {
        params.platform_id = selectedPlatformId.value;
      }

      const response = await publicApi.fetchLeagues(params);

      if (!isMounted.value) return;

      leagues.value = response.data;
      paginationMeta.value = response.meta;
    } catch (err) {
      if (!isMounted.value) return;

      error.value = err instanceof Error ? err.message : 'Failed to fetch leagues';
      leagues.value = [];
      paginationMeta.value = null;
    } finally {
      if (isMounted.value) {
        isLoading.value = false;
      }
    }
  }

  async function fetchPlatforms(): Promise<void> {
    isLoadingPlatforms.value = true;
    try {
      const result = await publicApi.fetchPlatforms();

      if (!isMounted.value) return;

      platforms.value = result;
    } catch (err) {
      if (!isMounted.value) return;

      console.error('Failed to fetch platforms:', err);
      platforms.value = [];
    } finally {
      if (isMounted.value) {
        isLoadingPlatforms.value = false;
      }
    }
  }

  // Debounced search handler with proper cleanup
  const debouncedFetchLeagues = useDebounceFn(
    () => {
      if (isMounted.value) {
        fetchLeagues();
      }
    },
    300,
    { maxWait: 1000 },
  );

  function handleSearch(query: string): void {
    searchQuery.value = query.trim();
    currentPage.value = 1;
    updateUrl();
    debouncedFetchLeagues();
  }

  function handlePlatformChange(platformId: number | string | null): void {
    // Handle string values from VrlFilterChips (for "all" option)
    if (platformId === '' || platformId === 'all' || platformId === null) {
      selectedPlatformId.value = null;
    } else {
      selectedPlatformId.value = Number(platformId);
    }
    currentPage.value = 1;
    updateUrl();
    fetchLeagues();
  }

  function handlePageChange(page: number): void {
    currentPage.value = page;
    updateUrl();
    fetchLeagues();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePerPageChange(value: number): void {
    perPage.value = value;
    currentPage.value = 1;
    updateUrl();
    fetchLeagues();
  }

  // Initialize from URL when component is mounted (prevents SSR issues)
  onMounted(() => {
    isMounted.value = true;
    initializeFromUrl();
  });

  // Cleanup on unmount
  onUnmounted(() => {
    isMounted.value = false;
    // The isMounted guard in debouncedFetchLeagues prevents state updates after unmount
  });

  return {
    leagues,
    platforms,
    isLoading,
    isLoadingPlatforms,
    error,
    currentPage,
    perPage,
    totalPages,
    totalRecords,
    searchQuery,
    selectedPlatformId,
    isEmpty,
    hasResults,
    fetchLeagues,
    fetchPlatforms,
    handleSearch,
    handlePlatformChange,
    handlePageChange,
    handlePerPageChange,
  };
}
