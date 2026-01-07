<script setup lang="ts">
import type { InfoBoxProps } from './types';

const props = withDefaults(defineProps<InfoBoxProps>(), {
  variant: 'info',
});
</script>

<template>
  <div
    :class="[
      'info-box',
      `info-box--${variant}`,
      'bg-card border border-[var(--border)] rounded-r-[var(--radius)] px-5 py-4',
      props.class,
    ]"
    role="note"
    :aria-label="title"
  >
    <!-- Title -->
    <slot name="title">
      <div
        :class="[
          'info-box-title',
          `info-box-title--${variant}`,
          'font-mono text-xs font-semibold tracking-wide mb-2',
        ]"
      >
        {{ title }}
      </div>
    </slot>

    <!-- Message -->
    <slot>
      <p v-if="message" class="text-md text-[var(--text-secondary)] leading-relaxed">
        {{ message }}
      </p>
    </slot>
  </div>
</template>

<style scoped>
/* Left border accent by variant */
.info-box--info {
  border-left: 3px solid var(--cyan);
}
.info-box--success {
  border-left: 3px solid var(--green);
}
.info-box--warning {
  border-left: 3px solid var(--orange);
}
.info-box--danger {
  border-left: 3px solid var(--red);
}

/* Title color by variant */
.info-box-title--info {
  color: var(--cyan);
}
.info-box-title--success {
  color: var(--green);
}
.info-box-title--warning {
  color: var(--orange);
}
.info-box-title--danger {
  color: var(--red);
}
</style>
