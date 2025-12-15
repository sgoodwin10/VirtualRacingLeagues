<template>
  <VrlTable :data="tableData" :columns="columns" :sticky-header="true">
    <!-- Position column with colored numbers and DNF badge -->
    <template #cell-position="{ data }">
      <div v-if="data.dnf" class="dnf-badge" data-test="dnf-badge">DNF</div>
      <span
        v-else
        class="font-display text-xl"
        :style="{ color: getPositionColor(data.position) }"
        data-test="position"
      >
        {{ data.position }}
      </span>
    </template>

    <!-- Driver column -->
    <template #cell-driver="{ data }">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-md text-[var(--text-primary)]" data-test="driver-name">
          {{ data.driver_name }}
        </span>
        <div class="flex gap-1">
          <span
            v-if="data.has_pole"
            class="font-display text-[8px] px-1.5 py-0.5 rounded"
            style="background: rgba(212, 168, 83, 0.3); color: var(--color-racing-pole)"
            title="Pole Position"
            data-test="pole-badge"
          >
            POLE
          </span>
        </div>
      </div>
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

    <!-- Race Time column -->
    <template #cell-time="{ data }">
      <span class="font-data text-[var(--text-primary)]" data-test="race-time">
        {{ formatRaceTime(data) }}
      </span>
    </template>

    <!-- Fastest Lap column with highlight -->
    <template #cell-fastest_lap="{ data }">
      <span
        v-if="data.fastest_lap"
        :class="[
          'font-data',
          data.has_fastest_lap
            ? 'text-[var(--color-racing-fastest-lap)] font-semibold'
            : 'text-[var(--text-dim)]',
        ]"
        data-test="fastest-lap"
      >
        {{ data.fastest_lap }}
      </span>
      <span v-else class="text-[var(--text-dim)]">-</span>
    </template>

    <!-- Penalties column -->
    <template #cell-penalties="{ data }">
      <span
        v-if="data.penalties"
        class="font-data text-[var(--color-racing-safety)] text-sm"
        data-test="penalties"
      >
        {{ data.penalties }}
      </span>
      <span v-else class="text-[var(--text-dim)]">-</span>
    </template>

    <!-- Points column -->
    <template #cell-points="{ data }">
      <span class="font-semibold text-[var(--text-primary)]" data-test="race-points">
        {{ data.race_points }}
      </span>
    </template>
  </VrlTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VrlTable, { type TableColumn } from '@public/components/common/data-display/VrlTable.vue';
import type { PublicRaceResult } from '@public/types/public';
import { useDivisionStyles } from '@public/composables/useDivisionStyles';

interface Props {
  results: PublicRaceResult[];
  showDivision?: boolean;
  isQualifier?: boolean;
  showPoints?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDivision: false,
  isQualifier: false,
  showPoints: true,
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

  // For qualifying results, show only Position, Driver, (optional Division), Fastest Lap, Points
  if (props.isQualifier) {
    baseColumns.push({
      field: 'fastest_lap',
      header: 'Fastest Lap',
      width: '130px',
      align: 'center',
    });

    // Only add points column if showPoints is true
    if (props.showPoints) {
      baseColumns.push({ field: 'points', header: 'Points', width: '80px', align: 'center' });
    }
  } else {
    // For race results, show all columns
    baseColumns.push(
      { field: 'time', header: 'Time', width: '130px', align: 'left' },
      { field: 'fastest_lap', header: 'Fastest Lap', width: '130px', align: 'center' },
      { field: 'penalties', header: 'Penalties', width: '120px', align: 'center' },
    );

    // Only add points column if showPoints is true
    if (props.showPoints) {
      baseColumns.push({ field: 'points', header: 'Points', width: '80px', align: 'center' });
    }
  }

  return baseColumns;
});

// Transform results data for table
const tableData = computed(() => {
  return props.results.map((result) => ({
    ...result,
    driver: result.driver_name,
    time: result.race_time,
    points: result.race_points,
    division: result.division_name || null,
  }));
});

// Format race time - show actual time for P1, difference for others
const formatRaceTime = (result: PublicRaceResult): string => {
  if (result.dnf) {
    return result.status || 'DNF';
  }

  if (result.position === 1) {
    return result.race_time || '-';
  }

  if (result.race_time_difference) {
    return `+${result.race_time_difference}`;
  }

  return result.race_time || '-';
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
/* DNF Badge */
.dnf-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-racing-pit-white);
  background: var(--color-racing-dnf);
  border-radius: 4px;
  text-transform: uppercase;
}

/* Division Tags - Global styles imported from app.css */

/* Highlight the Points column (when it's shown) */
:deep(.p-datatable-tbody > tr > td:last-child[data-p-field='points']) {
  background-color: var(--bg-tertiary);
}

:deep(.p-datatable-thead > tr > th:last-child) {
  background-color: var(--bg-tertiary);
}

/* Maintain hover effect on rows */
:deep(.p-datatable-tbody > tr:hover > td:last-child[data-p-field='points']) {
  background-color: var(--bg-elevated);
}

/* Zebra striping for rows */
:deep(.p-datatable-tbody > tr:nth-child(even)) {
  background-color: rgba(255, 255, 255, 0.02);
}

:deep(.p-datatable-tbody > tr:nth-child(even):hover) {
  background-color: var(--bg-elevated);
}
</style>
