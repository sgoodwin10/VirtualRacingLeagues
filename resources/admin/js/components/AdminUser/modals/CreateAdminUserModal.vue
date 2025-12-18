<template>
  <BaseModal
    :visible="visible"
    :dismissable-mask="false"
    width="600px"
    @update:visible="handleVisibleChange"
  >
    <!-- Custom Header -->
    <template #header> Add Admin User </template>

    <!-- Content -->
    <form class="space-y-4" @submit.prevent="handleSave">
      <!-- First Name -->
      <div>
        <label for="create-first-name" class="block text-sm font-medium text-gray-700 mb-2">
          First Name <span class="text-red-500">*</span>
        </label>
        <InputText
          id="create-first-name"
          v-model="formData.first_name"
          class="w-full"
          :invalid="hasError('first_name')"
          :disabled="saving"
          required
          @input="clearFieldError('first_name')"
        />
        <small v-if="hasError('first_name')" class="text-red-500">
          {{ getErrorMessage('first_name') }}
        </small>
      </div>

      <!-- Last Name -->
      <div>
        <label for="create-last-name" class="block text-sm font-medium text-gray-700 mb-2">
          Last Name <span class="text-red-500">*</span>
        </label>
        <InputText
          id="create-last-name"
          v-model="formData.last_name"
          class="w-full"
          :invalid="hasError('last_name')"
          :disabled="saving"
          required
          @input="clearFieldError('last_name')"
        />
        <small v-if="hasError('last_name')" class="text-red-500">
          {{ getErrorMessage('last_name') }}
        </small>
      </div>

      <!-- Email -->
      <div>
        <label for="create-email" class="block text-sm font-medium text-gray-700 mb-2">
          Email <span class="text-red-500">*</span>
        </label>
        <InputText
          id="create-email"
          v-model="formData.email"
          type="email"
          class="w-full"
          :invalid="hasError('email')"
          :disabled="saving"
          required
          @input="clearFieldError('email')"
        />
        <small v-if="hasError('email')" class="text-red-500">
          {{ getErrorMessage('email') }}
        </small>
      </div>

      <!-- Role -->
      <div>
        <label for="create-role" class="block text-sm font-medium text-gray-700 mb-2">
          Role <span class="text-red-500">*</span>
        </label>
        <Select
          id="create-role"
          v-model="formData.role"
          :options="availableRoles"
          option-label="label"
          option-value="value"
          placeholder="Select a role"
          class="w-full"
          :invalid="hasError('role')"
          :disabled="saving"
          @change="clearFieldError('role')"
        />
        <small v-if="hasError('role')" class="text-red-500">
          {{ getErrorMessage('role') }}
        </small>
      </div>
    </form>

    <!-- Custom Footer -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" :disabled="saving" @click="handleCancel" />
        <Button
          label="Create Admin User"
          icon="pi pi-check"
          :loading="saving"
          @click="handleSave"
        />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import type { AdminUserUpdateData, AdminRole } from '@admin/types/admin';
import { validateRequired, validateEmail } from '@admin/utils/validation';

/**
 * Role option interface
 */
export interface RoleOption {
  label: string;
  value: AdminRole;
}

/**
 * Validation errors structure matching Laravel's format
 */
export interface ValidationErrors {
  first_name?: string[];
  last_name?: string[];
  email?: string[];
  role?: string[];
}

/**
 * Props interface for CreateAdminUserModal component
 */
export interface CreateAdminUserModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Available roles for the dropdown
   */
  availableRoles: RoleOption[];

  /**
   * Whether the form is currently saving
   */
  saving?: boolean;
}

/**
 * Emits interface for CreateAdminUserModal component
 */
export interface CreateAdminUserModalEmits {
  /**
   * Emitted when the modal visibility changes
   */
  (event: 'update:visible', value: boolean): void;

  /**
   * Emitted when the save button is clicked
   */
  (event: 'save', data: AdminUserUpdateData): void;

  /**
   * Emitted when the modal is cancelled
   */
  (event: 'cancel'): void;

  /**
   * Emitted when the modal is closed
   */
  (event: 'close'): void;

  /**
   * Emitted when a validation error occurs
   */
  (event: 'error', error: Error): void;
}

// Props
const props = withDefaults(defineProps<CreateAdminUserModalProps>(), {
  saving: false,
});

// Emits
const emit = defineEmits<CreateAdminUserModalEmits>();

/**
 * Form data
 */
const formData = ref<AdminUserUpdateData>({
  first_name: '',
  last_name: '',
  email: '',
  role: 'moderator',
});

/**
 * Backend validation errors from Laravel
 */
const validationErrors = ref<ValidationErrors>({});

/**
 * Frontend validation errors for immediate feedback
 */
const errors = ref<Record<string, string>>({});

/**
 * Reset form when modal visibility changes
 */
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // Reset form when modal opens
      formData.value = {
        first_name: '',
        last_name: '',
        email: '',
        role: 'moderator',
      };
      errors.value = {};
      validationErrors.value = {};
    }
  },
);

/**
 * Clear validation error for a specific field when user starts typing
 */
const clearFieldError = (field: keyof ValidationErrors): void => {
  if (validationErrors.value[field]) {
    validationErrors.value[field] = [];
  }
  if (errors.value[field]) {
    delete errors.value[field];
  }
};

/**
 * Validate form data (frontend validation)
 */
const validateForm = (): boolean => {
  errors.value = {};

  // Validate first name
  const firstNameResult = validateRequired(formData.value.first_name, 'First name');
  if (!firstNameResult.isValid) {
    errors.value.first_name = firstNameResult.error!;
  }

  // Validate last name
  const lastNameResult = validateRequired(formData.value.last_name, 'Last name');
  if (!lastNameResult.isValid) {
    errors.value.last_name = lastNameResult.error!;
  }

  // Validate email
  const emailResult = validateEmail(formData.value.email);
  if (!emailResult.isValid) {
    errors.value.email = emailResult.error!;
  }

  // Validate role
  const roleResult = validateRequired(formData.value.role, 'Role');
  if (!roleResult.isValid) {
    errors.value.role = roleResult.error!;
  }

  return Object.keys(errors.value).length === 0;
};

/**
 * Set backend validation errors from API response
 */
const setValidationErrors = (backendErrors: ValidationErrors): void => {
  validationErrors.value = backendErrors;
};

/**
 * Handle visibility change
 */
const handleVisibleChange = (value: boolean): void => {
  emit('update:visible', value);
};

/**
 * Handle save button click
 */
const handleSave = (): void => {
  // Clear previous validation errors
  validationErrors.value = {};

  // Run frontend validation
  if (validateForm()) {
    emit('save', { ...formData.value });
  }
};

/**
 * Handle cancel button click
 */
const handleCancel = (): void => {
  emit('cancel');
  emit('update:visible', false);
  emit('close');
};

/**
 * Check if a field has validation errors
 */
const hasError = (field: keyof ValidationErrors): boolean => {
  return !!(validationErrors.value[field]?.length || errors.value[field]);
};

/**
 * Get the error message for a field
 */
const getErrorMessage = (field: keyof ValidationErrors): string => {
  return validationErrors.value[field]?.[0] || errors.value[field] || '';
};

// Expose methods for parent component to call
defineExpose({
  setValidationErrors,
});
</script>

<style scoped>
/* Form validation styles */
:deep(.p-invalid) {
  border-color: #ef4444;
}
</style>
