import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useModal, useModalGroup } from './useModal';

// Mock PrimeVue's useConfirm
vi.mock('primevue/useconfirm', () => ({
  useConfirm: vi.fn(() => ({
    require: vi.fn(({ accept }) => {
      // Simulate user accepting by default
      if (accept) accept();
    }),
  })),
}));

describe('useModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should initialize with visible as false', () => {
      const { visible } = useModal();
      expect(visible.value).toBe(false);
    });

    it('should open modal', async () => {
      const { visible, openModal } = useModal();
      await openModal();
      expect(visible.value).toBe(true);
    });

    it('should close modal', async () => {
      const { visible, openModal, closeModal } = useModal();
      await openModal();
      await closeModal();
      expect(visible.value).toBe(false);
    });

    it('should toggle modal', async () => {
      const { visible, toggleModal } = useModal();
      expect(visible.value).toBe(false);

      await toggleModal();
      expect(visible.value).toBe(true);

      await toggleModal();
      expect(visible.value).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should execute onOpen callback', async () => {
      const onOpen = vi.fn();
      const { openModal } = useModal({ onOpen });

      await openModal();
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('should execute async onOpen callback', async () => {
      const onOpen = vi.fn().mockResolvedValue(undefined);
      const { openModal } = useModal({ onOpen });

      await openModal();
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('should execute onClose callback', async () => {
      const onClose = vi.fn();
      const { openModal, closeModal } = useModal({ onClose });

      await openModal();
      await closeModal();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should execute async onClose callback', async () => {
      const onClose = vi.fn().mockResolvedValue(undefined);
      const { openModal, closeModal } = useModal({ onClose });

      await openModal();
      await closeModal();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirm close', () => {
    it('should prompt for confirmation when confirmClose is true and has unsaved changes', async () => {
      const { useConfirm } = await import('primevue/useconfirm');
      const mockRequire = vi.fn(({ reject }) => {
        // Simulate user rejecting (keeping modal open)
        if (reject) reject();
      });
      vi.mocked(useConfirm).mockReturnValue({ require: mockRequire } as any);

      const hasUnsavedChanges = vi.fn().mockReturnValue(true);
      const { visible, openModal, closeModal } = useModal({
        confirmClose: true,
        hasUnsavedChanges,
      });

      await openModal();
      await closeModal();

      expect(mockRequire).toHaveBeenCalled();
      expect(visible.value).toBe(true); // Should remain open
    });

    it('should close if user confirms', async () => {
      const { useConfirm } = await import('primevue/useconfirm');
      const mockRequire = vi.fn(({ accept }) => {
        // Simulate user accepting (closing modal)
        if (accept) accept();
      });
      vi.mocked(useConfirm).mockReturnValue({ require: mockRequire } as any);

      const hasUnsavedChanges = vi.fn().mockReturnValue(true);
      const { visible, openModal, closeModal } = useModal({
        confirmClose: true,
        hasUnsavedChanges,
      });

      await openModal();
      await closeModal();

      expect(mockRequire).toHaveBeenCalled();
      expect(visible.value).toBe(false);
    });

    it('should not prompt if no unsaved changes', async () => {
      const { useConfirm } = await import('primevue/useconfirm');
      const mockRequire = vi.fn();
      vi.mocked(useConfirm).mockReturnValue({ require: mockRequire } as any);

      const hasUnsavedChanges = vi.fn().mockReturnValue(false);
      const { visible, openModal, closeModal } = useModal({
        confirmClose: true,
        hasUnsavedChanges,
      });

      await openModal();
      await closeModal();

      expect(mockRequire).not.toHaveBeenCalled();
      expect(visible.value).toBe(false);
    });

    it('should force close when force parameter is true', async () => {
      const { useConfirm } = await import('primevue/useconfirm');
      const mockRequire = vi.fn();
      vi.mocked(useConfirm).mockReturnValue({ require: mockRequire } as any);

      const hasUnsavedChanges = vi.fn().mockReturnValue(true);
      const { visible, openModal, closeModal } = useModal({
        confirmClose: true,
        hasUnsavedChanges,
      });

      await openModal();
      await closeModal(true); // Force close

      expect(mockRequire).not.toHaveBeenCalled();
      expect(visible.value).toBe(false);
    });

    it('should use custom confirm message', async () => {
      const { useConfirm } = await import('primevue/useconfirm');
      const customMessage = 'Custom confirmation message';
      const mockRequire = vi.fn(({ accept }) => {
        if (accept) accept();
      });
      vi.mocked(useConfirm).mockReturnValue({ require: mockRequire } as any);

      const hasUnsavedChanges = vi.fn().mockReturnValue(true);
      const { openModal, closeModal } = useModal({
        confirmClose: true,
        hasUnsavedChanges,
        confirmMessage: customMessage,
      });

      await openModal();
      await closeModal();

      expect(mockRequire).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage,
        }),
      );
    });
  });
});

describe('useModalGroup', () => {
  it('should create multiple modals', () => {
    const modals = useModalGroup({
      view: {},
      edit: {},
      delete: {},
    });

    expect(modals.view).toBeDefined();
    expect(modals.edit).toBeDefined();
    expect(modals.delete).toBeDefined();
  });

  it('should have independent states', async () => {
    const modals = useModalGroup({
      view: {},
      edit: {},
    });

    await modals.view.openModal();
    expect(modals.view.visible.value).toBe(true);
    expect(modals.edit.visible.value).toBe(false);

    await modals.edit.openModal();
    expect(modals.view.visible.value).toBe(true);
    expect(modals.edit.visible.value).toBe(true);
  });

  it('should execute individual callbacks', async () => {
    const viewOnClose = vi.fn();
    const editOnClose = vi.fn();

    const modals = useModalGroup({
      view: { onClose: viewOnClose },
      edit: { onClose: editOnClose },
    });

    await modals.view.openModal();
    await modals.view.closeModal();
    expect(viewOnClose).toHaveBeenCalledTimes(1);
    expect(editOnClose).not.toHaveBeenCalled();
  });
});
