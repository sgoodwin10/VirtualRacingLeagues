<script setup lang="ts">
interface Props {
  modelValue?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  label?: string;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  id: undefined,
  name: undefined,
  label: undefined,
  ariaLabel: undefined,
});

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', value: boolean): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'blur', event: FocusEvent): void;
}

const emit = defineEmits<Emits>();

function handleClick(): void {
  if (!props.disabled) {
    const newValue = !props.modelValue;
    emit('update:modelValue', newValue);
    emit('change', newValue);
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    handleClick();
  }
}

function handleFocus(event: FocusEvent): void {
  emit('focus', event);
}

function handleBlur(event: FocusEvent): void {
  emit('blur', event);
}
</script>

<template>
  <div
    class="inline-flex items-center gap-2"
    :class="{ 'cursor-pointer': !disabled, 'opacity-60 cursor-not-allowed': disabled }"
    @click="handleClick"
  >
    <div
      :id="id"
      role="checkbox"
      :aria-checked="modelValue"
      :aria-label="ariaLabel || label"
      :aria-disabled="disabled"
      :tabindex="disabled ? -1 : 0"
      class="w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 transition-all duration-150 focus:outline-none focus:ring-0"
      :class="{
        'bg-[var(--cyan)] border-[var(--cyan)]': modelValue,
        'border-[var(--border)]': !modelValue,
      }"
      data-testid="checkbox-box"
      @keydown="handleKeydown"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        class="transition-opacity duration-150"
        :class="modelValue ? 'opacity-100' : 'opacity-0'"
        style="color: var(--bg-dark)"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <label
      v-if="label"
      :for="id"
      class="select-none"
      :class="{ 'cursor-pointer': !disabled, 'cursor-not-allowed': disabled }"
    >
      {{ label }}
    </label>
    <slot />
  </div>
</template>

<style scoped>
/**
 * No additional custom CSS needed - all styling is handled via Tailwind utilities
 * and CSS variables from the design system
 */
</style>
