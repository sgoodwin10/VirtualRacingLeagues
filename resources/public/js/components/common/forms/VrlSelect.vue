<script setup lang="ts">
import { computed } from 'vue';

interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface Props {
  modelValue: string | number | null;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string | string[];
  id?: string;
  name?: string;
  required?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: undefined,
  disabled: false,
  error: undefined,
  id: undefined,
  name: undefined,
  required: false,
  class: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null];
  change: [event: Event];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const hasError = computed(() => {
  if (!props.error) return false;
  if (Array.isArray(props.error)) return props.error.length > 0;
  return props.error.length > 0;
});

const selectClass = computed(() => {
  const baseClasses =
    "w-full px-4 pr-10 py-3 bg-[var(--bg-dark)] border rounded-[var(--radius)] text-[var(--text-primary)] font-body text-[0.9rem] cursor-pointer appearance-none transition-[var(--transition)] bg-[url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20fill='%238b949e'%20viewBox='0%200%2016%2016'%3E%3Cpath%20d='M4.646%205.646a.5.5%200%200%201%20.708%200L8%208.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_1rem_center]";
  const borderClass = hasError.value ? 'border-[var(--red)]' : 'border-[var(--border)]';
  const focusClass = hasError.value
    ? 'focus:outline-none focus:border-[var(--red)] focus:shadow-[0_0_0_3px_var(--red-dim)]'
    : 'focus:outline-none focus:border-[var(--cyan)] focus:shadow-[0_0_0_3px_var(--cyan-dim)]';
  const disabledClass = props.disabled
    ? 'opacity-50 cursor-not-allowed bg-[var(--bg-elevated)]'
    : '';

  const classes = `${baseClasses} ${borderClass} ${focusClass} ${disabledClass}`;
  return props.class ? `${classes} ${props.class}` : classes;
});

const handleChange = (event: Event) => {
  const target = event.target as { value: string } | null;
  if (!target) return;
  const value = target.value === '' ? null : target.value;
  emit('update:modelValue', value);
  emit('change', event);
};

const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};
</script>

<template>
  <select
    :id="props.id"
    :name="props.name"
    :value="props.modelValue ?? ''"
    :disabled="props.disabled"
    :required="props.required"
    :class="selectClass"
    :aria-invalid="hasError ? 'true' : undefined"
    :aria-required="props.required ? 'true' : undefined"
    :aria-describedby="hasError && props.id ? `${props.id}-error` : undefined"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
  >
    <option v-if="props.placeholder" value="" disabled>
      {{ props.placeholder }}
    </option>
    <option
      v-for="option in props.options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>
