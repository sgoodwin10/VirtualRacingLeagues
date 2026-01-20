<script setup lang="ts">
import { computed, ref } from 'vue';
import { PhEye, PhEyeSlash } from '@phosphor-icons/vue';

interface Props {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string | string[];
  id?: string;
  name?: string;
  autocomplete?: string;
  required?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  error: undefined,
  id: undefined,
  name: undefined,
  autocomplete: undefined,
  required: false,
  class: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
  input: [event: Event];
}>();

const showPassword = ref(false);

const hasError = computed(() => {
  if (!props.error) return false;
  if (Array.isArray(props.error)) return props.error.length > 0;
  return props.error.length > 0;
});

const inputClass = computed(() => {
  const baseClasses =
    'w-full px-4 py-3 pr-12 bg-[var(--bg-dark)] border rounded-[var(--radius)] text-[var(--text-primary)] font-body text-[0.9rem] transition-[var(--transition)] placeholder:text-[var(--text-muted)]';
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

const toggleVisibility = () => {
  if (!props.disabled) {
    showPassword.value = !showPassword.value;
  }
};
</script>

<template>
  <div class="relative">
    <input
      :id="props.id"
      :type="showPassword ? 'text' : 'password'"
      :name="props.name"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :required="props.required"
      :autocomplete="props.autocomplete"
      :class="inputClass"
      :aria-invalid="hasError ? 'true' : undefined"
      :aria-required="props.required ? 'true' : undefined"
      :aria-describedby="hasError && props.id ? `${props.id}-error` : undefined"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      :aria-label="showPassword ? 'Hide password' : 'Show password'"
      :disabled="props.disabled"
      tabindex="-1"
      @click="toggleVisibility"
    >
      <PhEye v-if="!showPassword" :size="20" />
      <PhEyeSlash v-else :size="20" />
    </button>
  </div>
</template>
