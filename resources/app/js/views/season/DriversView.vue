<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import { useTeamStore } from '@app/stores/teamStore';
import { useDivisionStore } from '@app/stores/divisionStore';
import { useToastError } from '@app/composables/useToastError';
import { PhUsers } from '@phosphor-icons/vue';
import type { SeasonDriver } from '@app/types/seasonDriver';
import SeasonDriversTable from '@app/components/season/SeasonDriversTable.vue';
import SeasonDriverManagementDrawer from '@app/components/season/modals/SeasonDriverManagementDrawer.vue';
import SeasonDriverFormDialog from '@app/components/season/modals/SeasonDriverFormDialog.vue';
import { Card, CardHeader } from '@app/components/common/cards';

const route = useRoute();
const seasonStore = useSeasonStore();
const seasonDriverStore = useSeasonDriverStore();
const teamStore = useTeamStore();
const divisionStore = useDivisionStore();
const { showError } = useToastError();

const showDriverManagementDrawer = ref(false);
const showEditDriverDialog = ref(false);
const selectedSeasonDriver = ref<SeasonDriver | null>(null);

const seasonId = computed(() => parseInt(route.params.seasonId as string, 10));
const leagueId = computed(() => parseInt(route.params.leagueId as string, 10));
const season = computed(() => seasonStore.currentSeason);
const teams = computed(() => teamStore.teams);
const divisions = computed(() => divisionStore.divisions);

// Load teams and divisions when component mounts
onMounted(async () => {
  if (season.value?.team_championship_enabled) {
    await loadTeams();
  }
  if (season.value?.race_divisions_enabled) {
    await loadDivisions();
  }
});

// Watch season changes to reload teams/divisions if needed
watch(
  () => season.value,
  async (newSeason) => {
    if (newSeason?.team_championship_enabled) {
      await loadTeams();
    }
    if (newSeason?.race_divisions_enabled) {
      await loadDivisions();
    }
  },
);

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

function handleManageDrivers(): void {
  showDriverManagementDrawer.value = true;
}

async function handleDriverUpdated(): Promise<void> {
  try {
    await seasonDriverStore.fetchSeasonDrivers(seasonId.value);
    await seasonDriverStore.fetchStats(seasonId.value);
  } catch (err: unknown) {
    showError(err, { summary: 'Load Failed' });
  }
}
</script>

<template>
  <div>
    <Card>
      <template #header>
        <CardHeader
          title="Season Drivers"
          description="Manage all drivers registered for this season"
          :icon="PhUsers"
          icon-color="yellow-700"
        />
      </template>
      <SeasonDriversTable
        v-if="season"
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
    </Card>

    <!-- Driver Management Drawer -->
    <SeasonDriverManagementDrawer
      v-if="season"
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
</template>
