import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import DriverTable from '../DriverTable.vue';
import type { LeagueDriver } from '@user/types/driver';
import type { PlatformColumn } from '@user/types/league';

// Mock the league store
const mockFetchDriverColumnsForLeague = vi.fn();
let mockPlatformColumnsValue: PlatformColumn[] = [];

vi.mock('@user/stores/leagueStore', () => ({
  useLeagueStore: vi.fn(() => ({
    get platformColumns() {
      return mockPlatformColumnsValue;
    },
    fetchDriverColumnsForLeague: mockFetchDriverColumnsForLeague,
  })),
}));

// Mock the driver store
const mockFetchLeagueDrivers = vi.fn();
let mockDriversValue: LeagueDriver[] = [];
let mockLoadingValue = false;
let mockTotalDriversValue = 0;
let mockCurrentPageValue = 1;
let mockPerPageValue = 10;

vi.mock('@user/stores/driverStore', () => ({
  useDriverStore: vi.fn(() => ({
    get drivers() {
      return mockDriversValue;
    },
    get loading() {
      return mockLoadingValue;
    },
    get totalDrivers() {
      return mockTotalDriversValue;
    },
    get currentPage() {
      return mockCurrentPageValue;
    },
    get perPage() {
      return mockPerPageValue;
    },
    fetchLeagueDrivers: mockFetchLeagueDrivers,
  })),
}));

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div><slot name="empty"></slot><slot></slot></div>',
    props: [
      'value',
      'loading',
      'striped-rows',
      'paginator',
      'rows',
      'rows-per-page-options',
      'data-key',
      'responsive-layout',
    ],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div></div>',
    props: ['field', 'header', 'style'],
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
    props: ['label', 'icon', 'size', 'text', 'severity'],
  },
}));

describe('DriverTable', () => {
  let mockDrivers: LeagueDriver[];

  beforeEach(() => {
    // Set up Pinia
    setActivePinia(createPinia());

    // Reset mocks
    mockFetchDriverColumnsForLeague.mockClear();
    mockFetchLeagueDrivers.mockClear();
    mockPlatformColumnsValue = []; // Reset to empty by default
    mockLoadingValue = false;
    mockTotalDriversValue = 0;
    mockCurrentPageValue = 1;
    mockPerPageValue = 10;

    mockDrivers = [
      {
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
          phone: null,
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
        league_notes: null,
        added_to_league_at: '2025-10-18T10:00:00Z',
      },
      {
        id: 2,
        league_id: 1,
        driver_id: 102,
        driver: {
          id: 102,
          first_name: null,
          last_name: null,
          nickname: 'FastRacer',
          discord_id: null,
          email: null,
          phone: null,
          psn_id: null,
          iracing_id: 'FastRacer99',
          iracing_customer_id: null,
          display_name: 'FastRacer',
          primary_platform_id: null,
          created_at: '2025-10-18T11:00:00Z',
          updated_at: '2025-10-18T11:00:00Z',
        },
        driver_number: null,
        status: 'inactive',
        league_notes: 'On break',
        added_to_league_at: '2025-10-18T11:00:00Z',
      },
    ];
  });

  it('should render driver table with data', () => {
    mockDriversValue = mockDrivers;
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should emit edit event when edit button is clicked', async () => {
    mockDriversValue = mockDrivers;
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    // Manually call the handler
    const component = wrapper.vm as any;
    component.handleEdit(mockDrivers[0]);

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockDrivers[0]]);
  });

  it('should emit remove event when remove button is clicked', async () => {
    mockDriversValue = mockDrivers;
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    // Manually call the handler
    const component = wrapper.vm as any;
    component.handleRemove(mockDrivers[0]);

    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')?.[0]).toEqual([mockDrivers[0]]);
  });

  it('should display driver name correctly', () => {
    mockDriversValue = mockDrivers;
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;

    // Test full name (now uses display_name from nested driver object)
    const name1 = component.getDriverName(mockDrivers[0]);
    expect(name1).toBe('John Smith');

    // Test nickname only
    const name2 = component.getDriverName(mockDrivers[1]);
    expect(name2).toBe('FastRacer');
  });

  it('should display platform values correctly', () => {
    mockDriversValue = mockDrivers;
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;

    // Test PSN ID from nested driver object
    const psnValue = component.getPlatformValue(mockDrivers[0], 'psn_id');
    expect(psnValue).toBe('JohnSmith77');

    // Test iRacing ID from nested driver object
    const iracingValue = component.getPlatformValue(mockDrivers[1], 'iracing_id');
    expect(iracingValue).toBe('FastRacer99');
  });

  it('should handle driver with no platform ID', () => {
    mockDriversValue = [];
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    const driverNoPlatform: LeagueDriver = {
      ...mockDrivers[0]!,
      driver: {
        ...mockDrivers[0]!.driver,
        psn_id: null,
        iracing_id: null,
        iracing_customer_id: null,
      },
    } as LeagueDriver;

    const platform = component.getPlatformValue(driverNoPlatform, 'psn_id');
    expect(platform).toBe('-');
  });

  it('should show loading state', () => {
    mockLoadingValue = true;
    mockDriversValue = [];
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    expect(component.loading).toBe(true);
  });

  it('should handle empty drivers array', () => {
    mockDriversValue = [];
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    expect(component.drivers).toEqual([]);
  });

  it('should display Discord ID correctly', () => {
    mockDriversValue = mockDrivers;
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;

    // Test Discord ID present
    const discordId1 = component.getDriverDiscordId(mockDrivers[0]);
    expect(discordId1).toBe('john#1234');

    // Test Discord ID absent
    const discordId2 = component.getDriverDiscordId(mockDrivers[1]);
    expect(discordId2).toBe('-');
  });

  it('should handle driver with no Discord ID', () => {
    mockDriversValue = [];
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    const driverNoDiscord: LeagueDriver = {
      ...mockDrivers[0]!,
      driver: {
        ...mockDrivers[0]!.driver,
        discord_id: null,
      },
    } as LeagueDriver;

    const discordId = component.getDriverDiscordId(driverNoDiscord);
    expect(discordId).toBe('-');
  });
});
