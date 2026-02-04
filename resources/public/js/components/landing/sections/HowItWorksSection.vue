<script setup lang="ts">
import SectionHeader from '@public/components/landing/SectionHeader.vue';
import StepCard from '@public/components/landing/StepCard.vue';

/**
 * HowItWorksSection Component
 *
 * 5-step process section with connected step cards.
 * Shows users how to get started with the platform.
 */

const steps = [
  {
    number: 1,
    title: 'Create Your League',
    description: 'Sign up and create your league with your custom branding and settings.',
  },
  {
    number: 2,
    title: 'Add Drivers',
    description: 'Import your driver roster via CSV or add them manually.',
  },
  {
    number: 3,
    title: 'Setup Season',
    description: 'Create competitions, seasons, and rounds with your point system.',
  },
  {
    number: 4,
    title: 'Enter Results',
    description: 'Add race results and watch standings update automatically.',
  },
  {
    number: 5,
    title: 'Share',
    description: 'Share your public link for everyone to view the championship.',
  },
];
</script>

<template>
  <section
    id="how-it-works"
    class="py-24 px-8 bg-gradient-to-b from-transparent via-[var(--bg-panel)] to-transparent relative z-10"
  >
    <div class="max-w-[1400px] mx-auto">
      <SectionHeader
        tag="How It Works"
        title="Get Racing in Minutes"
        subtitle="Setting up your league has never been easier. Follow these simple steps."
      />

      <div class="flex lg:flex-row flex-col gap-8 mt-4">
        <StepCard
          v-for="(step, index) in steps"
          :key="step.number"
          :number="step.number"
          :title="step.title"
          :description="step.description"
          :is-last="index === steps.length - 1"
        />
      </div>
    </div>
  </section>
</template>
