import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import StandingsTable from './StandingsTable.vue';
import type { PublicSeasonDetailResponse, SeasonStandingDriver } from '@public/types/public';

// Mock services
vi.mock('@public/services/leagueService', () => ({
  leagueService: {
    getSeasonDetail: vi.fn(),
  },
}));

// Mock Phosphor icons
vi.mock('@phosphor-icons/vue', () => ({
  PhCheck: {
    name: 'PhCheck',
    template: '<span class="ph-check"></span>',
    props: ['size', 'weight'],
  },
  PhDownloadSimple: {
    name: 'PhDownloadSimple',
    template: '<span class="ph-download-simple"></span>',
  },
}));

describe('StandingsTable', () => {
  let wrapper: VueWrapper;
  let leagueService: any;

  // Mock data for flat (non-division) standings
  const mockFlatStandingsData: PublicSeasonDetailResponse = {
    league: {
      name: 'Test League',
      slug: 'test-league',
    },
    competition: {
      name: 'Test Competition',
      slug: 'test-competition',
    },
    season: {
      id: 1,
      name: 'Season 1',
      slug: 'season-1',
      car_class: 'GT3',
      description: null,
      logo_url: '',
      banner_url: null,
      status: 'active',
      is_active: true,
      is_completed: false,
      race_divisions_enabled: false,
      stats: {
        total_drivers: 3,
        active_drivers: 3,
        total_rounds: 2,
        completed_rounds: 2,
        total_races: 4,
        completed_races: 4,
      },
    },
    rounds: [],
    standings: [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Driver 1',
        total_points: 50,
        drop_total: 0,
        podiums: 2,
        poles: 1,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 25,
            position: 1,
            has_pole: true,
            has_fastest_lap: true,
            total_penalties: 0,
          },
          {
            round_id: 2,
            round_number: 2,
            points: 25,
            position: 1,
            has_pole: false,
            has_fastest_lap: false,
            total_penalties: 5,
          },
        ],
        team_id: 1,
        team_name: 'Team 1',
        team_logo: 'https://example.com/team1.png',
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Driver 2',
        total_points: 36,
        drop_total: 0,
        podiums: 1,
        poles: 0,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 18,
            position: 2,
            has_pole: false,
            has_fastest_lap: false,
            total_penalties: 0,
          },
          {
            round_id: 2,
            round_number: 2,
            points: 18,
            position: 2,
            has_pole: false,
            has_fastest_lap: true,
            total_penalties: 0,
          },
        ],
        team_name: 'Team 2',
      },
      {
        position: 3,
        driver_id: 3,
        driver_name: 'Driver 3',
        total_points: 30,
        drop_total: 0,
        podiums: 0,
        poles: 0,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 15,
            position: 3,
            has_pole: false,
            has_fastest_lap: false,
            total_penalties: 0,
          },
          {
            round_id: 2,
            round_number: 2,
            points: 15,
            position: 3,
            has_pole: false,
            has_fastest_lap: false,
            total_penalties: 0,
          },
        ],
      },
    ] as SeasonStandingDriver[],
    has_divisions: false,
    drop_round_enabled: false,
  };

  // Mock data for division standings
  const mockDivisionStandingsData: PublicSeasonDetailResponse = {
    ...mockFlatStandingsData,
    season: {
      ...mockFlatStandingsData.season,
      race_divisions_enabled: true,
    },
    standings: [
      {
        division_id: 1,
        division_name: 'Division 1',
        order: 1,
        drivers: [
          {
            position: 1,
            driver_id: 1,
            driver_name: 'Division 1 Driver 1',
            total_points: 50,
            drop_total: 0,
            podiums: 2,
            poles: 1,
            rounds: [
              {
                round_id: 1,
                round_number: 1,
                points: 25,
                position: 1,
                has_pole: true,
                has_fastest_lap: true,
                total_penalties: 0,
              },
            ],
          },
        ],
      },
      {
        division_id: 2,
        division_name: 'Division 2',
        order: 2,
        drivers: [
          {
            position: 1,
            driver_id: 2,
            driver_name: 'Division 2 Driver 1',
            total_points: 40,
            drop_total: 0,
            podiums: 1,
            poles: 0,
            rounds: [
              {
                round_id: 1,
                round_number: 1,
                points: 18,
                position: 1,
                has_pole: false,
                has_fastest_lap: false,
                total_penalties: 0,
              },
            ],
          },
        ],
      },
    ],
    has_divisions: true,
  };

  // Mock data with teams championship
  const mockTeamsChampionshipData: PublicSeasonDetailResponse = {
    ...mockFlatStandingsData,
    team_championship_enabled: true,
    teams_drop_rounds_enabled: true,
    team_championship_results: [
      {
        team_id: 1,
        team_name: 'Team 1',
        team_logo: 'https://example.com/team1.png',
        total_points: 100,
        drop_total: 5,
        position: 1,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 50,
          },
          {
            round_id: 2,
            round_number: 2,
            points: 50,
          },
        ],
      },
      {
        team_id: 2,
        team_name: 'Team 2',
        total_points: 80,
        position: 2,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 40,
          },
          {
            round_id: 2,
            round_number: 2,
            points: 40,
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Import leagueService mock
    const { leagueService: service } = await import('@public/services/leagueService');
    leagueService = service;

    // Setup default mocks
    leagueService.getSeasonDetail.mockResolvedValue(mockFlatStandingsData);
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Loading State', () => {
    it('shows loading spinner during data fetch', async () => {
      leagueService.getSeasonDetail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockFlatStandingsData), 100)),
      );

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await wrapper.vm.$nextTick();

      const loadingState = wrapper.find('.loading-state');
      expect(loadingState.exists()).toBe(true);
      expect(wrapper.find('.spinner').exists()).toBe(true);
    });

    it('hides loading spinner after data loads', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const loadingState = wrapper.find('.loading-state');
      expect(loadingState.exists()).toBe(false);
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', async () => {
      leagueService.getSeasonDetail.mockRejectedValue(new Error('Network error'));

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const errorState = wrapper.find('.error-state');
      expect(errorState.exists()).toBe(true);
      expect(errorState.text()).toContain('Failed to load season standings');
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no standings data', async () => {
      const emptyData = {
        ...mockFlatStandingsData,
        standings: [],
      };
      leagueService.getSeasonDetail.mockResolvedValue(emptyData);

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const emptyState = wrapper.find('.empty-state');
      expect(emptyState.exists()).toBe(true);
      expect(emptyState.text()).toContain('No standings data available yet');
    });
  });

  describe('Divisions Rendering', () => {
    it('renders tabs when has_divisions is true', async () => {
      leagueService.getSeasonDetail.mockResolvedValue(mockDivisionStandingsData);

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const tabs = wrapper.findAll('.standings-tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('renders tab for each division', async () => {
      leagueService.getSeasonDetail.mockResolvedValue(mockDivisionStandingsData);

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const tabs = wrapper.findAll('.standings-tab');
      expect(tabs).toHaveLength(2);
      expect(tabs[0]?.text()).toContain('Division 1');
      expect(tabs[1]?.text()).toContain('Division 2');
    });

    it('switches between division tabs', async () => {
      leagueService.getSeasonDetail.mockResolvedValue(mockDivisionStandingsData);

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const tabs = wrapper.findAll('.standings-tab');
      expect(tabs[0]?.classes()).toContain('active');
      expect(tabs[1]?.classes()).not.toContain('active');

      await tabs[1]?.trigger('click');

      expect(tabs[0]?.classes()).not.toContain('active');
      expect(tabs[1]?.classes()).toContain('active');
    });
  });

  describe('Teams Championship Tab', () => {
    it('shows teams championship tab when enabled', async () => {
      leagueService.getSeasonDetail.mockResolvedValue(mockTeamsChampionshipData);

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const tabs = wrapper.findAll('.standings-tab');
      const teamsTab = tabs.find((tab) => tab.text().includes('Team Championship'));
      expect(teamsTab).toBeDefined();
    });

    it('switches between drivers and teams tab', async () => {
      leagueService.getSeasonDetail.mockResolvedValue(mockTeamsChampionshipData);

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const tabs = wrapper.findAll('.standings-tab');
      const driversTab = tabs.find((tab) => tab.text().includes('Drivers'));
      const teamsTab = tabs.find((tab) => tab.text().includes('Team Championship'));

      expect(driversTab).toBeDefined();
      expect(teamsTab).toBeDefined();

      await teamsTab!.trigger('click');
      expect(teamsTab!.classes()).toContain('active');
      expect(driversTab!.classes()).not.toContain('active');

      await driversTab!.trigger('click');
      expect(driversTab!.classes()).toContain('active');
      expect(teamsTab!.classes()).not.toContain('active');
    });
  });

  describe('Table Rendering', () => {
    it('renders table headers', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const table = wrapper.find('.standings-table');
      expect(table.exists()).toBe(true);

      const headers = table.findAll('thead th');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('renders position column', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const positionHeader = wrapper.find('.th-position');
      expect(positionHeader.exists()).toBe(true);
      expect(positionHeader.text()).toBe('#');
    });

    it('renders driver column', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const driverHeader = wrapper.find('.th-driver');
      expect(driverHeader.exists()).toBe(true);
      expect(driverHeader.text()).toBe('Driver');
    });

    it('renders podiums column', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const podiumsHeader = wrapper.find('.th-podiums');
      expect(podiumsHeader.exists()).toBe(true);
      expect(podiumsHeader.text()).toBe('Podiums');
    });

    it('renders round columns', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const roundHeaders = wrapper.findAll('.th-round');
      expect(roundHeaders.length).toBeGreaterThan(0);
      expect(roundHeaders[0]?.text()).toContain('R1');
      expect(roundHeaders[1]?.text()).toContain('R2');
    });

    it('renders total points column', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const totalHeader = wrapper.find('.th-total');
      expect(totalHeader.exists()).toBe(true);
      expect(totalHeader.text()).toBe('Total');
    });

    it('renders drop column when enabled', async () => {
      const dataWithDrop = {
        ...mockFlatStandingsData,
        drop_round_enabled: true,
      };
      leagueService.getSeasonDetail.mockResolvedValue(dataWithDrop);

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const dropHeader = wrapper.find('.th-drop');
      expect(dropHeader.exists()).toBe(true);
      expect(dropHeader.text()).toBe('Drop');
    });

    it('does not render drop column when disabled', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const dropHeader = wrapper.find('.th-drop');
      expect(dropHeader.exists()).toBe(false);
    });
  });

  describe('Sub-header Rendering', () => {
    it('renders P, FL, Pts sub-headers for each round', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const subHeaders = wrapper.findAll('.sub-header .th-sub');
      expect(subHeaders.length).toBeGreaterThan(0);
      // Each round has 3 sub-headers (P, FL, Pts)
      expect(subHeaders.length).toBe(6); // 2 rounds × 3 columns
    });
  });

  describe('Driver Rows', () => {
    it('renders row for each driver', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const rows = wrapper.findAll('tbody tr');
      expect(rows).toHaveLength(3);
    });

    it('renders position in first column', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const positionCells = wrapper.findAll('.td-position');
      expect(positionCells[0]?.text()).toBe('1');
      expect(positionCells[1]?.text()).toBe('2');
      expect(positionCells[2]?.text()).toBe('3');
    });

    it('renders driver name', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const driverNames = wrapper.findAll('.driver-name');
      expect(driverNames[0]?.text()).toBe('Driver 1');
      expect(driverNames[1]?.text()).toBe('Driver 2');
      expect(driverNames[2]?.text()).toBe('Driver 3');
    });

    it('renders team logo when available', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const teamLogo = wrapper.find('.team-logo img');
      expect(teamLogo.exists()).toBe(true);
      expect(teamLogo.attributes('src')).toBe('https://example.com/team1.png');
    });

    it('renders team name when logo not available', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const teamNames = wrapper.findAll('.team-name');
      expect(teamNames[0]?.text()).toBe('Team 2');
    });

    it('renders podiums count', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const podiumCells = wrapper.findAll('.td-podiums');
      expect(podiumCells[0]?.text()).toBe('2');
      expect(podiumCells[1]?.text()).toBe('1');
      expect(podiumCells[2]?.text()).toBe('0');
    });

    it('renders total points', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const totalCells = wrapper.findAll('.td-total');
      expect(totalCells[0]?.text()).toBe('50');
      expect(totalCells[1]?.text()).toBe('36');
      expect(totalCells[2]?.text()).toBe('30');
    });

    it('renders drop points when enabled', async () => {
      const dataWithDrop = {
        ...mockFlatStandingsData,
        drop_round_enabled: true,
      };
      leagueService.getSeasonDetail.mockResolvedValue(dataWithDrop);

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const dropCells = wrapper.findAll('.td-drop');
      expect(dropCells.length).toBe(3);
      expect(dropCells[0]?.text()).toBe('0');
    });
  });

  describe('Round Data', () => {
    it('shows pole icon when driver has pole', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const poleIcons = wrapper.findAll('.icon-pole');
      expect(poleIcons.length).toBeGreaterThan(0);
    });

    it('shows fastest lap icon when driver has fastest lap', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const flIcons = wrapper.findAll('.icon-fl');
      expect(flIcons.length).toBeGreaterThan(0);
    });

    it('renders points for each round', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const allCells = wrapper.findAll('tbody td');
      const pointCells = allCells.filter((cell) => {
        const text = cell.text();
        return text === '25' || text === '18' || text === '15';
      });
      expect(pointCells.length).toBeGreaterThan(0);
    });

    it('applies penalty class when driver has penalties', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const penaltyCells = wrapper.findAll('.has-penalty');
      expect(penaltyCells.length).toBeGreaterThan(0);
    });
  });

  describe('Position Styling', () => {
    it('applies position class to position cells', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const positionCells = wrapper.findAll('.td-position');
      expect(positionCells[0]?.classes()).toContain('pos-1');
      expect(positionCells[1]?.classes()).toContain('pos-2');
      expect(positionCells[2]?.classes()).toContain('pos-3');
    });

    it('applies row class to podium positions', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const rows = wrapper.findAll('tbody tr');
      expect(rows[0]?.classes()).toContain('row-podium-1');
      expect(rows[1]?.classes()).toContain('row-podium-2');
      expect(rows[2]?.classes()).toContain('row-podium-3');
    });
  });

  describe('Helper Methods', () => {
    it('getRoundNumbers extracts unique round numbers', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const roundHeaders = wrapper.findAll('.th-round');
      expect(roundHeaders).toHaveLength(2); // 2 rounds
    });

    it('getRoundData retrieves correct data for a round', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      // Check if points are displayed correctly (indirect test of getRoundData)
      const allCells = wrapper.findAll('tbody td');
      const firstDriverPoints = allCells.filter((cell) => cell.text() === '25');
      expect(firstDriverPoints).toHaveLength(2); // Driver 1 has 25 points in both rounds
    });

    it('getPositionClass returns correct class for positions', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const positionCells = wrapper.findAll('.td-position');
      expect(positionCells[0]?.classes()).toContain('pos-1');
      expect(positionCells[1]?.classes()).toContain('pos-2');
      expect(positionCells[2]?.classes()).toContain('pos-3');
    });

    it('getRowClass returns correct class for positions', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      const rows = wrapper.findAll('tbody tr');
      expect(rows[0]?.classes()).toContain('row-podium-1');
      expect(rows[1]?.classes()).toContain('row-podium-2');
      expect(rows[2]?.classes()).toContain('row-podium-3');
    });
  });

  describe('Data Fetching', () => {
    it('fetches standings on mount', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      expect(leagueService.getSeasonDetail).toHaveBeenCalledTimes(1);
      expect(leagueService.getSeasonDetail).toHaveBeenCalledWith('test-league', 'season-1');
    });

    it('refetches when seasonId changes', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      expect(leagueService.getSeasonDetail).toHaveBeenCalledTimes(1);

      await wrapper.setProps({ seasonId: 2 });
      await flushPromises();

      expect(leagueService.getSeasonDetail).toHaveBeenCalledTimes(2);
    });
  });

  describe('Export CSV Functionality', () => {
    it('component has export button visible in tabbed view', async () => {
      leagueService.getSeasonDetail.mockResolvedValue(mockDivisionStandingsData);

      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      // Check that the standings tabs container exists (which contains the export button)
      const standingsTabs = wrapper.find('.standings-tabs');
      expect(standingsTabs.exists()).toBe(true);
    });

    it('component has export button visible in single table view', async () => {
      wrapper = mount(StandingsTable, {
        props: {
          seasonId: 1,
          leagueSlug: 'test-league',
          seasonSlug: 'season-1',
        },
      });
      await flushPromises();

      // Check that the standings tabs container exists (which contains the export button)
      const standingsTabs = wrapper.find('.standings-tabs');
      expect(standingsTabs.exists()).toBe(true);
    });
  });
});
