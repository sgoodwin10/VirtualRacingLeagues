<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';

type ToggleSize = 'sm' | 'md' | 'lg';

interface Props {
  modelValue: boolean;
  size?: ToggleSize;
  disabled?: boolean;
  label?: string;
  description?: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  disabled: false,
  label: '',
  description: '',
});

const emit = defineEmits<Emits>();

// Generate unique ID using component instance uid
const instance = getCurrentInstance();
const descriptionId = computed(
  () => `toggle-description-${instance?.uid || Math.random().toString(36).substring(2, 9)}`,
);

const toggleClasses = computed(() => {
  const baseClasses = ['relative', 'border-2', 'transition-all', 'duration-300', 'flex-shrink-0'];

  // Size-specific classes
  const sizeClasses: Record<ToggleSize, string[]> = {
    sm: ['w-9', 'h-5', 'rounded-[10px]'],
    md: ['w-11', 'h-6', 'rounded-[12px]'],
    lg: ['w-[52px]', 'h-7', 'rounded-[14px]'],
  };

  baseClasses.push(...sizeClasses[props.size]);

  // State classes
  if (props.disabled) {
    baseClasses.push('opacity-50', 'cursor-not-allowed');
  } else {
    baseClasses.push('cursor-pointer');
  }

  // Active/inactive background
  if (props.modelValue) {
    baseClasses.push('bg-racing-gold', 'border-racing-gold');
  } else {
    baseClasses.push('theme-bg-tertiary', 'theme-border');
  }

  return baseClasses;
});

const indicatorClasses = computed(() => {
  const baseClasses = ['absolute', 'rounded-full', 'transition-all', 'duration-300', 'top-0.5'];

  // Size-specific classes
  const sizeClasses: Record<ToggleSize, string[]> = {
    sm: ['w-3', 'h-3', 'left-0.5'],
    md: ['w-4', 'h-4', 'left-0.5'],
    lg: ['w-5', 'h-5', 'left-0.5'],
  };

  baseClasses.push(...sizeClasses[props.size]);

  // Active/inactive indicator color and position
  if (props.modelValue) {
    baseClasses.push('bg-racing-carbon');
    // Translate based on size
    const translateClasses: Record<ToggleSize, string> = {
      sm: 'translate-x-4',
      md: 'translate-x-5',
      lg: 'translate-x-6',
    };
    baseClasses.push(translateClasses[props.size]);
  } else {
    baseClasses.push('theme-text-muted', 'bg-current');
  }

  return baseClasses;
});

const handleClick = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
};

// eslint-disable-next-line no-undef
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.disabled && (event.key === ' ' || event.key === 'Enter')) {
    event.preventDefault();
    emit('update:modelValue', !props.modelValue);
  }
};
</script>

<template>
  <div class="vrl-toggle-wrapper">
    <!-- Simple toggle (no label/description) -->
    <label
      v-if="!label && !description"
      class="flex items-center gap-3"
      :class="{ 'cursor-not-allowed': disabled, 'cursor-pointer': !disabled }"
    >
      <div
        :class="toggleClasses"
        role="switch"
        :aria-checked="modelValue"
        :aria-disabled="disabled"
        tabindex="0"
        @click="handleClick"
        @keydown="handleKeydown"
      >
        <div :class="indicatorClasses" />
      </div>
    </label>

    <!-- Toggle with label only -->
    <label
      v-else-if="label && !description"
      class="flex items-center gap-3"
      :class="{ 'cursor-not-allowed': disabled, 'cursor-pointer': !disabled }"
    >
      <div
        :class="toggleClasses"
        role="switch"
        :aria-checked="modelValue"
        :aria-disabled="disabled"
        :aria-label="label"
        tabindex="0"
        @click="handleClick"
        @keydown="handleKeydown"
      >
        <div :class="indicatorClasses" />
      </div>
      <span class="text-sm theme-text-primary">{{ label }}</span>
    </label>

    <!-- Toggle with label and description -->
    <div v-else class="flex items-start justify-between gap-4 p-4 rounded theme-bg-tertiary">
      <div>
        <div class="text-sm font-medium mb-1 theme-text-primary">{{ label }}</div>
        <div :id="descriptionId" class="text-xs theme-text-muted">{{ description }}</div>
      </div>
      <div
        :class="toggleClasses"
        role="switch"
        :aria-checked="modelValue"
        :aria-disabled="disabled"
        :aria-label="label"
        :aria-describedby="description ? descriptionId : undefined"
        tabindex="0"
        @click="handleClick"
        @keydown="handleKeydown"
      >
        <div :class="indicatorClasses" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Hover effect */
[role='switch']:not([aria-disabled='true']):hover {
  border-color: var(--accent-gold);
}

/* Focus effect */
[role='switch']:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.12);
}
</style>
