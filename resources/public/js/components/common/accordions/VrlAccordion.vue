<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue';
import type { AccordionContext, AccordionGap } from './types';

interface VrlAccordionProps {
  /** Currently active item value(s) */
  modelValue?: string | string[];

  /** Allow multiple items to be open simultaneously */
  multiple?: boolean;

  /** Gap between accordion items */
  gap?: AccordionGap;

  /** Custom CSS class */
  class?: string;
}

interface VrlAccordionEmits {
  /** For v-model support */
  (event: 'update:modelValue', value: string | string[] | undefined): void;
}

const props = withDefaults(defineProps<VrlAccordionProps>(), {
  multiple: false,
  gap: 'md',
});

const emit = defineEmits<VrlAccordionEmits>();

// Internal state for active items
const activeValue = ref<string | string[] | undefined>(props.modelValue);

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    activeValue.value = newValue;
  },
);

// Toggle function for accordion items
const toggleItem = (value: string) => {
  if (props.multiple) {
    // Multiple mode: toggle item in array
    const current = Array.isArray(activeValue.value) ? activeValue.value : [];
    const index = current.indexOf(value);

    if (index > -1) {
      activeValue.value = current.filter((v) => v !== value);
    } else {
      activeValue.value = [...current, value];
    }
  } else {
    // Single mode: toggle or set active
    activeValue.value = activeValue.value === value ? undefined : value;
  }

  emit('update:modelValue', activeValue.value);
};

// Provide context to child AccordionItem components
provide<AccordionContext>('vrl-accordion', {
  activeValue,
  multiple: props.multiple ?? false,
  toggleItem,
});

// Compute gap class using Tailwind
const gapClass = computed(() => {
  const gapMap: Record<AccordionGap, string> = {
    none: 'gap-0',
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-4',
  };
  return gapMap[props.gap];
});
</script>

<template>
  <div :class="['flex flex-col w-full', gapClass, props.class]" data-test="vrl-accordion">
    <slot />
  </div>
</template>
