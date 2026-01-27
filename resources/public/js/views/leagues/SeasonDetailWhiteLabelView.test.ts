import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import SeasonDetailWhiteLabelView from './SeasonDetailWhiteLabelView.vue';
import { leagueService } from '@public/services/leagueService';
import type { PublicSeasonDetailResponse, RoundResultsResponse } from '@public/types/public';

// Mock the leagueService
vi.mock('@public/services/leagueService', () => ({
  leagueService: {
    getSeasonDetail: vi.fn(),
    getRoundResults: vi.fn(),
  },
}));

describe('SeasonDetailWhiteLabelView', () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    // Create a router with the season-detail route
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/leagues/:leagueSlug/:competitionSlug/:seasonSlug',
          name: 'season-detail',
          component: SeasonDetailWhiteLabelView,
        },
      ],
    });

    vi.clearAllMocks();
  });

  const mockSeasonData: PublicSeasonDetailResponse = {
    league: {
      name: 'Test League',
      slug: 'test-league',
      logo_url: 'https://example.com/logo.png',
      logo: null,
      header_image_url: null,
      header_image: null,
    },
    competition: {
      name: 'Test Competition',
      slug: 'test-competition',
    },
    season: {
      id: 1,
      name: '2024 Season',
      slug: '2024-season',
      car_class: 'GT3',
      description: null,
      logo_url: '',
      logo: null,
      banner_url: null,
      banner: null,
      status: 'active',
      is_active: true,
      is_completed: false,
      race_divisions_enabled: false,
      race_times_required: false,
      stats: {
        total_drivers: 10,
        active_drivers: 10,
        total_rounds: 5,
        completed_rounds: 2,
        total_races: 10,
        completed_races: 4,
      },
    },
    rounds: [
      {
        id: 1,
        round_number: 1,
        name: 'Round 1',
        slug: 'round-1',
        scheduled_at: '2024-01-15T19:00:00Z',
        circuit_name: 'Monza',
        circuit_country: 'Italy',
        track_name: 'Autodromo Nazionale',
        track_layout: 'Grand Prix',
        status: 'completed',
        status_label: 'Completed',
        races: [
          {
            id: 1,
            race_number: 1,
            name: 'Sprint Race',
            race_type: 'sprint',
            status: 'completed',
            is_qualifier: false,
            race_points: true,
          },
        ],
      },
      {
        id: 2,
        round_number: 2,
        name: 'Round 2',
        slug: 'round-2',
        scheduled_at: '2024-01-22T19:00:00Z',
        circuit_name: 'Spa',
        circuit_country: 'Belgium',
        track_name: 'Circuit de Spa-Francorchamps',
        track_layout: 'Full',
        status: 'completed',
        status_label: 'Completed',
        races: [
          {
            id: 2,
            race_number: 1,
            name: 'Qualifying',
            race_type: 'qualifying',
            status: 'completed',
            is_qualifier: true,
            race_points: false,
          },
          {
            id: 3,
            race_number: 2,
            name: 'Feature Race',
            race_type: 'feature',
            status: 'completed',
            is_qualifier: false,
            race_points: true,
          },
        ],
      },
    ],
    standings: [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Driver One',
        total_points: 50,
        drop_total: 50,
        podiums: 2,
        poles: 1,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 25,
            position: 1,
            has_pole: true,
            has_fastest_lap: false,
            total_penalties: 0,
          },
          {
            round_id: 2,
            round_number: 2,
            points: 25,
            position: 1,
            has_pole: false,
            has_fastest_lap: true,
            total_penalties: 0,
          },
        ],
        team_id: null,
        team_name: null,
        team_logo: null,
      },
      {
        position: 2,
        driver_id: 2,
        driver_name: 'Driver Two',
        total_points: 36,
        drop_total: 36,
        podiums: 1,
        poles: 0,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 18,
            position: 2,
            has_pole: false,
            has_fastest_lap: true,
            total_penalties: 0,
          },
          {
            round_id: 2,
            round_number: 2,
            points: 18,
            position: 2,
            has_pole: false,
            has_fastest_lap: false,
            total_penalties: 0,
          },
        ],
        team_id: 1,
        team_name: 'Team A',
        team_logo: 'https://example.com/team-logo.png',
      },
      {
        position: 3,
        driver_id: 3,
        driver_name: 'Driver Three',
        total_points: 30,
        drop_total: 30,
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
        team_id: null,
        team_name: null,
        team_logo: null,
      },
    ],
    has_divisions: false,
    team_championship_enabled: false,
    drop_round_enabled: false,
  };

  describe('Initial State', () => {
    it('displays loading state initially', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.find('.loading-container').exists()).toBe(true);
      expect(wrapper.find('.spinner').exists()).toBe(true);
      expect(wrapper.text()).toContain('Loading season data');
    });
  });

  describe('Data Fetching', () => {
    it('fetches season data on mount', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(leagueService.getSeasonDetail).toHaveBeenCalledWith('test-league', '2024-season');
      expect(leagueService.getSeasonDetail).toHaveBeenCalledTimes(1);
    });

    it('displays season data after successful fetch', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Test League');
      expect(wrapper.text()).toContain('Test Competition - 2024 Season');
      expect(wrapper.find('.league-logo img').attributes('src')).toBe(
        'https://example.com/logo.png',
      );
    });

    it('displays error state on fetch failure', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockRejectedValue(new Error('Network error'));

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.find('.error-container').exists()).toBe(true);
      expect(wrapper.text()).toContain('Error Loading Season');
      expect(wrapper.text()).toContain('Failed to load season details');
    });
  });

  describe('Standings Display', () => {
    it('displays flat driver standings when no divisions', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.find('.standings-section').exists()).toBe(true);
      expect(wrapper.text()).toContain('Driver One');
      expect(wrapper.text()).toContain('Driver Two');
      expect(wrapper.text()).toContain('Driver Three');
    });

    it('displays podium highlighting for top 3 positions', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const rows = wrapper.findAll('.standings-table tbody tr');
      expect(rows[0]?.classes()).toContain('podium-1');
      expect(rows[1]?.classes()).toContain('podium-2');
      expect(rows[2]?.classes()).toContain('podium-3');
    });

    it('displays round points correctly', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('25'); // Driver One's points
      expect(wrapper.text()).toContain('50'); // Driver One's total
    });

    it('displays pole and fastest lap badges', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const badges = wrapper.findAll('.badge');
      expect(badges.some((b) => b.classes().includes('badge-pole'))).toBe(true);
      expect(badges.some((b) => b.classes().includes('badge-fl'))).toBe(true);
    });

    it('displays team logos when present', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const teamLogos = wrapper.findAll('.team-logo-img');
      expect(teamLogos.length).toBeGreaterThan(0);
      expect(teamLogos[0]?.attributes('src')).toBe('https://example.com/team-logo.png');
    });
  });

  describe('Division Tabs', () => {
    it('displays division tabs when divisions exist', async () => {
      const divisionsData: PublicSeasonDetailResponse = {
        ...mockSeasonData,
        has_divisions: true,
        standings: [
          {
            division_id: 1,
            division_name: 'Division A',
            order: 1,
            drivers: [
              {
                position: 1,
                driver_id: 1,
                driver_name: 'Driver One',
                total_points: 50,
                drop_total: 50,
                podiums: 2,
                poles: 1,
                rounds: [],
                team_id: null,
                team_name: null,
                team_logo: null,
              },
            ],
          },
          {
            division_id: 2,
            division_name: 'Division B',
            order: 2,
            drivers: [
              {
                position: 1,
                driver_id: 2,
                driver_name: 'Driver Two',
                total_points: 40,
                drop_total: 40,
                podiums: 1,
                poles: 0,
                rounds: [],
                team_id: null,
                team_name: null,
                team_logo: null,
              },
            ],
          },
        ],
      };

      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(divisionsData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.find('.tabs-container').exists()).toBe(true);
      expect(wrapper.text()).toContain('Division A');
      expect(wrapper.text()).toContain('Division B');
    });

    it('switches between division tabs on click', async () => {
      const divisionsData: PublicSeasonDetailResponse = {
        ...mockSeasonData,
        has_divisions: true,
        standings: [
          {
            division_id: 1,
            division_name: 'Division A',
            order: 1,
            drivers: [
              {
                position: 1,
                driver_id: 1,
                driver_name: 'Driver One',
                total_points: 50,
                drop_total: 50,
                podiums: 2,
                poles: 1,
                rounds: [],
                team_id: null,
                team_name: null,
                team_logo: null,
              },
            ],
          },
          {
            division_id: 2,
            division_name: 'Division B',
            order: 2,
            drivers: [
              {
                position: 1,
                driver_id: 2,
                driver_name: 'Driver Two',
                total_points: 40,
                drop_total: 40,
                podiums: 1,
                poles: 0,
                rounds: [],
                team_id: null,
                team_name: null,
                team_logo: null,
              },
            ],
          },
        ],
      };

      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(divisionsData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabs = wrapper.findAll('.tab');
      expect(tabs[0]?.classes()).toContain('active');

      await tabs[1]?.trigger('click');
      await flushPromises();

      expect(tabs[1]?.classes()).toContain('active');
    });
  });

  describe('Team Championship', () => {
    it('displays team championship tab when enabled', async () => {
      const teamsData: PublicSeasonDetailResponse = {
        ...mockSeasonData,
        team_championship_enabled: true,
        team_championship_results: [
          {
            team_id: 1,
            team_name: 'Team A',
            team_logo: 'https://example.com/team-a.png',
            total_points: 100,
            drop_total: 100,
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
        ],
      };

      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(teamsData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Team Championship');
      expect(wrapper.text()).toContain('Drivers');
    });
  });

  describe('Rounds Section', () => {
    it('displays rounds with accordion toggle', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.find('.rounds-section').exists()).toBe(true);
      expect(wrapper.text()).toContain('Round 1');
      expect(wrapper.text()).toContain('Monza');
      expect(wrapper.text()).toContain('Round 2');
      expect(wrapper.text()).toContain('Spa');
    });

    it('toggles round accordion on click', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const roundHeader = wrapper.find('.round-header');
      expect(roundHeader.exists()).toBe(true);

      // Check that round content exists
      const roundContent = wrapper.find('.round-content');
      expect(roundContent.exists()).toBe(true);

      // Click to open
      await roundHeader.trigger('click');
      await flushPromises();

      // Check chevron has expanded class
      const chevron = wrapper.find('.chevron');
      expect(chevron.classes()).toContain('expanded');

      // Click to close
      await roundHeader.trigger('click');
      await flushPromises();

      // Check chevron no longer has expanded class
      expect(chevron.classes()).not.toContain('expanded');
    });

    it('displays race events within rounds', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);
      // Mock round results
      vi.mocked(leagueService.getRoundResults).mockResolvedValue({
        round: {
          id: 1,
          round_number: 1,
          name: 'Round 1',
          status: 'completed',
          round_results: null,
          qualifying_results: null,
          race_time_results: null,
          fastest_lap_results: null,
        },
        divisions: [],
        race_events: [
          {
            id: 1,
            race_number: 1,
            name: 'Sprint Race',
            is_qualifier: false,
            race_points: true,
            status: 'completed',
            results: [],
          },
        ],
      });

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Open first round
      await wrapper.find('.round-header').trigger('click');
      await flushPromises();

      expect(wrapper.text()).toContain('Sprint Race');
    });

    it('displays qualifier badge for qualifying races', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);
      // Mock round results for round 2
      vi.mocked(leagueService.getRoundResults).mockResolvedValue({
        round: {
          id: 2,
          round_number: 2,
          name: 'Round 2',
          status: 'completed',
          round_results: null,
          qualifying_results: null,
          race_time_results: null,
          fastest_lap_results: null,
        },
        divisions: [],
        race_events: [
          {
            id: 2,
            race_number: 1,
            name: 'Qualifying',
            is_qualifier: true,
            race_points: false,
            status: 'completed',
            results: [],
          },
          {
            id: 3,
            race_number: 2,
            name: 'Feature Race',
            is_qualifier: false,
            race_points: true,
            status: 'completed',
            results: [],
          },
        ],
      });

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Open second round (has qualifying)
      const roundHeaders = wrapper.findAll('.round-header');
      await roundHeaders[1]?.trigger('click');
      await flushPromises();

      expect(wrapper.find('.race-type-badge.qualifier').exists()).toBe(true);
      expect(wrapper.text()).toContain('Qualifying');
    });
  });

  describe('Empty States', () => {
    it('displays header when season has no data', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue({
        ...mockSeasonData,
        standings: [],
        rounds: [],
      });

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Should still show header
      expect(wrapper.text()).toContain('Test League');
      expect(wrapper.find('.page-header').exists()).toBe(true);
    });
  });

  describe('Round Results Lazy Loading', () => {
    const mockRoundResults: RoundResultsResponse = {
      round: {
        id: 1,
        round_number: 1,
        name: 'Round 1',
        status: 'completed',
        round_results: {
          standings: [
            {
              position: 1,
              driver_id: 1,
              driver_name: 'Driver One',
              total_points: 25,
              race_points: 25,
              fastest_lap_points: 0,
              pole_position_points: 0,
              total_positions_gained: 0,
            },
            {
              position: 2,
              driver_id: 2,
              driver_name: 'Driver Two',
              total_points: 18,
              race_points: 18,
              fastest_lap_points: 0,
              pole_position_points: 0,
              total_positions_gained: -1,
            },
          ],
        },
        qualifying_results: null,
        race_time_results: null,
        fastest_lap_results: null,
      },
      divisions: [],
      race_events: [
        {
          id: 1,
          race_number: 1,
          name: 'Sprint Race',
          is_qualifier: false,
          race_points: true,
          status: 'completed',
          results: [
            {
              id: 1,
              race_id: 1,
              driver_id: 1,
              division_id: null,
              position: 1,
              original_race_time: '1:45.123',
              final_race_time: '1:45.123',
              original_race_time_difference: null,
              final_race_time_difference: null,
              fastest_lap: '1:42.456',
              penalties: null,
              has_fastest_lap: true,
              has_pole: false,
              dnf: false,
              status: 'finished',
              race_points: 25,
              positions_gained: 0,
              created_at: '2024-01-15T20:00:00Z',
              updated_at: '2024-01-15T20:00:00Z',
              driver: {
                id: 1,
                name: 'Driver One',
              },
            },
            {
              id: 2,
              race_id: 1,
              driver_id: 2,
              division_id: null,
              position: 2,
              original_race_time: '1:45.890',
              final_race_time: '1:45.890',
              original_race_time_difference: '+0.767',
              final_race_time_difference: '+0.767',
              fastest_lap: null,
              penalties: null,
              has_fastest_lap: false,
              has_pole: false,
              dnf: false,
              status: 'finished',
              race_points: 18,
              positions_gained: -1,
              created_at: '2024-01-15T20:00:00Z',
              updated_at: '2024-01-15T20:00:00Z',
              driver: {
                id: 2,
                name: 'Driver Two',
              },
            },
          ],
        },
      ],
    };

    it('does not load round results initially', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);

      await router.push('/leagues/test-league/test-competition/2024-season');
      mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // getRoundResults should not be called initially
      expect(leagueService.getRoundResults).not.toHaveBeenCalled();
    });

    it('loads round results when accordion is opened', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);
      vi.mocked(leagueService.getRoundResults).mockResolvedValue(mockRoundResults);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Open first round
      const roundHeader = wrapper.find('.round-header');
      await roundHeader.trigger('click');
      await flushPromises();

      // getRoundResults should be called with round ID
      expect(leagueService.getRoundResults).toHaveBeenCalledWith(1);
      expect(leagueService.getRoundResults).toHaveBeenCalledTimes(1);
    });

    it('displays loading state while fetching round results', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);
      vi.mocked(leagueService.getRoundResults).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Open first round
      await wrapper.find('.round-header').trigger('click');
      await flushPromises();

      // Should show loading state
      expect(wrapper.find('.round-loading').exists()).toBe(true);
      expect(wrapper.find('.spinner-small').exists()).toBe(true);
      expect(wrapper.text()).toContain('Loading results');
    });

    it('displays round standings after loading', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);
      vi.mocked(leagueService.getRoundResults).mockResolvedValue(mockRoundResults);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Open first round
      await wrapper.find('.round-header').trigger('click');
      await flushPromises();

      // Should display round standings
      expect(wrapper.find('.round-standings').exists()).toBe(true);
      expect(wrapper.find('.subsection-title').text()).toContain('Round Standings');
      expect(wrapper.text()).toContain('Driver One');
      expect(wrapper.text()).toContain('Driver Two');
    });

    it('displays race event results after loading', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);
      vi.mocked(leagueService.getRoundResults).mockResolvedValue(mockRoundResults);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Open first round
      await wrapper.find('.round-header').trigger('click');
      await flushPromises();

      // Should display race events
      expect(wrapper.find('.race-events').exists()).toBe(true);
      expect(wrapper.find('.race-event-title').text()).toContain('Sprint Race');
      expect(wrapper.find('.results-table').exists()).toBe(true);
    });

    it('displays finishing positions and times in race results', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);
      vi.mocked(leagueService.getRoundResults).mockResolvedValue(mockRoundResults);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Open first round
      await wrapper.find('.round-header').trigger('click');
      await flushPromises();

      // Check for positions and times
      expect(wrapper.text()).toContain('1:45.123'); // Winner time
      expect(wrapper.text()).toContain('+0.767'); // Time difference
    });

    it('does not reload results if already loaded', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);
      vi.mocked(leagueService.getRoundResults).mockResolvedValue(mockRoundResults);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const roundHeader = wrapper.find('.round-header');

      // Open round
      await roundHeader.trigger('click');
      await flushPromises();

      // Close round
      await roundHeader.trigger('click');
      await flushPromises();

      // Open again
      await roundHeader.trigger('click');
      await flushPromises();

      // Should only call getRoundResults once
      expect(leagueService.getRoundResults).toHaveBeenCalledTimes(1);
    });

    it('displays fastest lap badge for drivers with FL', async () => {
      vi.mocked(leagueService.getSeasonDetail).mockResolvedValue(mockSeasonData);
      vi.mocked(leagueService.getRoundResults).mockResolvedValue(mockRoundResults);

      await router.push('/leagues/test-league/test-competition/2024-season');
      const wrapper = mount(SeasonDetailWhiteLabelView, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Open first round
      await wrapper.find('.round-header').trigger('click');
      await flushPromises();

      // Check for FL badge in results
      const flBadges = wrapper.findAll('.badge-fl');
      expect(flBadges.length).toBeGreaterThan(0);
    });
  });
});
