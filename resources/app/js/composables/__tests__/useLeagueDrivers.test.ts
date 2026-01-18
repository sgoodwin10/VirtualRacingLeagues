import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useLeagueDrivers } from '../useLeagueDrivers';
import { useDriverStore } from '@app/stores/driverStore';
import * as driverService from '@app/services/driverService';
import type { PaginatedDriversResponse } from '@app/types/driver';

vi.mock('@app/services/driverService', () => ({
  getLeagueDrivers: vi.fn(),
  createDriver: vi.fn(),
  updateDriver: vi.fn(),
  removeDriverFromLeague: vi.fn(),
  importDriversFromCSV: vi.fn(),
  getLeagueDriver: vi.fn(),
}));

const mockDriverResponse: PaginatedDriversResponse = {
  data: [
    {
      id: 1,
      driver_id: 10,
      league_id: 1,
      status: 'active',
      driver_number: 1,
      league_notes: null,
      added_to_league_at: '2024-01-01T00:00:00Z',
      driver: {
        id: 10,
        display_name: 'Test Driver',
        first_name: 'Test',
        last_name: 'Driver',
        nickname: null,
        discord_id: null,
        email: 'test@example.com',
        phone: null,
        psn_id: null,
        iracing_id: null,
        iracing_customer_id: null,
        primary_platform_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
  ],
  meta: {
    current_page: 1,
    from: 1,
    to: 1,
    last_page: 1,
    per_page: 15,
    total: 1,
  },
};

describe('useLeagueDrivers', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const leagueId = ref(1);
    const { searchQuery, isLoading } = useLeagueDrivers(leagueId);

    expect(searchQuery.value).toBe('');
    expect(isLoading.value).toBe(false);
  });

  it.skip('loads drivers on mount', async () => {
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const driverStore = useDriverStore();
    const { loadDrivers } = useLeagueDrivers(leagueId);

    await loadDrivers();

    expect(driverService.getLeagueDrivers).toHaveBeenCalledWith(1, expect.any(Object));
    expect(driverStore.drivers).toHaveLength(1);
    expect(driverStore.drivers[0]?.driver?.display_name).toBe('Test Driver');
  });

  it('sets loading state during driver fetch', async () => {
    vi.mocked(driverService.getLeagueDrivers).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockDriverResponse), 100)),
    );

    const leagueId = ref(1);
    const { loadDrivers, isLoading } = useLeagueDrivers(leagueId);

    const loadPromise = loadDrivers();
    expect(isLoading.value).toBe(true);

    await loadPromise;
    expect(isLoading.value).toBe(false);
  });

  it('calls onError callback when load fails', async () => {
    vi.mocked(driverService.getLeagueDrivers).mockRejectedValue(new Error('Network error'));

    const leagueId = ref(1);
    const onError = vi.fn();
    const { loadDrivers } = useLeagueDrivers(leagueId, { onError });

    await expect(loadDrivers()).rejects.toThrow('Network error');
    expect(onError).toHaveBeenCalledWith('Failed to load drivers');
  });

  it('adds a driver successfully', async () => {
    const mockDriver = mockDriverResponse.data[0]!;
    vi.mocked(driverService.createDriver).mockResolvedValue(mockDriver);
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const onSuccess = vi.fn();
    const { addDriver } = useLeagueDrivers(leagueId, { onSuccess });

    await addDriver({
      first_name: 'Test',
      last_name: 'Driver',
      driver_number: 1,
    });

    expect(driverService.createDriver).toHaveBeenCalledWith(1, expect.any(Object));
    expect(onSuccess).toHaveBeenCalledWith('Driver added successfully');
  });

  it('calls onError callback when add fails', async () => {
    vi.mocked(driverService.createDriver).mockRejectedValue(new Error('Creation failed'));

    const leagueId = ref(1);
    const onError = vi.fn();
    const { addDriver } = useLeagueDrivers(leagueId, { onError });

    await expect(
      addDriver({
        first_name: 'Test',
        last_name: 'Driver',
        driver_number: 1,
      }),
    ).rejects.toThrow('Creation failed');

    expect(onError).toHaveBeenCalledWith('Creation failed');
  });

  it('updates a driver successfully', async () => {
    const mockDriver = mockDriverResponse.data[0]!;
    vi.mocked(driverService.updateDriver).mockResolvedValue(mockDriver);
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const onSuccess = vi.fn();
    const { updateDriver } = useLeagueDrivers(leagueId, { onSuccess });

    await updateDriver(10, {
      first_name: 'Updated',
      last_name: 'Driver',
      driver_number: 2,
    });

    expect(driverService.updateDriver).toHaveBeenCalledWith(1, 10, expect.any(Object));
    expect(onSuccess).toHaveBeenCalledWith('Driver updated successfully');
  });

  it('calls onError callback when update fails', async () => {
    vi.mocked(driverService.updateDriver).mockRejectedValue(new Error('Update failed'));

    const leagueId = ref(1);
    const onError = vi.fn();
    const { updateDriver } = useLeagueDrivers(leagueId, { onError });

    await expect(
      updateDriver(10, {
        first_name: 'Updated',
        last_name: 'Driver',
        driver_number: 2,
      }),
    ).rejects.toThrow('Update failed');

    expect(onError).toHaveBeenCalledWith('Update failed');
  });

  it('removes a driver successfully', async () => {
    vi.mocked(driverService.removeDriverFromLeague).mockResolvedValue();
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const onSuccess = vi.fn();
    const { removeDriver } = useLeagueDrivers(leagueId, { onSuccess });

    await removeDriver(10);

    expect(driverService.removeDriverFromLeague).toHaveBeenCalledWith(1, 10);
    expect(onSuccess).toHaveBeenCalledWith('Driver removed from league');
  });

  it('calls onError callback when remove fails', async () => {
    vi.mocked(driverService.removeDriverFromLeague).mockRejectedValue(new Error('Remove failed'));

    const leagueId = ref(1);
    const onError = vi.fn();
    const { removeDriver } = useLeagueDrivers(leagueId, { onError });

    await expect(removeDriver(10)).rejects.toThrow('Remove failed');
    expect(onError).toHaveBeenCalledWith('Failed to remove driver');
  });

  it('imports drivers from CSV successfully', async () => {
    const mockImportResult = {
      success_count: 2,
      skipped_count: 0,
      errors: [],
    };
    vi.mocked(driverService.importDriversFromCSV).mockResolvedValue(mockImportResult);
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const onSuccess = vi.fn();
    const { importFromCSV } = useLeagueDrivers(leagueId, { onSuccess });

    const result = await importFromCSV('name,number\nJohn,1\nJane,2');

    expect(driverService.importDriversFromCSV).toHaveBeenCalledWith(
      1,
      'name,number\nJohn,1\nJane,2',
    );
    expect(result.success_count).toBe(2);
    expect(result.errors).toHaveLength(0);
    expect(onSuccess).toHaveBeenCalledWith('Successfully imported 2 drivers');
  });

  it('handles partial CSV import with errors', async () => {
    const mockImportResult = {
      success_count: 1,
      skipped_count: 0,
      errors: [{ row: 2, message: 'Invalid data' }],
    };
    vi.mocked(driverService.importDriversFromCSV).mockResolvedValue(mockImportResult);
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const onError = vi.fn();
    const { importFromCSV } = useLeagueDrivers(leagueId, { onError });

    const result = await importFromCSV('name,number\nJohn,1\nInvalid');

    expect(result.success_count).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith('Imported 1 driver with 1 error');
  });

  it('handles singular driver text in CSV import', async () => {
    const mockImportResult = {
      success_count: 1,
      skipped_count: 0,
      errors: [],
    };
    vi.mocked(driverService.importDriversFromCSV).mockResolvedValue(mockImportResult);
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const onSuccess = vi.fn();
    const { importFromCSV } = useLeagueDrivers(leagueId, { onSuccess });

    await importFromCSV('name,number\nJohn,1');

    expect(onSuccess).toHaveBeenCalledWith('Successfully imported 1 driver');
  });

  it('updates search query and triggers load', async () => {
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const { searchQuery } = useLeagueDrivers(leagueId);

    searchQuery.value = 'test';

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(driverService.getLeagueDrivers).toHaveBeenCalled();
  });

  it('watches status filter changes', async () => {
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const driverStore = useDriverStore();
    useLeagueDrivers(leagueId);

    driverStore.statusFilter = 'active';

    // Wait for watcher
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(driverService.getLeagueDrivers).toHaveBeenCalled();
  });

  it('watches page changes', async () => {
    vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriverResponse);

    const leagueId = ref(1);
    const driverStore = useDriverStore();
    useLeagueDrivers(leagueId);

    driverStore.currentPage = 2;

    // Wait for watcher
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(driverService.getLeagueDrivers).toHaveBeenCalled();
  });
});
