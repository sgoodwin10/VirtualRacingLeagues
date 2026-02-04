/**
 * Site Config API Service
 * Handles fetching site configuration settings
 */

import { apiClient } from './api';
import type { SiteConfig } from '@public/types/config';
import { API_ENDPOINTS } from '@public/constants/apiEndpoints';

/**
 * Get site configuration settings
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function getSiteConfig(signal?: AbortSignal): Promise<SiteConfig> {
  const response = await apiClient.get<{ data: SiteConfig }>(API_ENDPOINTS.siteConfig.get(), {
    signal,
  });
  return response.data.data;
}

/**
 * Grouped export for convenient importing
 */
export const configService = {
  getSiteConfig,
};
