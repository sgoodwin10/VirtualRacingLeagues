import { ref, type Ref } from 'vue';
import type { ToastServiceMethods } from 'primevue/toastservice';
import type { Admin, AdminUserUpdateData } from '@admin/types/admin';
import {
  hasValidationErrors,
  getErrorMessage,
  isRequestCancelled,
  getValidationErrors,
} from '@admin/types/errors';
import { adminUserService } from '@admin/services/adminUserService';

/**
 * Modal reference interface for components that expose setValidationErrors
 */
interface ModalWithValidation {
  setValidationErrors: (errors: Record<string, string[]>) => void;
}

/**
 * Options for configuring admin user modals
 */
export interface UseAdminUserModalsOptions {
  /**
   * PrimeVue toast service for showing notifications
   */
  toast: ToastServiceMethods;
  /**
   * Callback to reload admin users list after mutations
   */
  onReload: () => Promise<void>;
  /**
   * Current admin user's role level (for permissions)
   */
  currentRoleLevel: Ref<number>;
  /**
   * Whether we're editing the current admin's own profile
   */
  isEditingOwnProfile?: Ref<boolean>;
}

/**
 * Return type for useAdminUserModals composable
 */
export interface UseAdminUserModalsReturn {
  // Modal visibility states
  viewDialogVisible: Ref<boolean>;
  editDialogVisible: Ref<boolean>;
  createDialogVisible: Ref<boolean>;
  deleteDialogVisible: Ref<boolean>;

  // Selected admin user state
  selectedAdminUser: Ref<Admin | null>;

  // Modal refs (for accessing component methods)
  createModalRef: Ref<ModalWithValidation | null>;

  // Loading states
  saving: Ref<boolean>;
  creating: Ref<boolean>;
  deleting: Ref<boolean>;

  // Modal handlers - opening modals
  openCreateDialog: () => void;
  openViewDialog: (user: Admin) => void;
  openEditDialog: (user: Admin, isOwnProfile?: boolean) => void;
  openDeleteDialog: (user: Admin) => void;
  openEditFromView: (user: Admin, isOwnProfile: boolean) => void;
  openDeleteFromView: () => void;

  // Modal handlers - closing modals
  handleEditCancel: () => void;
  handleCreateCancel: () => void;
  handleDeleteCancel: () => void;

  // Action handlers
  handleCreate: (formData: AdminUserUpdateData) => Promise<void>;
  handleSave: (
    formData: AdminUserUpdateData,
    adminToUpdate?: Admin | null
  ) => Promise<Admin | undefined>;
  handleDelete: (user: Admin) => Promise<void>;
  handleReactivate: (user: Admin) => Promise<void>;
}

/**
 * Composable for managing admin user modal states and actions
 *
 * This composable encapsulates all modal-related logic for admin user management,
 * including opening/closing modals, handling CRUD operations, and managing loading states.
 *
 * It integrates with:
 * - PrimeVue Toast for notifications
 * - Admin user service for API calls
 * - Error handling utilities
 * - Validation error display
 *
 * @example Basic usage
 * ```typescript
 * const toast = useToast();
 * const currentRoleLevel = computed(() => getRoleLevel(adminStore.adminRole));
 *
 * const {
 *   viewDialogVisible,
 *   editDialogVisible,
 *   createDialogVisible,
 *   deleteDialogVisible,
 *   selectedAdminUser,
 *   createModalRef,
 *   saving,
 *   creating,
 *   deleting,
 *   openCreateDialog,
 *   openViewDialog,
 *   openEditDialog,
 *   openDeleteDialog,
 *   handleCreate,
 *   handleSave,
 *   handleDelete,
 *   handleReactivate,
 *   handleEditCancel,
 *   handleCreateCancel,
 *   handleDeleteCancel,
 * } = useAdminUserModals({
 *   toast,
 *   onReload: loadAdminUsers,
 *   currentRoleLevel,
 * });
 * ```
 *
 * @example In template
 * ```vue
 * <template>
 *   <Button label="Add Admin User" @click="openCreateDialog" />
 *
 *   <AdminUsersTable
 *     :admin-users="adminUsers"
 *     @view="openViewDialog"
 *     @edit="openEditDialog"
 *     @deactivate="openDeleteDialog"
 *     @reactivate="handleReactivate"
 *   />
 *
 *   <ViewAdminUserModal
 *     v-model:visible="viewDialogVisible"
 *     :admin-user="selectedAdminUser"
 *     @edit="openEditFromView"
 *     @delete="openDeleteFromView"
 *   />
 *
 *   <EditAdminUserModal
 *     v-model:visible="editDialogVisible"
 *     :admin-user="selectedAdminUser"
 *     :saving="saving"
 *     @save="handleSave"
 *     @cancel="handleEditCancel"
 *   />
 *
 *   <CreateAdminUserModal
 *     ref="createModalRef"
 *     v-model:visible="createDialogVisible"
 *     :saving="creating"
 *     @save="handleCreate"
 *     @cancel="handleCreateCancel"
 *   />
 *
 *   <DeleteAdminUserModal
 *     v-model:visible="deleteDialogVisible"
 *     :admin-user="selectedAdminUser"
 *     :deleting="deleting"
 *     @delete="handleDelete"
 *     @cancel="handleDeleteCancel"
 *   />
 * </template>
 * ```
 *
 * @example With store updates
 * ```typescript
 * const adminStore = useAdminStore();
 *
 * const {
 *   handleSave,
 *   // ... other properties
 * } = useAdminUserModals({
 *   toast,
 *   onReload: loadAdminUsers,
 *   currentRoleLevel,
 *   isEditingOwnProfile: ref(false),
 * });
 *
 * // When saving, if it's own profile, you can update the store separately
 * const saveUser = async (formData: AdminUserUpdateData) => {
 *   await handleSave(formData, selectedAdminUser.value);
 *
 *   // Update admin store if editing own profile
 *   if (isEditingOwnProfile.value && selectedAdminUser.value) {
 *     adminStore.setAdmin(updatedUser);
 *   }
 * };
 * ```
 *
 * @param options - Configuration options
 * @returns Object with modal states, refs, and handlers
 */
export function useAdminUserModals(options: UseAdminUserModalsOptions): UseAdminUserModalsReturn {
  const { toast, onReload, isEditingOwnProfile } = options;

  // Modal visibility states
  const viewDialogVisible = ref(false);
  const editDialogVisible = ref(false);
  const createDialogVisible = ref(false);
  const deleteDialogVisible = ref(false);

  // Selected admin user state
  const selectedAdminUser = ref<Admin | null>(null);

  // Modal refs
  const createModalRef = ref<ModalWithValidation | null>(null);

  // Loading states
  const saving = ref(false);
  const creating = ref(false);
  const deleting = ref(false);

  /**
   * Open create dialog
   */
  const openCreateDialog = (): void => {
    createDialogVisible.value = true;
  };

  /**
   * Open view dialog
   */
  const openViewDialog = (user: Admin): void => {
    selectedAdminUser.value = user;
    viewDialogVisible.value = true;
  };

  /**
   * Open edit dialog
   *
   * @param user - Admin user to edit
   * @param isOwnProfile - Whether we're editing the current admin's own profile
   */
  const openEditDialog = (user: Admin, isOwnProfile = false): void => {
    selectedAdminUser.value = user;
    if (isEditingOwnProfile) {
      isEditingOwnProfile.value = isOwnProfile;
    }
    editDialogVisible.value = true;
  };

  /**
   * Open delete confirmation dialog
   */
  const openDeleteDialog = (user: Admin): void => {
    selectedAdminUser.value = user;
    deleteDialogVisible.value = true;
  };

  /**
   * Open edit dialog from view dialog
   *
   * @param _user - Admin user to edit (unused, already set in selectedAdminUser)
   * @param isOwnProfile - Whether we're editing the current admin's own profile
   */
  const openEditFromView = (_user: Admin, isOwnProfile: boolean): void => {
    viewDialogVisible.value = false;
    if (isEditingOwnProfile) {
      isEditingOwnProfile.value = isOwnProfile;
    }
    // The user is already set in selectedAdminUser from the view dialog
    editDialogVisible.value = true;
  };

  /**
   * Open delete confirmation dialog from view dialog
   */
  const openDeleteFromView = (): void => {
    viewDialogVisible.value = false;
    deleteDialogVisible.value = true;
  };

  /**
   * Handle edit modal cancel
   */
  const handleEditCancel = (): void => {
    editDialogVisible.value = false;
    selectedAdminUser.value = null;
    if (isEditingOwnProfile) {
      isEditingOwnProfile.value = false;
    }
  };

  /**
   * Handle create modal cancel
   */
  const handleCreateCancel = (): void => {
    createDialogVisible.value = false;
  };

  /**
   * Handle delete modal cancel
   */
  const handleDeleteCancel = (): void => {
    deleteDialogVisible.value = false;
    selectedAdminUser.value = null;
  };

  /**
   * Create new admin user
   *
   * @param formData - Form data for creating admin user
   */
  const handleCreate = async (formData: AdminUserUpdateData): Promise<void> => {
    creating.value = true;
    try {
      await adminUserService.createAdminUser(formData);

      // Refresh the admin users list to include the new user
      await onReload();

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Admin user created successfully',
        life: 3000,
      });

      createDialogVisible.value = false;
    } catch (error) {
      // Silently ignore cancelled requests
      if (isRequestCancelled(error)) {
        return;
      }

      // Check if this is a validation error from Laravel
      if (hasValidationErrors(error)) {
        // Pass validation errors to the modal with proper typing
        const validationErrors = getValidationErrors(error);
        if (validationErrors && createModalRef.value) {
          createModalRef.value.setValidationErrors(validationErrors);
        }

        // Show a general error toast
        toast.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Please correct the errors in the form',
          life: 5000,
        });
      } else {
        // Show error toast for non-validation errors
        const message = getErrorMessage(error, 'Failed to create admin user');
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: message,
          life: 5000,
        });
      }
    } finally {
      creating.value = false;
    }
  };

  /**
   * Save admin user changes
   *
   * @param formData - Form data for updating admin user
   * @param adminToUpdate - Admin user to update (defaults to selectedAdminUser)
   * @returns Updated admin user or undefined if failed/cancelled
   */
  const handleSave = async (
    formData: AdminUserUpdateData,
    adminToUpdate: Admin | null = null
  ): Promise<Admin | undefined> => {
    const userToUpdate = adminToUpdate || selectedAdminUser.value;
    if (!userToUpdate) return undefined;

    saving.value = true;
    try {
      const updatedUser = await adminUserService.updateAdminUser(userToUpdate.id, formData);

      // Refresh the admin users list to get updated data
      await onReload();

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Admin user updated successfully',
        life: 3000,
      });

      editDialogVisible.value = false;
      selectedAdminUser.value = null;
      if (isEditingOwnProfile) {
        isEditingOwnProfile.value = false;
      }

      return updatedUser;
    } catch (error) {
      // Silently ignore cancelled requests
      if (isRequestCancelled(error)) {
        return undefined;
      }

      const message = getErrorMessage(error, 'Failed to update admin user');
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      });
      return undefined;
    } finally {
      saving.value = false;
    }
  };

  /**
   * Deactivate admin user (soft delete)
   *
   * @param user - Admin user to deactivate
   */
  const handleDelete = async (user: Admin): Promise<void> => {
    deleting.value = true;
    try {
      await adminUserService.deleteAdminUser(user.id);

      // Refresh the admin users list to get updated data
      await onReload();

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Admin user deactivated successfully',
        life: 3000,
      });

      deleteDialogVisible.value = false;
      selectedAdminUser.value = null;
    } catch (error) {
      // Silently ignore cancelled requests
      if (isRequestCancelled(error)) {
        return;
      }

      const message = getErrorMessage(error, 'Failed to deactivate admin user');
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      });
    } finally {
      deleting.value = false;
    }
  };

  /**
   * Reactivate admin user (restore soft delete)
   *
   * @param user - Admin user to reactivate
   */
  const handleReactivate = async (user: Admin): Promise<void> => {
    try {
      await adminUserService.restoreAdminUser(user.id);

      // Refresh the admin users list to get updated data
      await onReload();

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Admin user reactivated successfully',
        life: 3000,
      });
    } catch (error) {
      // Silently ignore cancelled requests
      if (isRequestCancelled(error)) {
        return;
      }

      const message = getErrorMessage(error, 'Failed to reactivate admin user');
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      });
    }
  };

  return {
    // Modal visibility states
    viewDialogVisible,
    editDialogVisible,
    createDialogVisible,
    deleteDialogVisible,

    // Selected admin user state
    selectedAdminUser,

    // Modal refs
    createModalRef,

    // Loading states
    saving,
    creating,
    deleting,

    // Modal handlers - opening modals
    openCreateDialog,
    openViewDialog,
    openEditDialog,
    openDeleteDialog,
    openEditFromView,
    openDeleteFromView,

    // Modal handlers - closing modals
    handleEditCancel,
    handleCreateCancel,
    handleDeleteCancel,

    // Action handlers
    handleCreate,
    handleSave,
    handleDelete,
    handleReactivate,
  };
}
