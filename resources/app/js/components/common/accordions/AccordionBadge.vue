<script setup lang="ts">
import { computed } from 'vue';
import type { AccordionBadgeSeverity } from './types';
import { BADGE_SEVERITY_MAP } from './types';

interface Props {
  text: string;
  severity?: AccordionBadgeSeverity;
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'muted',
});

const colors = computed(() => BADGE_SEVERITY_MAP[props.severity]);
</script>

<template>
  <div
    class="accordion-badge"
    :style="{
      backgroundColor: colors.bg,
      color: colors.text,
      borderColor: colors.border,
    }"
  >
    {{ text }}
  </div>
</template>

<style scoped>
.accordion-badge {
  font-family: var(--accordion-font-mono);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: all 0.2s ease;
}
</style>
