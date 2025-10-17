import { apiService } from './api';
import type {
  SiteConfig,
  SiteConfigResponse,
  UpdateSiteConfigRequest,
} from '@admin/types/siteConfig';
import { logger } from '@admin/utils/logger';
import { handleServiceError } from '@admin/utils/errorHandler';

/**
 * Site Config Service
 * Handles CRUD operations for site configuration
 */
class SiteConfigService {
  /**
   * Get current site configuration
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getSiteConfig(signal?: AbortSignal): Promise<SiteConfig> {
    try {
      const response = await apiService.get<SiteConfigResponse>('/site-config', { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch site configuration');
      }

      return response.data;
    } catch (error) {
      logger.error('Site Config Service Error:', error);
      handleServiceError(error);
    }
  }

  /**
   * Update site configuration
   * @param data - Configuration data with optional file uploads
   * @param signal - Optional AbortSignal for request cancellation
   */
  async updateSiteConfig(data: UpdateSiteConfigRequest, signal?: AbortSignal): Promise<SiteConfig> {
    try {
      // Create FormData for file uploads
      const formData = new FormData();

      // Add text fields
      formData.append('site_name', data.site_name);
      formData.append('maintenance_mode', data.maintenance_mode ? '1' : '0');
      formData.append('timezone', data.timezone);
      formData.append('user_registration_enabled', data.user_registration_enabled ? '1' : '0');

      // Add optional text fields
      if (data.google_tag_manager_id) {
        formData.append('google_tag_manager_id', data.google_tag_manager_id);
      }
      if (data.google_analytics_id) {
        formData.append('google_analytics_id', data.google_analytics_id);
      }
      if (data.google_search_console_code) {
        formData.append('google_search_console_code', data.google_search_console_code);
      }
      if (data.discord_link) {
        formData.append('discord_link', data.discord_link);
      }
      if (data.support_email) {
        formData.append('support_email', data.support_email);
      }
      if (data.contact_email) {
        formData.append('contact_email', data.contact_email);
      }
      if (data.admin_email) {
        formData.append('admin_email', data.admin_email);
      }

      // Add file uploads
      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      }
      if (data.favicon instanceof File) {
        formData.append('favicon', data.favicon);
      }
      if (data.og_image instanceof File) {
        formData.append('og_image', data.og_image);
      }

      // Add file removal flags
      if (data.remove_logo) {
        formData.append('remove_logo', '1');
      }
      if (data.remove_favicon) {
        formData.append('remove_favicon', '1');
      }
      if (data.remove_og_image) {
        formData.append('remove_og_image', '1');
      }

      // Laravel method spoofing for PUT with multipart/form-data
      // This is required because HTML forms and FormData don't natively support PUT
      formData.append('_method', 'PUT');

      // Send as POST with _method spoofing (RESTful PUT endpoint with file uploads)
      const response = await apiService.post<SiteConfigResponse>('/site-config', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update site configuration');
      }

      return response.data;
    } catch (error) {
      logger.error('Update Site Config Error:', error);
      handleServiceError(error);
    }
  }
}

// Export a singleton instance
export const siteConfigService = new SiteConfigService();
export default siteConfigService;
