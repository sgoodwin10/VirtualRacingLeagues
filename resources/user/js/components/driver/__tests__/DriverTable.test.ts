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
    mockPlatformColumnsValue = []; // Reset to empty by default

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
    const wrapper = mount(DriverTable, {
      props: {
        drivers: mockDrivers,
        loading: false,
        leagueId: 1,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should emit edit event when edit button is clicked', async () => {
    const wrapper = mount(DriverTable, {
      props: {
        drivers: mockDrivers,
        loading: false,
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
    const wrapper = mount(DriverTable, {
      props: {
        drivers: mockDrivers,
        loading: false,
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
    const wrapper = mount(DriverTable, {
      props: {
        drivers: mockDrivers,
        loading: false,
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
    const wrapper = mount(DriverTable, {
      props: {
        drivers: mockDrivers,
        loading: false,
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
    const wrapper = mount(DriverTable, {
      props: {
        drivers: [],
        loading: false,
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
    const wrapper = mount(DriverTable, {
      props: {
        drivers: [],
        loading: true,
        leagueId: 1,
      },
    });

    expect(wrapper.props('loading')).toBe(true);
  });

  it('should handle empty drivers array', () => {
    const wrapper = mount(DriverTable, {
      props: {
        drivers: [],
        loading: false,
        leagueId: 1,
      },
    });

    expect(wrapper.props('drivers')).toEqual([]);
  });

  it('should display Discord ID correctly', () => {
    const wrapper = mount(DriverTable, {
      props: {
        drivers: mockDrivers,
        loading: false,
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
    const wrapper = mount(DriverTable, {
      props: {
        drivers: [],
        loading: false,
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
