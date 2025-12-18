import { ref, type Ref } from 'vue';
import { useConfirm } from 'primevue/useconfirm';

/**
 * Callback function type for modal lifecycle events
 */
export type ModalCallback = () => void | Promise<void>;

/**
 * Options for configuring modal behavior
 */
export interface UseModalOptions {
  /**
   * Callback function executed when modal opens
   */
  onOpen?: ModalCallback;
  /**
   * Callback function executed when modal closes
   */
  onClose?: ModalCallback;
  /**
   * Whether to confirm before closing if there are unsaved changes
   * @default false
   */
  confirmClose?: boolean;
  /**
   * Function to check if there are unsaved changes
   * Only used when confirmClose is true
   */
  hasUnsavedChanges?: () => boolean;
  /**
   * Custom confirmation message
   * @default 'You have unsaved changes. Are you sure you want to close?'
   */
  confirmMessage?: string;
}

/**
 * Return type for useModal composable
 */
export interface UseModalReturn {
  /**
   * Reactive boolean indicating modal visibility state
   */
  visible: Ref<boolean>;
  /**
   * Opens the modal
   */
  openModal: () => Promise<void>;
  /**
   * Closes the modal
   * @param force - Force close without confirmation, even if confirmClose is enabled
   */
  closeModal: (force?: boolean) => Promise<void>;
  /**
   * Toggles the modal visibility
   */
  toggleModal: () => Promise<void>;
}

/**
 * Composable for managing modal visibility state and lifecycle
 *
 * This composable provides a standardized way to handle modal state management,
 * including open/close callbacks and optional confirmation for unsaved changes.
 *
 * @example Basic usage
 * ```typescript
 * const { visible, openModal, closeModal } = useModal();
 *
 * // In template
 * <Dialog :visible="visible" @update:visible="closeModal">
 *   ...
 * </Dialog>
 * ```
 *
 * @example With callbacks
 * ```typescript
 * const { visible, openModal, closeModal } = useModal({
 *   onOpen: () => {
 *     console.log('Modal opened');
 *     loadData();
 *   },
 *   onClose: () => {
 *     console.log('Modal closed');
 *     resetForm();
 *   }
 * });
 * ```
 *
 * @example With unsaved changes confirmation
 * ```typescript
 * const formData = ref({ name: '', email: '' });
 * const originalData = ref({ name: '', email: '' });
 *
 * const { visible, openModal, closeModal } = useModal({
 *   confirmClose: true,
 *   hasUnsavedChanges: () => {
 *     return JSON.stringify(formData.value) !== JSON.stringify(originalData.value);
 *   },
 *   confirmMessage: 'You have unsaved changes. Discard them?'
 * });
 * ```
 *
 * @param options - Configuration options for modal behavior
 * @returns Object with modal state and control methods
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const {
    onOpen,
    onClose,
    confirmClose = false,
    hasUnsavedChanges,
    confirmMessage = 'You have unsaved changes. Are you sure you want to close?',
  } = options;

  const visible = ref(false);
  const confirm = useConfirm();

  /**
   * Opens the modal and executes onOpen callback if provided
   */
  const openModal = async (): Promise<void> => {
    visible.value = true;

    if (onOpen) {
      await onOpen();
    }
  };

  /**
   * Closes the modal with optional confirmation for unsaved changes
   *
   * @param force - Force close without confirmation
   */
  const closeModal = async (force = false): Promise<void> => {
    // Check for unsaved changes if confirmClose is enabled and not forcing
    if (confirmClose && !force && hasUnsavedChanges && hasUnsavedChanges()) {
      // Use PrimeVue's confirm dialog instead of window.confirm
      return new Promise<void>((resolve) => {
        confirm.require({
          message: confirmMessage,
          header: 'Unsaved Changes',
          icon: 'pi pi-exclamation-triangle',
          acceptClass: 'p-button-danger',
          acceptLabel: 'Close Anyway',
          rejectLabel: 'Keep Editing',
          accept: async () => {
            visible.value = false;

            if (onClose) {
              await onClose();
            }
            resolve();
          },
          reject: () => {
            // User cancelled, keep modal open
            resolve();
          },
        });
      });
    }

    visible.value = false;

    if (onClose) {
      await onClose();
    }
  };

  /**
   * Toggles the modal visibility state
   */
  const toggleModal = async (): Promise<void> => {
    if (visible.value) {
      await closeModal();
    } else {
      await openModal();
    }
  };

  return {
    visible,
    openModal,
    closeModal,
    toggleModal,
  };
}

/**
 * Composable for managing multiple related modals (e.g., view, edit, delete)
 *
 * This is useful when you have a set of modals that work together, such as
 * viewing, editing, and deleting records.
 *
 * @example
 * ```typescript
 * const {
 *   view: { visible: viewVisible, openModal: openView, closeModal: closeView },
 *   edit: { visible: editVisible, openModal: openEdit, closeModal: closeEdit },
 *   delete: { visible: deleteVisible, openModal: openDelete, closeModal: closeDelete }
 * } = useModalGroup({
 *   view: {},
 *   edit: {
 *     onClose: () => resetEditForm()
 *   },
 *   delete: {
 *     onClose: () => selectedItem.value = null
 *   }
 * });
 * ```
 *
 * @param modals - Record of modal keys to their options
 * @returns Record of modal keys to their useModal return values
 */
export function useModalGroup<T extends Record<string, UseModalOptions>>(
  modals: T,
): Record<keyof T, UseModalReturn> {
  const modalGroup = {} as Record<keyof T, UseModalReturn>;

  for (const [key, options] of Object.entries(modals)) {
    modalGroup[key as keyof T] = useModal(options);
  }

  return modalGroup;
}
