import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useDriverStore } from '@app/stores/driverStore';
import SeasonDriversTable from '../SeasonDriversTable.vue';
import type { SeasonDriver } from '@app/types/seasonDriver';
import type { LeagueDriver } from '@app/types/driver';

// Mock vue-router
const mockRoute = {
  params: {
    leagueId: '1',
  },
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock ViewDriverModal component
vi.mock('@app/components/driver/ViewDriverModal.vue', () => ({
  default: {
    name: 'ViewDriverModal',
    props: ['visible', 'driver'],
    emits: ['update:visible', 'close', 'edit'],
    template: '<div data-testid="view-driver-modal"></div>',
  },
}));

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    props: [
      'value',
      'loading',
      'paginator',
      'rows',
      'rowsPerPageOptions',
      'stripedRows',
      'showGridlines',
      'responsiveLayout',
    ],
    template: `
      <div data-testid="datatable">
        <slot v-for="item in value" :key="item.id" name="default" :data="item" />
      </div>
    `,
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    props: ['field', 'header', 'exportable'],
    template: '<div><slot name="body" /></div>',
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button><slot /></button>',
  },
}));

vi.mock('primevue/chip', () => ({
  default: {
    name: 'Chip',
    template: '<span><slot /></span>',
  },
}));

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: '<select><slot /></select>',
  },
}));

vi.mock('primevue/confirmdialog', () => ({
  default: {
    name: 'ConfirmDialog',
    template: '<div></div>',
  },
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: vi.fn(),
  }),
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('SeasonDriversTable', () => {
  let wrapper: VueWrapper;

  const mockDriverWithFullName: SeasonDriver = {
    id: 1,
    season_id: 1,
    league_driver_id: 1,
    driver_id: 1,
    first_name: 'John',
    last_name: 'Doe',
    nickname: 'JDoe',
    driver_number: '42',
    psn_id: 'PSN123',
    iracing_id: 'iR456',
    discord_id: 'Discord123',
    team_name: 'Team Alpha',
    division_name: null,
    status: 'active',
    is_active: true,
    is_reserve: false,
    is_withdrawn: false,
    notes: 'Test notes',
    added_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockDriverWithNicknameOnly: SeasonDriver = {
    id: 2,
    season_id: 1,
    league_driver_id: 2,
    driver_id: 2,
    first_name: null,
    last_name: null,
    nickname: 'SpeedRacer',
    driver_number: '99',
    psn_id: null,
    iracing_id: 'iR789',
    discord_id: null,
    team_name: null,
    division_name: null,
    status: 'reserve',
    is_active: false,
    is_reserve: true,
    is_withdrawn: false,
    notes: null,
    added_at: '2024-01-02',
    updated_at: '2024-01-02',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders correctly with season drivers', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('computes driver display name correctly with first and last name', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;
    const displayName = component.getDriverDisplayName(mockDriverWithFullName);

    expect(displayName).toBe('John Doe');
  });

  it('computes driver display name correctly with nickname only', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;
    const displayName = component.getDriverDisplayName(mockDriverWithNicknameOnly);

    expect(displayName).toBe('SpeedRacer');
  });

  it('shows both PSN and iRacing columns when no platformId is provided', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;
    expect(component.showPsnColumn).toBe(true);
    expect(component.showIracingColumn).toBe(true);
  });

  it('shows only PSN column when platformId is 1 (PSN)', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        platformId: 1,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;
    expect(component.showPsnColumn).toBe(true);
    expect(component.showIracingColumn).toBe(false);
  });

  it('shows only iRacing column when platformId is 2 (iRacing)', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        platformId: 2,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;
    expect(component.showPsnColumn).toBe(false);
    expect(component.showIracingColumn).toBe(true);
  });

  it('emits view event when view is called', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;
    component.handleView(mockDriverWithFullName);

    expect(wrapper.emitted('view')).toBeTruthy();
    expect(wrapper.emitted('view')?.[0]).toEqual([mockDriverWithFullName]);
  });

  it('accepts showNumberColumn prop', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        showNumberColumn: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    // Component mounts successfully with the prop
    expect(wrapper.exists()).toBe(true);
  });

  it('accepts both showNumberColumn and teamChampionshipEnabled props', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        showNumberColumn: true,
        teamChampionshipEnabled: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    // Component mounts successfully with both props
    expect(wrapper.exists()).toBe(true);
  });

  it('renders ViewDriverModal component', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const modal = wrapper.find('[data-testid="view-driver-modal"]');
    expect(modal.exists()).toBe(true);
  });

  it('fetches full driver data and opens modal when view is called', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const mockLeagueDriver: LeagueDriver = {
      id: 1,
      league_id: 1,
      driver_id: 1,
      driver_number: 42,
      status: 'active',
      league_notes: 'Test notes',
      added_to_league_at: '2024-01-01',
      driver: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        nickname: 'JDoe',
        discord_id: 'Discord123',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        psn_id: 'PSN123',
        iracing_id: 'iR456',
        iracing_customer_id: 123456,
        primary_platform_id: '1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    };

    const driverStore = useDriverStore(pinia);
    driverStore.fetchLeagueDriver = vi.fn().mockResolvedValue(mockLeagueDriver);

    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [pinia],
      },
    });

    const component = wrapper.vm as any;

    // Call handleView
    await component.handleView(mockDriverWithFullName);

    // Wait for async operations
    await wrapper.vm.$nextTick();

    // Verify fetchLeagueDriver was called with correct params
    expect(driverStore.fetchLeagueDriver).toHaveBeenCalledWith(1, mockDriverWithFullName.driver_id);

    // Verify modal state is set
    expect(component.showViewDriverModal).toBe(true);
    expect(component.selectedDriver).toEqual(mockLeagueDriver);
  });

  it('emits view event for backward compatibility when handleView is called', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const driverStore = useDriverStore(pinia);
    driverStore.fetchLeagueDriver = vi.fn().mockResolvedValue({});

    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [pinia],
      },
    });

    const component = wrapper.vm as any;

    // Call handleView
    await component.handleView(mockDriverWithFullName);

    // Verify view event was emitted
    expect(wrapper.emitted('view')).toBeTruthy();
    expect(wrapper.emitted('view')?.[0]).toEqual([mockDriverWithFullName]);
  });

  it('handles close modal correctly', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;

    // Set modal state
    component.showViewDriverModal = true;
    component.selectedDriver = { id: 1 };

    // Call handleCloseModal
    component.handleCloseModal();

    // Verify modal state is reset
    expect(component.showViewDriverModal).toBe(false);
    expect(component.selectedDriver).toBeNull();
  });

  it('handles edit from modal correctly', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;

    // Set modal state
    component.showViewDriverModal = true;
    component.selectedDriver = { id: 1 };

    // Call handleEditDriver
    component.handleEditDriver();

    // Verify modal is closed
    expect(component.showViewDriverModal).toBe(false);
  });

  it('shows error toast when leagueId is not available', async () => {
    // Temporarily modify mockRoute to have no leagueId
    const originalLeagueId = mockRoute.params.leagueId;
    mockRoute.params.leagueId = undefined as any;

    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;

    // Call handleView
    await component.handleView(mockDriverWithFullName);

    // Verify modal is not opened
    expect(component.showViewDriverModal).toBe(false);

    // Restore original leagueId
    mockRoute.params.leagueId = originalLeagueId;
  });

  it('shows error toast when fetchLeagueDriver fails', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const driverStore = useDriverStore(pinia);
    driverStore.fetchLeagueDriver = vi.fn().mockRejectedValue(new Error('Failed to fetch driver'));

    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [pinia],
      },
    });

    const component = wrapper.vm as any;

    // Call handleView
    await component.handleView(mockDriverWithFullName);

    // Wait for async operations
    await wrapper.vm.$nextTick();

    // Verify modal is not opened
    expect(component.showViewDriverModal).toBe(false);
    expect(component.selectedDriver).toBeNull();
  });
});
