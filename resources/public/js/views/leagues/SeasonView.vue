<template>
  <div class="season-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading season...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container container-racing">
      <PhWarningCircle :size="64" weight="duotone" class="error-icon" />
      <h2>Season Not Found</h2>
      <p>{{ error }}</p>
      <router-link :to="`/leagues/${route.params.slug}`" class="btn btn-primary">
        Back to League
      </router-link>
    </div>

    <!-- Season Content -->
    <template v-else-if="season">
      <!-- Page Header -->
      <PageHeader
        :label="seasonLabel"
        :title="season.name"
        :description="season.description || undefined"
        :background-image="pageHeaderBackgroundImage"
        :logo-url="leagueLogoUrl || undefined"
      >
        <template #social-links>
          <div class="season-badges">
            <VrlBadge
              :variant="getSeasonBadgeVariant(season.status)"
              :label="season.status"
              :pulse="season.status === 'active'"
            />
            <VrlBadge
              v-if="season.car_class"
              variant="platform"
              :label="season.car_class"
              :rounded="false"
            />
          </div>
        </template>
      </PageHeader>

      <!-- Breadcrumbs -->
      <section class="breadcrumbs-section">
        <div class="container-racing py-4">
          <VrlBreadcrumbs :items="breadcrumbItems" />
        </div>
      </section>

      <!-- Stats Bar -->
      <section class="stats-section">
        <div class="container-racing">
          <div class="stats-grid">
            <!-- Active Drivers -->
            <VrlStatsCard
              label="Active Drivers"
              :value="season.stats.active_drivers"
              :highlighted="true"
            >
              <template #icon>
                <PhUsers :size="20" weight="fill" class="text-racing-gold" />
              </template>
            </VrlStatsCard>

            <!-- Races Completed -->
            <VrlStatsCard
              label="Races Completed"
              :value="`${season.stats.completed_races}/${season.stats.total_races}`"
            >
              <template #icon>
                <PhFlagCheckered :size="20" weight="fill" class="text-racing-gold" />
              </template>
            </VrlStatsCard>

            <!-- Total Rounds -->
            <VrlStatsCard label="Total Rounds" :value="rounds.length">
              <template #icon>
                <PhCalendarDots :size="20" weight="fill" class="text-racing-gold" />
              </template>
            </VrlStatsCard>

            <!-- Season Status -->
            <VrlStatsCard label="Status" :value="season.status">
              <template #icon>
                <component
                  :is="getSeasonStatusIcon(season.status)"
                  :size="20"
                  weight="fill"
                  class="text-racing-gold"
                />
              </template>
            </VrlStatsCard>
          </div>
        </div>
      </section>

      <!-- Tabs Navigation -->
      <section class="tabs-section">
        <div class="container-racing py-4">
          <VrlFilterChips v-model="activeTab" :options="tabOptions" />
        </div>
      </section>

      <!-- Tab Content -->
      <section class="tab-content section-padding">
        <div class="container-racing">
          <!-- Standings Tab -->
          <div v-if="activeTab === 'standings'" class="standings-tab">
            <div v-if="!standings || standings.length === 0" class="empty-state">
              <PhChartLine :size="48" weight="duotone" class="empty-icon" />
              <p>No standings data available yet.</p>
            </div>

            <!-- Flat Standings (No Divisions) -->
            <VrlCard v-else-if="!hasDivisions" :hoverable="false" class="standings-card">
              <StandingsTable
                :drivers="standings as SeasonStandingDriver[]"
                :rounds="roundHeaders"
              />
            </VrlCard>

            <!-- Division Standings with Tabs -->
            <VrlTabs
              v-else
              v-model="activeStandingsTab"
              :tabs="standingsTabs"
              class="divisions-tabs"
            >
              <template
                v-for="(division, index) in standings as SeasonStandingDivision[]"
                :key="division.division_id"
                #[`tab-${index}`]
              >
                <StandingsTable :drivers="division.drivers" :rounds="roundHeaders" />
              </template>
            </VrlTabs>
          </div>

          <!-- Rounds Tab -->
          <div v-if="activeTab === 'rounds'" class="rounds-tab">
            <div v-if="rounds.length === 0" class="empty-state">
              <PhFlag :size="48" weight="duotone" class="empty-icon" />
              <p>No rounds scheduled yet.</p>
            </div>

            <div v-else class="rounds-list">
              <div
                v-for="round in rounds"
                :key="round.id"
                class="round-card"
                :class="{ 'is-completed': round.status === 'completed' }"
              >
                <div class="round-number">
                  <span class="round-num font-display">R{{ round.round_number }}</span>
                  <span class="round-status-badge" :class="`status-${round.status}`">
                    {{ round.status_label }}
                  </span>
                </div>

                <div class="round-info">
                  <h4 class="round-name">
                    {{ round.name || `Round ${round.round_number}` }}
                  </h4>
                  <div v-if="round.track_name" class="round-track">
                    <PhMapPin :size="14" />
                    <span>{{ round.track_name }}</span>
                    <span v-if="round.track_layout" class="track-layout">
                      - {{ round.track_layout }}
                    </span>
                  </div>
                  <div v-if="round.scheduled_at" class="round-date">
                    <PhCalendar :size="14" />
                    <span>{{ formatDate(round.scheduled_at) }}</span>
                  </div>
                </div>

                <div v-if="round.races.length > 0" class="round-races">
                  <div
                    v-for="race in round.races"
                    :key="race.id"
                    class="race-badge"
                    :class="`race-type-${race.race_type}`"
                  >
                    {{ race.name || `Race ${race.race_number}` }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  PhMapPin,
  PhCalendar,
  PhWarningCircle,
  PhUsers,
  PhFlagCheckered,
  PhCalendarDots,
  PhPlay,
  PhCheck,
  PhClock,
  PhChartLine,
  PhFlag,
} from '@phosphor-icons/vue';
import StandingsTable from '@public/components/leagues/StandingsTable.vue';
import PageHeader from '@public/components/common/layout/PageHeader.vue';
import VrlBreadcrumbs, {
  type BreadcrumbItem,
} from '@public/components/common/navigation/VrlBreadcrumbs.vue';
import VrlStatsCard from '@public/components/common/cards/VrlStatsCard.vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import VrlTabs, { type TabItem } from '@public/components/common/navigation/VrlTabs.vue';
import VrlCard from '@public/components/common/cards/VrlCard.vue';
import VrlFilterChips from '@public/components/common/forms/VrlFilterChips.vue';
import { publicApi, NotFoundError, NetworkError, ApiError } from '@public/services/publicApi';
import type {
  PublicSeason,
  PublicRound,
  SeasonStandingDriver,
  SeasonStandingDivision,
} from '@public/types/public';

const route = useRoute();

// AbortController for request cleanup
const abortController = ref<AbortController | null>(null);

// State
const loading = ref(true);
const error = ref<string | null>(null);
const leagueName = ref('');
const leagueLogoUrl = ref<string | null>(null);
const leagueHeaderImageUrl = ref<string | null>(null);
const competitionName = ref('');
const season = ref<PublicSeason | null>(null);
const rounds = ref<PublicRound[]>([]);
const standings = ref<SeasonStandingDriver[] | SeasonStandingDivision[]>([]);
const hasDivisions = ref(false);
const activeTab = ref<'standings' | 'rounds'>('standings');
const activeStandingsTab = ref(0);

// Filter chip options for tab navigation
const tabOptions = [
  { label: 'Standings', value: 'standings' },
  { label: 'Rounds', value: 'rounds' },
];

// Computed
const seasonLabel = computed(() => {
  if (!leagueName.value || !competitionName.value) return '';
  return `${leagueName.value} - ${competitionName.value}`;
});

const pageHeaderBackgroundImage = computed(() => {
  // Use season banner, or fall back to league header image
  return season.value?.banner_url || leagueHeaderImageUrl.value || undefined;
});

const standingsTabs = computed<TabItem[]>(() => {
  if (!hasDivisions.value) {
    return [{ label: 'All Drivers' }];
  }

  const divisions = standings.value as SeasonStandingDivision[];
  return divisions.map((division) => ({
    label: division.division_name,
    count: division.drivers.length,
  }));
});

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: 'Home', to: '/' },
  { label: 'Leagues', to: '/leagues' },
  { label: leagueName.value || 'League', to: `/leagues/${route.params.slug}` },
  { label: season.value?.name || 'Season' },
]);

const roundHeaders = computed(() => {
  return rounds.value.map((r) => ({
    round_id: r.id,
    round_number: r.round_number,
    name: r.name || `R${r.round_number}`,
  }));
});

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getSeasonStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return PhPlay;
    case 'completed':
      return PhCheck;
    case 'setup':
      return PhClock;
    default:
      return PhClock;
  }
};

const getSeasonBadgeVariant = (status: string): 'active' | 'completed' | 'upcoming' => {
  switch (status) {
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'setup':
      return 'upcoming';
    default:
      return 'completed';
  }
};

const fetchSeasonData = async () => {
  const leagueSlug = route.params.slug as string;
  const seasonSlug = route.params.seasonSlug as string;

  loading.value = true;
  error.value = null;

  // Create new AbortController for this request
  abortController.value = new AbortController();

  try {
    const data = await publicApi.fetchSeasonDetail(
      leagueSlug,
      seasonSlug,
      abortController.value.signal,
    );

    // Map API response to component state
    leagueName.value = data.league.name;
    leagueLogoUrl.value = data.league.logo_url || null;
    leagueHeaderImageUrl.value = data.league.header_image_url || null;
    competitionName.value = data.competition.name;
    season.value = data.season;
    rounds.value = data.rounds;
    standings.value = data.standings;
    hasDivisions.value = data.has_divisions;
  } catch (e) {
    // Handle different error types with specific messages
    if (e instanceof NotFoundError) {
      error.value = 'Season not found. It may have been removed or the URL is incorrect.';
    } else if (e instanceof NetworkError) {
      error.value = 'Unable to connect to the server. Please check your internet connection.';
    } else if (e instanceof ApiError) {
      error.value = e.message;
    } else if (e instanceof Error) {
      error.value = e.message;
    } else {
      error.value = 'Unable to load season. Please try again later.';
    }
    console.error('Failed to fetch season:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSeasonData();
});

// Cleanup: abort any in-flight requests when component unmounts
onUnmounted(() => {
  if (abortController.value) {
    abortController.value.abort();
  }
});
</script>

<style scoped>
/* Page */
.season-page {
  background: var(--color-carbon);
}

/* Loading & Error States */
.loading-container,
.error-container {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl);
  text-align: center;
  padding-top: calc(var(--header-height) + var(--space-4xl));
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--color-tarmac);
  border-top-color: var(--color-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-lg);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  color: var(--color-safety);
  margin-bottom: var(--space-lg);
}

/* Breadcrumbs Section */
.breadcrumbs-section {
  background: var(--color-asphalt);
  border-bottom: 1px solid var(--color-tarmac);
}

/* Season Badges (in header social-links slot) */
.season-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: flex-start;
}

@media (max-width: 768px) {
  .season-badges {
    width: 100%;
  }
}

/* Stats Section */
.stats-section {
  background: var(--color-asphalt);
  border-bottom: 1px solid var(--color-tarmac);
  padding: var(--space-xl) 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Tabs */
.tabs-section {
  background: var(--color-asphalt);
  border-bottom: 1px solid var(--color-tarmac);
  position: sticky;
  top: var(--header-height);
  z-index: 50;
}

/* Tab Content */
.tab-content {
  background: var(--color-carbon);
}

.empty-state {
  text-align: center;
  padding: var(--space-4xl);
}

.empty-icon {
  color: var(--color-gold);
  opacity: 0.3;
  margin-bottom: var(--space-lg);
}

/* Standings */
.standings-card {
  overflow-x: auto;
}

.divisions-tabs {
  width: 100%;
}

/* Rounds */
.rounds-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.round-card {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding: var(--space-lg);
  background: var(--color-asphalt);
  border: 1px solid var(--color-tarmac);
  transition: all var(--duration-fast);
}

.round-card:hover {
  border-color: var(--color-gold-muted);
}

.round-card.is-completed {
  opacity: 0.7;
}

.round-card.is-completed:hover {
  opacity: 1;
}

.round-number {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  min-width: 80px;
}

.round-num {
  font-size: 2rem;
  color: var(--color-gold);
}

.round-status-badge {
  font-family: var(--font-display);
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 2px 6px;
  background: var(--color-tarmac);
  color: var(--color-barrier);
}

.round-status-badge.status-completed {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.round-status-badge.status-in_progress {
  background: rgba(212, 168, 83, 0.2);
  color: var(--color-gold);
}

.round-status-badge.status-scheduled {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.round-info {
  flex: 1;
}

.round-name {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-pit-white);
  margin-bottom: var(--space-sm);
}

.round-track,
.round-date {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.75rem;
  color: var(--color-barrier);
  margin-bottom: var(--space-xs);
}

.track-layout {
  color: var(--color-gravel);
}

.round-races {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.race-badge {
  font-family: var(--font-display);
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-tarmac);
  color: var(--color-barrier);
}

.race-badge.race-type-feature {
  background: rgba(212, 168, 83, 0.2);
  color: var(--color-gold);
}

.race-badge.race-type-sprint {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.race-badge.race-type-qualifying {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.race-badge.race-type-endurance {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .round-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .round-number {
    flex-direction: row;
    gap: var(--space-md);
    min-width: auto;
    margin-bottom: var(--space-sm);
  }

  .round-races {
    margin-top: var(--space-md);
  }
}
</style>
