<script setup lang="ts">
import { computed } from 'vue';
import AccordionContent from 'primevue/accordioncontent';
import type { AccordionPadding } from './types';
import { PADDING_MAP } from './types';

interface Props {
  elevated?: boolean;
  padding?: AccordionPadding | string;
}

const props = withDefaults(defineProps<Props>(), {
  elevated: false,
  padding: 'md',
});

const paddingValue = computed(() => {
  // If it's a predefined padding key, use the map
  if (props.padding in PADDING_MAP) {
    return PADDING_MAP[props.padding as AccordionPadding];
  }
  // Otherwise, treat it as a custom padding value
  return props.padding;
});

const passthroughOptions = computed(() => ({
  root: {
    class: 'technical-accordion-content',
  },
}));
</script>

<template>
  <AccordionContent :pt="passthroughOptions">
    <div v-if="elevated" class="content-elevated" :style="{ padding: paddingValue }">
      <slot />
    </div>
    <div v-else class="content-wrapper" :style="{ padding: paddingValue }">
      <slot />
    </div>
  </AccordionContent>
</template>

<style scoped>
.technical-accordion-content {
  border-top: 1px solid var(--accordion-border);
}

.content-wrapper {
  color: var(--accordion-text-secondary);
  font-family: var(--accordion-font-sans);
  font-size: 13px;
  line-height: 1.6;
}

.content-elevated {
  background-color: var(--accordion-bg-elevated);
  border-radius: 4px;
  margin: 12px;
  color: var(--accordion-text-secondary);
  font-family: var(--accordion-font-sans);
  font-size: 13px;
  line-height: 1.6;
}
</style>
