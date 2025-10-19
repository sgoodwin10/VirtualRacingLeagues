import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSiteConfigStore } from '../siteConfigStore';
import { siteConfigService } from '@admin/services/siteConfigService';
import { createMockSiteConfig } from '@admin/__tests__/helpers/mockFactories';

vi.mock('@admin/services/siteConfigService');

describe('useSiteConfigStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockConfig = createMockSiteConfig();

  it('should initialize with default state', () => {
    const store = useSiteConfigStore();

    expect(store.config).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should fetch site config successfully', async () => {
    const store = useSiteConfigStore();

    vi.mocked(siteConfigService.getSiteConfig).mockResolvedValue(mockConfig);

    await store.fetchSiteConfig();

    expect(store.config).toEqual(mockConfig);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const store = useSiteConfigStore();

    vi.mocked(siteConfigService.getSiteConfig).mockRejectedValue(new Error('Failed to fetch'));

    await store.fetchSiteConfig();

    expect(store.config).toBeNull();
    expect(store.error).toBe('Failed to fetch');
    expect(store.isLoading).toBe(false);
  });

  it('should return siteName getter', () => {
    const store = useSiteConfigStore();

    expect(store.siteName).toBe('Admin Panel');

    store.updateConfig(mockConfig);
    expect(store.siteName).toBe(mockConfig.site_name);
  });

  it('should return logo getter', () => {
    const store = useSiteConfigStore();

    expect(store.logo).toBeNull();

    const configWithLogo = createMockSiteConfig({
      files: {
        logo: {
          id: 1,
          url: 'http://example.com/logo.png',
          file_name: 'logo.png',
          mime_type: 'image/png',
          file_size: 1024,
        },
        favicon: null,
        og_image: null,
      },
    });
    store.updateConfig(configWithLogo);
    expect(store.logo?.url).toBe('http://example.com/logo.png');
  });

  it('should return maintenanceMode getter', () => {
    const store = useSiteConfigStore();

    expect(store.maintenanceMode).toBe(false);

    store.updateConfig({ ...mockConfig, maintenance_mode: true });
    expect(store.maintenanceMode).toBe(true);
  });

  it('should return timezone getter', () => {
    const store = useSiteConfigStore();

    expect(store.timezone).toBe('UTC');

    store.updateConfig({ ...mockConfig, timezone: 'America/New_York' });
    expect(store.timezone).toBe('America/New_York');
  });

  it('should update config', () => {
    const store = useSiteConfigStore();

    store.updateConfig(mockConfig);

    expect(store.config).toEqual(mockConfig);
  });

  it('should clear config', () => {
    const store = useSiteConfigStore();
    store.updateConfig(mockConfig);
    store.error = 'Some error';

    store.clearConfig();

    expect(store.config).toBeNull();
    expect(store.error).toBeNull();
  });
});
