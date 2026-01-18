<script setup lang="ts">
import { computed, ref } from 'vue';
import VrlPanelHeader from './VrlPanelHeader.vue';
import VrlPanelContent from './VrlPanelContent.vue';

interface VrlPanelProps {
  /** Panel title displayed in header */
  title?: string;

  /** Whether panel can be collapsed/expanded */
  collapsible?: boolean;

  /** Initial expanded state (uncontrolled mode) */
  defaultExpanded?: boolean;

  /** Controlled expanded state (use with v-model:expanded) */
  expanded?: boolean;

  /** Custom CSS class for root element */
  class?: string;

  /** Custom CSS class for header */
  headerClass?: string;

  /** Custom CSS class for content wrapper */
  contentClass?: string;
}

interface VrlPanelEmits {
  /** Emitted when panel is toggled */
  (event: 'toggle', expanded: boolean): void;

  /** For v-model:expanded support */
  (event: 'update:expanded', expanded: boolean): void;
}

const props = withDefaults(defineProps<VrlPanelProps>(), {
  defaultExpanded: true,
  collapsible: false,
});

const emit = defineEmits<VrlPanelEmits>();

// Internal state (uncontrolled mode)
const isExpanded = ref<boolean>(props.defaultExpanded);

// Computed for controlled/uncontrolled mode
const expandedState = computed({
  get: () => (props.expanded !== undefined ? props.expanded : isExpanded.value),
  set: (value: boolean) => {
    isExpanded.value = value;
    emit('update:expanded', value);
    emit('toggle', value);
  },
});

// Toggle function exposed to slots
const toggle = () => {
  if (props.collapsible) {
    expandedState.value = !expandedState.value;
  }
};

// Handle keyboard events
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.collapsible) return;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggle();
  }
};

// Generate unique ID for accessibility
const panelId = `panel-${Math.random().toString(36).substr(2, 9)}`;
const contentId = `${panelId}-content`;

// Build dynamic classes
const panelClasses = computed(() => [
  'bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden transition-all duration-300',
  props.collapsible && 'hover:border-[var(--cyan)]',
  props.class,
]);
</script>

<template>
  <div :class="panelClasses" data-test="vrl-panel">
    <VrlPanelHeader
      :expanded="expandedState"
      :clickable="collapsible"
      :class="headerClass"
      :role="collapsible ? 'button' : undefined"
      :aria-expanded="collapsible ? expandedState : undefined"
      :aria-controls="collapsible ? contentId : undefined"
      :tabindex="collapsible ? 0 : undefined"
      @click="toggle"
      @keydown="handleKeyDown"
    >
      <template #title>
        <slot name="header" :expanded="expandedState" :toggle="toggle">
          {{ title }}
        </slot>
      </template>
      <template #actions>
        <slot name="actions" />
      </template>
    </VrlPanelHeader>

    <VrlPanelContent :id="contentId" :show="expandedState" :class="contentClass">
      <slot />
    </VrlPanelContent>
  </div>
</template>
