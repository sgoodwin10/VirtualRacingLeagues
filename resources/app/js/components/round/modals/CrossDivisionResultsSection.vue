<template>
  <div class="bg-white border border-gray-200 rounded-lg">
    <!-- Section Header -->
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <PhTimer :size="20" class="text-blue-600" />
        <h3 class="font-semibold text-gray-900">
          {{ title }}
        </h3>
      </div>
    </div>

    <!-- Results Table -->
    <div v-if="results && results.length > 0" class="overflow-x-auto">
      <DataTable :value="enrichedResults" :rows="50" :row-hover="true">
        <Column field="position" header="#" class="w-16" :pt="{ header: { class: 'text-center' } }">
          <template #body="{ data }">
            <div class="text-center font-medium">
              {{ data.position }}
            </div>
          </template>
        </Column>

        <Column field="driverName" header="Driver" class="min-w-[200px]">
          <template #body="{ data }">
            <span class="font-medium text-gray-900">{{ data.driverName }}</span>
          </template>
        </Column>

        <Column field="divisionName" header="Division" class="w-32">
          <template #body="{ data }">
            <Tag
              v-if="data.divisionName"
              :value="data.divisionName"
              :class="getDivisionTagClass(data.divisionId)"
            />
            <span v-else class="text-gray-400">-</span>
          </template>
        </Column>

        <Column field="formattedTime" header="Time" class="w-42">
          <template #body="{ data }">
            <span class="font-mono text-gray-900">{{ data.formattedTime }}</span>
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-6 text-gray-500">No data available</div>
        </template>
      </DataTable>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-12">
      <PhClipboardText :size="64" class="text-gray-300 mb-4" />
      <p class="text-gray-500">No data available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { PhTimer, PhClipboardText } from '@phosphor-icons/vue';
import { getDivisionTagClass } from '@app/constants/divisionColors';
import type { CrossDivisionResult, RaceEventResults } from '@app/types/roundResult';

// Constants for time formatting
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

interface Props {
  title: string;
  results: CrossDivisionResult[] | null;
  raceEvents: RaceEventResults[];
  divisions: Array<{ id: number; name: string }>;
}

interface EnrichedResult {
  position: number;
  race_result_id: number;
  driverName: string;
  divisionId: number | null;
  divisionName: string | null;
  formattedTime: string;
}

const props = defineProps<Props>();

// Computed
// Create a Map lookup for race results to avoid O(n×m×k) nested loops
const raceResultsMap = computed(() => {
  const map = new Map();
  props.raceEvents.forEach((event) => {
    event.results.forEach((result) => map.set(result.id, result));
  });
  return map;
});

// Create a Map lookup for divisions
const divisionsMap = computed(() => {
  const map = new Map();
  props.divisions.forEach((division) => map.set(division.id, division.name));
  return map;
});

const enrichedResults = computed<EnrichedResult[]>(() => {
  if (!props.results || props.results.length === 0) {
    return [];
  }

  // Get first place time for calculating differences
  // Explicit check: if first place time is 0 or undefined, we can't calculate differences
  // This can occur when results haven't been properly calculated yet
  const firstPlaceTimeMs = props.results[0]?.time_ms ?? 0;
  const canCalculateDifferences = firstPlaceTimeMs > 0;

  return props.results.map((result) => {
    // Find the race result using the Map lookup
    let driverName = 'Unknown Driver';
    let divisionId: number | null = null;
    let divisionName: string | null = null;

    const raceResult = raceResultsMap.value.get(result.race_result_id);
    if (raceResult) {
      driverName = raceResult.driver?.name || 'Unknown Driver';
      // Find division name from division_id using Map lookup
      if (raceResult.division_id) {
        divisionId = raceResult.division_id;
        divisionName = divisionsMap.value.get(raceResult.division_id) || null;
      }
    }

    // For position 1, show absolute time. For others, show difference from first place
    // When firstPlaceTimeMs is 0, we display absolute times for all positions
    // as a fallback (indicates data is incomplete or being processed)
    let formattedTime: string;
    if (result.position === 1 || !canCalculateDifferences) {
      formattedTime = formatTime(result.time_ms);
    } else {
      const differenceMs = result.time_ms - firstPlaceTimeMs;
      formattedTime = formatTimeDifference(differenceMs);
    }

    return {
      position: result.position,
      race_result_id: result.race_result_id,
      driverName,
      divisionId,
      divisionName,
      formattedTime,
    };
  });
});

// Methods
function formatTime(timeMs: number): string {
  if (timeMs === 0) {
    return '-';
  }

  const totalSeconds = Math.floor(timeMs / MS_PER_SECOND);
  const milliseconds = timeMs % MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  // Format: mm:ss.fff
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  return `${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
}

function formatTimeDifference(differenceMs: number): string {
  if (differenceMs === 0) {
    return '-';
  }

  const totalSeconds = Math.floor(differenceMs / MS_PER_SECOND);
  const milliseconds = differenceMs % MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  // Format: +mm:ss.fff or +ss.fff if under a minute
  if (minutes > 0) {
    return `+${minutes}:${formattedSeconds}.${formattedMs}`;
  } else {
    return `+${formattedSeconds}.${formattedMs}`;
  }
}
</script>
