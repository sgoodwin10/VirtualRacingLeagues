import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../api';
import {
  getLeagueDrivers,
  createDriver,
  getLeagueDriver,
  updateDriver,
  removeDriverFromLeague,
  importDriversFromCSV,
} from '../driverService';
import type {
  CreateDriverRequest,
  UpdateLeagueDriverRequest,
  ImportDriversBackendResponse,
  LeagueDriversQueryParams,
} from '@app/types/driver';
import { createMockLeagueDriver } from '@app/__tests__/helpers/driverTestHelpers';

vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('driverService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeagueDrivers', () => {
    it('should fetch league drivers with pagination', async () => {
      const mockLeagueDriver = createMockLeagueDriver({
        driver: {
          id: 1,
          first_name: 'John',
          last_name: 'Smith',
          nickname: 'JSmith',
          discord_id: null,
          display_name: 'John Smith',
          email: 'john@example.com',
          phone: null,
          psn_id: 'JohnSmith77',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: 'PSN: JohnSmith77',
        },
        driver_number: 5,
        status: 'active',
      });

      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: [mockLeagueDriver],
          meta: {
            current_page: 1,
            per_page: 15,
            total: 1,
            last_page: 1,
            from: 1,
            to: 1,
          },
        },
      });

      const result = await getLeagueDrivers(1);

      expect(apiClient.get).toHaveBeenCalledWith('/leagues/1/drivers', { params: undefined });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.driver.first_name).toBe('John');
    });

    it('should fetch league drivers with query parameters', async () => {
      const params: LeagueDriversQueryParams = {
        page: 2,
        per_page: 20,
        search: 'John',
        status: 'active',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: [],
          meta: {
            current_page: 2,
            per_page: 20,
            total: 0,
            last_page: 1,
            from: null,
            to: null,
          },
        },
      });

      const result = await getLeagueDrivers(1, params);

      expect(apiClient.get).toHaveBeenCalledWith('/leagues/1/drivers', { params });
      expect(result.data).toHaveLength(0);
      expect(result.meta.current_page).toBe(2);
    });
  });

  describe('createDriver', () => {
    it('should create a new driver and add to league', async () => {
      const driverData: CreateDriverRequest = {
        first_name: 'Jane',
        last_name: 'Doe',
        psn_id: 'JaneDoe_GT',
        email: 'jane@example.com',
        driver_number: 7,
        status: 'active',
      };

      const mockDriver = createMockLeagueDriver({
        id: 2,
        driver: {
          id: 2,
          first_name: 'Jane',
          last_name: 'Doe',
          nickname: null,
          discord_id: null,
          display_name: 'Jane Doe',
          email: 'jane@example.com',
          phone: null,
          psn_id: 'JaneDoe_GT',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: 'PSN: JaneDoe_GT',
        },
        driver_number: 7,
        status: 'active',
      });

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockDriver },
      });

      const result = await createDriver(1, driverData);

      expect(apiClient.post).toHaveBeenCalledWith('/leagues/1/drivers', driverData);
      expect(result.driver.first_name).toBe('Jane');
      expect(result.driver.psn_id).toBe('JaneDoe_GT');
    });

    it('should create driver with minimal data', async () => {
      const driverData: CreateDriverRequest = {
        nickname: 'FastRacer',
        iracing_id: 'FastRacer99',
      };

      const mockDriver = createMockLeagueDriver({
        id: 3,
        driver: {
          id: 3,
          first_name: null,
          last_name: null,
          nickname: 'FastRacer',
          discord_id: null,
          display_name: 'FastRacer',
          email: null,
          phone: null,
          psn_id: null,
          iracing_id: 'FastRacer99',
          iracing_customer_id: null,
          primary_platform_id: 'iRacing: FastRacer99',
        },
        driver_number: null,
        status: 'active',
      });

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockDriver },
      });

      const result = await createDriver(1, driverData);

      expect(apiClient.post).toHaveBeenCalledWith('/leagues/1/drivers', driverData);
      expect(result.driver.nickname).toBe('FastRacer');
      expect(result.driver.iracing_id).toBe('FastRacer99');
    });
  });

  describe('getLeagueDriver', () => {
    it('should fetch a specific driver in a league', async () => {
      const mockDriver = createMockLeagueDriver({
        id: 1,
        driver: {
          id: 1,
          first_name: 'John',
          last_name: 'Smith',
          nickname: 'JSmith',
          discord_id: null,
          display_name: 'John Smith',
          email: 'john@example.com',
          phone: null,
          psn_id: 'JohnSmith77',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: 'PSN: JohnSmith77',
        },
        driver_number: 5,
        status: 'active',
        league_notes: 'Top performer',
      });

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockDriver },
      });

      const result = await getLeagueDriver(1, 1);

      expect(apiClient.get).toHaveBeenCalledWith('/leagues/1/drivers/1');
      expect(result.driver.first_name).toBe('John');
      expect(result.league_notes).toBe('Top performer');
    });
  });

  describe('updateDriver', () => {
    it('should update league-specific driver settings', async () => {
      const updateData: UpdateLeagueDriverRequest = {
        driver_number: 10,
        status: 'inactive',
        league_notes: 'Updated notes',
      };

      const mockDriver = createMockLeagueDriver({
        id: 1,
        driver_number: 10,
        status: 'inactive',
        league_notes: 'Updated notes',
      });

      vi.mocked(apiClient.put).mockResolvedValue({
        data: { data: mockDriver },
      });

      const result = await updateDriver(1, 1, updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/leagues/1/drivers/1', updateData);
      expect(result.driver_number).toBe(10);
      expect(result.status).toBe('inactive');
    });
  });

  describe('removeDriverFromLeague', () => {
    it('should remove a driver from a league', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: null });

      await removeDriverFromLeague(1, 1);

      expect(apiClient.delete).toHaveBeenCalledWith('/leagues/1/drivers/1');
    });
  });

  describe('importDriversFromCSV', () => {
    it('should import drivers from CSV data successfully', async () => {
      const csvData = 'first_name,last_name,psn_id\nJohn,Smith,JSmith77';
      const mockBackendResponse: ImportDriversBackendResponse = {
        success_count: 1,
        skipped_count: 0,
        errors: [], // Empty array for no errors
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockBackendResponse },
      });

      const result = await importDriversFromCSV(1, csvData);

      expect(apiClient.post).toHaveBeenCalledWith('/leagues/1/drivers/import-csv', {
        csv_data: csvData,
      });
      expect(result.success_count).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle import errors in backend array format', async () => {
      const csvData = 'first_name,last_name\nJohn,';
      const mockBackendResponse: ImportDriversBackendResponse = {
        success_count: 0,
        skipped_count: 0,
        errors: [
          { row: 2, message: 'Row 2: Missing required fields' },
          { row: 5, message: 'Row 5: Invalid platform ID' },
        ],
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockBackendResponse },
      });

      const result = await importDriversFromCSV(1, csvData);

      expect(result.success_count).toBe(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toEqual([
        { row: 2, message: 'Row 2: Missing required fields' },
        { row: 5, message: 'Row 5: Invalid platform ID' },
      ]);
    });

    it('should handle single error correctly', async () => {
      const csvData = 'first_name,last_name,psn_id\nJohn,,';
      const mockBackendResponse: ImportDriversBackendResponse = {
        success_count: 0,
        skipped_count: 0,
        errors: [{ row: 2, message: 'Row 2: At least one name field is required' }],
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockBackendResponse },
      });

      const result = await importDriversFromCSV(1, csvData);

      expect(result.success_count).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        row: 2,
        message: 'Row 2: At least one name field is required',
      });
    });

    it('should handle mixed success and errors', async () => {
      const csvData = 'first_name,last_name,psn_id\nJohn,Smith,JSmith77\nJane,,';
      const mockBackendResponse: ImportDriversBackendResponse = {
        success_count: 1,
        skipped_count: 0,
        errors: [{ row: 3, message: 'Row 3: Missing platform ID' }],
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockBackendResponse },
      });

      const result = await importDriversFromCSV(1, csvData);

      expect(result.success_count).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        row: 3,
        message: 'Row 3: Missing platform ID',
      });
    });
  });

  describe('Network Edge Cases', () => {
    it('should handle network timeout on getLeagueDrivers', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(getLeagueDrivers(1)).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network timeout on createDriver', async () => {
      const driverData: CreateDriverRequest = {
        first_name: 'Jane',
        last_name: 'Doe',
        psn_id: 'JaneDoe_GT',
      };

      vi.mocked(apiClient.post).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(createDriver(1, driverData)).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle partial response on getLeagueDriver', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      await expect(getLeagueDriver(1, 1)).rejects.toMatchObject({
        response: {
          status: 500,
        },
      });
    });

    it('should handle network connection error on updateDriver', async () => {
      const updateData: UpdateLeagueDriverRequest = {
        driver_number: 10,
        status: 'inactive',
      };

      vi.mocked(apiClient.put).mockRejectedValue({
        code: 'ERR_NETWORK',
        message: 'Network Error',
      });

      await expect(updateDriver(1, 1, updateData)).rejects.toMatchObject({
        code: 'ERR_NETWORK',
      });
    });

    it('should handle network timeout on importDriversFromCSV', async () => {
      const csvData = 'first_name,last_name,psn_id\nJohn,Smith,JSmith77';

      vi.mocked(apiClient.post).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(importDriversFromCSV(1, csvData)).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle 404 error on getLeagueDriver', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Driver not found' },
        },
      });

      await expect(getLeagueDriver(1, 999)).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });

    it('should handle 409 conflict on createDriver', async () => {
      const driverData: CreateDriverRequest = {
        first_name: 'Jane',
        last_name: 'Doe',
        psn_id: 'JaneDoe_GT',
      };

      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Driver already exists in league' },
        },
      });

      await expect(createDriver(1, driverData)).rejects.toMatchObject({
        response: {
          status: 409,
        },
      });
    });
  });
});
