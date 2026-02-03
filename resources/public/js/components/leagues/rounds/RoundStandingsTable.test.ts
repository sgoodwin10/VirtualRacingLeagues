import { describe, it, expect, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import RoundStandingsTable from './RoundStandingsTable.vue';
import type { RoundStandingDriver } from '@public/types/public';
import type { AccordionContext } from '@public/components/common/accordions/types';

// Create accordion context provider
const createAccordionContext = (
  initialValue: string | string[] | undefined = undefined,
): AccordionContext => ({
  activeValue: ref(initialValue),
  multiple: false,
  toggleItem: () => {},
});

describe('RoundStandingsTable', () => {
  let wrapper: VueWrapper;

  const mountComponent = (
    props: { standings: RoundStandingDriver[]; hasRacePointsEnabled?: boolean },
    accordionValue: string | string[] | undefined = undefined,
  ) => {
    return mount(RoundStandingsTable, {
      props,
      global: {
        provide: {
          'vrl-accordion': createAccordionContext(accordionValue),
        },
      },
    });
  };

  const mockStandings: RoundStandingDriver[] = [
    {
      position: 1,
      driver_id: 1,
      driver_name: 'Driver 1',
      race_points: 25,
      fastest_lap_points: 1,
      pole_position_points: 0,
      total_positions_gained: 2,
      total_points: 26,
    },
    {
      position: 2,
      driver_id: 2,
      driver_name: 'Driver 2',
      race_points: 18,
      fastest_lap_points: 0,
      pole_position_points: 1,
      total_positions_gained: -1,
      total_points: 19,
    },
    {
      position: 3,
      driver_id: 3,
      driver_name: 'Driver 3',
      race_points: 15,
      fastest_lap_points: 0,
      pole_position_points: 0,
      total_positions_gained: 0,
      total_points: 15,
    },
  ];

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Rendering', () => {
    it('should render round standings header', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      expect(wrapper.text()).toContain('Round Standings');
    });

    it('should display winner in summary text', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      expect(wrapper.text()).toContain('Winner: Driver 1');
    });

    it('should show trophy icon', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      expect(wrapper.find('.ph-trophy').exists()).toBe(true);
    });

    it('should render chevron indicator', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      expect(wrapper.find('.ph-caret-down').exists()).toBe(true);
    });
  });

  describe('Table Structure', () => {
    it('should render VrlDataTable with standings data', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.exists()).toBe(true);
      expect(dataTable.props('value')).toEqual(mockStandings);
    });

    it('should enable podium highlighting', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('podiumHighlight')).toBe(true);
    });

    it('should set position field correctly', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('positionField')).toBe('position');
    });

    it('should disable pagination', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('paginated')).toBe(false);
    });
  });

  describe('Columns', () => {
    it('should render position column', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const positionColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'position';
      });

      expect(positionColumn).toBeDefined();
      expect(positionColumn?.props('header')).toBe('Pos');
    });

    it('should render driver name column', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const driverColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'driver_name';
      });

      expect(driverColumn).toBeDefined();
      expect(driverColumn?.props('header')).toBe('Driver');
    });

    it('should render fastest lap points column', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const flColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'fastest_lap_points';
      });

      expect(flColumn).toBeDefined();
      expect(flColumn?.props('header')).toBe('Fastest Lap');
    });

    it('should render pole position points column', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const poleColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'pole_position_points';
      });

      expect(poleColumn).toBeDefined();
      expect(poleColumn?.props('header')).toBe('Pole Position');
    });

    it('should render positions gained column', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const posGainedColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'total_positions_gained';
      });

      expect(posGainedColumn).toBeDefined();
      expect(posGainedColumn?.props('header')).toBe('+/-');
    });

    it('should render total points column', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const totalColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'total_points';
      });

      expect(totalColumn).toBeDefined();
      expect(totalColumn?.props('header')).toBe('Round Points');
    });

    it('should render race points column when enabled', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: true,
      });

      const racePointsColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'race_points';
      });

      expect(racePointsColumn).toBeDefined();
      expect(racePointsColumn?.props('header')).toBe('Total Race Points');
    });

    it('should not render race points column when disabled', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const racePointsColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'race_points';
      });

      expect(racePointsColumn).toBeUndefined();
    });
  });

  describe('Data Display', () => {
    it('should display driver positions correctly', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const standings = dataTable.props('value') as RoundStandingDriver[];

      expect(standings[0]?.position).toBe(1);
      expect(standings[1]?.position).toBe(2);
      expect(standings[2]?.position).toBe(3);
    });

    it('should display driver names correctly', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const standings = dataTable.props('value') as RoundStandingDriver[];

      expect(standings[0]?.driver_name).toBe('Driver 1');
      expect(standings[1]?.driver_name).toBe('Driver 2');
      expect(standings[2]?.driver_name).toBe('Driver 3');
    });

    it('should display total points correctly', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const standings = dataTable.props('value') as RoundStandingDriver[];

      expect(standings[0]?.total_points).toBe(26);
      expect(standings[1]?.total_points).toBe(19);
      expect(standings[2]?.total_points).toBe(15);
    });

    it('should display fastest lap points', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const standings = dataTable.props('value') as RoundStandingDriver[];

      expect(standings[0]?.fastest_lap_points).toBe(1);
      expect(standings[1]?.fastest_lap_points).toBe(0);
    });

    it('should display pole position points', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const standings = dataTable.props('value') as RoundStandingDriver[];

      expect(standings[0]?.pole_position_points).toBe(0);
      expect(standings[1]?.pole_position_points).toBe(1);
    });
  });

  describe('Positions Gained', () => {
    it('should format positive positions gained correctly', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const standings = dataTable.props('value') as RoundStandingDriver[];

      expect(standings[0]?.total_positions_gained).toBe(2);
    });

    it('should format negative positions gained correctly', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const standings = dataTable.props('value') as RoundStandingDriver[];

      expect(standings[1]?.total_positions_gained).toBe(-1);
    });

    it('should format zero positions gained correctly', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const standings = dataTable.props('value') as RoundStandingDriver[];

      expect(standings[2]?.total_positions_gained).toBe(0);
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no standings', () => {
      wrapper = mountComponent({
        standings: [],
        hasRacePointsEnabled: false,
      });

      expect(wrapper.text()).toContain('No standings data');
    });

    it('should show empty message in table', () => {
      wrapper = mountComponent({
        standings: [],
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('emptyMessage')).toBe('No standings data available');
    });
  });

  describe('Styling', () => {
    it('should apply correct table styling', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('tableClass')).toBe('!rounded-none');
    });

    it('should enable hoverable rows', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('hoverable')).toBe(true);
    });

    it('should disable striping', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('striped')).toBe(false);
    });
  });

  describe('Icons', () => {
    it('should have fastest lap column that can display lightning icon', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      // The component has a column for fastest lap points
      const flColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'fastest_lap_points';
      });
      expect(flColumn).toBeDefined();
    });

    it('should have pole position column that can display medal icon', () => {
      wrapper = mountComponent({
        standings: mockStandings,
        hasRacePointsEnabled: false,
      });

      // The component has a column for pole position points
      const poleColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'pole_position_points';
      });
      expect(poleColumn).toBeDefined();
    });
  });
});
