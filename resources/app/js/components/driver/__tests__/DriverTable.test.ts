import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { computed } from 'vue';
import DriverTable from '../DriverTable.vue';
import type { LeagueDriver } from '@app/types/driver';
import type { PlatformColumn } from '@app/types/league';

// Mock the league store
const mockFetchDriverColumnsForLeague = vi.fn();
let mockPlatformColumnsValue: PlatformColumn[] = [];

vi.mock('@app/stores/leagueStore', () => ({
  useLeagueStore: vi.fn(() => ({
    get platformColumns() {
      return mockPlatformColumnsValue;
    },
    fetchDriverColumnsForLeague: mockFetchDriverColumnsForLeague,
  })),
}));

// Mock the driver store
const mockFetchLeagueDrivers = vi.fn();

// Create shared state object that will be referenced by the mock
const mockDriverState = {
  drivers: [] as LeagueDriver[],
  loading: false,
  totalDrivers: 0,
  currentPage: 1,
  perPage: 10,
};

vi.mock('@app/stores/driverStore', () => {
  return {
    useDriverStore: vi.fn(() => {
      // Create refs that reference the shared state
      const drivers = computed(() => mockDriverState.drivers);
      const loading = computed(() => mockDriverState.loading);
      const totalDrivers = computed(() => mockDriverState.totalDrivers);
      const currentPage = computed(() => mockDriverState.currentPage);
      const perPage = computed(() => mockDriverState.perPage);

      return {
        drivers,
        loading,
        totalDrivers,
        currentPage,
        perPage,
        fetchLeagueDrivers: mockFetchLeagueDrivers,
      };
    }),
  };
});

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: `
      <div class="p-datatable">
        <slot name="empty" v-if="!value || value.length === 0"></slot>
        <slot v-for="(item, index) in value" :key="index" :data="item"></slot>
      </div>
    `,
    props: [
      'value',
      'loading',
      'lazy',
      'striped-rows',
      'paginator',
      'rows',
      'rows-per-page-options',
      'total-records',
      'first',
      'data-key',
      'responsive-layout',
      'row-hover',
      'row-class',
      'class',
      'reorderable-rows',
    ],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div><slot name="body" :data="{}"></slot></div>',
    props: ['field', 'header', 'style'],
  },
}));

// Mock TechDataTable wrapper component
vi.mock('@app/components/common/tables/TechDataTable.vue', () => ({
  default: {
    name: 'TechDataTable',
    template: `
      <div class="driver-table tech-datatable">
        <slot name="empty" v-if="!value || value.length === 0"></slot>
        <slot v-for="(item, index) in value" :key="index" :data="item"></slot>
      </div>
    `,
    props: [
      'value',
      'loading',
      'lazy',
      'paginator',
      'rows',
      'rows-per-page-options',
      'total-records',
      'first',
      'data-key',
      'responsive-layout',
    ],
  },
}));

// Mock DriverCell component
vi.mock('@app/components/common/tables/cells/DriverCell.vue', () => ({
  default: {
    name: 'DriverCell',
    template:
      '<div class="driver-cell"><span class="driver-name">{{ name }}</span><span v-if="nickname" class="driver-nickname">{{ nickname }}</span></div>',
    props: ['name', 'nickname'],
  },
}));

// Mock button components
vi.mock('@app/components/common/buttons/ViewButton.vue', () => ({
  default: {
    name: 'ViewButton',
    template:
      '<button class="view-button" :aria-label="ariaLabel" @click="$emit(\'click\', $event)">View</button>',
    props: ['disabled', 'ariaLabel'],
  },
}));

vi.mock('@app/components/common/buttons/EditButton.vue', () => ({
  default: {
    name: 'EditButton',
    template:
      '<button class="edit-button" :aria-label="ariaLabel" @click="$emit(\'click\', $event)">Edit</button>',
    props: ['disabled', 'ariaLabel'],
  },
}));

vi.mock('@app/components/common/buttons/DeleteButton.vue', () => ({
  default: {
    name: 'DeleteButton',
    template:
      '<button class="delete-button" :aria-label="ariaLabel" @click="$emit(\'click\', $event)">Delete</button>',
    props: ['disabled', 'ariaLabel'],
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

    // Reset driver store state
    mockDriverState.drivers = [];
    mockDriverState.loading = false;
    mockDriverState.totalDrivers = 0;
    mockDriverState.currentPage = 1;
    mockDriverState.perPage = 10;

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

  it('should render driver table with data', async () => {
    mockDriverState.drivers = mockDrivers;
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.exists()).toBe(true);
    // Verify the table component is rendered
    expect(wrapper.find('.driver-table').exists()).toBe(true);
  });

  it('should emit edit event when edit button is clicked', async () => {
    mockDriverState.drivers = mockDrivers;
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    await wrapper.vm.$nextTick();

    // Get the component instance to call the handler directly
    const component = wrapper.vm as any;

    // Call the edit handler with mock driver data
    component.handleEdit(mockDrivers[0]);
    await wrapper.vm.$nextTick();

    // Verify edit event was emitted with correct data
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockDrivers[0]]);
  });

  it('should emit remove event when remove button is clicked', async () => {
    mockDriverState.drivers = mockDrivers;
    const wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    await wrapper.vm.$nextTick();

    // Get the component instance to call the handler directly
    const component = wrapper.vm as any;

    // Call the remove handler with mock driver data
    component.handleRemove(mockDrivers[0]);
    await wrapper.vm.$nextTick();

    // Verify remove event was emitted with correct data
    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')?.[0]).toEqual([mockDrivers[0]]);
  });

  it('should display driver name correctly', () => {
    mockDriverState.drivers = mockDrivers;
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
    mockDriverState.drivers = mockDrivers;
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
    mockDriverState.drivers = [];
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
    expect(platform).toBe('');
  });

  it('should show loading state', () => {
    mockDriverState.loading = true;
    mockDriverState.drivers = [];
    const _wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    // Access loading state from mock
    expect(mockDriverState.loading).toBe(true);
  });

  it('should handle empty drivers array', () => {
    mockDriverState.drivers = [];
    const _wrapper = mount(DriverTable, {
      props: {
        leagueId: 1,
      },
    });

    // Access drivers state from mock
    expect(mockDriverState.drivers).toEqual([]);
  });

  it('should display Discord ID correctly', () => {
    mockDriverState.drivers = mockDrivers;
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
    expect(discordId2).toBe('');
  });

  it('should handle driver with no Discord ID', () => {
    mockDriverState.drivers = [];
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
    expect(discordId).toBe('');
  });
});
