import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RoundStandingsTable from '../RoundStandingsTable.vue';
import type { RoundStandingDriver } from '@public/types/public';

describe('RoundStandingsTable', () => {
  const mockStandings: RoundStandingDriver[] = [
    {
      position: 1,
      driver_id: 1,
      driver_name: 'Lewis Hamilton',
      total_points: 26,
      race_points: 25,
      fastest_lap_points: 1,
      pole_position_points: 0,
      total_positions_gained: 2,
    },
    {
      position: 2,
      driver_id: 2,
      driver_name: 'Max Verstappen',
      total_points: 18,
      race_points: 18,
      fastest_lap_points: 0,
      pole_position_points: 0,
      total_positions_gained: 0,
    },
    {
      position: 3,
      driver_id: 3,
      driver_name: 'Charles Leclerc',
      total_points: 16,
      race_points: 15,
      fastest_lap_points: 0,
      pole_position_points: 1,
      total_positions_gained: -1,
    },
    {
      position: 4,
      driver_id: 4,
      driver_name: 'George Russell',
      total_points: 12,
      race_points: 12,
      fastest_lap_points: 0,
      pole_position_points: 0,
      total_positions_gained: 1,
    },
  ];

  it('renders the table with correct number of standings', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
      },
    });

    expect(wrapper.exists()).toBe(true);
    // Check that we have 4 drivers rendered
    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames).toHaveLength(4);
  });

  it('displays driver names correctly', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
      },
    });

    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames[0]?.text()).toBe('Lewis Hamilton');
    expect(driverNames[1]?.text()).toBe('Max Verstappen');
    expect(driverNames[2]?.text()).toBe('Charles Leclerc');
    expect(driverNames[3]?.text()).toBe('George Russell');
  });

  it('displays position numbers correctly', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
      },
    });

    const positions = wrapper.findAll('[data-test="position"]');
    expect(positions).toHaveLength(4);
    expect(positions[0]?.text()).toBe('1');
    expect(positions[1]?.text()).toBe('2');
    expect(positions[2]?.text()).toBe('3');
    expect(positions[3]?.text()).toBe('4');
  });

  it('displays race points correctly when showRacePoints is true', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
        showRacePoints: true,
      },
    });

    const racePoints = wrapper.findAll('[data-test="race-points"]');
    expect(racePoints).toHaveLength(4);
    expect(racePoints[0]?.text()).toBe('25');
    expect(racePoints[1]?.text()).toBe('18');
    expect(racePoints[2]?.text()).toBe('15');
    expect(racePoints[3]?.text()).toBe('12');
  });

  it('displays race points by default when showRacePoints prop is not provided', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
      },
    });

    const racePoints = wrapper.findAll('[data-test="race-points"]');
    expect(racePoints).toHaveLength(4);
  });

  it('hides race points column when showRacePoints is false', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
        showRacePoints: false,
      },
    });

    const racePoints = wrapper.findAll('[data-test="race-points"]');
    expect(racePoints).toHaveLength(0);

    // Verify other columns are still visible
    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames).toHaveLength(4);

    const totalPoints = wrapper.findAll('[data-test="total-points"]');
    expect(totalPoints).toHaveLength(4);
  });

  it('displays fastest lap points correctly', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
      },
    });

    const flPoints = wrapper.findAll('[data-test="fl-points"]');
    const flPointsEmpty = wrapper.findAll('[data-test="fl-points-empty"]');

    // Only first driver has FL points
    expect(flPoints).toHaveLength(1);
    expect(flPoints[0]?.text()).toBe('1');

    // Others show "-"
    expect(flPointsEmpty).toHaveLength(3);
  });

  it('displays pole position points correctly', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
      },
    });

    const polePoints = wrapper.findAll('[data-test="pole-points"]');
    const polePointsEmpty = wrapper.findAll('[data-test="pole-points-empty"]');

    // Third driver (Leclerc) has pole points
    expect(polePoints).toHaveLength(1);
    expect(polePoints[0]?.text()).toBe('1');

    // Others show "-"
    expect(polePointsEmpty).toHaveLength(3);
  });

  it('displays total points correctly', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
      },
    });

    const totalPoints = wrapper.findAll('[data-test="total-points"]');
    expect(totalPoints).toHaveLength(4);
    expect(totalPoints[0]?.text()).toBe('26');
    expect(totalPoints[1]?.text()).toBe('18');
    expect(totalPoints[2]?.text()).toBe('16');
    expect(totalPoints[3]?.text()).toBe('12');
  });

  it('displays positions gained correctly', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: mockStandings,
      },
    });

    const positionsGained = wrapper.findAll('[data-test="positions-gained"]');
    expect(positionsGained).toHaveLength(4);
    expect(positionsGained[0]?.text()).toBe('+2');
    expect(positionsGained[1]?.text()).toBe('-');
    expect(positionsGained[2]?.text()).toBe('-1');
    expect(positionsGained[3]?.text()).toBe('+1');
  });

  it('handles empty standings array', () => {
    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: [],
      },
    });

    expect(wrapper.exists()).toBe(true);
    // Should show no data message from VrlTable
    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames).toHaveLength(0);
  });

  it('displays both pole and fastest lap points for same driver', () => {
    const standingsWithBoth: RoundStandingDriver[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Dominant Driver',
        total_points: 27,
        race_points: 25,
        fastest_lap_points: 1,
        pole_position_points: 1,
        total_positions_gained: 3,
      },
    ];

    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: standingsWithBoth,
      },
    });

    const polePoints = wrapper.findAll('[data-test="pole-points"]');
    const flPoints = wrapper.findAll('[data-test="fl-points"]');

    expect(polePoints).toHaveLength(1);
    expect(polePoints[0]?.text()).toBe('1');

    expect(flPoints).toHaveLength(1);
    expect(flPoints[0]?.text()).toBe('1');
  });

  it('handles zero points correctly', () => {
    const standingsWithZeroPoints: RoundStandingDriver[] = [
      {
        position: 15,
        driver_id: 15,
        driver_name: 'Last Place Driver',
        total_points: 0,
        race_points: 0,
        fastest_lap_points: 0,
        pole_position_points: 0,
        total_positions_gained: 0,
      },
    ];

    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: standingsWithZeroPoints,
      },
    });

    const totalPoints = wrapper.findAll('[data-test="total-points"]');
    expect(totalPoints).toHaveLength(1);
    expect(totalPoints[0]?.text()).toBe('0');
  });

  it('displays negative positions gained correctly', () => {
    const standingsWithNegativeGain: RoundStandingDriver[] = [
      {
        position: 10,
        driver_id: 10,
        driver_name: 'Dropped Positions',
        total_points: 5,
        race_points: 5,
        fastest_lap_points: 0,
        pole_position_points: 0,
        total_positions_gained: -5,
      },
    ];

    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: standingsWithNegativeGain,
      },
    });

    const positionsGained = wrapper.findAll('[data-test="positions-gained"]');
    expect(positionsGained).toHaveLength(1);
    expect(positionsGained[0]?.text()).toBe('-5');
    expect(positionsGained[0]?.classes()).toContain('text-[var(--color-safety)]');
  });

  it('displays positive positions gained with correct styling', () => {
    const standingsWithPositiveGain: RoundStandingDriver[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Gained Positions',
        total_points: 25,
        race_points: 25,
        fastest_lap_points: 0,
        pole_position_points: 0,
        total_positions_gained: 10,
      },
    ];

    const wrapper = mount(RoundStandingsTable, {
      props: {
        standings: standingsWithPositiveGain,
      },
    });

    const positionsGained = wrapper.findAll('[data-test="positions-gained"]');
    expect(positionsGained).toHaveLength(1);
    expect(positionsGained[0]?.text()).toBe('+10');
    expect(positionsGained[0]?.classes()).toContain('text-[var(--color-success)]');
  });
});
