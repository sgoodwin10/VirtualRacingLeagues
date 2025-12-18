<template>
  <div class="leagues-page">
    <!-- Page Header -->
    <PageHeader
      label="Directory"
      title="Public Leagues"
      description="Discover sim racing leagues from the community. View standings, results, and race schedules."
      background-image="/images/background-headers/public_leagues_bg.jpg"
    />

    <!-- Search & Filters -->
    <section class="filters-section">
      <div class="container-racing">
        <div class="filters-bar">
          <VrlSearchBar
            :model-value="searchQuery"
            :loading="isLoading"
            placeholder="Search leagues by name..."
            class="search-bar"
            @update:model-value="handleSearch"
            @search="handleSearch"
          />

          <VrlFilterChips
            :model-value="selectedPlatformId ?? 'all'"
            :options="platformFilterOptions"
            @update:model-value="handlePlatformChange"
          />
        </div>
      </div>
    </section>

    <!-- Leagues Grid -->
    <section class="leagues-section section-padding">
      <div class="container-racing">
        <!-- Error State -->
        <div v-if="error && !isLoading" class="error-state">
          <PhWarning class="error-icon" :size="64" weight="duotone" />
          <h3 class="error-title">Failed to Load Leagues</h3>
          <p class="error-description">{{ error }}</p>
          <button class="btn btn-primary" @click="fetchLeagues">Try Again</button>
        </div>

        <!-- Loading State -->
        <div v-else-if="isLoading" class="loading-grid">
          <div v-for="n in 6" :key="n" class="league-card-skeleton">
            <div class="skeleton-header"></div>
            <div class="skeleton-body">
              <div class="skeleton-logo"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text short"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="isEmpty" class="empty-state">
          <PhFlagCheckered class="empty-icon" :size="64" weight="duotone" />
          <h3 class="empty-title">No Leagues Found</h3>
          <p class="empty-description">
            {{
              searchQuery
                ? 'Try adjusting your search terms.'
                : 'No public leagues are available yet.'
            }}
          </p>
          <router-link to="/register" class="btn btn-primary"> Create Your Own League </router-link>
        </div>

        <!-- Leagues Grid -->
        <div v-else class="leagues-grid">
          <VrlLeagueCard
            v-for="league in leagues"
            :key="league.id"
            :name="league.name"
            :tagline="league.tagline ?? undefined"
            :logo-url="league.logo_url ?? undefined"
            :logo="league.logo"
            :header-image-url="league.header_image_url ?? undefined"
            :header-image="league.header_image"
            :competitions="league.competitions_count"
            :drivers="league.drivers_count"
            :to="`/leagues/${league.slug}`"
          />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1 && !isLoading" class="pagination-wrapper">
          <VrlPagination
            v-model="currentPage"
            :total-pages="totalPages"
            :total-records="totalRecords"
            :per-page="perPage"
            variant="racing"
            @update:model-value="handlePageChange"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { PhFlagCheckered, PhWarning } from '@phosphor-icons/vue';
import { usePublicLeagues } from '@public/composables/usePublicLeagues';
import PageHeader from '@public/components/common/layout/PageHeader.vue';
import VrlSearchBar from '@public/components/common/forms/VrlSearchBar.vue';
import VrlFilterChips from '@public/components/common/forms/VrlFilterChips.vue';
import VrlLeagueCard from '@public/components/common/cards/VrlLeagueCard.vue';
import VrlPagination from '@public/components/common/data-display/VrlPagination.vue';

// Use the composable
const {
  leagues,
  platforms,
  isLoading,
  error,
  currentPage,
  perPage,
  totalPages,
  totalRecords,
  searchQuery,
  selectedPlatformId,
  isEmpty,
  fetchLeagues,
  fetchPlatforms,
  handleSearch,
  handlePlatformChange,
  handlePageChange,
} = usePublicLeagues();

// Track if component is still mounted
const isMounted = ref(false);

// Create filter options with "All" option
const platformFilterOptions = computed(() => {
  return [
    { label: 'All Platforms', value: 'all' },
    ...platforms.value.map((platform) => ({
      label: platform.name,
      value: platform.id,
    })),
  ];
});

// Fetch data on mount with abort handling
onMounted(async () => {
  isMounted.value = true;
  try {
    await Promise.all([fetchPlatforms(), fetchLeagues()]);
  } catch (err) {
    // Error is already handled in the composable
    // Only log if component is still mounted
    if (isMounted.value) {
      console.error('Failed to fetch initial data:', err);
    }
  }
});

onUnmounted(() => {
  isMounted.value = false;
});
</script>

<style scoped>
/* Filters */
.filters-section {
  background: var(--color-carbon);
  padding: var(--space-xl) 0;
  border-bottom: 1px solid var(--color-tarmac);
  position: sticky;
  top: var(--header-height, 60px);
  z-index: 50;
}

.filters-bar {
  display: flex;
  gap: var(--space-xl);
  align-items: center;
  flex-wrap: wrap;
}

.search-bar {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

/* Leagues Grid */
.leagues-section {
  background: var(--color-carbon);
}

.leagues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-xl);
}

/* Loading Skeleton */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-xl);
}

.league-card-skeleton {
  background: var(--color-asphalt);
  border: 1px solid var(--color-tarmac);
  overflow: hidden;
}

.skeleton-header {
  height: 120px;
  background: linear-gradient(
    90deg,
    var(--color-tarmac) 0%,
    var(--color-pit-lane) 50%,
    var(--color-tarmac) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-body {
  padding: var(--space-xl) var(--space-lg) var(--space-lg);
}

.skeleton-logo {
  width: 60px;
  height: 60px;
  background: var(--color-tarmac);
  margin-top: -45px;
  margin-bottom: var(--space-md);
  animation: shimmer 1.5s infinite;
}

.skeleton-text {
  height: 16px;
  background: var(--color-tarmac);
  margin-bottom: var(--space-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-text.short {
  width: 60%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-4xl) var(--space-xl);
}

.empty-icon {
  color: var(--color-gold);
  opacity: 0.3;
  margin-bottom: var(--space-xl);
}

.empty-title {
  font-size: 1.5rem;
  margin-bottom: var(--space-sm);
}

.empty-description {
  color: var(--color-barrier);
  margin-bottom: var(--space-xl);
}

/* Error State */
.error-state {
  text-align: center;
  padding: var(--space-4xl) var(--space-xl);
}

.error-icon {
  color: #ef4444;
  opacity: 0.8;
  margin-bottom: var(--space-xl);
}

.error-title {
  font-size: 1.5rem;
  margin-bottom: var(--space-sm);
}

.error-description {
  color: var(--color-barrier);
  margin-bottom: var(--space-xl);
}

/* Pagination */
.pagination-wrapper {
  margin-top: var(--space-3xl);
  display: flex;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-bar {
    max-width: 100%;
  }

  .leagues-grid {
    grid-template-columns: 1fr;
  }
}
</style>
