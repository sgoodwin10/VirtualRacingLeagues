<script setup lang="ts">
import { computed } from 'vue';

type StatusType = 'active' | 'pending' | 'inactive' | 'error' | 'success' | 'warning';
type SizeType = 'sm' | 'md';

interface Props {
  status?: StatusType;
  showDot?: boolean;
  label?: string;
  size?: SizeType;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'inactive',
  showDot: true,
  label: undefined,
  size: 'md',
});

const STATUS_MAP = {
  active: { color: 'green', label: 'Active' },
  success: { color: 'green', label: 'Success' },
  pending: { color: 'orange', label: 'Pending' },
  warning: { color: 'orange', label: 'Warning' },
  inactive: { color: 'default', label: 'Inactive' },
  error: { color: 'red', label: 'Error' },
} as const;

const statusConfig = computed(() => STATUS_MAP[props.status]);

const displayLabel = computed(() => props.label ?? statusConfig.value.label);

const containerClasses = computed(() => {
  const classes = ['status-indicator'];

  // Size classes
  classes.push(`status-indicator--${props.size}`);

  // Color classes
  classes.push(`status-indicator--${statusConfig.value.color}`);

  return classes;
});
</script>

<template>
  <span :class="containerClasses">
    <span v-if="showDot" class="status-indicator__dot" />
    <span class="status-indicator__label">{{ displayLabel }}</span>
  </span>
</template>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-weight: 500;
  line-height: 1;
}

/* Size variants */
.status-indicator--sm {
  padding: 2px 6px;
  font-size: 10px;
}

.status-indicator--md {
  padding: 4px 10px;
  font-size: 11px;
}

/* Dot sizing */
.status-indicator__dot {
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator--sm .status-indicator__dot {
  width: 5px;
  height: 5px;
}

.status-indicator--md .status-indicator__dot {
  width: 6px;
  height: 6px;
}

/* Green color variant (active, success) */
.status-indicator--green {
  background-color: var(--green-dim);
  color: var(--green);
}

.status-indicator--green .status-indicator__dot {
  background-color: var(--green);
}

/* Orange color variant (pending, warning) */
.status-indicator--orange {
  background-color: var(--orange-dim);
  color: var(--orange);
}

.status-indicator--orange .status-indicator__dot {
  background-color: var(--orange);
}

/* Red color variant (error) */
.status-indicator--red {
  background-color: var(--red-dim);
  color: var(--red);
}

.status-indicator--red .status-indicator__dot {
  background-color: var(--red);
}

/* Default color variant (inactive) */
.status-indicator--default {
  background-color: var(--bg-elevated);
  color: var(--text-muted);
}

.status-indicator--default .status-indicator__dot {
  background-color: var(--text-muted);
}

/* Label styling */
.status-indicator__label {
  line-height: 1;
}
</style>
