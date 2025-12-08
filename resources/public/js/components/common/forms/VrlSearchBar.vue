<script setup lang="ts">
import { computed, ref, getCurrentInstance, useAttrs } from 'vue';
import { PhMagnifyingGlass, PhSpinner } from '@phosphor-icons/vue';

interface Props {
  modelValue: string;
  placeholder?: string;
  loading?: boolean;
  class?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...',
  loading: false,
  class: '',
});

const emit = defineEmits<Emits>();
const attrs = useAttrs();

const inputRef = ref<HTMLInputElement | null>(null);

// Generate unique ID using component instance uid or provided id attribute
const instance = getCurrentInstance();
const inputId = computed<string>(() => {
  return (attrs.id as string) || `vrl-search-${instance!.uid}`;
});

const containerClasses = computed(() => {
  const baseClasses = [
    'flex',
    'items-center',
    'px-3',
    'sm:px-4',
    'py-2',
    'transition-colors',
    'border',
    props.class,
  ];

  return baseClasses.filter(Boolean);
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

// eslint-disable-next-line no-undef
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    emit('search', props.modelValue);
  }
};

const focus = () => {
  inputRef.value?.focus();
};

defineExpose({
  focus,
});
</script>

<template>
  <div
    role="search"
    aria-label="Search"
    :class="containerClasses"
    class="vrl-search-bar"
    style="background: var(--bg-secondary); border-color: var(--border-primary)"
  >
    <!-- Search Icon or Loading Spinner -->
    <PhSpinner
      v-if="loading"
      :size="18"
      class="mr-2 sm:mr-3 animate-spin"
      style="color: var(--text-muted)"
      aria-hidden="true"
    />
    <PhMagnifyingGlass
      v-else
      :size="18"
      class="mr-2 sm:mr-3"
      style="color: var(--text-muted)"
      aria-hidden="true"
    />

    <!-- Input -->
    <input
      :id="inputId"
      ref="inputRef"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="loading"
      class="flex-1 bg-transparent border-none text-sm font-body min-h-[44px] outline-none"
      style="color: var(--text-primary)"
      @input="handleInput"
      @keydown="handleKeydown"
    />
  </div>
</template>

<style scoped>
.vrl-search-bar:focus-within {
  border-color: var(--accent-gold);
  box-shadow:
    0 0 0 3px rgba(212, 168, 83, 0.12),
    0 0 0 1px var(--accent-gold);
}

/* Placeholder color */
input::placeholder {
  color: var(--text-dim);
}

/* Animation for spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
