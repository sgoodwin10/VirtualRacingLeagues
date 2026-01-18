<script setup lang="ts">
import { computed } from 'vue';

/**
 * VrlCheckbox Component
 *
 * Custom styled checkbox with label and full accessibility support.
 *
 * Features:
 * - Custom visual design with checkmark
 * - Full keyboard navigation (Space/Enter to toggle)
 * - Accessible with hidden native input
 * - Focus visible indicators
 * - Disabled state support
 * - Support for checkbox groups via value prop
 *
 * @example
 * Basic usage:
 * <VrlCheckbox v-model="agreed" label="I agree to the terms" />
 *
 * @example
 * In a checkbox group:
 * <VrlCheckbox v-model="selectedOptions" label="Option 1" value="option1" />
 */

interface Props {
  /** The current checked state (or array of values for checkbox groups) */
  modelValue: boolean | (string | number)[];
  /** Label text to display */
  label: string;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** HTML id attribute */
  id?: string;
  /** HTML name attribute */
  name?: string;
  /** Value for checkbox groups */
  value?: string | number;
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  id: undefined,
  name: undefined,
  value: undefined,
  class: '',
});

interface Emits {
  /** Emitted when the checkbox state changes */
  (e: 'update:modelValue', value: boolean | (string | number)[]): void;
  /** Emitted when the checkbox is toggled */
  (e: 'change', value: boolean | (string | number)[]): void;
}

const emit = defineEmits<Emits>();

/**
 * Compute whether this checkbox is currently checked
 */
const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.value !== undefined && props.modelValue.includes(props.value);
  }
  return props.modelValue;
});

/**
 * Handle checkbox change event
 */
function handleChange(event: Event): void {
  if (props.disabled) return;

  const target = event.target as HTMLInputElement;

  let newValue: boolean | (string | number)[];

  if (Array.isArray(props.modelValue)) {
    // Checkbox group logic
    if (props.value === undefined) {
      console.warn('VrlCheckbox: value prop is required when modelValue is an array');
      return;
    }

    if (target.checked) {
      newValue = [...props.modelValue, props.value];
    } else {
      newValue = props.modelValue.filter((v) => v !== props.value);
    }
  } else {
    // Single checkbox logic
    newValue = target.checked;
  }

  emit('update:modelValue', newValue);
  emit('change', newValue);
}

/**
 * Handle keyboard interaction (Space/Enter to toggle)
 */
function handleKeydown(event: KeyboardEvent): void {
  if (props.disabled) return;

  // Space or Enter key to toggle
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    const checkbox = event.target as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    // Create a proper Event object instead of casting
    const changeEvent = new Event('change', { bubbles: true });
    Object.defineProperty(changeEvent, 'target', {
      value: checkbox,
      writable: false,
    });
    handleChange(changeEvent);
  }
}

/**
 * Generate a unique ID if not provided
 */
const checkboxId = computed(() => {
  return props.id || `checkbox-${Math.random().toString(36).substring(2, 11)}`;
});

/**
 * Compute wrapper classes with disabled state
 */
const wrapperClasses = computed(() => {
  const baseClasses = 'flex items-center gap-3 cursor-pointer';
  const disabledClass = props.disabled ? 'opacity-50 cursor-not-allowed' : '';
  const classes = `${baseClasses} ${disabledClass}`;
  return props.class ? `${classes} ${props.class}` : classes;
});

/**
 * Compute checkbox visual classes
 */
const checkboxClasses = computed(() => {
  const baseClasses =
    'w-[18px] h-[18px] border-2 rounded-[var(--radius-sm)] bg-[var(--bg-dark)] flex items-center justify-center transition-[var(--transition)] shrink-0';
  const stateClass = isChecked.value
    ? 'bg-[var(--cyan)] border-[var(--cyan)]'
    : 'border-[var(--border)]';
  return `${baseClasses} ${stateClass}`;
});
</script>

<template>
  <label :for="checkboxId" :class="wrapperClasses">
    <input
      :id="checkboxId"
      type="checkbox"
      :name="name"
      :checked="isChecked"
      :disabled="disabled"
      :value="value"
      class="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      @change="handleChange"
      @keydown="handleKeydown"
    />
    <span :class="checkboxClasses" :aria-hidden="true">
      <span
        v-if="isChecked"
        class="text-[var(--bg-dark)] text-xs font-bold leading-none select-none"
        >✓</span
      >
    </span>
    <span class="text-[0.9rem] text-[var(--text-primary)] select-none">{{ label }}</span>
  </label>
</template>

<style scoped>
/* Focus visible indicator for keyboard navigation */
label:has(input:focus-visible) span:first-of-type {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}
</style>
