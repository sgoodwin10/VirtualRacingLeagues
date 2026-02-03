<script setup lang="ts">
import { computed } from 'vue';
import { PhCaretDown } from '@phosphor-icons/vue';

interface VrlPanelHeaderProps {
  /** Whether panel is expanded */
  expanded: boolean;

  /** Whether header is clickable/interactive */
  clickable?: boolean;

  /** Custom CSS class */
  class?: string;
}

interface VrlPanelHeaderEmits {
  /** Emitted when header is clicked (if clickable) */
  (event: 'click', e: MouseEvent): void;
  /** Keyboard event handler */
  (event: 'keydown', e: KeyboardEvent): void;
}

const props = withDefaults(defineProps<VrlPanelHeaderProps>(), {
  clickable: false,
  class: undefined,
});

const emit = defineEmits<VrlPanelHeaderEmits>();

const handleClick = (e: MouseEvent) => {
  if (props.clickable) {
    emit('click', e);
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  emit('keydown', e);
};

// Build dynamic classes
const headerClasses = computed(() => [
  'flex items-center justify-between px-5 py-4 bg-[var(--bg-panel)] border-b border-[var(--border)] transition-colors duration-300',
  props.clickable && 'cursor-pointer hover:bg-[var(--bg-elevated)]',
  props.class,
]);

const toggleClasses = computed(() => [
  'text-[var(--text-muted)] transition-transform duration-300 select-none',
  props.expanded && 'rotate-180',
]);
</script>

<template>
  <div
    v-bind="$attrs"
    :class="headerClasses"
    data-test="vrl-panel-header"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <div class="font-display text-[0.9rem] font-semibold tracking-wide text-[var(--text-primary)]">
      <slot name="title" />
    </div>

    <div class="flex items-center gap-2">
      <slot name="actions" />
      <span v-if="clickable" :class="toggleClasses" data-test="vrl-panel-toggle">
        <PhCaretDown :size="16" weight="bold" />
      </span>
    </div>
  </div>
</template>
