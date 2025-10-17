<template>
  <BaseModal
    :visible="visible"
    :dismissable-mask="true"
    width="500px"
    @update:visible="handleVisibleChange"
  >
    <!-- Custom Header -->
    <template #header> Confirm Deactivation </template>

    <!-- Content -->
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500"></i>
      </div>
      <div class="flex-1">
        <p class="text-gray-900 mb-2">Are you sure you want to deactivate this admin user?</p>
        <div v-if="adminUser" class="bg-gray-50 p-3 rounded-lg mb-3">
          <p class="text-sm text-gray-700">
            <span class="font-medium">Name:</span>
            {{ getFullName(adminUser) }}
          </p>
          <p class="text-sm text-gray-700">
            <span class="font-medium">Email:</span>
            {{ adminUser.email }}
          </p>
        </div>
        <p class="text-sm text-gray-600">
          This will mark the user as inactive. They will no longer be able to access the admin
          panel.
        </p>
      </div>
    </div>

    <!-- Custom Footer -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" :disabled="deleting" @click="handleCancel" />
        <Button
          label="Deactivate"
          icon="pi pi-trash"
          severity="danger"
          :loading="deleting"
          @click="handleDelete"
        />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import Button from 'primevue/button';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import type { Admin } from '@admin/types/admin';

/**
 * Props interface for DeleteAdminUserModal component
 */
export interface DeleteAdminUserModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Admin user to delete
   */
  adminUser: Admin | null;

  /**
   * Whether the delete operation is in progress
   */
  deleting?: boolean;
}

/**
 * Emits interface for DeleteAdminUserModal component
 */
export interface DeleteAdminUserModalEmits {
  /**
   * Emitted when the modal visibility changes
   */
  (event: 'update:visible', value: boolean): void;

  /**
   * Emitted when the delete button is clicked
   */
  (event: 'delete', user: Admin): void;

  /**
   * Emitted when the cancel button is clicked
   */
  (event: 'cancel'): void;

  /**
   * Emitted when the modal is closed
   */
  (event: 'close'): void;
}

// Props
const props = withDefaults(defineProps<DeleteAdminUserModalProps>(), {
  deleting: false,
});

// Emits
const emit = defineEmits<DeleteAdminUserModalEmits>();

/**
 * Get first name from admin user
 */
const getFirstName = (user: Admin): string => {
  return user.first_name || user.name?.split(' ')[0] || '';
};

/**
 * Get last name from admin user
 */
const getLastName = (user: Admin): string => {
  return user.last_name || user.name?.split(' ').slice(1).join(' ') || '';
};

/**
 * Get full name from admin user
 */
const getFullName = (user: Admin): string => {
  const firstName = getFirstName(user);
  const lastName = getLastName(user);
  return `${firstName} ${lastName}`.trim();
};

/**
 * Handle visibility change
 */
const handleVisibleChange = (value: boolean): void => {
  emit('update:visible', value);
};

/**
 * Handle delete button click
 */
const handleDelete = (): void => {
  if (props.adminUser) {
    emit('delete', props.adminUser);
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
/* DeleteAdminUserModal specific styles */
</style>
