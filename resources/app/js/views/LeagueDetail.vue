<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { PhPlus, PhArrowRight, PhPencil } from '@phosphor-icons/vue';
import { Button } from '@app/components/common/buttons';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';
import { getLeagueById } from '@app/services/leagueService';
import { usePageTitle } from '@app/composables/usePageTitle';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useSeasonStore } from '@app/stores/seasonStore';
import LeagueIdentityPanel from '@app/components/league/partials/LeagueIdentityPanel.vue';
import EditLeagueModal from '@app/components/league/modals/EditLeagueModal.vue';
import CompetitionFormDrawer from '@app/components/competition/CompetitionFormDrawer.vue';
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
 * Generate initials from competition name
 * e.g., "Thunder Racing League" → "TRL"
 */
function getCompetitionInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    // Single word: take first 3 characters
    return words[0].substring(0, 3).toUpperCase();
  }
  // Multiple words: take first letter of each word (max 4)
  return words
    .slice(0, 4)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
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
                <div class="card-top">
                  <div class="card-indicator" :class="getCompetitionStatusClass(competition)"></div>
                  <div class="card-header">
                    <div class="card-logo">
                      {{ getCompetitionInitials(competition.name) }}
                    </div>
                    <div class="card-info">
                      <h3 class="card-name">{{ competition.name }}</h3>
                      <div class="card-meta">
                        <span class="card-platform">{{ competition.platform_name }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card-body">
                  <p class="card-tagline">
                    {{ competition.description || 'No description provided yet.' }}
                  </p>
                  <div class="card-stats">
                    <div class="card-stat">
                      <span class="card-stat-value">{{ competition.stats.total_seasons }}</span>
                      <span class="card-stat-label">Seasons</span>
                    </div>
                    <div class="card-stat">
                      <span class="card-stat-value">{{ competition.stats.total_drivers }}</span>
                      <span class="card-stat-label">Drivers</span>
                    </div>
                    <div class="card-stat">
                      <span class="card-stat-value">{{ competition.stats.active_seasons }}</span>
                      <span class="card-stat-label">Active</span>
                    </div>
                    <div class="card-stat">
                      <span class="card-stat-value">{{ competition.stats.total_races }}</span>
                      <span class="card-stat-label">Races</span>
                    </div>
                  </div>
                </div>

                <div class="card-footer">
                  <span
                    class="status-badge"
                    :class="competition.status === 'active' ? 'active' : 'archived'"
                  >
                    {{ competition.status }}
                  </span>
                  <button
                    class="card-action"
                    :aria-label="`Edit ${competition.name}`"
                    @click="handleEditCompetition(competition)"
                  >
                    <PhPencil :size="14" />
                  </button>
                </div>
              </article>

              <!-- Add Competition Card -->
              <article class="competition-card add-card" @click="handleAddCompetition">
                <div class="add-card-content">
                  <div class="add-card-icon">
                    <PhPlus :size="32" />
                  </div>
                  <h3 class="add-card-title">Add Competition</h3>
                  <p class="add-card-text">Create a new competition to organize your seasons</p>
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

/* Competition Card Styles */
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

/* Card Top Section */
.card-top {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--border-muted);
}

.card-indicator {
  width: 4px;
  flex-shrink: 0;
}

.card-indicator.active {
  background: var(--green);
}

.card-indicator.idle {
  background: var(--cyan);
}

.card-header {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
}

.card-logo {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--cyan);
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-platform {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Card Body */
.card-body {
  padding: 14px 16px;
  flex: 1;
}

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

.card-stats {
  display: flex;
  gap: 16px;
}

.card-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-stat-value {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-stat-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Card Footer */
.card-footer {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  background: var(--bg-elevated);
  border-top: 1px solid var(--border-muted);
  align-items: center;
}

.status-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  padding: 4px 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-muted);
  border-radius: 3px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-badge.active {
  color: var(--green);
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.1);
}

.status-badge.archived {
  color: var(--text-muted);
  border-color: var(--border-muted);
}

.card-action {
  margin-left: auto;
  width: 28px;
  height: 28px;
  border-radius: var(--radius);
  border: 1px solid rgba(88, 166, 255, 0.3);
  background: var(--cyan-dim);
  color: var(--cyan);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.card-action:hover {
  background: var(--cyan);
  color: var(--bg-dark);
}

/* Add Competition Card */
.add-card {
  border: 2px dashed var(--border);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.add-card:hover {
  border-color: var(--green);
  background: var(--bg-elevated);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.add-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
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

.add-card-title {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.add-card-text {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
  max-width: 200px;
}
</style>
