<script setup lang="ts">
import SectionHeader from '../SectionHeader.vue';
import PlatformCard from '../PlatformCard.vue';

/**
 * PlatformsSection Component
 *
 * Supported gaming platforms section.
 * Displays GT7 and iRacing platform cards.
 */

const platforms = [
  { icon: '🎮', name: 'Gran Turismo 7' },
  { icon: '🏎️', name: 'iRacing' },
];
</script>

<template>
  <section class="py-24 px-8 bg-[var(--bg-panel)] relative z-10">
    <div class="max-w-[1400px] mx-auto">
      <SectionHeader tag="Supported Platforms" title="Race Anywhere" />

      <div class="flex justify-center gap-12 mt-4">
        <PlatformCard
          v-for="platform in platforms"
          :key="platform.name"
          :icon="platform.icon"
          :name="platform.name"
        />
      </div>
    </div>
  </section>
</template>
