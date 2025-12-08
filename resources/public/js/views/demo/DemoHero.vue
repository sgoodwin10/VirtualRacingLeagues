<script setup lang="ts">
import { useTheme } from '@public/composables/useTheme';
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
import { PhMoon, PhSun } from '@phosphor-icons/vue';

const { theme, toggleTheme } = useTheme();
</script>

<template>
  <section class="relative overflow-hidden gradient-hero py-20">
    <div class="pattern-stripes absolute inset-0 opacity-50"></div>
    <div class="container-racing relative z-10">
      <div class="max-w-3xl mx-auto text-center">
        <span
          class="inline-block px-4 py-1 mb-6 text-[10px] font-display uppercase tracking-[0.3em] theme-accent-gold theme-bg-tertiary rounded-sm"
        >
          Design System
        </span>
        <VrlHeading :level="1" variant="hero" class="mb-6"> VRL Component Library </VrlHeading>
        <p class="text-lg theme-text-muted mb-8 max-w-2xl mx-auto">
          A comprehensive showcase of all Virtual Racing Leagues design system components. Test
          different states, variants, and themes to ensure consistency across the platform.
        </p>

        <!-- Theme Toggle -->
        <div class="flex items-center justify-center gap-4 mb-12">
          <span class="text-sm theme-text-secondary font-display uppercase tracking-wider"
            >Current Theme:</span
          >
          <button
            class="flex items-center gap-3 px-6 py-3 theme-card rounded-sm transition-all hover:scale-105"
            @click="toggleTheme"
          >
            <component :is="theme === 'dark' ? PhMoon : PhSun" :size="20" weight="duotone" />
            <span class="font-display uppercase text-sm theme-text-primary">
              {{ theme === 'dark' ? 'Dark Mode' : 'Light Mode' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
