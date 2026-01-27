import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDriverStore } from './driverStore';
import { driverService } from '@admin/services/driverService';
import type { PaginatedDriverResponse, Driver } from '@admin/types/driver';

// Mock the driver service
vi.mock('@admin/services/driverService', () => ({
  driverService: {
    getDrivers: vi.fn(),
    deleteDriver: vi.fn(),
  },
}));

// Mock logger to avoid console output during tests
vi.mock('@admin/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useDriverStore', () => {
  let store: ReturnType<typeof useDriverStore>;

  const mockDriver: Driver = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    nickname: 'JD',
    slug: 'john-doe',
    display_name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    psn_id: 'john_psn',
    iracing_id: 'john_iracing',
    iracing_customer_id: 12345,
    discord_id: 'john#1234',
    primary_platform_id: '1',
    status: 'active',
    deleted_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockPaginatedResponse: PaginatedDriverResponse = {
    data: [mockDriver],
    current_page: 1,
    per_page: 15,
    total: 1,
    last_page: 1,
    from: 1,
    to: 1,
    first_page_url: '/api/drivers?page=1',
    last_page_url: '/api/drivers?page=1',
    next_page_url: null,
    prev_page_url: null,
    path: '/api/drivers',
    links: [],
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDriverStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty drivers array', () => {
      expect(store.drivers).toEqual([]);
    });

    it('should have loading false', () => {
      expect(store.isLoading).toBe(false);
    });

    it('should have no error', () => {
      expect(store.error).toBeNull();
    });

    it('should have default pagination values', () => {
      expect(store.currentPage).toBe(1);
      expect(store.rowsPerPage).toBe(15);
      expect(store.totalRecords).toBe(0);
      expect(store.totalPages).toBe(0);
    });

    it('should have default filter values', () => {
      expect(store.searchQuery).toBe('');
      expect(store.sortBy).toBe('created_at');
      expect(store.sortDirection).toBe('desc');
    });
  });

  describe('fetchDrivers', () => {
    it('should fetch drivers successfully', async () => {
      vi.mocked(driverService.getDrivers).mockResolvedValue(mockPaginatedResponse);

      await store.fetchDrivers();

      expect(driverService.getDrivers).toHaveBeenCalledWith(
        {
          page: 1,
          per_page: 15,
          order_by: 'created_at',
          order_direction: 'desc',
        },
        undefined,
      );
      expect(store.drivers).toEqual([mockDriver]);
      expect(store.totalRecords).toBe(1);
      expect(store.totalPages).toBe(1);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      vi.mocked(driverService.getDrivers).mockRejectedValue(new Error(errorMessage));

      await expect(store.fetchDrivers()).rejects.toThrow(errorMessage);
      expect(store.error).toBe(errorMessage);
      expect(store.isLoading).toBe(false);
    });

    it('should include search query in API call', async () => {
      vi.mocked(driverService.getDrivers).mockResolvedValue(mockPaginatedResponse);
      store.setSearchQuery('test');

      await store.fetchDrivers();

      expect(driverService.getDrivers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
        }),
        undefined,
      );
    });

    it('should pass AbortSignal to service', async () => {
      vi.mocked(driverService.getDrivers).mockResolvedValue(mockPaginatedResponse);
      const abortController = new AbortController();

      await store.fetchDrivers(abortController.signal);

      expect(driverService.getDrivers).toHaveBeenCalledWith(
        expect.any(Object),
        abortController.signal,
      );
    });
  });

  describe('deleteDriver', () => {
    beforeEach(() => {
      // Setup initial state with drivers
      store.drivers = [mockDriver];
      store.currentPage = 1;
    });

    it('should delete driver and refresh list', async () => {
      vi.mocked(driverService.deleteDriver).mockResolvedValue();
      vi.mocked(driverService.getDrivers).mockResolvedValue(mockPaginatedResponse);

      await store.deleteDriver(1);

      expect(driverService.deleteDriver).toHaveBeenCalledWith(1, undefined);
      expect(driverService.getDrivers).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      const errorMessage = 'Failed to delete driver';
      vi.mocked(driverService.deleteDriver).mockRejectedValue(new Error(errorMessage));

      await expect(store.deleteDriver(1)).rejects.toThrow(errorMessage);
      expect(store.error).toBe(errorMessage);
    });

    it('should maintain current page after deletion when there are multiple items', async () => {
      // Setup: Page 2 with 2 drivers
      store.drivers = [mockDriver, { ...mockDriver, id: 2 }];
      store.currentPage = 2;

      vi.mocked(driverService.deleteDriver).mockResolvedValue();
      vi.mocked(driverService.getDrivers).mockResolvedValue({
        ...mockPaginatedResponse,
        current_page: 2,
      });

      await store.deleteDriver(1);

      expect(store.currentPage).toBe(2);
    });

    it('should go to previous page when deleting last item on current page (not page 1)', async () => {
      // Setup: Page 3 with only 1 driver (last item on this page)
      store.drivers = [mockDriver];
      store.currentPage = 3;

      vi.mocked(driverService.deleteDriver).mockResolvedValue();
      vi.mocked(driverService.getDrivers).mockResolvedValue({
        ...mockPaginatedResponse,
        current_page: 2,
      });

      await store.deleteDriver(1);

      // Should go to page 2 before refetching
      expect(store.currentPage).toBe(2);
      expect(driverService.getDrivers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
        undefined,
      );
    });

    it('should stay on page 1 when deleting last item on page 1', async () => {
      // Setup: Page 1 with only 1 driver
      store.drivers = [mockDriver];
      store.currentPage = 1;

      vi.mocked(driverService.deleteDriver).mockResolvedValue();
      vi.mocked(driverService.getDrivers).mockResolvedValue({
        ...mockPaginatedResponse,
        data: [],
        total: 0,
      });

      await store.deleteDriver(1);

      // Should stay on page 1 even if it's empty
      expect(store.currentPage).toBe(1);
    });

    it('should preserve current filters and sorting when refetching after delete', async () => {
      store.setSearchQuery('test search');
      store.setSorting('first_name', 'asc');
      store.drivers = [mockDriver];

      vi.mocked(driverService.deleteDriver).mockResolvedValue();
      vi.mocked(driverService.getDrivers).mockResolvedValue(mockPaginatedResponse);

      await store.deleteDriver(1);

      expect(driverService.getDrivers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test search',
          order_by: 'first_name',
          order_direction: 'asc',
        }),
        undefined,
      );
    });

    it('should pass AbortSignal to both delete and fetch operations', async () => {
      const abortController = new AbortController();
      vi.mocked(driverService.deleteDriver).mockResolvedValue();
      vi.mocked(driverService.getDrivers).mockResolvedValue(mockPaginatedResponse);

      await store.deleteDriver(1, abortController.signal);

      expect(driverService.deleteDriver).toHaveBeenCalledWith(1, abortController.signal);
      expect(driverService.getDrivers).toHaveBeenCalledWith(
        expect.any(Object),
        abortController.signal,
      );
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      store.drivers = [mockDriver, { ...mockDriver, id: 2, deleted_at: '2025-01-02T00:00:00Z' }];
    });

    it('activeDrivers should filter out deleted drivers', () => {
      expect(store.activeDrivers).toHaveLength(1);
      expect(store.activeDrivers[0]?.id).toBe(1);
    });

    it('deletedDrivers should only include deleted drivers', () => {
      expect(store.deletedDrivers).toHaveLength(1);
      expect(store.deletedDrivers[0]?.id).toBe(2);
    });

    it('hasDrivers should return true when drivers exist', () => {
      expect(store.hasDrivers).toBe(true);
    });

    it('hasDrivers should return false when no drivers', () => {
      store.drivers = [];
      expect(store.hasDrivers).toBe(false);
    });

    it('totalDrivers should return total count', () => {
      store.totalRecords = 42;
      expect(store.totalDrivers).toBe(42);
    });

    it('loading should return loading state', () => {
      store.isLoading = true;
      expect(store.loading).toBe(true);
    });

    it('errorMessage should return error', () => {
      store.error = 'Test error';
      expect(store.errorMessage).toBe('Test error');
    });

    it('filterParams should construct correct params', () => {
      store.setSearchQuery('test');
      store.setSorting('email', 'asc');
      store.setRowsPerPage(25);
      store.setPage(2); // Set page after setRowsPerPage since setRowsPerPage resets to page 1

      expect(store.filterParams).toEqual({
        page: 2,
        per_page: 25,
        order_by: 'email',
        order_direction: 'asc',
        search: 'test',
      });
    });

    it('filterParams should omit search when empty', () => {
      store.searchQuery = '';

      expect(store.filterParams).not.toHaveProperty('search');
    });
  });

  describe('filter and pagination actions', () => {
    it('setSearchQuery should update search and reset to page 1', () => {
      store.currentPage = 5;
      store.setSearchQuery('new search');

      expect(store.searchQuery).toBe('new search');
      expect(store.currentPage).toBe(1);
    });

    it('setSorting should update sort and reset to page 1', () => {
      store.currentPage = 5;
      store.setSorting('email', 'asc');

      expect(store.sortBy).toBe('email');
      expect(store.sortDirection).toBe('asc');
      expect(store.currentPage).toBe(1);
    });

    it('setPage should update current page', () => {
      store.setPage(3);
      expect(store.currentPage).toBe(3);
    });

    it('setRowsPerPage should update rows and reset to page 1', () => {
      store.currentPage = 5;
      store.setRowsPerPage(50);

      expect(store.rowsPerPage).toBe(50);
      expect(store.currentPage).toBe(1);
    });

    it('resetFilters should reset all filters to defaults', () => {
      store.setSearchQuery('test');
      store.setSorting('email', 'asc');
      store.setPage(5);
      store.setRowsPerPage(50);

      store.resetFilters();

      expect(store.searchQuery).toBe('');
      expect(store.sortBy).toBe('created_at');
      expect(store.sortDirection).toBe('desc');
      expect(store.currentPage).toBe(1);
      expect(store.rowsPerPage).toBe(15);
    });
  });

  describe('utility actions', () => {
    beforeEach(() => {
      store.drivers = [mockDriver];
      store.totalRecords = 10;
      store.totalPages = 2;
      store.error = 'Some error';
    });

    it('clearDrivers should reset all data', () => {
      store.clearDrivers();

      expect(store.drivers).toEqual([]);
      expect(store.error).toBeNull();
      expect(store.totalRecords).toBe(0);
      expect(store.totalPages).toBe(0);
      expect(store.paginationMeta).toBeNull();
    });

    it('getDriverById should find driver by id', () => {
      const driver = store.getDriverById(1);
      expect(driver).toEqual(mockDriver);
    });

    it('getDriverById should return undefined for non-existent id', () => {
      const driver = store.getDriverById(999);
      expect(driver).toBeUndefined();
    });
  });
});
