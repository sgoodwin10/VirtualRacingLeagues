<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';
import AccordionPanel from 'primevue/accordionpanel';

interface Props {
  value: string | number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const activeValue = inject<Ref<string | string[] | undefined>>('accordion-value', {
  value: undefined,
} as Ref<string | string[] | undefined>);

const isActive = computed(() => {
  if (!activeValue.value) return false;
  if (Array.isArray(activeValue.value)) {
    return activeValue.value.includes(String(props.value));
  }
  return activeValue.value === String(props.value);
});

const passthroughOptions = computed(() => ({
  root: {
    class: ['technical-accordion-panel', { 'is-active': isActive.value }],
  },
}));
</script>

<template>
  <AccordionPanel :value="value" :disabled="disabled" :pt="passthroughOptions">
    <slot />
  </AccordionPanel>
</template>

<style scoped>
.technical-accordion-panel {
  border: 1px solid var(--accordion-border);
  border-radius: var(--accordion-radius);
  background-color: var(--accordion-bg);
  overflow: hidden;
  transition: all 0.2s ease;
}

.technical-accordion-panel:hover:not(.is-active) {
  transform: translateX(4px);
  border-color: var(--accordion-accent-cyan);
}

.technical-accordion-panel.is-active {
  border-color: var(--accordion-border-active);
  background-color: var(--accordion-bg-elevated);
}

.technical-accordion-panel:focus-within {
  outline: 1px solid var(--accordion-accent-cyan);
  /* outline-offset: 2px; */
}
</style>
