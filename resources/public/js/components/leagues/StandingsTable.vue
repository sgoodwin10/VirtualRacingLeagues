<template>
  <VrlTable :data="tableData" :columns="columns" :sticky-header="true">
    <!-- Position column with colored numbers -->
    <template #cell-position="{ data }">
      <span class="font-display text-xl" :style="{ color: getPositionColor(data.position) }">
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

    <!-- Podiums column -->
    <template #cell-podiums="{ data }">
      <span class="font-data text-[var(--text-primary)]" data-test="podiums-count">
        {{ data.podiums && data.podiums > 0 ? data.podiums : '' }}
      </span>
    </template>

    <!-- Poles column -->
    <template #cell-poles="{ data }">
      <span class="font-data text-[var(--text-primary)]" data-test="poles-count">
        {{ data.poles && data.poles > 0 ? data.poles : '' }}
      </span>
    </template>

    <!-- Dynamic round columns with badges -->
    <template
      v-for="round in props.rounds"
      :key="`slot-${round.round_id}`"
      #[`cell-round_${round.round_id}`]="{ data }"
    >
      <div class="flex flex-col items-center gap-0.5">
        <span
          class="font-data"
          :title="getRoundPositionTooltip(data, round.round_id)"
          :data-test="`round-${round.round_id}-points`"
        >
          {{ getRoundPoints(data, round.round_id) }}
        </span>
        <div v-if="hasAnyBadge(data, round.round_id)" class="flex gap-0.5 min-h-[12px]">
          <span
            v-if="hasPole(data, round.round_id)"
            class="font-display text-[8px] px-1 py-0.5 rounded"
            style="background: rgba(212, 168, 83, 0.3); color: var(--color-gold)"
            title="Pole Position"
          >
            P
          </span>
          <span
            v-if="hasFastestLap(data, round.round_id)"
            class="font-display text-[8px] px-1 py-0.5 rounded"
            style="background: rgba(168, 85, 247, 0.3); color: var(--color-fastest-lap)"
            title="Fastest Lap"
          >
            FL
          </span>
        </div>
      </div>
    </template>

    <!-- Points column -->
    <template #cell-points="{ data }">
      <span class="font-semibold text-[var(--text-primary)]" data-test="total-points">
        {{ data.total_points }}
      </span>
    </template>
  </VrlTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VrlTable, { type TableColumn } from '@public/components/common/data-display/VrlTable.vue';
import DriverNameLink from '@public/components/common/DriverNameLink.vue';
import type { SeasonStandingDriver } from '@public/types/public';

interface Round {
  round_id: number;
  round_number: number;
  name: string;
}

interface Props {
  drivers: SeasonStandingDriver[];
  rounds: Round[];
}

const props = defineProps<Props>();

// Build dynamic columns: Pos | Driver | Podiums | Poles | R1 | R2 | ... | Points
const columns = computed<TableColumn[]>(() => {
  const cols: TableColumn[] = [
    { field: 'position', header: 'Pos', width: '60px', align: 'center' },
    { field: 'driver', header: 'Driver', width: '150px', align: 'left' },
    { field: 'podiums', header: 'Podiums', width: '80px', align: 'center' },
    { field: 'poles', header: 'Poles', width: '70px', align: 'center' },
  ];

  // Add round columns
  props.rounds.forEach((round) => {
    cols.push({
      field: `round_${round.round_id}`,
      header: `R${round.round_number}`,
      width: '70px',
      align: 'center',
    });
  });

  // Add points column at the end with custom class for styling
  cols.push({
    field: 'points',
    header: 'Points',
    width: '80px',
    align: 'center',
  });

  return cols;
});

// Transform driver data to include round fields for table
const tableData = computed(() => {
  return props.drivers.map((driver) => ({
    ...driver,
    driver: driver.driver_name, // for the driver column field
    points: driver.total_points, // for the points column field
  }));
});

// Create a lookup map for O(1) round data access
// Using computed() is optimal here because:
// 1. Vue caches the result and only recalculates when props.drivers changes
// 2. The Map structure provides O(1) lookup time for driver/round combinations
// 3. This avoids O(n*m) array iterations in the template (n drivers × m rounds)
// Performance: For 20 drivers × 15 rounds = 300 cells, this saves ~4,500 array iterations per render
const roundsLookup = computed(() => {
  const lookup = new Map<
    number,
    Map<
      number,
      { points: number; position: number | null; has_pole: boolean; has_fastest_lap: boolean }
    >
  >();

  props.drivers.forEach((driver) => {
    const driverMap = new Map();
    driver.rounds.forEach((round) => {
      driverMap.set(round.round_id, {
        points: round.points,
        position: round.position,
        has_pole: round.has_pole,
        has_fastest_lap: round.has_fastest_lap,
      });
    });
    lookup.set(driver.driver_id, driverMap);
  });

  return lookup;
});

const getRoundPoints = (driver: SeasonStandingDriver, roundId: number): string => {
  const driverRounds = roundsLookup.value.get(driver.driver_id);
  const roundData = driverRounds?.get(roundId);
  return roundData ? roundData.points.toString() : '-';
};

const hasPole = (driver: SeasonStandingDriver, roundId: number): boolean => {
  const driverRounds = roundsLookup.value.get(driver.driver_id);
  const roundData = driverRounds?.get(roundId);
  return roundData?.has_pole ?? false;
};

const hasFastestLap = (driver: SeasonStandingDriver, roundId: number): boolean => {
  const driverRounds = roundsLookup.value.get(driver.driver_id);
  const roundData = driverRounds?.get(roundId);
  return roundData?.has_fastest_lap ?? false;
};

const hasAnyBadge = (driver: SeasonStandingDriver, roundId: number): boolean => {
  return hasPole(driver, roundId) || hasFastestLap(driver, roundId);
};

const getRoundPositionTooltip = (driver: SeasonStandingDriver, roundId: number): string => {
  const driverRounds = roundsLookup.value.get(driver.driver_id);
  const roundData = driverRounds?.get(roundId);

  if (!roundData) return '';

  const position = roundData.position;
  if (position === null) return '';

  // Format position with suffix (1st, 2nd, 3rd, 4th, etc.)
  // Special case for 11th, 12th, 13th
  let suffix: string;
  if (position % 100 >= 11 && position % 100 <= 13) {
    suffix = 'th';
  } else {
    const lastDigit = position % 10;
    suffix = lastDigit === 1 ? 'st' : lastDigit === 2 ? 'nd' : lastDigit === 3 ? 'rd' : 'th';
  }

  return `P${position}${suffix} - ${roundData.points} pts`;
};

// Get position color based on standing
// Uses CSS variables for consistent theming across the application
const getPositionColor = (position: number): string => {
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
/* Highlight the Points (totals) column with a subtle background */
:deep(.vrl-table-body-cell:has(span[data-test='total-points'])),
:deep(.vrl-table-header-cell:has(span:contains('Points'))) {
  background-color: var(--bg-tertiary);
}

/* Alternative approach: target the last column specifically */
:deep(.p-datatable-tbody > tr > td:last-child) {
  background-color: var(--bg-tertiary);
}

:deep(.p-datatable-thead > tr > th:last-child) {
  background-color: var(--bg-tertiary);
}

/* Maintain hover effect on rows */
:deep(.p-datatable-tbody > tr:hover > td:last-child) {
  background-color: var(--bg-elevated);
}

/* Column borders - add vertical borders between all columns */
:deep(.p-datatable-thead > tr > th) {
  border-right: 1px solid var(--border-subtle);
}

:deep(.p-datatable-tbody > tr > td) {
  border-right: 1px solid var(--border-subtle);
}

/* Remove border from the last column to avoid double border at the edge */
:deep(.p-datatable-thead > tr > th:last-child) {
  border-right: none;
}

:deep(.p-datatable-tbody > tr > td:last-child) {
  border-right: none;
}
</style>
