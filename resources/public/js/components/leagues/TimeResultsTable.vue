<template>
  <VrlTable :data="tableData" :columns="columns" :sticky-header="true">
    <!-- Position column with colored numbers -->
    <template #cell-position="{ data }">
      <span
        class="font-display text-xl"
        :style="{ color: getPositionColor(data.position) }"
        data-test="position"
      >
        {{ data.position }}
      </span>
    </template>

    <!-- Driver column -->
    <template #cell-driver="{ data }">
      <DriverNameLink
        :driver-name="data.driver_name"
        :driver-id="data.driver_id"
        data-test="driver-name"
      />
    </template>

    <!-- Division column (only shown when showDivision is true) -->
    <template v-if="showDivision" #cell-division="{ data }">
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

    <!-- Time column - P1 shows actual time, others show difference -->
    <template #cell-time="{ data }">
      <span class="font-data text-[var(--text-primary)]" data-test="time">
        {{ formatTime(data) }}
      </span>
    </template>
  </VrlTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VrlTable, { type TableColumn } from '@public/components/common/data-display/VrlTable.vue';
import DriverNameLink from '@public/components/common/DriverNameLink.vue';
import type { TimeResult } from '@public/types/public';
import { useDivisionStyles } from '@public/composables/useDivisionStyles';

interface Props {
  results: TimeResult[];
  showDivision?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDivision: false,
});

// Use division styles composable
const { getDivisionClass } = useDivisionStyles();

// Define table columns - conditionally include Division column
const columns = computed<TableColumn[]>(() => {
  const baseColumns: TableColumn[] = [
    { field: 'position', header: 'POS', width: '70px', align: 'center' },
    { field: 'driver', header: 'Driver', width: '200px', align: 'left' },
  ];

  // Add division column if showDivision is true
  if (props.showDivision) {
    baseColumns.push({ field: 'division', header: 'Division', width: '120px', align: 'center' });
  }

  // Add time column
  baseColumns.push({ field: 'time', header: 'Time', width: '130px', align: 'left' });

  return baseColumns;
});

// Transform results data for table
const tableData = computed(() => {
  return props.results.map((result) => ({
    ...result,
    driver: result.driver_name,
    division: result.division_name || null,
  }));
});

// Format time - show actual time for P1, difference for others
const formatTime = (result: TimeResult): string => {
  if (result.position === 1) {
    return result.time_formatted || '-';
  }

  // For positions 2+, show the difference with + prefix
  if (result.time_difference) {
    return `+${result.time_difference}`;
  }

  return result.time_formatted || '-';
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
