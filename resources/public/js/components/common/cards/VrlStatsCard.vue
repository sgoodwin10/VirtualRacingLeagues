<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  icon?: string;
  label: string;
  value: string | number;
  highlighted?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  highlighted: false,
  class: '',
});

const valueClasses = computed(() => {
  return props.highlighted ? 'text-racing-gold' : '';
});
</script>

<template>
  <div
    :class="[
      'gradient-border',
      'card-racing',
      'rounded',
      'p-4',
      'sm:p-5',
      'text-center',
      'transition-all',
      props.class,
    ]"
    style="background: var(--bg-secondary)"
  >
    <div class="flex items-center justify-center gap-3 sm:gap-4">
      <div
        class="w-10 h-10 sm:w-12 sm:h-12 bg-racing-gold/10 rounded flex items-center justify-center"
      >
        <slot name="icon">
          <span class="text-lg sm:text-xl text-racing-gold">{{ icon }}</span>
        </slot>
      </div>
      <div class="text-left">
        <div
          :class="['font-display', 'text-2xl', 'sm:text-3xl', 'leading-none', valueClasses]"
          style="color: var(--text-primary)"
        >
          {{ value }}
        </div>
        <div
          class="font-data text-[9px] uppercase tracking-wider mt-1"
          style="color: var(--text-dim)"
        >
          {{ label }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-racing {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
}

/* Gradient border effect */
.gradient-border {
  position: relative;
  background: var(--bg-secondary);
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--card-hover-border), transparent 50%);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.text-racing-gold {
  color: var(--racing-gold);
}
</style>
