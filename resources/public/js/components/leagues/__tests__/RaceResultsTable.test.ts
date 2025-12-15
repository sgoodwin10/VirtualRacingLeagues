import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RaceResultsTable from '../RaceResultsTable.vue';
import type { PublicRaceResult } from '@public/types/public';

describe('RaceResultsTable', () => {
  const mockResults: PublicRaceResult[] = [
    {
      position: 1,
      driver_id: 1,
      driver_name: 'Lewis Hamilton',
      race_time: '1:32:15.123',
      race_time_difference: null,
      fastest_lap: '1:22.456',
      penalties: null,
      race_points: 25,
      has_fastest_lap: true,
      has_pole: true,
      dnf: false,
      status: 'Finished',
    },
    {
      position: 2,
      driver_id: 2,
      driver_name: 'Max Verstappen',
      race_time: '1:32:18.567',
      race_time_difference: '3.444',
      fastest_lap: '1:22.789',
      penalties: null,
      race_points: 18,
      has_fastest_lap: false,
      has_pole: false,
      dnf: false,
      status: 'Finished',
    },
    {
      position: 3,
      driver_id: 3,
      driver_name: 'Charles Leclerc',
      race_time: '1:32:22.100',
      race_time_difference: '6.977',
      fastest_lap: '1:23.123',
      penalties: '+5s',
      race_points: 15,
      has_fastest_lap: false,
      has_pole: false,
      dnf: false,
      status: 'Finished',
    },
    {
      position: null,
      driver_id: 4,
      driver_name: 'George Russell',
      race_time: null,
      race_time_difference: null,
      fastest_lap: null,
      penalties: null,
      race_points: 0,
      has_fastest_lap: false,
      has_pole: false,
      dnf: true,
      status: 'Mechanical Failure',
    },
  ];

  it('renders the table with correct number of results', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    expect(wrapper.exists()).toBe(true);
    // Check that we have 4 results rendered
    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames).toHaveLength(4);
  });

  it('displays driver names correctly', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames[0]?.text()).toBe('Lewis Hamilton');
    expect(driverNames[1]?.text()).toBe('Max Verstappen');
    expect(driverNames[2]?.text()).toBe('Charles Leclerc');
    expect(driverNames[3]?.text()).toBe('George Russell');
  });

  it('displays position numbers for non-DNF drivers', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const positions = wrapper.findAll('[data-test="position"]');
    expect(positions).toHaveLength(3); // 3 drivers finished
    expect(positions[0]?.text()).toBe('1');
    expect(positions[1]?.text()).toBe('2');
    expect(positions[2]?.text()).toBe('3');
  });

  it('displays DNF badge for drivers who did not finish', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const dnfBadges = wrapper.findAll('[data-test="dnf-badge"]');
    expect(dnfBadges).toHaveLength(1);
    expect(dnfBadges[0]?.text()).toBe('DNF');
  });

  it('displays pole position badge for pole sitter', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const poleBadges = wrapper.findAll('[data-test="pole-badge"]');
    expect(poleBadges).toHaveLength(1);
    expect(poleBadges[0]?.text()).toBe('POLE');
  });

  it('displays race time correctly for P1 and time difference for others', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const raceTimes = wrapper.findAll('[data-test="race-time"]');
    expect(raceTimes[0]?.text()).toBe('1:32:15.123'); // P1 shows actual time
    expect(raceTimes[1]?.text()).toBe('+3.444'); // P2 shows difference
    expect(raceTimes[2]?.text()).toBe('+6.977'); // P3 shows difference
    expect(raceTimes[3]?.text()).toBe('Mechanical Failure'); // DNF shows status
  });

  it('highlights fastest lap holder', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const fastestLaps = wrapper.findAll('[data-test="fastest-lap"]');
    expect(fastestLaps).toHaveLength(3); // Only 3 drivers have fastest lap times
    expect(fastestLaps[0]?.text()).toBe('1:22.456');
    // Check that the fastest lap holder has special styling class
    expect(fastestLaps[0]?.classes()).toContain('text-[var(--color-racing-fastest-lap)]');
  });

  it('displays penalties when present', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const penalties = wrapper.findAll('[data-test="penalties"]');
    expect(penalties).toHaveLength(1); // Only one driver has penalties
    expect(penalties[0]?.text()).toBe('+5s');
  });

  it('displays race points correctly', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const points = wrapper.findAll('[data-test="race-points"]');
    expect(points).toHaveLength(4);
    expect(points[0]?.text()).toBe('25');
    expect(points[1]?.text()).toBe('18');
    expect(points[2]?.text()).toBe('15');
    expect(points[3]?.text()).toBe('0'); // DNF gets 0 points
  });

  it('handles empty results array', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: [],
      },
    });

    expect(wrapper.exists()).toBe(true);
    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames).toHaveLength(0);
  });

  it('handles results without penalties or fastest laps', () => {
    const minimalResults: PublicRaceResult[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Test Driver',
        race_time: '1:30:00.000',
        race_time_difference: null,
        fastest_lap: null,
        penalties: null,
        race_points: 25,
        has_fastest_lap: false,
        has_pole: false,
        dnf: false,
        status: 'Finished',
      },
    ];

    const wrapper = mount(RaceResultsTable, {
      props: {
        results: minimalResults,
      },
    });

    expect(wrapper.exists()).toBe(true);
    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames).toHaveLength(1);
  });

  it('applies correct position colors', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const positions = wrapper.findAll('[data-test="position"]');

    // P1 should have gold color
    expect(positions[0]?.attributes('style')).toContain('var(--color-racing-pole)');

    // P2 should have silver color
    expect(positions[1]?.attributes('style')).toContain('var(--color-racing-podium-2)');

    // P3 should have bronze color
    expect(positions[2]?.attributes('style')).toContain('var(--color-racing-podium-3)');
  });

  it('does not show division column when showDivision is false', () => {
    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResults,
        showDivision: false,
      },
    });

    const divisionTags = wrapper.findAll('[data-test="division-tag"]');
    expect(divisionTags).toHaveLength(0);
  });

  it('shows division column when showDivision is true', () => {
    const mockResultsWithDivisions: PublicRaceResult[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Lewis Hamilton',
        race_time: '1:32:15.123',
        race_time_difference: null,
        fastest_lap: '1:22.456',
        penalties: null,
        race_points: 25,
        has_fastest_lap: true,
        has_pole: true,
        dnf: false,
        status: 'Finished',
        division_id: 1,
        division_name: 'Pro',
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Max Verstappen',
        race_time: '1:32:18.567',
        race_time_difference: '3.444',
        fastest_lap: '1:22.789',
        penalties: null,
        race_points: 18,
        has_fastest_lap: false,
        has_pole: false,
        dnf: false,
        status: 'Finished',
        division_id: 2,
        division_name: 'Am',
      },
    ];

    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResultsWithDivisions,
        showDivision: true,
      },
    });

    const divisionTags = wrapper.findAll('[data-test="division-tag"]');
    expect(divisionTags).toHaveLength(2);
    expect(divisionTags[0]?.text()).toBe('Pro');
    expect(divisionTags[1]?.text()).toBe('Am');
  });

  it('applies correct division color classes', () => {
    const mockResultsWithDivisions: PublicRaceResult[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Driver 1',
        race_time: '1:32:15.123',
        race_time_difference: null,
        fastest_lap: null,
        penalties: null,
        race_points: 25,
        has_fastest_lap: false,
        has_pole: false,
        dnf: false,
        status: 'Finished',
        division_id: 1,
        division_name: 'Division 1',
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Driver 2',
        race_time: '1:32:18.567',
        race_time_difference: '3.444',
        fastest_lap: null,
        penalties: null,
        race_points: 18,
        has_fastest_lap: false,
        has_pole: false,
        dnf: false,
        status: 'Finished',
        division_id: 2,
        division_name: 'Division 2',
      },
    ];

    const wrapper = mount(RaceResultsTable, {
      props: {
        results: mockResultsWithDivisions,
        showDivision: true,
      },
    });

    const divisionTags = wrapper.findAll('[data-test="division-tag"]');
    // Division ID 1 should get first color (blue)
    expect(divisionTags[0]?.classes()).toContain('division-blue');
    // Division ID 2 should get second color (green)
    expect(divisionTags[1]?.classes()).toContain('division-green');
  });

  describe('Qualifying Results', () => {
    const mockQualifyingResults: PublicRaceResult[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Lewis Hamilton',
        race_time: null,
        race_time_difference: null,
        fastest_lap: '1:22.456',
        penalties: null,
        race_points: 0,
        has_fastest_lap: true,
        has_pole: true,
        dnf: false,
        status: 'Finished',
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Max Verstappen',
        race_time: null,
        race_time_difference: null,
        fastest_lap: '1:22.789',
        penalties: null,
        race_points: 0,
        has_fastest_lap: false,
        has_pole: false,
        dnf: false,
        status: 'Finished',
      },
    ];

    it('shows only qualifying columns when isQualifier is true', () => {
      const wrapper = mount(RaceResultsTable, {
        props: {
          results: mockQualifyingResults,
          isQualifier: true,
        },
      });

      // Should show position, driver, fastest lap
      expect(wrapper.findAll('[data-test="driver-name"]')).toHaveLength(2);
      expect(wrapper.findAll('[data-test="fastest-lap"]')).toHaveLength(2);

      // Should NOT show race time or penalties
      expect(wrapper.findAll('[data-test="race-time"]')).toHaveLength(0);
      expect(wrapper.findAll('[data-test="penalties"]')).toHaveLength(0);
    });

    it('hides points column when showPoints is false', () => {
      const wrapper = mount(RaceResultsTable, {
        props: {
          results: mockQualifyingResults,
          isQualifier: true,
          showPoints: false,
        },
      });

      // Should NOT show points column
      expect(wrapper.findAll('[data-test="race-points"]')).toHaveLength(0);
    });

    it('shows points column when showPoints is true for qualifying', () => {
      const mockQualifyingWithPoints: PublicRaceResult[] = [
        {
          position: 1,
          driver_id: 1,
          driver_name: 'Lewis Hamilton',
          race_time: null,
          race_time_difference: null,
          fastest_lap: '1:22.456',
          penalties: null,
          race_points: 3,
          has_fastest_lap: true,
          has_pole: true,
          dnf: false,
          status: 'Finished',
        },
        {
          position: 2,
          driver_id: 2,
          driver_name: 'Max Verstappen',
          race_time: null,
          race_time_difference: null,
          fastest_lap: '1:22.789',
          penalties: null,
          race_points: 2,
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
          status: 'Finished',
        },
      ];

      const wrapper = mount(RaceResultsTable, {
        props: {
          results: mockQualifyingWithPoints,
          isQualifier: true,
          showPoints: true,
        },
      });

      // Should show points column
      const points = wrapper.findAll('[data-test="race-points"]');
      expect(points).toHaveLength(2);
      expect(points[0]?.text()).toBe('3');
      expect(points[1]?.text()).toBe('2');
    });

    it('shows all columns for race results when isQualifier is false', () => {
      const wrapper = mount(RaceResultsTable, {
        props: {
          results: mockResults,
          isQualifier: false,
        },
      });

      // Should show all columns including race time and penalties
      expect(wrapper.findAll('[data-test="driver-name"]')).toHaveLength(4);
      expect(wrapper.findAll('[data-test="race-time"]')).toHaveLength(4);
      expect(wrapper.findAll('[data-test="fastest-lap"]')).toHaveLength(3);
      expect(wrapper.findAll('[data-test="penalties"]')).toHaveLength(1);
      expect(wrapper.findAll('[data-test="race-points"]')).toHaveLength(4);
    });
  });

  describe('Race Results Points Column', () => {
    it('hides points column when showPoints is false for race results', () => {
      const wrapper = mount(RaceResultsTable, {
        props: {
          results: mockResults,
          isQualifier: false,
          showPoints: false,
        },
      });

      // Should NOT show points column
      expect(wrapper.findAll('[data-test="race-points"]')).toHaveLength(0);
    });

    it('shows points column when showPoints is true for race results', () => {
      const wrapper = mount(RaceResultsTable, {
        props: {
          results: mockResults,
          isQualifier: false,
          showPoints: true,
        },
      });

      // Should show points column
      const points = wrapper.findAll('[data-test="race-points"]');
      expect(points).toHaveLength(4);
      expect(points[0]?.text()).toBe('25');
      expect(points[1]?.text()).toBe('18');
      expect(points[2]?.text()).toBe('15');
      expect(points[3]?.text()).toBe('0');
    });

    it('shows points column by default (showPoints defaults to true)', () => {
      const wrapper = mount(RaceResultsTable, {
        props: {
          results: mockResults,
          isQualifier: false,
        },
      });

      // Should show points column (default behavior)
      const points = wrapper.findAll('[data-test="race-points"]');
      expect(points).toHaveLength(4);
    });
  });
});
