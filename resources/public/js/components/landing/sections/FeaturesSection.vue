<script setup lang="ts">
import VrlFeatureCard from '@public/components/common/cards/VrlFeatureCard.vue';
import SectionHeader from '../SectionHeader.vue';

/**
 * FeaturesSection Component
 *
 * Displays 6 feature cards in a 3-column grid.
 * Highlights key platform features.
 */

const features = [
  {
    iconText: '🏆',
    title: 'Multiple Competitions & Seasons',
    description:
      'Create multiple competitions and seasons to manage your league across different events and time periods.',
  },
  {
    iconText: '📊',
    title: 'Automatic Standings',
    description:
      'Points calculated automatically with support for custom scoring systems, penalties, and drop rounds.',
  },
  {
    iconText: '👥',
    title: 'Driver Management',
    description:
      'Track driver stats, manage teams, handle divisions, and monitor performance across seasons.',
  },
  {
    iconText: '📤',
    title: 'CSV Import/Export',
    description: 'Bulk import drivers and results. Export standings and data in multiple formats.',
  },
  {
    iconText: '🔗',
    title: 'Shareable Links',
    description:
      'Generate public links for your league. Let everyone view standings without an account.',
  },
  {
    iconText: '🏁',
    title: 'Multi-Platform Support',
    description:
      'Gran Turismo 7, iRacing, and more. Run competitions across multiple platforms seamlessly.',
  },
];
</script>

<template>
  <section id="features" class="py-24 px-8 relative z-10">
    <div class="max-w-[1400px] mx-auto">
      <SectionHeader
        tag="Features"
        title="Everything You Need to Run Your League"
        subtitle="Powerful tools designed specifically for sim racing league managers and organizers."
      />

      <div class="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
        <VrlFeatureCard
          v-for="feature in features"
          :key="feature.title"
          :icon-text="feature.iconText"
          :title="feature.title"
          :description="feature.description"
        />
      </div>
    </div>
  </section>
</template>
