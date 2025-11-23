/**
 * Site Configuration API Service
 * Handles HTTP requests for site-wide configuration data
 */

import { apiClient } from './api';
import type { SiteConfig, SiteConfigResponse } from '@app/types/siteConfig';
import type { AxiosResponse } from 'axios';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

/**
 * Fetch site configuration from the API
 * @returns Promise resolving to SiteConfig object
 * @throws Error if the request fails
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const response: AxiosResponse<SiteConfigResponse> = await apiClient.get(
    API_ENDPOINTS.siteConfig.get(),
  );
  return response.data.data;
}
