<template>
  <VrlPanel :title="raceTitle" class="race-results-panel">
    <div v-if="!hasResults" class="flex flex-col items-center justify-center py-8 text-center">
      <i class="ph ph-flag-checkered text-4xl text-[var(--text-muted)] mb-2"></i>
      <p class="text-[var(--text-secondary)]">Results not available yet</p>
    </div>

    <div v-else class="text-sm text-[var(--text-secondary)] mb-4">
      <i class="ph ph-info text-[var(--cyan)]"></i>
      <span class="ml-1">Race results will be displayed here when available from the backend.</span>
    </div>
  </VrlPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PublicRace } from '@public/types/public';
import VrlPanel from '@public/components/common/panels/VrlPanel.vue';

interface Props {
  /** Race data */
  race: PublicRace;

  /** Round ID (for fetching results if needed) */
  roundId: number;
}

const props = defineProps<Props>();

/**
 * Race title with type
 */
const raceTitle = computed(() => {
  const raceName = props.race.name || `Race ${props.race.race_number}`;
  const raceType = props.race.is_qualifier ? 'Qualifying' : getRaceTypeLabel(props.race.race_type);
  return `${raceName} (${raceType})`;
});

/**
 * Get race type label
 */
function getRaceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sprint: 'Sprint',
    feature: 'Feature',
    endurance: 'Endurance',
    qualifying: 'Qualifying',
    custom: 'Race',
  };
  return labels[type] || type;
}

/**
 * Check if race has results
 * Note: This is a placeholder. The PublicRace type doesn't currently include results.
 * This would need to be implemented when race results are added to the backend API.
 */
const hasResults = computed(() => {
  // TODO: Implement when race results are available in PublicRace
  return false;
});
</script>

<style scoped>
.race-results-panel {
  background: var(--bg-elevated);
}
</style>
