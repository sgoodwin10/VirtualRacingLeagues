<script setup lang="ts">
/**
 * VrlInput - Text input component with label, validation, and error messaging
 *
 * @component
 * @example
 * ```vue
 * <VrlInput
 *   v-model="email"
 *   type="email"
 *   label="Email Address"
 *   placeholder="Enter your email"
 *   :required="true"
 * />
 *
 * <VrlInput
 *   v-model="name"
 *   size="lg"
 *   :invalid="errors.name"
 *   error-message="Name is required"
 * />
 * ```
 */
import { computed, useAttrs, getCurrentInstance } from 'vue';
import VrlLabel from '@public/components/common/typography/VrlLabel.vue';

type InputSize = 'sm' | 'md' | 'lg';
type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

/**
 * Component props interface
 */
interface Props {
  /**
   * Input value (v-model)
   * For number type: null represents empty input
   */
  modelValue: string | number | null;

  /**
   * HTML input type
   * @default 'text'
   */
  type?: InputType;

  /**
   * Input field size
   * - sm: 32px height
   * - md: 40px height (default)
   * - lg: 48px height
   * @default 'md'
   */
  size?: InputSize;

  /**
   * Placeholder text
   * @default ''
   */
  placeholder?: string;

  /**
   * Disable input interaction
   * @default false
   */
  disabled?: boolean;

  /**
   * Make input read-only
   * @default false
   */
  readonly?: boolean;

  /**
   * Show invalid/error state
   * @default false
   */
  invalid?: boolean;

  /**
   * Error message to display below input
   * @default ''
   */
  errorMessage?: string;

  /**
   * Label text above input
   * @default ''
   */
  label?: string;

  /**
   * Show required indicator (*)
   * @default false
   */
  required?: boolean;
}

interface Emits {
  /**
   * Emitted when input value changes
   * For text types: emits string
   * For number type: emits number or null (when empty)
   */
  (e: 'update:modelValue', value: string | number | null): void;
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
const instance = getCurrentInstance();

const inputId = computed<string>(() => {
  return (attrs.id as string) || `vrl-input-${instance?.uid}`;
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

const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement;

  if (props.type === 'number') {
    // For number inputs, emit null for empty values
    if (target.value === '') {
      emit('update:modelValue', null);
      return;
    }

    // Parse the number value
    const numValue = Number(target.value);

    // If parsing results in NaN (invalid number), don't emit
    // This prevents the v-model from being updated with invalid data
    // The input will show the invalid text but the model stays unchanged
    if (isNaN(numValue)) {
      return;
    }

    // Valid number - emit it
    emit('update:modelValue', numValue);
  } else {
    // For all other input types, emit the string value
    emit('update:modelValue', target.value);
  }
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
