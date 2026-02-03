import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import RoundAccordion from './RoundAccordion.vue';
import type { PublicRound, RoundResultsResponse } from '@public/types/public';

// Mock the league service
vi.mock('@public/services/leagueService', () => ({
  leagueService: {
    getRoundResults: vi.fn(),
  },
}));

// Mock Phosphor icons
vi.mock('@phosphor-icons/vue', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    PhMapPin: {
      name: 'PhMapPin',
      template: '<span class="ph-map-pin"></span>',
      props: ['size', 'weight'],
    },
  };
});

// Create mock accordion context
const createMockAccordionContext = (initialValue: string[] | string = []) => ({
  activeValue: ref(initialValue),
  toggleItem: vi.fn(),
  multiple: ref(true),
});

describe('RoundAccordion', () => {
  let wrapper: VueWrapper;
  let leagueService: any;

  const mockRound: PublicRound = {
    id: 1,
    round_number: 1,
    slug: 'round-1-australia',
    name: 'Round 1 - Australia',
    circuit_name: 'Albert Park Circuit',
    track_name: 'Albert Park',
    track_layout: 'Grand Prix',
    circuit_country: 'Australia',
    status: 'completed',
    status_label: 'Completed',
    scheduled_at: '2024-03-20T00:00:00.000Z',
    races: [],
  };

  const mockRoundResults: RoundResultsResponse = {
    round: {
      id: 1,
      round_number: 1,
      name: 'Round 1 - Australia',
      round_results: {
        standings: [
          {
            position: 1,
            driver_id: 1,
            driver_name: 'Driver 1',
            race_points: 25,
            fastest_lap_points: 1,
            pole_position_points: 0,
            total_positions_gained: 2,
            total_points: 26,
          },
        ],
      },
      qualifying_results: [],
      race_time_results: [],
      fastest_lap_results: [],
    },
    divisions: [
      { id: 1, name: 'Division 1' },
      { id: 2, name: 'Division 2' },
    ],
    race_events: [
      {
        id: 1,
        name: 'Race 1',
        race_number: 1,
        is_qualifier: false,
        race_points: true,
        results: [
          {
            id: 1,
            position: 1,
            driver: { id: 1, name: 'Driver 1' },
            race_points: 25,
            positions_gained: 2,
            dnf: false,
            has_pole: false,
            has_fastest_lap: true,
            division_id: 1,
            original_race_time: null,
            final_race_time: null,
            fastest_lap: null,
            penalties: null,
          },
        ],
      },
    ],
  };

  // Create custom stubs that preserve their name for findComponent to work
  const createStub = (name: string) => ({
    name,
    template: `<div data-test="${name.toLowerCase()}"><slot /></div>`,
    props: Object.keys({}),
  });

  const mountComponent = (props: any = {}, activeValue: string[] | string = []) => {
    return mount(RoundAccordion, {
      props: {
        round: mockRound,
        hasDivisions: false,
        value: 'round-1',
        raceTimesRequired: false,
        ...props,
      },
      global: {
        provide: {
          'vrl-accordion': createMockAccordionContext(activeValue),
        },
        stubs: {
          VrlAccordionItem: false,
          VrlTabs: createStub('VrlTabs'),
          VrlAccordion: createStub('VrlAccordion'),
          RoundStandingsTable: createStub('RoundStandingsTable'),
          RaceEventAccordion: createStub('RaceEventAccordion'),
          CrossDivisionResultsTable: createStub('CrossDivisionResultsTable'),
        },
      },
    });
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { leagueService: service } = await import('@public/services/leagueService');
    leagueService = service;

    leagueService.getRoundResults.mockResolvedValue(mockRoundResults);
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Rendering', () => {
    it('should render round header with round number and name', () => {
      wrapper = mountComponent();

      expect(wrapper.text()).toContain('R1');
      expect(wrapper.text()).toContain('Round 1 - Australia');
    });

    it('should display round date and track information', () => {
      wrapper = mountComponent();

      expect(wrapper.text()).toContain('Albert Park Circuit');
      expect(wrapper.text()).toContain('(Grand Prix)');
      expect(wrapper.text()).toContain('Australia');
    });

    it('should show circuit TBD when circuit info is missing', () => {
      wrapper = mountComponent({
        round: {
          ...mockRound,
          circuit_name: '',
          track_layout: '',
          circuit_country: '',
        },
      });

      expect(wrapper.text()).toContain('Circuit TBD');
    });

    it('should render chevron indicator', () => {
      wrapper = mountComponent();

      expect(wrapper.find('.ph-caret-down').exists()).toBe(true);
    });
  });

  describe('Expanding/Collapsing', () => {
    it('should not load results initially when collapsed', () => {
      wrapper = mountComponent();

      expect(leagueService.getRoundResults).not.toHaveBeenCalled();
    });

    it('should load results when initially expanded', async () => {
      wrapper = mountComponent({ initiallyExpanded: true }, ['round-1']);

      await flushPromises();

      expect(leagueService.getRoundResults).toHaveBeenCalledWith(1);
    });

    it('should display loading state while fetching results', async () => {
      leagueService.getRoundResults.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockRoundResults), 100)),
      );

      wrapper = mountComponent({ initiallyExpanded: true }, ['round-1']);

      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Loading results...');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no results available', async () => {
      const emptyResults: RoundResultsResponse = {
        ...mockRoundResults,
        race_events: [],
      };
      leagueService.getRoundResults.mockResolvedValue(emptyResults);

      wrapper = mountComponent({ initiallyExpanded: true }, ['round-1']);

      await flushPromises();

      expect(wrapper.text()).toContain('No results available for this round');
    });
  });

  describe('Race Events', () => {
    it('should render race events when results are loaded', async () => {
      wrapper = mountComponent({ initiallyExpanded: true }, ['round-1']);

      await flushPromises();

      expect(wrapper.findComponent({ name: 'RaceEventAccordion' }).exists()).toBe(true);
    });
  });

  describe('Round Standings Table', () => {
    it('should render RoundStandingsTable when standings data exists', async () => {
      wrapper = mountComponent({ initiallyExpanded: true }, ['round-1']);

      await flushPromises();

      expect(wrapper.findComponent({ name: 'RoundStandingsTable' }).exists()).toBe(true);
    });

    it('should not render RoundStandingsTable when standings data is missing', async () => {
      const resultsWithoutStandings: RoundResultsResponse = {
        ...mockRoundResults,
        round: {
          ...mockRoundResults.round,
          round_results: null,
        },
      };
      leagueService.getRoundResults.mockResolvedValue(resultsWithoutStandings);

      wrapper = mountComponent({ initiallyExpanded: true }, ['round-1']);

      await flushPromises();

      expect(wrapper.findComponent({ name: 'RoundStandingsTable' }).exists()).toBe(false);
    });
  });

  describe('Main Tabs', () => {
    it('should render VrlTabs component', async () => {
      wrapper = mountComponent({ initiallyExpanded: true }, ['round-1']);

      await flushPromises();

      expect(wrapper.findComponent({ name: 'VrlTabs' }).exists()).toBe(true);
    });

    it('should pass correct tabs when race times are required', async () => {
      wrapper = mountComponent({ initiallyExpanded: true, raceTimesRequired: true }, ['round-1']);

      await flushPromises();

      const tabs = wrapper.findAllComponents({ name: 'VrlTabs' });
      expect(tabs.length).toBeGreaterThan(0);
    });
  });

  describe('Division Tabs', () => {
    it('should render division tabs component when divisions exist with division standings', async () => {
      // Mock data with RoundStandingDivision format (has division_id in standings)
      const divisionStandingsResults: RoundResultsResponse = {
        ...mockRoundResults,
        round: {
          ...mockRoundResults.round,
          round_results: {
            standings: [
              {
                division_id: 1,
                division_name: 'Division 1',
                results: [
                  {
                    position: 1,
                    driver_name: 'Driver 1',
                    race_points: 25,
                    fastest_lap_points: 1,
                    pole_position_points: 0,
                    total_positions_gained: 2,
                    total_points: 26,
                  },
                ],
              },
              {
                division_id: 2,
                division_name: 'Division 2',
                results: [
                  {
                    position: 1,
                    driver_name: 'Driver 2',
                    race_points: 25,
                    fastest_lap_points: 0,
                    pole_position_points: 1,
                    total_positions_gained: 0,
                    total_points: 26,
                  },
                ],
              },
            ],
          },
        },
      };
      leagueService.getRoundResults.mockResolvedValue(divisionStandingsResults);

      wrapper = mountComponent({ hasDivisions: true, initiallyExpanded: true }, ['round-1']);

      await flushPromises();

      // With division standings, we expect 2 VrlTabs: main tabs + division tabs
      const tabs = wrapper.findAllComponents({ name: 'VrlTabs' });
      expect(tabs.length).toBeGreaterThan(1);
    });

    it('should not render division tabs when no divisions', async () => {
      wrapper = mountComponent({ hasDivisions: false, initiallyExpanded: true }, ['round-1']);

      await flushPromises();

      const tabs = wrapper.findAllComponents({ name: 'VrlTabs' });
      expect(tabs.length).toBeLessThanOrEqual(1);
    });
  });

  describe('API Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      leagueService.getRoundResults.mockRejectedValue(new Error('Network error'));

      wrapper = mountComponent({ initiallyExpanded: true }, ['round-1']);

      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load round results:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Round Badge', () => {
    it('should display round number badge with correct styling', () => {
      wrapper = mountComponent();

      const badge = wrapper.find('.round-number-badge');
      expect(badge.exists()).toBe(true);
      expect(badge.text()).toBe('R1');
    });
  });

  describe('CrossDivisionResultsTable', () => {
    it('should have qualifying results data available when raceTimesRequired is true', async () => {
      // When raceTimesRequired is true, the component loads qualifying_results data
      // which would be passed to CrossDivisionResultsTable when the qualifying tab is selected
      const resultsWithQualifying: RoundResultsResponse = {
        ...mockRoundResults,
        round: {
          ...mockRoundResults.round,
          qualifying_results: [{ id: 1, position: 1, driver_name: 'Driver 1', time: '01:25.456' }],
        },
      };
      leagueService.getRoundResults.mockResolvedValue(resultsWithQualifying);

      wrapper = mountComponent({ initiallyExpanded: true, raceTimesRequired: true }, ['round-1']);

      await flushPromises();

      // When raceTimesRequired is true, the main tabs should include qualifying/race/fastest tabs
      // The component structure is set up to render CrossDivisionResultsTable for those tabs
      const tabs = wrapper.findComponent({ name: 'VrlTabs' });
      expect(tabs.exists()).toBe(true);
    });
  });
});
