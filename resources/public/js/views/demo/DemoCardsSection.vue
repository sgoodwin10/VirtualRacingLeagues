<script setup lang="ts">
import VrlHeading from '@public/components/typography/VrlHeading.vue';
</script>

<template>
  <section id="cards" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Cards</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Card components for leagues, stats, and content display.
      </p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlCard</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">
          General purpose card with header, body, and footer slots.
        </p>
      </div>

      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlLeagueCard</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">
          Specialized card for league previews with logo and stats.
        </p>
      </div>

      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlStatsCard</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">Stats card with icons and highlighted values.</p>
      </div>
    </div>
  </section>
</template>
