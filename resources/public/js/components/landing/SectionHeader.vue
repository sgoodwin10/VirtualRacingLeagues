<script setup lang="ts">
/**
 * SectionHeader Component
 *
 * Reusable section header with tag, title, and optional subtitle.
 * Used consistently across all landing page sections.
 */

interface SectionHeaderProps {
  /** Section tag/label (e.g., "Features", "Pricing") */
  tag: string;
  /** Section title */
  title: string;
  /** Optional section subtitle */
  subtitle?: string;
}

defineProps<SectionHeaderProps>();
</script>

<template>
  <div class="text-center mb-16">
    <div
      class="font-[var(--font-display)] text-[0.8rem] font-semibold text-[var(--cyan)] tracking-[3px] uppercase mb-4"
    >
      {{ tag }}
    </div>
    <h2
      class="font-[var(--font-display)] text-[2.5rem] font-bold tracking-[1px] mb-4"
      :class="{ 'mb-6': subtitle }"
    >
      {{ title }}
    </h2>
    <p v-if="subtitle" class="text-[1.1rem] text-[var(--text-secondary)] max-w-[600px] mx-auto">
      {{ subtitle }}
    </p>
  </div>
</template>
