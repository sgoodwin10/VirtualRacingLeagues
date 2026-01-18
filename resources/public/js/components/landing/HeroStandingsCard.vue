<script setup lang="ts">
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import StandingsRow from '@public/components/landing/StandingsRow.vue';

/**
 * HeroStandingsCard Component
 *
 * Live standings preview card with perspective transform effect.
 * Displays championship title, live badge, and top 4 driver standings.
 */

interface Driver {
  position: number;
  initials: string;
  name: string;
  team: string;
  points: number;
}

interface HeroStandingsCardProps {
  /** Championship title */
  title?: string;
  /** Standings data */
  standings: Driver[];
}

withDefaults(defineProps<HeroStandingsCardProps>(), {
  title: 'GT4 CHAMPIONSHIP',
});
</script>

<template>
  <div
    class="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 hero-card-transform shadow-[0_25px_50px_rgba(0,0,0,0.5),0_0_100px_rgba(88,166,255,0.1)]"
  >
    <!-- Header -->
    <div class="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
      <span class="font-[var(--font-display)] text-base font-semibold tracking-[1px]">
        {{ title }}
      </span>
      <VrlBadge variant="green" dot pulse>LIVE</VrlBadge>
    </div>

    <!-- Standings Rows -->
    <div>
      <StandingsRow
        v-for="driver in standings"
        :key="driver.position"
        :position="driver.position"
        :initials="driver.initials"
        :name="driver.name"
        :team="driver.team"
        :points="driver.points"
      />
    </div>
  </div>
</template>

<style scoped>
.hero-card-transform {
  transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .hero-card-transform {
    transform: none;
  }
}
</style>
