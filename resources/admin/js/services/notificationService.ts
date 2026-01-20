import { apiService } from './api';
import type {
  NotificationLog,
  NotificationFilterParams,
  NotificationDetailResponse,
} from '@admin/types/notification';
import type { PaginatedResponse } from '@admin/types/api';
import { handleServiceError } from '@admin/utils/errorHandler';
import { transformPaginatedResponse, type BackendPaginatedResponse } from '@admin/utils/pagination';

/**
 * Notification Service
 * Handles notification log management operations
 */
class NotificationService {
  /**
   * Get all notification logs with pagination
   * @param params - Optional filter parameters
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<PaginatedResponse<NotificationLog>>
   */
  async getAll(
    params?: NotificationFilterParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<NotificationLog>> {
    try {
      // Build query params
      const queryParams: Record<string, string> = {};
      if (params?.page) queryParams.page = String(params.page);
      if (params?.per_page) queryParams.per_page = String(params.per_page);
      if (params?.type) queryParams.type = params.type;
      if (params?.channel) queryParams.channel = params.channel;
      if (params?.status) queryParams.status = params.status;
      if (params?.date_from) queryParams.date_from = params.date_from;
      if (params?.date_to) queryParams.date_to = params.date_to;

      // Backend returns: { success: true, data: [...notifications], meta: {...pagination} }
      const response = await apiService.get<BackendPaginatedResponse<NotificationLog>>(
        '/notifications',
        {
          params: queryParams,
          signal,
        },
      );

      // Transform backend response using utility function
      return transformPaginatedResponse(response);
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get a single notification by ID
   * @param id - Notification ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<NotificationLog>
   */
  async getById(id: number, signal?: AbortSignal): Promise<NotificationLog> {
    try {
      const response = await apiService.get<NotificationDetailResponse>(`/notifications/${id}`, {
        signal,
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch notification');
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
