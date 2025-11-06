<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import { useTeamStore } from '@app/stores/teamStore';
import { useDivisionStore } from '@app/stores/divisionStore';
import type { Season } from '@app/types/season';
import type { SeasonDriver } from '@app/types/seasonDriver';
import {
  PhGauge,
  PhCalendar,
  PhUsers,
  PhFlagCheckered,
  PhGear,
  PhTrophy,
  PhCar,
} from '@phosphor-icons/vue';

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
import Breadcrumbs, { type BreadcrumbItem } from '@app/components/common/Breadcrumbs.vue';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import HTag from '@app/components/common/HTag.vue';
import InfoItem from '@app/components/common/InfoItem.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const seasonStore = useSeasonStore();
const seasonDriverStore = useSeasonDriverStore();
const teamStore = useTeamStore();
const divisionStore = useDivisionStore();

const season = ref<Season | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('overview');
const showEditDrawer = ref(false);
const showDriverManagementDrawer = ref(false);
const showEditDriverDialog = ref(false);
const selectedSeasonDriver = ref<SeasonDriver | null>(null);

const leagueId = computed(() => parseInt(route.params.leagueId as string, 10));
const competitionId = computed(() => parseInt(route.params.competitionId as string, 10));
const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));

const stats = computed(() => seasonDriverStore.stats);
const teams = computed(() => teamStore.teams);
const divisions = computed(() => divisionStore.divisions);

onMounted(async () => {
  await loadSeason();
  await loadDrivers();
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

async function loadSeason(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    season.value = await seasonStore.fetchSeason(seasonId.value);

    // Debug logging for platform ID
    console.log('[SeasonDetail] Season loaded:', {
      seasonId: seasonId.value,
      season: season.value,
      platform_id: season.value?.competition?.platform_id,
      competition: season.value?.competition,
    });
  } catch {
    error.value = 'Failed to load season';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load season',
      life: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}

async function loadDrivers(): Promise<void> {
  try {
    await Promise.all([
      seasonDriverStore.fetchSeasonDrivers(seasonId.value),
      seasonDriverStore.fetchStats(seasonId.value),
    ]);
  } catch (error) {
    console.error('Failed to load drivers:', error);
  }
}

async function loadTeams(): Promise<void> {
  try {
    await teamStore.fetchTeams(seasonId.value);
  } catch (error) {
    console.error('Failed to load teams:', error);
  }
}

async function loadDivisions(): Promise<void> {
  try {
    await divisionStore.fetchDivisions(seasonId.value);
  } catch (error) {
    console.error('Failed to load divisions:', error);
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
  toast.add({
    severity: 'success',
    summary: 'Season Deleted',
    detail: 'Redirecting to league...',
    life: 3000,
  });

  setTimeout(() => {
    handleBackToLeague();
  }, 1500);
}

function handleManageDrivers(): void {
  showDriverManagementDrawer.value = true;
}

function handleEditDriver(driver: SeasonDriver): void {
  selectedSeasonDriver.value = driver;
  showEditDriverDialog.value = true;
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
            <div class="w-full h-64 bg-gradient-to-br from-purple-500 to-blue-600"></div>

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
          <Tab value="overview">
            <div class="flex items-center gap-2">
              <PhGauge :size="20" />
              <span>Overview</span>
            </div>
          </Tab>
          <Tab value="rounds">
            <div class="flex items-center gap-2">
              <PhCalendar :size="20" />
              <span>Rounds</span>
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
          <!-- Overview Tab -->
          <TabPanel value="overview">
            <!-- Main Content: Two-Column Layout (3/5 + 2/5) -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <!-- Left Column: Main Content (3/5 width) -->
              <div class="lg:col-span-3 space-y-4">
                <!-- Description Panel -->
                <BasePanel v-if="season.description">
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
                      <span class="font-medium text-surface-700">Description</span>
                    </div>
                  </template>
                  <div class="p-4">
                    <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {{ season.description }}
                    </p>
                  </div>
                </BasePanel>

                <!-- Technical Specifications Panel -->
                <BasePanel v-if="season.technical_specs">
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
                      <span class="font-medium text-surface-700">Technical Specifications</span>
                    </div>
                  </template>
                  <div class="p-4">
                    <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {{ season.technical_specs }}
                    </p>
                  </div>
                </BasePanel>

                <!-- Season Information Panel -->
                <BasePanel>
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
                      <span class="font-medium text-surface-700">Season Information</span>
                    </div>
                  </template>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                    <div class="p-3 rounded-lg bg-slate-50">
                      <FormLabel text="Competition" />
                      <p class="text-gray-900 mt-1">
                        {{ season.competition?.name || season.competition_name || 'N/A' }}
                      </p>
                    </div>
                    <div v-if="season.car_class" class="p-3 rounded-lg bg-slate-50">
                      <FormLabel text="Car Class" />
                      <p class="text-gray-900 mt-1">{{ season.car_class }}</p>
                    </div>
                    <div class="p-3 rounded-lg bg-slate-50">
                      <FormLabel text="Team Championship" />
                      <p class="text-gray-900 mt-1">
                        {{ season.team_championship_enabled ? 'Enabled' : 'Disabled' }}
                      </p>
                    </div>
                    <div class="p-3 rounded-lg bg-slate-50">
                      <FormLabel text="Race Divisions" />
                      <p class="text-gray-900 mt-1">
                        {{ season.race_divisions_enabled ? 'Enabled' : 'Disabled' }}
                      </p>
                    </div>
                  </div>
                </BasePanel>
              </div>

              <!-- Right Column: Sidebar (2/5 width) -->
              <div class="lg:col-span-2 space-y-4">
                <!-- Driver Statistics Panel -->
                <BasePanel>
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
                      <span class="font-medium text-surface-700">Driver Statistics</span>
                    </div>
                  </template>
                  <div class="p-4 space-y-4">
                    <!-- Total Drivers -->
                    <div class="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-600">Total Drivers</span>
                        <span class="text-3xl font-bold text-gray-900">{{ stats.total }}</span>
                      </div>
                    </div>

                    <!-- Active Drivers -->
                    <div class="p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-green-700">Active</span>
                        <span class="text-2xl font-bold text-green-600">{{ stats.active }}</span>
                      </div>
                    </div>

                    <!-- Reserve Drivers -->
                    <div class="p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-blue-700">Reserve</span>
                        <span class="text-2xl font-bold text-blue-600">{{ stats.reserve }}</span>
                      </div>
                    </div>

                    <!-- Withdrawn Drivers -->
                    <div class="p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-orange-700">Withdrawn</span>
                        <span class="text-2xl font-bold text-orange-600">{{
                          stats.withdrawn
                        }}</span>
                      </div>
                    </div>
                  </div>
                </BasePanel>

                <!-- Metadata Panel -->
                <BasePanel>
                  <template #header>
                    <div class="flex items-center gap-2 border-b border-gray-200 py-2 mx-4 w-full">
                      <span class="font-medium text-surface-700">Details</span>
                    </div>
                  </template>
                  <div class="p-4 space-y-3">
                    <div>
                      <FormLabel text="Status" />
                      <p class="text-gray-900 mt-1 capitalize">{{ season.status }}</p>
                    </div>
                    <div>
                      <FormLabel text="Created" />
                      <p class="text-gray-600 text-sm mt-1">
                        {{ new Date(season.created_at).toLocaleDateString() }}
                      </p>
                    </div>
                  </div>
                </BasePanel>
              </div>
            </div>
          </TabPanel>

          <!-- Divisions & Teams Tab -->
          <TabPanel value="divisions-teams">
            <BasePanel class="p-4">
              <div class="space-y-6">
                <!-- Divisions Panel -->
                <DivisionsPanel
                  :season-id="seasonId"
                  :race-divisions-enabled="season.race_divisions_enabled"
                />

                <!-- Teams Panel -->
                <TeamsPanel
                  :season-id="seasonId"
                  :team-championship-enabled="season.team_championship_enabled"
                />
              </div>
            </BasePanel>
          </TabPanel>

          <!-- Drivers Tab -->
          <TabPanel value="drivers">
            <BasePanel>
              <div class="p-4 space-y-6">
                <!-- Manage Drivers Button -->
                <div class="flex justify-between items-center">
                  <HTag :level="3">Season Drivers</HTag>
                  <Button
                    label="Manage Drivers"
                    icon="pi pi-users"
                    outlined
                    size="small"
                    :disabled="season.is_archived"
                    @click="handleManageDrivers"
                  />
                </div>

                <!-- Drivers Table -->
                <div class="overflow-auto">
                  <SeasonDriversTable
                    :season-id="seasonId"
                    :platform-id="season.competition?.platform_id"
                    :loading="seasonDriverStore.loading"
                    :team-championship-enabled="season.team_championship_enabled"
                    :teams="teams"
                    :race-divisions-enabled="season.race_divisions_enabled"
                    :divisions="divisions"
                    @view="handleEditDriver"
                  />
                </div>
              </div>
            </BasePanel>
          </TabPanel>

          <!-- Settings Tab -->
          <TabPanel value="settings">
            <BasePanel class="p-4">
              <SeasonSettings
                :season="season"
                @updated="loadSeason"
                @archived="handleArchived"
                @deleted="handleDeleted"
              />
            </BasePanel>
          </TabPanel>

          <!-- Rounds Tab -->
          <TabPanel value="rounds">
            <BasePanel class="p-4">
              <RoundsPanel
                v-if="season && season.competition?.platform_id"
                :season-id="seasonId"
                :platform-id="season.competition.platform_id"
                :competition-colour="season.competition.competition_colour"
              />
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
