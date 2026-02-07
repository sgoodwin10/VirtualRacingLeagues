import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@public/services/api';

vi.mock('@public/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('useRecaptcha', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset global window.grecaptcha
    (window as any).grecaptcha = undefined;

    // Reset the module state by clearing the cache
    vi.resetModules();
  });

  afterEach(() => {
    // Clean up any added script tags
    const scripts = document.querySelectorAll('script[src*="recaptcha"]');
    scripts.forEach((script) => script.remove());
  });

  it('returns null token when reCAPTCHA is disabled', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { enabled: false, siteKey: null } },
    });

    const { useRecaptcha } = await import('./useRecaptcha');
    const { executeRecaptcha } = useRecaptcha();
    const token = await executeRecaptcha('login');

    expect(token).toBeNull();
    expect(apiClient.get).toHaveBeenCalledWith('/recaptcha-config');
  });

  it('fetches config from API on first execution', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { enabled: false, siteKey: null } },
    });

    const { useRecaptcha } = await import('./useRecaptcha');
    const { executeRecaptcha } = useRecaptcha();
    await executeRecaptcha('login');

    expect(apiClient.get).toHaveBeenCalledWith('/recaptcha-config');
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('caches config and does not refetch on subsequent calls', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { enabled: false, siteKey: null } },
    });

    const { useRecaptcha } = await import('./useRecaptcha');
    const { executeRecaptcha } = useRecaptcha();

    // Call twice
    await executeRecaptcha('login');
    await executeRecaptcha('register');

    // Should only fetch config once
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('handles API error gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

    const { useRecaptcha } = await import('./useRecaptcha');
    const { executeRecaptcha } = useRecaptcha();
    const token = await executeRecaptcha('register');

    expect(token).toBeNull();
  });

  it('checks if reCAPTCHA is enabled', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { enabled: true, siteKey: 'test-key' } },
    });

    const { useRecaptcha } = await import('./useRecaptcha');
    const { isEnabled } = useRecaptcha();
    const enabled = await isEnabled();

    expect(enabled).toBe(true);
  });

  it('returns false when checking if disabled', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { enabled: false, siteKey: null } },
    });

    const { useRecaptcha } = await import('./useRecaptcha');
    const { isEnabled } = useRecaptcha();
    const enabled = await isEnabled();

    expect(enabled).toBe(false);
  });
});
