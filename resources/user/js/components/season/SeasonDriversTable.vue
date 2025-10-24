<script setup lang="ts">
import { ref, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useRoute } from 'vue-router';
import { useSeasonDriverStore } from '@user/stores/seasonDriverStore';
import { useDriverStore } from '@user/stores/driverStore';
import { useTeamStore } from '@user/stores/teamStore';
import type { SeasonDriver } from '@user/types/seasonDriver';
import type { LeagueDriver } from '@user/types/driver';
import type { Team } from '@user/types/team';
import { usesPsnId, usesIracingId } from '@user/constants/platforms';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Select from 'primevue/select';
import ViewDriverModal from '@user/components/driver/ViewDriverModal.vue';

interface Props {
  seasonId: number;
  loading?: boolean;
  platformId?: number;
  showNumberColumn?: boolean;
  teamChampionshipEnabled?: boolean;
  teams?: Team[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  platformId: undefined,
  showNumberColumn: true,
  teamChampionshipEnabled: false,
  teams: () => [],
});

interface Emits {
  (e: 'view', driver: SeasonDriver): void;
}

const emit = defineEmits<Emits>();

const route = useRoute();
const confirm = useConfirm();
const toast = useToast();
const seasonDriverStore = useSeasonDriverStore();
const driverStore = useDriverStore();
const teamStore = useTeamStore();

// Modal state
const showViewDriverModal = ref(false);
const selectedDriver = ref<LeagueDriver | null>(null);
const loadingDriver = ref(false);

const updatingTeam = ref<{ [key: number]: boolean }>({});

const drivers = computed(() => seasonDriverStore.seasonDrivers);

const showPsnColumn = computed(() => {
  const result = usesPsnId(props.platformId);
  console.log('[SeasonDriversTable] PSN Column Visibility:', {
    platformId: props.platformId,
    showPsnColumn: result,
  });
  return result;
});

const showIracingColumn = computed(() => {
  const result = usesIracingId(props.platformId);
  console.log('[SeasonDriversTable] iRacing Column Visibility:', {
    platformId: props.platformId,
    showIracingColumn: result,
  });
  return result;
});

function getDriverDisplayName(driver: SeasonDriver): string {
  const { first_name, last_name, nickname } = driver;

  if (first_name && last_name) {
    return `${first_name} ${last_name}`;
  }

  return nickname || 'Unknown Driver';
}

/**
 * Get leagueId from route params
 */
const leagueId = computed(() => {
  const id = route.params.leagueId;
  return id ? parseInt(id as string, 10) : null;
});

/**
 * Handle view driver button click
 * Fetches the full LeagueDriver data and opens the ViewDriverModal
 */
async function handleView(driver: SeasonDriver): Promise<void> {
  // Emit the view event for backward compatibility
  emit('view', driver);

  // Check if leagueId is available
  if (!leagueId.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'League ID not available',
      life: 5000,
    });
    return;
  }

  loadingDriver.value = true;

  try {
    // Fetch the full LeagueDriver data using the driver_id
    const fullDriver = await driverStore.fetchLeagueDriver(leagueId.value, driver.driver_id);
    selectedDriver.value = fullDriver;
    showViewDriverModal.value = true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load driver details';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    loadingDriver.value = false;
  }
}

/**
 * Handle close event from ViewDriverModal
 */
function handleCloseModal(): void {
  showViewDriverModal.value = false;
  selectedDriver.value = null;
}

/**
 * Handle edit event from ViewDriverModal
 * Currently not implemented - could emit an edit event to parent
 */
function handleEditDriver(): void {
  // Close the view modal
  showViewDriverModal.value = false;

  // Optionally emit an edit event to the parent component
  toast.add({
    severity: 'info',
    summary: 'Info',
    detail: 'Edit functionality coming soon',
    life: 3000,
  });
}

function handleRemove(driver: SeasonDriver): void {
  const driverName = getDriverDisplayName(driver);

  confirm.require({
    message: `Remove ${driverName} from this season?`,
    header: 'Remove Driver',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Remove',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await seasonDriverStore.removeDriver(props.seasonId, driver.league_driver_id);

        toast.add({
          severity: 'success',
          summary: 'Driver Removed',
          detail: 'Driver has been removed from the season',
          life: 3000,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove driver';
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
      }
    },
  });
}

// Team selection options
interface TeamOption {
  label: string;
  value: number | null;
  logo_url?: string | null;
}

const teamOptions = computed((): TeamOption[] => {
  const options: TeamOption[] = [
    {
      label: 'Privateer',
      value: null,
    },
  ];

  props.teams.forEach((team) => {
    options.push({
      label: team.name,
      value: team.id,
      logo_url: team.logo_url,
    });
  });

  return options;
});

function getDriverTeamId(driver: SeasonDriver): number | null {
  // Find the team by name (backend returns team_name string)
  const team = props.teams.find((t) => t.name === driver.team_name);
  return team?.id || null;
}

async function handleTeamChange(driver: SeasonDriver, newTeamId: number | null): Promise<void> {
  updatingTeam.value[driver.id] = true;

  try {
    await teamStore.assignDriverToTeam(props.seasonId, driver.id, {
      team_id: newTeamId,
    });

    // Refresh drivers to get updated team assignment
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId);

    const teamName = newTeamId
      ? props.teams.find((t) => t.id === newTeamId)?.name || 'team'
      : 'Privateer';

    toast.add({
      severity: 'success',
      summary: 'Team Updated',
      detail: `Driver assigned to ${teamName}`,
      life: 3000,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update team';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    updatingTeam.value[driver.id] = false;
  }
}
</script>

<template>
  <div class="season-drivers-table">
    <!-- View Driver Modal -->
    <ViewDriverModal
      v-model:visible="showViewDriverModal"
      :driver="selectedDriver"
      @close="handleCloseModal"
      @edit="handleEditDriver"
    />

    <DataTable
      :value="drivers"
      :loading="loading || loadingDriver"
      paginator
      :rows="10"
      :rows-per-page-options="[10, 25, 50]"
      striped-rows
      show-gridlines
      responsive-layout="scroll"
    >
      <template #empty>
        <div class="text-center py-8">
          <i class="pi pi-users text-4xl text-gray-400 mb-3"></i>
          <p class="text-gray-600">No drivers assigned to this season yet.</p>
        </div>
      </template>

      <template #loading>
        <div class="text-center py-8 text-gray-500">Loading season drivers...</div>
      </template>

      <Column field="driver_name" header="Driver">
        <template #body="{ data }">
          <span class="font-semibold">{{ getDriverDisplayName(data) }}</span>
        </template>
      </Column>

      <Column field="discord_id" header="Discord">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.discord_id || '-' }}</span>
        </template>
      </Column>

      <Column v-if="showPsnColumn" field="psn_id" header="PSN ID">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.psn_id || '-' }}</span>
        </template>
      </Column>

      <Column v-if="showIracingColumn" field="iracing_id" header="iRacing ID">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.iracing_id || '-' }}</span>
        </template>
      </Column>

      <Column v-if="showNumberColumn" field="driver_number" header="#" class="text-center">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.driver_number || '-' }}</span>
        </template>
      </Column>

      <Column v-if="teamChampionshipEnabled" field="team_name" header="Team">
        <template #body="{ data }">
          <Select
            :model-value="getDriverTeamId(data)"
            :options="teamOptions"
            option-label="label"
            option-value="value"
            placeholder="Select team"
            :loading="updatingTeam[data.id]"
            :disabled="updatingTeam[data.id]"
            class="w-full min-w-[150px]"
            @change="(event) => handleTeamChange(data, event.value)"
          >
            <template #value="slotProps">
              <div
                v-if="slotProps.value !== null && slotProps.value !== undefined"
                class="flex items-center gap-2"
              >
                <img
                  v-if="teamOptions.find((opt) => opt.value === slotProps.value)?.logo_url"
                  :src="teamOptions.find((opt) => opt.value === slotProps.value)!.logo_url!"
                  :alt="teamOptions.find((opt) => opt.value === slotProps.value)?.label"
                  class="w-5 h-5 rounded object-cover"
                />
                <span>{{ teamOptions.find((opt) => opt.value === slotProps.value)?.label }}</span>
              </div>
              <span v-else>Privateer</span>
            </template>
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <img
                  v-if="slotProps.option.logo_url"
                  :src="slotProps.option.logo_url"
                  :alt="slotProps.option.label"
                  class="w-5 h-5 rounded object-cover"
                />
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
          </Select>
        </template>
      </Column>

      <Column header="Actions" :exportable="false">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-eye" size="small" outlined @click="handleView(data)" />
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              outlined
              @click="handleRemove(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
