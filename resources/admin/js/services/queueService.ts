import { apiService } from './api';
import { handleServiceError } from '@admin/utils/errorHandler';

/**
 * Queue statistics interface
 */
export interface QueueStats {
  status: string;
  jobsPerMinute: number;
  failedJobs: number;
  processes: number;
  recentJobs: number;
}

/**
 * API response wrapper
 */
interface QueueStatsResponse {
  success: boolean;
  data: QueueStats;
  message?: string;
}

/**
 * Queue Service
 *
 * Provides methods for fetching queue monitoring data from the backend.
 */
export const queueService = {
  /**
   * Get current queue statistics
   *
   * @returns Promise resolving to queue stats
   * @throws Error if request fails
   */
  async getStats(): Promise<QueueStats> {
    try {
      const response = await apiService.get<QueueStatsResponse>('/queue/stats');

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch queue stats');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  },
};

export default queueService;
