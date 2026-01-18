<script setup lang="ts">
import VrlPositionIndicator from '@public/components/common/indicators/VrlPositionIndicator.vue';

/**
 * StandingsRow Component
 *
 * Displays a single driver row in the standings card.
 * Shows position, avatar with initials, driver name, team, and points.
 */

interface StandingsRowProps {
  /** Driver position */
  position: number;
  /** Driver initials for avatar */
  initials: string;
  /** Driver name */
  name: string;
  /** Team name */
  team: string;
  /** Driver points */
  points: number;
}

defineProps<StandingsRowProps>();
</script>

<template>
  <div
    class="grid grid-cols-[40px_1fr_80px] items-center py-3 border-b border-[var(--border-muted)] last:border-b-0"
  >
    <!-- Position -->
    <VrlPositionIndicator :position="position" />

    <!-- Driver Info -->
    <div class="flex items-center gap-3">
      <div
        class="w-8 h-8 hidden bg-[var(--bg-elevated)] rounded-[var(--radius)] flex items-center justify-center font-[var(--font-display)] text-[0.7rem] font-semibold border border-[var(--border)]"
      >
        {{ initials }}
      </div>
      <div>
        <div class="font-medium text-[0.9rem]">{{ name }}</div>
        <div class="text-[0.75rem] text-[var(--text-muted)]">{{ team }}</div>
      </div>
    </div>

    <!-- Points -->
    <div class="font-[var(--font-display)] font-bold text-right text-base">
      {{ points }}
    </div>
  </div>
</template>
