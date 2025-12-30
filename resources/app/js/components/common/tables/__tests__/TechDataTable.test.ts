import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TechDataTable from '../TechDataTable.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

interface TestData {
  id: number;
  position: number;
  name: string;
  points: number;
}

describe('TechDataTable', () => {
  const mockData: TestData[] = [
    { id: 1, position: 1, name: 'Driver 1', points: 100 },
    { id: 2, position: 2, name: 'Driver 2', points: 80 },
    { id: 3, position: 3, name: 'Driver 3', points: 60 },
    { id: 4, position: 4, name: 'Driver 4', points: 40 },
  ];

  it('renders DataTable with provided data', () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: mockData,
      },
      global: {
        components: { DataTable, Column },
      },
    });

    expect(wrapper.findComponent(DataTable).exists()).toBe(true);
  });

  it('applies tech-datatable class', () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: mockData,
      },
      global: {
        components: { DataTable },
      },
    });

    const dataTable = wrapper.findComponent(DataTable);
    expect(dataTable.classes()).toContain('tech-datatable');
  });

  it('applies custom table class when provided', () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: mockData,
        tableClass: 'custom-class',
      },
      global: {
        components: { DataTable },
      },
    });

    const dataTable = wrapper.findComponent(DataTable);
    expect(dataTable.classes()).toContain('tech-datatable');
    expect(dataTable.classes()).toContain('custom-class');
  });

  it('shows loading state when loading prop is true', () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: [],
        loading: true,
      },
      global: {
        components: { DataTable },
      },
    });

    const dataTable = wrapper.findComponent(DataTable);
    expect(dataTable.props('loading')).toBe(true);
  });

  it('applies podium-1 class for first position when podiumHighlight is enabled', () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: mockData,
        podiumHighlight: true,
        positionField: 'position',
      },
      global: {
        components: { DataTable },
      },
    });

    const dataTable = wrapper.findComponent(DataTable);
    expect(dataTable.props('rowClass')).toBeDefined();

    const rowClass = dataTable.props('rowClass');
    if (typeof rowClass === 'function') {
      expect(rowClass(mockData[0])).toBe('podium-1');
      expect(rowClass(mockData[1])).toBe('podium-2');
      expect(rowClass(mockData[2])).toBe('podium-3');
      expect(rowClass(mockData[3])).toBe('');
    }
  });

  it('does not apply row classes when podiumHighlight is disabled', () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: mockData,
        podiumHighlight: false,
      },
      global: {
        components: { DataTable },
      },
    });

    const dataTable = wrapper.findComponent(DataTable);
    // When podiumHighlight is false, rowClass should be undefined or null (not a function)
    const rowClass = dataTable.props('rowClass');
    expect(rowClass === undefined || rowClass === null).toBe(true);
  });

  it('emits page event when pagination occurs', async () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: mockData,
        paginator: true,
        rows: 2,
      },
      global: {
        components: { DataTable },
      },
    });

    const dataTable = wrapper.findComponent(DataTable);
    const pageEvent = { first: 2, rows: 2, page: 1, pageCount: 2 };

    await dataTable.vm.$emit('page', pageEvent);

    expect(wrapper.emitted('page')).toBeTruthy();
    expect(wrapper.emitted('page')?.[0]).toEqual([pageEvent]);
  });

  it('passes pagination props correctly', () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: mockData,
        paginator: true,
        rows: 10,
        totalRecords: 100,
        first: 0,
      },
      global: {
        components: { DataTable },
      },
    });

    const dataTable = wrapper.findComponent(DataTable);
    expect(dataTable.props('paginator')).toBe(true);
    expect(dataTable.props('rows')).toBe(10);
    expect(dataTable.props('totalRecords')).toBe(100);
    expect(dataTable.props('first')).toBe(0);
  });

  it('displays empty message when no data', () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: [],
        emptyMessage: 'No records found',
      },
      global: {
        components: { DataTable },
      },
    });

    expect(wrapper.text()).toContain('No records found');
  });

  it('passes rowHover prop correctly', () => {
    const wrapper = mount(TechDataTable, {
      props: {
        value: mockData,
        rowHover: false,
      },
      global: {
        components: { DataTable },
      },
    });

    const dataTable = wrapper.findComponent(DataTable);
    expect(dataTable.props('rowHover')).toBe(false);
  });
});
