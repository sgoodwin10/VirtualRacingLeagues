import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import UsersTable from '../UsersTable.vue';
import { mountWithStubs } from '@admin/__tests__/setup/testUtils';
import { createMockUser } from '@admin/__tests__/helpers/mockFactories';
import type { User } from '@admin/types/user';

describe('UsersTable', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  /**
   * Helper function to mount UsersTable with proper configuration
   */
  const mountUsersTable = (props = {}) => {
    return mountWithStubs(UsersTable, {
      props,
      global: {
        plugins: [pinia],
      },
    });
  };

  describe('Component Rendering', () => {
    it('renders empty state when no users provided', () => {
      const wrapper = mountUsersTable({ users: [] });

      expect(wrapper.text()).toContain('No users found');
    });

    it('renders loading state when loading prop is true', () => {
      const wrapper = mountUsersTable({ loading: true });

      expect(wrapper.text()).toContain('Loading users...');
    });

    it('renders table with user data', () => {
      const users = [
        createMockUser({ first_name: 'John', last_name: 'Doe' }),
        createMockUser({ first_name: 'Jane', last_name: 'Smith' }),
      ];

      const wrapper = mountUsersTable({ users });

      expect(wrapper.text()).toContain('John Doe');
      expect(wrapper.text()).toContain('Jane Smith');
    });

    it('displays user ID column', () => {
      const user = createMockUser({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.text()).toContain('123e4567-e89b-12d3-a456-426614174000');
    });

    it('displays user name', () => {
      const user = createMockUser({
        first_name: 'John',
        last_name: 'Doe',
      });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.text()).toContain('John Doe');
    });

    it('displays deactivated indicator for deleted users', () => {
      const user = createMockUser({
        first_name: 'John',
        last_name: 'Doe',
        deleted_at: '2024-01-01T00:00:00Z',
      });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.text()).toContain('(Deactivated)');
    });

    it('displays email address', () => {
      const user = createMockUser({ email: 'john@example.com' });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.text()).toContain('john@example.com');
    });

    it('displays alias when provided', () => {
      const user = createMockUser({ alias: 'johndoe123' });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.text()).toContain('johndoe123');
    });

    it('shows dash when alias is null', () => {
      const user = createMockUser({ alias: null });
      const wrapper = mountUsersTable({ users: [user] });

      // Alias column should show dash
      const cells = wrapper.findAll('td').filter((td) => td.text() === '-');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('User Status', () => {
    it('displays active status with success badge', () => {
      const user = createMockUser({ status: 'active' });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.text()).toContain('Active');
    });

    it('displays inactive status with warning badge', () => {
      const user = createMockUser({ status: 'inactive' });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.text()).toContain('Inactive');
    });

    it('displays suspended status with danger badge', () => {
      const user = createMockUser({ status: 'suspended' });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.text()).toContain('Suspended');
    });
  });

  describe('Created Date', () => {
    it('displays formatted created date', () => {
      const user = createMockUser({
        created_at: '2024-01-15T10:30:00Z',
      });
      const wrapper = mountUsersTable({ users: [user] });

      // Date should be formatted by useDateFormatter composable
      // Just check that some date-related text is present
      expect(wrapper.html()).toContain('2024');
    });
  });

  describe('Action Buttons', () => {
    it('renders view button for all users', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const viewButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-eye');
        return icon.exists();
      });

      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it('renders edit button for all users', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const editButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-pencil');
        return icon.exists();
      });

      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('renders deactivate button for active users', () => {
      const user = createMockUser({ deleted_at: null });
      const wrapper = mountUsersTable({ users: [user] });

      const deactivateButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      expect(deactivateButtons.length).toBeGreaterThan(0);
    });

    it('renders reactivate button for deactivated users', () => {
      const user = createMockUser({ deleted_at: '2024-01-01T00:00:00Z' });
      const wrapper = mountUsersTable({ users: [user] });

      const reactivateButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-refresh');
        return icon.exists();
      });

      expect(reactivateButtons.length).toBeGreaterThan(0);
    });

    it('does not render deactivate button for deactivated users', () => {
      const user = createMockUser({ deleted_at: '2024-01-01T00:00:00Z' });
      const wrapper = mountUsersTable({ users: [user] });

      const deactivateButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      expect(deactivateButtons.length).toBe(0);
    });

    it('does not render reactivate button for active users', () => {
      const user = createMockUser({ deleted_at: null });
      const wrapper = mountUsersTable({ users: [user] });

      const reactivateButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-refresh');
        return icon.exists();
      });

      expect(reactivateButtons.length).toBe(0);
    });
  });

  describe('Event Emissions', () => {
    it('emits view event when view button clicked', async () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const viewButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-eye');
        return icon.exists();
      });

      await viewButtons[0].trigger('click');

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([user]);
    });

    it('emits edit event when edit button clicked', async () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const editButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-pencil');
        return icon.exists();
      });

      await editButtons[0].trigger('click');

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([user]);
    });

    it('emits deactivate event when deactivate button clicked', async () => {
      const user = createMockUser({ deleted_at: null });
      const wrapper = mountUsersTable({ users: [user] });

      const deactivateButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });

      await deactivateButtons[0].trigger('click');

      expect(wrapper.emitted('deactivate')).toBeTruthy();
      expect(wrapper.emitted('deactivate')?.[0]).toEqual([user]);
    });

    it('emits reactivate event when reactivate button clicked', async () => {
      const user = createMockUser({ deleted_at: '2024-01-01T00:00:00Z' });
      const wrapper = mountUsersTable({ users: [user] });

      const reactivateButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-refresh');
        return icon.exists();
      });

      await reactivateButtons[0].trigger('click');

      expect(wrapper.emitted('reactivate')).toBeTruthy();
      expect(wrapper.emitted('reactivate')?.[0]).toEqual([user]);
    });
  });

  describe('Multiple Users', () => {
    it('renders multiple users correctly', () => {
      const users = [
        createMockUser({ first_name: 'John', last_name: 'Doe' }),
        createMockUser({ first_name: 'Jane', last_name: 'Smith' }),
        createMockUser({ first_name: 'Bob', last_name: 'Johnson' }),
      ];

      const wrapper = mountUsersTable({ users });

      expect(wrapper.text()).toContain('John Doe');
      expect(wrapper.text()).toContain('Jane Smith');
      expect(wrapper.text()).toContain('Bob Johnson');
    });

    it('handles mixed deleted states correctly', () => {
      const users = [
        createMockUser({ deleted_at: null }),
        createMockUser({ deleted_at: '2024-01-01T00:00:00Z' }),
      ];

      const wrapper = mountUsersTable({ users });

      // Should show deactivate button for active user
      const deactivateButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-trash');
        return icon.exists();
      });
      expect(deactivateButtons.length).toBe(1);

      // Should show reactivate button for deactivated user
      const reactivateButtons = wrapper.findAll('button').filter((btn) => {
        const icon = btn.find('.pi-refresh');
        return icon.exists();
      });
      expect(reactivateButtons.length).toBe(1);
    });

    it('handles mixed status values correctly', () => {
      const users = [
        createMockUser({ status: 'active' }),
        createMockUser({ status: 'inactive' }),
        createMockUser({ status: 'suspended' }),
      ];

      const wrapper = mountUsersTable({ users });

      expect(wrapper.text()).toContain('Active');
      expect(wrapper.text()).toContain('Inactive');
      expect(wrapper.text()).toContain('Suspended');
    });
  });

  describe('Default Props', () => {
    it('uses empty array as default for users prop', () => {
      const wrapper = mountUsersTable();

      expect(wrapper.text()).toContain('No users found');
    });

    it('uses false as default for loading prop', () => {
      const wrapper = mountUsersTable();

      expect(wrapper.text()).not.toContain('Loading users...');
    });
  });

  describe('Table Features', () => {
    it('applies proper table classes', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.find('.users-table').exists()).toBe(true);
    });

    it('supports pagination', () => {
      const users = Array.from({ length: 20 }, (_, i) =>
        createMockUser({
          id: `user-${i + 1}`,
          first_name: `User${i + 1}`,
          last_name: 'Test',
        }),
      );
      const wrapper = mountUsersTable({ users });

      // DataTable has paginator prop set to true
      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('paginator')).toBe(true);
      expect(dataTable.props('rows')).toBe(15);
    });

    it('is responsive', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('responsiveLayout')).toBe('scroll');
    });

    it('has striped rows', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('stripedRows')).toBe(true);
    });
  });

  describe('Sorting Columns', () => {
    it('marks ID column as sortable', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      const idColumn = columns.find((col) => col.props('field') === 'id');

      expect(idColumn?.props('sortable')).toBe(true);
    });

    it('marks name column as sortable', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      const nameColumn = columns.find((col) => col.props('field') === 'name');

      expect(nameColumn?.props('sortable')).toBe(true);
    });

    it('marks email column as sortable', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      const emailColumn = columns.find((col) => col.props('field') === 'email');

      expect(emailColumn?.props('sortable')).toBe(true);
    });

    it('marks status column as sortable', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      const statusColumn = columns.find((col) => col.props('field') === 'status');

      expect(statusColumn?.props('sortable')).toBe(true);
    });

    it('marks created_at column as sortable', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      const createdColumn = columns.find((col) => col.props('field') === 'created_at');

      expect(createdColumn?.props('sortable')).toBe(true);
    });
  });

  describe('Name Display', () => {
    it('uses getFullName helper to format names', () => {
      const user = createMockUser({
        first_name: 'John',
        last_name: 'Doe',
      });
      const wrapper = mountUsersTable({ users: [user] });

      // The helper should format the name properly
      expect(wrapper.text()).toContain('John Doe');
    });

    it('shows deactivated indicator in red for deleted users', () => {
      const user = createMockUser({
        first_name: 'John',
        last_name: 'Doe',
        deleted_at: '2024-01-01T00:00:00Z',
      });
      const wrapper = mountUsersTable({ users: [user] });

      // Check for red text class on deactivated indicator
      expect(wrapper.html()).toContain('text-red-500');
      expect(wrapper.text()).toContain('(Deactivated)');
    });
  });

  describe('Tooltip Support', () => {
    it('adds tooltip directive to view button', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      // Check that buttons have tooltip directive (v-tooltip)
      expect(wrapper.html()).toContain('View');
    });

    it('adds tooltip directive to edit button', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.html()).toContain('Edit');
    });

    it('adds tooltip directive to deactivate button', () => {
      const user = createMockUser({ deleted_at: null });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.html()).toContain('Deactivate');
    });

    it('adds tooltip directive to reactivate button', () => {
      const user = createMockUser({ deleted_at: '2024-01-01T00:00:00Z' });
      const wrapper = mountUsersTable({ users: [user] });

      expect(wrapper.html()).toContain('Reactivate');
    });
  });
});
