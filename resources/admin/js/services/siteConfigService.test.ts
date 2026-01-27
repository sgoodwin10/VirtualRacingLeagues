import { describe, it, expect, vi, beforeEach } from 'vitest';
import { siteConfigService } from './siteConfigService';
import { apiService } from './api';
import { createMockSiteConfig } from '@admin/__tests__/helpers/mockFactories';

vi.mock('../api');

describe('siteConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockConfig = createMockSiteConfig();

  it('should fetch site config', async () => {
    const mockResponse = {
      success: true,
      data: mockConfig,
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await siteConfigService.getSiteConfig();

    expect(result).toEqual(mockConfig);
    expect(apiService.get).toHaveBeenCalledWith('/site-config', { signal: undefined });
  });

  it('should update site config with text fields only', async () => {
    const updateData = {
      site_name: 'New Site Name',
      maintenance_mode: true,
      timezone: 'America/New_York',
      user_registration_enabled: false,
    };

    const mockResponse = {
      success: true,
      data: { ...mockConfig, ...updateData },
    };

    vi.mocked(apiService.post).mockResolvedValue(mockResponse);

    const result = await siteConfigService.updateSiteConfig(updateData);

    expect(result).toEqual(mockResponse.data);
    expect(apiService.post).toHaveBeenCalled();

    const call = vi.mocked(apiService.post).mock.calls[0];
    if (call && call[1] instanceof FormData) {
      const formDataArg = call[1];
      expect(formDataArg.get('site_name')).toBe('New Site Name');
      expect(formDataArg.get('maintenance_mode')).toBe('1');
      expect(formDataArg.get('_method')).toBe('PUT');
    }
  });

  it('should update site config with file uploads', async () => {
    const mockFile = new File(['test'], 'logo.png', { type: 'image/png' });
    const updateData = {
      site_name: 'Site Name',
      maintenance_mode: false,
      timezone: 'UTC',
      user_registration_enabled: true,
      logo: mockFile,
    };

    const mockResponse = {
      success: true,
      data: mockConfig,
    };

    vi.mocked(apiService.post).mockResolvedValue(mockResponse);

    const result = await siteConfigService.updateSiteConfig(updateData);

    expect(result).toEqual(mockConfig);
    expect(apiService.post).toHaveBeenCalled();

    const call = vi.mocked(apiService.post).mock.calls[0];
    if (call && call[1] instanceof FormData) {
      const formDataArg = call[1];
      expect(formDataArg.get('logo')).toBe(mockFile);
    }
  });

  it('should update site config with file removal flags', async () => {
    const updateData = {
      site_name: 'Site Name',
      maintenance_mode: false,
      timezone: 'UTC',
      user_registration_enabled: true,
      remove_logo: true,
      remove_favicon: true,
    };

    const mockResponse = {
      success: true,
      data: mockConfig,
    };

    vi.mocked(apiService.post).mockResolvedValue(mockResponse);

    const result = await siteConfigService.updateSiteConfig(updateData);

    expect(result).toEqual(mockConfig);

    const call = vi.mocked(apiService.post).mock.calls[0];
    if (call && call[1] instanceof FormData) {
      const formDataArg = call[1];
      expect(formDataArg.get('remove_logo')).toBe('1');
      expect(formDataArg.get('remove_favicon')).toBe('1');
    }
  });

  it('should throw error when fetch fails', async () => {
    vi.mocked(apiService.get).mockResolvedValue({ success: false, message: 'Failed' });

    await expect(siteConfigService.getSiteConfig()).rejects.toThrow('Failed');
  });
});
