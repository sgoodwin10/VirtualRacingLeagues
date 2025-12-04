import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import RoundResultsModal from '../RoundResultsModal.vue';
import type { Round } from '@app/types/round';
import type { RoundResultsResponse } from '@app/types/roundResult';
import type { Season } from '@app/types/season';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import * as roundService from '@app/services/roundService';
import { useSeasonStore } from '@app/stores/seasonStore';

// Mock the round service
vi.mock('@app/services/roundService', () => ({
  getRoundResults: vi.fn(),
}));

const mockSeason: Season = {
  id: 1,
  competition_id: 1,
  name: '2024 Championship Season',
  slug: '2024-championship-season',
  car_class: 'GT3',
  description: 'Test season',
  technical_specs: null,
  logo_url: 'https://example.com/logo.png',
  has_own_logo: true,
  banner_url: null,
  has_own_banner: false,
  race_divisions_enabled: true,
  team_championship_enabled: false,
  race_times_required: true, // IMPORTANT: This controls visibility of time-related tabs
  status: 'active',
  is_setup: false,
  is_active: true,
  is_completed: false,
  is_archived: false,
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  created_by_user_id: 1,
  stats: {
    total_drivers: 20,
    active_drivers: 20,
    total_races: 10,
    completed_races: 5,
  },
};

const mockRound: Round = {
  id: 1,
  season_id: 1,
  round_number: 1,
  name: 'Monaco GP',
  slug: 'monaco-gp',
  scheduled_at: '2024-05-26T14:00:00Z',
  timezone: 'Europe/Paris',
  platform_track_id: 1,
  track_layout: 'Grand Prix',
  track_conditions: 'Dry',
  technical_notes: null,
  stream_url: null,
  internal_notes: null,
  fastest_lap: 5,
  fastest_lap_top_10: true,
  qualifying_pole: 3,
  qualifying_pole_top_10: false,
  points_system: null,
  round_points: false,
  status: 'completed',
  status_label: 'Completed',
  created_by_user_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
};

const mockRoundResultsResponse: RoundResultsResponse = {
  round: {
    id: 1,
    round_number: 1,
    name: 'Monaco GP',
    status: 'completed',
    round_results: null,
    qualifying_results: [
      { position: 1, race_result_id: 100, time_ms: 72345 },
      { position: 2, race_result_id: 101, time_ms: 72567 },
    ],
    race_time_results: [
      { position: 1, race_result_id: 102, time_ms: 6125123 },
      { position: 2, race_result_id: 103, time_ms: 6127890 },
    ],
    fastest_lap_results: [
      { position: 1, race_result_id: 102, time_ms: 73456 },
      { position: 2, race_result_id: 103, time_ms: 73789 },
    ],
  },
  divisions: [
    { id: 1, name: 'Division A' },
    { id: 2, name: 'Division B' },
  ],
  race_events: [
    {
      id: 10,
      race_number: 0,
      name: 'Qualifying',
      is_qualifier: true,
      race_points: false,
      status: 'completed',
      results: [
        {
          id: 100,
          race_id: 10,
          driver_id: 1,
          division_id: 1,
          position: 1,
          race_time: null,
          race_time_difference: null,
          fastest_lap: '01:12.345',
          penalties: null,
          has_fastest_lap: false,
          has_pole: true,
          dnf: false,
          status: 'confirmed',
          race_points: 3,
          positions_gained: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          driver: { id: 1, name: 'Lewis Hamilton' },
        },
        {
          id: 101,
          race_id: 10,
          driver_id: 2,
          division_id: 1,
          position: 2,
          race_time: null,
          race_time_difference: null,
          fastest_lap: '01:12.567',
          penalties: null,
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
          status: 'confirmed',
          race_points: 2,
          positions_gained: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          driver: { id: 2, name: 'Max Verstappen' },
        },
      ],
    },
    {
      id: 11,
      race_number: 1,
      name: 'Feature Race',
      is_qualifier: false,
      race_points: true,
      status: 'completed',
      results: [
        {
          id: 102,
          race_id: 11,
          driver_id: 1,
          division_id: 1,
          position: 1,
          race_time: '01:42:05.123',
          race_time_difference: null,
          fastest_lap: '01:13.456',
          penalties: null,
          has_fastest_lap: true,
          has_pole: false,
          dnf: false,
          status: 'confirmed',
          race_points: 25,
          positions_gained: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          driver: { id: 1, name: 'Lewis Hamilton' },
        },
        {
          id: 103,
          race_id: 11,
          driver_id: 2,
          division_id: 1,
          position: 2,
          race_time: '01:42:07.890',
          race_time_difference: '+00:00:02.767',
          fastest_lap: '01:13.789',
          penalties: null,
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
          status: 'confirmed',
          race_points: 18,
          positions_gained: -1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          driver: { id: 2, name: 'Max Verstappen' },
        },
      ],
    },
  ],
};

const mockEmptyResponse: RoundResultsResponse = {
  round: {
    id: 1,
    round_number: 1,
    name: 'Monaco GP',
    status: 'completed',
    round_results: null,
    qualifying_results: null,
    race_time_results: null,
    fastest_lap_results: null,
  },
  divisions: [],
  race_events: [],
};

describe('RoundResultsModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Set up the season store with mock season data
    const seasonStore = useSeasonStore();
    seasonStore.currentSeason = mockSeason;
  });

  const createWrapper = (props = {}) => {
    return mount(RoundResultsModal, {
      props: {
        visible: false, // Start with false so the watch will trigger when we set it to true
        round: mockRound,
        seasonId: 1,
        ...props,
      },
      global: {
        plugins: [
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
                options: {
                  prefix: 'p',
                  darkModeSelector: false,
                  cssLayer: false,
                },
              },
            },
          ],
          ToastService,
        ],
        stubs: {
          Tabs: false,
          TabList: false,
          Tab: false,
          TabPanels: false,
          TabPanel: false,
          RaceEventResultsSection: {
            template: '<div class="race-event-stub">{{ raceEvent.name }}</div>',
            props: ['raceEvent', 'divisionId'],
          },
          RoundStandingsSection: {
            template: '<div class="round-standings-stub">Round Standings</div>',
            props: ['roundStandings', 'divisionId', 'raceCount'],
          },
          CrossDivisionResultsSection: {
            template: '<div class="cross-division-stub">{{ title }}</div>',
            props: ['title', 'results', 'raceEvents', 'divisions'],
          },
        },
      },
    });
  };

  describe('Modal Display', () => {
    it('should render modal with round title', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      expect(wrapper.text()).toContain('Round 1');
      expect(wrapper.text()).toContain('Monaco GP');
      expect(wrapper.text()).toContain('Results');
    });

    it('should show loading state while fetching results', async () => {
      vi.mocked(roundService.getRoundResults).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Loading results...');
      expect(wrapper.find('.pi-spinner').exists()).toBe(true);
    });

    it('should display empty state when no results exist', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockEmptyResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      expect(wrapper.text()).toContain('No results available for this round');
    });
  });

  describe('Data Loading', () => {
    it('should fetch round results when modal opens', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      expect(roundService.getRoundResults).toHaveBeenCalledWith(1);
      expect(roundService.getRoundResults).toHaveBeenCalledTimes(1);
    });

    it('should not fetch results when modal is not visible', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      createWrapper({ visible: false });
      await flushPromises();

      expect(roundService.getRoundResults).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(roundService.getRoundResults).mockRejectedValue(new Error('API Error'));

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load round results:',
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Division Tabs', () => {
    it('should display division tabs when divisions exist', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      expect(wrapper.text()).toContain('Division A');
      expect(wrapper.text()).toContain('Division B');
    });

    it('should not display division tabs when no divisions exist', async () => {
      const noDivisionsResponse = {
        ...mockRoundResultsResponse,
        divisions: [],
      };
      vi.mocked(roundService.getRoundResults).mockResolvedValue(noDivisionsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Verify the main tab labels are present
      expect(wrapper.text()).toContain('Round Results');
      expect(wrapper.text()).toContain('Qualifying Times');
      expect(wrapper.text()).toContain('Race Times');
      expect(wrapper.text()).toContain('Fastest Laps');

      // Division names should not appear
      expect(wrapper.text()).not.toContain('Division A');
      expect(wrapper.text()).not.toContain('Division B');
    });

    it('should set first division as active by default', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      const component = wrapper.vm as any;
      expect(component.activeDivisionId).toBe(1); // First division ID
    });
  });

  describe('Race Event Results', () => {
    it('should display all race events', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Race events are rendered in the active division tab
      // Since we have divisions, check that stubs are present for the active tab
      const raceEventStubs = wrapper.findAll('.race-event-stub');
      expect(raceEventStubs.length).toBeGreaterThanOrEqual(2);

      // Check that both race event names appear in the text
      expect(wrapper.text()).toContain('Qualifying');
      expect(wrapper.text()).toContain('Feature Race');
    });

    it('should pass division ID to race events when divisions exist', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      // Since we have tabs, the first tab should be active
      // The RaceEventResultsSection stubs should receive divisionId prop
      const raceEventStubs = wrapper.findAllComponents({ name: 'RaceEventResultsSection' });

      // Each race event should receive the active division ID
      raceEventStubs.forEach((stub) => {
        expect(stub.props('divisionId')).toBe(1); // Active division
      });
    });

    it('should not pass division ID when no divisions exist', async () => {
      const noDivisionsResponse = {
        ...mockRoundResultsResponse,
        divisions: [],
      };
      vi.mocked(roundService.getRoundResults).mockResolvedValue(noDivisionsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      const raceEventStubs = wrapper.findAllComponents({ name: 'RaceEventResultsSection' });

      raceEventStubs.forEach((stub) => {
        expect(stub.props('divisionId')).toBeUndefined();
      });
    });
  });

  describe('Modal Interaction', () => {
    it('should emit update:visible when close button is clicked', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      const closeButton = wrapper.find('button');
      await closeButton.trigger('click');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('should reset state when modal closes', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      const component = wrapper.vm as any;
      expect(component.roundData).not.toBeNull();
      expect(component.raceEvents).toHaveLength(2);

      // Call the handleClose method directly
      component.handleClose();
      await flushPromises();

      // State should be reset after handleClose is called
      expect(component.roundData).toBeNull();
      expect(component.raceEvents).toHaveLength(0);
      expect(component.divisions).toHaveLength(0);
      expect(component.activeDivisionId).toBe(-1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle round without name', async () => {
      const roundWithoutName = { ...mockRound, name: null };
      const responseWithoutName = {
        ...mockRoundResultsResponse,
        round: { ...mockRoundResultsResponse.round, name: null },
      };
      vi.mocked(roundService.getRoundResults).mockResolvedValue(responseWithoutName);

      const wrapper = createWrapper({ round: roundWithoutName });
      await wrapper.setProps({ visible: true });
      await flushPromises();

      expect(wrapper.text()).toContain('Round 1');
      expect(wrapper.text()).not.toContain('Monaco GP');
    });

    it('should handle race events with results but all empty', async () => {
      const responseWithEmptyResults: RoundResultsResponse = {
        ...mockRoundResultsResponse,
        race_events: [
          {
            id: 10,
            race_number: 1,
            name: 'Race 1',
            is_qualifier: false,
            race_points: true,
            status: 'scheduled',
            results: [],
          },
        ],
      };
      vi.mocked(roundService.getRoundResults).mockResolvedValue(responseWithEmptyResults);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      expect(wrapper.text()).toContain('No results available for this round');
    });

    it('should handle multiple race events correctly', async () => {
      const multiRaceResponse: RoundResultsResponse = {
        ...mockRoundResultsResponse,
        race_events: [
          mockRoundResultsResponse.race_events[0]!,
          mockRoundResultsResponse.race_events[1]!,
          {
            id: 12,
            race_number: 2,
            name: 'Sprint Race',
            is_qualifier: false,
            race_points: true,
            status: 'completed',
            results: [
              {
                id: 104,
                race_id: 12,
                driver_id: 1,
                division_id: 1,
                position: 1,
                race_time: '00:25:10.123',
                race_time_difference: null,
                fastest_lap: '01:15.123',
                penalties: null,
                has_fastest_lap: true,
                has_pole: false,
                dnf: false,
                status: 'confirmed',
                race_points: 8,
                positions_gained: 0,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                driver: { id: 1, name: 'Lewis Hamilton' },
              },
            ],
          },
        ],
      };
      vi.mocked(roundService.getRoundResults).mockResolvedValue(multiRaceResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Race events are rendered in the active division tab
      const raceEventStubs = wrapper.findAll('.race-event-stub');
      expect(raceEventStubs.length).toBeGreaterThanOrEqual(3);

      // Verify all three race event names appear
      expect(wrapper.text()).toContain('Qualifying');
      expect(wrapper.text()).toContain('Feature Race');
      expect(wrapper.text()).toContain('Sprint Race');
    });
  });

  describe('Main Content Tabs', () => {
    it('should display all four main tabs', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Tab labels should be visible (note: text might be condensed without spaces)
      const text = wrapper.text();
      expect(text).toMatch(/Round\s*Results/);
      expect(text).toMatch(/Qualifying\s*Times/);
      expect(text).toMatch(/Race\s*Times/);
      expect(text).toMatch(/Fastest\s*Laps/);
    });

    it('should default to Round Results tab', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      const component = wrapper.vm as any;
      expect(component.activeMainTab).toBe('round-results');
    });

    it('should reset main tab when modal closes', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();

      const component = wrapper.vm as any;
      component.activeMainTab = 'qualifying-times';
      await wrapper.vm.$nextTick();

      component.handleClose();
      await flushPromises();

      expect(component.activeMainTab).toBe('round-results');
    });

    it('should display CrossDivisionResultsSection in qualifying times tab', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Change to qualifying times tab to see cross-division sections
      const component = wrapper.vm as any;
      component.activeMainTab = 'qualifying-times';
      await wrapper.vm.$nextTick();

      // The component should now contain the qualifying times cross-division section
      const crossDivisionStubs = wrapper.findAll('.cross-division-stub');
      expect(crossDivisionStubs.length).toBeGreaterThanOrEqual(1);
    });

    it('should pass correct props to CrossDivisionResultsSection components', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();
      await wrapper.vm.$nextTick();

      const component = wrapper.vm as any;

      // Check each tab one by one
      component.activeMainTab = 'qualifying-times';
      await wrapper.vm.$nextTick();
      expect(wrapper.html()).toContain('Qualifying Times - All Divisions');

      component.activeMainTab = 'race-times';
      await wrapper.vm.$nextTick();
      expect(wrapper.html()).toContain('Race Times - All Divisions');

      component.activeMainTab = 'fastest-laps';
      await wrapper.vm.$nextTick();
      expect(wrapper.html()).toContain('Fastest Laps - All Divisions');
    });

    it('should render cross-division sections with data', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();
      await wrapper.vm.$nextTick();

      const component = wrapper.vm as any;

      // Check qualifying times tab
      component.activeMainTab = 'qualifying-times';
      await wrapper.vm.$nextTick();
      // Note: PrimeVue Tabs might keep all tab panels in DOM, so we check that the stubs exist
      let crossDivisionStubs = wrapper.findAll('.cross-division-stub');
      expect(crossDivisionStubs.length).toBeGreaterThanOrEqual(1);
      expect(wrapper.html()).toContain('Qualifying Times - All Divisions');

      // Check race times tab
      component.activeMainTab = 'race-times';
      await wrapper.vm.$nextTick();
      crossDivisionStubs = wrapper.findAll('.cross-division-stub');
      expect(crossDivisionStubs.length).toBeGreaterThanOrEqual(1);
      expect(wrapper.html()).toContain('Race Times - All Divisions');

      // Check fastest laps tab
      component.activeMainTab = 'fastest-laps';
      await wrapper.vm.$nextTick();
      crossDivisionStubs = wrapper.findAll('.cross-division-stub');
      expect(crossDivisionStubs.length).toBeGreaterThanOrEqual(1);
      expect(wrapper.html()).toContain('Fastest Laps - All Divisions');
    });

    it('should handle null cross-division results gracefully', async () => {
      const responseWithNullCrossResults: RoundResultsResponse = {
        ...mockRoundResultsResponse,
        round: {
          ...mockRoundResultsResponse.round,
          qualifying_results: null,
          race_time_results: null,
          fastest_lap_results: null,
        },
      };
      vi.mocked(roundService.getRoundResults).mockResolvedValue(responseWithNullCrossResults);

      const wrapper = createWrapper();
      await wrapper.setProps({ visible: true });
      await flushPromises();
      await wrapper.vm.$nextTick();

      const component = wrapper.vm as any;

      // Check each tab - cross-division sections should still render
      component.activeMainTab = 'qualifying-times';
      await wrapper.vm.$nextTick();
      expect(wrapper.html()).toContain('Qualifying Times - All Divisions');

      component.activeMainTab = 'race-times';
      await wrapper.vm.$nextTick();
      expect(wrapper.html()).toContain('Race Times - All Divisions');

      component.activeMainTab = 'fastest-laps';
      await wrapper.vm.$nextTick();
      expect(wrapper.html()).toContain('Fastest Laps - All Divisions');
    });
  });
});
