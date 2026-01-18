<script setup lang="ts">
/**
 * StepCard Component
 *
 * Single step card with number badge and connector line.
 * Used in the "How It Works" section.
 */

interface StepCardProps {
  /** Step number (1-5) */
  number: number;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Whether this is the last step (hides connector) */
  isLast?: boolean;
}

withDefaults(defineProps<StepCardProps>(), {
  isLast: false,
});
</script>

<template>
  <div
    class="flex-1 relative p-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] text-center"
  >
    <!-- Connector Line (hidden on last step and mobile) -->
    <div
      v-if="!isLast"
      class="hidden lg:block absolute top-1/2 right-[-1rem] w-8 h-0.5 bg-[var(--cyan)]"
      aria-hidden="true"
    />

    <!-- Step Number Badge -->
    <div
      class="absolute top-[-1rem] left-1/2 -translate-x-1/2 w-8 h-8 bg-[var(--cyan)] text-[var(--bg-dark)] rounded-full flex items-center justify-center font-[var(--font-display)] font-bold text-[0.9rem]"
    >
      {{ number }}
    </div>

    <h3 class="font-[var(--font-display)] text-base font-semibold mt-4 mb-2 tracking-[0.5px]">
      {{ title }}
    </h3>
    <p class="text-[var(--text-secondary)] text-[0.85rem]">{{ description }}</p>
  </div>
</template>
