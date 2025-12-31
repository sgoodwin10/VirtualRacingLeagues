<script setup lang="ts">
/**
 * TagIndicator - A small inline tag/label component for displaying metadata
 *
 * @example
 * <TagIndicator variant="cyan">NEW</TagIndicator>
 * <TagIndicator variant="success" size="xs">ACTIVE</TagIndicator>
 * <TagIndicator variant="warning">BETA</TagIndicator>
 */

export interface TagIndicatorProps {
  /** Color variant of the tag */
  variant?: 'default' | 'cyan' | 'warning' | 'success' | 'danger';
  /** Size variant of the tag */
  size?: 'xs' | 'sm';
}

withDefaults(defineProps<TagIndicatorProps>(), {
  variant: 'cyan',
  size: 'sm',
});
</script>

<template>
  <span :class="['tag-indicator', `tag-indicator--${variant}`, `tag-indicator--${size}`]">
    <slot />
  </span>
</template>

<style scoped>
.tag-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  border-radius: 3px;
}

/* Size variants */
.tag-indicator--xs {
  padding: 1px 4px;
  font-size: 9px;
}

.tag-indicator--sm {
  padding: 2px 6px;
  font-size: 10px;
}

/* Color variants */
.tag-indicator--default {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.tag-indicator--cyan {
  background: var(--cyan-dim);
  color: var(--cyan);
}

.tag-indicator--warning {
  background: var(--orange-dim);
  color: var(--orange);
}

.tag-indicator--success {
  background: var(--green-dim);
  color: var(--green);
}

.tag-indicator--danger {
  background: var(--red-dim);
  color: var(--red);
}
</style>
