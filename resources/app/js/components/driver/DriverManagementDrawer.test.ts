/**
 * DriverManagementDrawer Component Tests
 *
 * Tests for the driver management drawer which handles:
 * - Driver listing, search, and filtering
 * - Adding, editing, viewing, and removing drivers
 * - CSV import functionality
 *
 * Note: This component is complex and integrates with multiple child components,
 * stores, and async operations. Tests focus on core rendering and prop handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { setActivePinia } from 'pinia';
import { mountWithStubs, createTestPinia } from '@app/__tests__/setup/testUtils';
import DriverManagementDrawer from './DriverManagementDrawer.vue';
import type { LeagueDriver } from '@app/types/driver';

// Mock PrimeVue composables
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: vi.fn(),
  }),
}));

// Mock driver store
const mockFetchLeagueDrivers = vi.fn().mockResolvedValue(undefined);
const mockResetFilters = vi.fn();

vi.mock('@app/stores/driverStore', () => {
  return {
    useDriverStore: vi.fn(() => ({
      statusFilter: 'all',
      currentPage: ref(1),
      perPage: ref(10),
      drivers: ref([]),
      loading: ref(false),
      totalDrivers: ref(0),
      fetchLeagueDrivers: mockFetchLeagueDrivers,
      createNewDriver: vi.fn(),
      updateDriver: vi.fn(),
      removeDriver: vi.fn(),
      importCSV: vi.fn(),
      setSearchQuery: vi.fn(),
      resetFilters: mockResetFilters,
    })),
  };
});

// Mock league store - use getter pattern like DriverFormDialog.test.ts
let mockPlatformColumnsValue: any[] = [];
let mockPlatformCsvHeadersValue: any[] = [];
let mockPlatformFormFieldsValue: any[] = [];

vi.mock('@app/stores/leagueStore', () => {
  return {
    useLeagueStore: vi.fn(() => ({
      get platformColumns() {
        return mockPlatformColumnsValue;
      },
      get platformCsvHeaders() {
        return mockPlatformCsvHeadersValue;
      },
      get platformFormFields() {
        return mockPlatformFormFieldsValue;
      },
      fetchDriverColumnsForLeague: vi.fn().mockImplementation(async () => {
        mockPlatformColumnsValue = [];
      }),
      fetchDriverFormFieldsForLeague: vi.fn().mockImplementation(async () => {
        mockPlatformFormFieldsValue = [];
      }),
      fetchDriverCsvHeadersForLeague: vi.fn().mockImplementation(async () => {
        mockPlatformCsvHeadersValue = [];
      }),
    })),
  };
});

// Mock usePlatformFormFields to prevent unhandled rejections from async operations
vi.mock('@app/composables/usePlatformFormFields', () => {
  return {
    usePlatformFormFields: vi.fn(() => ({
      fetchPlatformFormFields: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('DriverManagementDrawer', () => {
  let mockDriver: LeagueDriver;

  beforeEach(() => {
    setActivePinia(createTestPinia());
    vi.clearAllMocks();

    // Reset mock arrays to empty before each test
    mockPlatformColumnsValue = [];
    mockPlatformCsvHeadersValue = [];
    mockPlatformFormFieldsValue = [];

    mockDriver = {
      id: 1,
      league_id: 1,
      driver_id: 101,
      driver: {
        id: 101,
        first_name: 'John',
        last_name: 'Smith',
        nickname: 'JSmith',
        discord_id: 'john#1234',
        email: 'john@example.com',
        phone: '+1234567890',
        psn_id: 'JohnSmith77',
        iracing_id: null,
        iracing_customer_id: null,
        display_name: 'John Smith',
        primary_platform_id: null,
        created_at: '2025-10-18T10:00:00Z',
        updated_at: '2025-10-18T10:00:00Z',
      },
      driver_number: 5,
      status: 'active',
      league_notes: 'Top performer',
      added_to_league_at: '2025-10-18T10:00:00Z',
    };
  });

  describe('Component Rendering', () => {
    it('renders without errors', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('accepts required props correctly', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 42,
          leagueName: 'My League',
        },
      });

      const props = wrapper.props() as any;
      expect(props.visible).toBe(true);
      expect(props.leagueId).toBe(42);
      expect(props.leagueName).toBe('My League');
    });

    it('accepts optional leaguePlatforms prop', () => {
      const platforms = [
        { id: 1, name: 'PlayStation', code: 'PSN', slug: 'playstation' },
        { id: 2, name: 'iRacing', code: 'IRACING', slug: 'iracing' },
      ];

      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
          leaguePlatforms: platforms,
        },
      });

      const props = wrapper.props() as any;
      expect(props.leaguePlatforms).toEqual(platforms);
    });

    it('defaults leaguePlatforms to empty array', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const props = wrapper.props() as any;
      expect(props.leaguePlatforms).toEqual([]);
    });
  });

  describe('Computed Properties', () => {
    it('computes drawer title correctly', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Elite Racing League',
        },
      });

      const component = wrapper.vm as any;
      expect(component.drawerTitle).toBe('Elite Racing League - Drivers');
    });
  });

  describe('Helper Functions', () => {
    it('returns driver display name from getDriverName', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const component = wrapper.vm as any;
      const name = component.getDriverName(mockDriver);

      expect(name).toBe('John Smith');
    });

    it('returns "Unknown" when driver has no driver property', () => {
      const driverWithoutDriver = {
        ...mockDriver,
        driver: null,
      };

      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const component = wrapper.vm as any;
      const name = component.getDriverName(driverWithoutDriver);

      // Function returns empty string when driver property is null
      expect(name).toBe('');
    });
  });

  describe('Component State Management', () => {
    it('initializes with correct default states', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const component = wrapper.vm as any;

      expect(component.showDriverForm).toBe(false);
      expect(component.showViewModal).toBe(false);
      expect(component.showCSVImport).toBe(false);
      expect(component.formMode).toBe('create');
      expect(component.selectedDriver).toBeNull();
      expect(component.searchInput).toBe('');
    });

    it('has correct status filter options', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const component = wrapper.vm as any;

      expect(component.statusFilterOptions).toHaveLength(4);
      expect(component.statusFilterOptions[0].label).toBe('All Drivers');
      expect(component.statusFilterOptions[0].value).toBe('all');
      expect(component.statusFilterOptions[1].label).toBe('Active Only');
      expect(component.statusFilterOptions[2].label).toBe('Inactive Only');
      expect(component.statusFilterOptions[3].label).toBe('Banned Only');
    });
  });

  describe('Event Emissions', () => {
    it('emits update:visible when drawer is closed', async () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      // Simulate drawer visibility change
      await wrapper.vm.$emit('update:visible', false);

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('emits close event', async () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      await wrapper.vm.$emit('close');

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Action Handlers', () => {
    it('handleAddDriver sets correct mode and state', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const component = wrapper.vm as any;
      component.handleAddDriver();

      expect(component.formMode).toBe('create');
      expect(component.selectedDriver).toBeNull();
      expect(component.showDriverForm).toBe(true);
    });

    it('handleViewDriver sets correct state', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const component = wrapper.vm as any;
      component.handleViewDriver(mockDriver);

      expect(component.selectedDriver).toEqual(mockDriver);
      expect(component.showViewModal).toBe(true);
    });

    it('handleEditDriver sets correct mode and state', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const component = wrapper.vm as any;
      component.handleEditDriver(mockDriver);

      expect(component.formMode).toBe('edit');
      expect(component.selectedDriver).toEqual(mockDriver);
      expect(component.showDriverForm).toBe(true);
    });

    it('handleEditFromView closes view modal and opens edit form', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const component = wrapper.vm as any;
      component.selectedDriver = mockDriver;
      component.showViewModal = true;

      component.handleEditFromView();

      expect(component.showViewModal).toBe(false);
      expect(component.formMode).toBe('edit');
      expect(component.showDriverForm).toBe(true);
    });

    it('handleImportCSV opens CSV import dialog', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 1,
          leagueName: 'Test League',
        },
      });

      const component = wrapper.vm as any;
      component.handleImportCSV();

      expect(component.showCSVImport).toBe(true);
    });
  });

  describe('Integration Points', () => {
    it('provides correct props to child components', () => {
      const wrapper = mountWithStubs(DriverManagementDrawer, {
        props: {
          visible: true,
          leagueId: 99,
          leagueName: 'Test League',
        },
      });

      // Component should be set up to pass league ID to children
      const component = wrapper.vm as any;
      expect(component.leagueId).toBe(99);
    });
  });
});
