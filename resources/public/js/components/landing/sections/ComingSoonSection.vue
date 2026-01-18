<script setup lang="ts">
import SectionHeader from '../SectionHeader.vue';
import ComingSoonItem from '../ComingSoonItem.vue';

/**
 * ComingSoonSection Component
 *
 * 8-item grid of upcoming features.
 * Showcases future platform enhancements.
 */

const comingSoonItems = [
  { icon: '📈', text: 'GT7 Daily Race Stats' },
  { icon: '🛤️', text: 'Track Database' },
  { icon: '🚗', text: 'Car Selection' },
  { icon: '🤖', text: 'AI OCR Reader' },
  { icon: '📊', text: 'Google Sheets Import' },
  { icon: '🎯', text: 'More Platforms' },
  { icon: '📱', text: 'Mobile App' },
  { icon: '🔔', text: 'Discord Integration' },
];
</script>

<template>
  <section class="py-24 px-8 relative z-10">
    <div class="max-w-[1400px] mx-auto">
      <SectionHeader tag="Coming Soon" title="What's Next" />

      <div class="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-2 gap-6 mt-4">
        <ComingSoonItem
          v-for="item in comingSoonItems"
          :key="item.text"
          :icon="item.icon"
          :text="item.text"
        />
      </div>
    </div>
  </section>
</template>
