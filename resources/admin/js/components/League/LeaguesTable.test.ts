import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import LeaguesTable from './LeaguesTable.vue';
import { mount } from '@vue/test-utils';
import { createMockLeague } from '@admin/__tests__/helpers/mockFactories';
import type { League } from '@admin/types/league';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

describe('LeaguesTable', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  /**
   * Helper function to mount LeaguesTable with proper configuration
   * Using real PrimeVue components instead of stubs for better testing
   */
  const mountLeaguesTable = (props = {}) => {
    return mount(LeaguesTable, {
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
          ResponsiveImage: true,
        },
      },
    });
  };

  describe('Component Rendering', () => {
    it('renders empty state when no leagues provided', () => {
      const wrapper = mountLeaguesTable({ leagues: [] });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.exists()).toBe(true);
      expect(dataTable.props('value')).toEqual([]);
    });

    it('renders loading state when loading prop is true', () => {
      const wrapper = mountLeaguesTable({ loading: true });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('loading')).toBe(true);
    });

    it('renders table with league data', () => {
      const leagues = [
        createMockLeague({ name: 'Test League 1' }),
        createMockLeague({ name: 'Test League 2' }),
      ];

      const wrapper = mountLeaguesTable({ leagues });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('value')).toEqual(leagues);
      expect(dataTable.props('value')).toHaveLength(2);
    });

    it('passes correct props to DataTable', () => {
      const leagues = [createMockLeague()];
      const wrapper = mountLeaguesTable({ leagues, loading: false });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('value')).toEqual(leagues);
      expect(dataTable.props('loading')).toBe(false);
      expect(dataTable.props('stripedRows')).toBe(true);
    });
  });

  describe('League Visibility', () => {
    it('renders with league having public visibility', () => {
      const league = createMockLeague({ visibility: 'public' });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.visibility).toBe('public');
    });

    it('renders with league having private visibility', () => {
      const league = createMockLeague({ visibility: 'private' });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.visibility).toBe('private');
    });

    it('renders with league having unlisted visibility', () => {
      const league = createMockLeague({ visibility: 'unlisted' });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.visibility).toBe('unlisted');
    });
  });

  describe('League Status', () => {
    it('renders with league having active status', () => {
      const league = createMockLeague({ status: 'active' });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.status).toBe('active');
    });

    it('renders with league having archived status', () => {
      const league = createMockLeague({ status: 'archived' });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.status).toBe('archived');
    });
  });

  describe('Event Emissions', () => {
    it('emits view event when handleView is called', () => {
      const league = createMockLeague();
      const wrapper = mountLeaguesTable({ leagues: [league] });

      (wrapper.vm as any).handleView(league);

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([league]);
    });

    it('emits archive event when handleArchive is called', () => {
      const league = createMockLeague({ status: 'active' });
      const wrapper = mountLeaguesTable({ leagues: [league] });

      (wrapper.vm as any).handleArchive(league);

      expect(wrapper.emitted('archive')).toBeTruthy();
      expect(wrapper.emitted('archive')?.[0]).toEqual([league]);
    });
  });

  describe('Multiple Leagues', () => {
    it('renders multiple leagues correctly', () => {
      const leagues = [
        createMockLeague({ name: 'League 1' }),
        createMockLeague({ name: 'League 2' }),
        createMockLeague({ name: 'League 3' }),
      ];

      const wrapper = mountLeaguesTable({ leagues });
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('value')).toHaveLength(3);
      expect(dataTable.props('value')).toEqual(leagues);
    });

    it('handles mixed visibility values correctly', () => {
      const leagues = [
        createMockLeague({ visibility: 'public' }),
        createMockLeague({ visibility: 'private' }),
        createMockLeague({ visibility: 'unlisted' }),
      ];

      const wrapper = mountLeaguesTable({ leagues });
      const dataTable = wrapper.findComponent(DataTable);

      const tableLeagues = dataTable.props('value') as League[];
      expect(tableLeagues[0]?.visibility).toBe('public');
      expect(tableLeagues[1]?.visibility).toBe('private');
      expect(tableLeagues[2]?.visibility).toBe('unlisted');
    });

    it('handles mixed status values correctly', () => {
      const leagues = [
        createMockLeague({ status: 'active' }),
        createMockLeague({ status: 'archived' }),
      ];

      const wrapper = mountLeaguesTable({ leagues });
      const dataTable = wrapper.findComponent(DataTable);

      const tableLeagues = dataTable.props('value') as League[];
      expect(tableLeagues[0]?.status).toBe('active');
      expect(tableLeagues[1]?.status).toBe('archived');
    });
  });

  describe('Default Props', () => {
    it('uses empty array as default for leagues prop', () => {
      const wrapper = mountLeaguesTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('value')).toEqual([]);
    });

    it('uses false as default for loading prop', () => {
      const wrapper = mountLeaguesTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('loading')).toBe(false);
    });
  });

  describe('Table Features', () => {
    it('has pagination enabled', () => {
      const wrapper = mountLeaguesTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('paginator')).toBe(true);
    });

    it('has striped rows enabled', () => {
      const wrapper = mountLeaguesTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('stripedRows')).toBe(true);
    });

    it('has correct rows per page', () => {
      const wrapper = mountLeaguesTable();
      const dataTable = wrapper.findComponent(DataTable);

      expect(dataTable.props('rows')).toBe(15);
    });
  });

  describe('Platforms', () => {
    it('includes platforms in league data', () => {
      const league = createMockLeague({
        platforms: [
          { id: 1, name: 'PlayStation', slug: 'playstation' },
          { id: 2, name: 'Xbox', slug: 'xbox' },
        ],
      });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.platforms).toHaveLength(2);
      expect(leagues[0]?.platforms?.[0]?.name).toBe('PlayStation');
      expect(leagues[0]?.platforms?.[1]?.name).toBe('Xbox');
    });

    it('handles leagues with no platforms', () => {
      const league = createMockLeague({ platforms: [] });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.platforms).toEqual([]);
    });
  });

  describe('Owner/Manager', () => {
    it('includes owner information when present', () => {
      const league = createMockLeague({
        owner: {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.owner).toBeDefined();
      expect(leagues[0]?.owner?.first_name).toBe('John');
      expect(leagues[0]?.owner?.last_name).toBe('Doe');
    });

    it('handles leagues with no owner', () => {
      const league = createMockLeague({ owner: undefined });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.owner).toBeUndefined();
    });
  });

  describe('Columns', () => {
    it('renders correct number of columns', () => {
      const wrapper = mountLeaguesTable();
      const columns = wrapper.findAllComponents(Column);

      // ID, Logo, Name, Platforms, Visibility, Status, Manager, Actions
      expect(columns.length).toBe(8);
    });

    it('has ID column', () => {
      const wrapper = mountLeaguesTable();
      const columns = wrapper.findAllComponents(Column);
      const idColumn = columns.find((col) => col.props('field') === 'id');

      expect(idColumn).toBeDefined();
      expect(idColumn?.props('header')).toBe('ID');
    });

    it('has Logo column', () => {
      const wrapper = mountLeaguesTable();
      const columns = wrapper.findAllComponents(Column);
      const logoColumn = columns.find((col) => col.props('header') === 'Logo');

      expect(logoColumn).toBeDefined();
    });

    it('has Name column', () => {
      const wrapper = mountLeaguesTable();
      const columns = wrapper.findAllComponents(Column);
      const nameColumn = columns.find((col) => col.props('header') === 'Name');

      expect(nameColumn).toBeDefined();
    });

    it('has Platforms column', () => {
      const wrapper = mountLeaguesTable();
      const columns = wrapper.findAllComponents(Column);
      const platformsColumn = columns.find((col) => col.props('header') === 'Platforms');

      expect(platformsColumn).toBeDefined();
    });

    it('has Visibility column', () => {
      const wrapper = mountLeaguesTable();
      const columns = wrapper.findAllComponents(Column);
      const visibilityColumn = columns.find((col) => col.props('field') === 'visibility');

      expect(visibilityColumn).toBeDefined();
      expect(visibilityColumn?.props('header')).toBe('Visibility');
    });

    it('has Status column', () => {
      const wrapper = mountLeaguesTable();
      const columns = wrapper.findAllComponents(Column);
      const statusColumn = columns.find((col) => col.props('field') === 'status');

      expect(statusColumn).toBeDefined();
      expect(statusColumn?.props('header')).toBe('Status');
    });

    it('has Manager column', () => {
      const wrapper = mountLeaguesTable();
      const columns = wrapper.findAllComponents(Column);
      const managerColumn = columns.find((col) => col.props('header') === 'Manager');

      expect(managerColumn).toBeDefined();
    });

    it('has Actions column', () => {
      const wrapper = mountLeaguesTable();
      const columns = wrapper.findAllComponents(Column);
      const actionsColumn = columns.find((col) => col.props('header') === 'Actions');

      expect(actionsColumn).toBeDefined();
    });
  });

  describe('Logo Display', () => {
    it('includes logo URL in league data', () => {
      const league = createMockLeague({
        logo_url: 'https://example.com/logo.png',
      });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.logo_url).toBe('https://example.com/logo.png');
    });

    it('handles leagues without logo', () => {
      const league = createMockLeague({ logo_url: undefined });
      const wrapper = mountLeaguesTable({ leagues: [league] });
      const dataTable = wrapper.findComponent(DataTable);

      const leagues = dataTable.props('value') as League[];
      expect(leagues[0]?.logo_url).toBeUndefined();
    });
  });
});
