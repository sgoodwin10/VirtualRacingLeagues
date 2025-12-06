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
      'lazy',
      'paginator',
      'rows',
      'totalRecords',
      'rowsPerPageOptions',
      'first',
      'stripedRows',
      'showGridlines',
      'responsiveLayout',
    ],
    emits: ['page', 'sort'],
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
    props: ['field', 'header', 'exportable', 'sortable'],
    template: '<div><slot name="body" /></div>',
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    props: ['label', 'icon', 'size', 'severity', 'disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}<slot /></button>',
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

vi.mock('primevue/iconfield', () => ({
  default: {
    name: 'IconField',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/inputicon', () => ({
  default: {
    name: 'InputIcon',
    template: '<i></i>',
  },
}));

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    props: ['modelValue', 'placeholder', 'disabled'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" :placeholder="placeholder" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
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
    team_id: 1,
    division_id: null,
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
    team_id: null,
    division_id: null,
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

  it('opens ViewDriverModal when handleView is called', async () => {
    const pinia = createPinia();
    const driverStore = useDriverStore(pinia);
    driverStore.fetchLeagueDriver = vi.fn().mockResolvedValue({
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      nickname: 'JD',
      discord_id: 'john#1234',
    });

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
    await component.handleView(mockDriverWithFullName);

    // Verify modal is opened
    expect(component.showViewDriverModal).toBe(true);
    expect(component.selectedDriver).toBeTruthy();
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

  it('does not emit view event (modal is handled internally)', async () => {
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

    // Verify view event was NOT emitted (component handles modal internally)
    expect(wrapper.emitted('view')).toBeFalsy();
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

  it('renders filter dropdowns when raceDivisionsEnabled is true', () => {
    const mockDivisions = [
      {
        id: 1,
        season_id: 1,
        name: 'Division A',
        description: null,
        logo_url: null,
        order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 2,
        season_id: 1,
        name: 'Division B',
        description: null,
        logo_url: null,
        order: 2,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        raceDivisionsEnabled: true,
        divisions: mockDivisions,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const divisionFilter = wrapper.find('#division-filter');
    expect(divisionFilter.exists()).toBe(true);
  });

  it('renders filter dropdowns when teamChampionshipEnabled is true', () => {
    const mockTeams = [
      {
        id: 1,
        season_id: 1,
        name: 'Team A',
        logo_url: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 2,
        season_id: 1,
        name: 'Team B',
        logo_url: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        teamChampionshipEnabled: true,
        teams: mockTeams,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const teamFilter = wrapper.find('#team-filter');
    expect(teamFilter.exists()).toBe(true);
  });

  it('does not render filter dropdowns when neither raceDivisionsEnabled nor teamChampionshipEnabled', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        raceDivisionsEnabled: false,
        teamChampionshipEnabled: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const divisionFilter = wrapper.find('#division-filter');
    const teamFilter = wrapper.find('#team-filter');
    expect(divisionFilter.exists()).toBe(false);
    expect(teamFilter.exists()).toBe(false);
  });

  it('renders search field', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        raceDivisionsEnabled: true, // Enable to show search field
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const searchInput = wrapper.find('input');
    expect(searchInput.exists()).toBe(true);
    expect(searchInput.attributes('placeholder')).toBe('Search drivers by name...');
  });

  it('updates searchQuery when user types in search field', async () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        raceDivisionsEnabled: true, // Enable to show search field
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;
    const searchInput = wrapper.find('input');

    await searchInput.setValue('John Doe');

    expect(component.searchQuery).toBe('John Doe');
  });

  it('disables search input when loading', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: true,
        raceDivisionsEnabled: true, // Enable to show search field
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const searchInput = wrapper.find('input');
    expect(searchInput.attributes('disabled')).toBeDefined();
  });

  it('maintains focus on search input after search completes', async () => {
    const pinia = createPinia();

    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        raceDivisionsEnabled: true, // Enable to show search field
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body, // Attach to body to test focus
    });

    const searchInput = wrapper.find('input');

    // Focus the input
    (searchInput.element as HTMLInputElement).focus();
    expect(document.activeElement).toBe(searchInput.element);

    // Type in the search field
    await searchInput.setValue('John');

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 400));
    await wrapper.vm.$nextTick();

    // Verify the input is NOT disabled during search (which would cause focus loss)
    expect(searchInput.attributes('disabled')).toBeUndefined();

    // Verify focus is maintained (input stays enabled, so focus is preserved)
    expect(document.activeElement).toBe(searchInput.element);

    wrapper.unmount();
  });

  it('renders "Manage Drivers" button by default', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const manageButton = wrapper.find('button');
    expect(manageButton.exists()).toBe(true);
    expect(manageButton.text()).toContain('Manage Drivers');
  });

  it('renders "Manage Drivers" button when neither divisions nor teams are enabled', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        raceDivisionsEnabled: false,
        teamChampionshipEnabled: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const manageButton = wrapper.find('button');
    expect(manageButton.exists()).toBe(true);
    expect(manageButton.text()).toContain('Manage Drivers');
  });

  it('renders "Manage Drivers" button when only divisions are enabled', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        raceDivisionsEnabled: true,
        teamChampionshipEnabled: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const buttons = wrapper.findAll('button');
    const manageButton = buttons.find((btn) => btn.text().includes('Manage Drivers'));
    expect(manageButton).toBeDefined();
  });

  it('renders "Manage Drivers" button when only teams are enabled', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        raceDivisionsEnabled: false,
        teamChampionshipEnabled: true,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const buttons = wrapper.findAll('button');
    const manageButton = buttons.find((btn) => btn.text().includes('Manage Drivers'));
    expect(manageButton).toBeDefined();
  });

  it('emits manageDrivers event when "Manage Drivers" button is clicked', async () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const buttons = wrapper.findAll('button');
    const manageButton = buttons.find((btn) => btn.text().includes('Manage Drivers'));

    expect(manageButton).toBeDefined();
    await manageButton!.trigger('click');

    expect(wrapper.emitted('manageDrivers')).toBeTruthy();
  });

  it('disables "Manage Drivers" button when manageButtonDisabled is true', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        manageButtonDisabled: true,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const buttons = wrapper.findAll('button');
    const manageButton = buttons.find((btn) => btn.text().includes('Manage Drivers'));

    expect(manageButton).toBeDefined();
    expect(manageButton!.attributes('disabled')).toBeDefined();
  });

  it('hides "Manage Drivers" button when showManageButton is false', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        showManageButton: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const buttons = wrapper.findAll('button');
    const manageButton = buttons.find((btn) => btn.text().includes('Manage Drivers'));

    expect(manageButton).toBeUndefined();
  });
});
