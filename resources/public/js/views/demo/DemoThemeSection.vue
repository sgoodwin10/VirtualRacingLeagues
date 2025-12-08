<script setup lang="ts">
import VrlHeading from '@public/components/typography/VrlHeading.vue';
</script>

<template>
  <section id="theme" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Theme System</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        VRL uses a comprehensive theme system with dark and light modes. All components
        automatically adapt using CSS custom properties.
      </p>
    </div>

    <!-- Theme Variables Demo -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-6">Theme Variables</VrlHeading>

      <!-- Background Colors -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Background Colors
        </VrlHeading>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="bg in ['primary', 'secondary', 'tertiary', 'elevated']"
            :key="bg"
            class="space-y-2"
          >
            <div :class="`theme-bg-${bg} h-20 rounded border theme-border`"></div>
            <p class="text-xs font-data theme-text-muted">.theme-bg-{{ bg }}</p>
          </div>
        </div>
      </div>

      <!-- Text Colors -->
      <div class="mb-8">
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Text Colors
        </VrlHeading>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="text in ['primary', 'secondary', 'muted', 'dim']" :key="text">
            <p :class="`theme-text-${text} text-lg font-display uppercase`">The Quick Fox</p>
            <p class="text-xs font-data theme-text-muted mt-1">.theme-text-{{ text }}</p>
          </div>
        </div>
      </div>

      <!-- Accent Colors -->
      <div>
        <VrlHeading
          :level="4"
          as="div"
          class="text-sm font-display uppercase tracking-wider theme-text-secondary mb-4"
        >
          Accent Colors
        </VrlHeading>
        <div class="flex flex-wrap gap-6">
          <div class="space-y-2">
            <div class="w-24 h-24 bg-racing-gold rounded"></div>
            <p class="text-xs font-data theme-text-muted">Gold</p>
          </div>
          <div class="space-y-2">
            <div class="w-24 h-24 bg-racing-safety rounded"></div>
            <p class="text-xs font-data theme-text-muted">Safety Orange</p>
          </div>
          <div class="space-y-2">
            <div class="w-24 h-24 bg-racing-danger rounded"></div>
            <p class="text-xs font-data theme-text-muted">Danger</p>
          </div>
          <div class="space-y-2">
            <div class="w-24 h-24 bg-racing-success rounded"></div>
            <p class="text-xs font-data theme-text-muted">Success</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme Utilities Demo -->
    <div class="theme-card p-8 rounded-sm">
      <VrlHeading :level="3" variant="card" class="mb-4">Theme Utility Classes</VrlHeading>
      <p class="theme-text-muted mb-6">
        Use these utility classes for theme-aware components that automatically adapt between dark
        and light modes.
      </p>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Card Example -->
        <div class="theme-card p-6 rounded-sm">
          <p class="text-xs font-display uppercase tracking-wider theme-accent-gold mb-3">
            Example Card
          </p>
          <VrlHeading :level="5" class="mb-2">Card Title</VrlHeading>
          <p class="theme-text-muted text-sm mb-4">
            This card uses theme utilities for backgrounds, borders, and text colors.
          </p>
          <div class="flex gap-2">
            <span
              class="px-2 py-1 text-[10px] font-display uppercase theme-bg-tertiary theme-text-muted rounded-sm"
              >Tag</span
            >
          </div>
        </div>

        <!-- Glass Effect Example -->
        <div class="theme-bg-glass p-6 rounded-sm border theme-border">
          <p class="text-xs font-display uppercase tracking-wider theme-accent-safety mb-3">
            Glass Effect
          </p>
          <VrlHeading :level="5" class="mb-2">Frosted Glass</VrlHeading>
          <p class="theme-text-muted text-sm">
            Uses backdrop blur for a modern glassmorphism effect.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
