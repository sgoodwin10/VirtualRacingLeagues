<script setup lang="ts">
import { computed } from 'vue';

/**
 * VrlToggle Component
 *
 * Toggle switch for boolean settings with full accessibility support.
 *
 * Features:
 * - Toggle switch with sliding knob animation
 * - Full keyboard navigation (Space/Enter to toggle)
 * - Accessible with hidden native input and role="switch"
 * - Focus visible indicators
 * - Disabled state support
 * - Green when active
 *
 * @example
 * Basic usage:
 * <VrlToggle v-model="emailNotifications" label="Email Notifications" />
 *
 * @example
 * With change handler:
 * <VrlToggle v-model="darkMode" label="Dark Mode" @change="handleThemeChange" />
 */

interface Props {
  /** The current toggle state */
  modelValue: boolean;
  /** Label text to display */
  label: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** HTML id attribute */
  id?: string;
  /** HTML name attribute */
  name?: string;
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  id: undefined,
  name: undefined,
  class: '',
});

interface Emits {
  /** Emitted when the toggle state changes */
  (e: 'update:modelValue', value: boolean): void;
  /** Emitted when the toggle is switched */
  (e: 'change', value: boolean): void;
}

const emit = defineEmits<Emits>();

/**
 * Handle toggle change event
 */
function handleChange(event: Event): void {
  if (props.disabled) return;

  const target = event.target as HTMLInputElement;
  const newValue = target.checked;

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
const toggleId = computed(() => {
  return props.id || `toggle-${Math.random().toString(36).substring(2, 11)}`;
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
 * Compute toggle switch classes
 */
const toggleClasses = computed(() => {
  const baseClasses =
    'w-11 h-6 rounded-[var(--radius-pill)] relative cursor-pointer transition-[var(--transition)] shrink-0';
  const stateClass = props.modelValue ? 'bg-[var(--green-dim)]' : 'bg-[var(--bg-elevated)]';
  return `${baseClasses} ${stateClass}`;
});

/**
 * Compute toggle knob classes
 */
const knobClasses = computed(() => {
  const baseClasses = 'absolute top-0.5 w-5 h-5 rounded-full transition-[var(--transition)]';
  const positionClass = props.modelValue ? 'left-[22px]' : 'left-0.5';
  const colorClass = props.modelValue ? 'bg-[var(--green)]' : 'bg-[var(--text-muted)]';
  return `${baseClasses} ${positionClass} ${colorClass}`;
});
</script>

<template>
  <label :for="toggleId" :class="wrapperClasses">
    <input
      :id="toggleId"
      type="checkbox"
      :name="name"
      :checked="modelValue"
      :disabled="disabled"
      class="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      role="switch"
      :aria-checked="modelValue"
      @change="handleChange"
      @keydown="handleKeydown"
    />
    <span :class="toggleClasses" :aria-hidden="true">
      <span :class="knobClasses"></span>
    </span>
    <span class="text-[0.9rem] text-[var(--text-primary)] select-none">{{ label }}</span>
  </label>
</template>

<style scoped>
/* Focus visible indicator for keyboard navigation */
label:has(input:focus-visible) span:first-of-type {
  outline: 2px solid var(--green);
  outline-offset: 2px;
}
</style>
