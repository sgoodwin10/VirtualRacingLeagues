import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StandingsTable from '../StandingsTable.vue';
import VrlTable from '@public/components/common/data-display/VrlTable.vue';
import type { SeasonStandingDriver } from '@public/types/public';

describe('StandingsTable', () => {
  const mockRounds = [
    { round_id: 1, round_number: 1, name: 'Round 1' },
    { round_id: 2, round_number: 2, name: 'Round 2' },
    { round_id: 3, round_number: 3, name: 'Round 3' },
  ];

  const mockDrivers: SeasonStandingDriver[] = [
    {
      position: 1,
      driver_id: 1,
      driver_name: 'Driver One',
      total_points: 75,
      podiums: 3,
      poles: 2,
      rounds: [
        {
          round_id: 1,
          round_number: 1,
          points: 25,
          position: 1,
          has_pole: true,
          has_fastest_lap: false,
        },
        {
          round_id: 2,
          round_number: 2,
          points: 25,
          position: 1,
          has_pole: false,
          has_fastest_lap: true,
        },
        {
          round_id: 3,
          round_number: 3,
          points: 25,
          position: 1,
          has_pole: true,
          has_fastest_lap: true,
        },
      ],
    },
    {
      position: 2,
      driver_id: 2,
      driver_name: 'Driver Two',
      total_points: 50,
      podiums: 2,
      poles: 1,
      rounds: [
        {
          round_id: 1,
          round_number: 1,
          points: 18,
          position: 2,
          has_pole: false,
          has_fastest_lap: false,
        },
        {
          round_id: 2,
          round_number: 2,
          points: 18,
          position: 2,
          has_pole: false,
          has_fastest_lap: false,
        },
        {
          round_id: 3,
          round_number: 3,
          points: 14,
          position: 3,
          has_pole: false,
          has_fastest_lap: false,
        },
      ],
    },
    {
      position: 3,
      driver_id: 3,
      driver_name: 'Driver Three',
      total_points: 40,
      podiums: 1,
      poles: 0,
      rounds: [
        {
          round_id: 1,
          round_number: 1,
          points: 15,
          position: 3,
          has_pole: false,
          has_fastest_lap: false,
        },
        {
          round_id: 2,
          round_number: 2,
          points: 15,
          position: 3,
          has_pole: false,
          has_fastest_lap: false,
        },
        {
          round_id: 3,
          round_number: 3,
          points: 10,
          position: 4,
          has_pole: false,
          has_fastest_lap: false,
        },
      ],
    },
  ];

  it('renders VrlTable component', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    expect(wrapper.findComponent(VrlTable).exists()).toBe(true);
  });

  it('generates correct columns structure', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const vrlTable = wrapper.findComponent(VrlTable);
    const columns = vrlTable.props('columns');

    // Position + Driver + Podiums + Poles + 3 rounds + Points = 8 columns
    expect(columns).toHaveLength(8);
    expect(columns[0]?.field).toBe('position');
    expect(columns[1]?.field).toBe('driver');
    expect(columns[2]?.field).toBe('podiums');
    expect(columns[3]?.field).toBe('poles');
    expect(columns[4]?.field).toBe('round_1');
    expect(columns[5]?.field).toBe('round_2');
    expect(columns[6]?.field).toBe('round_3');
    expect(columns[7]?.field).toBe('points');
  });

  it('transforms driver data correctly', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const vrlTable = wrapper.findComponent(VrlTable);
    const tableData = vrlTable.props('data');

    expect(tableData).toHaveLength(3);
    expect(tableData[0]?.driver_name).toBe('Driver One');
    expect(tableData[0]?.total_points).toBe(75);
  });

  it('displays position with correct styling', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const positions = wrapper.findAll('.font-display.text-xl');
    expect(positions).toHaveLength(3);
    expect(positions[0]?.text()).toBe('1');
    expect(positions[1]?.text()).toBe('2');
    expect(positions[2]?.text()).toBe('3');
  });

  it('displays driver names', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const driverNames = wrapper.findAll('[data-test="driver-name"]');
    expect(driverNames).toHaveLength(3);
    expect(driverNames[0]?.text()).toBe('Driver One');
    expect(driverNames[1]?.text()).toBe('Driver Two');
    expect(driverNames[2]?.text()).toBe('Driver Three');
  });

  it('displays round points', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    // Use data-test attributes to find round points
    const round1Points = wrapper.findAll('[data-test="round-1-points"]');
    const round2Points = wrapper.findAll('[data-test="round-2-points"]');
    const round3Points = wrapper.findAll('[data-test="round-3-points"]');

    // Verify first driver's round points
    expect(round1Points[0]?.text()).toBe('25');
    expect(round2Points[0]?.text()).toBe('25');
    expect(round3Points[0]?.text()).toBe('25');

    // Verify second driver's round points
    expect(round1Points[1]?.text()).toBe('18');
    expect(round2Points[1]?.text()).toBe('18');
    expect(round3Points[1]?.text()).toBe('14');
  });

  it('displays pole position badge', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const allText = wrapper.text();
    expect(allText).toContain('P');
    // Check for spans with title="Pole Position"
    const poleBadges = wrapper.findAll('[title="Pole Position"]');
    expect(poleBadges.length).toBeGreaterThan(0);
    expect(poleBadges[0]?.text()).toBe('P');
  });

  it('displays fastest lap badge', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const allText = wrapper.text();
    expect(allText).toContain('FL');
    // Check for spans with title="Fastest Lap"
    const flBadges = wrapper.findAll('[title="Fastest Lap"]');
    expect(flBadges.length).toBeGreaterThan(0);
    expect(flBadges[0]?.text()).toBe('FL');
  });

  it('displays total points', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const points = wrapper.findAll('[data-test="total-points"]');
    expect(points).toHaveLength(3);
    expect(points[0]?.text()).toBe('75');
    expect(points[1]?.text()).toBe('50');
    expect(points[2]?.text()).toBe('40');
  });

  it('displays podiums count', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const podiumsCounts = wrapper.findAll('[data-test="podiums-count"]');
    expect(podiumsCounts).toHaveLength(3);
    expect(podiumsCounts[0]?.text()).toBe('3');
    expect(podiumsCounts[1]?.text()).toBe('2');
    expect(podiumsCounts[2]?.text()).toBe('1');
  });

  it('displays poles count', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const polesCounts = wrapper.findAll('[data-test="poles-count"]');
    expect(polesCounts).toHaveLength(3);
    expect(polesCounts[0]?.text()).toBe('2');
    expect(polesCounts[1]?.text()).toBe('1');
    // When poles is 0, it shows empty string
    expect(polesCounts[2]?.text()).toBe('');
  });

  it('enables sticky header', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const vrlTable = wrapper.findComponent(VrlTable);
    expect(vrlTable.props('stickyHeader')).toBe(true);
  });

  it('handles missing round data with dash', () => {
    const driversWithMissingRound: SeasonStandingDriver[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Driver One',
        total_points: 25,
        podiums: 1,
        poles: 0,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 25,
            position: 1,
            has_pole: false,
            has_fastest_lap: false,
          },
        ],
      },
    ];

    const wrapper = mount(StandingsTable, {
      props: {
        drivers: driversWithMissingRound,
        rounds: mockRounds,
      },
    });

    // Use data-test attributes to find round points
    const round1Points = wrapper.findAll('[data-test="round-1-points"]');
    const round2Points = wrapper.findAll('[data-test="round-2-points"]');
    const round3Points = wrapper.findAll('[data-test="round-3-points"]');

    expect(round1Points[0]?.text()).toBe('25'); // Round 1 (has data)
    expect(round2Points[0]?.text()).toBe('-'); // Round 2 (missing)
    expect(round3Points[0]?.text()).toBe('-'); // Round 3 (missing)
  });

  it('displays position tooltip on round points', () => {
    const wrapper = mount(StandingsTable, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    // Find round points elements with data-test attributes
    const round1Points = wrapper.findAll('[data-test="round-1-points"]');
    expect(round1Points.length).toBeGreaterThan(0);

    // Check first driver's round 1 tooltip (P1st - 25 pts)
    expect(round1Points[0]?.attributes('title')).toBe('P1st - 25 pts');

    // Check second driver's round 1 tooltip (P2nd - 18 pts)
    expect(round1Points[1]?.attributes('title')).toBe('P2nd - 18 pts');

    // Check third driver's round 1 tooltip (P3rd - 15 pts)
    expect(round1Points[2]?.attributes('title')).toBe('P3rd - 15 pts');

    // Check third driver's round 3 tooltip (P4th - 10 pts)
    const round3Points = wrapper.findAll('[data-test="round-3-points"]');
    expect(round3Points[2]?.attributes('title')).toBe('P4th - 10 pts');
  });

  it('handles null position in tooltip', () => {
    const driversWithNullPosition: SeasonStandingDriver[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Driver One',
        total_points: 25,
        podiums: 1,
        poles: 0,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 25,
            position: null,
            has_pole: false,
            has_fastest_lap: false,
          },
        ],
      },
    ];

    const wrapper = mount(StandingsTable, {
      props: {
        drivers: driversWithNullPosition,
        rounds: [{ round_id: 1, round_number: 1, name: 'Round 1' }],
      },
    });

    const round1Points = wrapper.findAll('[data-test="round-1-points"]');
    // Tooltip should be empty string when position is null
    expect(round1Points[0]?.attributes('title')).toBe('');
  });
});
