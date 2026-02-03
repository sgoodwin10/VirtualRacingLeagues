<script setup lang="ts">
import { computed, inject } from 'vue';
import type { AccordionContext } from './types';
import VrlAccordionHeader from './VrlAccordionHeader.vue';
import VrlAccordionContent from './VrlAccordionContent.vue';

interface VrlAccordionItemProps {
  /** Unique identifier for this item */
  value: string | number;

  /** Item title */
  title?: string;

  /** Whether item is disabled */
  disabled?: boolean;

  /** Custom CSS class */
  class?: string;
}

const props = withDefaults(defineProps<VrlAccordionItemProps>(), {
  title: undefined,
  disabled: false,
  class: undefined,
});

// Inject accordion context
const accordion = inject<AccordionContext>('vrl-accordion');

if (!accordion) {
  throw new Error('VrlAccordionItem must be used within a VrlAccordion component');
}

// Compute active state
const isActive = computed(() => {
  if (!accordion?.activeValue.value) return false;

  if (Array.isArray(accordion.activeValue.value)) {
    return accordion.activeValue.value.includes(String(props.value));
  }

  return accordion.activeValue.value === String(props.value);
});

// Toggle handler
const toggle = () => {
  if (!props.disabled && accordion) {
    accordion.toggleItem(String(props.value));
  }
};

// Generate unique ID for accessibility
const itemId = `accordion-item-${Math.random().toString(36).substr(2, 9)}`;
const contentId = `${itemId}-content`;

// Build dynamic classes
const itemClasses = computed(() => [
  'bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden transition-all duration-200',
  !props.disabled && 'hover:border-[var(--cyan)] hover:shadow-[0_0_0_1px_var(--cyan-dim)]',
  isActive.value && 'bg-[var(--bg-elevated)] ',
  props.disabled && 'opacity-50 cursor-not-allowed',
  props.class,
]);
</script>

<template>
  <div :class="itemClasses" data-test="vrl-accordion-item">
    <VrlAccordionHeader
      :active="isActive"
      :disabled="disabled"
      :aria-controls="contentId"
      @click="toggle"
    >
      <template #title>
        <slot name="header" :active="isActive" :toggle="toggle">
          {{ title }}
        </slot>
      </template>
    </VrlAccordionHeader>

    <VrlAccordionContent :id="contentId" :show="isActive">
      <slot />
    </VrlAccordionContent>
  </div>
</template>
