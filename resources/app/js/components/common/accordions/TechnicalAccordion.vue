<script setup lang="ts">
import { computed } from 'vue';
import Accordion from 'primevue/accordion';
import type { AccordionGap } from './types';
import { GAP_MAP } from './types';

interface Props {
  modelValue?: string | string[];
  multiple?: boolean;
  gap?: AccordionGap;
  nested?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  multiple: false,
  gap: 'md',
  nested: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | undefined | null];
}>();

const gapValue = computed(() => GAP_MAP[props.gap]);

const passthroughOptions = computed(() => ({
  root: {
    class: 'technical-accordion',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: gapValue.value,
    },
  },
}));
</script>

<template>
  <Accordion
    :value="modelValue"
    :multiple="multiple"
    :pt="passthroughOptions"
    @update:value="emit('update:modelValue', $event)"
  >
    <slot />
  </Accordion>
</template>

<style scoped>
.technical-accordion {
  width: 100%;
}
</style>
