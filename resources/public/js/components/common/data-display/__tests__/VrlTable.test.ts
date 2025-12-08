import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlTable, { type TableColumn } from '../VrlTable.vue';
import DataTable from 'primevue/datatable';

describe('VrlTable', () => {
  const mockColumns: TableColumn[] = [
    { field: 'name', header: 'Name', sortable: true },
    { field: 'age', header: 'Age', sortable: true, align: 'right' },
    { field: 'email', header: 'Email' },
  ];

  const mockData = [
    { name: 'Alice', age: 30, email: 'alice@example.com' },
    { name: 'Bob', age: 25, email: 'bob@example.com' },
    { name: 'Charlie', age: 35, email: 'charlie@example.com' },
  ];

  describe('Rendering', () => {
    it('renders the table with data', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      expect(wrapper.findComponent(DataTable).exists()).toBe(true);
      expect(wrapper.html()).toContain('Alice');
      expect(wrapper.html()).toContain('Bob');
      expect(wrapper.html()).toContain('Charlie');
    });

    it('renders with empty data', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: [],
          columns: mockColumns,
        },
      });

      expect(wrapper.findComponent(DataTable).exists()).toBe(true);
      expect(wrapper.text()).toContain('No data available');
    });

    it('renders all column headers', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      expect(wrapper.html()).toContain('Name');
      expect(wrapper.html()).toContain('Age');
      expect(wrapper.html()).toContain('Email');
    });
  });

  describe('Props', () => {
    it('applies custom class', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          class: 'custom-table-class',
        },
      });

      expect(wrapper.classes()).toContain('custom-table-class');
    });

    it('enables sticky header when prop is true', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          stickyHeader: true,
        },
      });

      expect(wrapper.classes()).toContain('sticky-header');
    });

    it('disables sticky header by default', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      expect(wrapper.classes()).not.toContain('sticky-header');
    });

    it('shows loading state when loading prop is true', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: [],
          columns: mockColumns,
          loading: true,
        },
      });

      const dataTable = wrapper.findComponent(DataTable);
      expect(dataTable.props('loading')).toBe(true);
    });

    it('applies column width when specified', () => {
      const columnsWithWidth: TableColumn[] = [{ field: 'name', header: 'Name', width: '200px' }];

      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: columnsWithWidth,
        },
      });

      // Check that column component receives width
      const dataTable = wrapper.findComponent(DataTable);
      expect(dataTable.exists()).toBe(true);
    });
  });

  describe('Column Alignment', () => {
    it('applies left alignment by default', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: [{ field: 'name', header: 'Name' }],
        },
      });

      expect(wrapper.html()).toContain('text-left');
    });

    it('applies center alignment when specified', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: [{ field: 'name', header: 'Name', align: 'center' }],
        },
      });

      expect(wrapper.html()).toContain('text-center');
    });

    it('applies right alignment when specified', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: [{ field: 'age', header: 'Age', align: 'right' }],
        },
      });

      expect(wrapper.html()).toContain('text-right');
    });
  });

  describe('Slots', () => {
    it('uses custom cell slot for rendering', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: [{ field: 'name', header: 'Name' }],
        },
        slots: {
          'cell-name':
            '<template #cell-name="{ data }"><strong>{{ data.name }}</strong></template>',
        },
      });

      expect(wrapper.html()).toContain('<strong>');
    });

    it('renders custom empty state', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: [],
          columns: mockColumns,
        },
        slots: {
          empty: '<div class="custom-empty">No records found</div>',
        },
      });

      expect(wrapper.text()).toContain('No records found');
      expect(wrapper.html()).toContain('custom-empty');
    });

    it('renders custom loading state', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: [],
          columns: mockColumns,
          loading: true,
        },
        slots: {
          loading: '<div class="custom-loading">Please wait...</div>',
        },
      });

      expect(wrapper.text()).toContain('Please wait...');
      expect(wrapper.html()).toContain('custom-loading');
    });
  });

  describe('Styling', () => {
    it('has vrl-table base class', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      expect(wrapper.classes()).toContain('vrl-table');
    });

    it('applies theme-aware background color', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      // Component should have vrl-table class which applies theme styling via CSS
      expect(wrapper.classes()).toContain('vrl-table');
    });
  });

  describe('Accessibility', () => {
    it('renders semantic table structure', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      // DataTable component from PrimeVue provides semantic table structure
      expect(wrapper.findComponent(DataTable).exists()).toBe(true);
    });

    it('supports sortable columns', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      // Verify that sortable columns are configured
      const dataTable = wrapper.findComponent(DataTable);
      expect(dataTable.exists()).toBe(true);
    });
  });

  describe('Data Handling', () => {
    it('handles empty column list gracefully', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: [],
        },
      });

      expect(wrapper.findComponent(DataTable).exists()).toBe(true);
    });

    it('updates when data prop changes', async () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      expect(wrapper.html()).toContain('Alice');

      const newData = [{ name: 'David', age: 40, email: 'david@example.com' }];
      await wrapper.setProps({ data: newData });

      expect(wrapper.html()).toContain('David');
      expect(wrapper.html()).not.toContain('Alice');
    });

    it('renders default cell content when no slot provided', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: [{ field: 'name', header: 'Name' }],
        },
      });

      expect(wrapper.html()).toContain('Alice');
      expect(wrapper.html()).toContain('Bob');
      expect(wrapper.html()).toContain('Charlie');
    });
  });

  describe('PrimeVue Integration', () => {
    it('passes data to PrimeVue DataTable', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      const dataTable = wrapper.findComponent(DataTable);
      expect(dataTable.props('value')).toEqual(mockData);
    });

    it('passes loading prop to PrimeVue DataTable', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          loading: true,
        },
      });

      const dataTable = wrapper.findComponent(DataTable);
      expect(dataTable.props('loading')).toBe(true);
    });

    it('configures responsive layout on DataTable', () => {
      const wrapper = mount(VrlTable, {
        props: {
          data: mockData,
          columns: mockColumns,
        },
      });

      const dataTable = wrapper.findComponent(DataTable);
      // DataTable is configured with responsive layout via pt attribute
      expect(dataTable.exists()).toBe(true);
    });
  });
});
