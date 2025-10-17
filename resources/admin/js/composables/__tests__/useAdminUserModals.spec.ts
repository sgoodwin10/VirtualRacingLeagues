import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useAdminUserModals } from '../useAdminUserModals';
import type { Admin } from '@admin/types/admin';

// Mock dependencies
vi.mock('@admin/services/adminUserService', () => ({
  adminUserService: {
    createAdminUser: vi.fn(),
    updateAdminUser: vi.fn(),
    deleteAdminUser: vi.fn(),
    restoreAdminUser: vi.fn(),
  },
}));

import { adminUserService } from '@admin/services/adminUserService';

describe('useAdminUserModals', () => {
  const mockAdmin: Admin = {
    id: 1,
    name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    last_login_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  let mockToast: any;
  let mockOnReload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast = {
      add: vi.fn(),
      remove: vi.fn(),
      removeGroup: vi.fn(),
      removeAllGroups: vi.fn(),
    };
    mockOnReload = vi.fn().mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const {
        viewDialogVisible,
        editDialogVisible,
        createDialogVisible,
        deleteDialogVisible,
        selectedAdminUser,
        saving,
        creating,
        deleting,
      } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      expect(viewDialogVisible.value).toBe(false);
      expect(editDialogVisible.value).toBe(false);
      expect(createDialogVisible.value).toBe(false);
      expect(deleteDialogVisible.value).toBe(false);
      expect(selectedAdminUser.value).toBeNull();
      expect(saving.value).toBe(false);
      expect(creating.value).toBe(false);
      expect(deleting.value).toBe(false);
    });
  });

  describe('modal opening', () => {
    it('should open create dialog', () => {
      const { createDialogVisible, openCreateDialog } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      openCreateDialog();
      expect(createDialogVisible.value).toBe(true);
    });

    it('should open view dialog with selected user', () => {
      const { viewDialogVisible, selectedAdminUser, openViewDialog } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      openViewDialog(mockAdmin);
      expect(viewDialogVisible.value).toBe(true);
      expect(selectedAdminUser.value).toEqual(mockAdmin);
    });

    it('should open edit dialog with selected user', () => {
      const { editDialogVisible, selectedAdminUser, openEditDialog } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      openEditDialog(mockAdmin);
      expect(editDialogVisible.value).toBe(true);
      expect(selectedAdminUser.value).toEqual(mockAdmin);
    });

    it('should open delete dialog with selected user', () => {
      const { deleteDialogVisible, selectedAdminUser, openDeleteDialog } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      openDeleteDialog(mockAdmin);
      expect(deleteDialogVisible.value).toBe(true);
      expect(selectedAdminUser.value).toEqual(mockAdmin);
    });

    it('should open edit from view dialog', () => {
      const isEditingOwnProfile = ref(false);
      const { viewDialogVisible, editDialogVisible, openViewDialog, openEditFromView } =
        useAdminUserModals({
          toast: mockToast,
          onReload: mockOnReload,
          currentRoleLevel: ref(2),
          isEditingOwnProfile,
        });

      openViewDialog(mockAdmin);
      openEditFromView(mockAdmin, false);

      expect(viewDialogVisible.value).toBe(false);
      expect(editDialogVisible.value).toBe(true);
    });

    it('should open delete from view dialog', () => {
      const { viewDialogVisible, deleteDialogVisible, openViewDialog, openDeleteFromView } =
        useAdminUserModals({
          toast: mockToast,
          onReload: mockOnReload,
          currentRoleLevel: ref(2),
        });

      openViewDialog(mockAdmin);
      openDeleteFromView();

      expect(viewDialogVisible.value).toBe(false);
      expect(deleteDialogVisible.value).toBe(true);
    });
  });

  describe('modal closing', () => {
    it('should close edit dialog and clear selected user', () => {
      const { editDialogVisible, selectedAdminUser, openEditDialog, handleEditCancel } =
        useAdminUserModals({
          toast: mockToast,
          onReload: mockOnReload,
          currentRoleLevel: ref(2),
        });

      openEditDialog(mockAdmin);
      handleEditCancel();

      expect(editDialogVisible.value).toBe(false);
      expect(selectedAdminUser.value).toBeNull();
    });

    it('should close create dialog', () => {
      const { createDialogVisible, openCreateDialog, handleCreateCancel } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      openCreateDialog();
      handleCreateCancel();

      expect(createDialogVisible.value).toBe(false);
    });

    it('should close delete dialog and clear selected user', () => {
      const { deleteDialogVisible, selectedAdminUser, openDeleteDialog, handleDeleteCancel } =
        useAdminUserModals({
          toast: mockToast,
          onReload: mockOnReload,
          currentRoleLevel: ref(2),
        });

      openDeleteDialog(mockAdmin);
      handleDeleteCancel();

      expect(deleteDialogVisible.value).toBe(false);
      expect(selectedAdminUser.value).toBeNull();
    });
  });

  describe('handleCreate', () => {
    it('should create admin user successfully', async () => {
      vi.mocked(adminUserService.createAdminUser).mockResolvedValue(mockAdmin);
      const { handleCreate, createDialogVisible } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      const formData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'admin' as const,
      };

      await handleCreate(formData);

      expect(adminUserService.createAdminUser).toHaveBeenCalledWith(formData);
      expect(mockOnReload).toHaveBeenCalledTimes(1);
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Admin user created successfully',
        })
      );
      expect(createDialogVisible.value).toBe(false);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['The email has already been taken'],
            },
          },
        },
        isAxiosError: true,
      };
      vi.mocked(adminUserService.createAdminUser).mockRejectedValue(validationError);

      const { handleCreate } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      await handleCreate({
        first_name: 'John',
        last_name: 'Doe',
        email: 'existing@example.com',
        role: 'admin',
      });

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Validation Error',
        })
      );
    });

    it('should handle general errors', async () => {
      const error = new Error('Network error');
      vi.mocked(adminUserService.createAdminUser).mockRejectedValue(error);

      const { handleCreate } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      await handleCreate({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'admin',
      });

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Network error',
        })
      );
    });
  });

  describe('handleSave', () => {
    it('should save admin user successfully', async () => {
      const updatedAdmin = { ...mockAdmin, first_name: 'Jane' };
      vi.mocked(adminUserService.updateAdminUser).mockResolvedValue(updatedAdmin);

      const { handleSave, editDialogVisible, selectedAdminUser, openEditDialog } =
        useAdminUserModals({
          toast: mockToast,
          onReload: mockOnReload,
          currentRoleLevel: ref(2),
        });

      openEditDialog(mockAdmin);

      const formData = {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'admin' as const,
      };

      const result = await handleSave(formData);

      expect(adminUserService.updateAdminUser).toHaveBeenCalledWith(mockAdmin.id, formData);
      expect(mockOnReload).toHaveBeenCalledTimes(1);
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Admin user updated successfully',
        })
      );
      expect(editDialogVisible.value).toBe(false);
      expect(selectedAdminUser.value).toBeNull();
      expect(result).toEqual(updatedAdmin);
    });

    it('should return undefined if no admin selected', async () => {
      const { handleSave } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      const result = await handleSave({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'admin',
      });

      expect(result).toBeUndefined();
    });

    it('should handle errors', async () => {
      const error = new Error('Update failed');
      vi.mocked(adminUserService.updateAdminUser).mockRejectedValue(error);

      const { handleSave, openEditDialog } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      openEditDialog(mockAdmin);

      const result = await handleSave({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'admin',
      });

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Update failed',
        })
      );
      expect(result).toBeUndefined();
    });
  });

  describe('handleDelete', () => {
    it('should delete admin user successfully', async () => {
      vi.mocked(adminUserService.deleteAdminUser).mockResolvedValue(undefined);

      const { handleDelete, deleteDialogVisible, selectedAdminUser } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      await handleDelete(mockAdmin);

      expect(adminUserService.deleteAdminUser).toHaveBeenCalledWith(mockAdmin.id);
      expect(mockOnReload).toHaveBeenCalledTimes(1);
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Admin user deactivated successfully',
        })
      );
      expect(deleteDialogVisible.value).toBe(false);
      expect(selectedAdminUser.value).toBeNull();
    });

    it('should handle errors', async () => {
      const error = new Error('Delete failed');
      vi.mocked(adminUserService.deleteAdminUser).mockRejectedValue(error);

      const { handleDelete } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      await handleDelete(mockAdmin);

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Delete failed',
        })
      );
    });
  });

  describe('handleReactivate', () => {
    it('should reactivate admin user successfully', async () => {
      vi.mocked(adminUserService.restoreAdminUser).mockResolvedValue(mockAdmin);

      const { handleReactivate } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      await handleReactivate(mockAdmin);

      expect(adminUserService.restoreAdminUser).toHaveBeenCalledWith(mockAdmin.id);
      expect(mockOnReload).toHaveBeenCalledTimes(1);
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Admin user reactivated successfully',
        })
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Restore failed');
      vi.mocked(adminUserService.restoreAdminUser).mockRejectedValue(error);

      const { handleReactivate } = useAdminUserModals({
        toast: mockToast,
        onReload: mockOnReload,
        currentRoleLevel: ref(2),
      });

      await handleReactivate(mockAdmin);

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Restore failed',
        })
      );
    });
  });
});
