import { describe, it, expect, vi, beforeEach } from 'vitest';
import { platformCarService } from '../platformCarService';
import { apiService } from '../api';
import type { PlatformCarImportResponse } from '@admin/types/platformCar';
import { createMockPlatformCarImportSummary } from '@admin/__tests__/helpers/mockFactories';

vi.mock('../api');

describe('platformCarService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('importCars', () => {
    describe('successful imports', () => {
      it('should successfully import cars and return summary', async () => {
        const mockData = createMockPlatformCarImportSummary({
          carsCreated: 150,
          carsUpdated: 10,
          carsDeactivated: 2,
          brandsCreated: 25,
          brandsUpdated: 5,
        });
        const mockResponse: PlatformCarImportResponse = {
          success: true,
          data: mockData,
          message: 'Import completed successfully',
        };

        vi.mocked(apiService.post).mockResolvedValue(mockResponse);

        const result = await platformCarService.importCars();

        expect(result).toEqual(mockData);
        expect(apiService.post).toHaveBeenCalledWith(
          '/platform-cars/import',
          {},
          { signal: undefined },
        );
      });

      it('should handle import with partial errors', async () => {
        const mockData = createMockPlatformCarImportSummary({
          carsCreated: 100,
          carsUpdated: 5,
          carsDeactivated: 0,
          brandsCreated: 10,
          brandsUpdated: 2,
          errors: ['Failed to import car XYZ', 'Invalid data for car ABC'],
        });
        const mockResponse: PlatformCarImportResponse = {
          success: true,
          data: mockData,
          message: 'Import completed with errors',
        };

        vi.mocked(apiService.post).mockResolvedValue(mockResponse);

        const result = await platformCarService.importCars();

        expect(result).toEqual(mockData);
        expect(result.errors).toHaveLength(2);
        expect(apiService.post).toHaveBeenCalledWith(
          '/platform-cars/import',
          {},
          { signal: undefined },
        );
      });

      it('should support abort signals for request cancellation', async () => {
        const mockData = createMockPlatformCarImportSummary({
          carsCreated: 50,
          carsUpdated: 0,
          carsDeactivated: 0,
          brandsCreated: 5,
          brandsUpdated: 0,
        });
        const mockResponse: PlatformCarImportResponse = {
          success: true,
          data: mockData,
        };

        vi.mocked(apiService.post).mockResolvedValue(mockResponse);

        const abortController = new AbortController();
        const result = await platformCarService.importCars(abortController.signal);

        expect(result).toEqual(mockData);
        expect(apiService.post).toHaveBeenCalledWith(
          '/platform-cars/import',
          {},
          { signal: abortController.signal },
        );
      });
    });

    describe('error handling', () => {
      it('should throw error when import fails with API error', async () => {
        const mockResponse: PlatformCarImportResponse = {
          success: false,
          message: 'Import failed: API error',
        };

        vi.mocked(apiService.post).mockResolvedValue(mockResponse);

        await expect(platformCarService.importCars()).rejects.toThrow();
        expect(apiService.post).toHaveBeenCalledWith(
          '/platform-cars/import',
          {},
          { signal: undefined },
        );
      });

      it('should throw error when network request fails', async () => {
        const mockError = new Error('Network error');
        vi.mocked(apiService.post).mockRejectedValue(mockError);

        await expect(platformCarService.importCars()).rejects.toThrow();
        expect(apiService.post).toHaveBeenCalledWith(
          '/platform-cars/import',
          {},
          { signal: undefined },
        );
      });

      it('should throw error when response has no data', async () => {
        const mockResponse: PlatformCarImportResponse = {
          success: true,
          // No data field
        };

        vi.mocked(apiService.post).mockResolvedValue(mockResponse);

        await expect(platformCarService.importCars()).rejects.toThrow();
        expect(apiService.post).toHaveBeenCalledWith(
          '/platform-cars/import',
          {},
          { signal: undefined },
        );
      });

      it('should handle authentication errors', async () => {
        const mockError = {
          response: {
            status: 401,
            data: { message: 'Unauthenticated' },
          },
        };

        vi.mocked(apiService.post).mockRejectedValue(mockError);

        await expect(platformCarService.importCars()).rejects.toThrow();
      });

      it('should handle server errors', async () => {
        const mockError = {
          response: {
            status: 500,
            data: { message: 'Internal server error' },
          },
        };

        vi.mocked(apiService.post).mockRejectedValue(mockError);

        await expect(platformCarService.importCars()).rejects.toThrow();
      });
    });
  });
});
