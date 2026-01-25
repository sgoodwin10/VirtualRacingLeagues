import { ref, type Ref } from 'vue';

/**
 * VRL Velocity Modal Composable
 *
 * Provides programmatic modal management with state control.
 * Can be used for simple show/hide logic or as part of a modal registry.
 *
 * @example
 * ```typescript
 * // Simple usage
 * const { isOpen, open, close, toggle } = useModal();
 *
 * // With initial state
 * const { isOpen, open, close } = useModal(true);
 * ```
 */

export interface UseModalReturn {
  /** Reactive visibility state */
  isOpen: Ref<boolean>;

  /** Open the modal */
  open: () => void;

  /** Close the modal */
  close: () => void;

  /** Toggle the modal visibility */
  toggle: () => void;
}

/**
 * Simple modal state composable
 *
 * @param initialState - Initial visibility state (default: false)
 * @returns Modal control methods and state
 */
export function useModal(initialState = false): UseModalReturn {
  const isOpen = ref(initialState);

  const open = (): void => {
    isOpen.value = true;
  };

  const close = (): void => {
    isOpen.value = false;
  };

  const toggle = (): void => {
    isOpen.value = !isOpen.value;
  };

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Modal Registry for managing multiple modals programmatically
 */

interface ModalRegistryState {
  [key: string]: {
    isOpen: boolean;
    data?: unknown;
  };
}

const modalRegistry = ref<ModalRegistryState>({});

export interface UseModalRegistryReturn {
  /** Open a modal by ID with optional data */
  openModal: (id: string, data?: unknown) => void;

  /** Close a modal by ID */
  closeModal: (id: string) => void;

  /** Toggle a modal by ID */
  toggleModal: (id: string) => void;

  /** Check if a modal is open */
  isModalOpen: (id: string) => boolean;

  /** Get modal data */
  getModalData: <T = unknown>(id: string) => T | undefined;

  /** Close all modals */
  closeAllModals: () => void;
}

/**
 * Modal registry composable for managing multiple modals
 *
 * @example
 * ```typescript
 * const { openModal, closeModal, isModalOpen } = useModalRegistry();
 *
 * // Open modal with data
 * openModal('confirmDelete', { userId: 123 });
 *
 * // Check if open
 * if (isModalOpen('confirmDelete')) {
 *   const data = getModalData('confirmDelete');
 * }
 *
 * // Close specific modal
 * closeModal('confirmDelete');
 * ```
 */
export function useModalRegistry(): UseModalRegistryReturn {
  const openModal = (id: string, data?: unknown): void => {
    modalRegistry.value[id] = {
      isOpen: true,
      data,
    };
  };

  const closeModal = (id: string): void => {
    const modal = modalRegistry.value[id];
    if (modal) {
      modal.isOpen = false;
      modal.data = undefined;
    }
  };

  const toggleModal = (id: string): void => {
    const modal = modalRegistry.value[id];
    if (modal) {
      modal.isOpen = !modal.isOpen;
    } else {
      modalRegistry.value[id] = { isOpen: true };
    }
  };

  const isModalOpen = (id: string): boolean => {
    return modalRegistry.value[id]?.isOpen ?? false;
  };

  const getModalData = <T = unknown>(id: string): T | undefined => {
    return modalRegistry.value[id]?.data as T | undefined;
  };

  const closeAllModals = (): void => {
    Object.keys(modalRegistry.value).forEach((id) => {
      const modal = modalRegistry.value[id];
      if (modal) {
        modal.isOpen = false;
        modal.data = undefined;
      }
    });
  };

  return {
    openModal,
    closeModal,
    toggleModal,
    isModalOpen,
    getModalData,
    closeAllModals,
  };
}
