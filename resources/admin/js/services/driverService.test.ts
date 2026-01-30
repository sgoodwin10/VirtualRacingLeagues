import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driverService } from './driverService';
import { apiService } from './api';
import { createMockDriver } from '@admin/__tests__/helpers/mockFactories';
import type {
  DriverDetails,
  CreateDriverDTO,
  UpdateDriverDTO,
  DriverListParams,
} from '@admin/types/driver';

vi.mock('./api');
vi.mock('@admin/utils/errorHandler');

describe('driverService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDrivers', () => {
    it('fetches drivers successfully', async () => {
      const mockDrivers = [createMockDriver(), createMockDriver()];
      const mockResponse = {
        success: true,
        data: mockDrivers,
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          path: '/admin/api/drivers',
          per_page: 15,
          to: 2,
          total: 2,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await driverService.getDrivers();

      expect(apiService.get).toHaveBeenCalledWith('/drivers', {
        params: undefined,
        signal: undefined,
      });
      expect(result.data).toEqual(mockDrivers);
      expect(result.total).toBe(2);
      expect(result.current_page).toBe(1);
    });

    it('passes query parameters correctly', async () => {
      const params: DriverListParams = {
        search: 'John',
        page: 2,
        per_page: 25,
        order_by: 'first_name',
        order_direction: 'asc',
      };

      const mockResponse = {
        success: true,
        data: [],
        meta: {
          current_page: 2,
          from: 26,
          last_page: 3,
          path: '/admin/api/drivers',
          per_page: 25,
          to: 50,
          total: 75,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await driverService.getDrivers(params);

      expect(apiService.get).toHaveBeenCalledWith('/drivers', {
        params,
        signal: undefined,
      });
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const mockResponse = {
        success: true,
        data: [],
        meta: {
          current_page: 1,
          from: 0,
          last_page: 1,
          path: '/admin/api/drivers',
          per_page: 15,
          to: 0,
          total: 0,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await driverService.getDrivers(undefined, abortController.signal);

      expect(apiService.get).toHaveBeenCalledWith('/drivers', {
        params: undefined,
        signal: abortController.signal,
      });
    });

    it('transforms backend pagination metadata correctly', async () => {
      const mockResponse = {
        success: true,
        data: [createMockDriver()],
        meta: {
          current_page: 2,
          from: 16,
          last_page: 5,
          path: '/admin/api/drivers',
          per_page: 15,
          to: 30,
          total: 75,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await driverService.getDrivers();

      expect(result.current_page).toBe(2);
      expect(result.last_page).toBe(5);
      expect(result.per_page).toBe(15);
      expect(result.total).toBe(75);
      expect(result.from).toBe(16);
      expect(result.to).toBe(30);
      expect(result.first_page_url).toBe('/admin/api/drivers?page=1');
      expect(result.last_page_url).toBe('/admin/api/drivers?page=5');
      expect(result.next_page_url).toBe('/admin/api/drivers?page=3');
      expect(result.prev_page_url).toBe('/admin/api/drivers?page=1');
    });

    it('returns null for next_page_url on last page', async () => {
      const mockResponse = {
        success: true,
        data: [createMockDriver()],
        meta: {
          current_page: 5,
          from: 61,
          last_page: 5,
          path: '/admin/api/drivers',
          per_page: 15,
          to: 75,
          total: 75,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await driverService.getDrivers();

      expect(result.next_page_url).toBeNull();
    });

    it('returns null for prev_page_url on first page', async () => {
      const mockResponse = {
        success: true,
        data: [createMockDriver()],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 5,
          path: '/admin/api/drivers',
          per_page: 15,
          to: 15,
          total: 75,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await driverService.getDrivers();

      expect(result.prev_page_url).toBeNull();
    });

    it('returns empty paginated response when no data', async () => {
      const mockResponse = {
        success: false,
        data: undefined,
        meta: undefined,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await driverService.getDrivers();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.current_page).toBe(1);
      expect(result.last_page).toBe(1);
    });

    it('handles API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(driverService.getDrivers()).rejects.toThrow('Network error');
    });
  });

  describe('getDriver', () => {
    it('fetches single driver successfully', async () => {
      const mockDriver = createMockDriver({ id: 456 });
      const mockResponse = {
        success: true,
        data: mockDriver,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await driverService.getDriver(456);

      expect(apiService.get).toHaveBeenCalledWith('/drivers/456', { signal: undefined });
      expect(result).toEqual(mockDriver);
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const mockDriver = createMockDriver();
      const mockResponse = {
        success: true,
        data: mockDriver,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await driverService.getDriver(456, abortController.signal);

      expect(apiService.get).toHaveBeenCalledWith('/drivers/456', {
        signal: abortController.signal,
      });
    });

    it('throws error when response is not successful', async () => {
      const mockResponse = {
        success: false,
        data: null,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await expect(driverService.getDriver(456)).rejects.toThrow('Failed to fetch driver');
    });

    it('handles API errors', async () => {
      const error = new Error('Not found');
      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(driverService.getDriver(456)).rejects.toThrow('Not found');
    });
  });

  describe('getDriverDetails', () => {
    it('fetches driver details successfully', async () => {
      const mockDriverDetails: DriverDetails = {
        ...createMockDriver({ id: 456 }),
        user: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          status: 'active',
        },
        leagues: [
          {
            id: 1,
            name: 'Test League',
            slug: 'test-league',
            logo_url: 'https://example.com/logo.png',
          },
        ],
        competitions: [
          {
            id: 1,
            name: 'Test Competition',
            slug: 'test-competition',
            platform_name: 'PlayStation',
            season_count: 3,
          },
        ],
        seasons: [
          {
            id: 1,
            name: 'Season 1',
            competition_name: 'Test Competition',
            status: 'active',
            division_name: 'Division A',
            team_name: 'Team Red',
          },
        ],
        race_stats: {
          total_races: 50,
          total_wins: 10,
          total_podiums: 25,
          total_poles: 8,
          best_finish: 1,
        },
      };

      const mockResponse = {
        success: true,
        data: mockDriverDetails,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await driverService.getDriverDetails(456);

      expect(apiService.get).toHaveBeenCalledWith('/drivers/456/details', { signal: undefined });
      expect(result).toEqual(mockDriverDetails);
      expect(result.leagues).toBeDefined();
      expect(result.competitions).toBeDefined();
      expect(result.seasons).toBeDefined();
      expect(result.race_stats).toBeDefined();
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const mockDriverDetails: DriverDetails = {
        ...createMockDriver(),
        leagues: [],
        competitions: [],
        seasons: [],
        race_stats: {
          total_races: 0,
          total_wins: 0,
          total_podiums: 0,
          total_poles: 0,
          best_finish: null,
        },
      };
      const mockResponse = {
        success: true,
        data: mockDriverDetails,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await driverService.getDriverDetails(456, abortController.signal);

      expect(apiService.get).toHaveBeenCalledWith('/drivers/456/details', {
        signal: abortController.signal,
      });
    });

    it('throws error when response is not successful', async () => {
      const mockResponse = {
        success: false,
        data: null,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await expect(driverService.getDriverDetails(456)).rejects.toThrow(
        'Failed to fetch driver details',
      );
    });

    it('handles API errors', async () => {
      const error = new Error('Server error');
      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(driverService.getDriverDetails(456)).rejects.toThrow('Server error');
    });
  });

  describe('createDriver', () => {
    it('creates driver successfully', async () => {
      const createData: CreateDriverDTO = {
        first_name: 'John',
        last_name: 'Doe',
        nickname: 'JDoe',
        email: 'john@example.com',
        psn_id: 'PSN123',
      };

      const mockDriver = createMockDriver(createData);
      const mockResponse = {
        success: true,
        data: mockDriver,
      };

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      const result = await driverService.createDriver(createData);

      expect(apiService.post).toHaveBeenCalledWith('/drivers', createData, { signal: undefined });
      expect(result).toEqual(mockDriver);
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const createData: CreateDriverDTO = {
        first_name: 'John',
        last_name: 'Doe',
      };
      const mockDriver = createMockDriver();
      const mockResponse = {
        success: true,
        data: mockDriver,
      };

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      await driverService.createDriver(createData, abortController.signal);

      expect(apiService.post).toHaveBeenCalledWith('/drivers', createData, {
        signal: abortController.signal,
      });
    });

    it('throws error when response is not successful', async () => {
      const createData: CreateDriverDTO = {
        first_name: 'John',
        last_name: 'Doe',
      };
      const mockResponse = {
        success: false,
        data: null,
      };

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      await expect(driverService.createDriver(createData)).rejects.toThrow(
        'Failed to create driver',
      );
    });

    it('handles API errors', async () => {
      const createData: CreateDriverDTO = {
        first_name: 'John',
        last_name: 'Doe',
      };
      const error = new Error('Validation error');
      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(driverService.createDriver(createData)).rejects.toThrow('Validation error');
    });
  });

  describe('updateDriver', () => {
    it('updates driver successfully', async () => {
      const updateData: UpdateDriverDTO = {
        first_name: 'John',
        last_name: 'Doe Updated',
        email: 'john.updated@example.com',
      };

      const mockDriver = createMockDriver({ ...updateData, id: 456 });
      const mockResponse = {
        success: true,
        data: mockDriver,
      };

      vi.mocked(apiService.put).mockResolvedValue(mockResponse);

      const result = await driverService.updateDriver(456, updateData);

      expect(apiService.put).toHaveBeenCalledWith('/drivers/456', updateData, {
        signal: undefined,
      });
      expect(result).toEqual(mockDriver);
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const updateData: UpdateDriverDTO = {
        nickname: 'NewNick',
      };
      const mockDriver = createMockDriver();
      const mockResponse = {
        success: true,
        data: mockDriver,
      };

      vi.mocked(apiService.put).mockResolvedValue(mockResponse);

      await driverService.updateDriver(456, updateData, abortController.signal);

      expect(apiService.put).toHaveBeenCalledWith('/drivers/456', updateData, {
        signal: abortController.signal,
      });
    });

    it('throws error when response is not successful', async () => {
      const updateData: UpdateDriverDTO = {
        email: 'new@example.com',
      };
      const mockResponse = {
        success: false,
        data: null,
      };

      vi.mocked(apiService.put).mockResolvedValue(mockResponse);

      await expect(driverService.updateDriver(456, updateData)).rejects.toThrow(
        'Failed to update driver',
      );
    });

    it('handles API errors', async () => {
      const updateData: UpdateDriverDTO = {
        email: 'invalid-email',
      };
      const error = new Error('Validation error');
      vi.mocked(apiService.put).mockRejectedValue(error);

      await expect(driverService.updateDriver(456, updateData)).rejects.toThrow('Validation error');
    });
  });

  describe('deleteDriver', () => {
    it('deletes driver successfully', async () => {
      const mockResponse = {
        success: true,
        data: null,
      };

      vi.mocked(apiService.delete).mockResolvedValue(mockResponse);

      await driverService.deleteDriver(456);

      expect(apiService.delete).toHaveBeenCalledWith('/drivers/456', { signal: undefined });
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const mockResponse = {
        success: true,
        data: null,
      };

      vi.mocked(apiService.delete).mockResolvedValue(mockResponse);

      await driverService.deleteDriver(456, abortController.signal);

      expect(apiService.delete).toHaveBeenCalledWith('/drivers/456', {
        signal: abortController.signal,
      });
    });

    it('handles API errors', async () => {
      const error = new Error('Delete failed');
      vi.mocked(apiService.delete).mockRejectedValue(error);

      await expect(driverService.deleteDriver(456)).rejects.toThrow('Delete failed');
    });
  });

  describe('Service Singleton', () => {
    it('exports a singleton instance', () => {
      expect(driverService).toBeDefined();
      expect(typeof driverService.getDrivers).toBe('function');
      expect(typeof driverService.getDriver).toBe('function');
      expect(typeof driverService.getDriverDetails).toBe('function');
      expect(typeof driverService.createDriver).toBe('function');
      expect(typeof driverService.updateDriver).toBe('function');
      expect(typeof driverService.deleteDriver).toBe('function');
    });
  });
});
