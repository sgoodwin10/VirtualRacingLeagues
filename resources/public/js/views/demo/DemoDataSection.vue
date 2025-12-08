<script setup lang="ts">
import VrlHeading from '@public/components/typography/VrlHeading.vue';
</script>

<template>
  <section id="data" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Data Display</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Components for displaying tables, standings, and paginated data.
      </p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlTable</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">
          Data table with sorting, filtering, and responsive design.
        </p>
      </div>

      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlStandingsTable</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">
          Specialized table for race standings with position highlights.
        </p>
      </div>

      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlPagination</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">
          Pagination controls with page numbers and navigation.
        </p>
      </div>
    </div>
  </section>
</template>
