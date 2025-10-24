import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ReadOnlyDriverTable from '../ReadOnlyDriverTable.vue';
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
    template: `
      <div class="p-datatable">
        <div v-if="loading"><slot name="loading">Loading...</slot></div>
        <div v-else-if="!value || value.length === 0"><slot name="empty">No data</slot></div>
        <div v-else><slot></slot></div>
      </div>
    `,
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
    template: '<div class="p-column"></div>',
    props: ['field', 'header', 'style'],
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button class="p-button" @click="$emit(\'click\')"><slot name="icon" /></button>',
    props: ['label', 'icon', 'size', 'text', 'severity', 'rounded', 'title'],
    emits: ['click'],
  },
}));

// Mock Phosphor icons
vi.mock('@phosphor-icons/vue', () => ({
  PhEye: {
    name: 'PhEye',
    template: '<span class="ph-eye" />',
    props: ['size'],
  },
  PhPencilSimple: {
    name: 'PhPencilSimple',
    template: '<span class="ph-pencil" />',
    props: ['size'],
  },
}));

// Mock modals
vi.mock('../ViewDriverModal.vue', () => ({
  default: {
    name: 'ViewDriverModal',
    template: '<div class="view-driver-modal"></div>',
    props: ['visible', 'driver'],
    emits: ['update:visible', 'close', 'edit'],
  },
}));

vi.mock('../modals/DriverFormDialog.vue', () => ({
  default: {
    name: 'DriverFormDialog',
    template: '<div class="driver-form-dialog"></div>',
    props: ['visible', 'mode', 'driver', 'leagueId'],
    emits: ['update:visible', 'save', 'cancel'],
  },
}));

describe('ReadOnlyDriverTable', () => {
  const mockDrivers: LeagueDriver[] = [
    {
      id: 1,
      league_id: 1,
      driver_id: 101,
      driver_number: 1,
      status: 'active',
      league_notes: null,
      added_to_league_at: '2024-01-01',
      driver: {
        id: 101,
        first_name: 'John',
        last_name: 'Doe',
        nickname: null,
        discord_id: null,
        display_name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        psn_id: 'johndoe',
        iracing_id: null,
        iracing_customer_id: null,
        primary_platform_id: 'psn_id',
      },
    },
    {
      id: 2,
      league_id: 1,
      driver_id: 102,
      driver_number: 2,
      status: 'active',
      league_notes: null,
      added_to_league_at: '2024-01-02',
      driver: {
        id: 102,
        first_name: 'Jane',
        last_name: 'Smith',
        nickname: 'Speedy',
        discord_id: null,
        display_name: 'Speedy',
        email: 'jane@example.com',
        phone: null,
        psn_id: null,
        iracing_id: 'janesmith123',
        iracing_customer_id: 12345,
        primary_platform_id: 'iracing_id',
      },
    },
  ];

  let wrapper: VueWrapper;

  beforeEach(() => {
    // Set up Pinia
    setActivePinia(createPinia());

    // Reset mocks
    mockFetchDriverColumnsForLeague.mockClear();
    mockPlatformColumnsValue = [];
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    wrapper = mount(ReadOnlyDriverTable, {
      props: {
        drivers: [],
        loading: false,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('shows loading state', () => {
    wrapper = mount(ReadOnlyDriverTable, {
      props: {
        drivers: [],
        loading: true,
      },
    });

    expect(wrapper.html()).toContain('Loading drivers');
  });

  it('shows empty state when no drivers', () => {
    wrapper = mount(ReadOnlyDriverTable, {
      props: {
        drivers: [],
        loading: false,
      },
    });

    expect(wrapper.html()).toContain('No drivers found');
  });

  it('renders modals in the component', () => {
    wrapper = mount(ReadOnlyDriverTable, {
      props: {
        drivers: mockDrivers,
        loading: false,
        leagueId: 1,
      },
    });

    // Check that modals exist in component
    const html = wrapper.html();
    expect(html).toContain('view-driver-modal');
    expect(html).toContain('driver-form-dialog');
  });

  it('passes correct props to modals', () => {
    wrapper = mount(ReadOnlyDriverTable, {
      props: {
        drivers: mockDrivers,
        loading: false,
        leagueId: 1,
      },
    });

    const viewModal = wrapper.findComponent({ name: 'ViewDriverModal' });
    const editModal = wrapper.findComponent({ name: 'DriverFormDialog' });

    expect(viewModal.exists()).toBe(true);
    expect(editModal.exists()).toBe(true);

    // Initially modals should not be visible
    expect(viewModal.props('visible')).toBe(false);
    expect(editModal.props('visible')).toBe(false);

    // Edit modal should have correct mode and leagueId
    expect(editModal.props('mode')).toBe('edit');
    expect(editModal.props('leagueId')).toBe(1);
  });
});
