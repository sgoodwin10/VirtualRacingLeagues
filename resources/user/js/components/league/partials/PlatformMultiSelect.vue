<script setup lang="ts">
import { computed } from 'vue';
import MultiSelect from 'primevue/multiselect';
import type { Platform } from '@user/types/league';

interface Props {
  modelValue: number[];
  platforms: Platform[];
  error?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  error: '',
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number[]];
}>();

const selectedPlatforms = computed({
  get: () => props.modelValue,
  set: (value: number[]) => emit('update:modelValue', value),
});

const hasError = computed(() => !!props.error);
</script>

<template>
  <div class="space-y-2">
    <label for="platforms" class="block font-medium">
      Platforms
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <MultiSelect
      id="platforms"
      v-model="selectedPlatforms"
      :options="platforms"
      option-label="name"
      option-value="id"
      placeholder="Select platforms"
      :max-selected-labels="3"
      :class="{ 'p-invalid': hasError }"
      class="w-full"
      display="chip"
    />

    <p class="text-sm text-gray-600">Select all platforms your league supports</p>

    <small v-if="error" class="text-red-500">{{ error }}</small>
  </div>
</template>
