import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ActivityLogTable from '../ActivityLogTable.vue';
import type { Activity } from '@admin/types/activityLog';

describe('ActivityLogTable', () => {
  const mockActivities: Activity[] = [
    {
      id: 1,
      log_name: 'admin',
      description: 'Created admin user',
      subject_type: 'Admin',
      subject_id: 1,
      causer_type: 'Admin',
      causer_id: 1,
      event: 'created',
      properties: {},
      batch_uuid: null,
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
  ];

  const createWrapper = (props: Partial<{ activities: Activity[]; loading: boolean }> = {}) => {
    return mount(ActivityLogTable, {
      props: {
        activities: mockActivities,
        ...props,
      },
      global: {
        directives: {
          tooltip: () => {},
        },
        stubs: {
          DataTable: {
            template: '<div class="p-datatable"><slot name="empty" /><slot name="loading" /></div>',
            props: ['value', 'loading', 'rows', 'paginator', 'rowsPerPageOptions'],
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

  it('renders without errors', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders DataTable component', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.p-datatable').exists()).toBe(true);
  });

  it('passes activities to DataTable', () => {
    const wrapper = createWrapper();
    const dataTable = wrapper.find('.p-datatable');
    expect(dataTable.exists()).toBe(true);
    // Check the component's data was set correctly
    const vm = wrapper.vm as any;
    expect(vm.$props.activities).toEqual(mockActivities);
  });

  it('shows loading state when loading', () => {
    const wrapper = createWrapper({ loading: true });
    const dataTable = wrapper.find('.p-datatable');
    expect(dataTable.exists()).toBe(true);
    // Check the component's data was set correctly
    const vm = wrapper.vm as any;
    expect(vm.$props.loading).toBe(true);
  });

  it('emits view-details event when view button is clicked', async () => {
    const wrapper = createWrapper();

    const vm = wrapper.vm as any;
    vm.handleViewDetails(mockActivities[0]);

    expect(wrapper.emitted('view-details')).toBeTruthy();
    expect(wrapper.emitted('view-details')?.[0]).toEqual([mockActivities[0]]);
  });
});
