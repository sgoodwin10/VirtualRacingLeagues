<script setup lang="ts">
import { computed } from 'vue';
import { PhArrowUp, PhArrowDown } from '@phosphor-icons/vue';
import type { MetricCardProps } from './types';

const props = withDefaults(defineProps<MetricCardProps>(), {
  variant: 'default',
  changeDirection: 'neutral',
});

/**
 * Determine which icon to show for change direction
 */
const changeIcon = computed(() => {
  if (props.changeDirection === 'positive') return PhArrowUp;
  if (props.changeDirection === 'negative') return PhArrowDown;
  return null;
});

/**
 * Format the value for display
 */
const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString();
  }
  return props.value;
});
</script>

<template>
  <div
    :class="[
      'metric-card',
      `metric-card--${variant}`,
      'bg-card border border-[var(--border)] rounded-[var(--radius)] p-4 relative',
      props.class,
    ]"
    role="region"
    :aria-label="`${label}: ${formattedValue}`"
  >
    <!-- Full Content Slot: Replaces everything except accent bar -->
    <slot name="full-content">
      <!-- Header: Label + Icon -->
      <div class="flex items-center justify-between mb-2">
        <!-- Label -->
        <slot name="label">
          <span
            class="font-mono text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)]"
          >
            {{ label }}
          </span>
        </slot>

        <!-- Icon -->
        <slot name="icon">
          <div
            v-if="icon"
            :class="[
              'w-7 h-7 rounded-[var(--radius)] flex items-center justify-center',
              `metric-icon--${variant}`,
            ]"
            aria-hidden="true"
          >
            <component :is="icon" :size="14" weight="regular" />
          </div>
        </slot>
      </div>

      <!-- Half Content Slot: Replaces value + change -->
      <slot name="half-content">
        <!-- Value -->
        <slot name="value">
          <div class="font-mono text-[28px] font-semibold text-[var(--text-primary)] leading-none">
            {{ formattedValue }}
          </div>
        </slot>

        <!-- Change Indicator -->
        <slot name="change">
          <div
            v-if="change"
            :class="[
              'flex items-center gap-1 mt-1.5 font-mono text-xs',
              `metric-change--${changeDirection}`,
            ]"
          >
            <component
              :is="changeIcon"
              v-if="changeIcon"
              :size="12"
              weight="regular"
              aria-hidden="true"
            />
            {{ change }}
          </div>
        </slot>
      </slot>
    </slot>
  </div>
</template>

<style scoped>
/* Top accent bar - requires pseudo-element */
.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: var(--radius) var(--radius) 0 0;
}

/* Variant-specific accent colors */
.metric-card--default::before {
  background: var(--cyan);
}
.metric-card--green::before {
  background: var(--green);
}
.metric-card--orange::before {
  background: var(--orange);
}
.metric-card--purple::before {
  background: var(--purple);
}
.metric-card--red::before {
  background: var(--red);
}

/* Icon background and color by variant */
.metric-icon--default {
  background: var(--cyan-dim);
  color: var(--cyan);
}
.metric-icon--green {
  background: var(--green-dim);
  color: var(--green);
}
.metric-icon--orange {
  background: var(--orange-dim);
  color: var(--orange);
}
.metric-icon--purple {
  background: var(--purple-dim);
  color: var(--purple);
}
.metric-icon--red {
  background: var(--red-dim);
  color: var(--red);
}

/* Change indicator colors by direction */
.metric-change--positive {
  color: var(--green);
}
.metric-change--negative {
  color: var(--red);
}
.metric-change--neutral {
  color: var(--text-muted);
}
</style>
