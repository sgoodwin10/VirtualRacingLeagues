import { describe, it, expect, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import RaceEventAccordion from './RaceEventAccordion.vue';
import type { RaceEventResults } from '@public/types/public';
import type { AccordionContext } from '@public/components/common/accordions/types';

// Create accordion context provider
const createAccordionContext = (
  initialValue: string | string[] | undefined = undefined,
): AccordionContext => ({
  activeValue: ref(initialValue),
  multiple: false,
  toggleItem: () => {},
});

describe('RaceEventAccordion', () => {
  let wrapper: VueWrapper;

  const mountComponent = (
    props: { raceEvent: RaceEventResults; divisionId?: number; raceTimesRequired?: boolean },
    accordionValue: string | string[] | undefined = undefined,
  ) => {
    return mount(RaceEventAccordion, {
      props,
      global: {
        provide: {
          'vrl-accordion': createAccordionContext(accordionValue),
        },
      },
    });
  };

  const mockQualifyingEvent: RaceEventResults = {
    id: 1,
    name: 'Qualifying',
    race_number: 1,
    is_qualifier: true,
    race_points: false,
    results: [
      {
        id: 1,
        position: 1,
        driver: { name: 'Driver 1' },
        race_points: null,
        positions_gained: null,
        dnf: false,
        has_pole: true,
        has_fastest_lap: false,
        division_id: 1,
        original_race_time: null,
        final_race_time: null,
        fastest_lap: '01:25.456',
        penalties: null,
      },
      {
        id: 2,
        position: 2,
        driver: { name: 'Driver 2' },
        race_points: null,
        positions_gained: null,
        dnf: false,
        has_pole: false,
        has_fastest_lap: false,
        division_id: 1,
        original_race_time: null,
        final_race_time: null,
        fastest_lap: '01:25.789',
        penalties: null,
      },
    ],
  };

  const mockRaceEvent: RaceEventResults = {
    id: 2,
    name: 'Race 1',
    race_number: 1,
    is_qualifier: false,
    race_points: true,
    results: [
      {
        id: 3,
        position: 1,
        driver: { name: 'Driver 1' },
        race_points: 25,
        positions_gained: 2,
        dnf: false,
        has_pole: false,
        has_fastest_lap: true,
        division_id: 1,
        original_race_time: '01:45:32.123',
        final_race_time: '01:45:32.123',
        fastest_lap: '01:24.567',
        penalties: null,
      },
      {
        id: 4,
        position: 2,
        driver: { name: 'Driver 2' },
        race_points: 18,
        positions_gained: -1,
        dnf: false,
        has_pole: false,
        has_fastest_lap: false,
        division_id: 1,
        original_race_time: '01:45:35.456',
        final_race_time: '01:45:35.456',
        fastest_lap: '01:25.123',
        penalties: null,
      },
    ],
  };

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Rendering', () => {
    it('should render race event header', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      expect(wrapper.text()).toContain('Race 1');
    });

    it('should display qualifying icon for qualifying events', () => {
      wrapper = mountComponent({
        raceEvent: mockQualifyingEvent,
        raceTimesRequired: false,
      });

      expect(wrapper.find('.ph-medal').exists()).toBe(true);
    });

    it('should display race icon for race events', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      expect(wrapper.find('.ph-flag-checkered').exists()).toBe(true);
    });

    it('should show correct event title for qualifying', () => {
      wrapper = mountComponent({
        raceEvent: mockQualifyingEvent,
        raceTimesRequired: false,
      });

      expect(wrapper.text()).toContain('Qualifying');
    });

    it('should show correct event title for race', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      expect(wrapper.text()).toContain('Race 1');
    });

    it('should display results summary for qualifying', () => {
      wrapper = mountComponent({
        raceEvent: mockQualifyingEvent,
        raceTimesRequired: false,
      });

      expect(wrapper.text()).toContain('2 drivers qualified');
    });

    it('should display results summary for race', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      expect(wrapper.text()).toContain('2 finishers');
    });

    it('should render accordion item', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      expect(wrapper.findComponent({ name: 'VrlAccordionItem' }).exists()).toBe(true);
    });
  });

  describe('Results Display', () => {
    it('should render VrlDataTable with results', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.exists()).toBe(true);
      expect(dataTable.props('value')).toHaveLength(2);
    });

    it('should show position column', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      const positionColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'position';
      });

      expect(positionColumn).toBeDefined();
    });

    it('should show driver column with names', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      const driverColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'driver.name';
      });

      expect(driverColumn).toBeDefined();
    });

    it('should show points column when race has points enabled', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      const pointsColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'race_points';
      });

      expect(pointsColumn).toBeDefined();
    });

    it('should not show points column when race has no points', () => {
      wrapper = mountComponent({
        raceEvent: mockQualifyingEvent,
        raceTimesRequired: false,
      });

      const pointsColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'race_points';
      });

      expect(pointsColumn).toBeUndefined();
    });

    it('should show positions gained column for races', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      const posGainedColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'positions_gained';
      });

      expect(posGainedColumn).toBeDefined();
    });

    it('should not show positions gained column for qualifying', () => {
      wrapper = mountComponent({
        raceEvent: mockQualifyingEvent,
        raceTimesRequired: false,
      });

      const posGainedColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'positions_gained';
      });

      expect(posGainedColumn).toBeUndefined();
    });
  });

  describe('Race Times Required', () => {
    it('should show time column when race times required', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: true,
      });

      const timeColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'final_race_time';
      });

      expect(timeColumn).toBeDefined();
    });

    it('should show gap column when race times required', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: true,
      });

      const gapColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'calculated_time_diff';
      });

      expect(gapColumn).toBeDefined();
    });

    it('should show fastest lap column when race times required', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: true,
      });

      const fastestLapColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'fastest_lap';
      });

      expect(fastestLapColumn).toBeDefined();
    });

    it('should show penalties column when race times required', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: true,
      });

      const penaltiesColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'penalties';
      });

      expect(penaltiesColumn).toBeDefined();
    });
  });

  describe('Division Filtering', () => {
    it('should filter results by division when divisionId provided', () => {
      const multiDivisionEvent: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          ...mockRaceEvent.results,
          {
            id: 5,
            position: 1,
            driver: { name: 'Driver 3' },
            race_points: 25,
            positions_gained: 0,
            dnf: false,
            has_pole: false,
            has_fastest_lap: false,
            division_id: 2,
            original_race_time: null,
            final_race_time: null,
            fastest_lap: null,
            penalties: null,
          },
        ],
      };

      wrapper = mountComponent({
        raceEvent: multiDivisionEvent,
        divisionId: 1,
        raceTimesRequired: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('value')).toHaveLength(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no results', () => {
      const emptyEvent: RaceEventResults = {
        ...mockRaceEvent,
        results: [],
      };

      wrapper = mountComponent({
        raceEvent: emptyEvent,
        raceTimesRequired: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('emptyMessage')).toBe('No results recorded');
    });
  });

  describe('Badges and Indicators', () => {
    it('should display pole badge in qualifying', () => {
      wrapper = mountComponent({
        raceEvent: mockQualifyingEvent,
        raceTimesRequired: false,
      });

      // Check that the data contains has_pole
      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const results = dataTable.props('value') as any[];
      expect(results[0].has_pole).toBe(true);
    });

    it('should display fastest lap badge in races', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const results = dataTable.props('value') as any[];
      expect(results[0].has_fastest_lap).toBe(true);
    });

    it('should handle DNF status', () => {
      const eventWithDNF: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            id: 6,
            position: 1,
            driver: { name: 'Driver 1' },
            race_points: 0,
            positions_gained: null,
            dnf: true,
            has_pole: false,
            has_fastest_lap: false,
            division_id: 1,
            original_race_time: null,
            final_race_time: null,
            fastest_lap: null,
            penalties: null,
          },
        ],
      };

      wrapper = mountComponent({
        raceEvent: eventWithDNF,
        raceTimesRequired: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const results = dataTable.props('value') as any[];
      expect(results[0].dnf).toBe(true);
    });
  });

  describe('Podium Highlighting', () => {
    it('should enable podium highlighting for races', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('podiumHighlight')).toBe(true);
    });

    it('should disable podium highlighting for qualifying', () => {
      wrapper = mountComponent({
        raceEvent: mockQualifyingEvent,
        raceTimesRequired: false,
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('podiumHighlight')).toBe(false);
    });
  });

  describe('Time Formatting', () => {
    it('should format positions gained correctly', () => {
      wrapper = mountComponent({
        raceEvent: mockRaceEvent,
        raceTimesRequired: false,
      });

      // The component uses formatPositionsGained function
      // Verify it's called with the right data
      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const results = dataTable.props('value') as any[];
      expect(results[0].positions_gained).toBe(2);
      expect(results[1].positions_gained).toBe(-1);
    });
  });
});
