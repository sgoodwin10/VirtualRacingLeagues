<script setup lang="ts">
import PrimeToggleSwitch from 'primevue/toggleswitch';
import { computed } from 'vue';

interface Props {
  modelValue?: boolean;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
});

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const emit = defineEmits<Emits>();

/**
 * Design tokens for ToggleSwitch component
 * Defines custom colors for ON (green) and OFF (red) states
 */
const toggleTokens = computed(() => ({
  root: {
    background: '#ef4444', // OFF - red-500
    hoverBackground: '#dc2626', // OFF hover - red-600
    checkedBackground: '#22c55e', // ON - green-500
    checkedHoverBackground: '#16a34a', // ON hover - green-600
    disabledBackground: '#fca5a5', // OFF disabled - red-300
    checkedDisabledBackground: '#86efac', // ON disabled - green-300
  },
  handle: {
    background: '#ffffff', // White handle for both states
    checkedBackground: '#ffffff',
  },
}));

function handleUpdate(value: boolean): void {
  emit('update:modelValue', value);
}
</script>

<template>
  <PrimeToggleSwitch
    :model-value="modelValue"
    :disabled="disabled"
    :dt="toggleTokens"
    @update:model-value="handleUpdate"
  >
    <!-- Pass through the handle slot for custom check/times icons -->
    <template #handle="slotProps">
      <slot name="handle" :checked="slotProps.checked" />
    </template>
  </PrimeToggleSwitch>
</template>

<style scoped>
/**
 * No custom CSS needed - all styling is handled via PrimeVue design tokens
 * Passed through the :dt prop to maintain separation of concerns
 */
</style>
