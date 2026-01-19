<template>
  <div>
    <!-- Header with Download Button -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <Button
        v-if="results && results.length > 0 && downloadLabel"
        :label="downloadLabel"
        variant="secondary"
        size="sm"
        :icon="PhDownload"
        :loading="isDownloading"
        @click="emit('download')"
      />
    </div>

    <!-- Results Table -->
    <div v-if="results && results.length > 0" class="overflow-x-auto">
      <TechDataTable
        :value="enrichedResults"
        :rows="50"
        :podium-highlight="true"
        position-field="position"
      >
        <Column
          field="position"
          header="#"
          class="w-16"
          :pt="{
            headerCell: { style: { borderRight: '1px solid var(--border)' } },
            bodyCell: { style: { borderRight: '1px solid var(--border)' } },
          }"
        >
          <template #body="{ data }">
            <PositionCell :position="data.position" />
          </template>
        </Column>

        <Column
          field="driverName"
          header="Driver"
          class="min-w-[200px]"
          :pt="{
            headerCell: { style: { borderRight: '1px solid var(--border)' } },
            bodyCell: { style: { borderRight: '1px solid var(--border)' } },
          }"
        >
          <template #body="{ data }">
            <span class="font-medium text-primary">{{ data.driverName }}</span>
          </template>
        </Column>

        <Column
          field="divisionName"
          header="Division"
          class="w-32"
          :pt="{
            headerCell: { style: { borderRight: '1px solid var(--border)' } },
            bodyCell: { style: { borderRight: '1px solid var(--border)' } },
          }"
        >
          <template #body="{ data }">
            <BaseBadge
              v-if="data.divisionName"
              size="sm"
              :variant="getDivisionVariant(data.divisionId)"
            >
              {{ data.divisionName }}
            </BaseBadge>
            <span v-else class="text-gray-400">-</span>
          </template>
        </Column>

        <Column
          field="formattedTime"
          header="Time"
          class="w-42"
          :pt="{
            headerCell: { style: { borderRight: '1px solid var(--border)', textAlign: 'right' } },
            bodyCell: { style: { borderRight: '1px solid var(--border)', textAlign: 'right' } },
          }"
        >
          <template #body="{ data }">
            <span class="font-mono text-secondary">{{ data.formattedTime }}</span>
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-6 text-gray-500">No data available</div>
        </template>
      </TechDataTable>
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
import Column from 'primevue/column';
import { Button } from '@app/components/common/buttons';
import { BaseBadge } from '@app/components/common/indicators';
import { PhClipboardText, PhDownload } from '@phosphor-icons/vue';
import { TechDataTable, PositionCell } from '@app/components/common/tables';
import type { CrossDivisionResult, RaceEventResults } from '@app/types/roundResult';

// Constants for time formatting
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

interface Props {
  title: string;
  results: CrossDivisionResult[] | null;
  raceEvents: RaceEventResults[];
  divisions: Array<{ id: number; name: string }>;
  downloadLabel?: string;
  isDownloading?: boolean;
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

const emit = defineEmits<{
  download: [];
}>();

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

type BadgeVariant = 'cyan' | 'green' | 'purple' | 'orange' | 'red' | 'default';

const DIVISION_BADGE_VARIANTS: BadgeVariant[] = [
  'cyan',
  'green',
  'purple',
  'orange',
  'red',
  'cyan',
];

function getDivisionVariant(divisionId: number | null): BadgeVariant {
  if (!divisionId || divisionId < 1) {
    return 'default';
  }
  // Division IDs are 1-indexed, array is 0-indexed
  // Cycle through variants for divisions beyond the array length
  const variantIndex = (divisionId - 1) % DIVISION_BADGE_VARIANTS.length;
  return DIVISION_BADGE_VARIANTS[variantIndex] ?? 'default';
}

const enrichedResults = computed<EnrichedResult[]>(() => {
  if (!props.results || props.results.length === 0) {
    return [];
  }

  // Get first place time for calculating differences
  // Explicit check: if first place time is null/undefined, we can't calculate differences
  // Note: 0ms is a valid (though unlikely) time and should not be treated as invalid
  const firstPlaceTimeMs = props.results[0]?.time_ms;
  const canCalculateDifferences = firstPlaceTimeMs != null && firstPlaceTimeMs >= 0;

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
  // Only return '-' for null/undefined, not for 0 (which is a valid time)
  if (timeMs == null) {
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
  // Only return '-' for null/undefined, 0 is a valid difference (same time as leader)
  if (differenceMs == null) {
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
