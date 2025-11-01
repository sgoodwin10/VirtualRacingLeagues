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
import { PhGauge, PhCalendar, PhUsers, PhFlagCheckered, PhGear } from '@phosphor-icons/vue';

import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import Message from 'primevue/message';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

import SeasonHeader from '@app/components/season/SeasonHeader.vue';
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
    <div v-else-if="season">
      <!-- Breadcrumbs -->
      <Breadcrumbs :items="breadcrumbItems" class="mb-4" />

      <!-- Archived banner -->
      <Message v-if="season.is_archived" severity="warn" :closable="false" class="mb-4">
        <div class="flex items-center justify-between">
          <span> <strong>Archived Season</strong> - This season is read-only. </span>
          <span class="text-sm text-gray-600">(Restore coming in next update)</span>
        </div>
      </Message>

      <!-- Header -->
      <SeasonHeader :season="season" @edit="handleEdit" @back-to-league="handleBackToLeague" />

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
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Season Information -->
              <BasePanel header="Season Information" class="lg:col-span-2">
                <div class="space-y-3">
                  <div>
                    <span class="text-sm font-semibold text-gray-600">Competition</span>
                    <p>{{ season.competition?.name || season.competition_name || 'N/A' }}</p>
                  </div>
                  <div v-if="season.car_class">
                    <span class="text-sm font-semibold text-gray-600">Car Class</span>
                    <p>{{ season.car_class }}</p>
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-gray-600">Team Championship</span>
                    <p>{{ season.team_championship_enabled ? 'Enabled' : 'Disabled' }}</p>
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-gray-600">Race Divisions</span>
                    <p>{{ season.race_divisions_enabled ? 'Enabled' : 'Disabled' }}</p>
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-gray-600">Status</span>
                    <p class="capitalize">{{ season.status }}</p>
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-gray-600">Created</span>
                    <p>{{ new Date(season.created_at).toLocaleDateString() }}</p>
                  </div>
                </div>
              </BasePanel>

              <!-- Driver Stats -->
              <BasePanel header="Driver Statistics">
                <div class="space-y-3">
                  <div>
                    <span class="text-sm font-semibold text-gray-600">Total Drivers</span>
                    <p class="text-2xl font-bold">{{ stats.total }}</p>
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-green-600">Active</span>
                    <p class="text-xl font-bold text-green-600">{{ stats.active }}</p>
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-blue-600">Reserve</span>
                    <p class="text-xl font-bold text-blue-600">{{ stats.reserve }}</p>
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-orange-600">Withdrawn</span>
                    <p class="text-xl font-bold text-orange-600">{{ stats.withdrawn }}</p>
                  </div>
                </div>
              </BasePanel>

              <!-- Description -->
              <BasePanel v-if="season.description" header="Description" class="lg:col-span-2">
                <p class="whitespace-pre-wrap">{{ season.description }}</p>
              </BasePanel>

              <!-- Technical Specs -->
              <BasePanel
                v-if="season.technical_specs"
                header="Technical Specifications"
                class="lg:col-span-3"
              >
                <p class="whitespace-pre-wrap">{{ season.technical_specs }}</p>
              </BasePanel>
            </div>
          </TabPanel>

          <!-- Divisions & Teams Tab -->
          <TabPanel value="divisions-teams">
            <div class="space-y-6">
              <!-- Divisions & Teams Panel (25% - 1 column) -->
              <div class="lg:col-span-1 space-y-6">
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
            </div>
          </TabPanel>

          <!-- Drivers Tab -->
          <TabPanel value="drivers">
            <div class="space-y-6">
              <!-- Manage Drivers Button -->
              <div class="flex justify-between items-center">
                <h3 class="text-xl font-semibold">Season Drivers</h3>
                <Button
                  label="Manage Drivers"
                  icon="pi pi-users"
                  :disabled="season.is_archived"
                  @click="handleManageDrivers"
                />
              </div>

              <!-- 75/25 Layout: Drivers Table + Divisions/Teams Panel -->
              <div class="flex">
                <!-- Drivers Table (75% - 3 columns) -->
                <div class="w-full">
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
            </div>
          </TabPanel>

          <!-- Settings Tab -->
          <TabPanel value="settings">
            <SeasonSettings
              :season="season"
              @updated="loadSeason"
              @archived="handleArchived"
              @deleted="handleDeleted"
            />
          </TabPanel>

          <!-- Rounds Tab -->
          <TabPanel value="rounds">
            <RoundsPanel
              v-if="season && season.competition?.platform_id"
              :season-id="seasonId"
              :platform-id="season.competition.platform_id"
            />
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
