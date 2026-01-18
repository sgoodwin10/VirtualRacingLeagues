<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'number' | 'search';
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: string | string[];
  id?: string;
  name?: string;
  autocomplete?: string;
  required?: boolean;
  maxlength?: number;
  minlength?: number;
  pattern?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  error: undefined,
  id: undefined,
  name: undefined,
  autocomplete: undefined,
  required: false,
  maxlength: undefined,
  minlength: undefined,
  pattern: undefined,
  class: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
  input: [event: Event];
}>();

const hasError = computed(() => {
  if (!props.error) return false;
  if (Array.isArray(props.error)) return props.error.length > 0;
  return props.error.length > 0;
});

const inputClass = computed(() => {
  const baseClasses =
    'w-full px-4 py-3 bg-[var(--bg-dark)] border rounded-[var(--radius)] text-[var(--text-primary)] font-body text-[0.9rem] transition-[var(--transition)] placeholder:text-[var(--text-muted)]';
  const borderClass = hasError.value ? 'border-[var(--red)]' : 'border-[var(--border)]';
  const focusClass = hasError.value
    ? 'focus:outline-none focus:border-[var(--red)] focus:shadow-[0_0_0_3px_var(--red-dim)]'
    : 'focus:outline-none focus:border-[var(--cyan)] focus:shadow-[0_0_0_3px_var(--cyan-dim)]';
  const disabledClass = props.disabled
    ? 'opacity-50 cursor-not-allowed bg-[var(--bg-elevated)]'
    : '';
  const readonlyClass = props.readonly ? 'opacity-70 cursor-default' : '';

  const classes = `${baseClasses} ${borderClass} ${focusClass} ${disabledClass} ${readonlyClass}`;
  return props.class ? `${classes} ${props.class}` : classes;
});

const handleInput = (event: Event) => {
  const target = event.target as { value: string } | null;
  if (!target) return;
  emit('update:modelValue', target.value);
  emit('input', event);
};

const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};
</script>

<template>
  <input
    :id="props.id"
    :type="props.type"
    :name="props.name"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :required="props.required"
    :maxlength="props.maxlength"
    :minlength="props.minlength"
    :pattern="props.pattern"
    :autocomplete="props.autocomplete"
    :class="inputClass"
    :aria-invalid="hasError ? 'true' : undefined"
    :aria-required="props.required ? 'true' : undefined"
    :aria-describedby="hasError && props.id ? `${props.id}-error` : undefined"
    @input="handleInput"
    @blur="handleBlur"
    @focus="handleFocus"
  />
</template>
