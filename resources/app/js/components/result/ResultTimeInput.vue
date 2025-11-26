<template>
  <InputText
    v-model="localValue"
    :placeholder="props.placeholder || '00:00:00.000'"
    class="w-full font-mono"
    :invalid="!isValid"
    @blur="handleBlur"
    @keydown.enter="handleBlur"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import InputText from 'primevue/inputtext';
import { useRaceTimeCalculation } from '@app/composables/useRaceTimeCalculation';

interface Props {
  modelValue: string;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { normalizeTimeInput, isValidTimeFormat } = useRaceTimeCalculation();

const localValue = ref(props.modelValue);

// Validate after normalization
const isValid = computed(() => {
  if (!localValue.value || localValue.value.trim() === '') return true;
  // Check if the normalized value is valid
  const normalized = normalizeTimeInput(localValue.value);
  return isValidTimeFormat(normalized);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue.trim() !== '') {
      // Normalize incoming programmatic values (e.g., from CSV import)
      const normalized = normalizeTimeInput(newValue);
      localValue.value = normalized;

      // Emit back if normalization changed the value
      if (normalized !== newValue) {
        emit('update:modelValue', normalized);
      }
    } else {
      localValue.value = newValue;
    }
  },
);

function handleBlur(): void {
  if (!localValue.value || localValue.value.trim() === '') {
    // Empty input, emit empty string
    if (localValue.value !== props.modelValue) {
      emit('update:modelValue', '');
    }
    return;
  }

  // Normalize the input to full format
  const normalized = normalizeTimeInput(localValue.value);

  // Update both local and parent with normalized value
  localValue.value = normalized;
  if (normalized !== props.modelValue) {
    emit('update:modelValue', normalized);
  }
}
</script>
