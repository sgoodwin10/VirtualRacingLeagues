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
      const response = await apiService.get<{
        success: boolean;
        data: Driver[];
        meta: {
          current_page: number;
          from: number;
          last_page: number;
          path: string;
          per_page: number;
          to: number;
          total: number;
        };
      }>('/drivers', {
        params,
        signal,
      });

      // Transform backend response into PaginatedDriverResponse format
      if (response.success && response.data) {
        return {
          current_page: response.meta.current_page,
          data: response.data,
          first_page_url: `${response.meta.path}?page=1`,
          from: response.meta.from,
          last_page: response.meta.last_page,
          last_page_url: `${response.meta.path}?page=${response.meta.last_page}`,
          links: [],
          next_page_url:
            response.meta.current_page < response.meta.last_page
              ? `${response.meta.path}?page=${response.meta.current_page + 1}`
              : null,
          path: response.meta.path,
          per_page: response.meta.per_page,
          prev_page_url:
            response.meta.current_page > 1
              ? `${response.meta.path}?page=${response.meta.current_page - 1}`
              : null,
          to: response.meta.to,
          total: response.meta.total,
        };
      }

      // Return empty paginated response if no data
      return {
        current_page: 1,
        data: [],
        first_page_url: '',
        from: 0,
        last_page: 1,
        last_page_url: '',
        links: [],
        next_page_url: null,
        path: '',
        per_page: 15,
        prev_page_url: null,
        to: 0,
        total: 0,
      };
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
