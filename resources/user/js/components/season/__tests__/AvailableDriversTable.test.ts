import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AvailableDriversTable from '../AvailableDriversTable.vue';
import { useSeasonDriverStore } from '@user/stores/seasonDriverStore';
import type { AvailableDriver } from '@user/types/seasonDriver';

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

describe('AvailableDriversTable', () => {
  let wrapper: VueWrapper;

  const mockDriverWithFullName: AvailableDriver = {
    id: 1,
    driver_id: 1,
    driver_name: 'John Doe',
    number: '42',
    team_name: 'Team Alpha',
    psn_id: 'PSN123',
    iracing_id: 'iR456',
    discord_id: 'Discord123',
  };

  const mockDriverWithNicknameOnly: AvailableDriver = {
    id: 2,
    driver_id: 2,
    driver_name: 'SpeedRacer',
    number: '99',
    team_name: null,
    psn_id: null,
    iracing_id: 'iR789',
    discord_id: null,
  };

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders correctly with available drivers', () => {
    const store = useSeasonDriverStore();
    store.$patch({ availableDrivers: [mockDriverWithFullName] });

    wrapper = mount(AvailableDriversTable, {
      props: {
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('computes driver display name correctly with first and last name', () => {
    wrapper = mount(AvailableDriversTable, {
      props: {
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
    wrapper = mount(AvailableDriversTable, {
      props: {
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
    wrapper = mount(AvailableDriversTable, {
      props: {
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
    wrapper = mount(AvailableDriversTable, {
      props: {
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
    wrapper = mount(AvailableDriversTable, {
      props: {
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

  it('emits add event when add button is clicked', async () => {
    wrapper = mount(AvailableDriversTable, {
      props: {
        loading: false,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const component = wrapper.vm as any;
    component.handleAdd(mockDriverWithFullName);

    expect(wrapper.emitted('add')).toBeTruthy();
    expect(wrapper.emitted('add')?.[0]).toEqual([mockDriverWithFullName]);
  });
});
