<script setup lang="ts">
import { RouterLink } from 'vue-router';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';

/**
 * CtaSection Component
 *
 * Final call-to-action section encouraging users to sign up.
 */
</script>

<template>
  <section class="py-32 px-8 text-center relative z-10">
    <div class="max-w-[800px] mx-auto">
      <h2 class="font-[var(--font-display)] text-5xl font-extrabold mb-6 tracking-[2px]">
        READY TO START RACING?
      </h2>
      <p class="text-[1.2rem] text-[var(--text-secondary)] mb-8">
        Join hundreds of league managers already using Virtual Racing Leagues.
      </p>
      <RouterLink to="/register">
        <VrlButton variant="primary" size="xl">Create Your League Now</VrlButton>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
/* Responsive adjustments */
@media (max-width: 768px) {
  h2 {
    font-size: 2rem;
  }
}
</style>
