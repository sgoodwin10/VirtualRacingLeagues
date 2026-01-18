<script setup lang="ts">
import { computed } from 'vue';
import VrlCharacterCount from './VrlCharacterCount.vue';

interface Props {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: string | string[];
  id?: string;
  name?: string;
  rows?: number;
  maxlength?: number;
  minlength?: number;
  required?: boolean;
  showCharacterCount?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  readonly: false,
  error: undefined,
  id: undefined,
  name: undefined,
  rows: 4,
  maxlength: undefined,
  minlength: undefined,
  required: false,
  showCharacterCount: false,
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

const textareaClass = computed(() => {
  const baseClasses =
    'w-full px-4 py-3 bg-[var(--bg-dark)] border rounded-[var(--radius)] text-[var(--text-primary)] font-body text-[0.9rem] resize-y min-h-[120px] transition-[var(--transition)] placeholder:text-[var(--text-muted)]';
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

const showCharCount = computed(() => {
  return props.showCharacterCount && props.maxlength !== undefined;
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
  <div>
    <textarea
      :id="props.id"
      :name="props.name"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :required="props.required"
      :maxlength="props.maxlength"
      :minlength="props.minlength"
      :rows="props.rows"
      :class="textareaClass"
      :aria-invalid="hasError ? 'true' : undefined"
      :aria-required="props.required ? 'true' : undefined"
      :aria-describedby="hasError && props.id ? `${props.id}-error` : undefined"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <VrlCharacterCount
      v-if="showCharCount"
      :current="props.modelValue.length"
      :max="props.maxlength!"
    />
  </div>
</template>
