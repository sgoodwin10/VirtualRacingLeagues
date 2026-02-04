import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as configService from './configService';
import { apiClient } from './api';
import { API_ENDPOINTS } from '@public/constants/apiEndpoints';
import type { SiteConfig } from '@public/types/config';

// Mock dependencies
vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('configService', () => {
  const mockSiteConfig: SiteConfig = {
    user_registration_enabled: true,
    discord_url: 'https://discord.gg/example',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSiteConfig', () => {
    it('should call site-config endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockSiteConfig },
      });

      await configService.getSiteConfig();

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.siteConfig.get(), {
        signal: undefined,
      });
    });

    it('should return site configuration data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockSiteConfig },
      });

      const result = await configService.getSiteConfig();

      expect(result).toEqual(mockSiteConfig);
    });

    it('should pass abort signal when provided', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockSiteConfig },
      });

      await configService.getSiteConfig(abortController.signal);

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.siteConfig.get(), {
        signal: abortController.signal,
      });
    });

    it('should handle registration disabled config', async () => {
      const disabledConfig: SiteConfig = {
        user_registration_enabled: false,
        discord_url: 'https://discord.gg/example',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: disabledConfig },
      });

      const result = await configService.getSiteConfig();

      expect(result.user_registration_enabled).toBe(false);
      expect(result.discord_url).toBe('https://discord.gg/example');
    });

    it('should handle null discord_url', async () => {
      const configWithoutDiscord: SiteConfig = {
        user_registration_enabled: true,
        discord_url: null,
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: configWithoutDiscord },
      });

      const result = await configService.getSiteConfig();

      expect(result.discord_url).toBeNull();
    });

    it('should throw error when API call fails', async () => {
      const error = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(configService.getSiteConfig()).rejects.toThrow('Network error');
    });
  });
});
