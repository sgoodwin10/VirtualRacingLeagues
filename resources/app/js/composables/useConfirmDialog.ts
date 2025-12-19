/**
 * useConfirmDialog Composable
 * Provides a reusable confirmation dialog pattern with duplicate prevention
 */

import { ref } from 'vue';
import type { Ref } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import type { ConfirmationOptions } from 'primevue/confirmationoptions';

export interface ConfirmDialogOptions {
  message: string;
  header: string;
  icon?: string;
  acceptClass?: string;
  onAccept: () => void | Promise<void>;
  onReject?: () => void;
}

export interface UseConfirmDialogReturn {
  isOpen: Ref<boolean>;
  showConfirmation: (options: ConfirmDialogOptions) => void;
}

/**
 * Composable for managing confirmation dialogs with duplicate prevention
 * @returns Object containing reactive state and methods for confirmation dialogs
 *
 * @example
 * const { showConfirmation } = useConfirmDialog();
 *
 * function handleDelete() {
 *   showConfirmation({
 *     message: 'Are you sure you want to delete this item?',
 *     header: 'Delete Item',
 *     icon: 'pi pi-exclamation-triangle',
 *     acceptClass: 'p-button-danger',
 *     onAccept: async () => {
 *       await deleteItem();
 *     }
 *   });
 * }
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const confirm = useConfirm();
  const isOpen = ref(false);

  /**
   * Show a confirmation dialog
   * Prevents duplicate dialogs from opening
   * @param options - Configuration options for the confirmation dialog
   */
  function showConfirmation(options: ConfirmDialogOptions): void {
    // Prevent duplicate dialogs
    if (isOpen.value) {
      return;
    }

    isOpen.value = true;

    const confirmOptions: ConfirmationOptions = {
      message: options.message,
      header: options.header,
      icon: options.icon || 'pi pi-exclamation-triangle',
      acceptClass: options.acceptClass || 'p-button-danger',
      accept: async () => {
        try {
          await options.onAccept();
        } finally {
          isOpen.value = false;
        }
      },
      reject: async () => {
        try {
          await options.onReject?.();
        } finally {
          isOpen.value = false;
        }
      },
      onHide: () => {
        isOpen.value = false;
      },
    };

    confirm.require(confirmOptions);
  }

  return {
    isOpen,
    showConfirmation,
  };
}
