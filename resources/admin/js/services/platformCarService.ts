import { apiService } from './api';
import type { PlatformCarImportResponse, PlatformCarImportSummary } from '@admin/types/platformCar';
import { handleServiceError } from '@admin/utils/errorHandler';
import { logger } from '@admin/utils/logger';

/**
 * Platform Car Service
 * Handles platform car management operations
 */
class PlatformCarService {
  /**
   * Import GT7 cars from the platform API
   * Triggers backend import process that fetches cars from GT7 API,
   * creates/updates/deactivates records, and returns summary
   *
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<PlatformCarImportSummary>
   * @throws Error if import fails
   */
  async importCars(signal?: AbortSignal): Promise<PlatformCarImportSummary> {
    try {
      const response = await apiService.post<PlatformCarImportResponse>(
        '/platform-cars/import',
        {},
        { signal },
      );

      // Check if import was successful
      if (response.success && response.data) {
        return response.data;
      }

      // Import failed but no error was thrown - use message if available
      throw new Error(response.message || 'Import failed without error details');
    } catch (error) {
      logger.error('Platform Car Import Error:', error);
      handleServiceError(error);
    }
  }
}

// Export singleton instance
export const platformCarService = new PlatformCarService();
export default platformCarService;
