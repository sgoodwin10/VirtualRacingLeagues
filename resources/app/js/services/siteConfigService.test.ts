/**
 * Site Configuration Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSiteConfig } from './siteConfigService';
import { apiClient } from './api';
import type { SiteConfig } from '@app/types/siteConfig';

// Mock the API client
vi.mock('./api', () => ({
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

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

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

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

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

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await getSiteConfig();

      expect(result.custom).toEqual({
        theme: 'dark',
        maxLeagues: 10,
        features: ['analytics', 'social'],
      });
    });

    it('should propagate API errors', async () => {
      const mockError = new Error('Network error');
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

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

      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

      await expect(getSiteConfig()).rejects.toEqual(mockError);
    });

    it('should handle 500 server error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

      await expect(getSiteConfig()).rejects.toEqual(mockError);
    });
  });

  describe('Network Edge Cases', () => {
    it('should handle network timeout', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(getSiteConfig()).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network connection error', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'ERR_NETWORK',
        message: 'Network Error',
      });

      await expect(getSiteConfig()).rejects.toMatchObject({
        code: 'ERR_NETWORK',
      });
    });

    it('should handle partial response error', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue({
        response: {
          status: 503,
          data: { message: 'Service temporarily unavailable' },
        },
      });

      await expect(getSiteConfig()).rejects.toMatchObject({
        response: {
          status: 503,
        },
      });
    });
  });
});
