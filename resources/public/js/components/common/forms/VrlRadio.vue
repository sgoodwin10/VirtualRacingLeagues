<script setup lang="ts">
import { computed, useAttrs } from 'vue';

// Allow flexible value types for radio groups
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RadioValue = any;

interface Props {
  modelValue: RadioValue;
  value: RadioValue;
  name: string;
  label?: string;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: RadioValue): void;
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();
const attrs = useAttrs();

const radioId = computed<string>(() => {
  return (attrs.id as string) || `vrl-radio-${Math.random().toString(36).substring(2, 9)}`;
});

const isChecked = computed(() => {
  return props.modelValue === props.value;
});

const handleChange = () => {
  if (!props.disabled) {
    emit('update:modelValue', props.value);
  }
};
</script>

<template>
  <label
    :for="radioId"
    class="flex items-center gap-3 cursor-pointer group"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  >
    <!-- Hidden native radio for accessibility -->
    <input
      :id="radioId"
      type="radio"
      :name="name"
      :value="value"
      :checked="isChecked"
      :disabled="disabled"
      class="vrl-radio"
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
/* Custom radio styling */
.vrl-radio {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 1.25rem; /* 20px */
  height: 1.25rem; /* 20px */
  border: 2px solid var(--border-primary);
  border-radius: 50%;
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
}

.vrl-radio:hover:not(:disabled) {
  border-color: var(--accent-gold);
}

.vrl-radio:focus {
  outline: none;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.12);
}

.vrl-radio:checked {
  border-color: var(--accent-gold);
}

/* Inner circle when selected */
.vrl-radio:checked::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--accent-gold);
}

.vrl-radio:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
