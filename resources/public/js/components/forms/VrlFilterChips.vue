<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface FilterOption {
  label: string;
  value: string | number;
}

interface Props {
  modelValue: string | number;
  options: FilterOption[];
  class?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const emit = defineEmits<Emits>();

// eslint-disable-next-line no-undef
const chipRefs = ref<HTMLButtonElement[]>([]);
const currentFocusIndex = ref(-1);

const setChipRef = (el: unknown, index: number) => {
  if (el) {
    // eslint-disable-next-line no-undef
    chipRefs.value[index] = el as HTMLButtonElement;
  }
};

const getChipClasses = (option: FilterOption) => {
  const isActive = props.modelValue === option.value;
  const baseClasses = [
    'px-3',
    'sm:px-4',
    'py-2',
    'font-display',
    'text-[10px]',
    'uppercase',
    'tracking-wider',
    'transition-all',
    'min-h-[44px]',
    'border',
    'outline-none',
  ];

  if (isActive) {
    baseClasses.push('bg-racing-gold', 'text-racing-carbon', 'border-racing-gold');
  } else {
    baseClasses.push('border-transparent');
  }

  return baseClasses;
};

const getChipStyles = (option: FilterOption) => {
  const isActive = props.modelValue === option.value;
  if (!isActive) {
    return {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-muted)',
    };
  }
  return {};
};

const handleChipClick = (value: string | number) => {
  emit('update:modelValue', value);
};

// eslint-disable-next-line no-undef
const handleKeydown = (event: KeyboardEvent, index: number) => {
  let newIndex = index;

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault();
      newIndex = index < props.options.length - 1 ? index + 1 : 0;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();
      newIndex = index > 0 ? index - 1 : props.options.length - 1;
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = props.options.length - 1;
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (props.options[index]) {
        emit('update:modelValue', props.options[index].value);
      }
      return;
    default:
      return;
  }

  currentFocusIndex.value = newIndex;
  const chipToFocus = chipRefs.value[newIndex];
  if (chipToFocus) {
    chipToFocus.focus();
  }
};

const handleFocus = (index: number) => {
  currentFocusIndex.value = index;
};

const handleBlur = () => {
  // Small delay to allow focus to move to another chip
  setTimeout(() => {
    const hasFocusInGroup = chipRefs.value.some((chip) => chip === document.activeElement);
    if (!hasFocusInGroup) {
      currentFocusIndex.value = -1;
    }
  }, 0);
};

// Cleanup
onMounted(() => {
  chipRefs.value = [];
});

onUnmounted(() => {
  chipRefs.value = [];
});
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Filter options"
    :class="['flex', 'flex-wrap', 'gap-2', props.class]"
    class="vrl-filter-chips"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      :ref="(el) => setChipRef(el, index)"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.value"
      :class="getChipClasses(option)"
      :style="getChipStyles(option)"
      :tabindex="modelValue === option.value ? 0 : -1"
      @click="handleChipClick(option.value)"
      @keydown="(e) => handleKeydown(e, index)"
      @focus="handleFocus(index)"
      @blur="handleBlur"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
/* Focus styling */
button:focus {
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.12);
}

/* Hover effect for inactive chips */
button[aria-checked='false']:hover {
  background: var(--bg-secondary);
  border-color: var(--border-primary);
}

/* Hover effect for active chip */
button[aria-checked='true']:hover {
  opacity: 0.9;
}
</style>
