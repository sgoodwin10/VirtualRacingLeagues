<script setup lang="ts">
import { computed } from 'vue';
import { PhTimer } from '@phosphor-icons/vue';
import VrlTable, { type TableColumn } from './VrlTable.vue';

export interface StandingsEntry {
  position: number;
  driver: string;
  team?: string;
  points: number;
  gap?: string;
  fastestLap?: boolean;
  dnf?: boolean;
  dns?: boolean;
}

interface Props {
  standings: Array<StandingsEntry>;
  loading?: boolean;
  class?: string;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  class: '',
});

// Define columns for standings table
const columns = computed<Array<TableColumn>>(() => [
  { field: 'position', header: 'Pos', sortable: false, width: '60px', align: 'center' },
  { field: 'driver', header: 'Driver', sortable: true, align: 'left' },
  { field: 'team', header: 'Team', sortable: true, align: 'left' },
  { field: 'points', header: 'Points', sortable: true, width: '80px', align: 'right' },
  { field: 'gap', header: 'Gap', sortable: false, width: '70px', align: 'right' },
]);

// Get position color based on standing
const getPositionColor = (position: number): string => {
  switch (position) {
    case 1:
      return '#d4a853'; // Gold
    case 2:
      return '#c0c0c0'; // Silver
    case 3:
      return '#cd7f32'; // Bronze
    default:
      return 'var(--text-dim)';
  }
};

// Format gap (leader shows "-")
const formatGap = (gap?: string, position?: number): string => {
  if (position === 1) return '-';
  return gap || '-';
};
</script>

<template>
  <!-- eslint-disable-next-line vue/no-parsing-error -->
  <VrlTable :data="standings" :columns="columns" :loading="loading" :class="$props.class">
    <!-- Position column with colored numbers -->
    <template #cell-position="{ data }">
      <span
        class="font-display text-xl"
        :style="{ color: getPositionColor(data.position) }"
        :data-position="data.position"
      >
        {{ data.position }}
      </span>
    </template>

    <!-- Driver column with badges -->
    <template #cell-driver="{ data }">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-[var(--text-primary)]">
          {{ data.driver }}
        </span>

        <!-- Fastest Lap badge -->
        <span
          v-if="data.fastestLap"
          class="inline-flex items-center gap-1 text-xs text-[#a855f7]"
          data-badge="fastest-lap"
        >
          <PhTimer :size="14" weight="fill" />
          <span>FL</span>
        </span>

        <!-- DNF badge -->
        <span
          v-if="data.dnf"
          class="px-1.5 py-0.5 text-[10px] rounded"
          style="background: rgba(239, 68, 68, 0.2); color: #ef4444"
          data-badge="dnf"
        >
          DNF
        </span>

        <!-- DNS badge -->
        <span
          v-if="data.dns"
          class="px-1.5 py-0.5 text-[10px] rounded"
          style="background: rgba(239, 68, 68, 0.2); color: #ef4444"
          data-badge="dns"
        >
          DNS
        </span>
      </div>
    </template>

    <!-- Team column with muted color -->
    <template #cell-team="{ data }">
      <span class="text-[var(--text-muted)]">
        {{ data.team || '-' }}
      </span>
    </template>

    <!-- Points column with bold styling -->
    <template #cell-points="{ data }">
      <span class="font-semibold text-[var(--text-primary)]">
        {{ data.points }}
      </span>
    </template>

    <!-- Gap column with formatting -->
    <template #cell-gap="{ data }">
      <span class="text-[var(--text-dim)]">
        {{ formatGap(data.gap, data.position) }}
      </span>
    </template>

    <!-- Pass through empty and loading slots -->
    <template #empty>
      <slot name="empty">
        <div class="text-center py-8 theme-text-muted">No standings data available</div>
      </slot>
    </template>

    <template #loading>
      <slot name="loading">
        <div class="text-center py-8 theme-text-muted">Loading standings...</div>
      </slot>
    </template>
  </VrlTable>
</template>
