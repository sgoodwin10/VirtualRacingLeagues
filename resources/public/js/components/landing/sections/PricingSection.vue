<script setup lang="ts">
import SectionHeader from '../SectionHeader.vue';
import PricingCard from '../PricingCard.vue';

/**
 * PricingSection Component
 *
 * Pricing section wrapper displaying the free pricing card.
 */
</script>

<template>
  <section id="pricing" class="py-24 px-8 relative z-10">
    <div class="max-w-[1400px] mx-auto">
      <SectionHeader
        tag="Pricing"
        title="Completely Free"
        subtitle="No hidden fees. No premium tiers. Just racing."
      />

      <PricingCard />
    </div>
  </section>
</template>
