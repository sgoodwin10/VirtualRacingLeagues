import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import UsersTable from '../UsersTable.vue';
import { mount } from '@vue/test-utils';
import { createMockUser } from '@admin/__tests__/helpers/mockFactories';
import type { User } from '@admin/types/user';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

describe('UsersTable', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  /**
   * Helper function to mount UsersTable with proper configuration
   * Using real PrimeVue components instead of stubs for better testing
   */
  const mountUsersTable = (props = {}) => {
    return mount(UsersTable, {
      props,
      global: {
        plugins: [pinia, PrimeVue, ToastService],
        components: {
          DataTable,
          Column,
          Button,
        },
        directives: {
          tooltip: Tooltip,
        },
        stubs: {
          Badge: true,
          EmptyState: true,
          LoadingState: true,
        },
      },
    });
  };

  describe('Component Rendering', () => {
    it('renders empty state when no users provided', () => {
      const wrapper = mountUsersTable({ users: [] });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.exists()).toBe(true);
      expect(dataTable.props('value')).toEqual([]);
    });

    it('renders loading state when loading prop is true', () => {
      const wrapper = mountUsersTable({ loading: true });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('loading')).toBe(true);
    });

    it('renders table with user data', () => {
      const users = [
        createMockUser({ first_name: 'John', last_name: 'Doe' }),
        createMockUser({ first_name: 'Jane', last_name: 'Smith' }),
      ];

      const wrapper = mountUsersTable({ users });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('value')).toEqual(users);
      expect(dataTable.props('value')).toHaveLength(2);
    });

    it('passes correct props to DataTable', () => {
      const users = [createMockUser()];
      const wrapper = mountUsersTable({ users, loading: false });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('value')).toEqual(users);
      expect(dataTable.props('loading')).toBe(false);
      expect(dataTable.props('stripedRows')).toBe(true);
    });
  });

  describe('User Status', () => {
    it('renders with user having active status', () => {
      const user = createMockUser({ status: 'active' });
      const wrapper = mountUsersTable({ users: [user] });
      const dataTable = wrapper.findComponent(DataTable);

      const users = dataTable.props('value') as User[];
      expect(users[0]?.status).toBe('active');
    });

    it('renders with user having inactive status', () => {
      const user = createMockUser({ status: 'inactive' });
      const wrapper = mountUsersTable({ users: [user] });
      const dataTable = wrapper.findComponent(DataTable);

      const users = dataTable.props('value') as User[];
      expect(users[0]?.status).toBe('inactive');
    });

    it('renders with user having suspended status', () => {
      const user = createMockUser({ status: 'suspended' });
      const wrapper = mountUsersTable({ users: [user] });
      const dataTable = wrapper.findComponent(DataTable);

      const users = dataTable.props('value') as User[];
      expect(users[0]?.status).toBe('suspended');
    });
  });

  describe('Event Emissions', () => {
    it('emits view event when handleView is called', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      // Access component instance and call method directly
      (wrapper.vm as any).handleView(user);

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([user]);
    });

    it('emits edit event when handleEdit is called', () => {
      const user = createMockUser();
      const wrapper = mountUsersTable({ users: [user] });

      (wrapper.vm as any).handleEdit(user);

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([user]);
    });

    it('emits deactivate event when handleDeactivate is called', () => {
      const user = createMockUser({ deleted_at: null });
      const wrapper = mountUsersTable({ users: [user] });

      (wrapper.vm as any).handleDeactivate(user);

      expect(wrapper.emitted('deactivate')).toBeTruthy();
      expect(wrapper.emitted('deactivate')?.[0]).toEqual([user]);
    });

    it('emits reactivate event when handleReactivate is called', () => {
      const user = createMockUser({ deleted_at: '2024-01-01T00:00:00Z' });
      const wrapper = mountUsersTable({ users: [user] });

      (wrapper.vm as any).handleReactivate(user);

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
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('value')).toHaveLength(3);
      expect(dataTable.props('value')).toEqual(users);
    });

    it('handles mixed deleted states correctly', () => {
      const users: User[] = [
        createMockUser({ deleted_at: null }),
        createMockUser({ deleted_at: '2024-01-01T00:00:00Z' }),
        createMockUser({ deleted_at: null }),
      ];

      const wrapper = mountUsersTable({ users });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('value')).toHaveLength(3);

      // Check that deleted_at is correctly set
      const deletedUsers = (dataTable.props('value') as User[]).filter(
        (u) => u.deleted_at !== null,
      );
      expect(deletedUsers.length).toBe(1);
    });

    it('handles mixed status values correctly', () => {
      const users = [
        createMockUser({ status: 'active' }),
        createMockUser({ status: 'inactive' }),
        createMockUser({ status: 'suspended' }),
      ];

      const wrapper = mountUsersTable({ users });
      const dataTable = wrapper.findComponent(DataTable);

      const tableUsers = dataTable.props('value') as User[];
      expect(tableUsers[0]?.status).toBe('active');
      expect(tableUsers[1]?.status).toBe('inactive');
      expect(tableUsers[2]?.status).toBe('suspended');
    });
  });

  describe('Default Props', () => {
    it('uses empty array as default for users prop', () => {
      const wrapper = mountUsersTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('value')).toEqual([]);
    });

    it('uses false as default for loading prop', () => {
      const wrapper = mountUsersTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('loading')).toBe(false);
    });
  });

  describe('Table Features', () => {
    it('has pagination enabled', () => {
      const wrapper = mountUsersTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('paginator')).toBe(true);
    });

    it('has striped rows enabled', () => {
      const wrapper = mountUsersTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('stripedRows')).toBe(true);
    });

    it('has correct rows per page', () => {
      const wrapper = mountUsersTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('rows')).toBe(15);
    });
  });

  describe('Name Display', () => {
    it('includes first and last name in data', () => {
      const user = createMockUser({
        first_name: 'John',
        last_name: 'Doe',
      });
      const wrapper = mountUsersTable({ users: [user] });
      const dataTable = wrapper.findComponent(DataTable);

      const users = dataTable.props('value') as User[];
      expect(users[0]?.first_name).toBe('John');
      expect(users[0]?.last_name).toBe('Doe');
    });

    it('includes deleted_at for deactivated users', () => {
      const user = createMockUser({
        first_name: 'John',
        last_name: 'Doe',
        deleted_at: '2024-01-01T00:00:00Z',
      });
      const wrapper = mountUsersTable({ users: [user] });
      const dataTable = wrapper.findComponent(DataTable);

      const users = dataTable.props('value') as User[];
      expect(users[0]?.deleted_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('Columns', () => {
    it('renders correct number of columns', () => {
      const wrapper = mountUsersTable();
      const columns = wrapper.findAllComponents(Column);

      // ID, Name, Email, Alias, Status, Created, Actions
      expect(columns.length).toBe(7);
    });

    it('has ID column', () => {
      const wrapper = mountUsersTable();
      const columns = wrapper.findAllComponents(Column);
      const idColumn = columns.find((col) => col.props('field') === 'id');

      expect(idColumn).toBeDefined();
      expect(idColumn?.props('header')).toBe('ID');
    });

    it('has Name column', () => {
      const wrapper = mountUsersTable();
      const columns = wrapper.findAllComponents(Column);
      const nameColumn = columns.find((col) => col.props('header') === 'Name');

      expect(nameColumn).toBeDefined();
    });

    it('has Email column', () => {
      const wrapper = mountUsersTable();
      const columns = wrapper.findAllComponents(Column);
      const emailColumn = columns.find((col) => col.props('field') === 'email');

      expect(emailColumn).toBeDefined();
      expect(emailColumn?.props('header')).toBe('Email');
    });

    it('has Alias column', () => {
      const wrapper = mountUsersTable();
      const columns = wrapper.findAllComponents(Column);
      const aliasColumn = columns.find((col) => col.props('field') === 'alias');

      expect(aliasColumn).toBeDefined();
      expect(aliasColumn?.props('header')).toBe('Alias');
    });

    it('has Status column', () => {
      const wrapper = mountUsersTable();
      const columns = wrapper.findAllComponents(Column);
      const statusColumn = columns.find((col) => col.props('field') === 'status');

      expect(statusColumn).toBeDefined();
      expect(statusColumn?.props('header')).toBe('Status');
    });

    it('has Created column', () => {
      const wrapper = mountUsersTable();
      const columns = wrapper.findAllComponents(Column);
      const createdColumn = columns.find((col) => col.props('field') === 'created_at');

      expect(createdColumn).toBeDefined();
      expect(createdColumn?.props('header')).toBe('Created');
    });

    it('has Actions column', () => {
      const wrapper = mountUsersTable();
      const columns = wrapper.findAllComponents(Column);
      const actionsColumn = columns.find((col) => col.props('header') === 'Actions');

      expect(actionsColumn).toBeDefined();
    });
  });
});
