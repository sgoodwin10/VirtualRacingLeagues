<script setup lang="ts">
import VrlHeading from '@public/components/typography/VrlHeading.vue';
</script>

<template>
  <section class="py-12 theme-bg-secondary rounded-sm border theme-border">
    <div class="text-center">
      <VrlHeading :level="3" variant="section" class="mb-6">Implementation Roadmap</VrlHeading>
      <div class="max-w-2xl mx-auto space-y-4">
        <div class="flex items-center justify-between p-4 theme-bg-tertiary rounded-sm">
          <span class="font-display uppercase text-sm theme-text-primary">Sprint 1, 2 & 3</span>
          <div class="flex gap-2">
            <span
              class="px-3 py-1 text-[10px] font-display uppercase bg-racing-success/20 text-racing-success rounded-sm"
            >
              Complete
            </span>
          </div>
        </div>
        <div class="px-4 text-sm theme-text-muted text-left">
          ✓ Theme System (useTheme)<br />
          ✓ VrlHeading<br />
          ✓ VrlButton<br />
          ✓ VrlIconButton<br />
          ✓ VrlBadge<br />
          ✓ VrlInput<br />
          ✓ VrlTextarea<br />
          ✓ VrlSelect<br />
          ✓ VrlCheckbox<br />
          ✓ VrlRadio<br />
          ✓ VrlToggle
        </div>

        <div class="flex items-center justify-between p-4 theme-bg-tertiary rounded-sm mt-8">
          <span class="font-display uppercase text-sm theme-text-primary">Sprint 4+</span>
          <div class="flex gap-2">
            <span
              class="px-3 py-1 text-[10px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
            >
              Planned
            </span>
          </div>
        </div>
        <div class="px-4 text-sm theme-text-muted text-left">
          • Search &amp; Filters (SearchBar, FilterChips)<br />
          • Cards (VrlCard, VrlLeagueCard, VrlStatsCard)<br />
          • Navigation (Breadcrumbs, Tabs)<br />
          • Data Display (Table, StandingsTable, Pagination)<br />
          • Overlays (Modal, Drawer, Dialog, Toast)
        </div>
      </div>
    </div>
  </section>
</template>
