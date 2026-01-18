import { ref, type Ref } from 'vue';

export interface UseLoadingStateReturn {
  isLoading: Ref<boolean>;
  loadingMessage: Ref<string | undefined>;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

/**
 * Composable for managing loading states
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { isLoading, loadingMessage, withLoading } = useLoadingState();
 *
 * const fetchData = () => withLoading(
 *   async () => {
 *     const data = await api.getData();
 *     return data;
 *   },
 *   'Loading race results...'
 * );
 * </script>
 *
 * <template>
 *   <VrlLoadingOverlay :visible="isLoading" :message="loadingMessage" />
 * </template>
 * ```
 */
export function useLoadingState(): UseLoadingStateReturn {
  const isLoading = ref(false);
  const loadingMessage = ref<string | undefined>(undefined);

  const startLoading = (message?: string): void => {
    isLoading.value = true;
    loadingMessage.value = message;
  };

  const stopLoading = (): void => {
    isLoading.value = false;
    loadingMessage.value = undefined;
  };

  const withLoading = async <T>(fn: () => Promise<T>, message?: string): Promise<T> => {
    try {
      startLoading(message);
      return await fn();
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
  };
}
