<template>
  <div class="email-settings">
    <div class="space-y-6">
      <!-- Support Email -->
      <div>
        <label for="support_email" class="block text-sm font-medium text-gray-700 mb-2">
          Support Email
        </label>
        <InputText
          id="support_email"
          v-model="localFormData.support_email"
          :class="{ 'p-invalid': hasFieldError('support_email') }"
          class="w-full"
          type="email"
          placeholder="support@example.com"
        />
        <small class="text-gray-500">Email address for customer support inquiries</small>
        <small v-if="hasFieldError('support_email')" class="block text-red-600 mt-1">
          {{ getFieldError('support_email') }}
        </small>
      </div>

      <!-- Contact Email -->
      <div>
        <label for="contact_email" class="block text-sm font-medium text-gray-700 mb-2">
          Contact Email
        </label>
        <InputText
          id="contact_email"
          v-model="localFormData.contact_email"
          :class="{ 'p-invalid': hasFieldError('contact_email') }"
          class="w-full"
          type="email"
          placeholder="contact@example.com"
        />
        <small class="text-gray-500">General contact email address</small>
        <small v-if="hasFieldError('contact_email')" class="block text-red-600 mt-1">
          {{ getFieldError('contact_email') }}
        </small>
      </div>

      <!-- Admin Email -->
      <div>
        <label for="admin_email" class="block text-sm font-medium text-gray-700 mb-2">
          Admin Email
        </label>
        <InputText
          id="admin_email"
          v-model="localFormData.admin_email"
          :class="{ 'p-invalid': hasFieldError('admin_email') }"
          class="w-full"
          type="email"
          placeholder="admin@example.com"
        />
        <small class="text-gray-500">Email address for administrative notifications</small>
        <small v-if="hasFieldError('admin_email')" class="block text-red-600 mt-1">
          {{ getFieldError('admin_email') }}
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';

interface LocalFormData {
  support_email: string | null;
  contact_email: string | null;
  admin_email: string | null;
}

interface Props {
  formData: LocalFormData;
  getFieldError: (field: string) => string | null;
  hasFieldError: (field: string) => boolean;
}

interface Emits {
  (e: 'update:formData', value: LocalFormData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local reactive copy
const localFormData = ref<LocalFormData>({ ...props.formData });

// Watch for changes and emit
watch(
  localFormData,
  (newValue) => {
    emit('update:formData', newValue);
  },
  { deep: true },
);
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
