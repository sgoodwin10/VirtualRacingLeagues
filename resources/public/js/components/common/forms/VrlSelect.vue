<script setup lang="ts">
import { computed, useAttrs, getCurrentInstance } from 'vue';
import VrlLabel from '@public/components/common/typography/VrlLabel.vue';

type SelectSize = 'sm' | 'md' | 'lg';
type SelectValue = string | number | boolean;

interface SelectOption {
  label: string;
  value: SelectValue;
}

interface Props {
  modelValue: SelectValue | null;
  options: SelectOption[];
  size?: SelectSize;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: SelectValue | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  placeholder: '',
  disabled: false,
  invalid: false,
  errorMessage: '',
  label: '',
  required: false,
});

const emit = defineEmits<Emits>();
const attrs = useAttrs();
const instance = getCurrentInstance();

const selectId = computed<string>(() => {
  return (attrs.id as string) || `vrl-select-${instance?.uid}`;
});

const errorId = computed<string>(() => `${selectId.value}-error`);

const selectClasses = computed(() => {
  const baseClasses = [
    'w-full',
    'font-body',
    'transition-all',
    'border',
    'outline-none',
    'appearance-none',
    'cursor-pointer',
  ];

  // Background and text colors (CSS variables)
  baseClasses.push('theme-bg-input', 'theme-text-primary');

  // Size-specific classes
  const sizeClasses: Record<SelectSize, string[]> = {
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
  }

  return baseClasses;
});

const selectStyles = computed(() => {
  const styles: Record<string, string> = {};

  // Custom dropdown arrow using SVG background
  const arrowSize = props.size === 'sm' ? '12' : props.size === 'lg' ? '14' : '12';
  const arrowPosition = props.size === 'sm' ? '10px' : props.size === 'lg' ? '14px' : '12px';

  styles.backgroundImage = `url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22${arrowSize}%22 height=%22${arrowSize}%22 viewBox=%220 0 24 24%22%3E%3Cpath fill=%22%239ca3af%22 d=%22M7 10l5 5 5-5z%22/%3E%3C/svg%3E')`;
  styles.backgroundRepeat = 'no-repeat';
  styles.backgroundPosition = `right ${arrowPosition} center`;

  if (props.invalid) {
    styles.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.12)';
  }

  return styles;
});

const handleChange = (event: Event): void => {
  // eslint-disable-next-line no-undef
  const target = event.target as HTMLSelectElement;

  // For empty value (placeholder), emit null
  if (target.value === '') {
    emit('update:modelValue', null);
    return;
  }

  // Find the option with matching value
  // Since HTML select values are always strings, we need to compare by string representation
  const selectedOption = props.options.find((opt) => String(opt.value) === target.value);

  if (selectedOption) {
    emit('update:modelValue', selectedOption.value);
  }
};
</script>

<template>
  <div class="vrl-select-wrapper">
    <!-- Label -->
    <VrlLabel v-if="label" :for="selectId" :required="required">
      {{ label }}
    </VrlLabel>

    <!-- Select -->
    <select
      :id="selectId"
      :value="modelValue"
      :disabled="disabled"
      :aria-invalid="invalid"
      :aria-describedby="invalid && errorMessage ? errorId : undefined"
      :class="selectClasses"
      :style="selectStyles"
      @change="handleChange"
    >
      <!-- Placeholder option -->
      <option v-if="placeholder" value="" disabled :selected="!modelValue">
        {{ placeholder }}
      </option>

      <!-- Options -->
      <option v-for="option in options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>

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
select:focus {
  border-color: var(--accent-gold);
  box-shadow:
    0 0 0 3px rgba(212, 168, 83, 0.12),
    0 0 0 1px var(--accent-gold);
}

/* Preserve error state box-shadow on focus */
select[aria-invalid='true']:focus {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}
</style>
