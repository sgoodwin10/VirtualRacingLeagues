import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '@admin/services/api';

// Mock the api service
vi.mock('@admin/services/api', () => ({
  apiService: {
    get: vi.fn(),
  },
}));

describe('useRecaptcha', () => {
  let mockGreacaptcha: any;
  let useRecaptcha: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset modules to clear the shared state
    vi.resetModules();

    // Re-import the composable after resetting modules
    const module = await import('./useRecaptcha');
    useRecaptcha = module.useRecaptcha;

    // Mock grecaptcha
    mockGreacaptcha = {
      ready: vi.fn((callback: () => void) => callback()),
      execute: vi.fn(),
    };
    (window as any).grecaptcha = mockGreacaptcha;

    // Clear any existing scripts
    document.querySelectorAll('script[src*="recaptcha"]').forEach((el) => el.remove());
  });

  afterEach(() => {
    delete (window as any).grecaptcha;
  });

  describe('fetchConfig', () => {
    it('should fetch reCAPTCHA config from API', async () => {
      const mockConfig = {
        enabled: true,
        siteKey: 'test-site-key',
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockConfig,
      });

      const { isEnabled } = useRecaptcha();
      const enabled = await isEnabled();

      expect(apiService.get).toHaveBeenCalledWith('/api/recaptcha-config');
      expect(enabled).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(apiService.get).mockRejectedValue(new Error('API error'));

      const { isEnabled } = useRecaptcha();
      const enabled = await isEnabled();

      expect(enabled).toBe(false);
    });

    it('should cache config after first fetch', async () => {
      const mockConfig = {
        enabled: true,
        siteKey: 'test-site-key',
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockConfig,
      });

      const { isEnabled } = useRecaptcha();
      await isEnabled();
      await isEnabled();

      // Should only call API once
      expect(apiService.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadScript', () => {
    it('should not load script when reCAPTCHA is disabled', async () => {
      const mockConfig = {
        enabled: false,
        siteKey: null,
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockConfig,
      });

      const { loadScript } = useRecaptcha();
      await loadScript();

      const script = document.querySelector('script[src*="recaptcha"]');
      expect(script).toBeNull();
    });
  });

  describe('executeRecaptcha', () => {
    it('should execute reCAPTCHA and return token', async () => {
      const mockConfig = {
        enabled: true,
        siteKey: 'test-site-key',
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockConfig,
      });

      mockGreacaptcha.execute.mockResolvedValue('test-token');

      // Mock isLoaded to skip script loading
      const { executeRecaptcha, isLoaded } = useRecaptcha();
      isLoaded.value = true;

      const token = await executeRecaptcha('admin_login');

      expect(token).toBe('test-token');
      expect(mockGreacaptcha.execute).toHaveBeenCalledWith('test-site-key', {
        action: 'admin_login',
      });
    });

    it('should return null when reCAPTCHA is disabled', async () => {
      const mockConfig = {
        enabled: false,
        siteKey: null,
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockConfig,
      });

      const { executeRecaptcha } = useRecaptcha();
      const token = await executeRecaptcha('admin_login');

      expect(token).toBeNull();
      expect(mockGreacaptcha.execute).not.toHaveBeenCalled();
    });

    it('should use correct action name', async () => {
      const mockConfig = {
        enabled: true,
        siteKey: 'test-site-key',
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockConfig,
      });

      mockGreacaptcha.execute.mockResolvedValue('test-token');

      // Mock isLoaded to skip script loading
      const { executeRecaptcha, isLoaded } = useRecaptcha();
      isLoaded.value = true;

      await executeRecaptcha('custom_action');

      expect(mockGreacaptcha.execute).toHaveBeenCalledWith('test-site-key', {
        action: 'custom_action',
      });
    });
  });

  describe('isEnabled', () => {
    it('should return true when reCAPTCHA is enabled', async () => {
      const mockConfig = {
        enabled: true,
        siteKey: 'test-site-key',
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockConfig,
      });

      const { isEnabled } = useRecaptcha();
      const enabled = await isEnabled();

      expect(enabled).toBe(true);
    });

    it('should return false when reCAPTCHA is disabled', async () => {
      const mockConfig = {
        enabled: false,
        siteKey: null,
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockConfig,
      });

      const { isEnabled } = useRecaptcha();
      const enabled = await isEnabled();

      expect(enabled).toBe(false);
    });

    it('should return false when config fetch fails', async () => {
      vi.mocked(apiService.get).mockRejectedValue(new Error('API error'));

      const { isEnabled } = useRecaptcha();
      const enabled = await isEnabled();

      expect(enabled).toBe(false);
    });
  });
});
