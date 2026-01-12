<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { PhPlus, PhArrowRight, PhPencil } from '@phosphor-icons/vue';
import { Button } from '@app/components/common/buttons';
import BaseBadge from '@app/components/common/indicators/BaseBadge.vue';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';
import { getLeagueById } from '@app/services/leagueService';
import { usePageTitle } from '@app/composables/usePageTitle';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useSeasonStore } from '@app/stores/seasonStore';
import LeagueIdentityPanel from '@app/components/league/partials/LeagueIdentityPanel.vue';
import EditLeagueModal from '@app/components/league/modals/EditLeagueModal.vue';
import CompetitionFormDrawer from '@app/components/competition/CompetitionFormDrawer.vue';
import SeasonFormSplitModal from '@app/components/season/modals/SeasonFormSplitModal.vue';
import {
  ListContainer,
  ListRow,
  ListSectionHeader,
  ListRowStats,
  ListRowStat,
} from '@app/components/common/lists';
import ActivityLog from '@app/components/activity/ActivityLog.vue';
import type { League } from '@app/types/league';
import type { Season } from '@app/types/season';
import type { Competition } from '@app/types/competition';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const competitionStore = useCompetitionStore();
const seasonStore = useSeasonStore();

const league = ref<League | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showEditModal = ref(false);
const showSettingsModal = ref(false);
const showCompetitionDrawer = ref(false);
const selectedCompetition = ref<Competition | null>(null);
const isEditingCompetition = ref(false);
const showNewSeasonModal = ref(false);
const selectedCompetitionForNewSeason = ref<Competition | null>(null);

// Get league ID from route params
const leagueId = computed(() => route.params.id as string);
const leagueIdNumber = computed(() => {
  const parsed = parseInt(leagueId.value, 10);
  if (isNaN(parsed)) {
    console.error('Invalid league ID:', leagueId.value);
    return 0;
  }
  return parsed;
});

// Set dynamic page title based on league name
const pageTitle = computed(() => league.value?.name);
usePageTitle(pageTitle);

// Computed data for the dashboard
const competitions = computed(() => {
  return competitionStore.competitions.filter((c) => c.league_id === leagueIdNumber.value);
});

const activeSeasons = computed(() => {
  const leagueSeasons = seasonStore.seasons.filter((season) => {
    return season.competition?.league?.id === leagueIdNumber.value;
  });

  // Filter to active and setup seasons only
  return leagueSeasons.filter((s) => s.status === 'active' || s.status === 'setup');
});

const seasonsCount = computed(() => {
  const leagueSeasons = seasonStore.seasons.filter((season) => {
    return season.competition?.league?.id === leagueIdNumber.value;
  });
  return leagueSeasons.length;
});

onMounted(async () => {
  await loadLeague();
  await loadCompetitions();
  await loadSeasons();
});

async function loadLeague(): Promise<void> {
  if (!leagueId.value) {
    error.value = 'League ID is required';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    league.value = await getLeagueById(leagueId.value);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load league';
    error.value = errorMessage;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}

async function loadCompetitions(): Promise<void> {
  if (!leagueIdNumber.value) return;

  try {
    await competitionStore.fetchCompetitions(leagueIdNumber.value);
  } catch (err: unknown) {
    console.error('Failed to load competitions:', err);
  }
}

async function loadSeasons(): Promise<void> {
  try {
    // Fetch seasons for all competitions in this league (in parallel)
    // Use allSettled to handle partial failures gracefully
    const competitionIds = competitions.value.map((c) => c.id);
    const results = await Promise.allSettled(
      competitionIds.map((id) => seasonStore.fetchSeasons(id)),
    );

    // Log any failures for debugging
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`Failed to load seasons for ${failures.length} competition(s)`);
      failures.forEach((failure) => {
        if (failure.status === 'rejected') {
          console.error('Season fetch error:', failure.reason);
        }
      });
    }
  } catch (err: unknown) {
    console.error('Failed to load seasons:', err);
  }
}

function handleEditLeague(): void {
  showEditModal.value = true;
}

function handleSettings(): void {
  showSettingsModal.value = true;
}

function handleLeagueSaved(): void {
  showEditModal.value = false;
  showSettingsModal.value = false;
  loadLeague();
}

function handleNewSeason(competition: Competition): void {
  selectedCompetitionForNewSeason.value = competition;
  showNewSeasonModal.value = true;
}

function handleAddCompetition(): void {
  selectedCompetition.value = null;
  isEditingCompetition.value = false;
  showCompetitionDrawer.value = true;
}

function handleEditCompetition(competition: Competition): void {
  selectedCompetition.value = competition;
  isEditingCompetition.value = true;
  showCompetitionDrawer.value = true;
}

function handleCompetitionSaved(): void {
  showCompetitionDrawer.value = false;
  selectedCompetition.value = null;
  isEditingCompetition.value = false;
  loadCompetitions();
}

function handleSeasonSaved(): void {
  showNewSeasonModal.value = false;
  selectedCompetitionForNewSeason.value = null;
  loadSeasons();
}

function handleViewSeason(season: Season): void {
  if (!season.competition) return;

  router.push({
    name: 'season-detail',
    params: {
      leagueId: season.competition.league?.id || leagueIdNumber.value,
      competitionId: season.competition_id,
      seasonId: season.id,
    },
  });
}

function getSeasonIndicatorColor(season: Season): string {
  // Use competition's colour if available
  if (season.competition?.competition_colour) {
    try {
      const colorObj = JSON.parse(season.competition.competition_colour);
      if (
        typeof colorObj.r === 'number' &&
        typeof colorObj.g === 'number' &&
        typeof colorObj.b === 'number'
      ) {
        return `rgb(${colorObj.r}, ${colorObj.g}, ${colorObj.b})`;
      }
    } catch (error) {
      console.warn('Failed to parse competition colour:', error);
    }
  }

  // Default color based on status
  return season.status === 'active' ? 'var(--green)' : 'var(--cyan)';
}

function getSeasonRoundsProgress(season: Season): string {
  const total = season.stats?.total_races || 0;
  const completed = season.stats?.completed_races || 0;
  return `Round ${completed} of ${total}`;
}

/**
 * Get competition status class (active/idle)
 */
function getCompetitionStatusClass(competition: Competition): 'active' | 'idle' {
  return competition.stats.active_seasons > 0 ? 'active' : 'idle';
}
</script>

<template>
  <div class="flex h-full">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 p-6">
      <Skeleton width="100%" height="100vh" />
    </div>

    <!-- Error State -->
    <div v-else-if="error || !league" class="flex-1 flex items-center justify-center p-6">
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 max-w-md">
        <div class="flex flex-col items-center gap-4">
          <i class="pi pi-exclamation-triangle text-6xl text-[var(--red)]"></i>
          <h2 class="font-mono text-2xl font-semibold text-[var(--red)]">League Not Found</h2>
          <p class="text-[var(--text-secondary)] text-center">
            {{ error || 'The league you are looking for does not exist or has been removed.' }}
          </p>
          <Button
            label="Back to Leagues"
            variant="primary"
            @click="router.push({ name: 'home' })"
          />
        </div>
      </div>
    </div>

    <!-- Main Split-Panel Layout -->
    <template v-else>
      <!-- Left Panel - League Identity -->
      <LeagueIdentityPanel
        :league="league"
        :seasons-count="seasonsCount"
        @edit="handleEditLeague"
        @settings="handleSettings"
      />

      <!-- Right Panel - Dynamic Content -->
      <main class="flex-1 min-w-0 flex flex-col">
        <!-- Content Header -->
        <header
          class="flex items-center justify-between px-8 py-5 bg-[var(--bg-panel)] border-b border-[var(--border)]"
        >
          <h2
            class="font-mono text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"
          >
            <span class="text-[var(--cyan)]">//</span> DASHBOARD
          </h2>
        </header>

        <!-- Content Body -->
        <div class="flex-1 px-8 py-6 overflow-y-auto">
          <!-- Active Seasons Section -->
          <section v-if="activeSeasons.length > 0" class="mb-8">
            <ListSectionHeader title="Active Seasons" class="mb-4" />
            <ListContainer gap="12px">
              <ListRow
                v-for="season in activeSeasons"
                :key="season.id"
                clickable
                @click="handleViewSeason(season)"
              >
                <template #indicator>
                  <div
                    class="w-1 h-10 rounded-sm"
                    :style="{
                      backgroundColor: getSeasonIndicatorColor(season),
                      boxShadow:
                        season.status === 'active'
                          ? `0 0 8px ${getSeasonIndicatorColor(season)}`
                          : 'none',
                    }"
                  ></div>
                </template>

                <div class="flex-1 min-w-0">
                  <h3 class="font-mono text-[13px] font-semibold text-[var(--text-primary)] mb-1">
                    {{ season.name }}
                  </h3>
                  <div class="flex gap-4 text-xs text-[var(--text-muted)]">
                    <span class="flex items-center gap-1">
                      <i class="pi pi-trophy" style="font-size: 10px"></i>
                      {{ season.competition?.name || 'Unknown Competition' }}
                    </span>
                    <span class="flex items-center gap-1">
                      <i class="pi pi-calendar" style="font-size: 10px"></i>
                      {{ getSeasonRoundsProgress(season) }}
                    </span>
                  </div>
                </div>

                <template #stats>
                  <ListRowStats class="hidden md:flex">
                    <ListRowStat :value="season.stats?.total_drivers || 0" label="Drivers" />
                    <ListRowStat :value="season.stats?.completed_races || 0" label="Races" />
                  </ListRowStats>
                </template>

                <template #action>
                  <Button
                    label="View"
                    :icon="PhArrowRight"
                    variant="ghost"
                    size="sm"
                    @click.stop="handleViewSeason(season)"
                  />
                </template>
              </ListRow>
            </ListContainer>
          </section>

          <!-- Empty state for seasons -->
          <section v-else class="mb-8">
            <ListSectionHeader title="Active Seasons" class="mb-4" />
            <div
              class="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] p-8 text-center"
            >
              <i class="pi pi-calendar text-4xl text-[var(--text-muted)] opacity-30 mb-4"></i>
              <p class="text-[var(--text-secondary)]">No active seasons yet</p>
              <p class="text-[var(--text-muted)] text-sm mt-1">
                Create your first season to get started
              </p>
            </div>
          </section>

          <!-- Competitions Section -->
          <section class="mb-8">
            <ListSectionHeader title="Competitions" class="mb-4" />

            <!-- Empty state for competitions -->
            <div
              v-if="competitions.length === 0"
              class="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] p-8 text-center"
            >
              <i class="pi pi-trophy text-4xl text-[var(--text-muted)] opacity-30 mb-4"></i>
              <p class="text-[var(--text-secondary)]">No competitions yet</p>
              <p class="text-[var(--text-muted)] text-sm mt-1 mb-4">
                Create your first competition to start organizing races
              </p>
              <Button
                label="Add Competition"
                :icon="PhPlus"
                variant="primary"
                size="sm"
                @click="handleAddCompetition"
              />
            </div>

            <!-- Competition Cards Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <!-- Competition Card -->
              <article
                v-for="competition in competitions"
                :key="competition.id"
                class="competition-card"
              >
                <!-- Card Top Section -->
                <div class="flex items-stretch border-b border-[var(--border-muted)]">
                  <!-- Status Indicator -->
                  <div
                    class="w-1 flex-shrink-0"
                    :class="{
                      'bg-[var(--green)]': getCompetitionStatusClass(competition) === 'active',
                      'bg-[var(--cyan)]': getCompetitionStatusClass(competition) === 'idle',
                    }"
                  ></div>

                  <!-- Card Header -->
                  <div class="flex-1 flex items-center gap-3.5 p-4">
                    <div class="flex-1 min-w-0">
                      <h3
                        class="font-mono text-[13px] font-semibold text-[var(--text-primary)] mb-1 whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        {{ competition.name }}
                      </h3>
                      <div class="flex items-center gap-2">
                        <span
                          class="font-mono text-[10px] font-medium tracking-[0.3px] uppercase text-[var(--text-muted)]"
                        >
                          {{ competition.platform_name }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Card Body -->
                <div class="p-3.5 px-4 flex-1">
                  <p v-if="competition.description" class="card-tagline">
                    {{ competition.description }}
                  </p>
                  <div class="flex gap-4 content-center justify-center">
                    <div class="flex flex-col gap-0.5">
                      <span
                        class="font-mono text-[16px] font-semibold text-[var(--text-primary)] text-center"
                      >
                        {{ competition.stats.total_seasons }}
                      </span>
                      <span
                        class="font-mono text-[11px] font-medium tracking-[0.5px] uppercase text-[var(--text-muted)]"
                      >
                        Seasons
                      </span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span
                        class="font-mono text-[16px] font-semibold text-[var(--text-primary)] text-center"
                      >
                        {{ competition.stats.total_drivers }}
                      </span>
                      <span
                        class="font-mono text-[11px] font-medium tracking-[0.5px] uppercase text-[var(--text-muted)]"
                      >
                        Drivers
                      </span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span
                        class="font-mono text-[16px] font-semibold text-[var(--text-primary)] text-center"
                      >
                        {{ competition.stats.active_seasons }}
                      </span>
                      <span
                        class="font-mono text-[11px] font-medium tracking-[0.5px] uppercase text-[var(--text-muted)]"
                      >
                        Active
                      </span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span
                        class="font-mono text-[16px] font-semibold text-[var(--text-primary)] text-center"
                      >
                        {{ competition.stats.total_races }}
                      </span>
                      <span
                        class="font-mono text-[11px] font-medium tracking-[0.5px] uppercase text-[var(--text-muted)]"
                      >
                        Races
                      </span>
                    </div>
                  </div>
                  <div class="flex justify-center content-center mt-4">
                    <Button
                      label="Create New Season"
                      :icon="PhPlus"
                      variant="outline"
                      size="sm"
                      class="mx-auto"
                      :aria-label="`Create new season for ${competition?.name}`"
                      @click="handleNewSeason(competition)"
                    />
                  </div>
                </div>

                <!-- Card Footer -->
                <div
                  class="flex gap-1.5 p-3 px-4 bg-[var(--bg-elevated)] border-t border-[var(--border-muted)] items-center"
                >
                  <BaseBadge
                    :variant="competition.status === 'active' ? 'green' : 'default'"
                    size="sm"
                    uppercase
                  >
                    {{ competition.status }}
                  </BaseBadge>

                  <Button
                    :icon="PhPencil"
                    label="Edit Competition"
                    variant="warning"
                    size="sm"
                    outline
                    class="ml-auto"
                    :aria-label="`Edit ${competition.name}`"
                    @click="handleEditCompetition(competition)"
                  />
                </div>
              </article>

              <!-- Add Competition Card -->
              <article class="add-card" @click="handleAddCompetition">
                <div class="flex flex-col items-center gap-3 p-6 text-center">
                  <div class="add-card-icon">
                    <PhPlus :size="32" />
                  </div>
                  <h3 class="font-mono text-[14px] font-semibold text-[var(--text-primary)] m-0">
                    Add Competition
                  </h3>
                  <p class="text-[12px] text-[var(--text-muted)] leading-[1.4] m-0 max-w-[200px]">
                    Create a new competition to organize your seasons
                  </p>
                </div>
              </article>
            </div>
          </section>

          <!-- Recent Activity Section -->
          <section class="mb-8">
            <ListSectionHeader title="Activity Logs" class="mb-4" />
            <ActivityLog :league-id="leagueIdNumber" :limit="10" :compact="true" />
          </section>
        </div>
      </main>
    </template>

    <!-- Edit League Modal -->
    <EditLeagueModal
      v-if="league"
      v-model:visible="showEditModal"
      :is-edit-mode="true"
      :league-id="leagueIdNumber"
      @league-saved="handleLeagueSaved"
    />

    <!-- Settings Modal (same as Edit for now) -->
    <EditLeagueModal
      v-if="league"
      v-model:visible="showSettingsModal"
      :is-edit-mode="true"
      :league-id="leagueIdNumber"
      @league-saved="handleLeagueSaved"
    />

    <!-- Competition Form Drawer -->
    <CompetitionFormDrawer
      v-if="league"
      v-model:visible="showCompetitionDrawer"
      :league-id="leagueIdNumber"
      :competition="selectedCompetition"
      :is-edit-mode="isEditingCompetition"
      @competition-saved="handleCompetitionSaved"
    />

    <!-- Season Form Modal -->
    <SeasonFormSplitModal
      v-if="selectedCompetitionForNewSeason"
      v-model:visible="showNewSeasonModal"
      :competition-id="selectedCompetitionForNewSeason.id"
      :competition-name="selectedCompetitionForNewSeason.name"
      :is-edit-mode="false"
      @season-saved="handleSeasonSaved"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<style scoped>
/* Ensure responsive behavior */
@media (max-width: 1024px) {
  .flex {
    flex-direction: column;
  }
}

/* Competition Card - Keep complex transitions and hover states */
.competition-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.competition-card:not(.add-card):hover {
  border-color: var(--cyan);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Card Tagline - Keep webkit-specific line-clamp */
.card-tagline {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.8em; /* Reserve space for 2 lines */
}

/* Add Competition Card - Keep complex hover states and transitions */
.add-card {
  border: 2px dashed var(--border);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.2s ease;
}

.add-card:hover {
  border-color: var(--green);
  background: var(--bg-elevated);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.add-card-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: var(--green-dim);
  color: var(--green);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.add-card:hover .add-card-icon {
  background: var(--green);
  color: var(--bg-dark);
}
</style>
