import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TimeResultsTable from '../TimeResultsTable.vue';
import type { TimeResult } from '@public/types/public';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useRoute: () => ({
    params: {},
    query: {},
  }),
}));

describe('TimeResultsTable', () => {
  const mockResults: TimeResult[] = [
    {
      position: 1,
      driver_id: 1,
      driver_name: 'Lewis Hamilton',
      time_formatted: '1:23.456',
      time_difference: null,
    },
    {
      position: 2,
      driver_id: 2,
      driver_name: 'Max Verstappen',
      time_formatted: '1:23.690',
      time_difference: '0.234',
    },
    {
      position: 3,
      driver_id: 3,
      driver_name: 'Charles Leclerc',
      time_formatted: '1:24.023',
      time_difference: '0.567',
    },
    {
      position: 4,
      driver_id: 4,
      driver_name: 'George Russell',
      time_formatted: '1:24.156',
      time_difference: '0.700',
    },
  ];

  it('renders the table with correct number of results', () => {
    const wrapper = mount(TimeResultsTable, {
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
    const wrapper = mount(TimeResultsTable, {
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

  it('displays position numbers', () => {
    const wrapper = mount(TimeResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const positions = wrapper.findAll('[data-test="position"]');
    expect(positions).toHaveLength(4);
    expect(positions[0]?.text()).toBe('1');
    expect(positions[1]?.text()).toBe('2');
    expect(positions[2]?.text()).toBe('3');
    expect(positions[3]?.text()).toBe('4');
  });

  it('displays actual time for P1 and time difference for P2+', () => {
    const wrapper = mount(TimeResultsTable, {
      props: {
        results: mockResults,
      },
    });

    const times = wrapper.findAll('[data-test="time"]');
    expect(times[0]?.text()).toBe('1:23.456'); // P1 shows actual time
    expect(times[1]?.text()).toBe('+0.234'); // P2 shows difference with +
    expect(times[2]?.text()).toBe('+0.567'); // P3 shows difference with +
    expect(times[3]?.text()).toBe('+0.700'); // P4 shows difference with +
  });

  it('applies correct position colors for top 3', () => {
    const wrapper = mount(TimeResultsTable, {
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

    // P4 should have dim color
    expect(positions[3]?.attributes('style')).toContain('var(--text-dim)');
  });

  it('does not show division column when showDivision is false', () => {
    const wrapper = mount(TimeResultsTable, {
      props: {
        results: mockResults,
        showDivision: false,
      },
    });

    const divisionTags = wrapper.findAll('[data-test="division-tag"]');
    expect(divisionTags).toHaveLength(0);
  });

  it('shows division column when showDivision is true', () => {
    const mockResultsWithDivisions: TimeResult[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Lewis Hamilton',
        time_formatted: '1:23.456',
        time_difference: null,
        division_id: 1,
        division_name: 'Pro',
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Max Verstappen',
        time_formatted: '1:23.690',
        time_difference: '0.234',
        division_id: 2,
        division_name: 'Am',
      },
    ];

    const wrapper = mount(TimeResultsTable, {
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
    const mockResultsWithDivisions: TimeResult[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Driver 1',
        time_formatted: '1:23.456',
        time_difference: null,
        division_id: 1,
        division_name: 'Division 1',
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Driver 2',
        time_formatted: '1:23.690',
        time_difference: '0.234',
        division_id: 2,
        division_name: 'Division 2',
      },
      {
        position: 3,
        driver_id: 3,
        driver_name: 'Driver 3',
        time_formatted: '1:24.023',
        time_difference: '0.567',
        division_id: 3,
        division_name: 'Division 3',
      },
    ];

    const wrapper = mount(TimeResultsTable, {
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
    // Division ID 3 should get third color (purple)
    expect(divisionTags[2]?.classes()).toContain('division-purple');
  });

  it('handles empty results array', () => {
    const wrapper = mount(TimeResultsTable, {
      props: {
        results: [],
      },
    });

    expect(wrapper.exists()).toBe(true);
    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames).toHaveLength(0);
  });

  it('handles results with missing division names when showDivision is true', () => {
    const mockResultsMixedDivisions: TimeResult[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Driver 1',
        time_formatted: '1:23.456',
        time_difference: null,
        division_id: 1,
        division_name: 'Division 1',
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Driver 2',
        time_formatted: '1:23.690',
        time_difference: '0.234',
        // No division
      },
    ];

    const wrapper = mount(TimeResultsTable, {
      props: {
        results: mockResultsMixedDivisions,
        showDivision: true,
      },
    });

    expect(wrapper.exists()).toBe(true);
    const divisionTags = wrapper.findAll('[data-test="division-tag"]');
    expect(divisionTags).toHaveLength(1); // Only one result has division
  });

  it('displays time_formatted when time_difference is null for P1', () => {
    const singleResult: TimeResult[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Single Driver',
        time_formatted: '1:23.456',
        time_difference: null,
      },
    ];

    const wrapper = mount(TimeResultsTable, {
      props: {
        results: singleResult,
      },
    });

    const times = wrapper.findAll('[data-test="time"]');
    expect(times[0]?.text()).toBe('1:23.456');
  });

  it('handles missing time_difference gracefully for non-P1 positions', () => {
    const resultsWithoutDiff: TimeResult[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Driver 1',
        time_formatted: '1:23.456',
        time_difference: null,
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Driver 2',
        time_formatted: '1:23.690',
        time_difference: null, // Missing difference
      },
    ];

    const wrapper = mount(TimeResultsTable, {
      props: {
        results: resultsWithoutDiff,
      },
    });

    const times = wrapper.findAll('[data-test="time"]');
    expect(times[0]?.text()).toBe('1:23.456'); // P1 shows time
    expect(times[1]?.text()).toBe('1:23.690'); // P2 shows time_formatted as fallback
  });
});
