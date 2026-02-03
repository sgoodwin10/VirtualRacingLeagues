<script setup lang="ts">
import { RouterLink } from 'vue-router';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';

/**
 * PricingCard Component
 *
 * Free pricing card with features list and CTA button.
 * Features gradient overlay and green accent styling.
 */

const features = [
  'Unlimited leagues',
  'Unlimited competitions & seasons',
  'Unlimited drivers',
  'All platform support',
  'CSV import/export',
  'Public shareable links',
  'Custom point systems',
  'Team & division management',
];

/**
 * Track Google Analytics event when CTA button is clicked
 */
const handleGetStartedClick = () => {
  const buttonText = 'Get Started Free';

  // Track event via Google Tag Manager dataLayer
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'register_go_to_page_click',
      button_text: buttonText,
    });
  }

  // Also support direct gtag() if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'register_go_to_page_click', {
      button_text: buttonText,
    });
  }
};
</script>

<template>
  <div
    class="max-w-[500px] mx-auto bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] border-2 border-[var(--green)] rounded-[20px] p-12 text-center relative overflow-hidden"
  >
    <!-- Gradient Overlay -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-[var(--green-dim)] to-transparent pointer-events-none"
      aria-hidden="true"
    />

    <!-- Content (relative to overlay) -->
    <div class="relative z-[1]">
      <span
        class="inline-block px-6 py-2 bg-[var(--green)] text-[var(--bg-dark)] font-[var(--font-display)] text-[0.8rem] font-bold tracking-[2px] rounded-[var(--radius-pill)] mb-6"
      >
        ALL FEATURES INCLUDED
      </span>

      <div
        class="font-[var(--font-display)] text-[5rem] font-black text-[var(--green)] leading-none mb-2"
      >
        $0
      </div>

      <div class="text-[var(--text-secondary)] text-base mb-8">Free, no credit card required</div>

      <ul class="list-none text-left mb-8 hidden">
        <li
          v-for="feature in features"
          :key="feature"
          class="flex items-center gap-3 py-3 border-b border-[var(--border)] text-[var(--text-secondary)] last:border-b-0 before:content-['✓'] before:text-[var(--green)] before:font-bold"
        >
          {{ feature }}
        </li>
      </ul>

      <RouterLink to="/register" class="block">
        <VrlButton variant="primary" size="lg" class="w-full" @click="handleGetStartedClick">
          Get Started Free
        </VrlButton>
      </RouterLink>
    </div>
  </div>
</template>
