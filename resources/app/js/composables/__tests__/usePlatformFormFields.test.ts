import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePlatformFormFields } from '../usePlatformFormFields';

// Mock the stores and PrimeVue
vi.mock('@app/stores/leagueStore', () => ({
  useLeagueStore: () => ({
    fetchDriverFormFieldsForLeague: vi.fn(),
  }),
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('usePlatformFormFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide fetchPlatformFormFields method', () => {
    const { fetchPlatformFormFields } = usePlatformFormFields({
      leagueId: 123,
    });

    expect(fetchPlatformFormFields).toBeDefined();
    expect(typeof fetchPlatformFormFields).toBe('function');
  });

  it('should call onSuccess callback when fetch succeeds', async () => {
    const onSuccess = vi.fn();

    const { fetchPlatformFormFields } = usePlatformFormFields({
      leagueId: 123,
      onSuccess,
    });

    await fetchPlatformFormFields();

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
