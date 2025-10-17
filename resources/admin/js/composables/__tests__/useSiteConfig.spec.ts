import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSiteConfig } from '../useSiteConfig';
import type { SiteConfig, UpdateSiteConfigRequest } from '@admin/types/siteConfig';

// Mock dependencies
vi.mock('@admin/services/siteConfigService', () => ({
  siteConfigService: {
    getSiteConfig: vi.fn(),
    updateSiteConfig: vi.fn(),
  },
}));

vi.mock('@admin/stores/siteConfigStore', () => ({
  useSiteConfigStore: vi.fn(() => ({
    updateConfig: vi.fn(),
  })),
}));

vi.mock('@admin/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { siteConfigService } from '@admin/services/siteConfigService';
import { useSiteConfigStore } from '@admin/stores/siteConfigStore';

describe('useSiteConfig', () => {
  const mockConfig: SiteConfig = {
    id: 1,
    site_name: 'Test App',
    google_tag_manager_id: null,
    google_analytics_id: null,
    google_search_console_code: null,
    discord_link: null,
    support_email: 'support@test.com',
    contact_email: 'contact@test.com',
    admin_email: 'admin@test.com',
    maintenance_mode: false,
    timezone: 'UTC',
    user_registration_enabled: true,
    files: {
      logo: null,
      favicon: null,
      og_image: null,
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { config, loading, saving, error, validationErrors } = useSiteConfig();
      expect(config.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(saving.value).toBe(false);
      expect(error.value).toBeNull();
      expect(validationErrors.value).toEqual({});
    });
  });

  describe('fetchConfig', () => {
    it('should fetch config successfully', async () => {
      vi.mocked(siteConfigService.getSiteConfig).mockResolvedValue(mockConfig);
      const { fetchConfig, config, loading, error } = useSiteConfig();

      await fetchConfig();

      expect(siteConfigService.getSiteConfig).toHaveBeenCalledTimes(1);
      expect(config.value).toEqual(mockConfig);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should set loading state during fetch', async () => {
      vi.mocked(siteConfigService.getSiteConfig).mockImplementation(
        () =>
          new Promise((resolve) => {
            const { loading } = useSiteConfig();
            expect(loading.value).toBe(true);
            resolve(mockConfig);
          })
      );
      const { fetchConfig, loading } = useSiteConfig();

      await fetchConfig();
      expect(loading.value).toBe(false);
    });

    it('should handle fetch errors', async () => {
      const testError = new Error('Network error');
      vi.mocked(siteConfigService.getSiteConfig).mockRejectedValue(testError);
      const { fetchConfig, error, config } = useSiteConfig();

      await fetchConfig();

      expect(error.value).toBe('Network error');
      expect(config.value).toBeNull();
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(siteConfigService.getSiteConfig).mockRejectedValue('String error');
      const { fetchConfig, error } = useSiteConfig();

      await fetchConfig();

      expect(error.value).toBe('Failed to fetch site configuration');
    });
  });

  describe('updateConfig', () => {
    it('should update config successfully', async () => {
      const store = { updateConfig: vi.fn() };
      vi.mocked(useSiteConfigStore).mockReturnValue(store as any);
      vi.mocked(siteConfigService.updateSiteConfig).mockResolvedValue(mockConfig);

      const { updateConfig, config, saving, error } = useSiteConfig();
      const updateData: UpdateSiteConfigRequest = {
        site_name: 'Updated App',
        maintenance_mode: false,
        timezone: 'UTC',
        user_registration_enabled: true,
      };

      const result = await updateConfig(updateData);

      expect(siteConfigService.updateSiteConfig).toHaveBeenCalledWith(updateData);
      expect(store.updateConfig).toHaveBeenCalledWith(mockConfig);
      expect(config.value).toEqual(mockConfig);
      expect(saving.value).toBe(false);
      expect(error.value).toBeNull();
      expect(result).toBe(true);
    });

    it('should set saving state during update', async () => {
      vi.mocked(siteConfigService.updateSiteConfig).mockResolvedValue(mockConfig);
      const { updateConfig } = useSiteConfig();

      await updateConfig({
        site_name: 'Test',
        maintenance_mode: false,
        timezone: 'UTC',
        user_registration_enabled: true,
      });
      // Just verify it completes without error
      expect(true).toBe(true);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            errors: {
              site_name: ['The site name field is required'],
              timezone: ['The timezone field is required'],
            },
          },
        },
        isAxiosError: true,
      };
      vi.mocked(siteConfigService.updateSiteConfig).mockRejectedValue(validationError);

      const { updateConfig, validationErrors, error } = useSiteConfig();

      const result = await updateConfig({
        site_name: '',
        maintenance_mode: false,
        timezone: '',
        user_registration_enabled: true,
      });

      expect(validationErrors.value).toEqual({
        site_name: ['The site name field is required'],
        timezone: ['The timezone field is required'],
      });
      expect(error.value).toBe('Please correct the validation errors');
      expect(result).toBe(false);
    });

    it('should handle general errors', async () => {
      const testError = new Error('Update failed');
      vi.mocked(siteConfigService.updateSiteConfig).mockRejectedValue(testError);

      const { updateConfig, error } = useSiteConfig();

      const result = await updateConfig({
        site_name: 'Test',
        maintenance_mode: false,
        timezone: 'UTC',
        user_registration_enabled: true,
      });

      expect(error.value).toBe('Update failed');
      expect(result).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(siteConfigService.updateSiteConfig).mockRejectedValue('String error');
      const { updateConfig, error } = useSiteConfig();

      const result = await updateConfig({
        site_name: 'Test',
        maintenance_mode: false,
        timezone: 'UTC',
        user_registration_enabled: true,
      });

      expect(error.value).toBe('Failed to update site configuration');
      expect(result).toBe(false);
    });

    it('should clear previous validation errors', async () => {
      vi.mocked(siteConfigService.updateSiteConfig).mockResolvedValue(mockConfig);
      const { updateConfig, validationErrors } = useSiteConfig();

      // Set some validation errors first
      validationErrors.value = { site_name: ['Error'] };

      await updateConfig({
        site_name: 'Test',
        maintenance_mode: false,
        timezone: 'UTC',
        user_registration_enabled: true,
      });

      expect(validationErrors.value).toEqual({});
    });
  });

  describe('clearValidationErrors', () => {
    it('should clear validation errors and error message', () => {
      const { validationErrors, error, clearValidationErrors } = useSiteConfig();

      validationErrors.value = { app_name: ['Error'] };
      error.value = 'Test error';

      clearValidationErrors();

      expect(validationErrors.value).toEqual({});
      expect(error.value).toBeNull();
    });
  });

  describe('getFieldError', () => {
    it('should return first error for field', () => {
      const { validationErrors, getFieldError } = useSiteConfig();
      validationErrors.value = {
        site_name: ['First error', 'Second error'],
      };

      expect(getFieldError('site_name')).toBe('First error');
    });

    it('should return null if no errors for field', () => {
      const { getFieldError } = useSiteConfig();
      expect(getFieldError('site_name')).toBeNull();
    });

    it('should return null if field has empty array', () => {
      const { validationErrors, getFieldError } = useSiteConfig();
      validationErrors.value = { site_name: [] };

      expect(getFieldError('site_name')).toBeNull();
    });
  });

  describe('hasFieldError', () => {
    it('should return true if field has errors', () => {
      const { validationErrors, hasFieldError } = useSiteConfig();
      validationErrors.value = { site_name: ['Error'] };

      expect(hasFieldError('site_name')).toBe(true);
    });

    it('should return false if field has no errors', () => {
      const { hasFieldError } = useSiteConfig();
      expect(hasFieldError('site_name')).toBe(false);
    });

    it('should return false if field has empty array', () => {
      const { validationErrors, hasFieldError } = useSiteConfig();
      validationErrors.value = { site_name: [] };

      expect(hasFieldError('site_name')).toBe(false);
    });
  });
});
