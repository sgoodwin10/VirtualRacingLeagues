<template>
  <div class="leagues-page">
    <PublicHeader />

    <!-- Page Header -->
    <section class="page-header">
      <div class="container-racing">
        <div class="page-header-content">
          <span class="page-label">Directory</span>
          <h1 class="page-title">Public Leagues</h1>
          <p class="page-description">
            Discover sim racing leagues from the community. View standings, results, and race schedules.
          </p>
        </div>
      </div>
    </section>

    <!-- Search & Filters -->
    <section class="filters-section">
      <div class="container-racing">
        <div class="filters-bar">
          <div class="search-bar">
            <PhMagnifyingGlass class="search-icon" :size="20" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search leagues by name..."
              @input="debouncedSearch"
            />
          </div>

          <div class="filter-chips">
            <button
              v-for="platform in platforms"
              :key="platform.id"
              class="filter-chip"
              :class="{ active: selectedPlatform === platform.id }"
              @click="togglePlatform(platform.id)"
            >
              {{ platform.name }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Leagues Grid -->
    <section class="leagues-section section-padding">
      <div class="container-racing">
        <!-- Loading State -->
        <div v-if="loading" class="loading-grid">
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
        <div v-else-if="leagues.length === 0" class="empty-state">
          <PhFlagCheckered class="empty-icon" :size="64" weight="duotone" />
          <h3 class="empty-title">No Leagues Found</h3>
          <p class="empty-description">
            {{ searchQuery ? 'Try adjusting your search terms.' : 'No public leagues are available yet.' }}
          </p>
          <router-link to="/register" class="btn btn-primary">
            Create Your Own League
          </router-link>
        </div>

        <!-- Leagues Grid -->
        <div v-else class="leagues-grid">
          <router-link
            v-for="league in leagues"
            :key="league.id"
            :to="`/leagues/${league.slug}`"
            class="league-card"
          >
            <div class="league-card-header">
              <img
                v-if="league.header_image_url"
                :src="league.header_image_url"
                :alt="league.name"
              />
              <div v-else class="league-card-header-placeholder">
                <PhFlag :size="32" weight="duotone" />
              </div>
            </div>

            <div class="league-card-logo">
              <img
                v-if="league.logo_url"
                :src="league.logo_url"
                :alt="league.name"
              />
              <PhFlag v-else :size="28" weight="duotone" class="logo-placeholder" />
            </div>

            <div class="league-card-body">
              <h3 class="league-card-name">{{ league.name }}</h3>
              <p v-if="league.tagline" class="league-card-tagline">{{ league.tagline }}</p>

              <div class="league-card-stats">
                <div class="league-card-stat">
                  <span class="league-card-stat-value">{{ league.competitions_count }}</span>
                  <span>{{ league.competitions_count === 1 ? 'Competition' : 'Competitions' }}</span>
                </div>
                <div class="league-card-stat">
                  <span class="league-card-stat-value">{{ league.drivers_count }}</span>
                  <span>{{ league.drivers_count === 1 ? 'Driver' : 'Drivers' }}</span>
                </div>
              </div>

              <div class="league-card-platforms">
                <span
                  v-for="platform in league.platforms"
                  :key="platform.id"
                  class="platform-badge"
                >
                  {{ platform.name }}
                </span>
              </div>
            </div>
          </router-link>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination-wrapper">
          <div class="pagination">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              <PhCaretLeft :size="16" />
            </button>

            <button
              v-for="page in visiblePages"
              :key="page"
              class="pagination-btn"
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>

            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              <PhCaretRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  PhMagnifyingGlass,
  PhFlag,
  PhFlagCheckered,
  PhCaretLeft,
  PhCaretRight,
} from '@phosphor-icons/vue';
import PublicHeader from '@public/components/layout/PublicHeader.vue';
import PublicFooter from '@public/components/layout/PublicFooter.vue';
import type { PublicLeague, Platform } from '@public/types/public';

const route = useRoute();
const router = useRouter();

// State
const loading = ref(true);
const searchQuery = ref('');
const selectedPlatform = ref<number | null>(null);
const leagues = ref<PublicLeague[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
// perPage will be used for future API pagination (12 items per page)

// Mock platforms for now - this would come from API
const platforms = ref<Platform[]>([
  { id: 1, name: 'GT7', slug: 'gt7' },
]);

// Computed
const visiblePages = computed(() => {
  const pages: number[] = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Methods
let searchTimeout: ReturnType<typeof setTimeout>;

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchLeagues();
  }, 300);
};

const togglePlatform = (platformId: number) => {
  if (selectedPlatform.value === platformId) {
    selectedPlatform.value = null;
  } else {
    selectedPlatform.value = platformId;
  }
  currentPage.value = 1;
  fetchLeagues();
};

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchLeagues();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const fetchLeagues = async () => {
  loading.value = true;
  try {
    // TODO: Replace with actual API call
    // const response = await publicApi.getLeagues({
    //   page: currentPage.value,
    //   per_page: perPage,
    //   search: searchQuery.value,
    //   platform_id: selectedPlatform.value,
    // });
    // leagues.value = response.data;
    // totalPages.value = response.meta.last_page;

    // Mock data for now
    await new Promise(resolve => setTimeout(resolve, 500));
    leagues.value = [
      {
        id: 1,
        name: 'GT7 Racing League',
        slug: 'gt7-racing-league',
        tagline: 'Competitive Gran Turismo 7 racing',
        description: 'Weekly races every Sunday',
        logo_url: null,
        header_image_url: null,
        platforms: [{ id: 1, name: 'GT7', slug: 'gt7' }],
        discord_url: null,
        website_url: null,
        twitter_handle: null,
        instagram_handle: null,
        youtube_url: null,
        twitch_url: null,
        competitions_count: 3,
        drivers_count: 24,
        visibility: 'public' as const,
      },
      {
        id: 2,
        name: 'Speed Demons Racing',
        slug: 'speed-demons-racing',
        tagline: 'Where speed meets skill',
        description: 'Multi-class racing championships',
        logo_url: null,
        header_image_url: null,
        platforms: [{ id: 1, name: 'GT7', slug: 'gt7' }],
        discord_url: null,
        website_url: null,
        twitter_handle: null,
        instagram_handle: null,
        youtube_url: null,
        twitch_url: null,
        competitions_count: 5,
        drivers_count: 48,
        visibility: 'public' as const,
      },
      {
        id: 3,
        name: 'Virtual Endurance Series',
        slug: 'virtual-endurance-series',
        tagline: 'Endurance racing at its finest',
        description: 'Long-format races for dedicated racers',
        logo_url: null,
        header_image_url: null,
        platforms: [{ id: 1, name: 'GT7', slug: 'gt7' }],
        discord_url: null,
        website_url: null,
        twitter_handle: null,
        instagram_handle: null,
        youtube_url: null,
        twitch_url: null,
        competitions_count: 2,
        drivers_count: 36,
        visibility: 'public' as const,
      },
    ];
    totalPages.value = 1;
  } catch (error) {
    console.error('Failed to fetch leagues:', error);
  } finally {
    loading.value = false;
  }
};

// Initialize from URL params
onMounted(() => {
  const page = parseInt(route.query.page as string) || 1;
  const search = (route.query.search as string) || '';
  const platform = parseInt(route.query.platform as string) || null;

  currentPage.value = page;
  searchQuery.value = search;
  selectedPlatform.value = platform;

  fetchLeagues();
});

// Update URL when filters change
watch([currentPage, searchQuery, selectedPlatform], () => {
  const query: Record<string, string> = {};
  if (currentPage.value > 1) query.page = currentPage.value.toString();
  if (searchQuery.value) query.search = searchQuery.value;
  if (selectedPlatform.value) query.platform = selectedPlatform.value.toString();

  router.replace({ query });
});
</script>

<style scoped>
/* Page Header */
.page-header {
  padding-top: calc(var(--header-height) + var(--space-3xl));
  padding-bottom: var(--space-3xl);
  background: var(--color-asphalt);
  border-bottom: 1px solid var(--color-tarmac);
}

.page-header-content {
  max-width: 600px;
}

.page-label {
  font-family: var(--font-display);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: var(--color-gold);
  display: block;
  margin-bottom: var(--space-sm);
}

.page-title {
  font-size: clamp(2rem, 5vw, 3rem);
  margin-bottom: var(--space-md);
}

.page-description {
  font-size: 1rem;
  color: var(--color-barrier);
  line-height: 1.6;
}

/* Filters */
.filters-section {
  background: var(--color-carbon);
  padding: var(--space-xl) 0;
  border-bottom: 1px solid var(--color-tarmac);
  position: sticky;
  top: var(--header-height);
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

/* League Card Enhancements */
.league-card {
  text-decoration: none;
  display: block;
}

.league-card-header-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-tarmac) 0%, var(--color-pit-lane) 100%);
  color: var(--color-barrier);
}

.logo-placeholder {
  color: var(--color-barrier);
}

.league-card-platforms {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.platform-badge {
  font-family: var(--font-display);
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-tarmac);
  color: var(--color-barrier);
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

/* Pagination */
.pagination-wrapper {
  margin-top: var(--space-3xl);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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
