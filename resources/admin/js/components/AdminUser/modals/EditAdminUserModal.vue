<template>
  <BaseModal
    :visible="visible"
    :dismissable-mask="false"
    width="600px"
    @update:visible="handleVisibleChange"
  >
    <!-- Custom Header -->
    <template #header> Edit Admin User </template>

    <!-- Content -->
    <form class="space-y-4" @submit.prevent="handleSave">
      <!-- First Name -->
      <div>
        <label for="edit-first-name" class="block text-sm font-medium text-gray-700 mb-2">
          First Name <span class="text-red-500">*</span>
        </label>
        <InputText
          id="edit-first-name"
          v-model="formData.first_name"
          class="w-full"
          :class="{ 'p-invalid': errors.first_name }"
          :disabled="saving"
          required
        />
        <small v-if="errors.first_name" class="text-red-500">
          {{ errors.first_name }}
        </small>
      </div>

      <!-- Last Name -->
      <div>
        <label for="edit-last-name" class="block text-sm font-medium text-gray-700 mb-2">
          Last Name <span class="text-red-500">*</span>
        </label>
        <InputText
          id="edit-last-name"
          v-model="formData.last_name"
          class="w-full"
          :class="{ 'p-invalid': errors.last_name }"
          :disabled="saving"
          required
        />
        <small v-if="errors.last_name" class="text-red-500">
          {{ errors.last_name }}
        </small>
      </div>

      <!-- Email -->
      <div>
        <label for="edit-email" class="block text-sm font-medium text-gray-700 mb-2">
          Email <span class="text-red-500">*</span>
        </label>
        <InputText
          id="edit-email"
          v-model="formData.email"
          type="email"
          class="w-full"
          :class="{ 'p-invalid': errors.email }"
          :disabled="saving"
          required
        />
        <small v-if="errors.email" class="text-red-500">
          {{ errors.email }}
        </small>
      </div>

      <!-- Role -->
      <div>
        <label for="edit-role" class="block text-sm font-medium text-gray-700 mb-2">
          Role <span class="text-red-500">*</span>
        </label>
        <Select
          id="edit-role"
          v-model="formData.role"
          :options="availableRoles"
          option-label="label"
          option-value="value"
          placeholder="Select a role"
          class="w-full"
          :class="{ 'p-invalid': errors.role }"
          :disabled="saving || disableRoleEdit"
        />
        <small v-if="disableRoleEdit" class="text-gray-500">
          You cannot change your own role
        </small>
        <small v-else-if="errors.role" class="text-red-500">
          {{ errors.role }}
        </small>
      </div>
    </form>

    <!-- Custom Footer -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" :disabled="saving" @click="handleCancel" />
        <Button label="Save Changes" icon="pi pi-check" :loading="saving" @click="handleSave" />
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
import { useNameHelpers } from '@admin/composables/useNameHelpers';
import type { Admin, AdminUserUpdateData, AdminRole } from '@admin/types/admin';
import { validateRequired, validateEmail } from '@admin/utils/validation';

/**
 * Role option interface
 */
export interface RoleOption {
  label: string;
  value: AdminRole;
}

/**
 * Props interface for EditAdminUserModal component
 */
export interface EditAdminUserModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Admin user to edit
   */
  adminUser: Admin | null;

  /**
   * Available roles for the dropdown
   */
  availableRoles: RoleOption[];

  /**
   * Whether the form is currently saving
   */
  saving?: boolean;

  /**
   * Whether the role field should be disabled (e.g., when editing own profile)
   */
  disableRoleEdit?: boolean;
}

/**
 * Emits interface for EditAdminUserModal component
 */
export interface EditAdminUserModalEmits {
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
}

// Props
const props = withDefaults(defineProps<EditAdminUserModalProps>(), {
  saving: false,
  disableRoleEdit: false,
});

// Emits
const emit = defineEmits<EditAdminUserModalEmits>();

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
 * Form validation errors
 */
const errors = ref<Record<string, string>>({});

// Composables
const { getFirstName, getLastName } = useNameHelpers();

/**
 * Initialize form data when adminUser changes
 */
watch(
  () => props.adminUser,
  (newUser) => {
    if (newUser) {
      formData.value = {
        first_name: getFirstName(newUser),
        last_name: getLastName(newUser),
        email: newUser.email,
        role: newUser.role,
      };
      errors.value = {};
    }
  },
  { immediate: true },
);

/**
 * Validate form data
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
 * Handle visibility change
 */
const handleVisibleChange = (value: boolean): void => {
  emit('update:visible', value);
};

/**
 * Handle save button click
 */
const handleSave = (): void => {
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
</script>

<style scoped>
/* Form validation styles */
:deep(.p-invalid) {
  border-color: #ef4444;
}
</style>
