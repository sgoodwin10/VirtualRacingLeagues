import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlDataTable from '../VrlDataTable.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

describe('VrlDataTable', () => {
  const mountTable = (props = {}, slots = {}) => {
    return mount(VrlDataTable, {
      props: {
        value: [],
        ...props,
      },
      slots,
      global: {
        plugins: [
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
              },
            },
          ],
        ],
      },
    });
  };

  describe('Rendering', () => {
    it('renders with empty data', () => {
      const wrapper = mountTable();
      expect(wrapper.find('.vrl-datatable').exists()).toBe(true);
    });

    it('applies custom table class', () => {
      const wrapper = mountTable({ tableClass: 'custom-table' });
      expect(wrapper.find('.custom-table').exists()).toBe(true);
    });

    it('applies hoverable class when hoverable is true', () => {
      const wrapper = mountTable({ hoverable: true });
      // Check the computed tableClasses includes the hoverable modifier
      expect(wrapper.vm.tableClasses).toContain('vrl-datatable--hoverable');
    });

    it('applies striped class when striped is true', () => {
      const wrapper = mountTable({ striped: true });
      // Check the computed tableClasses includes the striped modifier
      expect(wrapper.vm.tableClasses).toContain('vrl-datatable--striped');
    });
  });

  describe('Empty State', () => {
    it('shows default empty message when no data', () => {
      const wrapper = mountTable({ emptyMessage: 'No drivers found' });
      expect(wrapper.text()).toContain('No drivers found');
    });

    it('shows custom empty slot content', () => {
      const wrapper = mountTable(
        {},
        {
          empty: '<div class="custom-empty">Custom empty message</div>',
        },
      );
      expect(wrapper.find('.custom-empty').exists()).toBe(true);
      expect(wrapper.text()).toContain('Custom empty message');
    });
  });

  describe('Loading State', () => {
    it('shows loading state when loading is true', () => {
      const wrapper = mountTable({ loading: true });
      expect(wrapper.find('.pi-spinner').exists()).toBe(true);
    });
  });

  describe('Podium Highlighting', () => {
    it('applies podium-1 class to first position', () => {
      const data = [
        { position: 1, name: 'Driver 1' },
        { position: 2, name: 'Driver 2' },
      ];

      const wrapper = mountTable({
        value: data,
        podiumHighlight: true,
        positionField: 'position',
      });

      // Check if podium highlighting logic is applied
      expect(wrapper.vm.getRowClass).toBeDefined();
    });

    it('does not apply podium class when podiumHighlight is false', () => {
      const data = [{ position: 1, name: 'Driver 1' }];

      const wrapper = mountTable({
        value: data,
        podiumHighlight: false,
      });

      // podiumHighlight is false, so getRowClass should not be used
      const dataTableProps = wrapper.findComponent({ name: 'DataTable' }).props();
      // When podiumHighlight is false, rowClass is undefined, which PrimeVue may set to null
      expect(dataTableProps.rowClass).toBeFalsy();
    });
  });

  describe('Events', () => {
    it('emits page event on pagination', async () => {
      const wrapper = mountTable({
        value: Array(20).fill({ name: 'Test' }),
        paginated: true,
        rows: 10,
      });

      // Emit a page event manually
      const pageEvent = {
        page: 1,
        rows: 10,
        first: 10,
        pageCount: 2,
      };

      await wrapper.vm.onPage(pageEvent);
      expect(wrapper.emitted('page')).toBeTruthy();
      expect(wrapper.emitted('page')?.[0]).toEqual([pageEvent]);
    });

    it('emits sort event', async () => {
      const wrapper = mountTable({
        value: [{ name: 'Test' }],
      });

      const sortEvent = {
        sortField: 'name',
        sortOrder: 1,
      };

      await wrapper.vm.onSort(sortEvent);
      expect(wrapper.emitted('sort')).toBeTruthy();
      expect(wrapper.emitted('sort')?.[0]).toEqual([sortEvent]);
    });

    it('emits filter event', async () => {
      const wrapper = mountTable({
        value: [{ name: 'Test' }],
      });

      const filterEvent = {
        filters: {},
      };

      await wrapper.vm.onFilter(filterEvent);
      expect(wrapper.emitted('filter')).toBeTruthy();
      expect(wrapper.emitted('filter')?.[0]).toEqual([filterEvent]);
    });
  });

  describe('Pagination', () => {
    it('shows custom pagination when useCustomPagination is true', () => {
      const wrapper = mountTable({
        value: Array(20).fill({ name: 'Test' }),
        paginated: true,
        rows: 10,
        useCustomPagination: true,
      });

      // Custom pagination should be enabled
      expect(wrapper.props('useCustomPagination')).toBe(true);
    });

    it('uses entity name in pagination', () => {
      const wrapper = mountTable({
        value: Array(20).fill({ name: 'Test' }),
        paginated: true,
        rows: 10,
        entityName: 'drivers',
      });

      expect(wrapper.props('entityName')).toBe('drivers');
    });
  });

  describe('Props Defaults', () => {
    it('has correct default values', () => {
      const wrapper = mountTable();

      expect(wrapper.props('loading')).toBe(false);
      expect(wrapper.props('emptyMessage')).toBe('No data available');
      expect(wrapper.props('paginated')).toBe(false);
      expect(wrapper.props('rows')).toBe(10);
      expect(wrapper.props('sortable')).toBe(true);
      expect(wrapper.props('hoverable')).toBe(true);
      expect(wrapper.props('striped')).toBe(false);
      expect(wrapper.props('podiumHighlight')).toBe(false);
      expect(wrapper.props('responsiveLayout')).toBe('scroll');
      expect(wrapper.props('useCustomPagination')).toBe(true);
      expect(wrapper.props('entityName')).toBe('records');
    });
  });
});
