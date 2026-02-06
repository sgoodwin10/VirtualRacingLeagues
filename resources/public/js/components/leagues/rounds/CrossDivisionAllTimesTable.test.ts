import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import CrossDivisionAllTimesTable from './CrossDivisionAllTimesTable.vue';
import type { CrossDivisionResult, RaceEventResults } from '@public/types/public';

// Create a mock function that we can access in tests
const mockTrackEvent = vi.fn();

// Mock useGtm composable
vi.mock('@public/composables/useGtm', () => ({
  useGtm: () => ({
    trackEvent: mockTrackEvent,
  }),
}));

describe('CrossDivisionAllTimesTable', () => {
  let wrapper: VueWrapper;

  // Store original methods for DOM manipulation
  let originalCreateElement: typeof document.createElement;

  // Track created elements for cleanup
  let createdElements: HTMLElement[] = [];
  let createdUrls: string[] = [];

  beforeEach(() => {
    // Store original methods
    originalCreateElement = document.createElement.bind(document);

    // Reset tracking arrays
    createdElements = [];
    createdUrls = [];

    // Mock document.createElement to track created links
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        createdElements.push(element);
      }
      return element;
    });

    // Mock URL.createObjectURL
    vi.spyOn(URL, 'createObjectURL').mockImplementation((_blob: Blob | MediaSource) => {
      const url = `blob:mock-url-${createdUrls.length}`;
      createdUrls.push(url);
      return url;
    });

    // Mock URL.revokeObjectURL
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((_url: string) => {
      // Mock implementation - do nothing
    });

    // Mock appendChild and removeChild
    vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      return node;
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => {
      return node;
    });

    // Mock click
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      // Do nothing
    });
  });

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
    vi.restoreAllMocks();
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
    it('should show absolute time for all drivers', () => {
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

      // Both drivers should have absolute times
      expect(driver1.qualifyingTimeAbsolute).toBe('01:25.456');
      expect(driver1.fastestLapAbsolute).toBe('01:24.000');
      expect(driver2.qualifyingTimeAbsolute).toBe('01:25.789');
      expect(driver2.raceTimeAbsolute).toBe('01:30.000');
    });

    it('should show null gap for leader (fastest time)', () => {
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

      // Driver 1 has fastest qualifying (85456ms) and fastest lap (84000ms) - should have null gap
      expect(driver1.qualifyingGap).toBeNull();
      expect(driver1.fastestLapGap).toBeNull();

      // Driver 2 has fastest race time (90000ms) - should have null gap
      expect(driver2.raceGap).toBeNull();
    });

    it('should show gap for non-leaders', () => {
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
      expect(driver2.qualifyingGap).toBe('+00.333');

      // Driver 1 race diff: 90500 - 90000 = 500ms
      expect(driver1.raceGap).toBe('+00.500');

      // Driver 2 fastest lap diff: 84333 - 84000 = 333ms
      expect(driver2.fastestLapGap).toBe('+00.333');
    });

    it('should render gap in parentheses beneath absolute time', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      // Check that the template renders gap in parentheses
      const html = wrapper.html();
      expect(html).toContain('(+00.333)');
    });

    it('should not render gap row for leader', () => {
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

      // Driver 1 is qualifying leader - should not have qualifying gap
      const driver1 = data.find((d: any) => d.driverName === 'Driver 1');
      expect(driver1.qualifyingGap).toBeNull();
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
      expect(data[0].raceTimeAbsolute).toBe('-');
      expect(data[0].fastestLapAbsolute).toBe('-');
      expect(data[0].raceGap).toBeNull();
      expect(data[0].fastestLapGap).toBeNull();
    });

    it('should keep legacy formatted fields for backwards compatibility', () => {
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

      // Legacy formatted fields should still work
      expect(driver1.qualifyingFormatted).toBe('01:25.456');
      expect(driver2.qualifyingFormatted).toBe('+00.333');
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

  describe('CSV Export', () => {
    it('should render export button', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      expect(exportButton.exists()).toBe(true);
      expect(exportButton.props('label')).toBe('Export Data');
    });

    it('should render "All Times" heading', () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      expect(wrapper.text()).toContain('All Times');
    });

    it('should include division column in CSV headers when divisions exist', async () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
          competitionName: 'Test League',
          seasonName: 'Season 1',
          roundName: 'Round 1',
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      await exportButton.trigger('click');

      // Check that createObjectURL was called with a Blob
      expect(URL.createObjectURL).toHaveBeenCalled();
      const createCall = vi.mocked(URL.createObjectURL).mock.calls[0];
      expect(createCall).toBeDefined();

      const blob = createCall?.[0] as Blob;
      expect(blob).toBeInstanceOf(Blob);

      // Read blob content
      const text = await blob.text();
      const lines = text.split('\n');
      const headers = lines[0]?.split(',');

      expect(headers).toContain('Position');
      expect(headers).toContain('Driver Name');
      expect(headers).toContain('Division');
      expect(headers).toContain('Qualifying Time');
      expect(headers).toContain('Qualifying Gap');
      expect(headers).toContain('Race Time');
      expect(headers).toContain('Race Gap');
      expect(headers).toContain('Fastest Lap');
      expect(headers).toContain('Fastest Lap Gap');
    });

    it('should exclude division column in CSV headers when no divisions', async () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: [],
          competitionName: 'Test League',
          seasonName: 'Season 1',
          roundName: 'Round 1',
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      await exportButton.trigger('click');

      const createCall = vi.mocked(URL.createObjectURL).mock.calls[0];
      const blob = createCall?.[0] as Blob;
      const text = await blob.text();
      const lines = text.split('\n');
      const headers = lines[0]?.split(',');

      expect(headers).not.toContain('Division');
      expect(headers).toContain('Position');
      expect(headers).toContain('Driver Name');
    });

    it('should generate correct CSV row data matching sortedData', async () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
          competitionName: 'Test League',
          seasonName: 'Season 1',
          roundName: 'Round 1',
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      await exportButton.trigger('click');

      const createCall = vi.mocked(URL.createObjectURL).mock.calls[0];
      const blob = createCall?.[0] as Blob;
      const text = await blob.text();
      const lines = text.split('\n');

      // Skip header line
      const dataLines = lines.slice(1).filter((line) => line.trim() !== '');

      // Should have 2 data rows (Driver 1 and Driver 2)
      expect(dataLines.length).toBe(2);

      // First row should be Driver 1 (default sort by qualifying)
      const firstRow = dataLines[0]?.split(',');
      expect(firstRow?.[0]).toBe('1'); // Position
      expect(firstRow?.[1]).toBe('Driver 1'); // Driver name
      expect(firstRow?.[2]).toBe('Division 1'); // Division
      expect(firstRow?.[3]).toBe('01:25.456'); // Qualifying time
      expect(firstRow?.[4]).toBe('-'); // Qualifying gap (leader)
      expect(firstRow?.[5]).toBe('01:30.500'); // Race time
      expect(firstRow?.[6]).toBe('+00.500'); // Race gap
      expect(firstRow?.[7]).toBe('01:24.000'); // Fastest lap
      expect(firstRow?.[8]).toBe('-'); // Fastest lap gap (leader)
    });

    it('should properly escape CSV special characters', async () => {
      const specialRaceEvents: RaceEventResults[] = [
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
              driver: { id: 1, name: 'Driver, Name "Special"' },
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
          ],
        },
      ];

      const specialQualifying: CrossDivisionResult[] = [
        { position: 1, race_result_id: 1, time_ms: 85456 },
      ];

      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: specialQualifying,
          raceTimeResults: null,
          fastestLapResults: null,
          raceEvents: specialRaceEvents,
          divisions: mockDivisions,
          competitionName: 'Test League',
          seasonName: 'Season 1',
          roundName: 'Round 1',
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      await exportButton.trigger('click');

      const createCall = vi.mocked(URL.createObjectURL).mock.calls[0];
      const blob = createCall?.[0] as Blob;
      const text = await blob.text();
      const lines = text.split('\n');

      // The driver name should be properly escaped with quotes
      expect(lines[1]).toContain('"Driver, Name ""Special"""');
    });

    it('should generate correct filename from props', async () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
          competitionName: 'Test League',
          seasonName: 'Season 1',
          roundName: 'Round 1',
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      await exportButton.trigger('click');

      // Check that the link was created with the correct download attribute
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(createdElements.length).toBeGreaterThan(0);

      const link = createdElements[0] as HTMLAnchorElement;
      expect(link.getAttribute('download')).toBe('test_league_season_1_round_1_all_times.csv');
    });

    it('should generate filename without optional props when not provided', async () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      await exportButton.trigger('click');

      const link = createdElements[0] as HTMLAnchorElement;
      expect(link.getAttribute('download')).toBe('all_times.csv');
    });

    it('should track GTM event with correct parameters', async () => {
      // Clear previous calls
      mockTrackEvent.mockClear();

      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
          competitionName: 'Test League',
          seasonName: 'Season 1',
          roundName: 'Round 1',
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      await exportButton.trigger('click');

      expect(mockTrackEvent).toHaveBeenCalledWith('csv_download_click', {
        csv_filename: 'test_league_season_1_round_1_all_times.csv',
        league_name: 'Test League',
        season_name: 'Season 1',
        table_type: 'cross_division_all_times',
      });
    });

    it('should create and clean up DOM elements properly', async () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: mockRaceTimeResults,
          fastestLapResults: mockFastestLapResults,
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
          competitionName: 'Test League',
          seasonName: 'Season 1',
          roundName: 'Round 1',
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      await exportButton.trigger('click');

      // Check that DOM operations were called in correct order
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle missing times with dashes', async () => {
      wrapper = mount(CrossDivisionAllTimesTable, {
        props: {
          qualifyingResults: mockQualifyingResults,
          raceTimeResults: null, // No race times
          fastestLapResults: null, // No fastest lap times
          raceEvents: mockRaceEvents,
          divisions: mockDivisions,
          competitionName: 'Test League',
          seasonName: 'Season 1',
          roundName: 'Round 1',
        },
      });

      const exportButton = wrapper.findComponent({ name: 'VrlButton' });
      await exportButton.trigger('click');

      const createCall = vi.mocked(URL.createObjectURL).mock.calls[0];
      const blob = createCall?.[0] as Blob;
      const text = await blob.text();
      const lines = text.split('\n');

      // Check first data row
      const firstRow = lines[1]?.split(',');
      expect(firstRow?.[5]).toBe('-'); // Race time should be dash
      expect(firstRow?.[6]).toBe('-'); // Race gap should be dash
      expect(firstRow?.[7]).toBe('-'); // Fastest lap should be dash
      expect(firstRow?.[8]).toBe('-'); // Fastest lap gap should be dash
    });
  });
});
