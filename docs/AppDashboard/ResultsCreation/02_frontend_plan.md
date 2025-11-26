# Race Results Feature - Frontend Implementation Plan

## Overview

This document details the frontend implementation for the Race Results feature in the User Dashboard (`app.virtualracingleagues.localhost`).

**Agent**: `dev-fe-app` (Vue.js Frontend Expert for App Dashboard)

---

## Implementation Order

1. TypeScript Types
2. API Service
3. Pinia Store
4. Time Calculation Composable
5. Vue Components
6. Integration with existing Race components
7. Tests

---

## Step 1: TypeScript Types

### File: `resources/app/js/types/raceResult.ts`

```typescript
// Race Result status
export type RaceResultStatus = 'pending' | 'confirmed';

// Single race result entry
export interface RaceResult {
  id: number;
  race_id: number;
  driver_id: number;
  position: number | null;
  race_time: string | null;           // hh:mm:ss.ms format
  race_time_difference: string | null;
  fastest_lap: string | null;
  penalties: string | null;
  has_fastest_lap: boolean;
  has_pole: boolean;
  status: RaceResultStatus;
  race_points: number;
  created_at: string;
  updated_at: string;
  // Eager loaded
  driver?: {
    id: number;
    name: string;
    division_id?: number;
  };
}

// Form data for a single result row (used in the UI before saving)
export interface RaceResultFormData {
  driver_id: number | null;
  position: number | null;
  race_time: string;
  race_time_difference: string;
  fastest_lap: string;
  penalties: string;
  has_fastest_lap: boolean;
  has_pole: boolean;
}

// Create/update payload for a single result
export interface CreateRaceResultPayload {
  driver_id: number;
  position?: number | null;
  race_time?: string | null;
  race_time_difference?: string | null;
  fastest_lap?: string | null;
  penalties?: string | null;
  has_fastest_lap?: boolean;
  has_pole?: boolean;
}

// Bulk save payload
export interface BulkRaceResultsPayload {
  results: CreateRaceResultPayload[];
}

// CSV parsed row
export interface CsvResultRow {
  driver: string;
  race_time?: string;
  race_time_difference?: string;
  fastest_lap_time?: string;
}

// Driver option for select dropdown
export interface DriverOption {
  id: number;
  name: string;
  division_id?: number;
  disabled?: boolean; // True if already selected in another row
}

// Time in milliseconds (for calculations)
export interface TimeMs {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalMs: number;
}
```

---

## Step 2: API Service

### File: `resources/app/js/services/raceResultService.ts`

```typescript
import api from './api';
import type { RaceResult, BulkRaceResultsPayload } from '@app/types/raceResult';

const BASE_URL = '/races';

export const raceResultService = {
  /**
   * Get all results for a race
   */
  async getResults(raceId: number): Promise<RaceResult[]> {
    const response = await api.get<{ data: RaceResult[] }>(
      `${BASE_URL}/${raceId}/results`
    );
    return response.data.data;
  },

  /**
   * Save/update results for a race (bulk operation)
   * Replaces all existing results
   */
  async saveResults(raceId: number, payload: BulkRaceResultsPayload): Promise<RaceResult[]> {
    const response = await api.post<{ data: RaceResult[] }>(
      `${BASE_URL}/${raceId}/results`,
      payload
    );
    return response.data.data;
  },

  /**
   * Delete all results for a race
   */
  async deleteResults(raceId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${raceId}/results`);
  },
};

export default raceResultService;
```

---

## Step 3: Pinia Store

### File: `resources/app/js/stores/raceResultStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import raceResultService from '@app/services/raceResultService';
import type {
  RaceResult,
  BulkRaceResultsPayload,
  RaceResultFormData
} from '@app/types/raceResult';

export const useRaceResultStore = defineStore('raceResult', () => {
  // State
  const results = ref<RaceResult[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  const currentRaceId = ref<number | null>(null);

  // Getters
  const resultsByPosition = computed(() => {
    return [...results.value].sort((a, b) => {
      const posA = a.position ?? Infinity;
      const posB = b.position ?? Infinity;
      return posA - posB;
    });
  });

  const hasResults = computed(() => results.value.length > 0);

  // Actions
  async function fetchResults(raceId: number): Promise<void> {
    isLoading.value = true;
    error.value = null;
    currentRaceId.value = raceId;

    try {
      results.value = await raceResultService.getResults(raceId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch results';
      results.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function saveResults(raceId: number, payload: BulkRaceResultsPayload): Promise<RaceResult[]> {
    isSaving.value = true;
    error.value = null;

    try {
      const savedResults = await raceResultService.saveResults(raceId, payload);
      results.value = savedResults;
      return savedResults;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save results';
      throw err;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteResults(raceId: number): Promise<void> {
    isSaving.value = true;
    error.value = null;

    try {
      await raceResultService.deleteResults(raceId);
      results.value = [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete results';
      throw err;
    } finally {
      isSaving.value = false;
    }
  }

  function clearResults(): void {
    results.value = [];
    currentRaceId.value = null;
    error.value = null;
  }

  return {
    // State
    results,
    isLoading,
    isSaving,
    error,
    currentRaceId,
    // Getters
    resultsByPosition,
    hasResults,
    // Actions
    fetchResults,
    saveResults,
    deleteResults,
    clearResults,
  };
});
```

---

## Step 4: Time Calculation Composable

### File: `resources/app/js/composables/useRaceTimeCalculation.ts`

This composable handles all time-related calculations for race results.

```typescript
import { computed, ref, type Ref } from 'vue';
import type { RaceResultFormData, TimeMs } from '@app/types/raceResult';

// Time regex pattern: hh:mm:ss.ms (ms can be 1-3 digits)
// Also allows +hh:mm:ss.ms for differences
const TIME_PATTERN = /^[+]?(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/;

export function useRaceTimeCalculation() {
  /**
   * Validate time format
   */
  function isValidTimeFormat(value: string | null | undefined): boolean {
    if (!value || value.trim() === '') return true; // Empty is valid (optional)
    return TIME_PATTERN.test(value);
  }

  /**
   * Parse time string to milliseconds
   */
  function parseTimeToMs(value: string | null | undefined): number | null {
    if (!value || value.trim() === '') return null;

    const match = value.match(TIME_PATTERN);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    // Pad milliseconds to 3 digits for consistent calculation
    const msStr = match[4].padEnd(3, '0');
    const milliseconds = parseInt(msStr, 10);

    return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds;
  }

  /**
   * Format milliseconds to time string hh:mm:ss.ms
   */
  function formatMsToTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    ms -= hours * 3600000;

    const minutes = Math.floor(ms / 60000);
    ms -= minutes * 60000;

    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms - (seconds * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  /**
   * Calculate race_time from race_time_difference and leader's time
   */
  function calculateRaceTimeFromDifference(
    leaderTimeMs: number | null,
    differenceMs: number | null
  ): string | null {
    if (leaderTimeMs === null || differenceMs === null) return null;
    const totalMs = leaderTimeMs + differenceMs;
    return formatMsToTime(totalMs);
  }

  /**
   * Calculate effective time (race_time + penalties) for sorting
   */
  function calculateEffectiveTime(
    raceTimeMs: number | null,
    penaltiesMs: number | null
  ): number | null {
    if (raceTimeMs === null) return null;
    return raceTimeMs + (penaltiesMs ?? 0);
  }

  /**
   * Sort results by effective time (ascending)
   * For qualifying, sort by fastest_lap
   */
  function sortResultsByTime(
    results: RaceResultFormData[],
    isQualifying: boolean
  ): RaceResultFormData[] {
    return [...results].sort((a, b) => {
      if (isQualifying) {
        const timeA = parseTimeToMs(a.fastest_lap);
        const timeB = parseTimeToMs(b.fastest_lap);
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1;
        if (timeB === null) return -1;
        return timeA - timeB;
      } else {
        const effectiveA = calculateEffectiveTime(
          parseTimeToMs(a.race_time),
          parseTimeToMs(a.penalties)
        );
        const effectiveB = calculateEffectiveTime(
          parseTimeToMs(b.race_time),
          parseTimeToMs(b.penalties)
        );
        if (effectiveA === null && effectiveB === null) return 0;
        if (effectiveA === null) return 1;
        if (effectiveB === null) return -1;
        return effectiveA - effectiveB;
      }
    });
  }

  /**
   * Calculate positions based on sorted results
   * Returns results with position field populated
   */
  function calculatePositions(
    results: RaceResultFormData[],
    isQualifying: boolean
  ): RaceResultFormData[] {
    const sorted = sortResultsByTime(results, isQualifying);
    return sorted.map((result, index) => ({
      ...result,
      position: result.driver_id ? index + 1 : null,
    }));
  }

  /**
   * Find the leader (fastest) in a set of results
   */
  function findLeaderTime(
    results: RaceResultFormData[],
    isQualifying: boolean
  ): number | null {
    let minTime: number | null = null;

    for (const result of results) {
      if (!result.driver_id) continue;

      const timeMs = isQualifying
        ? parseTimeToMs(result.fastest_lap)
        : parseTimeToMs(result.race_time);

      if (timeMs !== null && (minTime === null || timeMs < minTime)) {
        minTime = timeMs;
      }
    }

    return minTime;
  }

  /**
   * Reactive calculation: Update race_time when race_time_difference changes
   * This is used for real-time recalculation in the form
   */
  function createReactiveTimeCalculation(
    results: Ref<RaceResultFormData[]>,
    isQualifying: Ref<boolean>
  ) {
    // Find leader's race time in real-time
    const leaderTimeMs = computed(() => {
      if (isQualifying.value) return null;
      return findLeaderTime(results.value, false);
    });

    // Recalculate race_time for results that only have difference
    function recalculateFromDifferences(): void {
      if (isQualifying.value || leaderTimeMs.value === null) return;

      for (const result of results.value) {
        // Only recalculate if we have difference but no race_time
        // OR if race_time should be derived from difference
        const diffMs = parseTimeToMs(result.race_time_difference);

        if (diffMs !== null && result.race_time_difference) {
          const calculatedTime = calculateRaceTimeFromDifference(
            leaderTimeMs.value,
            diffMs
          );
          if (calculatedTime) {
            result.race_time = calculatedTime;
          }
        }
      }
    }

    return {
      leaderTimeMs,
      recalculateFromDifferences,
    };
  }

  return {
    isValidTimeFormat,
    parseTimeToMs,
    formatMsToTime,
    calculateRaceTimeFromDifference,
    calculateEffectiveTime,
    sortResultsByTime,
    calculatePositions,
    findLeaderTime,
    createReactiveTimeCalculation,
  };
}

// Export singleton pattern for simple use
export const raceTimeCalculation = useRaceTimeCalculation();
```

---

## Step 5: Vue Components

### Component Structure

```
resources/app/js/components/result/
├── RaceResultModal.vue          # Main modal container
├── ResultCsvImport.vue          # CSV textarea and parse button
├── ResultDivisionTabs.vue       # Tabs for divisions (or single view)
├── ResultEntryTable.vue         # Table with driver rows and inputs
└── ResultTimeInput.vue          # Reusable time input with mask
```

### 5.1 Main Modal Component

#### File: `resources/app/js/components/result/RaceResultModal.vue`

```vue
<template>
  <BaseModal
    v-model:visible="isVisible"
    width="6xl"
    :closable="!isSaving"
    @hide="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <PhTrophy size="24" class="text-amber-600" />
        <h2 class="text-xl font-semibold text-gray-900">
          {{ isQualifying ? 'Qualifying' : 'Race' }} Results - {{ raceName }}
        </h2>
      </div>
    </template>

    <div class="space-y-6">
      <!-- CSV Import Section -->
      <ResultCsvImport
        :is-qualifying="isQualifying"
        @parse="handleCsvParse"
      />

      <!-- Results Entry Section -->
      <ResultDivisionTabs
        v-if="hasDivisions"
        v-model:results="formResults"
        :divisions="divisions"
        :drivers-by-division="driversByDivision"
        :is-qualifying="isQualifying"
        :selected-driver-ids="selectedDriverIds"
        @update:results="handleResultsUpdate"
      />

      <ResultEntryTable
        v-else
        v-model:results="formResults"
        :drivers="allDrivers"
        :is-qualifying="isQualifying"
        :selected-driver-ids="selectedDriverIds"
        @update:results="handleResultsUpdate"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
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
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Button from 'primevue/button';
import { PhTrophy } from '@phosphor-icons/vue';
import BaseModal from '@app/components/common/BaseModal.vue';
import ResultCsvImport from './ResultCsvImport.vue';
import ResultDivisionTabs from './ResultDivisionTabs.vue';
import ResultEntryTable from './ResultEntryTable.vue';
import { useRaceResultStore } from '@app/stores/raceResultStore';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useRaceTimeCalculation } from '@app/composables/useRaceTimeCalculation';
import type {
  RaceResultFormData,
  CsvResultRow,
  BulkRaceResultsPayload,
  DriverOption
} from '@app/types/raceResult';
import type { Race } from '@app/types/race';
import type { Division } from '@app/types/division';
import type { SeasonDriver } from '@app/types/seasonDriver';

interface Props {
  race: Race;
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const raceResultStore = useRaceResultStore();
const seasonStore = useSeasonStore();
const { sortResultsByTime, calculatePositions, parseTimeToMs } = useRaceTimeCalculation();

// Local state
const formResults = ref<RaceResultFormData[]>([]);
const isSaving = ref(false);

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isQualifying = computed(() => props.race.is_qualifier);

const raceName = computed(() => props.race.name || `Race ${props.race.race_number}`);

const hasDivisions = computed(() => {
  return seasonStore.currentSeason?.race_divisions_enabled ?? false;
});

const divisions = computed<Division[]>(() => {
  return seasonStore.divisions || [];
});

const allDrivers = computed<DriverOption[]>(() => {
  return (seasonStore.seasonDrivers || []).map((sd: SeasonDriver) => ({
    id: sd.id,
    name: sd.driver?.name || `Driver ${sd.id}`,
    division_id: sd.division_id,
  }));
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
    if (result.driver_id) {
      ids.add(result.driver_id);
    }
  }
  return ids;
});

const canSave = computed(() => {
  // At least one result with a driver selected
  return formResults.value.some(r => r.driver_id !== null);
});

// Methods
function initializeForm(): void {
  // Initialize with empty rows for each driver
  const drivers = allDrivers.value;
  formResults.value = drivers.map(() => createEmptyRow());
}

function createEmptyRow(): RaceResultFormData {
  return {
    driver_id: null,
    position: null,
    race_time: '',
    race_time_difference: '',
    fastest_lap: '',
    penalties: '',
    has_fastest_lap: false,
    has_pole: false,
  };
}

function handleCsvParse(parsedRows: CsvResultRow[]): void {
  // Match parsed CSV rows to drivers and populate form
  for (const csvRow of parsedRows) {
    const matchedDriver = findDriverByName(csvRow.driver);
    if (!matchedDriver) continue;

    // Find or create a form row for this driver
    let formRow = formResults.value.find(r => r.driver_id === matchedDriver.id);
    if (!formRow) {
      // Find first empty row
      formRow = formResults.value.find(r => r.driver_id === null);
    }
    if (!formRow) continue;

    formRow.driver_id = matchedDriver.id;

    // Use race_time if provided, otherwise use difference
    if (csvRow.race_time) {
      formRow.race_time = csvRow.race_time;
      formRow.race_time_difference = '';
    } else if (csvRow.race_time_difference) {
      formRow.race_time_difference = csvRow.race_time_difference;
    }

    if (csvRow.fastest_lap_time) {
      formRow.fastest_lap = csvRow.fastest_lap_time;
    }
  }

  // Recalculate times from differences
  recalculateTimesFromDifferences();
}

function findDriverByName(name: string): DriverOption | undefined {
  const normalizedName = name.toLowerCase().trim();
  return allDrivers.value.find(d =>
    d.name.toLowerCase().trim() === normalizedName ||
    d.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(d.name.toLowerCase())
  );
}

function handleResultsUpdate(): void {
  // Recalculate positions and times when results change
  recalculateTimesFromDifferences();
}

function recalculateTimesFromDifferences(): void {
  if (isQualifying.value) return;

  // Find the leader's time (fastest race_time)
  let leaderTimeMs: number | null = null;
  for (const result of formResults.value) {
    if (!result.driver_id || !result.race_time) continue;
    const timeMs = parseTimeToMs(result.race_time);
    if (timeMs !== null && (leaderTimeMs === null || timeMs < leaderTimeMs)) {
      leaderTimeMs = timeMs;
    }
  }

  if (leaderTimeMs === null) return;

  // Calculate race_time for rows that only have difference
  for (const result of formResults.value) {
    if (!result.driver_id) continue;
    if (result.race_time) continue; // Already has race time
    if (!result.race_time_difference) continue;

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
      formResults.value.filter(r => r.driver_id !== null),
      isQualifying.value
    );

    // Build payload
    const payload: BulkRaceResultsPayload = {
      results: sortedResults.map((r, index) => ({
        driver_id: r.driver_id!,
        position: index + 1,
        race_time: r.race_time || null,
        race_time_difference: r.race_time_difference || null,
        fastest_lap: r.fastest_lap || null,
        penalties: r.penalties || null,
        has_fastest_lap: r.has_fastest_lap,
        has_pole: r.has_pole,
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
}

// Load existing results when modal opens
watch(isVisible, async (visible) => {
  if (visible) {
    initializeForm();

    // Load existing results if any
    await raceResultStore.fetchResults(props.race.id);

    if (raceResultStore.hasResults) {
      // Populate form with existing results
      for (const result of raceResultStore.results) {
        const formRow = formResults.value.find(r => r.driver_id === null);
        if (formRow) {
          formRow.driver_id = result.driver_id;
          formRow.position = result.position;
          formRow.race_time = result.race_time || '';
          formRow.race_time_difference = result.race_time_difference || '';
          formRow.fastest_lap = result.fastest_lap || '';
          formRow.penalties = result.penalties || '';
          formRow.has_fastest_lap = result.has_fastest_lap;
          formRow.has_pole = result.has_pole;
        }
      }
    }
  }
});
</script>
```

### 5.2 CSV Import Component

#### File: `resources/app/js/components/result/ResultCsvImport.vue`

```vue
<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
    <div class="flex items-center gap-2 mb-3">
      <PhFileCsv size="20" class="text-gray-600" />
      <h3 class="font-medium text-gray-900">Import from CSV</h3>
    </div>

    <Textarea
      v-model="csvText"
      rows="5"
      placeholder="Paste CSV data here...
Example:
driver,race_time,race_time_difference,fastest_lap_time
John Smith,01:23:45.678,,01:32.456"
      class="w-full font-mono text-sm"
      :invalid="!!parseError"
    />

    <div v-if="parseError" class="mt-2 text-sm text-red-600">
      {{ parseError }}
    </div>

    <div class="mt-3 flex items-center justify-between">
      <span class="text-sm text-gray-500">
        Expected columns: driver, {{ isQualifying ? 'fastest_lap_time' : 'race_time, race_time_difference, fastest_lap_time' }}
      </span>
      <Button
        label="Parse CSV"
        icon="pi pi-check"
        size="small"
        :disabled="!csvText.trim()"
        @click="handleParse"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { PhFileCsv } from '@phosphor-icons/vue';
import type { CsvResultRow } from '@app/types/raceResult';

interface Props {
  isQualifying: boolean;
}

interface Emits {
  (e: 'parse', rows: CsvResultRow[]): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const csvText = ref('');
const parseError = ref<string | null>(null);

function handleParse(): void {
  parseError.value = null;

  try {
    const rows = parseCsv(csvText.value);
    emit('parse', rows);
    csvText.value = ''; // Clear after successful parse
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Failed to parse CSV';
  }
}

function parseCsv(text: string): CsvResultRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const driverIndex = header.indexOf('driver');

  if (driverIndex === -1) {
    throw new Error('CSV must have a "driver" column');
  }

  const raceTimeIndex = header.indexOf('race_time');
  const diffIndex = header.indexOf('race_time_difference');
  const fastestLapIndex = header.findIndex(h =>
    h === 'fastest_lap_time' || h === 'fastest_lap'
  );

  // Parse data rows
  const results: CsvResultRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const driver = values[driverIndex];

    if (!driver) continue;

    const row: CsvResultRow = { driver };

    if (raceTimeIndex !== -1 && values[raceTimeIndex]) {
      row.race_time = values[raceTimeIndex];
    }

    if (diffIndex !== -1 && values[diffIndex]) {
      row.race_time_difference = values[diffIndex];
    }

    if (fastestLapIndex !== -1 && values[fastestLapIndex]) {
      row.fastest_lap_time = values[fastestLapIndex];
    }

    results.push(row);
  }

  if (results.length === 0) {
    throw new Error('No valid data rows found in CSV');
  }

  return results;
}
</script>
```

### 5.3 Division Tabs Component

#### File: `resources/app/js/components/result/ResultDivisionTabs.vue`

```vue
<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <TabView v-model:activeIndex="activeTab">
      <TabPanel
        v-for="division in divisions"
        :key="division.id"
        :header="division.name"
      >
        <ResultEntryTable
          v-model:results="divisionResults[division.id]"
          :drivers="driversByDivision[division.id] || []"
          :is-qualifying="isQualifying"
          :selected-driver-ids="selectedDriverIds"
          @update:results="handleDivisionUpdate(division.id)"
        />
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import ResultEntryTable from './ResultEntryTable.vue';
import type { RaceResultFormData, DriverOption } from '@app/types/raceResult';
import type { Division } from '@app/types/division';

interface Props {
  results: RaceResultFormData[];
  divisions: Division[];
  driversByDivision: Record<number, DriverOption[]>;
  isQualifying: boolean;
  selectedDriverIds: Set<number>;
}

interface Emits {
  (e: 'update:results', results: RaceResultFormData[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const activeTab = ref(0);

// Split results by division
const divisionResults = ref<Record<number, RaceResultFormData[]>>({});

// Initialize division results
watch(
  () => props.results,
  (results) => {
    for (const division of props.divisions) {
      const divisionDriverIds = new Set(
        (props.driversByDivision[division.id] || []).map(d => d.id)
      );

      divisionResults.value[division.id] = results.filter(r => {
        if (!r.driver_id) return false;
        return divisionDriverIds.has(r.driver_id);
      });

      // Ensure we have enough empty rows for each division
      const divisionDriverCount = props.driversByDivision[division.id]?.length || 0;
      while (divisionResults.value[division.id].length < divisionDriverCount) {
        divisionResults.value[division.id].push({
          driver_id: null,
          position: null,
          race_time: '',
          race_time_difference: '',
          fastest_lap: '',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
        });
      }
    }
  },
  { immediate: true }
);

function handleDivisionUpdate(divisionId: number): void {
  // Merge all division results back into the main array
  const allResults: RaceResultFormData[] = [];

  for (const division of props.divisions) {
    allResults.push(...(divisionResults.value[division.id] || []));
  }

  emit('update:results', allResults);
}
</script>
```

### 5.4 Results Entry Table Component

#### File: `resources/app/js/components/result/ResultEntryTable.vue`

```vue
<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-3 py-2 text-left font-medium text-gray-700 w-12">#</th>
          <th class="px-3 py-2 text-left font-medium text-gray-700 min-w-[200px]">Driver</th>
          <th v-if="!isQualifying" class="px-3 py-2 text-left font-medium text-gray-700 w-36">
            Race Time
          </th>
          <th v-if="!isQualifying" class="px-3 py-2 text-left font-medium text-gray-700 w-36">
            Time Diff
          </th>
          <th class="px-3 py-2 text-left font-medium text-gray-700 w-32">
            {{ isQualifying ? 'Lap Time' : 'Fastest Lap' }}
          </th>
          <th v-if="!isQualifying" class="px-3 py-2 text-left font-medium text-gray-700 w-32">
            Penalties
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in sortedResults"
          :key="index"
          class="border-b border-gray-100 hover:bg-gray-50"
        >
          <td class="px-3 py-2 text-gray-500">{{ index + 1 }}</td>
          <td class="px-3 py-2">
            <Select
              v-model="row.driver_id"
              :options="getAvailableDrivers(row.driver_id)"
              option-label="name"
              option-value="id"
              placeholder="Select driver"
              class="w-full"
              filter
              @change="handleDriverChange"
            />
          </td>
          <td v-if="!isQualifying" class="px-3 py-2">
            <ResultTimeInput
              v-model="row.race_time"
              placeholder="00:00:00.000"
              @update:model-value="handleTimeChange"
            />
          </td>
          <td v-if="!isQualifying" class="px-3 py-2">
            <ResultTimeInput
              v-model="row.race_time_difference"
              placeholder="+00:00:00.000"
              @update:model-value="handleTimeChange"
            />
          </td>
          <td class="px-3 py-2">
            <ResultTimeInput
              v-model="row.fastest_lap"
              placeholder="00:00:00.000"
              @update:model-value="handleTimeChange"
            />
          </td>
          <td v-if="!isQualifying" class="px-3 py-2">
            <ResultTimeInput
              v-model="row.penalties"
              placeholder="00:00:00.000"
              @update:model-value="handleTimeChange"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Select from 'primevue/select';
import ResultTimeInput from './ResultTimeInput.vue';
import { useRaceTimeCalculation } from '@app/composables/useRaceTimeCalculation';
import type { RaceResultFormData, DriverOption } from '@app/types/raceResult';

interface Props {
  results: RaceResultFormData[];
  drivers: DriverOption[];
  isQualifying: boolean;
  selectedDriverIds: Set<number>;
}

interface Emits {
  (e: 'update:results', results: RaceResultFormData[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { sortResultsByTime } = useRaceTimeCalculation();

const sortedResults = computed(() => {
  return sortResultsByTime(props.results, props.isQualifying);
});

function getAvailableDrivers(currentDriverId: number | null): DriverOption[] {
  return props.drivers.map(driver => ({
    ...driver,
    disabled: driver.id !== currentDriverId && props.selectedDriverIds.has(driver.id),
  }));
}

function handleDriverChange(): void {
  emit('update:results', props.results);
}

function handleTimeChange(): void {
  emit('update:results', props.results);
}
</script>
```

### 5.5 Time Input Component

#### File: `resources/app/js/components/result/ResultTimeInput.vue`

```vue
<template>
  <InputMask
    v-model="localValue"
    :mask="timeMask"
    placeholder="00:00:00.000"
    slotChar="_"
    class="w-full font-mono text-sm"
    :invalid="!isValid"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import InputMask from 'primevue/inputmask';
import { useRaceTimeCalculation } from '@app/composables/useRaceTimeCalculation';

interface Props {
  modelValue: string;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { isValidTimeFormat } = useRaceTimeCalculation();

// PrimeVue InputMask doesn't support variable-length milliseconds well,
// so we use a fixed 3-digit mask but clean up on blur
const timeMask = '99:99:99.999';

const localValue = ref(props.modelValue);

const isValid = computed(() => {
  return isValidTimeFormat(localValue.value);
});

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue;
});

function handleBlur(): void {
  // Clean up the value (remove trailing underscores from mask)
  let cleaned = localValue.value.replace(/_/g, '');

  // If it's partially filled, either clear or try to complete
  if (cleaned && cleaned !== props.modelValue) {
    emit('update:modelValue', cleaned);
  }
}
</script>
```

---

## Step 6: Integration with Existing Components

### Update RaceListItem.vue

Add "Enter Results" button to the `RaceListItem.vue` component:

```vue
<!-- Add to the button group in RaceListItem.vue -->
<Button
  v-tooltip.top="'Enter Results'"
  icon="pi pi-list-check"
  text
  rounded
  size="small"
  severity="info"
  @click="handleEnterResults"
/>
```

```typescript
// Add to emits
interface Emits {
  (e: 'edit', race: Race): void;
  (e: 'delete', race: Race): void;
  (e: 'enterResults', race: Race): void; // Add this
}

// Add handler
function handleEnterResults(): void {
  emit('enterResults', props.race);
}
```

### Update RoundsPanel.vue

Handle the `enterResults` event and show the modal:

```vue
<template>
  <!-- In the race list -->
  <RaceListItem
    v-for="race in races"
    :key="race.id"
    :race="race"
    @edit="handleEditRace"
    @delete="handleDeleteRace"
    @enter-results="handleEnterResults"
  />

  <!-- Add the results modal -->
  <RaceResultModal
    v-if="selectedRaceForResults"
    v-model:visible="showResultsModal"
    :race="selectedRaceForResults"
    @saved="handleResultsSaved"
  />
</template>

<script setup lang="ts">
import RaceResultModal from '@app/components/result/RaceResultModal.vue';

const showResultsModal = ref(false);
const selectedRaceForResults = ref<Race | null>(null);

function handleEnterResults(race: Race): void {
  selectedRaceForResults.value = race;
  showResultsModal.value = true;
}

function handleResultsSaved(): void {
  // Optionally refresh data or show toast
}
</script>
```

---

## Step 7: Tests

### Test Files to Create

```
resources/app/js/
├── composables/__tests__/useRaceTimeCalculation.test.ts
├── components/result/__tests__/
│   ├── ResultCsvImport.test.ts
│   ├── ResultEntryTable.test.ts
│   └── ResultTimeInput.test.ts
└── stores/__tests__/raceResultStore.test.ts
```

### Example Test: Time Calculation Composable

#### File: `resources/app/js/composables/__tests__/useRaceTimeCalculation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { useRaceTimeCalculation } from '../useRaceTimeCalculation';

describe('useRaceTimeCalculation', () => {
  const {
    isValidTimeFormat,
    parseTimeToMs,
    formatMsToTime,
    calculateRaceTimeFromDifference
  } = useRaceTimeCalculation();

  describe('isValidTimeFormat', () => {
    it('accepts valid time formats', () => {
      expect(isValidTimeFormat('01:23:45.678')).toBe(true);
      expect(isValidTimeFormat('00:00:00.000')).toBe(true);
      expect(isValidTimeFormat('1:23:45.6')).toBe(true);
      expect(isValidTimeFormat('+00:00:02.104')).toBe(true);
    });

    it('accepts empty/null values', () => {
      expect(isValidTimeFormat('')).toBe(true);
      expect(isValidTimeFormat(null)).toBe(true);
      expect(isValidTimeFormat(undefined)).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidTimeFormat('invalid')).toBe(false);
      expect(isValidTimeFormat('01:23:45')).toBe(false);
      expect(isValidTimeFormat('1:2:3.4')).toBe(false);
    });
  });

  describe('parseTimeToMs', () => {
    it('parses time string to milliseconds', () => {
      expect(parseTimeToMs('01:23:45.678')).toBe(5025678);
      expect(parseTimeToMs('00:00:00.000')).toBe(0);
      expect(parseTimeToMs('00:01:00.000')).toBe(60000);
    });

    it('handles variable millisecond lengths', () => {
      expect(parseTimeToMs('00:00:00.1')).toBe(100);
      expect(parseTimeToMs('00:00:00.12')).toBe(120);
      expect(parseTimeToMs('00:00:00.123')).toBe(123);
    });

    it('returns null for empty values', () => {
      expect(parseTimeToMs('')).toBe(null);
      expect(parseTimeToMs(null)).toBe(null);
    });
  });

  describe('formatMsToTime', () => {
    it('formats milliseconds to time string', () => {
      expect(formatMsToTime(5025678)).toBe('01:23:45.678');
      expect(formatMsToTime(0)).toBe('00:00:00.000');
      expect(formatMsToTime(60000)).toBe('00:01:00.000');
    });
  });

  describe('calculateRaceTimeFromDifference', () => {
    it('adds difference to leader time', () => {
      const leaderMs = 5025678; // 01:23:45.678
      const diffMs = 2104;      // +00:00:02.104
      expect(calculateRaceTimeFromDifference(leaderMs, diffMs)).toBe('01:23:47.782');
    });

    it('returns null if either value is null', () => {
      expect(calculateRaceTimeFromDifference(null, 1000)).toBe(null);
      expect(calculateRaceTimeFromDifference(1000, null)).toBe(null);
    });
  });
});
```

---

## Summary

| Component | File | Status |
|-----------|------|--------|
| Types | `types/raceResult.ts` | To create |
| Service | `services/raceResultService.ts` | To create |
| Store | `stores/raceResultStore.ts` | To create |
| Composable | `composables/useRaceTimeCalculation.ts` | To create |
| Modal | `components/result/RaceResultModal.vue` | To create |
| CSV Import | `components/result/ResultCsvImport.vue` | To create |
| Division Tabs | `components/result/ResultDivisionTabs.vue` | To create |
| Entry Table | `components/result/ResultEntryTable.vue` | To create |
| Time Input | `components/result/ResultTimeInput.vue` | To create |
| Update | `components/round/RaceListItem.vue` | To update |
| Update | `components/round/RoundsPanel.vue` | To update |
| Tests | `composables/__tests__/useRaceTimeCalculation.test.ts` | To create |

---

## Implementation Notes

1. **Modal Width**: Using `6xl` (max-width: 72rem) to accommodate the wide table layout
2. **Time Mask**: PrimeVue InputMask uses fixed-length masks, so we use `99:99:99.999` and handle variable-length milliseconds in the validation logic
3. **Auto-sorting**: The table automatically re-sorts whenever times or penalties change
4. **Division Tabs**: Using PrimeVue TabView for division switching as per user preference
5. **Driver Selection**: Disabled options in the Select dropdown prevent duplicate driver selection
6. **CSV Parsing**: Simple CSV parser handles the expected format; could be enhanced with a library if needed
