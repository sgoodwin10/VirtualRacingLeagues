import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestPinia } from '@user/__tests__/setup/testUtils';
import ReadOnlyDriverTable from '../ReadOnlyDriverTable.vue';
import { useLeagueStore } from '@user/stores/leagueStore';
import type { LeagueDriver } from '@user/types/driver';

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: `
      <div class="p-datatable">
        <div v-if="loading"><slot name="loading">Loading...</slot></div>
        <div v-else-if="!value || value.length === 0"><slot name="empty">No data</slot></div>
        <div v-else>
          <div v-for="(item, index) in value" :key="index" class="p-datatable-row">
            <slot :data="item" />
          </div>
        </div>
      </div>
    `,
    props: [
      'value',
      'loading',
      'stripedRows',
      'paginator',
      'rows',
      'rowsPerPageOptions',
      'dataKey',
      'responsiveLayout',
    ],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="p-column"><slot name="body" :data="$parent.$attrs.data" /></div>',
    props: ['field', 'header', 'style'],
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
        display_name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        psn_id: 'johndoe',
        gt7_id: null,
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
        display_name: 'Speedy',
        email: 'jane@example.com',
        phone: null,
        psn_id: null,
        gt7_id: null,
        iracing_id: 'janesmith123',
        iracing_customer_id: 12345,
        primary_platform_id: 'iracing_id',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const wrapper = mount(ReadOnlyDriverTable, {
      global: {
        plugins: [createTestPinia()],
      },
      props: {
        drivers: [],
        loading: false,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });


  it('shows loading state', () => {
    const wrapper = mount(ReadOnlyDriverTable, {
      global: {
        plugins: [createTestPinia()],
      },
      props: {
        drivers: [],
        loading: true,
      },
    });

    expect(wrapper.html()).toContain('Loading drivers');
  });

  it('shows empty state when no drivers', () => {
    const wrapper = mount(ReadOnlyDriverTable, {
      global: {
        plugins: [createTestPinia()],
      },
      props: {
        drivers: [],
        loading: false,
      },
    });

    expect(wrapper.html()).toContain('No drivers found');
  });

});
