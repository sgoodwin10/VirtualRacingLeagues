<template>
  <div
    class="leagues-view bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-x-hidden flex-1 flex flex-col"
  >
    <!-- Background Effects -->
    <BackgroundGrid />
    <SpeedLines />

    <!-- Main Content -->
    <main class="relative z-10 flex-1 pt-24 pb-16">
      <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Page Header -->
        <div class="page-header mb-8">
          <!-- Breadcrumbs -->
          <VrlBreadcrumbs :items="breadcrumbItems" class="mb-4" />

          <h1
            class="page-title font-[var(--font-display)] text-[2.5rem] font-bold tracking-[2px] mb-2"
          >
            <span class="text-[var(--cyan)]">//</span> LEAGUES
          </h1>
          <p class="page-subtitle text-[var(--text-secondary)] text-[1rem]">
            Browse and explore racing leagues from around the world.
          </p>
        </div>

        <!-- Search & Filters -->
        <LeagueSearchBar
          v-model="searchQuery"
          :platform="platformFilter"
          :sort-by="sortBy"
          :platforms="platforms"
          @update:platform="platformFilter = $event"
          @update:sort-by="sortBy = $event"
        />

        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <VrlSkeletonCard v-for="i in 6" :key="i" />
        </div>

        <!-- Error State -->
        <VrlAlert v-else-if="error" type="error" title="Error" class="mb-8">
          {{ error }}
        </VrlAlert>

        <!-- Empty State -->
        <div
          v-else-if="leagues.length === 0"
          class="text-center py-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px]"
        >
          <p class="text-[var(--text-secondary)] text-lg mb-2">No leagues found</p>
          <p class="text-[var(--text-muted)] text-sm">Try adjusting your search or filters</p>
        </div>

        <!-- Leagues Grid -->
        <div v-else class="leagues-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <LeagueCard v-for="league in leagues" :key="league.id" :league="league" />
        </div>

        <!-- Pagination -->
        <VrlTablePagination
          v-if="!loading && leagues.length > 0"
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total-items="pagination.total"
          :items-per-page="pagination.per_page"
          :first="(pagination.current_page - 1) * pagination.per_page"
          :last="Math.min(pagination.current_page * pagination.per_page - 1, pagination.total - 1)"
          entity-name="leagues"
          @page-change="handlePageChange"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import * as Sentry from '@sentry/vue';
import { leagueService } from '@public/services/leagueService';
import type { PublicLeague, Platform } from '@public/types/public';
import type { BreadcrumbItem } from '@public/types/navigation';
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import SpeedLines from '@public/components/landing/SpeedLines.vue';
import LeagueCard from '@public/components/leagues/LeagueCard.vue';
import LeagueSearchBar from '@public/components/leagues/LeagueSearchBar.vue';
import VrlBreadcrumbs from '@public/components/common/navigation/VrlBreadcrumbs.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlSkeletonCard from '@public/components/common/loading/VrlSkeletonCard.vue';
import VrlTablePagination from '@public/components/common/tables/VrlTablePagination.vue';

const route = useRoute();
const toast = useToast();

// Breadcrumb items
const breadcrumbItems: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Leagues' }];

// State
const leagues = ref<PublicLeague[]>([]);
const platforms = ref<Platform[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Filter state
const searchQuery = ref('');
const platformFilter = ref<string | number | null>(null);
const sortBy = ref<'popular' | 'recent' | 'name'>('popular');

// Pagination state
const pagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  per_page: 12,
});

/**
 * Debounce timer for search
 */
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * AbortController for request cancellation
 */
const abortController = ref<AbortController | null>(null);

/**
 * Fetch leagues with current filters and pagination
 */
const fetchLeagues = async () => {
  // Cancel previous request if exists
  abortController.value?.abort();
  abortController.value = new AbortController();

  loading.value = true;
  error.value = null;

  try {
    const response = await leagueService.getLeagues(
      {
        search: searchQuery.value || undefined,
        platform: platformFilter.value || undefined,
        sort: sortBy.value,
        page: pagination.value.current_page,
        perPage: pagination.value.per_page,
      },
      abortController.value.signal,
    );

    leagues.value = response.data;
    pagination.value = {
      current_page: response.meta.current_page,
      last_page: response.meta.last_page,
      total: response.meta.total,
      per_page: response.meta.per_page,
    };
  } catch (err) {
    // Ignore abort errors (user navigated away or new request started)
    if (err instanceof Error && err.name === 'AbortError') {
      return;
    }

    Sentry.captureException(err, {
      tags: { context: 'fetch_leagues' },
    });
    error.value = 'Failed to load leagues. Please try again.';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load leagues',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

/**
 * Fetch available platforms for filter
 */
const fetchPlatforms = async () => {
  try {
    platforms.value = await leagueService.getPlatforms();
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'fetch_platforms' },
      level: 'warning',
    });
    // Non-critical error, don't show to user
  }
};

/**
 * Handle page change
 */
const handlePageChange = (page: number) => {
  pagination.value.current_page = page;
  fetchLeagues();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Watch search query with debounce
 */
watch(searchQuery, () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = setTimeout(() => {
    pagination.value.current_page = 1; // Reset to first page on search
    fetchLeagues();
  }, 300); // 300ms debounce
});

/**
 * Watch platform filter and sort - trigger immediate fetch
 */
watch([platformFilter, sortBy], () => {
  pagination.value.current_page = 1; // Reset to first page on filter change
  fetchLeagues();
});

/**
 * Initialize on mount
 */
onMounted(async () => {
  // Parse query params if any
  const queryPage = Number(route.query.page);
  if (queryPage && queryPage > 0) {
    pagination.value.current_page = queryPage;
  }

  if (route.query.search) {
    searchQuery.value = String(route.query.search);
  }

  if (route.query.platform) {
    platformFilter.value = Number(route.query.platform);
  }

  if (route.query.sort && ['popular', 'recent', 'name'].includes(String(route.query.sort))) {
    sortBy.value = String(route.query.sort) as 'popular' | 'recent' | 'name';
  }

  // Fetch data
  await Promise.all([fetchLeagues(), fetchPlatforms()]);
});

/**
 * Cleanup on unmount
 */
onUnmounted(() => {
  // Clear debounce timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }

  // Abort any pending requests
  abortController.value?.abort();
});
</script>
