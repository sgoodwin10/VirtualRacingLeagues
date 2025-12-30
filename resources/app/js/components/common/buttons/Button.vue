<script setup lang="ts">
import { computed } from 'vue';
import PrimeButton from 'primevue/button';
import type { Component } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'default' | 'lg' | 'xl';
  label?: string | undefined;
  icon?: Component | undefined;
  iconPos?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string | undefined;
  pt?: Record<string, unknown> | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'default',
  iconPos: 'left',
  disabled: false,
  loading: false,
  type: 'button',
});

interface Emits {
  (e: 'click', event: MouseEvent): void;
}

const emit = defineEmits<Emits>();

const primeVueSeverity = computed(() => {
  const severityMap: Record<string, string> = {
    primary: 'primary',
    secondary: 'secondary',
    ghost: 'secondary',
    outline: 'primary',
    danger: 'danger',
    success: 'success',
    warning: 'warn',
  };
  return severityMap[props.variant];
});

const primeVueSize = computed(() => {
  const sizeMap: Record<string, string | undefined> = {
    sm: 'small',
    default: undefined,
    lg: 'large',
    xl: 'large',
  };
  return sizeMap[props.size];
});

const iconSize = computed(() => {
  const sizeMap: Record<string, number> = {
    sm: 14,
    default: 16,
    lg: 18,
    xl: 20,
  };
  return sizeMap[props.size];
});

const isIconOnly = computed(() => !props.label && props.icon);

const buttonClasses = computed(() => [
  'app-button',
  `app-button--${props.variant}`,
  `app-button--${props.size}`,
  {
    'app-button--icon-only': isIconOnly.value,
  },
]);

function handleClick(event: MouseEvent): void {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
}
</script>

<template>
  <PrimeButton
    :label="isIconOnly ? undefined : label"
    :disabled="disabled"
    :loading="loading"
    :type="type"
    :size="primeVueSize"
    :severity="primeVueSeverity"
    :text="variant === 'ghost'"
    :outlined="variant === 'outline'"
    :class="buttonClasses"
    :pt="pt"
    :aria-label="ariaLabel || (isIconOnly ? 'Icon button' : undefined)"
    @click="handleClick"
  >
    <!-- Icon with label: use PrimeVue's icon slot -->
    <template v-if="icon && !isIconOnly" #icon>
      <component :is="icon" :size="iconSize" weight="regular" color="currentColor" />
    </template>

    <!-- Icon-only: render icon as content for full centering control -->
    <span v-if="isIconOnly" class="app-button__icon-wrapper">
      <component :is="icon" :size="iconSize" weight="regular" color="currentColor" />
    </span>

    <slot v-else />
  </PrimeButton>
</template>

<style scoped>
/* Component-level styles are minimal - main styles in buttons.css */
</style>
