<script setup lang="ts">
import type { Component } from 'vue';

interface BaseBadgeProps {
  /**
   * Color variant
   * @default 'default'
   */
  variant?: 'default' | 'cyan' | 'green' | 'orange' | 'red' | 'purple';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Transform text to uppercase
   * @default false
   */
  uppercase?: boolean;

  /**
   * Optional icon (Phosphor icon component)
   */
  icon?: Component;
}

withDefaults(defineProps<BaseBadgeProps>(), {
  variant: 'default',
  size: 'md',
  uppercase: false,
  icon: undefined,
});
</script>

<template>
  <span
    :class="[
      'base-badge',
      `base-badge--${variant}`,
      `base-badge--${size}`,
      { 'base-badge--uppercase': uppercase },
    ]"
  >
    <slot name="icon">
      <component :is="icon" v-if="icon" class="base-badge__icon" />
    </slot>
    <slot />
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
}

/* Sizes */
.base-badge--sm {
  gap: 4px;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 3px;
}

.base-badge--md {
  gap: 6px;
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 4px;
}

.base-badge--lg {
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
}

/* Variants */
.base-badge--default {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.base-badge--cyan {
  background: var(--cyan-dim);
  color: var(--cyan);
}

.base-badge--green {
  background: var(--green-dim);
  color: var(--green);
}

.base-badge--orange {
  background: var(--orange-dim);
  color: var(--orange);
}

.base-badge--red {
  background: var(--red-dim);
  color: var(--red);
}

.base-badge--purple {
  background: var(--purple-dim);
  color: var(--purple);
}

/* Modifiers */
.base-badge--uppercase {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Icon */
.base-badge__icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}
</style>
