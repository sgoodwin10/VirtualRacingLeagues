/**
 * Site Configuration Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSiteConfig } from '../siteConfigService';
import { apiClient } from '../api';
import type { SiteConfig } from '@user/types/siteConfig';

// Mock the API client
vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('siteConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSiteConfig', () => {
    it('should fetch site config from API', async () => {
      const mockConfig: SiteConfig = {
        siteName: 'Test Racing Site',
        siteDescription: 'Test Description',
        googleAnalyticsId: 'GA-12345',
        facebookPixelId: 'FB-67890',
        registrationsEnabled: true,
      };

      const mockResponse = {
        data: {
          data: mockConfig,
          message: 'Success',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getSiteConfig();

      expect(apiClient.get).toHaveBeenCalledWith('/site-config');
      expect(result).toEqual(mockConfig);
    });

    it('should handle minimal config response', async () => {
      const mockConfig: SiteConfig = {
        siteName: 'Minimal Site',
        siteDescription: 'Minimal Description',
      };

      const mockResponse = {
        data: {
          data: mockConfig,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getSiteConfig();

      expect(result).toEqual(mockConfig);
      expect(result.siteName).toBe('Minimal Site');
      expect(result.googleAnalyticsId).toBeUndefined();
    });

    it('should handle config with custom properties', async () => {
      const mockConfig: SiteConfig = {
        siteName: 'Custom Site',
        siteDescription: 'Custom Description',
        custom: {
          theme: 'dark',
          maxLeagues: 10,
          features: ['analytics', 'social'],
        },
      };

      const mockResponse = {
        data: {
          data: mockConfig,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getSiteConfig();

      expect(result.custom).toEqual({
        theme: 'dark',
        maxLeagues: 10,
        features: ['analytics', 'social'],
      });
    });

    it('should propagate API errors', async () => {
      const mockError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(getSiteConfig()).rejects.toThrow('Network error');
      expect(apiClient.get).toHaveBeenCalledWith('/site-config');
    });

    it('should handle 404 not found error', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Config not found' },
        },
      };

      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(getSiteConfig()).rejects.toEqual(mockError);
    });

    it('should handle 500 server error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(getSiteConfig()).rejects.toEqual(mockError);
    });
  });
});
