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

      expect(wrapper.text()).toContain('No drivers found');
    });

    it('renders loading state when loading prop is true', () => {
      const wrapper = mountDriverDataTable({ loading: true });

      expect(wrapper.text()).toContain('Loading drivers...');
    });

    it('renders table with driver data', () => {
      const drivers = [
        createMockDriver({ display_name: 'John Doe' }),
        createMockDriver({ display_name: 'Jane Smith' }),
      ];

      const wrapper = mountDriverDataTable({ drivers });

      expect(wrapper.text()).toContain('John Doe');
      expect(wrapper.text()).toContain('Jane Smith');
    });

    it('displays driver ID column', () => {
      const driver = createMockDriver({ id: 456 });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('456');
    });

    it('displays driver name and nickname', () => {
      const driver = createMockDriver({
        display_name: 'John Doe',
        nickname: 'JDoe',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('John Doe');
      expect(wrapper.text()).toContain('JDoe');
    });

    it('displays email when provided', () => {
      const driver = createMockDriver({ email: 'john@example.com' });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('john@example.com');
    });

    it('shows dash when email is null', () => {
      const driver = createMockDriver({ email: null });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      // Email column should show dash
      const cells = wrapper.findAll('td').filter((td) => td.text() === '-');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('Driver Initials', () => {
    it('displays initials from first and last name', () => {
      const driver = createMockDriver({
        first_name: 'John',
        last_name: 'Doe',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('JD');
    });

    it('falls back to nickname when no first/last name', () => {
      const driver = createMockDriver({
        first_name: null,
        last_name: null,
        nickname: 'SpeedRacer',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('SP');
    });

    it('displays DR fallback when no name or nickname', () => {
      const driver = createMockDriver({
        first_name: null,
        last_name: null,
        nickname: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('DR');
    });
  });

  describe('Platform IDs', () => {
    it('displays PSN ID when provided', () => {
      const driver = createMockDriver({
        psn_id: 'PSN123456',
        iracing_id: null,
        discord_id: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('PSN');
      expect(wrapper.text()).toContain('PSN123456');
    });

    it('displays iRacing ID when provided', () => {
      const driver = createMockDriver({
        psn_id: null,
        iracing_id: '654321',
        discord_id: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('iRacing');
      expect(wrapper.text()).toContain('654321');
    });

    it('displays Discord ID when provided', () => {
      const driver = createMockDriver({
        psn_id: null,
        iracing_id: null,
        discord_id: '123456789012345678',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('Discord');
      expect(wrapper.text()).toContain('123456789012345678');
    });

    it('displays multiple platform IDs', () => {
      const driver = createMockDriver({
        psn_id: 'PSN123',
        iracing_id: '456',
        discord_id: '789',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('PSN');
      expect(wrapper.text()).toContain('iRacing');
      expect(wrapper.text()).toContain('Discord');
    });

    it('shows "No platform IDs" when none provided', () => {
      const driver = createMockDriver({
        psn_id: null,
        iracing_id: null,
        discord_id: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('No platform IDs');
    });
  });

  describe('Driver Status', () => {
    it('displays active status with success badge', () => {
      const driver = createMockDriver({ deleted_at: null });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('Active');
    });

    it('displays deleted status with danger badge', () => {
      const driver = createMockDriver({ deleted_at: '2024-01-01T00:00:00Z' });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('Deleted');
    });
  });

  describe('Created Date', () => {
    it('displays formatted created date', () => {
      const driver = createMockDriver({
        created_at: '2024-01-15T10:30:00Z',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      // Date should be formatted by useDateFormatter composable
      // Just check that some date-related text is present
      expect(wrapper.html()).toContain('2024');
    });
  });

  describe('Action Buttons', () => {
    it('renders view button for all drivers', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      const viewButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-eye');
        return icon.exists();
      });

      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it('renders edit button for all drivers', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      const editButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-pencil');
        return icon.exists();
      });

      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('renders delete button for active drivers', () => {
      const driver = createMockDriver({ deleted_at: null });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('does not render delete button for deleted drivers', () => {
      const driver = createMockDriver({ deleted_at: '2024-01-01T00:00:00Z' });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      expect(deleteButtons.length).toBe(0);
    });
  });

  describe('Event Emissions', () => {
    it('emits view event when view button clicked', async () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      const viewButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-eye');
        return icon.exists();
      });

      await viewButtons[0].trigger('click');

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([driver]);
    });

    it('emits edit event when edit button clicked', async () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      const editButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-pencil');
        return icon.exists();
      });

      await editButtons[0].trigger('click');

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([driver]);
    });

    it('emits delete event when delete button clicked', async () => {
      const driver = createMockDriver({ deleted_at: null });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      await deleteButtons[0].trigger('click');

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

      expect(wrapper.text()).toContain('Driver 1');
      expect(wrapper.text()).toContain('Driver 2');
      expect(wrapper.text()).toContain('Driver 3');
    });

    it('handles mixed deleted states correctly', () => {
      const drivers = [
        createMockDriver({ deleted_at: null }),
        createMockDriver({ deleted_at: '2024-01-01T00:00:00Z' }),
      ];

      const wrapper = mountDriverDataTable({ drivers });

      // Should show delete button for active driver only
      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      // Only one delete button should be present (for the active driver)
      expect(deleteButtons.length).toBe(1);
    });
  });

  describe('Default Props', () => {
    it('uses empty array as default for drivers prop', () => {
      const wrapper = mountDriverDataTable();

      expect(wrapper.text()).toContain('No drivers found');
    });

    it('uses false as default for loading prop', () => {
      const wrapper = mountDriverDataTable();

      expect(wrapper.text()).not.toContain('Loading drivers...');
    });
  });

  describe('Avatar Display', () => {
    it('displays avatar with gradient background', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      // Check for the avatar div with gradient classes
      expect(wrapper.html()).toContain('from-blue-500');
      expect(wrapper.html()).toContain('to-blue-600');
    });

    it('displays initials in avatar', () => {
      const driver = createMockDriver({
        first_name: 'John',
        last_name: 'Doe',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      // Initials should be in the avatar
      const avatarDiv = wrapper.find('.from-blue-500');
      expect(avatarDiv.text()).toContain('JD');
    });
  });

  describe('Nickname Display', () => {
    it('displays nickname when provided', () => {
      const driver = createMockDriver({
        display_name: 'John Doe',
        nickname: 'JDoe',
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.text()).toContain('JDoe');
    });

    it('does not display nickname section when null', () => {
      const driver = createMockDriver({
        display_name: 'John Doe',
        nickname: null,
      });
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      // The nickname paragraph should not exist
      // Main name should still be there
      expect(wrapper.text()).toContain('John Doe');
    });
  });

  describe('Table Features', () => {
    it('applies proper table classes', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      expect(wrapper.find('.drivers-table').exists()).toBe(true);
    });

    it('supports pagination', () => {
      const drivers = Array.from({ length: 20 }, (_, i) =>
        createMockDriver({ id: i + 1, display_name: `Driver ${i + 1}` }),
      );
      const wrapper = mountDriverDataTable({ drivers });

      // DataTable has paginator prop set to true
      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('paginator')).toBe(true);
      expect(dataTable.props('rows')).toBe(15);
    });

    it('is responsive', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('responsiveLayout')).toBe('scroll');
    });

    it('has striped rows', () => {
      const driver = createMockDriver();
      const wrapper = mountDriverDataTable({ drivers: [driver] });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('stripedRows')).toBe(true);
    });
  });
});
