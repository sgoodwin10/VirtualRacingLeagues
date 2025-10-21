/**
 * Site Configuration Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSiteConfigStore } from '../siteConfigStore';
import * as siteConfigService from '@user/services/siteConfigService';
import type { SiteConfig } from '@user/types/siteConfig';

// Mock the site config service
vi.mock('@user/services/siteConfigService');

describe('siteConfigStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Clear console.error mock
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useSiteConfigStore();

      expect(store.config).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.initialized).toBe(false);
    });

    it('should have default values for getters when config is null', () => {
      const store = useSiteConfigStore();

      expect(store.siteName).toBe('Virtual Racing Leagues');
      expect(store.siteDescription).toBe('Manage your racing leagues');
      expect(store.registrationsEnabled).toBe(true);
      expect(store.maintenanceMode).toBe(false);
      expect(store.maintenanceMessage).toBe('Site is under maintenance. Please check back later.');
      expect(store.isReady).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return config values when loaded', () => {
      const store = useSiteConfigStore();
      const mockConfig: SiteConfig = {
        siteName: 'Test Racing Site',
        siteDescription: 'Test Description',
        googleAnalyticsId: 'GA-12345',
        facebookPixelId: 'FB-67890',
        logoUrl: 'https://example.com/logo.png',
        faviconUrl: 'https://example.com/favicon.ico',
        supportEmail: 'support@example.com',
        contactEmail: 'contact@example.com',
        registrationsEnabled: false,
        maintenanceMode: true,
        maintenanceMessage: 'Custom maintenance message',
        custom: {
          theme: 'dark',
          maxLeagues: 5,
        },
      };

      store.config = mockConfig;
      store.initialized = true;

      expect(store.siteName).toBe('Test Racing Site');
      expect(store.siteDescription).toBe('Test Description');
      expect(store.googleAnalyticsId).toBe('GA-12345');
      expect(store.facebookPixelId).toBe('FB-67890');
      expect(store.logoUrl).toBe('https://example.com/logo.png');
      expect(store.faviconUrl).toBe('https://example.com/favicon.ico');
      expect(store.supportEmail).toBe('support@example.com');
      expect(store.contactEmail).toBe('contact@example.com');
      expect(store.registrationsEnabled).toBe(false);
      expect(store.maintenanceMode).toBe(true);
      expect(store.maintenanceMessage).toBe('Custom maintenance message');
    });

    it('isReady should return true when initialized without errors', () => {
      const store = useSiteConfigStore();
      store.initialized = true;
      store.loading = false;
      store.error = null;

      expect(store.isReady).toBe(true);
    });

    it('isReady should return false when loading', () => {
      const store = useSiteConfigStore();
      store.initialized = true;
      store.loading = true;
      store.error = null;

      expect(store.isReady).toBe(false);
    });

    it('isReady should return false when there is an error', () => {
      const store = useSiteConfigStore();
      store.initialized = true;
      store.loading = false;
      store.error = 'Test error';

      expect(store.isReady).toBe(false);
    });

    it('isReady should return false when not initialized', () => {
      const store = useSiteConfigStore();
      store.initialized = false;
      store.loading = false;
      store.error = null;

      expect(store.isReady).toBe(false);
    });
  });

  describe('getCustomConfig', () => {
    it('should return custom config value by key', () => {
      const store = useSiteConfigStore();
      store.config = {
        siteName: 'Test',
        siteDescription: 'Test',
        custom: {
          theme: 'dark',
          maxLeagues: 5,
        },
      };

      expect(store.getCustomConfig('theme')).toBe('dark');
      expect(store.getCustomConfig('maxLeagues')).toBe(5);
    });

    it('should return default value if key does not exist', () => {
      const store = useSiteConfigStore();
      store.config = {
        siteName: 'Test',
        siteDescription: 'Test',
        custom: {
          theme: 'dark',
        },
      };

      expect(store.getCustomConfig('nonexistent', 'default')).toBe('default');
    });

    it('should return undefined if key does not exist and no default provided', () => {
      const store = useSiteConfigStore();
      store.config = {
        siteName: 'Test',
        siteDescription: 'Test',
        custom: {},
      };

      expect(store.getCustomConfig('nonexistent')).toBeUndefined();
    });

    it('should return default value if custom config is undefined', () => {
      const store = useSiteConfigStore();
      store.config = {
        siteName: 'Test',
        siteDescription: 'Test',
      };

      expect(store.getCustomConfig('theme', 'light')).toBe('light');
    });

    it('should support typed custom config values', () => {
      const store = useSiteConfigStore();
      store.config = {
        siteName: 'Test',
        siteDescription: 'Test',
        custom: {
          maxLeagues: 5,
          features: ['league', 'driver', 'stats'],
        },
      };

      const maxLeagues = store.getCustomConfig<number>('maxLeagues', 1);
      const features = store.getCustomConfig<string[]>('features', []);

      expect(maxLeagues).toBe(5);
      expect(features).toEqual(['league', 'driver', 'stats']);
    });
  });

  describe('fetchConfig', () => {
    it('should fetch site config successfully', async () => {
      const mockConfig: SiteConfig = {
        siteName: 'Test Site',
        siteDescription: 'Test Description',
        googleAnalyticsId: 'GA-12345',
      };

      vi.mocked(siteConfigService.getSiteConfig).mockResolvedValue(mockConfig);

      const store = useSiteConfigStore();
      await store.fetchConfig();

      expect(store.config).toEqual(mockConfig);
      expect(store.initialized).toBe(true);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should not refetch if already initialized', async () => {
      const store = useSiteConfigStore();
      store.initialized = true;

      await store.fetchConfig();

      expect(siteConfigService.getSiteConfig).not.toHaveBeenCalled();
    });

    it('should refetch if force parameter is true', async () => {
      const mockConfig: SiteConfig = {
        siteName: 'Updated Site',
        siteDescription: 'Updated Description',
      };

      vi.mocked(siteConfigService.getSiteConfig).mockResolvedValue(mockConfig);

      const store = useSiteConfigStore();
      store.initialized = true;
      store.config = {
        siteName: 'Old Site',
        siteDescription: 'Old Description',
      };

      await store.fetchConfig(true);

      expect(siteConfigService.getSiteConfig).toHaveBeenCalled();
      expect(store.config).toEqual(mockConfig);
    });

    it('should handle errors gracefully and not throw', async () => {
      vi.mocked(siteConfigService.getSiteConfig).mockRejectedValue(new Error('Network error'));

      const store = useSiteConfigStore();

      // Should not throw - errors are handled gracefully
      await expect(store.fetchConfig()).resolves.toBeUndefined();

      expect(store.error).toBe('Network error');
      expect(store.loading).toBe(false);
      expect(store.config).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Site config error:', 'Network error');
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(siteConfigService.getSiteConfig).mockRejectedValue('String error');

      const store = useSiteConfigStore();
      await store.fetchConfig();

      expect(store.error).toBe('Failed to load site configuration');
      expect(console.error).toHaveBeenCalledWith(
        'Site config error:',
        'Failed to load site configuration',
      );
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: SiteConfig) => void;
      const promise = new Promise<SiteConfig>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(siteConfigService.getSiteConfig).mockReturnValue(promise);

      const store = useSiteConfigStore();
      const fetchPromise = store.fetchConfig();

      // Should be loading
      expect(store.loading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        siteName: 'Test',
        siteDescription: 'Test',
      });

      await fetchPromise;

      // Should no longer be loading
      expect(store.loading).toBe(false);
    });
  });

  describe('refreshConfig', () => {
    it('should force refetch config', async () => {
      const initialConfig: SiteConfig = {
        siteName: 'Initial Site',
        siteDescription: 'Initial Description',
      };

      const updatedConfig: SiteConfig = {
        siteName: 'Updated Site',
        siteDescription: 'Updated Description',
      };

      vi.mocked(siteConfigService.getSiteConfig).mockResolvedValue(updatedConfig);

      const store = useSiteConfigStore();
      store.initialized = true;
      store.config = initialConfig;

      await store.refreshConfig();

      expect(siteConfigService.getSiteConfig).toHaveBeenCalled();
      expect(store.config).toEqual(updatedConfig);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const store = useSiteConfigStore();
      store.error = 'Test error';

      store.clearError();

      expect(store.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const store = useSiteConfigStore();

      // Set all values to non-initial state
      store.config = {
        siteName: 'Test',
        siteDescription: 'Test',
      };
      store.loading = true;
      store.error = 'Test error';
      store.initialized = true;

      store.reset();

      expect(store.config).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.initialized).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete lifecycle: fetch, use, refresh', async () => {
      const initialConfig: SiteConfig = {
        siteName: 'Initial Site',
        siteDescription: 'Initial Description',
        registrationsEnabled: true,
      };

      const updatedConfig: SiteConfig = {
        siteName: 'Updated Site',
        siteDescription: 'Updated Description',
        registrationsEnabled: false,
      };

      vi.mocked(siteConfigService.getSiteConfig)
        .mockResolvedValueOnce(initialConfig)
        .mockResolvedValueOnce(updatedConfig);

      const store = useSiteConfigStore();

      // Initial fetch
      await store.fetchConfig();
      expect(store.siteName).toBe('Initial Site');
      expect(store.registrationsEnabled).toBe(true);
      expect(store.isReady).toBe(true);

      // Refresh
      await store.refreshConfig();
      expect(store.siteName).toBe('Updated Site');
      expect(store.registrationsEnabled).toBe(false);
      expect(store.isReady).toBe(true);
    });

    it('should continue to provide defaults after error', async () => {
      vi.mocked(siteConfigService.getSiteConfig).mockRejectedValue(new Error('API Error'));

      const store = useSiteConfigStore();
      await store.fetchConfig();

      // Should have error but still provide defaults
      expect(store.error).toBe('API Error');
      expect(store.siteName).toBe('Virtual Racing Leagues');
      expect(store.siteDescription).toBe('Manage your racing leagues');
      expect(store.registrationsEnabled).toBe(true);
    });
  });
});
