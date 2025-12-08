<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import VrlLabel from '@public/components/typography/VrlLabel.vue';

type InputSize = 'sm' | 'md' | 'lg';
type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

interface Props {
  modelValue: string | number;
  type?: InputType;
  size?: InputSize;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  invalid?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  placeholder: '',
  disabled: false,
  readonly: false,
  invalid: false,
  errorMessage: '',
  label: '',
  required: false,
});

const emit = defineEmits<Emits>();
const attrs = useAttrs();

const inputId = computed<string>(() => {
  return (attrs.id as string) || `vrl-input-${Math.random().toString(36).substring(2, 9)}`;
});

const errorId = computed<string>(() => `${inputId.value}-error`);

const inputClasses = computed(() => {
  const baseClasses = ['w-full', 'font-body', 'transition-all', 'border', 'outline-none'];

  // Background and text colors (CSS variables)
  baseClasses.push('theme-bg-input', 'theme-text-primary');

  // Size-specific classes
  const sizeClasses: Record<InputSize, string[]> = {
    sm: ['h-8', 'px-3', 'py-1.5', 'text-xs'],
    md: ['h-10', 'px-4', 'py-2.5', 'text-sm'],
    lg: ['h-12', 'px-5', 'py-3', 'text-base'],
  };

  baseClasses.push(...sizeClasses[props.size]);

  // Border and state classes
  if (props.invalid) {
    baseClasses.push('border-racing-danger/50');
  } else {
    baseClasses.push('theme-border');
  }

  // Disabled state
  if (props.disabled) {
    baseClasses.push('opacity-50', 'cursor-not-allowed');
  } else if (props.readonly) {
    baseClasses.push('cursor-default');
  } else {
    baseClasses.push('cursor-text');
  }

  return baseClasses;
});

const inputStyles = computed(() => {
  const styles: Record<string, string> = {};

  if (props.invalid) {
    styles.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.12)';
  }

  return styles;
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = props.type === 'number' ? Number(target.value) : target.value;
  emit('update:modelValue', value);
};
</script>

<template>
  <div class="vrl-input-wrapper">
    <!-- Label -->
    <VrlLabel v-if="label" :for="inputId" :required="required">
      {{ label }}
    </VrlLabel>

    <!-- Input -->
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="invalid"
      :aria-describedby="invalid && errorMessage ? errorId : undefined"
      :class="inputClasses"
      :style="inputStyles"
      @input="handleInput"
    />

    <!-- Error message -->
    <small
      v-if="invalid && errorMessage"
      :id="errorId"
      class="block mt-2 text-xs text-racing-danger"
    >
      {{ errorMessage }}
    </small>
  </div>
</template>

<style scoped>
/* Focus state with gold border and shadow */
input:focus {
  border-color: var(--accent-gold);
  box-shadow:
    0 0 0 3px rgba(212, 168, 83, 0.12),
    0 0 0 1px var(--accent-gold);
}

/* Preserve error state box-shadow on focus */
input[aria-invalid='true']:focus {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

/* Placeholder color */
input::placeholder {
  color: var(--text-dim);
}
</style>
