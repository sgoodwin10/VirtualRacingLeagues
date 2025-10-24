import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SeasonDriversTable from '../SeasonDriversTable.vue';
import type { SeasonDriver } from '@user/types/seasonDriver';

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

  it('accepts showTeamColumn prop', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        showTeamColumn: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    // Component mounts successfully with the prop
    expect(wrapper.exists()).toBe(true);
  });

  it('accepts both showNumberColumn and showTeamColumn props', () => {
    wrapper = mount(SeasonDriversTable, {
      props: {
        seasonId: 1,
        loading: false,
        showNumberColumn: true,
        showTeamColumn: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    // Component mounts successfully with both props
    expect(wrapper.exists()).toBe(true);
  });
});
