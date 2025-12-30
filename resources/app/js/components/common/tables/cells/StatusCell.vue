<script setup lang="ts">
import { computed } from 'vue';

type StatusType =
  | 'active'
  | 'pending'
  | 'inactive'
  | 'scheduled'
  | 'error'
  | 'failed'
  | 'completed';

interface Props {
  /** Status type */
  status: StatusType;
  /** Custom label (defaults to capitalized status) */
  label?: string;
  /** Show status dot */
  showDot?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  showDot: true,
});

/**
 * Get display label
 */
const displayLabel = computed(() => {
  return props.label || props.status.charAt(0).toUpperCase() + props.status.slice(1);
});

/**
 * Get badge class
 */
const badgeClass = computed(() => {
  return `status-badge ${props.status}`;
});
</script>

<template>
  <span :class="badgeClass">
    <span v-if="showDot" class="dot"></span>
    {{ displayLabel }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
}

.status-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.status-badge.active,
.status-badge.completed {
  background-color: var(--green-dim);
  color: var(--green);
}

.status-badge.pending {
  background-color: var(--orange-dim);
  color: var(--orange);
}

.status-badge.inactive,
.status-badge.scheduled {
  background-color: var(--bg-elevated);
  color: var(--text-muted);
}

.status-badge.error,
.status-badge.failed {
  background-color: var(--red-dim);
  color: var(--red);
}
</style>
