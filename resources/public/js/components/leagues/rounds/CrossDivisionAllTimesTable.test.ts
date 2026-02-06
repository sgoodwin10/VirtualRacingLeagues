import { describe, it, expect, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import CrossDivisionAllTimesTable from './CrossDivisionAllTimesTable.vue';
import type { CrossDivisionResult, RaceEventResults } from '@public/types/public';

describe('CrossDivisionAllTimesTable', () => {
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
      status: 'completed',
      results: [
        {
          id: 1,
          race_id: 1,
          driver_id: 1,
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
          original_race_time_difference: null,
          final_race_time_difference: null,
          fastest_lap: null,
          penalties: null,
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          race_id: 1,
          driver_id: 2,
          position: 2,
          driver: { id: 2, name: 'Driver 2' },
          race_points: 0,
          positions_gained: null,
          dnf: false,
          has_pole: false,
          has_fastest_lap: false,
          division_id: 2,
          original_race_time: null,
          final_race_time: null,
          original_race_time_difference: null,
          final_race_time_difference: null,
          fastest_lap: null,
          penalties: null,
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    },
  ];

  const mockQualifyingResults: CrossDivisionResult[] = [
    { position: 1, race_result_id: 1, time_ms: 85456 },
    { position: 2, race_result_id: 2, time_ms: 85789 },
  ];

  const mockRaceTimeResults: CrossDivisionResult[] = [
    { position: 1, race_result_id: 2, time_ms: 90000 },
    { position: 2, race_result_id: 1, time_ms: 90500 },
  ];

  const mockFastestLapResults: CrossDivisionResult[] = [
    { position: 1, race_result_id: 1, time_ms: 84000 },
    { position: 2, race_result_id: 2, time_ms: 84333 },
  ];

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Rendering', () => {
    it('should render VrlDataTable with combined results', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should enable podium highlighting', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('podiumHighlight')).toBe(true);
    });

    it('should set position field correctly', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('positionField')).toBe('position');
    });

    it('should disable pagination', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
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
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const positionColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'position';
      });

      expect(positionColumn).toBeDefined();
      expect(positionColumn?.props('header')).toBe('#');
    });

    it('should render driver name column', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
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
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
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
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: [],
        },
      });

      const divisionColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'divisionName';
      });

      expect(divisionColumn).toBeUndefined();
    });

    it('should render qualifying time column', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const qualifyingColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'qualifyingFormatted';
      });

      expect(qualifyingColumn).toBeDefined();
    });

    it('should render race time column', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const raceColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'raceFormatted';
      });

      expect(raceColumn).toBeDefined();
    });

    it('should render fastest lap column', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const fastestLapColumn = wrapper.findAllComponents({ name: 'Column' }).find((col) => {
        return col.props('field') === 'fastestLapFormatted';
      });

      expect(fastestLapColumn).toBeDefined();
    });
  });

  describe('Data Merging', () => {
    it('should correctly merge qualifying, race, and fastest lap results per driver', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      expect(data).toHaveLength(2);

      // Default sort is qualifying, so Driver 1 (85456ms) should be first
      const driver1 = data.find((d: any) => d.driverName === 'Driver 1');
      const driver2 = data.find((d: any) => d.driverName === 'Driver 2');

      expect(driver1).toBeDefined();
      expect(driver2).toBeDefined();

      // Driver 1 has all three times
      expect(driver1.qualifyingTimeMs).toBe(85456);
      expect(driver1.raceTimeMs).toBe(90500);
      expect(driver1.fastestLapMs).toBe(84000);

      // Driver 2 has all three times
      expect(driver2.qualifyingTimeMs).toBe(85789);
      expect(driver2.raceTimeMs).toBe(90000);
      expect(driver2.fastestLapMs).toBe(84333);
    });

    it('should enrich results with division names', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      const driver1 = data.find((d: any) => d.driverName === 'Driver 1');
      const driver2 = data.find((d: any) => d.driverName === 'Driver 2');

      expect(driver1.divisionName).toBe('Division 1');
      expect(driver2.divisionName).toBe('Division 2');
    });
  });

  describe('Time Formatting', () => {
    it('should show absolute time for fastest in each column', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      const driver1 = data.find((d: any) => d.driverName === 'Driver 1');
      const driver2 = data.find((d: any) => d.driverName === 'Driver 2');

      // Driver 1 has fastest qualifying (85456) and fastest lap (84000)
      expect(driver1.qualifyingFormatted).toBe('01:25.456');
      expect(driver1.fastestLapFormatted).toBe('01:24.000');

      // Driver 2 has fastest race time (90000)
      expect(driver2.raceFormatted).toBe('01:30.000');
    });

    it('should show +diff for non-fastest times', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      const driver2 = data.find((d: any) => d.driverName === 'Driver 2');
      const driver1 = data.find((d: any) => d.driverName === 'Driver 1');

      // Driver 2 qualifying diff: 85789 - 85456 = 333ms
      expect(driver2.qualifyingFormatted).toMatch(/^\+/);
      expect(driver2.qualifyingFormatted).toBe('+00.333');

      // Driver 1 race diff: 90500 - 90000 = 500ms
      expect(driver1.raceFormatted).toMatch(/^\+/);
      expect(driver1.raceFormatted).toBe('+00.500');
    });

    it('should show dash for null times', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: null,
          fastestLapResults: null,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      // Only qualifying results provided, so race and fastest lap should be -
      expect(data[0].raceFormatted).toBe('-');
      expect(data[0].fastestLapFormatted).toBe('-');
    });
  });

  describe('Sorting', () => {
    it('should default sort by qualifying time', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      // Default sort by qualifying: Driver 1 (85456) before Driver 2 (85789)
      expect(data[0].driverName).toBe('Driver 1');
      expect(data[1].driverName).toBe('Driver 2');
    });

    it('should change sort when clicking a different column header', async () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      // Click race time header
      const sortHeaders = wrapper.findAll('.sortable-header');
      const raceHeader = sortHeaders.find((el) => el.text().includes('Race'));
      expect(raceHeader).toBeDefined();
      await raceHeader!.trigger('click');

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      // Sort by race time: Driver 2 (90000) before Driver 1 (90500)
      expect(data[0].driverName).toBe('Driver 2');
      expect(data[1].driverName).toBe('Driver 1');
    });

    it('should highlight the active sort column', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const sortHeaders = wrapper.findAll('.sortable-header');
      const qualifyingHeader = sortHeaders.find((el) => el.text().includes('Qualifying'));

      expect(qualifyingHeader?.classes()).toContain('is-sorted');
    });

    it('should show sort arrow on active column', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const sortHeaders = wrapper.findAll('.sortable-header');
      const qualifyingHeader = sortHeaders.find((el) => el.text().includes('Qualifying'));
      const raceHeader = sortHeaders.find((el) => el.text().includes('Race'));

      expect(qualifyingHeader?.find('.sort-arrow').exists()).toBe(true);
      expect(raceHeader?.find('.sort-arrow').exists()).toBe(false);
    });
  });

  describe('Position Updates', () => {
    it('should update position numbers when sort column changes', async () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      let dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      let data = dataTable.props('value') as any[];

      // Default qualifying sort: Driver 1 is P1
      expect(data[0].driverName).toBe('Driver 1');
      expect(data[0].position).toBe(1);
      expect(data[1].driverName).toBe('Driver 2');
      expect(data[1].position).toBe(2);

      // Switch to race time sort
      const sortHeaders = wrapper.findAll('.sortable-header');
      const raceHeader = sortHeaders.find((el) => el.text().includes('Race'));
      await raceHeader!.trigger('click');

      dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      data = dataTable.props('value') as any[];

      // Race sort: Driver 2 is now P1 (faster race time)
      expect(data[0].driverName).toBe('Driver 2');
      expect(data[0].position).toBe(1);
      expect(data[1].driverName).toBe('Driver 1');
      expect(data[1].position).toBe(2);
    });
  });

  describe('Null Handling', () => {
    it('should handle drivers missing a time type', () => {
      // Only provide qualifying results for Driver 1
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: [{ position: 1, race_result_id: 1, time_ms: 85456 }],
          raceTimeResults: [{ position: 1, race_result_id: 2, time_ms: 90000 }],
          fastestLapResults: null,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      const driver1 = data.find((d: any) => d.driverName === 'Driver 1');
      const driver2 = data.find((d: any) => d.driverName === 'Driver 2');

      // Driver 1 has qualifying but no race time
      expect(driver1.qualifyingFormatted).toBe('01:25.456');
      expect(driver1.raceFormatted).toBe('-');

      // Driver 2 has race time but no qualifying
      expect(driver2.qualifyingFormatted).toBe('-');
      expect(driver2.raceFormatted).toBe('01:30.000');
    });

    it('should sort nulls to the bottom', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: [{ position: 1, race_result_id: 1, time_ms: 85456 }],
          raceTimeResults: [{ position: 1, race_result_id: 2, time_ms: 90000 }],
          fastestLapResults: null,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      // Default sort by qualifying: Driver 1 (has qualifying time) should be first
      // Driver 2 (no qualifying time) should be last
      expect(data[0].driverName).toBe('Driver 1');
      expect(data[1].driverName).toBe('Driver 2');
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no results', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: null,
          raceTimeResults: null,
          fastestLapResults: null,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('emptyMessage')).toBe('No times available');
    });

    it('should pass empty array when all results are null', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: null,
          raceTimeResults: null,
          fastestLapResults: null,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];
      expect(data).toEqual([]);
    });
  });

  describe('Division Badges', () => {
    it('should show correct division IDs per driver', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      const data = dataTable.props('value') as any[];

      const driver1 = data.find((d: any) => d.driverName === 'Driver 1');
      const driver2 = data.find((d: any) => d.driverName === 'Driver 2');

      expect(driver1.divisionId).toBe(1);
      expect(driver2.divisionId).toBe(2);
    });
  });

  describe('Styling', () => {
    it('should apply correct table styling', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('tableClass')).toContain('[&_th]:!p-3');
      expect(dataTable.props('tableClass')).toContain('[&_td]:!p-3');
    });

    it('should enable hoverable rows', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('hoverable')).toBe(true);
    });

    it('should disable striping', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'VrlDataTable' });
      expect(dataTable.props('striped')).toBe(false);
    });
  });
});
