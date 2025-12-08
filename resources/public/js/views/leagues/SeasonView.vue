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
      <!-- Season Hero -->
      <section class="season-hero">
        <div class="season-hero-background">
          <img
            v-if="season.banner_url"
            :src="season.banner_url"
            :alt="season.name"
            class="season-hero-image"
          />
          <div v-else class="season-hero-placeholder pattern-carbon"></div>
          <div class="season-hero-overlay"></div>
        </div>

        <div class="container-racing season-hero-content">
          <!-- Breadcrumb -->
          <nav class="breadcrumb">
            <router-link to="/leagues" class="breadcrumb-link">Leagues</router-link>
            <PhCaretRight :size="12" class="breadcrumb-separator" />
            <router-link :to="`/leagues/${route.params.slug}`" class="breadcrumb-link">
              {{ leagueName }}
            </router-link>
            <PhCaretRight :size="12" class="breadcrumb-separator" />
            <span class="breadcrumb-current">{{ season.name }}</span>
          </nav>

          <div class="season-hero-info">
            <div v-if="season.logo_url" class="season-logo">
              <img :src="season.logo_url" :alt="season.name" />
            </div>

            <div class="season-details">
              <div class="season-meta">
                <span class="status-badge" :class="`status-${season.status}`">
                  {{ season.status }}
                </span>
                <span v-if="season.car_class" class="car-class-badge">
                  {{ season.car_class }}
                </span>
              </div>

              <h1 class="season-name">{{ season.name }}</h1>
              <p v-if="season.description" class="season-description">{{ season.description }}</p>
            </div>
          </div>

          <div class="season-stats-bar">
            <div class="stat-item">
              <span class="stat-value font-data">{{ season.stats.active_drivers }}</span>
              <span class="stat-label">Active Drivers</span>
            </div>
            <div class="stat-item">
              <span class="stat-value font-data"
                >{{ season.stats.completed_races }}/{{ season.stats.total_races }}</span
              >
              <span class="stat-label">Races Completed</span>
            </div>
            <div class="stat-item">
              <span class="stat-value font-data">{{ rounds.length }}</span>
              <span class="stat-label">Rounds</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabs Navigation -->
      <section class="tabs-section">
        <div class="container-racing">
          <div class="tabs-nav">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'standings' }"
              @click="activeTab = 'standings'"
            >
              <PhChartLine :size="18" />
              Standings
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'rounds' }"
              @click="activeTab = 'rounds'"
            >
              <PhFlag :size="18" />
              Rounds
            </button>
          </div>
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
            <div v-else-if="!hasDivisions" class="standings-wrapper">
              <StandingsTable
                :drivers="standings as SeasonStandingDriver[]"
                :rounds="roundHeaders"
              />
            </div>

            <!-- Division Standings -->
            <div v-else class="divisions-standings">
              <div
                v-for="division in standings as SeasonStandingDivision[]"
                :key="division.division_id"
                class="division-section"
              >
                <h3 class="division-name">{{ division.division_name }}</h3>
                <StandingsTable :drivers="division.drivers" :rounds="roundHeaders" />
              </div>
            </div>
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  PhCaretRight,
  PhChartLine,
  PhFlag,
  PhMapPin,
  PhCalendar,
  PhWarningCircle,
} from '@phosphor-icons/vue';
import StandingsTable from '@public/components/leagues/StandingsTable.vue';
import type {
  PublicSeason,
  PublicRound,
  SeasonStandingDriver,
  SeasonStandingDivision,
} from '@public/types/public';

const route = useRoute();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const leagueName = ref('');
const season = ref<PublicSeason | null>(null);
const rounds = ref<PublicRound[]>([]);
const standings = ref<SeasonStandingDriver[] | SeasonStandingDivision[]>([]);
const hasDivisions = ref(false);
const activeTab = ref<'standings' | 'rounds'>('standings');

// Computed
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

const fetchSeasonData = async () => {
  void route.params.slug; // leagueSlug - will be used for API call
  void route.params.seasonSlug; // seasonSlug - will be used for API call

  loading.value = true;
  error.value = null;

  try {
    // TODO: Replace with actual API calls using route.params.slug and route.params.seasonSlug
    await new Promise((resolve) => setTimeout(resolve, 500));

    leagueName.value = 'GT7 Racing League';

    season.value = {
      id: 1,
      name: 'Season 3',
      slug: 'season-3',
      car_class: 'GT3',
      description:
        'The third season of our GT3 Championship. Featuring 8 rounds across iconic circuits.',
      logo_url: '',
      banner_url: null,
      status: 'active',
      is_active: true,
      is_completed: false,
      race_divisions_enabled: false,
      stats: {
        total_drivers: 18,
        active_drivers: 16,
        total_races: 8,
        completed_races: 4,
      },
    };

    rounds.value = [
      {
        id: 1,
        round_number: 1,
        name: 'Spa-Francorchamps GP',
        slug: 'round-1',
        scheduled_at: '2024-02-04T19:00:00Z',
        track_name: 'Circuit de Spa-Francorchamps',
        track_layout: 'Grand Prix',
        status: 'completed',
        status_label: 'Completed',
        races: [
          {
            id: 1,
            race_number: 1,
            name: 'Qualifying',
            race_type: 'qualifying',
            status: 'completed',
          },
          {
            id: 2,
            race_number: 2,
            name: 'Feature Race',
            race_type: 'feature',
            status: 'completed',
          },
        ],
      },
      {
        id: 2,
        round_number: 2,
        name: 'Nürburgring Nordschleife',
        slug: 'round-2',
        scheduled_at: '2024-02-11T19:00:00Z',
        track_name: 'Nürburgring',
        track_layout: 'Nordschleife',
        status: 'completed',
        status_label: 'Completed',
        races: [
          { id: 3, race_number: 1, name: 'Sprint', race_type: 'sprint', status: 'completed' },
          { id: 4, race_number: 2, name: 'Feature', race_type: 'feature', status: 'completed' },
        ],
      },
      {
        id: 3,
        round_number: 3,
        name: 'Suzuka Circuit',
        slug: 'round-3',
        scheduled_at: '2024-02-18T19:00:00Z',
        track_name: 'Suzuka Circuit',
        track_layout: 'Full Course',
        status: 'completed',
        status_label: 'Completed',
        races: [
          {
            id: 5,
            race_number: 1,
            name: 'Feature Race',
            race_type: 'feature',
            status: 'completed',
          },
        ],
      },
      {
        id: 4,
        round_number: 4,
        name: 'Interlagos',
        slug: 'round-4',
        scheduled_at: '2024-02-25T19:00:00Z',
        track_name: 'Autódromo José Carlos Pace',
        track_layout: 'Grand Prix',
        status: 'completed',
        status_label: 'Completed',
        races: [
          {
            id: 6,
            race_number: 1,
            name: 'Feature Race',
            race_type: 'feature',
            status: 'completed',
          },
        ],
      },
      {
        id: 5,
        round_number: 5,
        name: 'Mount Panorama',
        slug: 'round-5',
        scheduled_at: '2024-03-03T19:00:00Z',
        track_name: 'Mount Panorama Circuit',
        track_layout: null,
        status: 'scheduled',
        status_label: 'Scheduled',
        races: [
          { id: 7, race_number: 1, name: 'Endurance', race_type: 'endurance', status: 'scheduled' },
        ],
      },
    ];

    // Mock standings data
    hasDivisions.value = false;
    standings.value = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Max Racer',
        total_points: 98,
        rounds: [
          { round_id: 1, round_number: 1, points: 25, has_pole: true, has_fastest_lap: true },
          { round_id: 2, round_number: 2, points: 25, has_pole: false, has_fastest_lap: false },
          { round_id: 3, round_number: 3, points: 25, has_pole: true, has_fastest_lap: false },
          { round_id: 4, round_number: 4, points: 23, has_pole: false, has_fastest_lap: true },
        ],
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Speed King',
        total_points: 82,
        rounds: [
          { round_id: 1, round_number: 1, points: 18, has_pole: false, has_fastest_lap: false },
          { round_id: 2, round_number: 2, points: 18, has_pole: true, has_fastest_lap: true },
          { round_id: 3, round_number: 3, points: 21, has_pole: false, has_fastest_lap: true },
          { round_id: 4, round_number: 4, points: 25, has_pole: true, has_fastest_lap: false },
        ],
      },
      {
        position: 3,
        driver_id: 3,
        driver_name: 'Turbo Tom',
        total_points: 71,
        rounds: [
          { round_id: 1, round_number: 1, points: 15, has_pole: false, has_fastest_lap: false },
          { round_id: 2, round_number: 2, points: 15, has_pole: false, has_fastest_lap: false },
          { round_id: 3, round_number: 3, points: 23, has_pole: false, has_fastest_lap: false },
          { round_id: 4, round_number: 4, points: 18, has_pole: false, has_fastest_lap: false },
        ],
      },
      {
        position: 4,
        driver_id: 4,
        driver_name: 'Fast Freddy',
        total_points: 58,
        rounds: [
          { round_id: 1, round_number: 1, points: 12, has_pole: false, has_fastest_lap: false },
          { round_id: 2, round_number: 2, points: 12, has_pole: false, has_fastest_lap: false },
          { round_id: 3, round_number: 3, points: 18, has_pole: false, has_fastest_lap: false },
          { round_id: 4, round_number: 4, points: 16, has_pole: false, has_fastest_lap: false },
        ],
      },
      {
        position: 5,
        driver_id: 5,
        driver_name: 'Drift Dave',
        total_points: 45,
        rounds: [
          { round_id: 1, round_number: 1, points: 10, has_pole: false, has_fastest_lap: false },
          { round_id: 2, round_number: 2, points: 10, has_pole: false, has_fastest_lap: false },
          { round_id: 3, round_number: 3, points: 15, has_pole: false, has_fastest_lap: false },
          { round_id: 4, round_number: 4, points: 10, has_pole: false, has_fastest_lap: false },
        ],
      },
    ];
  } catch (e) {
    error.value = 'Unable to load season. Please try again later.';
    console.error('Failed to fetch season:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSeasonData();
});
</script>

<style scoped>
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

/* Season Hero */
.season-hero {
  position: relative;
  padding-top: var(--header-height);
  min-height: 350px;
  display: flex;
  align-items: flex-end;
}

.season-hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.season-hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.season-hero-placeholder {
  width: 100%;
  height: 100%;
}

.season-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--color-carbon) 0%,
    rgba(10, 10, 10, 0.85) 40%,
    rgba(10, 10, 10, 0.5) 100%
  );
}

.season-hero-content {
  position: relative;
  z-index: 1;
  padding: var(--space-3xl) 0;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}

.breadcrumb-link {
  font-family: var(--font-display);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-barrier);
  text-decoration: none;
  transition: color var(--duration-fast);
}

.breadcrumb-link:hover {
  color: var(--color-gold);
}

.breadcrumb-separator {
  color: var(--color-tarmac);
}

.breadcrumb-current {
  font-family: var(--font-display);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-pit-white);
}

/* Season Hero Info */
.season-hero-info {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.season-logo {
  width: 80px;
  height: 80px;
  background: var(--color-asphalt);
  border: 2px solid var(--color-tarmac);
  flex-shrink: 0;
  overflow: hidden;
}

.season-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.season-meta {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.status-badge {
  font-family: var(--font-display);
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-tarmac);
  color: var(--color-barrier);
}

.status-badge.status-active {
  background: rgba(212, 168, 83, 0.2);
  color: var(--color-gold);
}

.status-badge.status-completed {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.car-class-badge {
  font-family: var(--font-data);
  font-size: 0.625rem;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-tarmac);
  color: var(--color-pit-white);
}

.season-name {
  font-size: clamp(1.5rem, 4vw, 2rem);
  margin-bottom: var(--space-sm);
}

.season-description {
  font-size: 0.875rem;
  color: var(--color-barrier);
  max-width: 600px;
}

/* Stats Bar */
.season-stats-bar {
  display: flex;
  gap: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-tarmac);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-pit-white);
}

.stat-label {
  font-size: 0.625rem;
  color: var(--color-barrier);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Tabs */
.tabs-section {
  background: var(--color-asphalt);
  border-bottom: 1px solid var(--color-tarmac);
  position: sticky;
  top: var(--header-height);
  z-index: 50;
}

.tabs-nav {
  display: flex;
  gap: var(--space-xs);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-display);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: var(--space-lg) var(--space-xl);
  background: transparent;
  border: none;
  color: var(--color-barrier);
  cursor: pointer;
  position: relative;
  transition: color var(--duration-fast);
}

.tab-btn:hover {
  color: var(--color-pit-white);
}

.tab-btn.active {
  color: var(--color-gold);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-gold);
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
.standings-wrapper {
  overflow-x: auto;
}

.divisions-standings {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
}

.division-section {
  background: var(--color-asphalt);
  padding: var(--space-lg);
  border: 1px solid var(--color-tarmac);
}

.division-name {
  font-size: 1rem;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-tarmac);
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
  .season-hero-info {
    flex-direction: column;
  }

  .season-stats-bar {
    flex-wrap: wrap;
    gap: var(--space-lg);
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
