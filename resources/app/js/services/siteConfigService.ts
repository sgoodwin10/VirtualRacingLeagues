/**
 * Site Configuration API Service
 * Handles HTTP requests for site-wide configuration data
 */

import { apiClient } from './api';
import type { SiteConfig, SiteConfigResponse } from '@app/types/siteConfig';
import type { AxiosResponse } from 'axios';

/**
 * Fetch site configuration from the API
 * @returns Promise resolving to SiteConfig object
 * @throws Error if the request fails
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const response: AxiosResponse<SiteConfigResponse> = await apiClient.get('/site-config');
  return response.data.data;
}
