/**
 * useCrudStore Composable
 * Generic CRUD store pattern for managing entity collections
 * Eliminates duplicate code across all entity stores
 */

import { ref, readonly, type Ref } from 'vue';

export interface UseCrudStoreReturn<T extends { id: number }> {
  items: Ref<T[]>;
  currentItem: Ref<T | null>;
  loading: Readonly<Ref<boolean>>;
  loadingOperations: Readonly<Ref<Record<string, boolean>>>;
  error: Readonly<Ref<string | null>>;
  setLoading: (value: boolean) => void;
  setOperationLoading: (operation: string, value: boolean) => void;
  isOperationLoading: (operation: string) => boolean;
  setError: (message: string | null) => void;
  setItems: (newItems: T[]) => void;
  setCurrentItem: (item: T | null) => void;
  addItem: (item: T) => void;
  updateItemInList: (updatedItem: T) => void;
  removeItemFromList: (itemId: number) => void;
  clearError: () => void;
  resetStore: () => void;
}

/**
 * Composable for managing CRUD operations on entity collections
 * @returns Object containing reactive state and methods for CRUD operations
 *
 * @example
 * const crud = useCrudStore<League>();
 *
 * // Add item after API call
 * const league = await createLeague(data);
 * crud.addItem(league);
 *
 * // Update item in list
 * const updated = await updateLeague(id, data);
 * crud.updateItemInList(updated);
 *
 * // Remove item from list
 * await deleteLeague(id);
 * crud.removeItemFromList(id);
 *
 * // Use operation-specific loading states
 * crud.setOperationLoading('create', true);
 * // ... perform operation
 * crud.setOperationLoading('create', false);
 */
export function useCrudStore<T extends { id: number }>(): UseCrudStoreReturn<T> {
  const items = ref<T[]>([]) as Ref<T[]>;
  const currentItem = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const loadingOperations = ref<Record<string, boolean>>({});
  const error = ref<string | null>(null);

  /**
   * Set loading state
   * @param value - Loading state
   */
  function setLoading(value: boolean): void {
    loading.value = value;
  }

  /**
   * Set loading state for a specific operation
   * @param operation - Operation name (e.g., 'create', 'update', 'delete')
   * @param value - Loading state
   */
  function setOperationLoading(operation: string, value: boolean): void {
    if (value) {
      loadingOperations.value[operation] = true;
    } else {
      delete loadingOperations.value[operation];
    }
  }

  /**
   * Check if a specific operation is loading
   * @param operation - Operation name
   * @returns true if operation is loading
   */
  function isOperationLoading(operation: string): boolean {
    return loadingOperations.value[operation] || false;
  }

  /**
   * Set error message
   * @param message - Error message or null to clear
   */
  function setError(message: string | null): void {
    error.value = message;
  }

  /**
   * Replace all items with new array
   * @param newItems - Array of items to set
   */
  function setItems(newItems: T[]): void {
    items.value = newItems;
  }

  /**
   * Set the current item
   * Always uses the provided item for maximum flexibility
   * @param item - Item to set as current or null to clear
   */
  function setCurrentItem(item: T | null): void {
    currentItem.value = item;
  }

  /**
   * Add a new item to the collection
   * @param item - Item to add
   */
  function addItem(item: T): void {
    items.value.push(item);
  }

  /**
   * Update an existing item in the collection
   * Also updates currentItem if it matches the updated item
   * @param updatedItem - Updated item
   */
  function updateItemInList(updatedItem: T): void {
    const index = items.value.findIndex((i) => i.id === updatedItem.id);
    if (index !== -1) {
      // Use splice for guaranteed reactivity
      items.value.splice(index, 1, updatedItem);
    }

    // Update current item if it's the one being edited
    if (currentItem.value?.id === updatedItem.id) {
      currentItem.value = updatedItem;
    }
  }

  /**
   * Remove an item from the collection
   * Also clears currentItem if it matches the removed item
   * @param itemId - ID of the item to remove
   */
  function removeItemFromList(itemId: number): void {
    items.value = items.value.filter((i) => i.id !== itemId);

    // Clear current item if it was the one removed
    if (currentItem.value?.id === itemId) {
      currentItem.value = null;
    }
  }

  /**
   * Clear the error message
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Reset the store to initial state
   */
  function resetStore(): void {
    items.value = [];
    currentItem.value = null;
    loading.value = false;
    loadingOperations.value = {};
    error.value = null;
  }

  return {
    items,
    currentItem,
    loading: readonly(loading),
    loadingOperations: readonly(loadingOperations),
    error: readonly(error),
    setLoading,
    setOperationLoading,
    isOperationLoading,
    setError,
    setItems,
    setCurrentItem,
    addItem,
    updateItemInList,
    removeItemFromList,
    clearError,
    resetStore,
  };
}
