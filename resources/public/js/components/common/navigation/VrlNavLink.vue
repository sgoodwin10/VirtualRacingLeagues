<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';

/**
 * Props for navigation link with animated underline
 */
interface Props {
  /** Regular link href (for external or non-router links) */
  href?: string;

  /** Vue Router route location */
  to?: RouteLocationRaw;

  /** Whether this is the active/current page */
  active?: boolean;

  /** Open in new tab (for href links) */
  external?: boolean;
}

const props = defineProps<Props>();

/**
 * Get target and rel attributes for external links
 */
const linkAttrs = {
  target: props.external ? '_blank' : undefined,
  rel: props.external ? 'noopener noreferrer' : undefined,
};
</script>

<template>
  <!-- Regular anchor link (href) -->
  <a
    v-if="href"
    :href="href"
    class="relative inline-block text-[var(--text-secondary)] no-underline font-medium text-[0.9rem] tracking-[0.5px] transition-colors duration-300 ease-[ease] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--cyan)] focus-visible:outline-offset-2 motion-reduce:transition-none after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:bg-[var(--cyan)] after:transition-[width] after:duration-300 after:ease-[ease] motion-reduce:after:transition-none after:w-0 hover:after:w-full"
    :class="{ 'text-[var(--text-primary)] after:w-full': active }"
    :aria-current="active ? 'page' : undefined"
    data-test="nav-link"
    v-bind="linkAttrs"
  >
    <slot />
  </a>

  <!-- Vue Router link (to) -->
  <RouterLink
    v-else-if="to"
    :to="to"
    class="relative inline-block text-[var(--text-secondary)] no-underline font-medium text-[0.9rem] tracking-[0.5px] transition-colors duration-300 ease-[ease] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--cyan)] focus-visible:outline-offset-2 motion-reduce:transition-none after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:bg-[var(--cyan)] after:transition-[width] after:duration-300 after:ease-[ease] motion-reduce:after:transition-none after:w-0 hover:after:w-full"
    :class="{ 'text-[var(--text-primary)] after:w-full': active }"
    :aria-current="active ? 'page' : undefined"
    data-test="nav-router-link"
  >
    <slot />
  </RouterLink>

  <!-- Fallback (no navigation) -->
  <span
    v-else
    class="relative inline-block text-[var(--text-secondary)] no-underline font-medium text-[0.9rem] tracking-[0.5px] transition-colors duration-300 ease-[ease] motion-reduce:transition-none after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:bg-[var(--cyan)] after:transition-[width] after:duration-300 after:ease-[ease] motion-reduce:after:transition-none after:w-0"
    :class="{ 'text-[var(--text-primary)] after:w-full': active }"
    :aria-current="active ? 'page' : undefined"
    data-test="nav-span"
  >
    <slot />
  </span>
</template>
