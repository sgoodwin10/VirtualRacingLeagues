<script setup lang="ts">
import VrlHeading from '@public/components/typography/VrlHeading.vue';
</script>

<template>
  <section id="navigation" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Navigation</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Navigation components for breadcrumbs, tabs, and menus.
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlBreadcrumbs</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">Breadcrumb navigation with racing aesthetics.</p>
      </div>

      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlTabs</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">Tab navigation with angled indicator.</p>
      </div>
    </div>
  </section>
</template>
