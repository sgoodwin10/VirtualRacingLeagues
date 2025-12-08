<script setup lang="ts">
import { computed, useAttrs } from 'vue';

interface Props {
  modelValue: boolean;
  label?: string;
  disabled?: boolean;
  binary?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

withDefaults(defineProps<Props>(), {
  label: '',
  disabled: false,
  binary: true,
});

const emit = defineEmits<Emits>();
const attrs = useAttrs();

const checkboxId = computed<string>(() => {
  return (attrs.id as string) || `vrl-checkbox-${Math.random().toString(36).substring(2, 9)}`;
});

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
};
</script>

<template>
  <label
    :for="checkboxId"
    class="flex items-center gap-3 cursor-pointer group"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  >
    <!-- Hidden native checkbox for accessibility -->
    <input
      :id="checkboxId"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="vrl-checkbox"
      @change="handleChange"
    />

    <!-- Label -->
    <span
      v-if="label"
      class="text-sm transition-colors theme-text-primary group-hover:text-racing-gold"
      :class="{ 'group-hover:text-racing-barrier': disabled }"
    >
      {{ label }}
    </span>
  </label>
</template>

<style scoped>
/* Custom checkbox styling */
.vrl-checkbox {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 1.25rem; /* 20px */
  height: 1.25rem; /* 20px */
  border: 2px solid var(--border-primary);
  border-radius: 0.25rem; /* Not fully rounded */
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
}

.vrl-checkbox:hover:not(:disabled) {
  border-color: var(--accent-gold);
}

.vrl-checkbox:focus {
  outline: none;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.12);
}

.vrl-checkbox:checked {
  background-color: var(--accent-gold);
  border-color: var(--accent-gold);
}

/* Checkmark */
.vrl-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 5px;
  height: 10px;
  border: solid var(--bg-primary);
  border-width: 0 2px 2px 0;
}

.vrl-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
