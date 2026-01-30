<script setup lang="ts">
import { computed } from 'vue';
import { PhCaretDown } from '@phosphor-icons/vue';

interface VrlAccordionHeaderProps {
  /** Whether item is active/expanded */
  active: boolean;

  /** Whether header is disabled */
  disabled?: boolean;

  /** Custom CSS class */
  class?: string;
}

interface VrlAccordionHeaderEmits {
  (event: 'click', e: MouseEvent): void;
}

const props = withDefaults(defineProps<VrlAccordionHeaderProps>(), {
  disabled: false,
});

const emit = defineEmits<VrlAccordionHeaderEmits>();

const handleClick = (e: MouseEvent) => {
  if (!props.disabled) {
    emit('click', e);
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (props.disabled) return;

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    // Simulate click event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    emit('click', clickEvent);
  }
};

// Build dynamic classes
const headerClasses = computed(() => [
  'flex items-center justify-between px-5 py-4 cursor-pointer transition-colors duration-300 select-none',
  !props.disabled && 'hover:bg-[var(--bg-elevated)]',
  'focus-visible:outline-2 focus-visible:outline-[var(--cyan)] focus-visible:-outline-offset-2',
  props.class,
]);

const toggleClasses = computed(() => [
  'text-[var(--text-muted)] text-xs transition-all duration-300',
  props.active && 'rotate-180 text-[var(--cyan)]',
]);
</script>

<template>
  <div
    :class="headerClasses"
    role="button"
    :aria-expanded="active"
    :aria-disabled="disabled"
    :tabindex="disabled ? -1 : 0"
    data-test="vrl-accordion-header"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <div
      class="flex-1 font-display text-[0.85rem] font-semibold text-[var(--text-primary)] tracking-[0.3px]"
    >
      <slot name="title" />
    </div>

    <div class="flex items-center gap-2">
      <slot name="icon" :active="active">
        <span :class="toggleClasses" data-test="vrl-accordion-toggle">
          <PhCaretDown :size="14" weight="bold" />
        </span>
      </slot>
    </div>
  </div>
</template>
