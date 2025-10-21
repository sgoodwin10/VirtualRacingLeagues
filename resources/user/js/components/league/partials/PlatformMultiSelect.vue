<script setup lang="ts">
import { computed } from 'vue';
import MultiSelect from 'primevue/multiselect';
import FormInputGroup from '@user/components/common/forms/FormInputGroup.vue';
import FormLabel from '@user/components/common/forms/FormLabel.vue';
import FormError from '@user/components/common/forms/FormError.vue';
import FormHelper from '@user/components/common/forms/FormHelper.vue';
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
  <FormInputGroup>
    <FormLabel for="platforms" text="Platforms" :required="required" />

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
      size="small"
      display="chip"
    />

    <FormHelper text="Select all platforms your league supports" />

    <FormError :error="error" />
  </FormInputGroup>
</template>
