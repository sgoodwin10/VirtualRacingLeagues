<script setup lang="ts">
import { computed } from 'vue';
import InputNumber from 'primevue/inputnumber';
import type { InputNumberProps } from 'primevue/inputnumber';

interface Props extends /* @vue-ignore */ Partial<InputNumberProps> {
  modelValue?: number | null;
  min?: number;
  max?: number;
  step?: number;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  useGrouping?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  showButtons?: boolean;
  buttonLayout?: 'stacked' | 'horizontal' | 'vertical';
  incrementButtonIcon?: string;
  decrementButtonIcon?: string;
  inputId?: string;
  fluid?: boolean;
  size?: 'small' | 'large';
  readonly?: boolean;
  allowEmpty?: boolean;
  highlightOnFocus?: boolean;
  prefix?: string;
  suffix?: string;
  currency?: string;
  currencyDisplay?: 'symbol' | 'code' | 'name';
  locale?: string;
  mode?: 'decimal' | 'currency';
  format?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  min: undefined,
  max: undefined,
  step: 1,
  minFractionDigits: 0,
  maxFractionDigits: 0,
  useGrouping: true,
  disabled: false,
  invalid: false,
  placeholder: '',
  showButtons: false,
  buttonLayout: 'stacked',
  incrementButtonIcon: undefined,
  decrementButtonIcon: undefined,
  inputId: undefined,
  fluid: false,
  size: undefined,
  readonly: false,
  allowEmpty: true,
  highlightOnFocus: false,
  prefix: undefined,
  suffix: undefined,
  currency: undefined,
  currencyDisplay: undefined,
  locale: undefined,
  mode: 'decimal',
  format: true,
});

interface Emits {
  (e: 'update:modelValue', value: number | null): void;
  (e: 'input', event: unknown): void;
  (e: 'focus', event: Event): void;
  (e: 'blur', event: unknown): void;
}

const emit = defineEmits<Emits>();

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function handleInput(event: unknown): void {
  emit('input', event);
}

function handleFocus(event: Event): void {
  emit('focus', event);
}

function handleBlur(event: unknown): void {
  emit('blur', event);
}
</script>

<template>
  <div class="styled-input-number">
    <InputNumber
      :id="inputId"
      v-model="localValue"
      :min="min"
      :max="max"
      :step="step"
      :min-fraction-digits="minFractionDigits"
      :max-fraction-digits="maxFractionDigits"
      :use-grouping="useGrouping"
      :disabled="disabled"
      :invalid="invalid"
      :placeholder="placeholder"
      :show-buttons="showButtons"
      :button-layout="buttonLayout"
      :increment-button-icon="incrementButtonIcon"
      :decrement-button-icon="decrementButtonIcon"
      :fluid="fluid"
      :size="size"
      :readonly="readonly"
      :allow-empty="allowEmpty"
      :highlight-on-focus="highlightOnFocus"
      :prefix="prefix"
      :suffix="suffix"
      :currency="currency"
      :currency-display="currencyDisplay"
      :locale="locale"
      :mode="mode"
      :format="format"
      class="w-full"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </div>
</template>

<style scoped>
/* Styled InputNumber Component - Technical Blueprint Design System
 * This component wraps PrimeVue's InputNumber with custom styling for
 * increment/decrement buttons that align with the app's dark theme.
 */

.styled-input-number {
  display: inline-block;
  width: 100%;
}

/* Button Styling - Horizontal Layout */
.styled-input-number :deep(.p-inputnumber-horizontal) .p-inputnumber-button {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  width: 2.5rem;
  transition: all 0.2s ease-in-out;
}

.styled-input-number :deep(.p-inputnumber-horizontal) .p-inputnumber-button:hover:not(:disabled) {
  background-color: var(--bg-highlight);
  border-color: var(--cyan);
  color: var(--cyan);
}

.styled-input-number :deep(.p-inputnumber-horizontal) .p-inputnumber-button:active:not(:disabled) {
  background-color: var(--cyan-dim);
  border-color: var(--cyan);
  color: var(--cyan);
}

.styled-input-number :deep(.p-inputnumber-horizontal) .p-inputnumber-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Decrement Button (Left) */
.styled-input-number :deep(.p-inputnumber-horizontal) .p-inputnumber-button-down {
  border-radius: 6px 0 0 6px;
  border-right: none;
}

/* Increment Button (Right) */
.styled-input-number :deep(.p-inputnumber-horizontal) .p-inputnumber-button-up {
  border-radius: 0 6px 6px 0;
  border-left: none;
}

/* Input Field - When used with horizontal buttons */
.styled-input-number :deep(.p-inputnumber-horizontal) .p-inputnumber-input {
  border-radius: 0;
  text-align: center;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}

/* Button Styling - Stacked Layout (Vertical buttons on right) */
.styled-input-number :deep(.p-inputnumber-stacked) .p-inputnumber-button {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  height: 50%;
  transition: all 0.2s ease-in-out;
}

.styled-input-number :deep(.p-inputnumber-stacked) .p-inputnumber-button:hover:not(:disabled) {
  background-color: var(--bg-highlight);
  border-color: var(--cyan);
  color: var(--cyan);
}

.styled-input-number :deep(.p-inputnumber-stacked) .p-inputnumber-button:active:not(:disabled) {
  background-color: var(--cyan-dim);
  border-color: var(--cyan);
  color: var(--cyan);
}

.styled-input-number :deep(.p-inputnumber-stacked) .p-inputnumber-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Increment Button (Top) */
.styled-input-number :deep(.p-inputnumber-stacked) .p-inputnumber-button-up {
  border-radius: 0 6px 0 0;
  border-bottom: none;
}

/* Decrement Button (Bottom) */
.styled-input-number :deep(.p-inputnumber-stacked) .p-inputnumber-button-down {
  border-radius: 0 0 6px 0;
  border-top: none;
}

/* Input Field - When used with stacked buttons */
.styled-input-number :deep(.p-inputnumber-stacked) .p-inputnumber-input {
  border-radius: 6px 0 0 6px;
}

/* Button Styling - Vertical Layout */
.styled-input-number :deep(.p-inputnumber-vertical) .p-inputnumber-button {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  width: 100%;
  transition: all 0.2s ease-in-out;
}

.styled-input-number :deep(.p-inputnumber-vertical) .p-inputnumber-button:hover:not(:disabled) {
  background-color: var(--bg-highlight);
  border-color: var(--cyan);
  color: var(--cyan);
}

.styled-input-number :deep(.p-inputnumber-vertical) .p-inputnumber-button:active:not(:disabled) {
  background-color: var(--cyan-dim);
  border-color: var(--cyan);
  color: var(--cyan);
}

.styled-input-number :deep(.p-inputnumber-vertical) .p-inputnumber-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Increment Button (Top) */
.styled-input-number :deep(.p-inputnumber-vertical) .p-inputnumber-button-up {
  border-radius: 6px 6px 0 0;
  border-bottom: none;
}

/* Decrement Button (Bottom) */
.styled-input-number :deep(.p-inputnumber-vertical) .p-inputnumber-button-down {
  border-radius: 0 0 6px 6px;
  border-top: none;
}

/* Input Field - When used with vertical buttons */
.styled-input-number :deep(.p-inputnumber-vertical) .p-inputnumber-input {
  border-radius: 0;
  text-align: center;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

/* Button Icons */
.styled-input-number :deep(.p-inputnumber-button) .p-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: currentColor;
}

/* Focus State Enhancement */
.styled-input-number :deep(.p-inputnumber):focus-within .p-inputnumber-button {
  border-color: var(--cyan);
}

/* No Buttons - Standard InputNumber */
.styled-input-number :deep(.p-inputnumber-input) {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
}
</style>
