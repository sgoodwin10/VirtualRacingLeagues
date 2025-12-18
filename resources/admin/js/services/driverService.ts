import { apiService } from './api';
import type {
  Driver,
  DriverDetails,
  CreateDriverDTO,
  UpdateDriverDTO,
  DriverListParams,
  PaginatedDriverResponse,
  DriverApiResponse,
} from '@admin/types/driver';
import { handleServiceError } from '@admin/utils/errorHandler';
import { transformPaginatedResponse, type BackendPaginatedResponse } from '@admin/utils/pagination';

/**
 * Driver Service
 * Handles all driver-related API operations for admin context
 */
class DriverService {
  /**
   * Get paginated list of drivers with optional filters
   * @param params - Optional filters and pagination parameters
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<PaginatedDriverResponse>
   */
  async getDrivers(
    params?: DriverListParams,
    signal?: AbortSignal,
  ): Promise<PaginatedDriverResponse> {
    try {
      const response = await apiService.get<BackendPaginatedResponse<Driver>>('/drivers', {
        params,
        signal,
      });

      // Transform backend response using utility function
      return transformPaginatedResponse(response);
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }

  /**
   * Get a single driver by ID
   * @param id - Driver ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Driver>
   */
  async getDriver(id: number, signal?: AbortSignal): Promise<Driver> {
    try {
      const response = await apiService.get<DriverApiResponse<Driver>>(`/drivers/${id}`, {
        signal,
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch driver');
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }

  /**
   * Get detailed driver information including leagues, competitions, seasons, and stats
   * @param id - Driver ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<DriverDetails>
   */
  async getDriverDetails(id: number, signal?: AbortSignal): Promise<DriverDetails> {
    try {
      const response = await apiService.get<DriverApiResponse<DriverDetails>>(
        `/drivers/${id}/details`,
        {
          signal,
        },
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch driver details');
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }

  /**
   * Create a new driver
   * @param data - Driver creation data
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Driver>
   */
  async createDriver(data: CreateDriverDTO, signal?: AbortSignal): Promise<Driver> {
    try {
      const response = await apiService.post<DriverApiResponse<Driver>>('/drivers', data, {
        signal,
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to create driver');
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }

  /**
   * Update an existing driver
   * @param id - Driver ID
   * @param data - Driver update data
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Driver>
   */
  async updateDriver(id: number, data: UpdateDriverDTO, signal?: AbortSignal): Promise<Driver> {
    try {
      const response = await apiService.put<DriverApiResponse<Driver>>(`/drivers/${id}`, data, {
        signal,
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to update driver');
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }

  /**
   * Delete a driver
   * @param id - Driver ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async deleteDriver(id: number, signal?: AbortSignal): Promise<void> {
    try {
      await apiService.delete<DriverApiResponse<null>>(`/drivers/${id}`, { signal });
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }
}

// Export singleton instance
export const driverService = new DriverService();
export default driverService;
