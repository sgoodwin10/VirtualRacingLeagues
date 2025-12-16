<template>
  <VrlTable :data="tableData" :columns="columns" :sticky-header="true">
    <!-- Position column - static row number (1, 2, 3, 4, 5...) -->
    <template #cell-position="{ index }">
      <span
        class="font-display text-xl"
        :style="{ color: getPositionColor(index + 1) }"
        data-test="position"
      >
        {{ index + 1 }}
      </span>
    </template>

    <!-- Driver column -->
    <template #cell-driver_name="{ data }">
      <span class="font-semibold text-md text-[var(--text-primary)]" data-test="driver-name">
        {{ data.driver_name }}
      </span>
    </template>

    <!-- Division column (only shown when showDivision is true) -->
    <template v-if="showDivision" #cell-division_name="{ data }">
      <span
        v-if="data.division_name"
        class="division-tag"
        :class="getDivisionClass(data.division_id)"
        data-test="division-tag"
      >
        {{ data.division_name }}
      </span>
      <span v-else class="text-[var(--text-dim)]">-</span>
    </template>

    <!-- Qualifying Time column -->
    <template #cell-qualifying_time="{ data }">
      <span class="font-data text-[var(--text-primary)]" data-test="qualifying-time">
        {{ data.qualifying_time }}
      </span>
    </template>

    <!-- Fastest Lap column -->
    <template #cell-fastest_lap="{ data }">
      <span class="font-data text-[var(--text-primary)]" data-test="fastest-lap">
        {{ data.fastest_lap }}
      </span>
    </template>

    <!-- Race Time column -->
    <template #cell-race_time="{ data }">
      <span class="font-data text-[var(--text-primary)]" data-test="race-time">
        {{ data.race_time }}
      </span>
    </template>
  </VrlTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VrlTable, { type TableColumn } from '@public/components/common/data-display/VrlTable.vue';
import type { CrossDivisionResult } from '@public/types/public';
import { useDivisionStyles } from '@public/composables/useDivisionStyles';

/**
 * Combined row interface representing a driver with all their times
 */
interface CombinedTimeRow {
  driver_id: number;
  driver_name: string;
  division_id?: number;
  division_name?: string;
  qualifying_time: string;
  qualifying_time_ms: number;
  fastest_lap: string;
  fastest_lap_ms: number;
  race_time: string;
  race_time_ms: number;
}

interface Props {
  qualifyingResults: CrossDivisionResult[];
  fastestLapResults: CrossDivisionResult[];
  raceTimeResults: CrossDivisionResult[];
  showDivision?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDivision: false,
});

// Use division styles composable
const { getDivisionClass } = useDivisionStyles();

// Define table columns - conditionally include Division column
// All columns are non-sortable; data is pre-sorted by qualifying_time_ms
const columns = computed<TableColumn[]>(() => {
  const baseColumns: TableColumn[] = [
    { field: 'position', header: 'POS', width: '70px', align: 'center', sortable: false },
    { field: 'driver_name', header: 'Driver', width: '200px', align: 'left', sortable: false },
  ];

  // Add division column if showDivision is true
  if (props.showDivision) {
    baseColumns.push({
      field: 'division_name',
      header: 'Division',
      width: '120px',
      align: 'center',
      sortable: false,
    });
  }

  // Add time columns - sorting disabled because data is pre-sorted by _ms fields not exposed to table
  baseColumns.push(
    {
      field: 'qualifying_time',
      header: 'Qualifying',
      width: '130px',
      align: 'left',
      sortable: false,
    },
    { field: 'fastest_lap', header: 'Fastest Lap', width: '130px', align: 'left', sortable: false },
    { field: 'race_time', header: 'Race Time', width: '130px', align: 'left', sortable: false },
  );

  return baseColumns;
});

// Combine data from all three result sets by driver_id
const combinedData = computed<CombinedTimeRow[]>(() => {
  // Create a map to store combined data by driver_id
  const driverMap = new Map<number, CombinedTimeRow>();

  // Process qualifying results
  props.qualifyingResults.forEach((result) => {
    if (!driverMap.has(result.driver_id)) {
      driverMap.set(result.driver_id, {
        driver_id: result.driver_id,
        driver_name: result.driver_name,
        division_id: result.division_id,
        division_name: result.division_name,
        qualifying_time: formatTime(result, true),
        qualifying_time_ms: result.time_ms,
        fastest_lap: '-',
        fastest_lap_ms: Infinity,
        race_time: '-',
        race_time_ms: Infinity,
      });
    } else {
      const row = driverMap.get(result.driver_id)!;
      row.qualifying_time = formatTime(result, true);
      row.qualifying_time_ms = result.time_ms;
    }
  });

  // Process fastest lap results
  props.fastestLapResults.forEach((result) => {
    if (!driverMap.has(result.driver_id)) {
      driverMap.set(result.driver_id, {
        driver_id: result.driver_id,
        driver_name: result.driver_name,
        division_id: result.division_id,
        division_name: result.division_name,
        qualifying_time: '-',
        qualifying_time_ms: Infinity,
        fastest_lap: formatTime(result, false),
        fastest_lap_ms: result.time_ms,
        race_time: '-',
        race_time_ms: Infinity,
      });
    } else {
      const row = driverMap.get(result.driver_id)!;
      row.fastest_lap = formatTime(result, false);
      row.fastest_lap_ms = result.time_ms;
    }
  });

  // Process race time results
  props.raceTimeResults.forEach((result) => {
    if (!driverMap.has(result.driver_id)) {
      driverMap.set(result.driver_id, {
        driver_id: result.driver_id,
        driver_name: result.driver_name,
        division_id: result.division_id,
        division_name: result.division_name,
        qualifying_time: '-',
        qualifying_time_ms: Infinity,
        fastest_lap: '-',
        fastest_lap_ms: Infinity,
        race_time: formatTime(result, false),
        race_time_ms: result.time_ms,
      });
    } else {
      const row = driverMap.get(result.driver_id)!;
      row.race_time = formatTime(result, false);
      row.race_time_ms = result.time_ms;
    }
  });

  // Convert map to array and sort by qualifying time by default (fastest first)
  return Array.from(driverMap.values()).sort((a, b) => a.qualifying_time_ms - b.qualifying_time_ms);
});

// Cast combined data to table-compatible type (Record<string, unknown>[])
const tableData = computed(() => combinedData.value as unknown as Record<string, unknown>[]);

/**
 * Format time display
 * For qualifying times, always show the actual time formatted value
 * For fastest lap and race times, don't show differences
 */
const formatTime = (result: CrossDivisionResult, isQualifying: boolean): string => {
  if (!result.time_formatted) return '-';

  // For qualifying times, always show the formatted time (which already includes + for non-P1)
  if (isQualifying) {
    if (result.position === 1) {
      return result.time_formatted;
    }
    return result.time_difference ? `+${result.time_difference}` : result.time_formatted;
  }

  // For fastest lap and race times, just show the absolute time
  return result.time_formatted;
};

// Get position color based on standing
const getPositionColor = (position: number | null): string => {
  if (!position) return 'var(--text-dim)';

  switch (position) {
    case 1:
      return 'var(--color-racing-pole)'; // Gold
    case 2:
      return 'var(--color-racing-podium-2)'; // Silver
    case 3:
      return 'var(--color-racing-podium-3)'; // Bronze
    default:
      return 'var(--text-dim)';
  }
};
</script>

<style scoped>
/* Division Tags - Global styles imported from app.css */
</style>
