<script setup lang="ts">
import { ref, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useRoute } from 'vue-router';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import { useDriverStore } from '@app/stores/driverStore';
import { useTeamStore } from '@app/stores/teamStore';
import { useDivisionStore } from '@app/stores/divisionStore';
import { useDebouncedSearch } from '@app/composables/useDebouncedSearch';
import type { SeasonDriver } from '@app/types/seasonDriver';
import type { LeagueDriver } from '@app/types/driver';
import type { Team } from '@app/types/team';
import type { Division } from '@app/types/division';
import { usesPsnId, usesIracingId } from '@app/constants/platforms';

import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import { TechDataTable, DriverCell } from '@app/components/common/tables';
import { Button } from '@app/components/common/buttons';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import ViewDriverModal from '@app/components/driver/ViewDriverModal.vue';
import { PhArrowClockwise } from '@phosphor-icons/vue';

import { ROWS_PER_PAGE_OPTIONS } from '@app/constants/pagination';
import { PhUsers, PhEye, PhTrash } from '@phosphor-icons/vue';

interface Props {
  seasonId: number;
  loading?: boolean;
  platformId?: number;
  showNumberColumn?: boolean;
  teamChampionshipEnabled?: boolean;
  teams?: Team[];
  raceDivisionsEnabled?: boolean;
  divisions?: Division[];
  showManageButton?: boolean;
  manageButtonDisabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  platformId: undefined,
  showNumberColumn: true,
  teamChampionshipEnabled: false,
  teams: () => [],
  raceDivisionsEnabled: false,
  divisions: () => [],
  showManageButton: true,
  manageButtonDisabled: false,
});

const emit = defineEmits<{
  manageDrivers: [];
}>();

const route = useRoute();
const confirm = useConfirm();
const toast = useToast();
const seasonDriverStore = useSeasonDriverStore();
const driverStore = useDriverStore();
const teamStore = useTeamStore();
const divisionStore = useDivisionStore();

// Modal state
const showViewDriverModal = ref(false);
const selectedDriver = ref<LeagueDriver | null>(null);
const loadingDriver = ref(false);

const updatingTeam = ref<{ [key: number]: boolean }>({});
const updatingDivision = ref<{ [key: number]: boolean }>({});

// Filter state
// null = "All", 0 = "No Division"/"Privateer" (filters for NULL in DB), number = specific ID
const selectedDivision = ref<number | null>(null);
const selectedTeam = ref<number | null>(null);

// Search state
const searchQuery = ref('');

// Track if we're currently doing a search (separate from store loading)
// This prevents the input from being disabled during search
const isSearchActive = ref(false);

// Setup debounced search - input stays enabled so focus is never lost
const { isSearching } = useDebouncedSearch(searchQuery, async (query) => {
  seasonDriverStore.setSearchQuery(query);
  isSearchActive.value = true;
  try {
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId, {
      page: 1, // Reset to page 1 when searching
      search: query,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to search drivers';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isSearchActive.value = false;
  }
});

// Computed to determine if input should be disabled
// Only disable for initial loading, NOT during search
const isInputDisabled = computed(
  () => props.loading && !isSearchActive.value && !isSearching.value,
);

const drivers = computed(() => seasonDriverStore.seasonDrivers);
const totalRecords = computed(() => seasonDriverStore.totalDrivers);
const currentPage = computed(() => seasonDriverStore.currentPage);
const perPage = computed(() => seasonDriverStore.perPage);

const showPsnColumn = computed(() => usesPsnId(props.platformId));

const showIracingColumn = computed(() => usesIracingId(props.platformId));

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

/**
 * Handle pagination changes
 */
async function onPage(event: DataTablePageEvent): Promise<void> {
  const newPage = event.page + 1; // PrimeVue uses 0-based index
  const newPerPage = event.rows;

  try {
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId, {
      page: newPage,
      per_page: newPerPage,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load drivers';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  }
}

/**
 * Handle sort changes
 */
async function onSort(event: DataTableSortEvent): Promise<void> {
  const field = event.sortField as string;
  const order = event.sortOrder === 1 ? 'asc' : 'desc';

  seasonDriverStore.setSortField(field);
  seasonDriverStore.setSortOrder(order);

  try {
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId, {
      page: 1, // Reset to page 1 when sorting
      order_by: field,
      order_direction: order,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load drivers';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  }
}

/**
 * Handle filter changes
 */
async function onFilterChange(): Promise<void> {
  seasonDriverStore.setDivisionFilter(selectedDivision.value);
  seasonDriverStore.setTeamFilter(selectedTeam.value);

  try {
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId, {
      page: 1, // Reset to page 1 when filtering
      division_id: selectedDivision.value,
      team_id: selectedTeam.value,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load drivers';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  }
}

// Team selection options
interface TeamOption {
  label: string;
  value: number | null;
  logo_url?: string | null;
}

// Create team name to ID map to avoid repeated find operations
const teamNameToIdMap = computed(() => {
  const map = new Map<string, number>();
  props.teams.forEach((t) => map.set(t.name, t.id));
  return map;
});

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
  // Use map lookup instead of find operation
  if (!driver.team_name) return null;
  return teamNameToIdMap.value.get(driver.team_name) ?? null;
}

async function handleTeamChange(driver: SeasonDriver, newTeamId: number | null): Promise<void> {
  updatingTeam.value[driver.id] = true;

  try {
    await teamStore.assignDriverToTeam(props.seasonId, driver.id, {
      team_id: newTeamId,
    });

    // Update local state using store action instead of direct mutation
    const teamName = newTeamId ? props.teams.find((t) => t.id === newTeamId)?.name || null : null;
    seasonDriverStore.updateLocalDriverProperty(driver.id, 'team_name', teamName);

    const displayTeamName = newTeamId
      ? props.teams.find((t) => t.id === newTeamId)?.name || 'team'
      : 'Privateer';

    toast.add({
      severity: 'success',
      summary: 'Team Updated',
      detail: `Driver assigned to ${displayTeamName}`,
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

// Division selection options
interface DivisionOption {
  label: string;
  value: number | null;
  logo_url?: string | null;
}

// Create division name to ID map to avoid repeated find operations
const divisionNameToIdMap = computed(() => {
  const map = new Map<string, number>();
  props.divisions.forEach((d) => map.set(d.name, d.id));
  return map;
});

const divisionOptions = computed((): DivisionOption[] => {
  const options: DivisionOption[] = [
    {
      label: 'No Division',
      value: null,
    },
  ];

  props.divisions.forEach((division) => {
    options.push({
      label: division.name,
      value: division.id,
      logo_url: division.logo_url,
    });
  });

  return options;
});

function getDriverDivisionId(driver: SeasonDriver): number | null {
  // Use map lookup instead of find operation
  if (!driver.division_name) return null;
  return divisionNameToIdMap.value.get(driver.division_name) ?? null;
}

async function handleDivisionChange(
  driver: SeasonDriver,
  newDivisionId: number | null,
): Promise<void> {
  updatingDivision.value[driver.id] = true;

  try {
    await divisionStore.assignDriverDivision(props.seasonId, driver.id, {
      division_id: newDivisionId,
    });

    // Update local state using store action instead of direct mutation
    const divisionName = newDivisionId
      ? props.divisions.find((d) => d.id === newDivisionId)?.name || null
      : null;
    seasonDriverStore.updateLocalDriverProperty(driver.id, 'division_name', divisionName);

    const displayDivisionName = newDivisionId
      ? props.divisions.find((d) => d.id === newDivisionId)?.name || 'division'
      : 'No Division';

    toast.add({
      severity: 'success',
      summary: 'Division Updated',
      detail: `Driver assigned to ${displayDivisionName}`,
      life: 3000,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update division';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    updatingDivision.value[driver.id] = false;
  }
}

// Filter options for division dropdown
interface DivisionFilterOption {
  label: string;
  value: number | null;
}

const divisionFilterOptions = computed((): DivisionFilterOption[] => {
  const options: DivisionFilterOption[] = [
    {
      label: 'All Divisions',
      value: null,
    },
    {
      label: 'No Division',
      value: 0,
    },
  ];

  props.divisions.forEach((division) => {
    options.push({
      label: division.name,
      value: division.id,
    });
  });

  return options;
});

// Filter options for team dropdown
interface TeamFilterOption {
  label: string;
  value: number | null;
}

const teamFilterOptions = computed((): TeamFilterOption[] => {
  const options: TeamFilterOption[] = [
    {
      label: 'All Teams',
      value: null,
    },
    {
      label: 'Privateer',
      value: 0,
    },
  ];

  props.teams.forEach((team) => {
    options.push({
      label: team.name,
      value: team.id,
    });
  });

  return options;
});

/**
 * Handle refresh button click
 * Clears all filters and reloads the drivers table from page 1
 */
async function handleRefresh(): Promise<void> {
  // Reset all filter state variables
  searchQuery.value = '';
  selectedDivision.value = null;
  selectedTeam.value = null;

  // Clear store filters
  seasonDriverStore.setSearchQuery('');
  seasonDriverStore.setDivisionFilter(null);
  seasonDriverStore.setTeamFilter(null);

  try {
    // Fetch fresh data from page 1
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId, { page: 1 });

    toast.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Drivers table refreshed',
      life: 3000,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to refresh drivers table';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
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

    <!-- Search and Filters Bar - Only when divisions or teams are enabled -->
    <div
      v-if="raceDivisionsEnabled || teamChampionshipEnabled"
      class="flex flex-row gap-4 mb-6 border border-[var(--border)] bg-[var(--bg-elevated)] p-2 rounded-md"
    >
      <div class="flex items-end gap-3 flex-wrap">
        <div class="flex-1 max-w-md">
          <IconField>
            <InputIcon :class="isSearching ? 'pi pi-spinner pi-spin' : 'pi pi-search'" />
            <InputText
              v-model="searchQuery"
              placeholder="Search drivers by name..."
              class="w-full"
              :disabled="isInputDisabled"
            />
          </IconField>
        </div>

        <div v-if="raceDivisionsEnabled" class="flex flex-col gap-2">
          <label for="division-filter" class="text-sm font-medium">Division</label>
          <Select
            id="division-filter"
            v-model="selectedDivision"
            :options="divisionFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="All Divisions"
            class="w-52"
            @change="onFilterChange"
          />
        </div>

        <div v-if="teamChampionshipEnabled" class="flex flex-col gap-2">
          <label for="team-filter" class="text-sm font-medium">Team</label>
          <Select
            id="team-filter"
            v-model="selectedTeam"
            :options="teamFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="All Teams"
            class="w-52"
            @change="onFilterChange"
          />
        </div>
      </div>
      <div class="flex items-end gap-3 flex-1 justify-end">
        <!-- Manage Drivers Button -->
        <Button
          v-if="showManageButton"
          label="Manage Drivers"
          :icon="PhUsers"
          :disabled="manageButtonDisabled"
          @click="emit('manageDrivers')"
        />

        <!-- Refresh Drivers Table Button -->
        <Button
          label="Refresh Drivers Table"
          :icon="PhArrowClockwise"
          variant="warning"
          @click="handleRefresh"
        />
      </div>
    </div>

    <TechDataTable
      :value="drivers"
      :loading="loading || loadingDriver"
      lazy
      paginator
      :rows="perPage"
      :rows-per-page-options="ROWS_PER_PAGE_OPTIONS"
      :total-records="totalRecords"
      :first="(currentPage - 1) * perPage"
      entity-name="drivers"
      responsive-layout="scroll"
      @page="onPage"
      @sort="onSort"
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

      <Column field="driver_name" header="Driver" sortable>
        <template #body="{ data }">
          <DriverCell :name="getDriverDisplayName(data)" />
        </template>
      </Column>

      <Column field="discord_id" header="Discord" sortable>
        <template #body="{ data }">
          <span class="text-[var(--text-secondary)]">{{ data.discord_id || '-' }}</span>
        </template>
      </Column>

      <Column v-if="showPsnColumn" field="psn_id" header="PSN ID" sortable>
        <template #body="{ data }">
          <span class="text-[var(--text-secondary)]">{{ data.psn_id || '-' }}</span>
        </template>
      </Column>

      <Column v-if="showIracingColumn" field="iracing_id" header="iRacing ID" sortable>
        <template #body="{ data }">
          <span class="text-[var(--text-secondary)]">{{ data.iracing_id || '-' }}</span>
        </template>
      </Column>

      <Column v-if="showNumberColumn" field="driver_number" header="#" class="text-center" sortable>
        <template #body="{ data }">
          <span class="text-[var(--text-secondary)]">{{ data.driver_number || '-' }}</span>
        </template>
      </Column>

      <Column v-if="raceDivisionsEnabled" field="division_name" header="Division" sortable>
        <template #body="{ data }">
          <Select
            :model-value="getDriverDivisionId(data)"
            :options="divisionOptions"
            option-label="label"
            option-value="value"
            placeholder="Select division"
            :loading="updatingDivision[data.id]"
            :disabled="updatingDivision[data.id]"
            class="w-full min-w-[150px]"
            @change="(event) => handleDivisionChange(data, event.value)"
          >
            <template #value="slotProps">
              <div
                v-if="slotProps.value !== null && slotProps.value !== undefined"
                class="flex items-center gap-2"
              >
                <img
                  v-if="divisionOptions.find((opt) => opt.value === slotProps.value)?.logo_url"
                  :src="divisionOptions.find((opt) => opt.value === slotProps.value)!.logo_url!"
                  :alt="divisionOptions.find((opt) => opt.value === slotProps.value)?.label"
                  class="w-5 h-5 rounded object-cover"
                />
                <span>{{
                  divisionOptions.find((opt) => opt.value === slotProps.value)?.label
                }}</span>
              </div>
              <span v-else>No Division</span>
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

      <Column v-if="teamChampionshipEnabled" field="team_name" header="Team" sortable>
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
            <Button
              :icon="PhEye"
              size="sm"
              variant="outline"
              aria-label="View driver"
              @click="handleView(data)"
            />
            <Button
              :icon="PhTrash"
              size="sm"
              variant="danger"
              aria-label="Remove driver"
              @click="handleRemove(data)"
            />
          </div>
        </template>
      </Column>
    </TechDataTable>
  </div>
</template>

<style scoped>
/* Smooth transitions for table rows */
.season-drivers-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.3s ease-in-out;
}

/* Fade in animation for new rows */
.season-drivers-table :deep(.p-datatable-tbody > tr) {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth hover effect */
.season-drivers-table :deep(.p-datatable-tbody > tr:hover) {
  transform: scale(1.001);
}
</style>
