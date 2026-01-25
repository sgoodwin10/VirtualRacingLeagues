/**
 * useVrlConfirm Composable
 * Provides a declarative confirmation dialog pattern using VrlConfirmDialog component
 */

import { ref } from 'vue';
import type { Ref, Component } from 'vue';

export interface VrlConfirmOptions {
  /** Dialog header text */
  header?: string;
  /** Main message content */
  message?: string;
  /** Icon component to display (Phosphor icon) */
  icon?: Component;
  /** Icon color (CSS color value or CSS variable) */
  iconColor?: string;
  /** Icon background color (CSS color value or CSS variable) */
  iconBgColor?: string;
  /** Confirm button label */
  acceptLabel?: string;
  /** Cancel button label */
  rejectLabel?: string;
  /** Confirm button variant */
  acceptVariant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';
  /** Cancel button variant */
  rejectVariant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';
  /** Callback when confirmed */
  onAccept: () => void | Promise<void>;
  /** Callback when rejected */
  onReject?: () => void;
  /** Whether to show the dialog as modal */
  modal?: boolean;
  /** Whether dialog can be closed with X button */
  closable?: boolean;
  /** Whether clicking outside closes the dialog */
  dismissableMask?: boolean;
}

export interface UseVrlConfirmReturn {
  /** Whether the dialog is currently visible */
  isVisible: Ref<boolean>;
  /** Current dialog options */
  options: Ref<VrlConfirmOptions | null>;
  /** Whether an action is being processed */
  isLoading: Ref<boolean>;
  /** Show the confirmation dialog with the given options */
  showConfirmation: (options: VrlConfirmOptions) => void;
  /** Close the dialog */
  close: () => void;
  /** Handle accept action */
  handleAccept: () => Promise<void>;
  /** Handle reject action */
  handleReject: () => void;
}

/**
 * Composable for managing VRL confirmation dialogs
 * @returns Object containing reactive state and methods for confirmation dialogs
 *
 * @example
 * const { isVisible, options, isLoading, showConfirmation, handleAccept, handleReject } = useVrlConfirm();
 *
 * function handleDelete() {
 *   showConfirmation({
 *     header: 'Delete Item',
 *     message: 'Are you sure you want to delete this item?',
 *     icon: PhTrash,
 *     iconColor: 'var(--red)',
 *     iconBgColor: 'var(--red-dim)',
 *     acceptLabel: 'Delete',
 *     acceptVariant: 'danger',
 *     onAccept: async () => {
 *       await deleteItem();
 *     }
 *   });
 * }
 *
 * // In template:
 * <VrlConfirmDialog
 *   v-model:visible="isVisible"
 *   v-bind="options"
 *   :loading="isLoading"
 *   @accept="handleAccept"
 *   @reject="handleReject"
 * />
 */
export function useVrlConfirm(): UseVrlConfirmReturn {
  const isVisible = ref(false);
  const options = ref<VrlConfirmOptions | null>(null);
  const isLoading = ref(false);

  /**
   * Show a confirmation dialog
   * @param confirmOptions - Configuration options for the confirmation dialog
   */
  function showConfirmation(confirmOptions: VrlConfirmOptions): void {
    // Prevent duplicate dialogs
    if (isVisible.value) {
      return;
    }

    options.value = confirmOptions;
    isVisible.value = true;
  }

  /**
   * Close the dialog
   */
  function close(): void {
    isVisible.value = false;
    isLoading.value = false;
  }

  /**
   * Handle accept action
   */
  async function handleAccept(): Promise<void> {
    if (!options.value) return;

    isLoading.value = true;

    try {
      await options.value.onAccept();
      close();
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Handle reject action
   */
  function handleReject(): void {
    if (!options.value) return;

    options.value.onReject?.();
    close();
  }

  return {
    isVisible,
    options,
    isLoading,
    showConfirmation,
    close,
    handleAccept,
    handleReject,
  };
}
