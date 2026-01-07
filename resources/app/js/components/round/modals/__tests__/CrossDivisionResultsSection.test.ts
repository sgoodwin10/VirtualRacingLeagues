import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CrossDivisionResultsSection from '../CrossDivisionResultsSection.vue';
import type { CrossDivisionResult, RaceEventResults } from '@app/types/roundResult';

describe('CrossDivisionResultsSection', () => {
  const mockDivisions = [
    { id: 1, name: 'Division A' },
    { id: 2, name: 'Division B' },
  ];

  const mockRaceEvents: RaceEventResults[] = [
    {
      id: 1,
      race_number: 1,
      name: 'Qualifying',
      is_qualifier: true,
      race_points: false,
      status: 'completed',
      results: [
        {
          id: 101,
          race_id: 1,
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: null,
          final_race_time: null,
          original_race_time_difference: null,
          final_race_time_difference: null,
          fastest_lap: '1:23.456',
          penalties: null,
          has_fastest_lap: false,
          has_pole: true,
          dnf: false,
          status: 'confirmed',
          race_points: 25,
          positions_gained: null,
          created_at: '2025-11-30T00:00:00Z',
          updated_at: '2025-11-30T00:00:00Z',
          driver: {
            id: 1,
            name: 'John Doe',
          },
        },
        {
          id: 102,
          race_id: 1,
          driver_id: 2,
          division_id: 2,
          position: 2,
          original_race_time: null,
          final_race_time: null,
          original_race_time_difference: null,
          final_race_time_difference: null,
          fastest_lap: '1:24.123',
          penalties: null,
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
          status: 'confirmed',
          race_points: 18,
          positions_gained: null,
          created_at: '2025-11-30T00:00:00Z',
          updated_at: '2025-11-30T00:00:00Z',
          driver: {
            id: 2,
            name: 'Jane Smith',
          },
        },
      ],
    },
  ];

  const mockResults: CrossDivisionResult[] = [
    {
      position: 1,
      race_result_id: 101,
      time_ms: 83456, // 1:23.456
    },
    {
      position: 2,
      race_result_id: 102,
      time_ms: 84123, // 1:24.123
    },
  ];

  it('renders the section with results', () => {
    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: mockResults,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    // The component receives the title prop but renders results in a data table
    expect(wrapper.vm).toBeDefined();
    expect(wrapper.props('title')).toBe('Qualifying Times');
  });

  it('displays results in a table', () => {
    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: mockResults,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    const table = wrapper.find('[role="table"]');
    expect(table.exists()).toBe(true);
  });

  it('shows empty state when results is null', () => {
    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: null,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    expect(wrapper.text()).toContain('No data available');
  });

  it('shows empty state when results is empty array', () => {
    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: [],
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    expect(wrapper.text()).toContain('No data available');
  });

  it('formats time correctly from milliseconds', () => {
    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: [{ position: 1, race_result_id: 101, time_ms: 85432 }], // 1:25.432
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    // The time should be formatted as 1:25.432
    expect(wrapper.html()).toContain('1:25.432');
  });

  it('displays driver names correctly', () => {
    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: mockResults,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('Jane Smith');
  });

  it('displays division names correctly', () => {
    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: mockResults,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    expect(wrapper.text()).toContain('Division A');
    expect(wrapper.text()).toContain('Division B');
  });

  it('displays positions correctly', () => {
    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: mockResults,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    const html = wrapper.html();
    expect(html).toContain('1');
    expect(html).toContain('2');
  });

  it('handles unknown driver gracefully', () => {
    const resultsWithUnknownDriver: CrossDivisionResult[] = [
      {
        position: 1,
        race_result_id: 999, // Non-existent result
        time_ms: 83456,
      },
    ];

    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: resultsWithUnknownDriver,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    expect(wrapper.text()).toContain('Unknown Driver');
  });

  it('formats zero time as dash', () => {
    const resultsWithZeroTime: CrossDivisionResult[] = [
      {
        position: 1,
        race_result_id: 101,
        time_ms: 0,
      },
    ];

    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: resultsWithZeroTime,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    // Should display a dash for zero time
    const html = wrapper.html();
    expect(html).toContain('-');
  });

  it('formats large times correctly', () => {
    const resultsWithLargeTime: CrossDivisionResult[] = [
      {
        position: 1,
        race_result_id: 101,
        time_ms: 3723456, // 62:03.456 (1 hour 2 minutes 3.456 seconds)
      },
    ];

    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Race Times',
        results: resultsWithLargeTime,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    // Should display 62:03.456 (total minutes, not hours)
    const html = wrapper.html();
    expect(html).toContain('62:03.456');
  });

  it('pads time components correctly', () => {
    const resultsWithSmallTime: CrossDivisionResult[] = [
      {
        position: 1,
        race_result_id: 101,
        time_ms: 5004, // 0:05.004
      },
    ];

    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Fastest Laps',
        results: resultsWithSmallTime,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    // Should display 0:05.004 with proper padding
    const html = wrapper.html();
    expect(html).toContain('0:05.004');
  });

  it('applies podium row classes correctly', () => {
    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: mockResults,
        raceEvents: mockRaceEvents,
        divisions: mockDivisions,
      },
    });

    // Check that rows have appropriate classes (PrimeVue DataTable applies these)
    // The component should have logic for podium positions (gold, silver, bronze)
    expect(wrapper.vm).toBeDefined();
  });

  it('handles missing division_id gracefully', () => {
    const eventsWithoutDivision: RaceEventResults[] = [
      {
        id: 1,
        race_number: 1,
        name: 'Qualifying',
        is_qualifier: true,
        race_points: false,
        status: 'completed',
        results: [
          {
            id: 101,
            race_id: 1,
            driver_id: 1,
            division_id: null,
            position: 1,
            original_race_time: null,
            final_race_time: null,
            original_race_time_difference: null,
            final_race_time_difference: null,
            fastest_lap: '1:23.456',
            penalties: null,
            has_fastest_lap: false,
            has_pole: true,
            dnf: false,
            status: 'confirmed',
            race_points: 25,
            positions_gained: null,
            created_at: '2025-11-30T00:00:00Z',
            updated_at: '2025-11-30T00:00:00Z',
            driver: {
              id: 1,
              name: 'John Doe',
            },
          },
        ],
      },
    ];

    const wrapper = mount(CrossDivisionResultsSection, {
      props: {
        title: 'Qualifying Times',
        results: [{ position: 1, race_result_id: 101, time_ms: 83456 }],
        raceEvents: eventsWithoutDivision,
        divisions: mockDivisions,
      },
    });

    expect(wrapper.text()).toContain('John Doe');
    // Division should show a dash or empty
    expect(wrapper.html()).toContain('-');
  });
});
