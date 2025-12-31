<script setup lang="ts">
import PrimeToggleSwitch from 'primevue/toggleswitch';

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
 * PrimeVue passthrough configuration for custom styling
 * Using passthrough to override the checked background color to green
 */
const passThroughConfig = {
  root: {
    class: 'base-toggle-switch',
  },
};

function handleUpdate(value: boolean): void {
  emit('update:modelValue', value);
}
</script>

<template>
  <PrimeToggleSwitch
    :model-value="modelValue"
    :disabled="disabled"
    :pt="passThroughConfig"
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
 * Custom styles for BaseToggleSwitch
 * Using scoped styles to ensure specificity without affecting other components
 */
:deep(.base-toggle-switch.p-toggleswitch-checked .p-toggleswitch-slider) {
  background-color: #22c55e !important; /* Green-500 */
}

:deep(.base-toggle-switch.p-toggleswitch-checked:hover .p-toggleswitch-slider) {
  background-color: #16a34a !important; /* Green-600 */
}

/**
 * Ensure the toggle switch maintains proper focus styles
 */
:deep(
  .base-toggle-switch.p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:focus-visible)
    .p-toggleswitch-slider
) {
  outline: 0 none;
  outline-offset: 0;
  box-shadow: 0 0 0 0.2rem rgba(34, 197, 94, 0.2); /* Green with opacity */
}
</style>
