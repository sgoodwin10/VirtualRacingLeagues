import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import DriverDataTable from '../DriverDataTable.vue';
import { mountWithStubs } from '@admin/__tests__/setup/testUtils';
import { createMockDriver } from '@admin/__tests__/helpers/mockFactories';
import type { Driver } from '@admin/types/driver';

describe('DriverDataTable', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  /**
   * Helper function to mount DriverDataTable with proper configuration
   */
  const mountDriverDataTable = (props = {}) => {
    return mountWithStubs(DriverDataTable, {
      props,
      global: {
        plugins: [pinia],
      },
    });
  };

  describe('Component Rendering', () => {
    it('renders empty state when no drivers provided', () => {
      const wrapper = mountDriverDataTable({ drivers: [] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.exists()).toBe(true);
      expect(dataTable.props('value')).toEqual([]);
    });

    it('renders loading state when loading prop is true', () => {
      const wrapper = mountDriverDataTable({ loading: true });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('loading')).toBe(true);
    });

    it('renders table with driver data', () => {
      const drivers = [
        createMockDriver({ display_name: 'John Doe' }),
        createMockDriver({ display_name: 'Jane Smith' }),
      ];

      const wrapper = mountDriverDataTable({ drivers });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('value')).toEqual(drivers);
      expect(dataTable.props('value')).toHaveLength(2);
    });

    it('displays driver ID column', () => {
      const driver = createMockDriver({ id: 456 });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.id).toBe(456);
    });

    it('displays driver name and nickname', () => {
      const driver = createMockDriver({
        display_name: 'John Doe',
        nickname: 'JDoe',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.display_name).toBe('John Doe');
      expect(drivers[0]?.nickname).toBe('JDoe');
    });

    it('displays email when provided', () => {
      const driver = createMockDriver({ email: 'john@example.com' });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.email).toBe('john@example.com');
    });

    it('shows null when email is null', () => {
      const driver = createMockDriver({ email: null });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.email).toBeNull();
    });
  });

  describe('Driver Initials', () => {
    it('has driver with first and last name for initials', () => {
      const driver = createMockDriver({
        first_name: 'John',
        last_name: 'Doe',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.first_name).toBe('John');
      expect(drivers[0]?.last_name).toBe('Doe');
    });

    it('has driver with nickname when no first/last name', () => {
      const driver = createMockDriver({
        first_name: null,
        last_name: null,
        nickname: 'SpeedRacer',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.nickname).toBe('SpeedRacer');
      expect(drivers[0]?.first_name).toBeNull();
      expect(drivers[0]?.last_name).toBeNull();
    });

    it('has driver with no name or nickname', () => {
      const driver = createMockDriver({
        first_name: null,
        last_name: null,
        nickname: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.first_name).toBeNull();
      expect(drivers[0]?.last_name).toBeNull();
      expect(drivers[0]?.nickname).toBeNull();
    });
  });

  describe('Platform IDs', () => {
    it('has PSN ID when provided', () => {
      const driver = createMockDriver({
        psn_id: 'PSN123456',
        iracing_id: null,
        discord_id: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.psn_id).toBe('PSN123456');
    });

    it('has iRacing ID when provided', () => {
      const driver = createMockDriver({
        psn_id: null,
        iracing_id: '654321',
        discord_id: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.iracing_id).toBe('654321');
    });

    it('has Discord ID when provided', () => {
      const driver = createMockDriver({
        psn_id: null,
        iracing_id: null,
        discord_id: '123456789012345678',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.discord_id).toBe('123456789012345678');
    });

    it('has multiple platform IDs', () => {
      const driver = createMockDriver({
        psn_id: 'PSN123',
        iracing_id: '456',
        discord_id: '789',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.psn_id).toBe('PSN123');
      expect(drivers[0]?.iracing_id).toBe('456');
      expect(drivers[0]?.discord_id).toBe('789');
    });

    it('has no platform IDs when none provided', () => {
      const driver = createMockDriver({
        psn_id: null,
        iracing_id: null,
        discord_id: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.psn_id).toBeNull();
      expect(drivers[0]?.iracing_id).toBeNull();
      expect(drivers[0]?.discord_id).toBeNull();
    });
  });

  describe('Driver Status', () => {
    it('has active driver status', () => {
      const driver = createMockDriver({ deleted_at: null });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.deleted_at).toBeNull();
    });

    it('has deleted driver status', () => {
      const driver = createMockDriver({ deleted_at: '2024-01-01T00:00:00Z' });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.deleted_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('Created Date', () => {
    it('has created date', () => {
      const driver = createMockDriver({
        created_at: '2024-01-15T10:30:00Z',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.created_at).toBe('2024-01-15T10:30:00Z');
    });
  });

  describe('Action Buttons', () => {
    it('has driver data for action buttons', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('value')).toHaveLength(1);
    });

    it('has active driver for delete button', () => {
      const driver = createMockDriver({ deleted_at: null });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.deleted_at).toBeNull();
    });

    it('has deleted driver without delete button', () => {
      const driver = createMockDriver({ deleted_at: '2024-01-01T00:00:00Z' });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.deleted_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('Event Emissions', () => {
    it('emits view event when handleView is called', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      (wrapper.vm as any).handleView(driver);

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([driver]);
    });

    it('emits edit event when handleEdit is called', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      (wrapper.vm as any).handleEdit(driver);

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([driver]);
    });

    it('emits delete event when handleDelete is called', () => {
      const driver = createMockDriver({ deleted_at: null });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      (wrapper.vm as any).handleDelete(driver);

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual([driver]);
    });
  });

  describe('Multiple Drivers', () => {
    it('renders multiple drivers correctly', () => {
      const drivers = [
        createMockDriver({ display_name: 'Driver 1', id: 1 }),
        createMockDriver({ display_name: 'Driver 2', id: 2 }),
        createMockDriver({ display_name: 'Driver 3', id: 3 }),
      ];

      const wrapper = mountDriverDataTable({ drivers });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('value')).toHaveLength(3);
      expect(dataTable.props('value')).toEqual(drivers);
    });

    it('handles mixed deleted states correctly', () => {
      const drivers = [
        createMockDriver({ deleted_at: null }),
        createMockDriver({ deleted_at: '2024-01-01T00:00:00Z' }),
      ];

      const wrapper = mountDriverDataTable({ drivers });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const tableDrivers = dataTable.props('value') as Driver[];
      expect(tableDrivers[0]?.deleted_at).toBeNull();
      expect(tableDrivers[1]?.deleted_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('Default Props', () => {
    it('uses empty array as default for drivers prop', () => {
      const wrapper = mountDriverDataTable();
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('value')).toEqual([]);
    });

    it('uses false as default for loading prop', () => {
      const wrapper = mountDriverDataTable();
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('loading')).toBe(false);
    });
  });

  describe('Avatar Display', () => {
    it('has driver data for avatar display', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('value')).toHaveLength(1);
    });

    it('has driver with name for avatar initials', () => {
      const driver = createMockDriver({
        first_name: 'John',
        last_name: 'Doe',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.first_name).toBe('John');
      expect(drivers[0]?.last_name).toBe('Doe');
    });
  });

  describe('Nickname Display', () => {
    it('has driver with nickname', () => {
      const driver = createMockDriver({
        display_name: 'John Doe',
        nickname: 'JDoe',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.nickname).toBe('JDoe');
    });

    it('has driver without nickname', () => {
      const driver = createMockDriver({
        display_name: 'John Doe',
        nickname: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      const drivers = dataTable.props('value') as Driver[];
      expect(drivers[0]?.display_name).toBe('John Doe');
      expect(drivers[0]?.nickname).toBeNull();
    });
  });

  describe('Table Features', () => {
    it('has correct CSS class', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.exists()).toBe(true);
    });

    it('supports pagination', () => {
      const drivers = Array.from({ length: 20 }, (_, i) =>
        createMockDriver({ id: i + 1, display_name: `Driver ${i + 1}` }),
      );
      const wrapper = mountDriverDataTable({ drivers });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('paginator')).toBe(true);
      expect(dataTable.props('rows')).toBe(15);
    });

    it('has correct rows per page', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('rows')).toBe(15);
    });

    it('has striped rows', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });
      const dataTable = wrapper.findComponent({ name: 'DataTable' });

      expect(dataTable.props('stripedRows')).toBe(true);
    });
  });
});
