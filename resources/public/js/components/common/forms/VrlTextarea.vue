<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import VrlLabel from '@public/components/common/typography/VrlLabel.vue';

interface Props {
  modelValue: string;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  invalid?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
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

const textareaId = computed<string>(() => {
  return (attrs.id as string) || `vrl-textarea-${Math.random().toString(36).substring(2, 9)}`;
});

const errorId = computed<string>(() => `${textareaId.value}-error`);

const textareaClasses = computed(() => {
  const baseClasses = [
    'w-full',
    'px-4',
    'py-3',
    'text-sm',
    'font-body',
    'transition-all',
    'resize-y',
    'border',
    'outline-none',
  ];

  // Background and text colors (CSS variables)
  baseClasses.push('theme-bg-input', 'theme-text-primary');

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

const textareaStyles = computed(() => {
  const styles: Record<string, string> = {};

  if (props.invalid) {
    styles.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.12)';
  }

  return styles;
});

const handleInput = (event: Event) => {
  // eslint-disable-next-line no-undef
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="vrl-textarea-wrapper">
    <!-- Label -->
    <VrlLabel v-if="label" :for="textareaId" :required="required">
      {{ label }}
    </VrlLabel>

    <!-- Textarea -->
    <textarea
      :id="textareaId"
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="invalid"
      :aria-describedby="invalid && errorMessage ? errorId : undefined"
      :class="textareaClasses"
      :style="textareaStyles"
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
textarea:focus {
  border-color: var(--accent-gold);
  box-shadow:
    0 0 0 3px rgba(212, 168, 83, 0.12),
    0 0 0 1px var(--accent-gold);
}

/* Preserve error state box-shadow on focus */
textarea[aria-invalid='true']:focus {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

/* Placeholder color */
textarea::placeholder {
  color: var(--text-dim);
}
</style>
