<template>
  <BaseModal
    v-model:visible="isVisible"
    :width="modalWidth"
    :closable="!isSaving"
    @hide="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <PhTrophy :size="24" class="text-amber-600" />
        <h2 class="text-xl font-semibold text-gray-900">
          {{ isQualifying ? 'Qualifying' : 'Race' }} Results
          <span v-if="!isQualifying">- {{ raceName }}</span>
        </h2>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Loading State -->
      <div v-if="isLoadingDrivers" class="flex items-center justify-center py-12">
        <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
        <span class="ml-3 text-gray-500">Loading drivers...</span>
      </div>

      <template v-else>
        <!-- CSV Import Section (hidden in read-only mode) -->
        <ResultCsvImport v-if="!isReadOnly" :is-qualifying="isQualifying" @parse="handleCsvParse" />

        <!-- Results Entry Section -->
        <ResultDivisionTabs
          v-if="hasDivisions"
          v-model:results="formResults"
          :divisions="divisions"
          :drivers-by-division="driversByDivision"
          :is-qualifying="isQualifying"
          :selected-driver-ids="selectedDriverIds"
          :read-only="isReadOnly"
          @update:results="handleResultsUpdate"
          @reset-all="handleResetAll"
        />

        <ResultEntryTable
          v-else
          v-model:results="formResults"
          :drivers="allDrivers"
          :is-qualifying="isQualifying"
          :selected-driver-ids="selectedDriverIds"
          :read-only="isReadOnly"
          @update:results="handleResultsUpdate"
        />
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <!-- Read-only mode: just show Close button -->
        <template v-if="isReadOnly">
          <Button label="Close" severity="secondary" @click="handleClose" />
        </template>
        <!-- Edit mode: show Cancel and Save buttons -->
        <template v-else>
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            :disabled="isSaving"
            @click="handleClose"
          />
          <Button
            label="Save Results"
            severity="success"
            :loading="isSaving"
            :disabled="!canSave"
            @click="handleSave"
          />
        </template>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import Button from 'primevue/button';
import { PhTrophy } from '@phosphor-icons/vue';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import ResultCsvImport from '@app/components/result/ResultCsvImport.vue';
import ResultDivisionTabs from '@app/components/result/ResultDivisionTabs.vue';
import ResultEntryTable from '@app/components/result/ResultEntryTable.vue';
import { useRaceResultStore } from '@app/stores/raceResultStore';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useDivisionStore } from '@app/stores/divisionStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import { useRaceTimeCalculation } from '@app/composables/useRaceTimeCalculation';
import type {
  RaceResultFormData,
  CsvResultRow,
  BulkRaceResultsPayload,
  DriverOption,
} from '@app/types/raceResult';
import type { Race } from '@app/types/race';
import type { Round } from '@app/types/round';
import type { Division } from '@app/types/division';
import type { SeasonDriver } from '@app/types/seasonDriver';

interface Props {
  race: Race;
  round: Round;
  visible: boolean;
  seasonId: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const raceResultStore = useRaceResultStore();
const seasonStore = useSeasonStore();
const divisionStore = useDivisionStore();
const seasonDriverStore = useSeasonDriverStore();
const { calculatePositions, parseTimeToMs, normalizeTimeInput } = useRaceTimeCalculation();

// Local state
const formResults = ref<RaceResultFormData[]>([]);
const isSaving = ref(false);
const isLoadingDrivers = ref(false);

// Local copy of drivers to ensure reactivity
const localDrivers = ref<SeasonDriver[]>([]);

// Determine modal width for qualifying or race
const modalWidth = computed(() => {
  if (isQualifying.value) {
    return '3xl';
  }
  return '5xl';
});

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isQualifying = computed(() => props.race.is_qualifier);

const raceName = computed(() => props.race.name || `Race ${props.race.race_number}`);

// Check if the modal should be in read-only mode (round or race is completed)
const isReadOnly = computed(() => {
  return props.round.status === 'completed' || props.race.status === 'completed';
});

const hasDivisions = computed(() => {
  return seasonStore.currentSeason?.race_divisions_enabled ?? false;
});

const divisions = computed<Division[]>(() => {
  return divisionStore.divisions || [];
});

const allDrivers = computed<DriverOption[]>(() => {
  // Use local copy of drivers to ensure reactivity
  return localDrivers.value.map((sd: SeasonDriver) => {
    const displayName =
      sd.nickname || [sd.first_name, sd.last_name].filter(Boolean).join(' ') || 'Unknown Driver';
    return {
      id: sd.id, // Use season_driver id for results (maps to driver_id in race_results)
      name: displayName,
      division_id: sd.division_id ?? undefined,
      nickname: sd.nickname,
      psn_id: sd.psn_id,
      iracing_id: sd.iracing_id,
      discord_id: sd.discord_id,
    };
  });
});

const driversByDivision = computed<Record<number, DriverOption[]>>(() => {
  const byDivision: Record<number, DriverOption[]> = {};
  for (const driver of allDrivers.value) {
    const divId = driver.division_id ?? 0;
    if (!byDivision[divId]) {
      byDivision[divId] = [];
    }
    byDivision[divId].push(driver);
  }
  return byDivision;
});

const selectedDriverIds = computed<Set<number>>(() => {
  const ids = new Set<number>();
  for (const result of formResults.value) {
    if (result.driver_id !== null) {
      ids.add(result.driver_id);
    }
  }
  return ids;
});

const canSave = computed(() => {
  // At least one result with a driver selected
  return formResults.value.some((r) => r.driver_id !== null);
});

// Methods
function initializeForm(): void {
  // Initialize with a row for each driver, pre-populated with their ID
  const drivers = allDrivers.value;
  formResults.value = drivers.map((driver) => ({
    driver_id: driver.id,
    division_id: driver.division_id ?? null,
    position: null,
    race_time: '',
    race_time_difference: '',
    fastest_lap: '',
    penalties: '',
    has_fastest_lap: false,
    has_pole: false,
    dnf: false,
  }));
}

function handleCsvParse(parsedRows: CsvResultRow[]): void {
  // Match parsed CSV rows to drivers and populate form
  for (const csvRow of parsedRows) {
    const matchedDriver = findDriverByName(csvRow.driver);
    if (!matchedDriver) continue;

    // Find or create a form row for this driver
    let formRow = formResults.value.find((r) => r.driver_id === matchedDriver.id);
    if (!formRow) {
      // Find first empty row
      formRow = formResults.value.find((r) => r.driver_id === null);
    }
    if (!formRow) continue;

    formRow.driver_id = matchedDriver.id;
    formRow.division_id = matchedDriver.division_id ?? null;

    // Handle DNF flag from CSV
    if (csvRow.dnf !== undefined) {
      formRow.dnf = csvRow.dnf;
    }

    // Normalize time values from CSV before assigning
    // Use race_time if provided, otherwise use difference
    if (csvRow.race_time) {
      formRow.race_time = normalizeTimeInput(csvRow.race_time);
      formRow.race_time_difference = '';
    } else if (csvRow.race_time_difference) {
      formRow.race_time_difference = normalizeTimeInput(csvRow.race_time_difference);
    }

    if (csvRow.fastest_lap_time) {
      formRow.fastest_lap = normalizeTimeInput(csvRow.fastest_lap_time);
    }
  }

  // Recalculate times from differences
  recalculateTimesFromDifferences();
}

// Map game platform slugs to their corresponding driver identity field
function getPlatformIdField(platformSlug: string | undefined): 'psn_id' | 'iracing_id' | null {
  if (!platformSlug) return null;

  // PSN-based games (PlayStation Network ID)
  const psnGames = ['gran-turismo-7', 'f1-24', 'assetto-corsa-competizione'];
  if (psnGames.includes(platformSlug)) {
    return 'psn_id';
  }

  // iRacing uses its own ID system
  if (platformSlug === 'iracing') {
    return 'iracing_id';
  }

  // Other games (rFactor 2, Automobilista 2) - may need additional mapping
  // For now, default to PSN as most common for console games
  return 'psn_id';
}

function findDriverByName(name: string): DriverOption | undefined {
  const searchValue = name.toLowerCase().trim();

  // Priority 1: Exact nickname match (case-insensitive)
  const nicknameMatch = allDrivers.value.find(
    (d) => d.nickname?.toLowerCase().trim() === searchValue,
  );
  if (nicknameMatch) {
    return nicknameMatch;
  }

  // Priority 2: Discord ID match (always checked regardless of platform)
  const discordMatch = allDrivers.value.find(
    (d) => d.discord_id?.toLowerCase().trim() === searchValue,
  );
  if (discordMatch) {
    return discordMatch;
  }

  // Priority 3: Platform ID match (based on league's selected game platform)
  const platformSlug = seasonStore.currentSeason?.competition?.platform?.slug;
  const platformIdField = getPlatformIdField(platformSlug);

  if (platformIdField) {
    const platformMatch = allDrivers.value.find((d) => {
      const platformId = d[platformIdField];
      return platformId?.toLowerCase().trim() === searchValue;
    });
    if (platformMatch) {
      return platformMatch;
    }
  } else {
    // Fallback: check all platform IDs when platform slug is not available
    const anyPlatformMatch = allDrivers.value.find((d) => {
      const psnMatch = d.psn_id?.toLowerCase().trim() === searchValue;
      const iracingMatch = d.iracing_id?.toLowerCase().trim() === searchValue;
      return psnMatch || iracingMatch;
    });
    if (anyPlatformMatch) {
      return anyPlatformMatch;
    }
  }

  // Priority 4: Exact full name match (case-insensitive)
  const exactNameMatch = allDrivers.value.find((d) => d.name.toLowerCase().trim() === searchValue);
  if (exactNameMatch) {
    return exactNameMatch;
  }

  // Priority 5: Partial/fuzzy match (fallback)
  const fuzzyMatch = allDrivers.value.find(
    (d) => d.name.toLowerCase().includes(searchValue) || searchValue.includes(d.name.toLowerCase()),
  );
  return fuzzyMatch;
}

function handleResultsUpdate(): void {
  // Recalculate positions and times when results change
  recalculateTimesFromDifferences();
}

function handleResetAll(): void {
  // Clear all result data while keeping driver_id and division_id
  formResults.value = formResults.value.map((result) => ({
    driver_id: result.driver_id,
    division_id: result.division_id,
    position: null,
    race_time: '',
    race_time_difference: '',
    fastest_lap: '',
    penalties: '',
    has_fastest_lap: false,
    has_pole: false,
    dnf: false,
  }));
}

function recalculateTimesFromDifferences(): void {
  if (isQualifying.value) return;

  // Group results by division to find each division's pole position
  const resultsByDivision = new Map<number | null, RaceResultFormData[]>();
  for (const result of formResults.value) {
    if (!result.driver_id) continue;
    const divisionId = result.division_id ?? null;
    if (!resultsByDivision.has(divisionId)) {
      resultsByDivision.set(divisionId, []);
    }
    resultsByDivision.get(divisionId)?.push(result);
  }

  // Find leader time for each division separately
  const leaderTimeByDivision = new Map<number | null, number>();
  for (const [divisionId, divisionResults] of resultsByDivision) {
    let divisionLeaderTime: number | null = null;
    for (const result of divisionResults) {
      if (!result.race_time) continue;
      const timeMs = parseTimeToMs(result.race_time);
      if (timeMs !== null && (divisionLeaderTime === null || timeMs < divisionLeaderTime)) {
        divisionLeaderTime = timeMs;
      }
    }
    if (divisionLeaderTime !== null) {
      leaderTimeByDivision.set(divisionId, divisionLeaderTime);
    }
  }

  // Calculate race_time for rows that only have difference, using their division's leader time
  for (const result of formResults.value) {
    if (!result.driver_id) continue;
    if (result.race_time) continue; // Already has race time
    if (!result.race_time_difference) continue;

    const divisionId = result.division_id ?? null;
    const leaderTimeMs = leaderTimeByDivision.get(divisionId);
    if (leaderTimeMs === undefined) continue;

    const diffMs = parseTimeToMs(result.race_time_difference);
    if (diffMs !== null) {
      const totalMs = leaderTimeMs + diffMs;
      const hours = Math.floor(totalMs / 3600000);
      const mins = Math.floor((totalMs % 3600000) / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      const ms = totalMs % 1000;
      result.race_time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }
  }
}

async function handleSave(): Promise<void> {
  isSaving.value = true;

  try {
    // Calculate final positions
    const sortedResults = calculatePositions(
      formResults.value.filter((r) => r.driver_id !== null),
      isQualifying.value,
    );

    // Build payload
    const payload: BulkRaceResultsPayload = {
      results: sortedResults.map((r, index) => ({
        driver_id: r.driver_id!,
        division_id: r.division_id ?? null,
        position: index + 1,
        race_time: r.race_time || null,
        race_time_difference: r.race_time_difference || null,
        fastest_lap: r.fastest_lap || null,
        penalties: r.penalties || null,
        has_fastest_lap: r.has_fastest_lap,
        has_pole: r.has_pole,
        dnf: r.dnf,
      })),
    };

    await raceResultStore.saveResults(props.race.id, payload);
    emit('saved');
    handleClose();
  } catch (error) {
    console.error('Failed to save results:', error);
    // Toast notification handled by store
  } finally {
    isSaving.value = false;
  }
}

function handleClose(): void {
  isVisible.value = false;
  formResults.value = [];
  localDrivers.value = [];
}

// Load drivers and results data
async function loadData(): Promise<void> {
  isLoadingDrivers.value = true;

  try {
    // Fetch ALL season drivers first (max 100 per page allowed by backend)
    // Reset filters to ensure we get all drivers
    seasonDriverStore.resetFilters();
    await seasonDriverStore.fetchSeasonDrivers(props.seasonId, {
      per_page: 100, // Max allowed by backend validation
      page: 1,
    });

    // Copy drivers to local state to ensure reactivity
    localDrivers.value = [...seasonDriverStore.seasonDrivers];

    // Wait for the next tick to ensure computed properties are updated
    await nextTick();

    // Now initialize the form with the loaded drivers
    initializeForm();

    // Load existing results if any
    await raceResultStore.fetchResults(props.race.id);

    if (raceResultStore.hasResults) {
      // Populate form with existing results by matching driver_id
      for (const result of raceResultStore.results) {
        // Find the form row for this driver by matching driver_id
        const formRow = formResults.value.find((r) => r.driver_id === result.driver_id);

        if (formRow) {
          // Update the existing form row with saved result data
          formRow.division_id = result.division_id ?? null;
          formRow.position = result.position;
          formRow.race_time = result.race_time || '';
          formRow.race_time_difference = result.race_time_difference || '';
          formRow.fastest_lap = result.fastest_lap || '';
          formRow.penalties = result.penalties || '';
          formRow.has_fastest_lap = result.has_fastest_lap;
          formRow.has_pole = result.has_pole;
          formRow.dnf = result.dnf;
        } else {
          // Handle case where saved result's driver is not in current driver list
          console.warn(
            `Saved result for driver_id ${result.driver_id} not found in current season drivers`,
          );
        }
      }
    }
  } finally {
    isLoadingDrivers.value = false;
  }
}

// Load data when modal opens - use immediate: true to catch first open
watch(
  isVisible,
  async (visible) => {
    if (visible) {
      await loadData();
    }
  },
  { immediate: true },
);
</script>
