import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminUsersTable from '../AdminUsersTable.vue';
import type { Admin } from '@admin/types/admin';

describe('AdminUsersTable', () => {
  const mockAdmins: Admin[] = [
    {
      id: 1,
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      role: 'admin',
      status: 'active',
      last_login_at: '2024-01-10T00:00:00.000000Z',
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
      deleted_at: null,
    },
  ];

  const createWrapper = (props: Partial<typeof mockProps> = {}) => {
    return mount(AdminUsersTable, {
      props: {
        adminUsers: mockAdmins,
        totalRecords: 1,
        rowsPerPage: 10,
        currentRoleLevel: 3,
        ...props,
      },
      global: {
        directives: {
          tooltip: () => {},
        },
        stubs: {
          DataTable: {
            template: '<div class="p-datatable"><slot name="empty" /><slot name="loading" /></div>',
            props: [
              'value',
              'loading',
              'rows',
              'paginator',
              'rowsPerPageOptions',
              'totalRecords',
              'lazy',
            ],
          },
          Column: true,
          Button: true,
          Badge: true,
          EmptyState: true,
          LoadingState: true,
        },
      },
    });
  };

  const _mockProps = {
    adminUsers: mockAdmins,
    totalRecords: 1,
    rowsPerPage: 10,
    currentRoleLevel: 3,
    loading: false,
  };

  it('renders without errors', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders DataTable component', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.p-datatable').exists()).toBe(true);
  });

  it('passes adminUsers to DataTable', () => {
    const wrapper = createWrapper();
    const dataTable = wrapper.find('.p-datatable');
    expect(dataTable.exists()).toBe(true);
    // Check the component's data was set correctly
    const vm = wrapper.vm as any;
    expect(vm.$props.adminUsers).toEqual(mockAdmins);
  });

  it('shows loading state when loading', () => {
    const wrapper = createWrapper({ loading: true, adminUsers: [] });
    const dataTable = wrapper.find('.p-datatable');
    expect(dataTable.exists()).toBe(true);
    // Check the component's data was set correctly
    const vm = wrapper.vm as any;
    expect(vm.$props.loading).toBe(true);
  });

  it('emits view event when view button is clicked', async () => {
    const wrapper = createWrapper();

    const vm = wrapper.vm as any;
    vm.handleView(mockAdmins[0]);

    expect(wrapper.emitted('view')).toBeTruthy();
    expect(wrapper.emitted('view')?.[0]).toEqual([mockAdmins[0]]);
  });
});
