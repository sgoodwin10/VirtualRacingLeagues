import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDriverInfo } from '../useDriverInfo';
import { publicApi } from '@public/services/publicApi';
import type { PublicDriverProfile } from '@public/types/public';

// Mock the publicApi service
vi.mock('@public/services/publicApi', () => ({
  publicApi: {
    fetchDriverProfile: vi.fn(),
  },
}));

describe('useDriverInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDriverProfile: PublicDriverProfile = {
    nickname: 'TestDriver',
    driver_number: 44,
    platform_accounts: {
      psn_id: 'test_psn',
      discord_id: 'test_discord#1234',
      iracing_id: 'test_iracing',
    },
    career_stats: {
      total_poles: 5,
      total_podiums: 12,
    },
    competitions: [
      {
        league_name: 'Test League',
        league_slug: 'test-league',
        season_name: 'Season 1',
        season_slug: 'season-1',
        status: 'active',
      },
    ],
  };

  it('initializes with default values', () => {
    const { driver, isLoading, error } = useDriverInfo();

    expect(driver.value).toBeNull();
    expect(isLoading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('fetches driver profile successfully', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const { driver, isLoading, error, fetchDriver } = useDriverInfo();

    const promise = fetchDriver(123);

    // Loading state should be true during fetch
    expect(isLoading.value).toBe(true);
    expect(error.value).toBeNull();

    await promise;

    // Data should be populated after fetch
    expect(driver.value).toEqual(mockDriverProfile);
    expect(isLoading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(publicApi.fetchDriverProfile).toHaveBeenCalledWith(123, expect.any(AbortSignal));
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Failed to fetch driver profile';
    vi.mocked(publicApi.fetchDriverProfile).mockRejectedValue(new Error(errorMessage));

    const { driver, isLoading, error, fetchDriver } = useDriverInfo();

    await fetchDriver(123);

    expect(driver.value).toBeNull();
    expect(isLoading.value).toBe(false);
    expect(error.value).toBe(errorMessage);
  });

  it('handles abort errors silently', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    vi.mocked(publicApi.fetchDriverProfile).mockRejectedValue(abortError);

    const { driver, isLoading, error, fetchDriver } = useDriverInfo();

    await fetchDriver(123);

    // Should not set error for abort errors
    expect(driver.value).toBeNull();
    expect(isLoading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('aborts pending request when new request is made', async () => {
    let firstResolve: (value: PublicDriverProfile) => void;
    const firstPromise = new Promise<PublicDriverProfile>((resolve) => {
      firstResolve = resolve;
    });

    vi.mocked(publicApi.fetchDriverProfile).mockReturnValueOnce(firstPromise);

    const { fetchDriver } = useDriverInfo();

    // Start first request
    const promise1 = fetchDriver(123);

    // Start second request before first completes
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValueOnce(mockDriverProfile);
    const promise2 = fetchDriver(456);

    // Resolve first promise (should be ignored due to abort)
    firstResolve!(mockDriverProfile);

    await Promise.all([promise1, promise2]);

    // Should have called fetchDriverProfile twice
    expect(publicApi.fetchDriverProfile).toHaveBeenCalledTimes(2);
  });

  it('resets state correctly', () => {
    const { driver, isLoading, error, reset } = useDriverInfo();

    // Set some values
    driver.value = mockDriverProfile;
    isLoading.value = true;
    error.value = 'Some error';

    reset();

    expect(driver.value).toBeNull();
    expect(isLoading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('clears error when fetching again', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockRejectedValueOnce(new Error('First error'));

    const { error, fetchDriver } = useDriverInfo();

    await fetchDriver(123);
    expect(error.value).toBe('First error');

    // Fetch again successfully
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValueOnce(mockDriverProfile);
    await fetchDriver(456);

    expect(error.value).toBeNull();
  });

  it('handles driver with null driver_number', async () => {
    const driverWithoutNumber: PublicDriverProfile = {
      ...mockDriverProfile,
      driver_number: null,
    };
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(driverWithoutNumber);

    const { driver, fetchDriver } = useDriverInfo();

    await fetchDriver(123);

    expect(driver.value?.driver_number).toBeNull();
  });

  it('handles driver with empty platform accounts', async () => {
    const driverWithoutAccounts: PublicDriverProfile = {
      ...mockDriverProfile,
      platform_accounts: {},
    };
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(driverWithoutAccounts);

    const { driver, fetchDriver } = useDriverInfo();

    await fetchDriver(123);

    expect(driver.value?.platform_accounts).toEqual({});
  });

  it('handles driver with empty competitions', async () => {
    const driverWithoutCompetitions: PublicDriverProfile = {
      ...mockDriverProfile,
      competitions: [],
    };
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(driverWithoutCompetitions);

    const { driver, fetchDriver } = useDriverInfo();

    await fetchDriver(123);

    expect(driver.value?.competitions).toEqual([]);
  });
});
