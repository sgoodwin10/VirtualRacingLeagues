<template>
  <BaseModal
    v-model:visible="isVisible"
    :width="modalWidth"
    :closable="!isSaving"
    @hide="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <PhTrophy :size="24" class="text-amber-500" />
        <h2 class="text-xl font-semibold text-primary">
          {{ isQualifying ? 'Qualifying' : 'Race' }} Results
          <span v-if="!isQualifying">- {{ raceName }}</span>
        </h2>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Loading State -->
      <div v-if="isLoadingDrivers" class="flex items-center justify-center py-12">
        <i class="pi pi-spin pi-spinner text-4xl text-surface-400"></i>
        <span class="ml-3 text-secondary">Loading drivers...</span>
      </div>

      <template v-else>
        <!-- CSV Import Section (hidden in read-only mode) -->
        <ResultCsvImport
          v-if="!isReadOnly"
          :is-qualifying="isQualifying"
          :race-times-required="raceTimesRequired"
          @parse="handleCsvParse"
        />

        <!-- Missing Drivers Warning -->
        <Message
          v-if="missingDriverNames.length > 0"
          variant="warning"
          :closable="true"
          @close="missingDriverNames = []"
        >
          <div>
            <strong>{{ missingDriverNames.length }} driver(s) not found in this season:</strong>
            <ul class="mt-2 mb-2 list-disc list-inside">
              <li v-for="name in missingDriverNames" :key="name">{{ name }}</li>
            </ul>
            <p class="text-sm">
              Please add these drivers to the season before importing their results.
            </p>
          </div>
        </Message>

        <!-- Empty State (no results yet, edit mode) -->
        <div
          v-if="!isReadOnly && formResults.length === 0 && allDrivers.length > 0"
          class="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-surface-300 rounded-lg bg-surface-50"
        >
          <PhTrophy :size="48" class="text-surface-400 mb-4" />
          <h3 class="text-lg font-semibold text-surface-700 mb-2">No Results Entered Yet</h3>
          <p class="text-surface-600 text-center mb-6 max-w-md">
            Get started by importing results from a CSV file above, or manually add drivers to enter
            their results one by one.
          </p>
        </div>

        <!-- Empty State (no results saved, read-only mode) -->
        <div
          v-if="isReadOnly && formResults.length === 0 && allDrivers.length > 0"
          class="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-surface-300 rounded-lg bg-surface-50"
        >
          <PhTrophy :size="48" class="text-surface-400 mb-4" />
          <h3 class="text-lg font-semibold text-surface-700 mb-2">No Results Recorded</h3>
          <p class="text-surface-600 text-center max-w-md">
            No results were recorded for this {{ isQualifying ? 'qualifying session' : 'race' }}.
          </p>
        </div>

        <!-- No Drivers Warning -->
        <div
          v-if="allDrivers.length === 0"
          class="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-amber-500/50 rounded-lg bg-amber-500/10"
        >
          <i class="pi pi-exclamation-triangle text-4xl text-amber-500 mb-4"></i>
          <h3 class="text-lg font-semibold text-primary mb-2">No Drivers in Season</h3>
          <p class="text-secondary text-center max-w-md">
            No drivers have been added to this season yet. Please add drivers to the season before
            entering results.
          </p>
        </div>

        <!-- Results Entry Section -->
        <ResultDivisionTabs
          v-if="hasDivisions && allDrivers.length > 0"
          v-model:results="formResults"
          :divisions="divisions"
          :drivers-by-division="driversByDivision"
          :is-qualifying="isQualifying"
          :selected-driver-ids="selectedDriverIds"
          :read-only="isReadOnly"
          :race-times-required="raceTimesRequired"
          @update:results="handleResultsUpdate"
          @reset-all="handleResetAll"
          @penalty-change="handlePenaltyChange"
        />

        <ResultEntryTable
          v-else-if="!hasDivisions && allDrivers.length > 0"
          v-model:results="formResults"
          :drivers="allDrivers"
          :is-qualifying="isQualifying"
          :selected-driver-ids="selectedDriverIds"
          :read-only="isReadOnly"
          :race-times-required="raceTimesRequired"
          @update:results="handleResultsUpdate"
          @penalty-change="handlePenaltyChange"
        />
      </template>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <!-- Left side: Download button (read-only mode only) -->
        <div v-if="isReadOnly && formResults.length > 0">
          <Button
            label="Download CSV"
            variant="secondary"
            :icon="PhDownload"
            :loading="isDownloading"
            @click="handleDownloadCsv"
          />
        </div>
        <div v-else></div>

        <!-- Right side: existing buttons -->
        <div class="flex gap-3">
          <!-- Read-only mode: just show Close button -->
          <template v-if="isReadOnly">
            <Button label="Close" variant="secondary" @click="handleClose" />
          </template>
          <!-- Edit mode: show Cancel and Save buttons -->
          <template v-else>
            <Button label="Cancel" variant="secondary" :disabled="isSaving" @click="handleClose" />
            <Button
              label="Save Results"
              variant="success"
              :loading="isSaving"
              :disabled="!canSave"
              @click="handleSave"
            />
          </template>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { Button } from '@app/components/common/buttons';
import Message from 'primevue/message';
import { useToast } from 'primevue/usetoast';
import { PhTrophy, PhDownload } from '@phosphor-icons/vue';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import ResultCsvImport from '@app/components/result/ResultCsvImport.vue';
import ResultDivisionTabs from '@app/components/result/ResultDivisionTabs.vue';
import ResultEntryTable from '@app/components/result/ResultEntryTable.vue';
import { useRaceResultStore } from '@app/stores/raceResultStore';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useDivisionStore } from '@app/stores/divisionStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import { useRaceTimeCalculation } from '@app/composables/useRaceTimeCalculation';
import { useCsvExport } from '@app/composables/useCsvExport';
import { PSN_BASED_PLATFORMS, PLATFORM_SLUG_IRACING } from '@app/constants/platforms';
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
const toast = useToast();
const { parseTimeToMs, normalizeTimeInput } = useRaceTimeCalculation();
const { isDownloading, downloadRaceResultsCsv } = useCsvExport();

// Local state
const formResults = ref<RaceResultFormData[]>([]);
const isSaving = ref(false);
const isLoadingDrivers = ref(false);
const isResetting = ref(false);
const missingDriverNames = ref<string[]>([]);

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

const raceTimesRequired = computed(() => {
  return seasonStore.currentSeason?.race_times_required ?? true;
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

// Computed property that creates a Set of selected driver IDs
// Vue caches this computed property, so the Set is only recreated when formResults changes
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
  // Initialize with empty array - user adds drivers manually
  formResults.value = [];
}

function handleCsvParse(parsedRows: CsvResultRow[]): void {
  // Reset missing drivers list
  missingDriverNames.value = [];
  // Create Set BEFORE the loop to track processed driver names
  const processedDriverNames = new Set<string>();

  // Match parsed CSV rows to drivers and populate form
  for (const csvRow of parsedRows) {
    const matchedDriver = findDriverByName(csvRow.driver);
    if (!matchedDriver) {
      // Track the missing driver name (avoid duplicates)
      if (!processedDriverNames.has(csvRow.driver)) {
        missingDriverNames.value.push(csvRow.driver);
        processedDriverNames.add(csvRow.driver);
      }
      continue;
    }

    // Check if this driver already exists in the form
    let formRow = formResults.value.find((r) => r.driver_id === matchedDriver.id);

    if (!formRow) {
      // Create a new row for this driver
      formRow = {
        driver_id: matchedDriver.id,
        division_id: matchedDriver.division_id ?? null,
        position: null,
        original_race_time: '',
        original_race_time_difference: '',
        fastest_lap: '',
        penalties: '',
        has_fastest_lap: false,
        has_pole: false,
        dnf: false,
        _originalPenalties: '',
        _penaltyChanged: false,
      };
      formResults.value.push(formRow);
    }

    // Handle DNF flag from CSV
    if (csvRow.dnf !== undefined) {
      formRow.dnf = csvRow.dnf;
    }

    // Normalize time values from CSV before assigning
    // Use race_time or original_race_time if provided, otherwise use difference
    const raceTimeValue = csvRow.original_race_time || csvRow.race_time;
    if (raceTimeValue) {
      formRow.original_race_time = normalizeTimeInput(raceTimeValue);
      formRow.original_race_time_difference = '';
    } else if (csvRow.original_race_time_difference) {
      formRow.original_race_time_difference = normalizeTimeInput(
        csvRow.original_race_time_difference,
      );
    }

    if (csvRow.fastest_lap_time) {
      formRow.fastest_lap = normalizeTimeInput(csvRow.fastest_lap_time);
    }

    // Handle penalties from CSV
    if (csvRow.penalties) {
      formRow.penalties = normalizeTimeInput(csvRow.penalties);
      formRow._originalPenalties = formRow.penalties;
      formRow._penaltyChanged = false;
    }
  }

  // Show warning if there are missing drivers
  if (missingDriverNames.value.length > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Drivers Not Found',
      detail: `${missingDriverNames.value.length} driver(s) from CSV were not found in the season.`,
      life: 5000,
    });
  }

  // Recalculate times from differences
  recalculateTimesFromDifferences();

  // ONE-TIME SORT after CSV import (only if times exist)
  if (isQualifying.value) {
    // Sort by fastest lap for qualifying
    sortFormResultsByFastestLap();
  } else {
    // Sort by race time for races (if any have times)
    const hasAnyTimes = formResults.value.some((r) => r.original_race_time);
    if (hasAnyTimes) {
      sortFormResultsByRaceTime();
    }
  }
}

// Map game platform slugs to their corresponding driver identity field
function getPlatformIdField(platformSlug: string | undefined): 'psn_id' | 'iracing_id' | null {
  if (!platformSlug) return null;

  // PSN-based games (PlayStation Network ID)
  if (PSN_BASED_PLATFORMS.includes(platformSlug as (typeof PSN_BASED_PLATFORMS)[number])) {
    return 'psn_id';
  }

  // iRacing uses its own ID system
  if (platformSlug === PLATFORM_SLUG_IRACING) {
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
  // No automatic recalculation - times are set via CSV import or direct entry
}

/**
 * Sort form results by race time (one-time sort after CSV import)
 */
function sortFormResultsByRaceTime(): void {
  const { sortResultsByTime } = useRaceTimeCalculation();
  formResults.value = sortResultsByTime(formResults.value, false);
}

/**
 * Sort form results by fastest lap (one-time sort after CSV import for qualifying)
 */
function sortFormResultsByFastestLap(): void {
  const { sortResultsByTime } = useRaceTimeCalculation();
  formResults.value = sortResultsByTime(formResults.value, true);
}

async function handleResetAll(): Promise<void> {
  isResetting.value = true;

  try {
    // Delete all results from the database
    await raceResultStore.deleteResults(props.race.id);

    // Reset the form to a completely fresh state (empty array)
    formResults.value = [];

    toast.add({
      severity: 'success',
      summary: 'Results Deleted',
      detail: 'All results have been successfully deleted from the database.',
      life: 3000,
    });
  } catch (error) {
    console.error('Failed to delete results:', error);
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: 'Failed to delete results. Please try again.',
      life: 5000,
    });
  } finally {
    isResetting.value = false;
  }
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
      if (!result.original_race_time) continue;
      const timeMs = parseTimeToMs(result.original_race_time);
      if (timeMs !== null && (divisionLeaderTime === null || timeMs < divisionLeaderTime)) {
        divisionLeaderTime = timeMs;
      }
    }
    if (divisionLeaderTime !== null) {
      leaderTimeByDivision.set(divisionId, divisionLeaderTime);
    }
  }

  // Calculate original_race_time for rows that only have difference, using their division's leader time
  for (const result of formResults.value) {
    if (!result.driver_id) continue;
    if (result.original_race_time) continue; // Already has race time
    if (!result.original_race_time_difference) continue;

    const divisionId = result.division_id ?? null;
    const leaderTimeMs = leaderTimeByDivision.get(divisionId);
    if (leaderTimeMs === undefined) continue;

    const diffMs = parseTimeToMs(result.original_race_time_difference);
    if (diffMs !== null) {
      const totalMs = leaderTimeMs + diffMs;
      const hours = Math.floor(totalMs / 3600000);
      const mins = Math.floor((totalMs % 3600000) / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      const ms = totalMs % 1000;
      result.original_race_time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }
  }
}

async function handleSave(): Promise<void> {
  isSaving.value = true;

  try {
    // Filter to only results with drivers
    const resultsWithDrivers = formResults.value.filter((r) => r.driver_id !== null);

    // Assign positions based on current table order (respects drag-and-drop)
    // Group by division if divisions are enabled
    let sortedResults: RaceResultFormData[];

    if (hasDivisions.value) {
      // Group by division and assign positions within each division based on order
      const byDivision = new Map<number | null, RaceResultFormData[]>();
      resultsWithDrivers.forEach((r) => {
        const divId = r.division_id ?? null;
        if (!byDivision.has(divId)) byDivision.set(divId, []);
        byDivision.get(divId)!.push(r);
      });

      sortedResults = [];
      Array.from(byDivision.values()).forEach((divResults) => {
        // Assign positions based on current order in each division
        divResults.forEach((result, idx) => {
          result.position = idx + 1;
          sortedResults.push(result);
        });
      });
    } else {
      // No divisions: assign positions based on current order
      sortedResults = resultsWithDrivers.map((result, idx) => ({
        ...result,
        position: idx + 1,
      }));
    }

    // Build payload (exclude transient fields)
    const payload: BulkRaceResultsPayload = {
      results: sortedResults.map((r) => ({
        driver_id: r.driver_id!,
        division_id: r.division_id ?? null,
        position: r.position!, // Use calculated position, not index
        original_race_time: r.original_race_time || null,
        original_race_time_difference: r.original_race_time_difference || null,
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
  missingDriverNames.value = [];
}

/**
 * Handle CSV download
 */
async function handleDownloadCsv(): Promise<void> {
  await downloadRaceResultsCsv(props.race.id);
}

/**
 * Populate form with existing results from the store
 * Only loads saved results (not all drivers), sorted by position
 */
function populateFormWithResults(): void {
  // Check the actual results array directly to avoid reactivity timing issues
  if (raceResultStore.results.length === 0) {
    return;
  }

  // Only load saved results (not all drivers)
  // Sort by position to maintain saved order
  const sortedResults = [...raceResultStore.results].sort(
    (a, b) => (a.position ?? 999) - (b.position ?? 999),
  );

  formResults.value = sortedResults.map((result) => ({
    driver_id: result.driver_id,
    division_id: result.division_id ?? null,
    position: result.position,
    original_race_time: result.original_race_time || '',
    final_race_time: result.final_race_time || '',
    original_race_time_difference: result.original_race_time_difference || '',
    final_race_time_difference: result.final_race_time_difference || '',
    fastest_lap: result.fastest_lap || '',
    penalties: result.penalties || '',
    has_fastest_lap: result.has_fastest_lap,
    has_pole: result.has_pole,
    dnf: result.dnf,
    _originalPenalties: result.penalties || '',
    _penaltyChanged: false,
  }));
}

/**
 * Handle penalty change - track if penalty was modified this session
 */
function handlePenaltyChange(row: RaceResultFormData): void {
  const originalPenalty = row._originalPenalties ?? '';
  const currentPenalty = row.penalties ?? '';
  row._penaltyChanged = originalPenalty !== currentPenalty;
}

// Load drivers and results data
async function loadData(): Promise<void> {
  isLoadingDrivers.value = true;

  try {
    // Fetch divisions if the season has divisions enabled
    if (hasDivisions.value) {
      await divisionStore.fetchDivisions(props.seasonId);
    }

    // Fetch ALL season drivers with pagination
    // Reset filters to ensure we get all drivers
    seasonDriverStore.resetFilters();

    const perPage = 100; // Max allowed by backend validation
    let currentPage = 1;
    let hasMorePages = true;
    const allDriversArray: SeasonDriver[] = [];

    // Fetch all pages of drivers
    // Note: Sequential fetching could be optimized with parallel requests in the future
    while (hasMorePages) {
      // Safety check to prevent infinite loops (before fetching)
      if (
        currentPage > 100 ||
        (seasonDriverStore.lastPage && currentPage > seasonDriverStore.lastPage)
      ) {
        console.warn('Reached maximum page limit (100) while fetching season drivers');
        toast.add({
          severity: 'warn',
          summary: 'Driver Fetch Limit',
          detail: 'Could not fetch all drivers. Maximum pagination limit reached (10,000 drivers).',
          life: 5000,
        });
        break;
      }

      await seasonDriverStore.fetchSeasonDrivers(props.seasonId, {
        per_page: perPage,
        page: currentPage,
      });

      // Get the current page data (store replaces data on each fetch)
      const currentPageDrivers = [...seasonDriverStore.seasonDrivers];
      const returnedCount = currentPageDrivers.length;

      // Add drivers from current page to our local array
      allDriversArray.push(...currentPageDrivers);

      // Check if there are more pages based on:
      // 1. Number of drivers returned (if less than perPage, we've reached the end)
      // 2. Store pagination metadata (more reliable)
      hasMorePages = returnedCount === perPage && currentPage < seasonDriverStore.lastPage;
      currentPage++;
    }

    // Copy drivers to local state to ensure reactivity
    localDrivers.value = allDriversArray;

    // Wait for the next tick to ensure computed properties are updated
    await nextTick();

    // Now initialize the form with the loaded drivers
    initializeForm();

    // Load existing results if any
    await raceResultStore.fetchResults(props.race.id);

    // Wait for Vue's reactivity to settle after store update
    await nextTick();

    // Populate form with existing results
    populateFormWithResults();
  } catch (error) {
    console.error('Error loading data:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load drivers and results',
      life: 5000,
    });
  } finally {
    isLoadingDrivers.value = false;
  }
}

// Load data when modal opens
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
