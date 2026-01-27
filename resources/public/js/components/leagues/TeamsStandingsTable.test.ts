import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TeamsStandingsTable from './TeamsStandingsTable.vue';
import type { TeamChampionshipStanding } from '@public/types/public';

describe('TeamsStandingsTable', () => {
  const mockTeams: TeamChampionshipStanding[] = [
    {
      team_id: 1,
      team_name: 'Red Bull Racing',
      team_logo: null,
      total_points: 350,
      drop_total: 340,
      position: 1,
      rounds: [
        { round_id: 1, round_number: 1, points: 50 },
        { round_id: 2, round_number: 2, points: 45 },
        { round_id: 3, round_number: 3, points: 48 },
      ],
    },
    {
      team_id: 2,
      team_name: 'Mercedes AMG',
      team_logo: null,
      total_points: 320,
      drop_total: 315,
      position: 2,
      rounds: [
        { round_id: 1, round_number: 1, points: 45 },
        { round_id: 2, round_number: 2, points: 50 },
        { round_id: 3, round_number: 3, points: 42 },
      ],
    },
    {
      team_id: 3,
      team_name: 'Ferrari',
      team_logo: null,
      total_points: 290,
      drop_total: 282,
      position: 3,
      rounds: [
        { round_id: 1, round_number: 1, points: 40 },
        { round_id: 2, round_number: 2, points: 42 },
        { round_id: 3, round_number: 3, points: 50 },
      ],
    },
  ];

  const defaultProps = {
    teams: mockTeams,
    rounds: [1, 2, 3],
    teamsDropRoundEnabled: false,
  };

  describe('Rendering', () => {
    it('should render standings table', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const table = wrapper.find('.teams-standings-table');
      expect(table.exists()).toBe(true);
    });

    it('should render table headers', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const headers = wrapper.findAll('thead th');
      expect(headers.length).toBeGreaterThan(0);
      expect(headers[0]?.text()).toBe('#');
      expect(headers[1]?.text()).toBe('Team');
    });

    it('should render round headers', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const headers = wrapper.findAll('thead th');
      expect(headers[2]?.text()).toBe('R1');
      expect(headers[3]?.text()).toBe('R2');
      expect(headers[4]?.text()).toBe('R3');
    });

    it('should render total points header', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const headers = wrapper.findAll('thead th');
      const totalHeader = headers.find((h) => h.text() === 'Total');
      expect(totalHeader).toBeDefined();
    });

    it('should render team rows', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const rows = wrapper.findAll('tbody tr');
      expect(rows.length).toBe(3);
    });

    it('should render team names', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const teamNames = wrapper.findAll('.team-name');
      expect(teamNames.length).toBe(3);
      expect(teamNames[0]?.text()).toBe('Red Bull Racing');
      expect(teamNames[1]?.text()).toBe('Mercedes AMG');
      expect(teamNames[2]?.text()).toBe('Ferrari');
    });

    it('should render team positions', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const positions = wrapper.findAll('.position-cell');
      expect(positions[0]?.text()).toBe('1');
      expect(positions[1]?.text()).toBe('2');
      expect(positions[2]?.text()).toBe('3');
    });

    it('should render total points for each team', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const pointsCells = wrapper.findAll('.points-cell');
      expect(pointsCells[0]?.text()).toBe('350');
      expect(pointsCells[1]?.text()).toBe('320');
      expect(pointsCells[2]?.text()).toBe('290');
    });

    it('should render round points for each team', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const roundCells = wrapper.findAll('.round-cell');
      // First team's rounds: 50, 45, 48
      expect(roundCells[0]?.text()).toBe('50');
      expect(roundCells[1]?.text()).toBe('45');
      expect(roundCells[2]?.text()).toBe('48');
    });
  });

  describe('Drop Total Column', () => {
    it('should render drop header when teamsDropRoundEnabled is true', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: {
          ...defaultProps,
          teamsDropRoundEnabled: true,
        },
      });

      const headers = wrapper.findAll('thead th');
      const dropHeader = headers.find((h) => h.text() === 'Drop');
      expect(dropHeader).toBeDefined();
    });

    it('should not render drop header when teamsDropRoundEnabled is false', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: {
          ...defaultProps,
          teamsDropRoundEnabled: false,
        },
      });

      const headers = wrapper.findAll('thead th');
      const dropHeader = headers.find((h) => h.text() === 'Drop');
      expect(dropHeader).toBeUndefined();
    });

    it('should render drop totals when enabled', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: {
          ...defaultProps,
          teamsDropRoundEnabled: true,
        },
      });

      const dropCells = wrapper.findAll('.drop-cell');
      expect(dropCells.length).toBe(3);
      expect(dropCells[0]?.text()).toBe('340');
      expect(dropCells[1]?.text()).toBe('315');
      expect(dropCells[2]?.text()).toBe('282');
    });

    it('should fallback to total_points when drop_total is null', () => {
      const teamsWithoutDrop = [
        {
          ...mockTeams[0],
          drop_total: undefined,
        },
      ];
      const wrapper = mount(TeamsStandingsTable, {
        props: {
          teams: teamsWithoutDrop as TeamChampionshipStanding[],
          rounds: [1],
          teamsDropRoundEnabled: true,
        },
      });

      const dropCell = wrapper.find('.drop-cell');
      expect(dropCell.text()).toBe('350');
    });
  });

  describe('Podium Highlighting', () => {
    it('should apply podium-1 class to first place', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const rows = wrapper.findAll('tbody tr');
      expect(rows[0]?.classes()).toContain('podium-1');
    });

    it('should apply podium-2 class to second place', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const rows = wrapper.findAll('tbody tr');
      expect(rows[1]?.classes()).toContain('podium-2');
    });

    it('should apply podium-3 class to third place', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const rows = wrapper.findAll('tbody tr');
      expect(rows[2]?.classes()).toContain('podium-3');
    });

    it('should apply position-specific color to first place', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const positions = wrapper.findAll('.position-cell');
      expect(positions[0]?.classes()).toContain('p1');
      expect(positions[0]?.classes()).toContain('text-[var(--yellow)]');
    });

    it('should apply position-specific color to second place', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const positions = wrapper.findAll('.position-cell');
      expect(positions[1]?.classes()).toContain('p2');
      expect(positions[1]?.classes()).toContain('text-[var(--text-muted)]');
    });

    it('should apply position-specific color to third place', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const positions = wrapper.findAll('.position-cell');
      expect(positions[2]?.classes()).toContain('p3');
      expect(positions[2]?.classes()).toContain('text-[var(--orange)]');
    });
  });

  describe('Round Points Display', () => {
    it('should display "0" for missing round data', () => {
      const teamWithMissingRound = [
        {
          ...mockTeams[0],
          rounds: [{ round_id: 1, round_number: 1, points: 50 }],
        },
      ];
      const wrapper = mount(TeamsStandingsTable, {
        props: {
          teams: teamWithMissingRound as TeamChampionshipStanding[],
          rounds: [1, 2, 3],
          teamsDropRoundEnabled: false,
        },
      });

      const roundCells = wrapper.findAll('.round-cell');
      expect(roundCells[0]?.text()).toBe('50');
      expect(roundCells[1]?.text()).toBe('0');
      expect(roundCells[2]?.text()).toBe('0');
    });

    it('should correctly map round points by round number', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: defaultProps,
      });

      const roundCells = wrapper.findAll('.round-cell');
      // Verify first team's points match their round data
      expect(roundCells[0]?.text()).toBe('50'); // Round 1
      expect(roundCells[1]?.text()).toBe('45'); // Round 2
      expect(roundCells[2]?.text()).toBe('48'); // Round 3
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty teams array', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: {
          teams: [],
          rounds: [1, 2, 3],
          teamsDropRoundEnabled: false,
        },
      });

      const rows = wrapper.findAll('tbody tr');
      expect(rows.length).toBe(0);
    });

    it('should handle teams with no rounds', () => {
      const teamsWithNoRounds = [
        {
          ...mockTeams[0],
          rounds: [],
        },
      ];
      const wrapper = mount(TeamsStandingsTable, {
        props: {
          teams: teamsWithNoRounds as TeamChampionshipStanding[],
          rounds: [1, 2],
          teamsDropRoundEnabled: false,
        },
      });

      const roundCells = wrapper.findAll('.round-cell');
      roundCells.forEach((cell) => {
        expect(cell.text()).toBe('0');
      });
    });

    it('should handle empty rounds array', () => {
      const wrapper = mount(TeamsStandingsTable, {
        props: {
          teams: mockTeams,
          rounds: [],
          teamsDropRoundEnabled: false,
        },
      });

      const headers = wrapper.findAll('thead th');
      // Should only have position, team name, and total headers
      expect(headers.filter((h) => h.text().startsWith('R')).length).toBe(0);
    });
  });
});
