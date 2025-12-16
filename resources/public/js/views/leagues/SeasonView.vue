<template>
  <div class="season-page mb-12">
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
            <div v-else-if="!hasDivisions" class="standings-section">
              <VrlCard :hoverable="false" class="standings-card">
                <StandingsTable
                  :drivers="standings as SeasonStandingDriver[]"
                  :rounds="roundHeaders"
                />
              </VrlCard>

              <!-- Points Progression Chart -->
              <PointsProgressionChart
                :drivers="standings as SeasonStandingDriver[]"
                :rounds="roundHeaders"
              />
            </div>

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
                <div class="division-standings-section">
                  <StandingsTable :drivers="division.drivers" :rounds="roundHeaders" />

                  <!-- Points Progression Chart for this division -->
                  <PointsProgressionChart :drivers="division.drivers" :rounds="roundHeaders" />
                </div>
              </template>
            </VrlTabs>
          </div>

          <!-- Rounds Tab -->
          <div v-if="activeTab === 'rounds'" class="rounds-tab">
            <div v-if="rounds.length === 0" class="empty-state">
              <PhFlag :size="48" weight="duotone" class="empty-icon" />
              <p>No rounds scheduled yet.</p>
            </div>

            <!-- Accordion for Rounds -->
            <VrlAccordion
              v-else
              v-model="openRounds"
              :items="accordionItems"
              :multiple="true"
              class="rounds-accordion"
              @item-toggle="onRoundToggle"
            >
              <template v-for="(round, index) in rounds" :key="round.id" #[`item-${index}`]>
                <!-- Round Content -->
                <div v-if="round.races && round.races.length > 0" class="round-content">
                  <!-- Round-level tabs: Standings + All races + aggregate views -->
                  <VrlTabs
                    :tabs="getRoundTabs(round)"
                    :model-value="activeRoundTabs.get(round.id) || 0"
                    class="round-tabs"
                    @tab-change="(tabIndex: number) => onRoundTabChange(tabIndex, round)"
                  >
                    <!-- Standings Tab (index 0) -->
                    <template #[getStandingsTabSlot()]>
                      <div
                        v-if="
                          !round.round_standings?.standings ||
                          round.round_standings.standings.length === 0
                        "
                        class="empty-state-small"
                      >
                        <PhChartLine :size="32" weight="duotone" class="empty-icon-small" />
                        <p>No standings available for this round yet.</p>
                      </div>

                      <!-- Check if we have divisions (check first item for division_id) -->
                      <template
                        v-else-if="
                          hasDivisions &&
                          Array.isArray(round.round_standings.standings) &&
                          round.round_standings.standings.length > 0 &&
                          round.round_standings.standings[0] !== undefined &&
                          'division_id' in round.round_standings.standings[0]
                        "
                      >
                        <VrlTabs
                          :tabs="
                            (round.round_standings.standings as RoundStandingDivision[]).map(
                              (div) => ({
                                label: div.division_name,
                                count: div.results.length,
                              }),
                            )
                          "
                          class="division-tabs"
                        >
                          <template
                            v-for="(division, divIndex) in round.round_standings
                              .standings as RoundStandingDivision[]"
                            :key="division.division_id"
                            #[`tab-${divIndex}`]
                          >
                            <RoundStandingsTable
                              :standings="division.results"
                              :show-race-points="roundHasRacePoints(round)"
                            />
                          </template>
                        </VrlTabs>
                      </template>

                      <!-- No divisions - show flat standings -->
                      <RoundStandingsTable
                        v-else
                        :standings="round.round_standings.standings as RoundStandingDriver[]"
                        :show-race-points="roundHasRacePoints(round)"
                      />
                    </template>

                    <!-- Individual Race Tabs (one for each race, starting at index 1) -->
                    <template
                      v-for="(race, raceIndex) in round.races"
                      :key="`race-${race.id}`"
                      #[getRaceTabSlot(raceIndex)]
                    >
                      <!-- Loading State -->
                      <div v-if="raceResultsLoading.get(race.id)" class="results-loading-state">
                        <div class="loading-spinner-small"></div>
                        <p>Loading race results...</p>
                      </div>

                      <!-- Error State -->
                      <div v-else-if="raceResultsError.get(race.id)" class="results-error-state">
                        <PhWarningCircle :size="32" weight="duotone" class="error-icon-small" />
                        <p>{{ raceResultsError.get(race.id) }}</p>
                      </div>

                      <!-- Race Results -->
                      <div v-else-if="raceResults.get(race.id)" class="race-results-container">
                        <!-- Check if we have divisions -->
                        <template v-if="raceResults.get(race.id)!.has_divisions">
                          <!-- Division tabs for results -->
                          <VrlTabs
                            :tabs="
                              (raceResults.get(race.id)!.results as PublicRaceResultDivision[]).map(
                                (div) => ({
                                  label: div.division_name,
                                  count: div.results.length,
                                }),
                              )
                            "
                            class="division-tabs"
                          >
                            <template
                              v-for="(division, divIndex) in raceResults.get(race.id)!
                                .results as PublicRaceResultDivision[]"
                              :key="division.division_id"
                              #[`tab-${divIndex}`]
                            >
                              <RaceResultsTable
                                :results="division.results"
                                :is-qualifier="raceResults.get(race.id)!.race.is_qualifier"
                                :show-points="raceResults.get(race.id)!.race.race_points"
                              />
                            </template>
                          </VrlTabs>
                        </template>

                        <!-- No divisions - show flat results -->
                        <RaceResultsTable
                          v-else
                          :results="raceResults.get(race.id)!.results as PublicRaceResult[]"
                          :is-qualifier="raceResults.get(race.id)!.race.is_qualifier"
                          :show-points="raceResults.get(race.id)!.race.race_points"
                        />
                      </div>

                      <!-- No results yet -->
                      <div v-else class="results-placeholder">
                        <PhFlagCheckered :size="32" weight="duotone" class="placeholder-icon" />
                        <p class="placeholder-text">No results available yet</p>
                        <p class="placeholder-subtext">
                          Results will appear once the race is completed
                        </p>
                      </div>
                    </template>

                    <!-- All Times Tab (after all race tabs) -->
                    <template v-if="getAllTimesTabIndex(round) >= 0" #[getAllTimesTabSlot(round)]>
                      <div v-if="!hasAnyTimeResults(round)" class="empty-state-small">
                        <PhFlagCheckered :size="32" weight="duotone" class="empty-icon-small" />
                        <p>No time results available for this round yet.</p>
                      </div>

                      <!-- Combined times table with all three time categories -->
                      <div v-else class="aggregate-results-content">
                        <CombinedTimesTable
                          :qualifying-results="round.qualifying_results || []"
                          :fastest-lap-results="round.fastest_lap_results || []"
                          :race-time-results="round.race_time_results || []"
                          :show-division="hasDivisions"
                        />
                      </div>
                    </template>
                  </VrlTabs>
                </div>

                <!-- No races message -->
                <div v-else class="no-races-message">
                  <PhCalendarX :size="24" weight="duotone" />
                  <p>No races scheduled for this round yet.</p>
                </div>
              </template>
            </VrlAccordion>
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
  PhWarningCircle,
  PhUsers,
  PhFlagCheckered,
  PhCalendarDots,
  PhPlay,
  PhCheck,
  PhClock,
  PhChartLine,
  PhFlag,
  PhCalendarX,
} from '@phosphor-icons/vue';
import StandingsTable from '@public/components/leagues/StandingsTable.vue';
import RaceResultsTable from '@public/components/leagues/RaceResultsTable.vue';
import CombinedTimesTable from '@public/components/leagues/CombinedTimesTable.vue';
import RoundStandingsTable from '@public/components/leagues/RoundStandingsTable.vue';
import PointsProgressionChart from '@public/components/leagues/PointsProgressionChart.vue';
import PageHeader from '@public/components/common/layout/PageHeader.vue';
import VrlBreadcrumbs, {
  type BreadcrumbItem,
} from '@public/components/common/navigation/VrlBreadcrumbs.vue';
import VrlStatsCard from '@public/components/common/cards/VrlStatsCard.vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import VrlTabs, { type TabItem } from '@public/components/common/navigation/VrlTabs.vue';
import VrlCard from '@public/components/common/cards/VrlCard.vue';
import VrlFilterChips from '@public/components/common/forms/VrlFilterChips.vue';
import VrlAccordion, {
  type AccordionItem,
} from '@public/components/common/data-display/VrlAccordion.vue';
import { publicApi, NotFoundError, NetworkError, ApiError } from '@public/services/publicApi';
import type {
  PublicSeason,
  PublicRound,
  SeasonStandingDriver,
  SeasonStandingDivision,
  PublicRaceResultsResponse,
  PublicRaceResult,
  PublicRaceResultDivision,
  RoundStandingDriver,
  RoundStandingDivision,
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
const openRounds = ref<number[]>([]);

// Race results state - keyed by raceId
const raceResults = ref<Map<number, PublicRaceResultsResponse>>(new Map());
const raceResultsLoading = ref<Map<number, boolean>>(new Map());
const raceResultsError = ref<Map<number, string>>(new Map());
const activeRoundTabs = ref<Map<number, number>>(new Map()); // tracks active tab per round

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

// Accordion items for rounds
const accordionItems = computed<AccordionItem[]>(() => {
  return rounds.value.map((round) => ({
    id: round.id,
    title: round.name || `Round ${round.round_number}`,
    subtitle: formatRoundDetails(round) || undefined,
    badge: round.status_label,
    badgeVariant: getRoundBadgeVariant(round.status),
    meta: round.scheduled_at ? formatDate(round.scheduled_at) : undefined,
    disabled: false,
  }));
});

// Get badge variant for round status
const getRoundBadgeVariant = (status: string): 'active' | 'completed' | 'upcoming' | 'default' => {
  switch (status) {
    case 'in_progress':
      return 'active';
    case 'completed':
      return 'completed';
    case 'scheduled':
      return 'upcoming';
    default:
      return 'default';
  }
};

// Format round details for subtitle (circuit/track info only, no date)
const formatRoundDetails = (round: PublicRound): string => {
  // Circuit/Track Information
  // Priority: circuit_name (with country) > track_name
  if (round.circuit_name) {
    // Show circuit name with country code if available
    let locationInfo = round.circuit_name;
    if (round.circuit_country) {
      locationInfo += ` (${round.circuit_country})`;
    }

    // Add track name with layout if different from circuit name
    if (round.track_name && round.track_name !== round.circuit_name) {
      locationInfo += ` - ${round.track_name}`;
      if (round.track_layout) {
        locationInfo += ` (${round.track_layout})`;
      }
    } else if (round.track_layout) {
      // Just add layout if track_name is same as circuit_name
      locationInfo += ` (${round.track_layout})`;
    }

    return locationInfo;
  } else if (round.track_name) {
    // Fallback to track_name if no circuit_name
    let trackInfo = round.track_name;
    if (round.track_layout) {
      trackInfo += ` (${round.track_layout})`;
    }
    return trackInfo;
  }

  return '';
};

// Get tabs for a specific round: Standings + all races + aggregate views
const getRoundTabs = (round: PublicRound): TabItem[] => {
  if (!round.races || round.races.length === 0) {
    return [];
  }

  const tabs: TabItem[] = [];

  // Add Standings tab as FIRST tab (index 0)
  tabs.push({ label: 'Standings' });

  // Add tabs for each individual race (starting at index 1)
  round.races.forEach((race) => {
    // Build a descriptive label based on race type
    let label = race.name;

    if (!label) {
      // Check if this is a qualifier race first
      if (race.is_qualifier) {
        label = 'Qualifying';
      } else {
        // Generate label based on race type if no custom name
        switch (race.race_type) {
          case 'feature':
            label = 'Race';
            break;
          case 'sprint':
            label = 'Sprint';
            break;
          case 'endurance':
            label = 'Endurance';
            break;
          default:
            label = `Race ${race.race_number}`;
        }
      }
    }

    tabs.push({
      label,
      count: undefined,
      disabled: false,
    });
  });

  // Add aggregate "All Times" tab at the same level
  tabs.push({ label: 'All Times' });

  return tabs;
};

// Helper functions to get tab indices (accounting for Standings at index 0)
// Race tabs: Standings (0) + race index, so index = raceIndex + 1
const getRaceTabIndex = (raceIndex: number): number => {
  return raceIndex + 1;
};

// All Times tab: Standings (0) + all races, so index = 1 + races.length
const getAllTimesTabIndex = (round: PublicRound): number => {
  return round.races ? round.races.length + 1 : -1;
};

// Helper functions to get slot names for tabs
const getStandingsTabSlot = (): string => {
  return 'tab-0';
};

const getRaceTabSlot = (raceIndex: number): string => {
  return `tab-${getRaceTabIndex(raceIndex)}`;
};

const getAllTimesTabSlot = (round: PublicRound): string => {
  return `tab-${getAllTimesTabIndex(round)}`;
};

// Helper function to check if round has any races with race points enabled
const roundHasRacePoints = (round: PublicRound): boolean => {
  if (!round.races || round.races.length === 0) return false;
  return round.races.some((race) => race.race_points === true);
};

// Get aggregate results directly from round object for the combined times table
const hasAnyTimeResults = (round: PublicRound): boolean => {
  return Boolean(
    (round.qualifying_results && round.qualifying_results.length > 0) ||
      (round.fastest_lap_results && round.fastest_lap_results.length > 0) ||
      (round.race_time_results && round.race_time_results.length > 0),
  );
};

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

// Fetch race results for a specific race
const fetchRaceResults = async (raceId: number) => {
  // Don't refetch if already loaded or currently loading
  if (raceResults.value.has(raceId) || raceResultsLoading.value.get(raceId)) {
    return;
  }

  raceResultsLoading.value.set(raceId, true);
  raceResultsError.value.delete(raceId);

  try {
    const data = await publicApi.fetchRaceResults(raceId, abortController.value?.signal);
    raceResults.value.set(raceId, data);
  } catch (e) {
    let errorMsg = 'Failed to load race results';

    if (e instanceof NotFoundError) {
      errorMsg = 'Race results not found';
    } else if (e instanceof NetworkError) {
      errorMsg = 'Network error loading results';
    } else if (e instanceof ApiError) {
      errorMsg = e.message;
    }

    raceResultsError.value.set(raceId, errorMsg);
    console.error('Failed to fetch race results:', e);
  } finally {
    raceResultsLoading.value.set(raceId, false);
  }
};

// Handle round toggle (accordion expand/collapse)
const onRoundToggle = (index: number, isOpen: boolean) => {
  if (!isOpen) return; // Only act when opening

  const round = rounds.value[index];
  if (!round || !round.races || round.races.length === 0) return;

  // When a round is opened, initialize the active tab to 0 (Standings tab) if not set
  if (!activeRoundTabs.value.has(round.id)) {
    activeRoundTabs.value.set(round.id, 0);
  }

  // Note: Standings tab (index 0) doesn't need to fetch anything - data is already in round object
  // Race results will be fetched when user clicks on a race tab
};

// Handle round tab change to fetch results when needed
const onRoundTabChange = (tabIndex: number, round: PublicRound) => {
  if (!round.races) return;

  // Store the active tab for this round
  activeRoundTabs.value.set(round.id, tabIndex);

  // Tab indices:
  // 0 = Standings (no fetch needed)
  // 1 to numRaces = Individual race tabs (fetch needed)
  // numRaces+1 onwards = Aggregate tabs (no fetch needed)

  const numRaces = round.races.length;

  // Check if this is a race tab (indices 1 to numRaces)
  if (tabIndex >= 1 && tabIndex <= numRaces) {
    // This is a race tab - fetch results
    // Race index is tabIndex - 1 (because Standings is at index 0)
    const race = round.races[tabIndex - 1];
    if (race) {
      fetchRaceResults(race.id);
    }
  }
  // Standings tab (index 0) and aggregate tabs don't need to fetch - data already loaded
};

const fetchSeasonData = async () => {
  const leagueSlug = route.params.slug as string;
  const seasonSlug = route.params.seasonSlug as string;

  loading.value = true;
  error.value = null;

  // Abort existing request before creating new AbortController
  if (abortController.value) {
    abortController.value.abort();
  }
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

// Cleanup: abort any in-flight requests and clear maps when component unmounts
onUnmounted(() => {
  if (abortController.value) {
    abortController.value.abort();
  }
  // Clear maps to prevent memory leaks
  raceResults.value.clear();
  raceResultsLoading.value.clear();
  raceResultsError.value.clear();
  activeRoundTabs.value.clear();
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
.standings-section {
  width: 100%;
}

.standings-card {
  overflow-x: auto;
}

.division-standings-section {
  width: 100%;
}

.divisions-tabs {
  width: 100%;
}

/* Rounds Accordion */
.rounds-accordion {
  width: 100%;
}

/* Remove padding from accordion body for rounds */
.rounds-accordion :deep(.accordion-panel-content) {
  padding: 0;
  border-top: none;
}

/* Aggregate Results Tabs */
.aggregate-results-tab {
  width: 100%;
}

.results-card {
  overflow-x: auto;
}

.round-tabs {
  background: transparent;
  border: none;
}

.aggregate-results-content {
  margin-top: var(--space-md);
}

/* Race Info Header */
.race-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-tarmac);
}

.race-type-title {
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-pit-white);
  margin: 0;
}

.race-meta {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

/* Results States */
.results-placeholder,
.results-loading-state,
.results-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl) var(--space-xl);
  text-align: center;
  background: var(--color-carbon);
  border: 2px dashed var(--color-tarmac);
  border-radius: 8px;
}

.results-loading-state,
.results-error-state {
  border: 2px solid var(--color-tarmac);
}

.placeholder-icon {
  color: var(--color-gold);
  opacity: 0.3;
  margin-bottom: var(--space-lg);
}

.placeholder-text {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--color-pit-white);
  margin: 0 0 var(--space-sm);
}

.placeholder-subtext {
  font-size: 0.875rem;
  color: var(--color-barrier);
  margin: 0;
}

.loading-spinner-small {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-tarmac);
  border-top-color: var(--color-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-md);
}

.error-icon-small {
  color: var(--color-safety);
  margin-bottom: var(--space-md);
}

.results-loading-state p,
.results-error-state p {
  font-size: 0.875rem;
  color: var(--color-barrier);
  margin: 0;
}

/* No Races Message */
.no-races-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-2xl);
  text-align: center;
  color: var(--color-barrier);
  background: var(--color-carbon);
  border-radius: 4px;
}

.no-races-message svg {
  color: var(--color-gold);
  opacity: 0.5;
}

.no-races-message p {
  margin: 0;
  font-size: 0.875rem;
}

/* Empty State Small (for nested tabs) */
.empty-state-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-lg);
  text-align: center;
  background: var(--color-carbon);
  border: 2px dashed var(--color-tarmac);
  border-radius: 8px;
  margin-top: var(--space-md);
}

.empty-icon-small {
  color: var(--color-gold);
  opacity: 0.3;
  margin-bottom: var(--space-md);
}

.empty-state-small p {
  font-size: 0.875rem;
  color: var(--color-barrier);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .race-info-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .results-placeholder {
    padding: var(--space-2xl) var(--space-md);
  }

  .placeholder-text {
    font-size: 0.875rem;
  }

  .placeholder-subtext {
    font-size: 0.75rem;
  }
}
</style>
