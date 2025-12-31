<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { PhPlus, PhArrowRight } from '@phosphor-icons/vue';
import { Button } from '@app/components/common/buttons';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';
import { getLeagueById } from '@app/services/leagueService';
import { usePageTitle } from '@app/composables/usePageTitle';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useSeasonStore } from '@app/stores/seasonStore';
import LeagueIdentityPanel from '@app/components/league/partials/LeagueIdentityPanel.vue';
import LeagueWizardDrawer from '@app/components/league/modals/LeagueWizardDrawer.vue';
import CompetitionFormDrawer from '@app/components/competition/CompetitionFormDrawer.vue';
import {
  ListContainer,
  ListRow,
  ListSectionHeader,
  ListRowStats,
  ListRowStat,
} from '@app/components/common/lists';
import type { League } from '@app/types/league';
import type { Season } from '@app/types/season';

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
    const competitionIds = competitions.value.map((c) => c.id);
    await Promise.all(competitionIds.map((id) => seasonStore.fetchSeasons(id)));
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

function handleNewSeason(): void {
  // TODO: Implement season creation
  toast.add({
    severity: 'info',
    summary: 'Coming Soon',
    detail: 'Season creation will be available soon',
    life: 3000,
  });
}

function handleAddCompetition(): void {
  showCompetitionDrawer.value = true;
}

function handleCompetitionSaved(): void {
  showCompetitionDrawer.value = false;
  loadCompetitions();
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
</script>

<template>
  <div class="flex">
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
          <div class="flex gap-2">
            <Button
              label="New Season"
              :icon="PhPlus"
              variant="primary"
              size="sm"
              @click="handleNewSeason"
            />
          </div>
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
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <!-- Competition Tiles -->
              <div
                v-for="competition in competitions"
                :key="competition.id"
                class="flex flex-col items-center p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] cursor-pointer transition-all duration-200 hover:border-[var(--cyan)] hover:bg-[var(--bg-elevated)] hover:-translate-y-0.5"
                @click="
                  toast.add({
                    severity: 'info',
                    summary: 'Coming Soon',
                    detail: 'Competition details will be available soon',
                    life: 3000,
                  })
                "
              >
                <!-- Competition Icon/Logo -->
                <div
                  class="w-12 h-12 rounded-[var(--radius)] flex items-center justify-center mb-3"
                  :style="{
                    backgroundColor: 'var(--cyan-dim)',
                    color: 'var(--cyan)',
                  }"
                >
                  <i class="pi pi-trophy" style="font-size: 24px"></i>
                </div>
                <!-- Competition Name -->
                <span
                  class="font-mono text-[11px] font-semibold text-[var(--text-primary)] text-center"
                >
                  {{ competition.name }}
                </span>
              </div>

              <!-- Add Competition Tile -->
              <div
                class="flex flex-col items-center p-5 bg-[var(--bg-card)] border border-[var(--border)] border-dashed rounded-[var(--radius)] cursor-pointer transition-all duration-200 hover:border-[var(--cyan)] hover:bg-[var(--bg-elevated)] hover:-translate-y-0.5"
                @click="handleAddCompetition"
              >
                <div
                  class="w-12 h-12 rounded-[var(--radius)] flex items-center justify-center mb-3 bg-[var(--green-dim)] text-[var(--green)]"
                >
                  <PhPlus :size="24" />
                </div>
                <span
                  class="font-mono text-[11px] font-semibold text-[var(--text-primary)] text-center"
                >
                  Add Competition
                </span>
              </div>
            </div>

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
          </section>

          <!-- Recent Activity Section (Placeholder) -->
          <section class="mb-8">
            <ListSectionHeader title="Recent Activity" class="mb-4" />
            <div
              class="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] p-8 text-center"
            >
              <i class="pi pi-clock text-4xl text-[var(--text-muted)] opacity-30 mb-4"></i>
              <p class="text-[var(--text-secondary)]">Coming in Version 3</p>
              <p class="text-[var(--text-muted)] text-sm mt-1">
                Activity feed will show recent updates, results, and changes
              </p>
            </div>
          </section>
        </div>
      </main>
    </template>

    <!-- Edit League Modal -->
    <LeagueWizardDrawer
      v-if="league"
      v-model:visible="showEditModal"
      :is-edit-mode="true"
      :league-id="leagueIdNumber"
      @league-saved="handleLeagueSaved"
    />

    <!-- Settings Modal (same as Edit for now) -->
    <LeagueWizardDrawer
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
      @competition-saved="handleCompetitionSaved"
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
</style>
