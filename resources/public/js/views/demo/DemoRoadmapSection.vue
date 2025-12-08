<script setup lang="ts">
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
</script>

<template>
  <section class="py-12 theme-bg-secondary rounded-sm border theme-border">
    <div class="text-center">
      <VrlHeading :level="3" variant="section" class="mb-6">Implementation Roadmap</VrlHeading>
      <div class="max-w-3xl mx-auto space-y-4">
        <div class="flex items-center justify-between p-4 theme-bg-tertiary rounded-sm">
          <span class="font-display uppercase text-sm theme-text-primary">All Sprints (1-8)</span>
          <div class="flex gap-2">
            <span
              class="px-3 py-1 text-[10px] font-display uppercase bg-racing-success/20 text-racing-success rounded-sm"
            >
              Complete
            </span>
          </div>
        </div>
        <div
          class="px-4 text-sm theme-text-muted text-left grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2"
        >
          <div>
            ✓ Theme System (useTheme)<br />
            ✓ Typography (VrlHeading)<br />
            ✓ Buttons (VrlButton, VrlIconButton)<br />
            ✓ Badges (VrlBadge)<br />
            ✓ Forms (VrlInput, VrlTextarea, VrlSelect)<br />
            ✓ Form Controls (VrlCheckbox, VrlRadio, VrlToggle)
          </div>
          <div>
            ✓ Search &amp; Filters (VrlSearchBar, VrlFilterChips)<br />
            ✓ Cards (VrlCard, VrlLeagueCard, VrlStatsCard)<br />
            ✓ Navigation (VrlBreadcrumbs, VrlTabs)<br />
            ✓ Data Display (VrlStandingsTable, VrlPagination)<br />
            ✓ Overlays (VrlModal, VrlDrawer, VrlDialog)<br />
            ✓ Notifications (VrlToast)
          </div>
        </div>

        <div class="mt-8 p-4 theme-bg-tertiary rounded-sm border theme-border">
          <p class="text-xs font-display uppercase tracking-wider theme-accent-gold mb-2">
            Status: Production Ready
          </p>
          <p class="text-sm theme-text-muted">
            All core components have been implemented, tested, and are ready for use in production
            applications. The design system provides a comprehensive foundation for building
            racing-themed applications with full TypeScript support, accessibility features, and
            responsive design.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
