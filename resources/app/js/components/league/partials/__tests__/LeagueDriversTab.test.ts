import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import LeagueDriversTab from '../LeagueDriversTab.vue';
import type { LeagueDriver } from '@app/types/driver';

// Mock composable
vi.mock('@app/composables/useLeagueDrivers', () => ({
  useLeagueDrivers: vi.fn(() => ({
    searchQuery: { value: '' },
    isLoading: { value: false },
    isSearching: { value: false },
    drivers: { value: [] },
    loadDrivers: vi.fn(),
  })),
}));

describe('LeagueDriversTab', () => {
  let wrapper: VueWrapper;

  const mockDriver: LeagueDriver = {
    id: 1,
    driver_id: 100,
    league_id: 1,
    number: '99',
    status: 'active',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    driver: {
      id: 100,
      display_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      profile_picture: null,
      bio: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };

  const defaultProps = {
    leagueId: 1,
  };

  beforeEach(() => {
    wrapper = mount(LeagueDriversTab, {
      props: defaultProps,
      global: {
        plugins: [createPinia()],
        stubs: {
          BasePanel: true,
          DriverTable: true,
          Button: true,
          InputText: true,
          Select: true,
          IconField: true,
          InputIcon: true,
        },
      },
    });
  });

  it('renders component correctly', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('has leagueId prop', () => {
    expect(wrapper.props('leagueId')).toBe(1);
  });

  it('has searchQuery from composable', () => {
    const vm = wrapper.vm as any;
    expect(vm.searchQuery).toBeDefined();
  });

  it('has driverStore instance', () => {
    const vm = wrapper.vm as any;
    expect(vm.driverStore).toBeDefined();
  });

  it('has status filter options', () => {
    const vm = wrapper.vm as any;
    expect(vm.statusFilterOptions).toHaveLength(4);
  });

  it('emits add-driver event when Add Driver button is clicked', async () => {
    // Call the handler directly since buttons are stubbed
    const vm = wrapper.vm as any;
    vm.handleAddDriver();

    expect(wrapper.emitted('add-driver')).toBeTruthy();
    expect(wrapper.emitted('add-driver')?.[0]).toEqual([]);
  });

  it('emits import-csv event when Import Drivers button is clicked', async () => {
    // Call the handler directly since buttons are stubbed
    const vm = wrapper.vm as any;
    vm.handleImportCSV();

    expect(wrapper.emitted('import-csv')).toBeTruthy();
    expect(wrapper.emitted('import-csv')?.[0]).toEqual([]);
  });

  it('emits view-driver event when handler is called', () => {
    const vm = wrapper.vm as any;
    vm.handleViewDriver(mockDriver);

    expect(wrapper.emitted('view-driver')).toBeTruthy();
    expect(wrapper.emitted('view-driver')?.[0]).toEqual([mockDriver]);
  });

  it('emits edit-driver event when handler is called', () => {
    const vm = wrapper.vm as any;
    vm.handleEditDriver(mockDriver);

    expect(wrapper.emitted('edit-driver')).toBeTruthy();
    expect(wrapper.emitted('edit-driver')?.[0]).toEqual([mockDriver]);
  });

  it('emits remove-driver event when handler is called', () => {
    const vm = wrapper.vm as any;
    vm.handleRemoveDriver(mockDriver);

    expect(wrapper.emitted('remove-driver')).toBeTruthy();
    expect(wrapper.emitted('remove-driver')?.[0]).toEqual([mockDriver]);
  });

  it('has correct status filter options', () => {
    const vm = wrapper.vm as any;
    expect(vm.statusFilterOptions).toEqual([
      { label: 'All Drivers', value: 'all' },
      { label: 'Active Only', value: 'active' },
      { label: 'Inactive Only', value: 'inactive' },
      { label: 'Banned Only', value: 'banned' },
    ]);
  });

  it('uses mocked useLeagueDrivers composable', () => {
    // Verify the component was mounted successfully with the mock
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm).toBeDefined();
  });
});
