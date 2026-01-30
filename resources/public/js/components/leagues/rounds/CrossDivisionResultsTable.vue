<template>
  <div class="cross-division-results">
    <VrlDataTable
      :value="enrichedResults"
      :podium-highlight="true"
      position-field="position"
      :paginated="false"
      :hoverable="true"
      :striped="false"
      empty-message="No data available"
      table-class="[&_th]:!p-3 [&_td]:!p-3"
    >
      <!-- Position Column -->
      <Column field="position" header="Pos" style="width: 60px">
        <template #body="{ data }">
          <VrlPositionCell :position="data.position" />
        </template>
      </Column>

      <!-- Driver Name Column -->
      <Column field="driverName" header="Driver" class="min-w-[200px]">
        <template #body="{ data }">
          <span class="font-body font-medium text-[var(--text-primary)] text-lg">
            {{ data.driverName }}
          </span>
        </template>
      </Column>

      <!-- Division Column (if divisions exist) -->
      <Column v-if="hasDivisions" field="divisionName" header="Division" style="width: 180px">
        <template #body="{ data }">
          <div
            v-if="data.divisionName"
            :class="[
              'inline-block px-2 py-1 text-xs font-[family-name:var(--font-mono)] font-semibold rounded-[var(--radius-sm)]',
              getDivisionBadgeClass(data.divisionId),
            ]"
          >
            <span class="hidden md:block">
              {{ data.divisionName }}
            </span>
            <span class="block md:hidden">
              {{
                data.divisionName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
              }}
            </span>
          </div>
          <span v-else class="text-[var(--text-muted)]">-</span>
        </template>
      </Column>

      <!-- Time Column -->
      <Column field="formattedTime" header="Time" style="width: 120px; text-align: right">
        <template #body="{ data }">
          <span
            class="font-[family-name:var(--font-mono)] font-bold text-[var(--text-primary)] pr-3 text-lg"
          >
            {{ data.formattedTime }}
          </span>
        </template>
      </Column>
    </VrlDataTable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Column from 'primevue/column';
import type { CrossDivisionResult, RaceEventResults } from '@public/types/public';
import VrlDataTable from '@public/components/common/tables/VrlDataTable.vue';
import VrlPositionCell from '@public/components/common/tables/cells/VrlPositionCell.vue';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

interface Props {
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

const raceResultsMap = computed(() => {
  const map = new Map();
  props.raceEvents.forEach((event) => {
    event.results.forEach((result) => map.set(result.id, result));
  });
  return map;
});

const divisionsMap = computed(() => {
  const map = new Map();
  props.divisions.forEach((division) => map.set(division.id, division.name));
  return map;
});

const hasDivisions = computed(() => props.divisions.length > 0);

const enrichedResults = computed<EnrichedResult[]>(() => {
  if (!props.results || props.results.length === 0) {
    return [];
  }

  const firstPlaceTimeMs = props.results[0]?.time_ms;
  const canCalculateDifferences = firstPlaceTimeMs != null && firstPlaceTimeMs >= 0;

  return props.results.map((result) => {
    let driverName = 'Unknown Driver';
    let divisionId: number | null = null;
    let divisionName: string | null = null;

    const raceResult = raceResultsMap.value.get(result.race_result_id);
    if (raceResult) {
      driverName = raceResult.driver?.name || 'Unknown Driver';
      if (raceResult.division_id) {
        divisionId = raceResult.division_id;
        divisionName = divisionsMap.value.get(raceResult.division_id) || null;
      }
    }

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

function formatTime(timeMs: number): string {
  if (timeMs == null) {
    return '-';
  }

  const totalSeconds = Math.floor(timeMs / MS_PER_SECOND);
  const milliseconds = timeMs % MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  return `${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
}

function formatTimeDifference(differenceMs: number): string {
  if (differenceMs == null) {
    return '-';
  }

  const totalSeconds = Math.floor(differenceMs / MS_PER_SECOND);
  const milliseconds = differenceMs % MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMs = milliseconds.toString().padStart(3, '0');

  if (minutes > 0) {
    return `+${minutes}:${formattedSeconds}.${formattedMs}`;
  } else {
    return `+${formattedSeconds}.${formattedMs}`;
  }
}

function getDivisionBadgeClass(divisionId: number | null): string {
  if (!divisionId || divisionId < 1) {
    return 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]';
  }

  const variants = [
    'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan)]',
    'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green)]',
    'bg-[var(--purple-dim)] text-[var(--purple)] border border-[var(--purple)]',
    'bg-[var(--orange-dim)] text-[var(--orange)] border border-[var(--orange)]',
    'bg-[var(--red-dim)] text-[var(--red)] border border-[var(--red)]',
  ];

  const variantIndex = (divisionId - 1) % variants.length;
  return variants[variantIndex] ?? variants[0] ?? '';
}
</script>

<style scoped>
.cross-division-results {
  border-radius: var(--radius);
}

.cross-division-results :deep(.p-datatable-tbody > tr) {
  background: transparent;
}
</style>
