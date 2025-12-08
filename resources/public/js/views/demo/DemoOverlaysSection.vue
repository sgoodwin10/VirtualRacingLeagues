<script setup lang="ts">
import VrlHeading from '@public/components/typography/VrlHeading.vue';
</script>

<template>
  <section id="overlays" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Overlays</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Modal dialogs, drawers, toasts, and overlay components.
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlModal</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">Modal dialog with backdrop and animations.</p>
      </div>

      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlDrawer</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">Slide-out drawer from any edge.</p>
      </div>

      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlDialog</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">Confirmation dialogs and alerts.</p>
      </div>

      <div class="theme-card p-6 rounded-sm opacity-60">
        <div class="flex items-center justify-between mb-3">
          <VrlHeading :level="4" variant="card">VrlToast</VrlHeading>
          <span
            class="px-2 py-1 text-[9px] font-display uppercase bg-racing-gold/20 text-racing-gold rounded-sm"
          >
            Coming Soon
          </span>
        </div>
        <p class="theme-text-muted text-sm">Toast notifications with auto-dismiss.</p>
      </div>
    </div>
  </section>
</template>
