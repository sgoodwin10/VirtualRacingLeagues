<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span';
  variant?: 'hero' | 'section' | 'card' | 'default';
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  level: 2,
  variant: 'default',
});

const component = computed(() => {
  return props.as || `h${props.level}`;
});

const variantClasses = computed(() => {
  const base = 'font-display uppercase tracking-wide leading-tight';

  const variants = {
    hero: 'text-3xl sm:text-4xl lg:text-5xl',
    section: 'text-2xl sm:text-3xl',
    card: 'text-base sm:text-lg',
    default: {
      1: 'text-4xl sm:text-5xl',
      2: 'text-3xl sm:text-4xl',
      3: 'text-2xl sm:text-3xl',
      4: 'text-xl sm:text-2xl',
      5: 'text-lg sm:text-xl',
      6: 'text-base sm:text-lg',
    },
  };

  if (props.variant === 'default') {
    return `${base} ${variants.default[props.level]}`;
  }

  return `${base} ${variants[props.variant]}`;
});

const classes = computed(() => {
  const themeColor = 'theme-text-primary';
  return `${variantClasses.value} ${themeColor} ${props.class || ''}`;
});
</script>

<template>
  <component :is="component" :class="classes">
    <slot />
  </component>
</template>
