import { ref, type Ref, watch } from 'vue';
import { useDriverStore } from '@app/stores/driverStore';
import { useDebouncedSearch } from '@app/composables/useDebouncedSearch';
import type { CreateDriverRequest } from '@app/types/driver';

export interface UseLeagueDriversOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useLeagueDrivers(leagueId: Ref<number>, options: UseLeagueDriversOptions = {}) {
  const driverStore = useDriverStore();
  const searchQuery = ref('');
  const isLoading = ref(false);

  // Setup debounced search
  const { isSearching } = useDebouncedSearch(searchQuery, async (query, signal) => {
    driverStore.setSearchQuery(query);
    await loadDrivers(signal);
  });

  // Watch for status filter changes
  watch(
    () => driverStore.statusFilter,
    () => {
      loadDrivers();
    },
  );

  // Watch for page changes
  watch(
    () => driverStore.currentPage,
    () => {
      loadDrivers();
    },
  );

  async function loadDrivers(signal?: AbortSignal): Promise<void> {
    isLoading.value = true;
    try {
      await driverStore.fetchLeagueDrivers(leagueId.value, undefined, signal);
    } catch (error) {
      options.onError?.('Failed to load drivers');
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function addDriver(data: CreateDriverRequest): Promise<void> {
    try {
      await driverStore.createNewDriver(leagueId.value, data);
      options.onSuccess?.('Driver added successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add driver';
      options.onError?.(message);
      throw error;
    }
  }

  async function updateDriver(driverId: number, data: CreateDriverRequest): Promise<void> {
    try {
      await driverStore.updateDriver(leagueId.value, driverId, data);
      options.onSuccess?.('Driver updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update driver';
      options.onError?.(message);
      throw error;
    }
  }

  async function removeDriver(driverId: number): Promise<void> {
    try {
      await driverStore.removeDriver(leagueId.value, driverId);
      options.onSuccess?.('Driver removed from league');
    } catch (error) {
      options.onError?.('Failed to remove driver');
      throw error;
    }
  }

  interface ImportResult {
    success_count: number;
    skipped_count: number;
    errors: Array<{ row: number; message: string }>;
  }

  async function importFromCSV(csvData: string): Promise<ImportResult> {
    const result = await driverStore.importCSV(leagueId.value, csvData);

    if (result.errors.length === 0) {
      const message =
        result.success_count === 1
          ? 'Successfully imported 1 driver'
          : `Successfully imported ${result.success_count} drivers`;
      options.onSuccess?.(message);
    } else if (result.success_count > 0) {
      const message = `Imported ${result.success_count} driver${result.success_count === 1 ? '' : 's'} with ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`;
      options.onError?.(message);
    }

    return result;
  }

  return {
    // State
    drivers: driverStore.drivers,
    searchQuery,
    selectedStatus: driverStore.statusFilter,
    isLoading,
    isSearching,

    // Methods
    loadDrivers,
    addDriver,
    updateDriver,
    removeDriver,
    importFromCSV,
  };
}
