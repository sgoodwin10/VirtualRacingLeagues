import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../api';
import {
  getLeagueDrivers,
  createDriver,
  getLeagueDriver,
  updateLeagueDriver,
  removeDriverFromLeague,
  importDriversFromCSV,
} from '../driverService';
import type {
  CreateDriverRequest,
  UpdateLeagueDriverRequest,
  ImportDriversResponse,
  LeagueDriversQueryParams,
} from '@user/types/driver';
import { createMockLeagueDriver } from '@user/__tests__/helpers/driverTestHelpers';

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
          display_name: 'John Smith',
          email: 'john@example.com',
          phone: null,
          psn_id: 'JohnSmith77',
          gt7_id: null,
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
          display_name: 'Jane Doe',
          email: 'jane@example.com',
          phone: null,
          psn_id: 'JaneDoe_GT',
          gt7_id: null,
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
        gt7_id: 'FastRacer99',
      };

      const mockDriver = createMockLeagueDriver({
        id: 3,
        driver: {
          id: 3,
          first_name: null,
          last_name: null,
          nickname: 'FastRacer',
          display_name: 'FastRacer',
          email: null,
          phone: null,
          psn_id: null,
          gt7_id: 'FastRacer99',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: 'GT7: FastRacer99',
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
      expect(result.driver.gt7_id).toBe('FastRacer99');
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
          display_name: 'John Smith',
          email: 'john@example.com',
          phone: null,
          psn_id: 'JohnSmith77',
          gt7_id: null,
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

  describe('updateLeagueDriver', () => {
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

      const result = await updateLeagueDriver(1, 1, updateData);

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
      const mockResponse: ImportDriversResponse = {
        success_count: 1,
        errors: [],
        message: '1 driver(s) imported successfully',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockResponse },
      });

      const result = await importDriversFromCSV(1, csvData);

      expect(apiClient.post).toHaveBeenCalledWith('/leagues/1/drivers/import-csv', {
        csv_data: csvData,
      });
      expect(result.success_count).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle import errors', async () => {
      const csvData = 'first_name,last_name\nJohn,';
      const mockResponse: ImportDriversResponse = {
        success_count: 0,
        errors: [
          {
            row: 2,
            message: 'Missing required fields',
          },
        ],
        message: 'Import completed with errors',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockResponse },
      });

      const result = await importDriversFromCSV(1, csvData);

      expect(result.success_count).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toBe('Missing required fields');
    });
  });
});
