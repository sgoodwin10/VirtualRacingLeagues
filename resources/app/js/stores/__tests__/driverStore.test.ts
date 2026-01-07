import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDriverStore } from '../driverStore';
import * as driverService from '@app/services/driverService';
import type {
  LeagueDriver,
  CreateDriverRequest,
  UpdateDriverRequest,
  PaginatedDriversResponse,
  ImportDriversResponse,
} from '@app/types/driver';

// Mock the driver service
vi.mock('@app/services/driverService');

// Helper function to create mock LeagueDriver objects
function createMockLeagueDriver(overrides: Partial<LeagueDriver> = {}): LeagueDriver {
  return {
    id: 1,
    league_id: 1,
    driver_id: 1,
    driver_number: null,
    status: 'active',
    league_notes: null,
    added_to_league_at: '2024-01-01T00:00:00.000000Z',
    driver: {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      nickname: null,
      discord_id: null,
      display_name: 'John Doe',
      email: null,
      phone: null,
      psn_id: null,
      iracing_id: null,
      iracing_customer_id: null,
      primary_platform_id: null,
    },
    ...overrides,
  };
}

describe('driverStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useDriverStore();

      expect(store.drivers).toEqual([]);
      expect(store.currentDriver).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.currentPage).toBe(1);
      expect(store.perPage).toBe(10);
      expect(store.totalDrivers).toBe(0);
      expect(store.lastPage).toBe(1);
      expect(store.searchQuery).toBe('');
      expect(store.statusFilter).toBe('all');
    });
  });

  describe('getters', () => {
    const mockDrivers: LeagueDriver[] = [
      createMockLeagueDriver({
        id: 1,
        driver: {
          id: 1,
          first_name: 'John',
          last_name: 'Smith',
          nickname: null,
          discord_id: null,
          display_name: 'John Smith',
          email: null,
          phone: null,
          psn_id: null,
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: null,
        },
        status: 'active',
      }),
      createMockLeagueDriver({
        id: 2,
        driver: {
          id: 2,
          first_name: 'Jane',
          last_name: 'Doe',
          nickname: null,
          discord_id: null,
          display_name: 'Jane Doe',
          email: null,
          phone: null,
          psn_id: null,
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: null,
        },
        status: 'inactive',
      }),
      createMockLeagueDriver({
        id: 3,
        driver: {
          id: 3,
          first_name: 'Mike',
          last_name: 'Ross',
          nickname: null,
          discord_id: null,
          display_name: 'Mike Ross',
          email: null,
          phone: null,
          psn_id: null,
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: null,
        },
        status: 'banned',
      }),
      createMockLeagueDriver({
        id: 4,
        driver: {
          id: 4,
          first_name: 'Sarah',
          last_name: 'Connor',
          nickname: null,
          discord_id: null,
          display_name: 'Sarah Connor',
          email: null,
          phone: null,
          psn_id: null,
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: null,
        },
        status: 'active',
      }),
    ];

    it('activeDrivers should return only active drivers', () => {
      const store = useDriverStore();
      store.drivers = mockDrivers;

      expect(store.activeDrivers).toHaveLength(2);
      expect(store.activeDrivers.every((d) => d.status === 'active')).toBe(true);
    });

    it('inactiveDrivers should return only inactive drivers', () => {
      const store = useDriverStore();
      store.drivers = mockDrivers;

      expect(store.inactiveDrivers).toHaveLength(1);
      expect(store.inactiveDrivers[0]?.status).toBe('inactive');
    });

    it('bannedDrivers should return only banned drivers', () => {
      const store = useDriverStore();
      store.drivers = mockDrivers;

      expect(store.bannedDrivers).toHaveLength(1);
      expect(store.bannedDrivers[0]?.status).toBe('banned');
    });

    it('driverStats should return correct statistics', () => {
      const store = useDriverStore();
      store.drivers = mockDrivers;
      store.totalDrivers = 4;

      expect(store.driverStats).toEqual({
        total: 4,
        active: 2,
        inactive: 1,
        banned: 1,
      });
    });

    it('hasNextPage should return true when not on last page', () => {
      const store = useDriverStore();
      store.currentPage = 1;
      store.lastPage = 3;

      expect(store.hasNextPage).toBe(true);
    });

    it('hasNextPage should return false when on last page', () => {
      const store = useDriverStore();
      store.currentPage = 3;
      store.lastPage = 3;

      expect(store.hasNextPage).toBe(false);
    });

    it('hasPreviousPage should return true when not on first page', () => {
      const store = useDriverStore();
      store.currentPage = 2;

      expect(store.hasPreviousPage).toBe(true);
    });

    it('hasPreviousPage should return false when on first page', () => {
      const store = useDriverStore();
      store.currentPage = 1;

      expect(store.hasPreviousPage).toBe(false);
    });
  });

  describe('fetchLeagueDrivers', () => {
    it('should fetch league drivers successfully', async () => {
      const mockResponse: PaginatedDriversResponse = {
        data: [
          createMockLeagueDriver({
            id: 1,
            driver: {
              id: 1,
              first_name: 'John',
              last_name: 'Smith',
              nickname: null,
              discord_id: null,
              display_name: 'John Smith',
              email: null,
              phone: null,
              psn_id: null,
              iracing_id: null,
              iracing_customer_id: null,
              primary_platform_id: null,
            },
            status: 'active',
          }),
        ],
        meta: {
          current_page: 1,
          per_page: 15,
          total: 1,
          last_page: 1,
          from: 1,
          to: 1,
        },
      };

      vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockResponse);

      const store = useDriverStore();
      await store.fetchLeagueDrivers(1);

      expect(store.drivers).toEqual(mockResponse.data);
      expect(store.totalDrivers).toBe(1);
      expect(store.currentPage).toBe(1);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should fetch drivers with custom query parameters', async () => {
      const mockResponse: PaginatedDriversResponse = {
        data: [],
        meta: {
          current_page: 2,
          per_page: 20,
          total: 0,
          last_page: 1,
          from: null,
          to: null,
        },
      };

      vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockResponse);

      const store = useDriverStore();
      await store.fetchLeagueDrivers(1, {
        page: 2,
        per_page: 20,
        search: 'John',
        status: 'active',
      });

      expect(driverService.getLeagueDrivers).toHaveBeenCalledWith(
        1,
        {
          page: 2,
          per_page: 20,
          search: 'John',
          status: 'active',
        },
        undefined,
      );
    });

    it('should use store filters when no params provided', async () => {
      const mockResponse: PaginatedDriversResponse = {
        data: [],
        meta: {
          current_page: 1,
          per_page: 10,
          total: 0,
          last_page: 1,
          from: null,
          to: null,
        },
      };

      vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockResponse);

      const store = useDriverStore();
      store.searchQuery = 'test';
      store.statusFilter = 'active';

      await store.fetchLeagueDrivers(1);

      expect(driverService.getLeagueDrivers).toHaveBeenCalledWith(
        1,
        {
          page: 1,
          per_page: 10,
          search: 'test',
          status: 'active',
        },
        undefined,
      );
    });

    it('should handle errors when fetching drivers', async () => {
      vi.mocked(driverService.getLeagueDrivers).mockRejectedValue(new Error('Network error'));

      const store = useDriverStore();

      await expect(store.fetchLeagueDrivers(1)).rejects.toThrow('Network error');
      expect(store.error).toBe('Network error');
      expect(store.loading).toBe(false);
    });
  });

  describe('createNewDriver', () => {
    it('should create driver successfully', async () => {
      const driverData: CreateDriverRequest = {
        first_name: 'John',
        last_name: 'Smith',
        psn_id: 'JohnSmith77',
        driver_number: 5,
      };

      const mockDriver: LeagueDriver = createMockLeagueDriver({
        id: 1,
        driver: {
          id: 1,
          first_name: 'John',
          last_name: 'Smith',
          nickname: null,
          discord_id: null,
          display_name: 'John Smith',
          email: null,
          phone: null,
          psn_id: 'JohnSmith77',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: null,
        },
        driver_number: 5,
        status: 'active',
      });

      const _mockResponse: PaginatedDriversResponse = {
        data: [mockDriver],
        meta: {
          current_page: 1,
          per_page: 15,
          total: 1,
          last_page: 1,
          from: 1,
          to: 1,
        },
      };

      vi.mocked(driverService.createDriver).mockResolvedValue(mockDriver);

      const store = useDriverStore();
      const result = await store.createNewDriver(1, driverData);

      expect(result).toEqual(mockDriver);
      expect(driverService.createDriver).toHaveBeenCalledWith(1, driverData);
      // createNewDriver does NOT refetch - it does optimistic update
      expect(store.drivers).toContainEqual(mockDriver);
      expect(store.totalDrivers).toBe(1);
    });

    it('should handle errors when creating driver', async () => {
      vi.mocked(driverService.createDriver).mockRejectedValue(new Error('Validation error'));

      const store = useDriverStore();

      await expect(
        store.createNewDriver(1, { first_name: 'Test', psn_id: 'Test' }),
      ).rejects.toThrow('Validation error');
      expect(store.error).toBe('Validation error');
    });
  });

  describe('fetchLeagueDriver', () => {
    it('should fetch a specific driver', async () => {
      const mockDriver: LeagueDriver = createMockLeagueDriver({
        id: 1,
        driver: {
          id: 1,
          first_name: 'John',
          last_name: 'Smith',
          nickname: null,
          discord_id: null,
          display_name: 'John Smith',
          email: null,
          phone: null,
          psn_id: null,
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: null,
        },
        status: 'active',
      });

      vi.mocked(driverService.getLeagueDriver).mockResolvedValue(mockDriver);

      const store = useDriverStore();
      const result = await store.fetchLeagueDriver(1, 1);

      expect(result).toEqual(mockDriver);
      expect(store.currentDriver).toEqual(mockDriver);
    });
  });

  describe('updateDriver', () => {
    it('should update driver and league settings successfully', async () => {
      const updateData: UpdateDriverRequest = {
        first_name: 'Jonathan',
        last_name: 'Smith',
        email: 'jonathan@example.com',
        driver_number: 10,
        status: 'inactive',
        league_notes: 'On leave',
      };

      const originalDriver: LeagueDriver = {
        id: 1,
        league_id: 1,
        driver_id: 1,
        driver_number: 5,
        status: 'active',
        league_notes: null,
        added_to_league_at: '2024-01-01',
        driver: {
          id: 1,
          first_name: 'John',
          last_name: 'Smith',
          nickname: null,
          discord_id: null,
          display_name: 'John Smith',
          email: 'john@example.com',
          phone: null,
          psn_id: 'JohnSmith77',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: 'JohnSmith77',
        },
      };

      const updatedDriver: LeagueDriver = {
        id: 1,
        league_id: 1,
        driver_id: 1,
        driver_number: 10,
        status: 'inactive',
        league_notes: 'On leave',
        added_to_league_at: '2024-01-01',
        driver: {
          id: 1,
          first_name: 'Jonathan',
          last_name: 'Smith',
          nickname: null,
          discord_id: null,
          display_name: 'Jonathan Smith',
          email: 'jonathan@example.com',
          phone: null,
          psn_id: 'JohnSmith77',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: 'JohnSmith77',
        },
      };

      vi.mocked(driverService.updateDriver).mockResolvedValue(updatedDriver);

      const store = useDriverStore();
      store.drivers = [originalDriver];

      const result = await store.updateDriver(1, 1, updateData);

      expect(result).toEqual(updatedDriver);
      expect(store.drivers[0]).toEqual(updatedDriver);
      expect(driverService.updateDriver).toHaveBeenCalledWith(1, 1, updateData);
    });

    it('should update league settings only', async () => {
      const updateData: UpdateDriverRequest = {
        driver_number: 99,
        status: 'banned',
        league_notes: 'Banned for unsportsmanlike conduct',
      };

      const originalDriver: LeagueDriver = {
        id: 1,
        league_id: 1,
        driver_id: 1,
        driver_number: 5,
        status: 'active',
        league_notes: null,
        added_to_league_at: '2024-01-01',
        driver: {
          id: 1,
          first_name: 'John',
          last_name: 'Smith',
          nickname: null,
          discord_id: null,
          display_name: 'John Smith',
          email: null,
          phone: null,
          psn_id: 'JohnSmith77',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: 'JohnSmith77',
        },
      };

      const updatedDriver: LeagueDriver = {
        ...originalDriver,
        driver_number: 99,
        status: 'banned',
        league_notes: 'Banned for unsportsmanlike conduct',
      };

      vi.mocked(driverService.updateDriver).mockResolvedValue(updatedDriver);

      const store = useDriverStore();
      store.drivers = [originalDriver];

      const result = await store.updateDriver(1, 1, updateData);

      expect(result).toEqual(updatedDriver);
      expect(store.drivers[0]).toEqual(updatedDriver);
    });

    it('should update currentDriver if it was the one being edited', async () => {
      const updatedDriver: LeagueDriver = {
        id: 1,
        league_id: 1,
        driver_id: 1,
        driver_number: null,
        status: 'inactive',
        league_notes: null,
        added_to_league_at: '2024-01-01',
        driver: {
          id: 1,
          first_name: 'John',
          last_name: null,
          nickname: null,
          discord_id: null,
          display_name: 'John',
          email: null,
          phone: null,
          psn_id: 'JohnSmith77',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: 'JohnSmith77',
        },
      };

      vi.mocked(driverService.updateDriver).mockResolvedValue(updatedDriver);

      const store = useDriverStore();
      store.currentDriver = {
        id: 1,
        league_id: 1,
        driver_id: 1,
        driver_number: null,
        status: 'active',
        league_notes: null,
        added_to_league_at: '2024-01-01',
        driver: {
          id: 1,
          first_name: 'John',
          last_name: null,
          nickname: null,
          discord_id: null,
          display_name: 'John',
          email: null,
          phone: null,
          psn_id: 'JohnSmith77',
          iracing_id: null,
          iracing_customer_id: null,
          primary_platform_id: 'JohnSmith77',
        },
      };

      await store.updateDriver(1, 1, { status: 'inactive' });

      expect(store.currentDriver).toEqual(updatedDriver);
    });

    it('should handle errors when updating driver', async () => {
      vi.mocked(driverService.updateDriver).mockRejectedValue(new Error('Update failed'));

      const store = useDriverStore();

      await expect(store.updateDriver(1, 1, { status: 'active' })).rejects.toThrow('Update failed');
      expect(store.error).toBe('Update failed');
    });
  });

  describe('removeDriver', () => {
    it('should remove driver successfully', async () => {
      vi.mocked(driverService.removeDriverFromLeague).mockResolvedValue();

      const store = useDriverStore();
      store.drivers = [
        createMockLeagueDriver({ id: 1, driver_id: 1 }),
        createMockLeagueDriver({ id: 2, driver_id: 2 }),
      ];
      store.totalDrivers = 2;

      await store.removeDriver(1, 1);

      expect(store.drivers).toHaveLength(1);
      expect(store.drivers[0]?.id).toBe(2);
      expect(store.totalDrivers).toBe(1);
    });

    it('should clear currentDriver if it was removed', async () => {
      vi.mocked(driverService.removeDriverFromLeague).mockResolvedValue();

      const store = useDriverStore();
      store.currentDriver = createMockLeagueDriver({ id: 1, driver_id: 1 });
      store.drivers = [createMockLeagueDriver({ id: 1, driver_id: 1 })];

      await store.removeDriver(1, 1);

      expect(store.currentDriver).toBeNull();
    });
  });

  describe('importCSV', () => {
    it('should import CSV successfully', async () => {
      const csvData = 'FirstName,LastName,PSN_ID\nJohn,Smith,JohnSmith77';

      const mockImportResponse: ImportDriversResponse = {
        success_count: 1,
        errors: [],
      };

      const mockDriversResponse: PaginatedDriversResponse = {
        data: [createMockLeagueDriver({ id: 1 })],
        meta: {
          current_page: 1,
          per_page: 15,
          total: 1,
          last_page: 1,
          from: 1,
          to: 1,
        },
      };

      vi.mocked(driverService.importDriversFromCSV).mockResolvedValue(mockImportResponse);
      vi.mocked(driverService.getLeagueDrivers).mockResolvedValue(mockDriversResponse);

      const store = useDriverStore();
      const result = await store.importCSV(1, csvData);

      expect(result).toEqual(mockImportResponse);
      expect(driverService.importDriversFromCSV).toHaveBeenCalledWith(1, csvData);
      expect(driverService.getLeagueDrivers).toHaveBeenCalled();
    });
  });

  describe('filter and pagination actions', () => {
    it('should set search query and reset to first page', () => {
      const store = useDriverStore();
      store.currentPage = 3;

      store.setSearchQuery('John');

      expect(store.searchQuery).toBe('John');
      expect(store.currentPage).toBe(1);
    });

    it('should set status filter and reset to first page', () => {
      const store = useDriverStore();
      store.currentPage = 2;

      store.setStatusFilter('active');

      expect(store.statusFilter).toBe('active');
      expect(store.currentPage).toBe(1);
    });

    it('should navigate to next page', () => {
      const store = useDriverStore();
      store.currentPage = 1;
      store.lastPage = 3;

      store.nextPage();

      expect(store.currentPage).toBe(2);
    });

    it('should not navigate past last page', () => {
      const store = useDriverStore();
      store.currentPage = 3;
      store.lastPage = 3;

      store.nextPage();

      expect(store.currentPage).toBe(3);
    });

    it('should navigate to previous page', () => {
      const store = useDriverStore();
      store.currentPage = 2;

      store.previousPage();

      expect(store.currentPage).toBe(1);
    });

    it('should not navigate before first page', () => {
      const store = useDriverStore();
      store.currentPage = 1;

      store.previousPage();

      expect(store.currentPage).toBe(1);
    });

    it('should go to specific page', () => {
      const store = useDriverStore();
      store.lastPage = 5;

      store.goToPage(3);

      expect(store.currentPage).toBe(3);
    });

    it('should not go to invalid page number', () => {
      const store = useDriverStore();
      store.currentPage = 2;
      store.lastPage = 5;

      store.goToPage(10);

      expect(store.currentPage).toBe(2);
    });

    it('should reset filters', () => {
      const store = useDriverStore();
      store.searchQuery = 'test';
      store.statusFilter = 'active';
      store.currentPage = 3;

      store.resetFilters();

      expect(store.searchQuery).toBe('');
      expect(store.statusFilter).toBe('all');
      expect(store.currentPage).toBe(1);
    });
  });

  describe('utility actions', () => {
    it('should clear error message', async () => {
      const store = useDriverStore();

      // Trigger an error first by failing a fetch
      vi.mocked(driverService.getLeagueDrivers).mockRejectedValue(new Error('Test error'));
      await expect(store.fetchLeagueDrivers(1)).rejects.toThrow('Test error');

      // Verify error was set
      expect(store.error).toBe('Test error');

      // Now clear it
      store.clearError();

      expect(store.error).toBeNull();
    });

    it('should reset store to initial state', () => {
      const store = useDriverStore();

      // Set mutable state
      store.drivers = [createMockLeagueDriver({ id: 1 })];
      store.currentDriver = createMockLeagueDriver({ id: 1 });
      store.currentPage = 3;
      store.searchQuery = 'test';
      store.statusFilter = 'active';
      store.totalDrivers = 10;

      store.resetStore();

      expect(store.drivers).toEqual([]);
      expect(store.currentDriver).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.currentPage).toBe(1);
      expect(store.searchQuery).toBe('');
      expect(store.statusFilter).toBe('all');
      expect(store.totalDrivers).toBe(0);
    });
  });
});
