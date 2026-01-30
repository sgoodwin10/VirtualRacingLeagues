<template>
  <div
    class="rounds-section bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px] overflow-hidden"
  >
    <!-- Section Header -->
    <div class="p-6 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
      <h3
        class="font-[var(--font-display)] font-semibold tracking-[0.5px] text-[var(--text-primary)]"
      >
        Race Rounds
      </h3>
    </div>

    <!-- Rounds List -->
    <div v-if="rounds.length > 0" class="md:p-4">
      <VrlAccordion :model-value="expandedRound" gap="md">
        <RoundAccordion
          v-for="round in props.rounds"
          :key="round.id"
          :round="round"
          :has-divisions="props.hasDivisions"
          :race-times-required="props.raceTimesRequired"
          :competition-name="props.competitionName"
          :season-name="props.seasonName"
          :value="String(round.id)"
          :initially-expanded="expandedRound === String(round.id)"
        />
      </VrlAccordion>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-center">
      <div class="text-[var(--text-muted)] mb-2">
        <i class="ph ph-calendar-blank text-5xl"></i>
      </div>
      <p class="text-[var(--text-secondary)]">No rounds scheduled yet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PublicRound } from '@public/types/public';
import VrlAccordion from '@public/components/common/accordions/VrlAccordion.vue';
import RoundAccordion from './RoundAccordion.vue';

interface Props {
  /** Array of rounds from the season */
  rounds: PublicRound[];

  /** Whether the season has divisions enabled */
  hasDivisions: boolean;

  /** Whether race times are required for this season */
  raceTimesRequired: boolean;

  /** Competition name for CSV export */
  competitionName?: string;

  /** Season name for CSV export */
  seasonName?: string;
}

const props = defineProps<Props>();

/**
 * All accordions start closed - user must click to expand
 */
const expandedRound = computed((): string | undefined => {
  return undefined;
});
</script>
