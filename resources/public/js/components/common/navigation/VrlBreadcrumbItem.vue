<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';

/**
 * Props for individual breadcrumb item (internal sub-component)
 */
interface Props {
  /** Regular link href (for external or non-router links) */
  href?: string;

  /** Vue Router route location */
  to?: RouteLocationRaw;

  /** Whether this is the active/current item */
  active?: boolean;
}

defineProps<Props>();
</script>

<template>
  <!-- Regular anchor link (href) -->
  <a
    v-if="href && !active"
    :href="href"
    class="text-[var(--text-secondary)] no-underline transition-[var(--transition)] hover:text-[var(--cyan)]"
    data-test="breadcrumb-link"
  >
    <slot />
  </a>

  <!-- Vue Router link (to) -->
  <RouterLink
    v-else-if="to && !active"
    :to="to"
    class="text-[var(--text-secondary)] no-underline transition-[var(--transition)] hover:text-[var(--cyan)]"
    data-test="breadcrumb-router-link"
  >
    <slot />
  </RouterLink>

  <!-- Active/current item (non-clickable) -->
  <span v-else class="text-[var(--text-primary)] pointer-events-none" data-test="breadcrumb-active">
    <slot />
  </span>
</template>
