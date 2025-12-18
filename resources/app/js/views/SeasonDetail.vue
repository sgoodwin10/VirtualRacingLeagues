<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToastError, TOAST_DURATION } from '@app/composables/useToastError';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import { useTeamStore } from '@app/stores/teamStore';
import { useDivisionStore } from '@app/stores/divisionStore';
import type { Season } from '@app/types/season';
import type { SeasonDriver } from '@app/types/seasonDriver';
import {
  PhCalendar,
  PhUsers,
  PhFlagCheckered,
  PhGear,
  PhTrophy,
  PhCar,
  PhUsersThree,
} from '@phosphor-icons/vue';

// Transition delay constants
const TRANSITION_DELAY = 1500;

import Button from 'primevue/button';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import Message from 'primevue/message';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Tag from 'primevue/tag';

import SeasonSettings from '@app/components/season/SeasonSettings.vue';
import SeasonFormDrawer from '@app/components/season/modals/SeasonFormDrawer.vue';
import SeasonDriversTable from '@app/components/season/SeasonDriversTable.vue';
import SeasonDriverManagementDrawer from '@app/components/season/modals/SeasonDriverManagementDrawer.vue';
import SeasonDriverFormDialog from '@app/components/season/modals/SeasonDriverFormDialog.vue';
import TeamsPanel from '@app/components/season/teams/TeamsPanel.vue';
import DivisionsPanel from '@app/components/season/divisions/DivisionsPanel.vue';
import RoundsPanel from '@app/components/round/RoundsPanel.vue';
import SeasonStandingsPanel from '@app/components/season/panels/SeasonStandingsPanel.vue';
import Breadcrumbs, { type BreadcrumbItem } from '@app/components/common/Breadcrumbs.vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import PanelHeader from '@app/components/common/panels/PanelHeader.vue';
import HTag from '@app/components/common/HTag.vue';
import InfoItem from '@app/components/common/InfoItem.vue';

const route = useRoute();
const router = useRouter();
const { showError, showSuccess } = useToastError();
const seasonStore = useSeasonStore();
const seasonDriverStore = useSeasonDriverStore();
const teamStore = useTeamStore();
const divisionStore = useDivisionStore();

const season = ref<Season | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('rounds');
const showEditDrawer = ref(false);
const showDriverManagementDrawer = ref(false);
const showEditDriverDialog = ref(false);
const selectedSeasonDriver = ref<SeasonDriver | null>(null);

// Timeout tracking for cleanup
let deleteRedirectTimeout: ReturnType<typeof setTimeout> | null = null;

const leagueId = computed(() => parseInt(route.params.leagueId as string, 10));
const competitionId = computed(() => parseInt(route.params.competitionId as string, 10));
const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));

const stats = computed(() => seasonDriverStore.stats);
const teams = computed(() => teamStore.teams);
const divisions = computed(() => divisionStore.divisions);

onMounted(async () => {
  const seasonLoaded = await loadSeason();
  // Only load drivers if season loaded successfully
  if (seasonLoaded) {
    await loadDrivers();
  }
});

onUnmounted(() => {
  // Clean up any pending timeouts
  if (deleteRedirectTimeout) {
    clearTimeout(deleteRedirectTimeout);
    deleteRedirectTimeout = null;
  }
});

// Watch active tab and load teams/divisions when Drivers tab becomes active
watch(activeTab, async (newTab) => {
  if (newTab === 'drivers') {
    if (season.value?.team_championship_enabled) {
      await loadTeams();
    }
    if (season.value?.race_divisions_enabled) {
      await loadDivisions();
    }
  }
});

async function loadSeason(): Promise<boolean> {
  isLoading.value = true;
  error.value = null;

  try {
    season.value = await seasonStore.fetchSeason(seasonId.value);
    return true;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load season';
    error.value = errorMessage;
    showError(errorMessage, { summary: 'Load Failed' });
    return false;
  } finally {
    isLoading.value = false;
  }
}

async function loadDrivers(): Promise<void> {
  try {
    const results = await Promise.allSettled([
      seasonDriverStore.fetchSeasonDrivers(seasonId.value),
      seasonDriverStore.fetchStats(seasonId.value),
    ]);

    // Check for failures and provide specific error messages
    const failures: string[] = [];
    if (results[0].status === 'rejected') {
      failures.push('season drivers');
    }
    if (results[1].status === 'rejected') {
      failures.push('driver statistics');
    }

    if (failures.length > 0) {
      const errorMessage = `Failed to load ${failures.join(' and ')}`;
      showError(errorMessage, { summary: 'Load Failed' });
    }
  } catch (err: unknown) {
    showError(err, { summary: 'Load Failed' });
  }
}

async function loadTeams(): Promise<void> {
  try {
    await teamStore.fetchTeams(seasonId.value);
  } catch (err: unknown) {
    showError(err, { summary: 'Load Failed' });
  }
}

async function loadDivisions(): Promise<void> {
  try {
    await divisionStore.fetchDivisions(seasonId.value);
  } catch (err: unknown) {
    showError(err, { summary: 'Load Failed' });
  }
}

function handleEdit(): void {
  showEditDrawer.value = true;
}

function handleBackToLeague(): void {
  router.push({
    name: 'league-detail',
    params: {
      id: leagueId.value,
    },
  });
}

function handleSeasonUpdated(updated: Season): void {
  season.value = updated;
}

function handleArchived(): void {
  loadSeason();
}

function handleDeleted(): void {
  showSuccess('Redirecting to league...', {
    summary: 'Season Deleted',
    life: TOAST_DURATION.SHORT,
  });

  deleteRedirectTimeout = setTimeout(() => {
    handleBackToLeague();
  }, TRANSITION_DELAY);
}

function handleManageDrivers(): void {
  showDriverManagementDrawer.value = true;
}

function handleDriverUpdated(): void {
  loadDrivers();
}

const breadcrumbItems = computed((): BreadcrumbItem[] => {
  if (isLoading.value || !season.value) {
    return [
      {
        label: 'Leagues',
        to: { name: 'home' },
        icon: 'pi-home',
      },
      {
        label: 'Loading...',
      },
    ];
  }

  // Helper function to get league name
  const getLeagueName = (): string => {
    // Try nested structure first (preferred)
    if (season.value?.competition?.league?.name) {
      return season.value.competition.league.name;
    }
    // Fallback: We don't have direct access to league name from flat structure
    // This will be populated once backend includes league relationship
    return 'League';
  };

  // Helper function to get competition name
  const getCompetitionName = (): string => {
    // Try nested structure first (preferred)
    if (season.value?.competition?.name) {
      return season.value.competition.name;
    }
    // Fallback: Use flat competition_name field from backend DTO
    if (season.value?.competition_name) {
      return season.value.competition_name;
    }
    return 'Competition';
  };

  return [
    {
      label: 'Leagues',
      to: { name: 'home' },
      icon: 'pi-home',
    },
    {
      label: getLeagueName(),
      to: { name: 'league-detail', params: { id: leagueId.value } },
    },
    {
      label: getCompetitionName(),
    },
    {
      label: season.value.name,
    },
  ];
});
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <!-- Loading skeleton -->
    <Skeleton v-if="isLoading" height="30rem" />

    <!-- Error state -->
    <Message v-else-if="error" severity="error">
      {{ error }}
    </Message>

    <!-- Season content -->
    <div v-else-if="season" class="space-y-6">
      <!-- Breadcrumbs -->
      <Breadcrumbs :items="breadcrumbItems" />

      <!-- Header Card -->
      <Card class="overflow-hidden p-0">
        <template #header>
          <div class="relative">
            <!-- Gradient Header Background -->
            <div class="w-full h-48 bg-gradient-to-br from-purple-500 to-blue-600"></div>

            <!-- Archived Tag Overlay (top-left corner) -->
            <div
              v-if="season.is_archived"
              class="absolute top-0 left-0 flex flex-col items-center gap-3 p-2"
            >
              <Tag severity="warn" value="ARCHIVED" class="text-xs font-semibold px-3 py-1" />
            </div>

            <!-- Season Icon/Logo Placeholder -->
            <div
              class="absolute -bottom-12 left-8 w-24 h-24 rounded-xl border-4 border-white shadow-xl bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center"
            >
              <PhTrophy :size="48" class="text-white" weight="fill" />
            </div>
          </div>

          <!-- Title Bar with Season Name and Actions -->
          <div
            class="flex flex-wrap items-start justify-between gap-4 bg-slate-100 border-b border-gray-200 p-3 shadow-lg"
          >
            <HTag additional-classes="ml-32" :level="2">{{ season.name }}</HTag>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <Button
                label="Back to League"
                icon="pi pi-arrow-left"
                severity="secondary"
                class="bg-white"
                outlined
                size="small"
                @click="handleBackToLeague"
              />
              <Button
                label="Edit Season"
                icon="pi pi-pencil"
                severity="secondary"
                class="bg-white"
                outlined
                size="small"
                :disabled="season.is_archived"
                @click="handleEdit"
              />
            </div>
          </div>
        </template>

        <template #content>
          <!-- InfoItem Grid for Key Stats -->
          <div class="grid grid-cols-4 border-b border-gray-200 gap-px bg-surface-200">
            <InfoItem
              :icon="PhTrophy"
              :text="season.competition?.name || season.competition_name || 'N/A'"
              centered
            />
            <InfoItem :icon="PhCar" :text="season.car_class || 'Not specified'" centered />
            <InfoItem
              :icon="PhUsers"
              :text="stats.total.toString() + ' Driver' + (stats.total === 1 ? '' : 's')"
              centered
            />
            <InfoItem
              :icon="PhCalendar"
              :text="'Status: ' + season.status.charAt(0).toUpperCase() + season.status.slice(1)"
              centered
            />
          </div>
        </template>
      </Card>

      <!-- Tabs -->
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="rounds">
            <div class="flex items-center gap-2">
              <PhCalendar :size="20" />
              <span>Rounds</span>
            </div>
          </Tab>
          <Tab value="standings">
            <div class="flex items-center gap-2">
              <PhTrophy :size="20" />
              <span>Standings</span>
            </div>
          </Tab>
          <Tab value="drivers">
            <div class="flex items-center gap-2">
              <PhUsers :size="20" />
              <span>Drivers</span>
            </div>
          </Tab>
          <Tab value="divisions-teams">
            <div class="flex items-center gap-2">
              <PhFlagCheckered :size="20" />
              <span>Divisions & Teams</span>
            </div>
          </Tab>
          <Tab value="settings">
            <div class="flex items-center gap-2">
              <PhGear :size="20" />
              <span>Settings</span>
            </div>
          </Tab>
        </TabList>

        <TabPanels>
          <!-- Rounds Tab -->
          <TabPanel value="rounds">
            <BasePanel>
              <template #header>
                <PanelHeader
                  :icon="PhCalendar"
                  icon-class="text-green-600"
                  title="Race Rounds"
                  description="View and manage all race rounds in this season"
                  gradient="from-green-50 to-teal-50"
                />
              </template>
              <div class="p-4">
                <RoundsPanel
                  v-if="season && season.competition?.platform_id"
                  :season-id="seasonId"
                  :platform-id="season.competition.platform_id"
                  :competition-colour="season.competition.competition_colour"
                />
              </div>
            </BasePanel>
          </TabPanel>

          <!-- Standings Tab -->
          <TabPanel value="standings">
            <SeasonStandingsPanel :season-id="seasonId" />
          </TabPanel>

          <!-- Drivers Tab -->
          <TabPanel value="drivers">
            <BasePanel>
              <template #header>
                <PanelHeader
                  :icon="PhUsers"
                  icon-class="text-blue-600"
                  title="Season Drivers"
                  description="Manage all drivers registered for this season"
                  gradient="from-blue-50 to-cyan-50"
                />
              </template>
              <div class="p-4">
                <SeasonDriversTable
                  :season-id="seasonId"
                  :platform-id="season.competition?.platform_id"
                  :loading="seasonDriverStore.loading"
                  :team-championship-enabled="season.team_championship_enabled"
                  :teams="teams"
                  :race-divisions-enabled="season.race_divisions_enabled"
                  :divisions="divisions"
                  :manage-button-disabled="season.is_archived"
                  @manage-drivers="handleManageDrivers"
                />
              </div>
            </BasePanel>
          </TabPanel>

          <!-- Divisions & Teams Tab -->
          <TabPanel value="divisions-teams">
            <BasePanel>
              <div class="grid grid-cols-1 lg:grid-cols-2">
                <!-- Divisions Column (Left) -->
                <div class="border-r border-gray-200">
                  <PanelHeader
                    :icon="PhTrophy"
                    icon-class="text-purple-600"
                    title="Divisions"
                    description="Skill-based groupings for fair competition within division championships"
                    gradient="from-purple-50 to-blue-50"
                    half-width
                    border-right
                  />
                  <div class="p-4">
                    <DivisionsPanel
                      :season-id="seasonId"
                      :race-divisions-enabled="season.race_divisions_enabled"
                    />
                  </div>
                </div>

                <!-- Teams Column (Right) -->
                <div>
                  <PanelHeader
                    :icon="PhUsersThree"
                    icon-class="text-blue-600"
                    title="Teams"
                    description="Multi-division organizations competing for the team championship"
                    gradient="from-blue-50 to-indigo-50"
                    half-width
                  />
                  <div class="p-4">
                    <TeamsPanel
                      :season-id="seasonId"
                      :team-championship-enabled="season.team_championship_enabled"
                    />
                  </div>
                </div>
              </div>
            </BasePanel>
          </TabPanel>

          <!-- Settings Tab -->
          <TabPanel value="settings">
            <BasePanel>
              <template #header>
                <PanelHeader
                  :icon="PhGear"
                  icon-class="text-blue-600"
                  title="Season Settings"
                  description="Configure season preferences and manage archiving"
                  gradient="from-blue-50 to-indigo-50"
                />
              </template>
              <div class="p-4">
                <SeasonSettings
                  :season="season"
                  @updated="loadSeason"
                  @archived="handleArchived"
                  @deleted="handleDeleted"
                />
              </div>
            </BasePanel>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <!-- Edit Drawer -->
      <SeasonFormDrawer
        v-model:visible="showEditDrawer"
        :competition-id="competitionId"
        :season="season"
        is-edit-mode
        @season-saved="handleSeasonUpdated"
      />

      <!-- Driver Management Drawer -->
      <SeasonDriverManagementDrawer
        v-model:visible="showDriverManagementDrawer"
        :season-id="seasonId"
        :league-id="leagueId"
        :platform-id="season.competition?.platform_id"
      />

      <!-- Edit Driver Dialog -->
      <SeasonDriverFormDialog
        v-model:visible="showEditDriverDialog"
        :season-id="seasonId"
        mode="edit"
        :season-driver="selectedSeasonDriver"
        @saved="handleDriverUpdated"
      />
    </div>
  </div>
</template>
