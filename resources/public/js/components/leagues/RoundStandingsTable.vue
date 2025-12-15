<template>
  <VrlTable :data="tableData" :columns="columns" :sticky-header="true">
    <!-- Position column -->
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
    <template #cell-driver_name="{ data }">
      <span class="font-semibold text-md text-[var(--text-primary)]" data-test="driver-name">
        {{ data.driver_name }}
      </span>
    </template>

    <!-- Race Points column -->
    <template #cell-race_points="{ data }">
      <span class="font-medium" data-test="race-points">
        {{ data.race_points }}
      </span>
    </template>

    <!-- Fastest Lap Points column -->
    <template #cell-fastest_lap_points="{ data }">
      <span
        v-if="data.fastest_lap_points > 0"
        class="font-medium text-[var(--color-racing-fastest-lap)]"
        data-test="fl-points"
      >
        {{ data.fastest_lap_points }}
      </span>
      <span v-else class="text-[var(--text-dim)]" data-test="fl-points-empty">-</span>
    </template>

    <!-- Pole Position Points column -->
    <template #cell-pole_position_points="{ data }">
      <span
        v-if="data.pole_position_points > 0"
        class="font-medium text-[var(--color-racing-pole)]"
        data-test="pole-points"
      >
        {{ data.pole_position_points }}
      </span>
      <span v-else class="text-[var(--text-dim)]" data-test="pole-points-empty">-</span>
    </template>

    <!-- Total Points column -->
    <template #cell-total_points="{ data }">
      <span class="font-bold text-[var(--accent-gold)]" data-test="total-points">
        {{ data.total_points }}
      </span>
    </template>

    <!-- Positions Gained/Lost column -->
    <template #cell-total_positions_gained="{ data }">
      <span
        :class="getPositionGainedClass(data.total_positions_gained)"
        data-test="positions-gained"
      >
        {{ formatPositionsGained(data.total_positions_gained) }}
      </span>
    </template>
  </VrlTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VrlTable, { type TableColumn } from '@public/components/common/data-display/VrlTable.vue';
import type { RoundStandingDriver } from '@public/types/public';

interface Props {
  /**
   * Array of round standings to display
   */
  standings: RoundStandingDriver[];
  /**
   * Whether to show the "Race Pts" column
   * Should be true if ANY race in the round has race_points enabled
   * @default true
   */
  showRacePoints?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showRacePoints: true,
});

// Convert standings to generic records for VrlTable compatibility
const tableData = computed(() => {
  return props.standings.map((standing) => standing as unknown as Record<string, unknown>);
});

const columns = computed<TableColumn[]>(() => {
  const cols: TableColumn[] = [
    { field: 'position', header: 'Pos', width: '60px', align: 'center' },
    { field: 'driver_name', header: 'Driver', width: '150px' },
  ];

  // Conditionally add race points column
  if (props.showRacePoints) {
    cols.push({ field: 'race_points', header: 'Race Pts', width: '80px', align: 'right' });
  }

  // Add remaining columns
  cols.push(
    { field: 'fastest_lap_points', header: 'FL', width: '60px', align: 'center' },
    { field: 'pole_position_points', header: 'Pole', width: '60px', align: 'center' },
    { field: 'total_points', header: 'Total', width: '80px', align: 'right' },
    {
      field: 'total_positions_gained',
      header: '+/-',
      width: '60px',
      align: 'center',
    },
  );

  return cols;
});

/**
 * Get position color based on position value
 */
const getPositionColor = (position: number | null): string => {
  if (!position) return 'var(--text-dim)';

  if (position === 1) return 'var(--color-racing-gold)'; // Gold for P1
  if (position === 2) return 'var(--color-racing-silver)'; // Silver for P2
  if (position === 3) return 'var(--color-racing-bronze)'; // Bronze for P3

  return 'var(--text-primary)'; // Default for all others
};

/**
 * Format positions gained/lost with +/- prefix
 */
const formatPositionsGained = (value: number): string => {
  if (value === 0) return '-';
  if (value > 0) return `+${value}`;
  return `${value}`;
};

/**
 * Get CSS class for positions gained/lost based on value
 */
const getPositionGainedClass = (value: number): string => {
  if (value > 0) return 'font-medium text-[var(--color-success)]';
  if (value < 0) return 'font-medium text-[var(--color-safety)]';
  return 'font-medium text-[var(--text-dim)]';
};
</script>

<style scoped>
/* Component uses VrlTable styles - minimal additional styling needed */
</style>
