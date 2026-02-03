import { describe, it, expect, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import CrossDivisionResultsTable from './CrossDivisionResultsTable.vue';
import type { CrossDivisionResult, RaceEventResults } from '@public/types/public';

describe('CrossDivisionResultsTable', () => {
  let wrapper: VueWrapper;

  const mockDivisions = [
    { id: 1, name: 'Division 1' },
    { id: 2, name: 'Division 2' },
  ];

  const mockRaceEvents: RaceEventResults[] = [
    {
      id: 1,
      name: 'Qualifying',
      race_number: 1,
      is_qualifier: true,
      race_points: false,
      results: [
        {
          id: 1,
          position: 1,
          driver: { id: 1, name: 'Driver 1' },
          race_points: 0,
          positions_gained: null,
          dnf: false,
          has_pole: true,
          has_fastest_lap: false,
          division_id: 1,
          original_race_time: null,
          final_race_time: null,
          fastest_lap: null,
          penalties: null,
        },
        {
          id: 2,
          position: 2,
          driver: { id: 1, name: 'Driver 2' },
          race_points: 0,
          positions_gained: null,
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
    },
  ];

  const mockResults: CrossDivisionResult[] = [
    {
      position: 1,
      race_result_id: 1,
      time_ms: 85456,
    },
    {
      position: 2,
      race_result_id: 2,
      time_ms: 85789,
    },
  ];

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Rendering', () => {
    it('should render VrlDataTable with results', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should enable podium highlighting', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('podiumHighlight')).toBe(true);
    });

    it('should set position field correctly', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('positionField')).toBe('position');
    });

    it('should disable pagination', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('paginated')).toBe(false);
    });
  });

  describe('Columns', () => {
    it('should render position column', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const positionColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'position';
      });

      expect(positionColumn).toBeDefined();
      expect(positionColumn?.props('header')).toBe('Pos');
    });

    it('should render driver name column', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const driverColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'driverName';
      });

      expect(driverColumn).toBeDefined();
      expect(driverColumn?.props('header')).toBe('Driver');
    });

    it('should render division column when divisions exist', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const divisionColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'divisionName';
      });

      expect(divisionColumn).toBeDefined();
      expect(divisionColumn?.props('header')).toBe('Division');
    });

    it('should not render division column when no divisions', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: [],
        },
      });

      const divisionColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'divisionName';
      });

      expect(divisionColumn).toBeUndefined();
    });

    it('should render time column', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const timeColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'formattedTime';
      });

      expect(timeColumn).toBeDefined();
      expect(timeColumn?.props('header')).toBe('Time');
    });
  });

  describe('Data Enrichment', () => {
    it('should enrich results with driver names', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];

      expect(enrichedResults[0].driverName).toBe('Driver 1');
      expect(enrichedResults[1].driverName).toBe('Driver 2');
    });

    it('should enrich results with division names', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];

      expect(enrichedResults[0].divisionName).toBe('Division 1');
      expect(enrichedResults[1].divisionName).toBe('Division 2');
    });

    it('should handle missing driver data', () => {
      const resultsWithMissingDriver: CrossDivisionResult[] = [
        {
          position: 1,
          race_result_id: 999,
          time_ms: 85456,
        },
      ];

      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: resultsWithMissingDriver,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];

      expect(enrichedResults[0].driverName).toBe('Unknown Driver');
    });
  });

  describe('Time Formatting', () => {
    it('should format first place time correctly', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];

      expect(enrichedResults[0].formattedTime).toBe('01:25.456');
    });

    it('should format time difference for subsequent positions', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];

      expect(enrichedResults[1].formattedTime).toMatch(/^\+/);
    });

    it('should handle time differences with minutes', () => {
      const resultsWithLargeGap: CrossDivisionResult[] = [
        {
          position: 1,
          race_result_id: 1,
          time_ms: 85456,
        },
        {
          position: 2,
          race_result_id: 2,
          time_ms: 150456,
        },
      ];

      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: resultsWithLargeGap,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];

      expect(enrichedResults[1].formattedTime).toMatch(/^\+1:/);
    });
  });

  describe('Division Badge Styling', () => {
    it('should apply different colors to different divisions', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];

      expect(enrichedResults[0].divisionId).toBe(1);
      expect(enrichedResults[1].divisionId).toBe(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no results', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: [],
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('emptyMessage')).toBe('No data available');
    });

    it('should handle null results', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: null,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];
      expect(enrichedResults).toEqual([]);
    });

    it('should return empty array when results is empty', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: [],
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];
      expect(enrichedResults).toEqual([]);
    });
  });

  describe('Position Display', () => {
    it('should preserve positions correctly', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];

      expect(enrichedResults[0].position).toBe(1);
      expect(enrichedResults[1].position).toBe(2);
    });
  });

  describe('Styling', () => {
    it('should apply correct table styling', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('tableClass')).toContain('[&_th]:!p-3');
      expect(dataTable.props('tableClass')).toContain('[&_td]:!p-3');
    });

    it('should enable hoverable rows', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('hoverable')).toBe(true);
    });

    it('should disable striping', () => {
      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: mockResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('striped')).toBe(false);
    });
  });

  describe('Division Information', () => {
    it('should handle drivers without division', () => {
      const raceEventsNoDivision: RaceEventResults[] = [
        {
          ...mockRaceEvents[0],
          results: [
            {
              ...mockRaceEvents[0]?.results[0],
              division_id: null,
            } as any,
          ],
        },
      ];

      wrapper = mount(CrossDivisionResultsTable, {
        props: {
          results: [mockResults[0]!],
          raceEvents: raceEventsNoDivision,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const enrichedResults = dataTable.props('value') as any[];

      expect(enrichedResults[0].divisionId).toBeNull();
      expect(enrichedResults[0].divisionName).toBeNull();
    });
  });
});
