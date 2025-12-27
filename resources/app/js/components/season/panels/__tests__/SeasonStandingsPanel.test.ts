import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import SeasonStandingsPanel from '../SeasonStandingsPanel.vue';
import * as seasonService from '@app/services/seasonService';
import type { SeasonStandingsResponse } from '@app/types/seasonStandings';

// Mock PrimeVue components
vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div class="p-message"><slot /></div>',
    props: ['severity'],
  },
}));

vi.mock('primevue/tabs', () => ({
  default: {
    name: 'Tabs',
    template: '<div class="p-tabs"><slot /></div>',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
}));

vi.mock('primevue/tablist', () => ({
  default: {
    name: 'TabList',
    template: '<div class="p-tablist"><slot /></div>',
  },
}));

vi.mock('primevue/tab', () => ({
  default: {
    name: 'Tab',
    template: '<div class="p-tab"><slot /></div>',
    props: ['value'],
  },
}));

vi.mock('primevue/tabpanels', () => ({
  default: {
    name: 'TabPanels',
    template: '<div class="p-tabpanels"><slot /></div>',
  },
}));

vi.mock('primevue/tabpanel', () => ({
  default: {
    name: 'TabPanel',
    template: '<div class="p-tabpanel"><slot /></div>',
    props: ['value'],
  },
}));

vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<table class="p-datatable"><slot /></table>',
    props: ['value', 'rowClass', 'stripedRows', 'class'],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<td><slot /></td>',
    props: ['field', 'header', 'class', 'body', 'bodyClass'],
  },
}));

// Mock BasePanel
vi.mock('@app/components/common/panels/BasePanel.vue', () => ({
  default: {
    name: 'BasePanel',
    template: `
      <div class="base-panel">
        <div class="base-panel-header"><slot name="header" /></div>
        <div class="base-panel-content"><slot /></div>
      </div>
    `,
  },
}));

// Mock Phosphor Icons
vi.mock('@phosphor-icons/vue', () => ({
  PhTrophy: {
    name: 'PhTrophy',
    template: '<i class="ph-trophy" />',
    props: ['size', 'weight'],
  },
  PhCheck: {
    name: 'PhCheck',
    template: '<i class="ph-check" />',
    props: ['size', 'weight'],
  },
}));

describe('SeasonStandingsPanel', () => {
  let wrapper: VueWrapper;
  let getSeasonStandingsSpy: ReturnType<typeof vi.spyOn>;

  const mockFlatStandings: SeasonStandingsResponse = {
    standings: [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Lewis Hamilton',
        total_points: 150,
        drop_total: 150,
        podiums: 2,
        rounds: [
          { round_id: 1, round_number: 1, points: 75, has_pole: true, has_fastest_lap: false },
          { round_id: 2, round_number: 2, points: 75, has_pole: false, has_fastest_lap: true },
        ],
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Max Verstappen',
        total_points: 140,
        drop_total: 140,
        podiums: 2,
        rounds: [
          { round_id: 1, round_number: 1, points: 70, has_pole: false, has_fastest_lap: true },
          { round_id: 2, round_number: 2, points: 70, has_pole: true, has_fastest_lap: false },
        ],
      },
      {
        position: 3,
        driver_id: 3,
        driver_name: 'Charles Leclerc',
        total_points: 130,
        drop_total: 130,
        podiums: 1,
        rounds: [
          { round_id: 1, round_number: 1, points: 65, has_pole: false, has_fastest_lap: false },
          { round_id: 2, round_number: 2, points: 65, has_pole: false, has_fastest_lap: false },
        ],
      },
    ],
    has_divisions: false,
    drop_round_enabled: false,
    total_drop_rounds: 0,
    team_championship_enabled: false,
    team_championship_results: [],
    teams_drop_rounds_enabled: false,
    teams_total_drop_rounds: 0,
  };

  const mockDivisionStandings: SeasonStandingsResponse = {
    standings: [
      {
        division_id: 1,
        division_name: 'Pro Division',
        order: 1,
        drivers: [
          {
            position: 1,
            driver_id: 1,
            driver_name: 'Lewis Hamilton',
            total_points: 150,
            drop_total: 150,
            podiums: 2,
            rounds: [
              { round_id: 1, round_number: 1, points: 75, has_pole: true, has_fastest_lap: false },
              { round_id: 2, round_number: 2, points: 75, has_pole: false, has_fastest_lap: true },
            ],
          },
          {
            position: 2,
            driver_id: 2,
            driver_name: 'Max Verstappen',
            total_points: 140,
            drop_total: 140,
            podiums: 2,
            rounds: [
              { round_id: 1, round_number: 1, points: 70, has_pole: false, has_fastest_lap: true },
              { round_id: 2, round_number: 2, points: 70, has_pole: true, has_fastest_lap: false },
            ],
          },
        ],
      },
      {
        division_id: 2,
        division_name: 'Am Division',
        order: 2,
        drivers: [
          {
            position: 1,
            driver_id: 3,
            driver_name: 'George Russell',
            total_points: 120,
            drop_total: 120,
            podiums: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 60, has_pole: true, has_fastest_lap: true },
              { round_id: 2, round_number: 2, points: 60, has_pole: false, has_fastest_lap: false },
            ],
          },
        ],
      },
    ],
    has_divisions: true,
    drop_round_enabled: false,
    total_drop_rounds: 0,
    team_championship_enabled: false,
    team_championship_results: [],
    teams_drop_rounds_enabled: false,
    teams_total_drop_rounds: 0,
  };

  beforeEach(() => {
    getSeasonStandingsSpy = vi.spyOn(seasonService, 'getSeasonStandings');
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching data', async () => {
      getSeasonStandingsSpy.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();

      expect(wrapper.find('.pi-spinner').exists()).toBe(true);
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      getSeasonStandingsSpy.mockRejectedValue(new Error('API Error'));

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick(); // Wait for promise rejection

      expect(wrapper.find('.p-message').exists()).toBe(true);
      expect(wrapper.text()).toContain('Failed to load season standings');
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no standings available', async () => {
      getSeasonStandingsSpy.mockResolvedValue({
        standings: [],
        has_divisions: false,
      });

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      expect(wrapper.text()).toContain('No standings data available yet');
    });
  });

  describe('Flat Standings (No Divisions)', () => {
    beforeEach(async () => {
      getSeasonStandingsSpy.mockResolvedValue(mockFlatStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();
    });

    it('should render flat standings without tabs', () => {
      expect(wrapper.find('.p-tabs').exists()).toBe(false);
      // Component renders the table but our mock doesn't show content
      const vm = wrapper.vm as any;
      expect(vm.standingsData).toBeTruthy();
      expect(vm.standingsData.has_divisions).toBe(false);
    });

    it('should have all drivers in component data', () => {
      const vm = wrapper.vm as any;
      expect(vm.flatDriverStandings).toHaveLength(3);
      expect(vm.flatDriverStandings[0].driver_name).toBe('Lewis Hamilton');
      expect(vm.flatDriverStandings[1].driver_name).toBe('Max Verstappen');
      expect(vm.flatDriverStandings[2].driver_name).toBe('Charles Leclerc');
    });

    it('should fetch standings on mount', () => {
      expect(getSeasonStandingsSpy).toHaveBeenCalledWith(1);
      expect(getSeasonStandingsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Division Standings', () => {
    beforeEach(async () => {
      getSeasonStandingsSpy.mockResolvedValue(mockDivisionStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 2,
        },
      });

      await nextTick();
      await nextTick();
    });

    it('should render tabs for divisions', () => {
      expect(wrapper.find('.p-tabs').exists()).toBe(true);
      expect(wrapper.find('.p-tablist').exists()).toBe(true);
    });

    it('should display all division names in tabs', () => {
      const text = wrapper.text();
      expect(text).toContain('Pro Division');
      expect(text).toContain('Am Division');
    });

    it('should have drivers in component data', () => {
      const vm = wrapper.vm as any;
      expect(vm.divisionsWithStandings).toHaveLength(2);
      // Divisions are sorted by order field, so "Pro Division" (order: 1) comes before "Am Division" (order: 2)
      expect(vm.divisionsWithStandings[0].division_name).toBe('Pro Division');
      expect(vm.divisionsWithStandings[0].drivers[0].driver_name).toBe('Lewis Hamilton');
      expect(vm.divisionsWithStandings[0].drivers[1].driver_name).toBe('Max Verstappen');
      expect(vm.divisionsWithStandings[1].division_name).toBe('Am Division');
      expect(vm.divisionsWithStandings[1].drivers[0].driver_name).toBe('George Russell');
    });

    it('should set initial active division tab', () => {
      // Component should set the first division (sorted by order) as active
      // "Pro Division" (order: 1, id: 1) comes before "Am Division" (order: 2, id: 2)
      const vm = wrapper.vm as any;
      expect(vm.activeTabId).toBe('division-1'); // First division by order is "Pro Division" with id=1
    });
  });

  describe('Panel Header', () => {
    beforeEach(async () => {
      getSeasonStandingsSpy.mockResolvedValue(mockFlatStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();
    });

    it('should render trophy icon in header', () => {
      expect(wrapper.find('.ph-trophy').exists()).toBe(true);
    });

    it('should render header title', () => {
      expect(wrapper.text()).toContain('Season Standings');
    });
  });

  describe('Data Structure', () => {
    it('should correctly identify division standings', async () => {
      getSeasonStandingsSpy.mockResolvedValue(mockDivisionStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 2,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.divisionsWithStandings).toHaveLength(2);
      expect(vm.flatDriverStandings).toHaveLength(0);
    });

    it('should correctly identify flat standings', async () => {
      getSeasonStandingsSpy.mockResolvedValue(mockFlatStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.divisionsWithStandings).toHaveLength(0);
      expect(vm.flatDriverStandings).toHaveLength(3);
    });

    it('should extract round numbers correctly from flat standings', async () => {
      getSeasonStandingsSpy.mockResolvedValue(mockFlatStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      const roundNumbers = vm.getRoundNumbers(vm.flatDriverStandings);
      expect(roundNumbers).toEqual([1, 2]);
    });

    it('should extract round numbers correctly from division standings', async () => {
      getSeasonStandingsSpy.mockResolvedValue(mockDivisionStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 2,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      const roundNumbers = vm.getRoundNumbers(vm.divisionsWithStandings[0].drivers);
      expect(roundNumbers).toEqual([1, 2]);
    });
  });

  describe('Props', () => {
    it('should accept seasonId prop', () => {
      getSeasonStandingsSpy.mockResolvedValue(mockFlatStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 42,
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.$props.seasonId).toBe(42);
    });

    it('should call API with correct seasonId', async () => {
      getSeasonStandingsSpy.mockResolvedValue(mockFlatStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 99,
        },
      });

      await nextTick();

      expect(getSeasonStandingsSpy).toHaveBeenCalledWith(99);
    });
  });

  describe('Tied Positions', () => {
    it('should display tied positions correctly (standard competition ranking)', async () => {
      const mockStandingsWithTies: SeasonStandingsResponse = {
        standings: [
          {
            position: 1,
            driver_id: 1,
            driver_name: 'Lewis Hamilton',
            total_points: 30,
            drop_total: 30,
            podiums: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 30, has_pole: true, has_fastest_lap: false },
            ],
          },
          {
            position: 2,
            driver_id: 2,
            driver_name: 'Max Verstappen',
            total_points: 28,
            drop_total: 28,
            podiums: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 28, has_pole: false, has_fastest_lap: true },
            ],
          },
          {
            position: 3,
            driver_id: 3,
            driver_name: 'George Russell',
            total_points: 26,
            drop_total: 26,
            podiums: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 26, has_pole: false, has_fastest_lap: false },
            ],
          },
          // Two drivers tied for 5th position (skipping 4th)
          {
            position: 5,
            driver_id: 4,
            driver_name: 'Charles Leclerc',
            total_points: 26,
            drop_total: 26,
            podiums: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 26, has_pole: false, has_fastest_lap: false },
            ],
          },
          {
            position: 5,
            driver_id: 5,
            driver_name: 'Lando Norris',
            total_points: 26,
            drop_total: 26,
            podiums: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 26, has_pole: false, has_fastest_lap: false },
            ],
          },
          // Next driver should be 7th (skipping 6th)
          {
            position: 7,
            driver_id: 6,
            driver_name: 'Carlos Sainz',
            total_points: 23,
            drop_total: 23,
            podiums: 0,
            rounds: [
              { round_id: 1, round_number: 1, points: 23, has_pole: false, has_fastest_lap: false },
            ],
          },
        ],
        has_divisions: false,
        drop_round_enabled: false,
        total_drop_rounds: 0,
        team_championship_enabled: false,
        team_championship_results: [],
        teams_drop_rounds_enabled: false,
        teams_total_drop_rounds: 0,
      };

      getSeasonStandingsSpy.mockResolvedValue(mockStandingsWithTies);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      const drivers = vm.flatDriverStandings;

      // Verify positions are preserved from backend (standard competition ranking)
      expect(drivers[0].position).toBe(1);
      expect(drivers[1].position).toBe(2);
      expect(drivers[2].position).toBe(3);
      expect(drivers[3].position).toBe(5); // Tied for 5th
      expect(drivers[4].position).toBe(5); // Tied for 5th
      expect(drivers[5].position).toBe(7); // Next position after tie

      // Verify the component doesn't modify positions
      expect(drivers[3].driver_name).toBe('Charles Leclerc');
      expect(drivers[4].driver_name).toBe('Lando Norris');
      expect(drivers[3].total_points).toBe(26);
      expect(drivers[4].total_points).toBe(26);
    });

    it('should display tied team positions correctly', async () => {
      const mockStandingsWithTiedTeams: SeasonStandingsResponse = {
        standings: [],
        has_divisions: false,
        drop_round_enabled: false,
        total_drop_rounds: 0,
        team_championship_enabled: true,
        team_championship_results: [
          {
            team_id: 1,
            team_name: 'Mercedes',
            total_points: 300,
            position: 1,
            rounds: [{ round_id: 1, round_number: 1, points: 300 }],
          },
          // Two teams tied for 2nd
          {
            team_id: 2,
            team_name: 'Red Bull Racing',
            total_points: 250,
            position: 2,
            rounds: [{ round_id: 1, round_number: 1, points: 250 }],
          },
          {
            team_id: 3,
            team_name: 'Ferrari',
            total_points: 250,
            position: 2,
            rounds: [{ round_id: 1, round_number: 1, points: 250 }],
          },
          // Next team should be 4th (skipping 3rd)
          {
            team_id: 4,
            team_name: 'McLaren',
            total_points: 200,
            position: 4,
            rounds: [{ round_id: 1, round_number: 1, points: 200 }],
          },
        ],
        teams_drop_rounds_enabled: false,
        teams_total_drop_rounds: 0,
      };

      getSeasonStandingsSpy.mockResolvedValue(mockStandingsWithTiedTeams);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      const teams = vm.teamChampionshipResults;

      // Verify tied positions are preserved correctly
      expect(teams[0].position).toBe(1);
      expect(teams[1].position).toBe(2); // Tied for 2nd
      expect(teams[2].position).toBe(2); // Tied for 2nd
      expect(teams[3].position).toBe(4); // Next position after tie

      // Verify sorting maintains correct order
      expect(teams[0].team_name).toBe('Mercedes');
      expect(teams[1].team_name).toBe('Red Bull Racing');
      expect(teams[2].team_name).toBe('Ferrari');
      expect(teams[3].team_name).toBe('McLaren');
    });

    it('should display tied positions in divisions correctly', async () => {
      const mockDivisionStandingsWithTies: SeasonStandingsResponse = {
        standings: [
          {
            division_id: 1,
            division_name: 'Pro Division',
            order: 1,
            drivers: [
              {
                position: 1,
                driver_id: 1,
                driver_name: 'Lewis Hamilton',
                total_points: 150,
                drop_total: 150,
                podiums: 2,
                rounds: [
                  {
                    round_id: 1,
                    round_number: 1,
                    points: 150,
                    has_pole: true,
                    has_fastest_lap: false,
                  },
                ],
              },
              // Two drivers tied for 2nd
              {
                position: 2,
                driver_id: 2,
                driver_name: 'Max Verstappen',
                total_points: 140,
                drop_total: 140,
                podiums: 2,
                rounds: [
                  {
                    round_id: 1,
                    round_number: 1,
                    points: 140,
                    has_pole: false,
                    has_fastest_lap: true,
                  },
                ],
              },
              {
                position: 2,
                driver_id: 3,
                driver_name: 'Charles Leclerc',
                total_points: 140,
                drop_total: 140,
                podiums: 2,
                rounds: [
                  {
                    round_id: 1,
                    round_number: 1,
                    points: 140,
                    has_pole: false,
                    has_fastest_lap: false,
                  },
                ],
              },
              // Next driver should be 4th
              {
                position: 4,
                driver_id: 4,
                driver_name: 'George Russell',
                total_points: 130,
                drop_total: 130,
                podiums: 1,
                rounds: [
                  {
                    round_id: 1,
                    round_number: 1,
                    points: 130,
                    has_pole: false,
                    has_fastest_lap: false,
                  },
                ],
              },
            ],
          },
        ],
        has_divisions: true,
        drop_round_enabled: false,
        total_drop_rounds: 0,
        team_championship_enabled: false,
        team_championship_results: [],
        teams_drop_rounds_enabled: false,
        teams_total_drop_rounds: 0,
      };

      getSeasonStandingsSpy.mockResolvedValue(mockDivisionStandingsWithTies);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 2,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      const drivers = vm.divisionsWithStandings[0].drivers;

      // Verify tied positions are preserved in division standings
      expect(drivers[0].position).toBe(1);
      expect(drivers[1].position).toBe(2); // Tied for 2nd
      expect(drivers[2].position).toBe(2); // Tied for 2nd
      expect(drivers[3].position).toBe(4); // Next position after tie
    });
  });

  describe('Teams Championship', () => {
    it('should not display teams tab when disabled', async () => {
      getSeasonStandingsSpy.mockResolvedValue(mockFlatStandings);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      expect(wrapper.text()).not.toContain('Team Championship');
      const vm = wrapper.vm as any;
      expect(vm.showTeamsChampionship).toBe(false);
    });

    it('should display teams tab when enabled with results', async () => {
      const mockStandingsWithTeams: SeasonStandingsResponse = {
        ...mockFlatStandings,
        team_championship_enabled: true,
        team_championship_results: [
          {
            team_id: 1,
            team_name: 'Mercedes',
            total_points: 290,
            position: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 145 },
              { round_id: 2, round_number: 2, points: 145 },
            ],
          },
          {
            team_id: 2,
            team_name: 'Red Bull Racing',
            total_points: 280,
            position: 2,
            rounds: [
              { round_id: 1, round_number: 1, points: 140 },
              { round_id: 2, round_number: 2, points: 140 },
            ],
          },
          {
            team_id: 3,
            team_name: 'Ferrari',
            total_points: 260,
            position: 3,
            rounds: [
              { round_id: 1, round_number: 1, points: 130 },
              { round_id: 2, round_number: 2, points: 130 },
            ],
          },
        ],
        teams_drop_rounds_enabled: false,
        teams_total_drop_rounds: 0,
      };

      getSeasonStandingsSpy.mockResolvedValue(mockStandingsWithTeams);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      expect(wrapper.text()).toContain('Team Championship');
      const vm = wrapper.vm as any;
      expect(vm.showTeamsChampionship).toBe(true);
      expect(vm.teamChampionshipResults).toHaveLength(3);
    });

    it('should sort teams by position', async () => {
      const mockStandingsWithTeams: SeasonStandingsResponse = {
        ...mockFlatStandings,
        team_championship_enabled: true,
        team_championship_results: [
          {
            team_id: 2,
            team_name: 'Red Bull Racing',
            total_points: 280,
            position: 2,
            rounds: [
              { round_id: 1, round_number: 1, points: 140 },
              { round_id: 2, round_number: 2, points: 140 },
            ],
          },
          {
            team_id: 1,
            team_name: 'Mercedes',
            total_points: 290,
            position: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 145 },
              { round_id: 2, round_number: 2, points: 145 },
            ],
          },
          {
            team_id: 3,
            team_name: 'Ferrari',
            total_points: 260,
            position: 3,
            rounds: [
              { round_id: 1, round_number: 1, points: 130 },
              { round_id: 2, round_number: 2, points: 130 },
            ],
          },
        ],
        teams_drop_rounds_enabled: false,
        teams_total_drop_rounds: 0,
      };

      getSeasonStandingsSpy.mockResolvedValue(mockStandingsWithTeams);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.teamChampionshipResults[0].team_name).toBe('Mercedes');
      expect(vm.teamChampionshipResults[1].team_name).toBe('Red Bull Racing');
      expect(vm.teamChampionshipResults[2].team_name).toBe('Ferrari');
    });

    it('should render tabs when teams championship enabled (no divisions)', async () => {
      const mockStandingsWithTeams: SeasonStandingsResponse = {
        ...mockFlatStandings,
        team_championship_enabled: true,
        team_championship_results: [
          {
            team_id: 1,
            team_name: 'Mercedes',
            total_points: 290,
            position: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 145 },
              { round_id: 2, round_number: 2, points: 145 },
            ],
          },
        ],
        teams_drop_rounds_enabled: false,
        teams_total_drop_rounds: 0,
      };

      getSeasonStandingsSpy.mockResolvedValue(mockStandingsWithTeams);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      // Should have tabs when teams championship enabled, even without divisions
      expect(wrapper.find('.p-tabs').exists()).toBe(true);
      expect(wrapper.text()).toContain('Drivers');
      expect(wrapper.text()).toContain('Team Championship');

      const vm = wrapper.vm as any;
      expect(vm.activeTabId).toBe('drivers');
    });

    it('should extract team round numbers correctly', async () => {
      const mockStandingsWithTeams: SeasonStandingsResponse = {
        ...mockFlatStandings,
        team_championship_enabled: true,
        team_championship_results: [
          {
            team_id: 1,
            team_name: 'Mercedes',
            total_points: 290,
            position: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 145 },
              { round_id: 2, round_number: 2, points: 145 },
            ],
          },
        ],
        teams_drop_rounds_enabled: false,
        teams_total_drop_rounds: 0,
      };

      getSeasonStandingsSpy.mockResolvedValue(mockStandingsWithTeams);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      const roundNumbers = vm.getTeamRoundNumbers(vm.teamChampionshipResults);
      expect(roundNumbers).toEqual([1, 2]);
    });

    it('should display teams drop rounds when enabled', async () => {
      const mockStandingsWithTeamsDropRounds: SeasonStandingsResponse = {
        ...mockFlatStandings,
        team_championship_enabled: true,
        teams_drop_rounds_enabled: true,
        teams_total_drop_rounds: 1,
        team_championship_results: [
          {
            team_id: 1,
            team_name: 'Mercedes',
            total_points: 290,
            drop_total: 260,
            position: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 145 },
              { round_id: 2, round_number: 2, points: 145 },
              { round_id: 3, round_number: 3, points: 30 },
            ],
          },
          {
            team_id: 2,
            team_name: 'Red Bull Racing',
            total_points: 280,
            drop_total: 250,
            position: 2,
            rounds: [
              { round_id: 1, round_number: 1, points: 140 },
              { round_id: 2, round_number: 2, points: 140 },
              { round_id: 3, round_number: 3, points: 30 },
            ],
          },
        ],
      };

      getSeasonStandingsSpy.mockResolvedValue(mockStandingsWithTeamsDropRounds);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.teamsDropRoundEnabled).toBe(true);
      expect(vm.teamChampionshipResults[0].drop_total).toBe(260);
      expect(vm.teamChampionshipResults[1].drop_total).toBe(250);
    });

    it('should not display teams drop rounds when disabled', async () => {
      const mockStandingsWithTeams: SeasonStandingsResponse = {
        ...mockFlatStandings,
        team_championship_enabled: true,
        teams_drop_rounds_enabled: false,
        teams_total_drop_rounds: 0,
        team_championship_results: [
          {
            team_id: 1,
            team_name: 'Mercedes',
            total_points: 290,
            position: 1,
            rounds: [
              { round_id: 1, round_number: 1, points: 145 },
              { round_id: 2, round_number: 2, points: 145 },
            ],
          },
        ],
      };

      getSeasonStandingsSpy.mockResolvedValue(mockStandingsWithTeams);

      wrapper = mount(SeasonStandingsPanel, {
        props: {
          seasonId: 1,
        },
      });

      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.teamsDropRoundEnabled).toBe(false);
    });
  });
});
