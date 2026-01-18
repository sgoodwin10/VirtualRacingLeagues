<script setup lang="ts">
import { ref, computed } from 'vue';
import VrlTab from './VrlTab.vue';
import type { TabItem, TabVariant } from '@public/types/navigation';

/**
 * Props for the Tabs component
 */
interface Props {
  /** Currently active tab key (v-model) */
  modelValue: string;

  /** Array of tab definitions */
  tabs: TabItem[];

  /** Visual style variant */
  variant?: TabVariant;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
});

/**
 * Emits
 */
interface Emits {
  /** v-model update */
  (e: 'update:modelValue', key: string): void;

  /** Tab changed event */
  (e: 'change', key: string): void;
}

const emit = defineEmits<Emits>();

/**
 * Currently focused tab index (for keyboard navigation)
 */
const focusedIndex = ref(0);

/**
 * Get enabled tabs only
 */
const _enabledTabs = computed(() => {
  return props.tabs.filter((tab) => !tab.disabled);
});

/**
 * Handle tab click
 */
const handleTabClick = (key: string) => {
  emit('update:modelValue', key);
  emit('change', key);
};

/**
 * Handle keyboard navigation
 */
const handleKeyDown = (event: KeyboardEvent, currentIndex: number) => {
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();
      // Move to previous enabled tab
      do {
        newIndex = (newIndex - 1 + props.tabs.length) % props.tabs.length;
      } while (props.tabs[newIndex].disabled);
      focusedIndex.value = newIndex;
      break;

    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault();
      // Move to next enabled tab
      do {
        newIndex = (newIndex + 1) % props.tabs.length;
      } while (props.tabs[newIndex].disabled);
      focusedIndex.value = newIndex;
      break;

    case 'Home':
      event.preventDefault();
      // Move to first enabled tab
      newIndex = props.tabs.findIndex((tab) => !tab.disabled);
      if (newIndex !== -1) {
        focusedIndex.value = newIndex;
      }
      break;

    case 'End':
      event.preventDefault();
      // Move to last enabled tab
      for (let i = props.tabs.length - 1; i >= 0; i--) {
        if (!props.tabs[i].disabled) {
          focusedIndex.value = i;
          break;
        }
      }
      break;

    case 'Enter':
    case ' ':
      event.preventDefault();
      if (!props.tabs[currentIndex].disabled) {
        handleTabClick(props.tabs[currentIndex].key);
      }
      break;
  }
};

/**
 * Get tabindex for roving tabindex pattern
 */
const getTabIndex = (index: number, tab: TabItem): number => {
  if (tab.disabled) return -1;
  return index === focusedIndex.value ? 0 : -1;
};

/**
 * Get computed classes for tabs container
 */
const tabsClasses = computed(() => {
  const classes = [
    'flex',
    'gap-2',
    'rounded-[var(--radius)]',
    'max-sm:overflow-x-auto',
    'max-sm:[-webkit-overflow-scrolling:touch]',
    'max-sm:[&::-webkit-scrollbar]:hidden',
  ];

  if (props.variant === 'default') {
    classes.push('bg-[var(--bg-elevated)]', 'p-2');
  } else if (props.variant === 'minimal') {
    classes.push('bg-transparent', 'p-0');
  }

  return classes.join(' ');
});
</script>

<template>
  <div
    :class="tabsClasses"
    role="tablist"
    :aria-label="$attrs['aria-label'] || 'Tabs'"
    data-test="tabs"
  >
    <VrlTab
      v-for="(tab, index) in tabs"
      :id="`tab-${tab.key}`"
      :key="tab.key"
      :active="tab.key === modelValue"
      :disabled="tab.disabled"
      :icon="tab.icon"
      :tabindex="getTabIndex(index, tab)"
      role="tab"
      :aria-selected="tab.key === modelValue"
      :aria-disabled="tab.disabled"
      @click="handleTabClick(tab.key)"
      @keydown="(e: KeyboardEvent) => handleKeyDown(e, index)"
    >
      <!-- Custom tab-label slot or default label -->
      <slot name="tab-label" :tab="tab">
        {{ tab.label }}
        <span
          v-if="tab.badge"
          class="inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 text-[0.65rem] font-semibold rounded-[var(--radius-pill)] bg-[var(--bg-dark)] text-[var(--cyan)] ml-1"
          data-test="tab-badge"
        >
          {{ tab.badge }}
        </span>
      </slot>
    </VrlTab>
  </div>
</template>
