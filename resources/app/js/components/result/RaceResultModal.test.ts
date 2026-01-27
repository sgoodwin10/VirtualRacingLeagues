import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ToastService from 'primevue/toastservice';
import RaceResultModal from '@app/components/result/RaceResultModal.vue';
import { useRaceResultStore } from '@app/stores/raceResultStore';
import { useSeasonStore } from '@app/stores/seasonStore';
import { useDivisionStore } from '@app/stores/divisionStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import type { Race } from '@app/types/race';
import type { Round } from '@app/types/round';
import type { SeasonDriver } from '@app/types/seasonDriver';
import type { Division } from '@app/types/division';

// Mock PrimeVue components
vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button><slot /></button>',
  },
}));

vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input />',
  },
}));

vi.mock('primevue/dropdown', () => ({
  default: {
    name: 'Dropdown',
    template: '<select><slot /></select>',
  },
}));

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    template: '<input type="checkbox" />',
  },
}));

vi.mock('primevue/tabview', () => ({
  default: {
    name: 'TabView',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/tabpanel', () => ({
  default: {
    name: 'TabPanel',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div><slot /></div>',
  },
}));

describe('RaceResultModal - CSV Import and Time Calculations', () => {
  let pinia: ReturnType<typeof createPinia>;
  let mockRaceResultStore: ReturnType<typeof useRaceResultStore>;
  let mockSeasonStore: ReturnType<typeof useSeasonStore>;
  let mockDivisionStore: ReturnType<typeof useDivisionStore>;
  let mockSeasonDriverStore: ReturnType<typeof useSeasonDriverStore>;

  const mockRace: Race = {
    id: 1,
    round_id: 1,
    race_number: 1,
    name: 'Race 1',
    race_type: 'sprint',
    qualifying_format: 'standard',
    qualifying_length: 15,
    qualifying_tire: null,
    grid_source: 'qualifying',
    grid_source_race_id: null,
    length_type: 'laps',
    length_value: 20,
    extra_lap_after_time: false,
    weather: null,
    tire_restrictions: null,
    fuel_usage: null,
    damage_model: null,
    track_limits_enforced: true,
    false_start_detection: true,
    collision_penalties: true,
    mandatory_pit_stop: false,
    minimum_pit_time: null,
    assists_restrictions: null,
    race_points: true,
    points_system: {},
    fastest_lap: 1,
    fastest_lap_top_10: false,
    qualifying_pole: 1,
    qualifying_pole_top_10: false,
    dnf_points: 0,
    dns_points: 0,
    race_notes: null,
    is_qualifier: false,
    status: 'scheduled',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockRound: Round = {
    id: 1,
    season_id: 1,
    round_number: 1,
    name: 'Round 1',
    slug: 'round-1',
    scheduled_at: '2024-01-01T00:00:00Z',
    timezone: 'UTC',
    platform_track_id: null,
    track_layout: null,
    track_conditions: null,
    technical_notes: null,
    stream_url: null,
    internal_notes: null,
    fastest_lap: null,
    fastest_lap_top_10: false,
    qualifying_pole: null,
    qualifying_pole_top_10: false,
    points_system: null,
    round_points: true,
    status: 'in_progress',
    status_label: 'In Progress',
    created_by_user_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  const mockDrivers: SeasonDriver[] = [
    {
      id: 1,
      season_id: 1,
      league_driver_id: 1,
      driver_id: 1,
      first_name: 'John',
      last_name: 'Doe',
      nickname: 'JD',
      driver_number: '1',
      division_id: 1,
      team_id: null,
      psn_id: 'john_psn',
      iracing_id: null,
      discord_id: null,
      team_name: null,
      division_name: 'Division A',
      status: 'active',
      notes: null,
      is_active: true,
      is_reserve: false,
      is_withdrawn: false,
      added_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      season_id: 1,
      league_driver_id: 2,
      driver_id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      nickname: 'JS',
      driver_number: '2',
      division_id: 1,
      team_id: null,
      psn_id: 'jane_psn',
      iracing_id: null,
      discord_id: null,
      team_name: null,
      division_name: 'Division A',
      status: 'active',
      notes: null,
      is_active: true,
      is_reserve: false,
      is_withdrawn: false,
      added_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 3,
      season_id: 1,
      league_driver_id: 3,
      driver_id: 3,
      first_name: 'Bob',
      last_name: 'Johnson',
      nickname: 'BJ',
      driver_number: '3',
      division_id: 2,
      team_id: null,
      psn_id: 'bob_psn',
      iracing_id: null,
      discord_id: null,
      team_name: null,
      division_name: 'Division B',
      status: 'active',
      notes: null,
      is_active: true,
      is_reserve: false,
      is_withdrawn: false,
      added_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockDivisions: Division[] = [
    {
      id: 1,
      season_id: 1,
      name: 'Division A',
      description: 'Top division',
      logo_url: null,
      order: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      season_id: 1,
      name: 'Division B',
      description: 'Second division',
      logo_url: null,
      order: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    mockRaceResultStore = useRaceResultStore();
    mockSeasonStore = useSeasonStore();
    mockDivisionStore = useDivisionStore();
    mockSeasonDriverStore = useSeasonDriverStore();

    // Mock store methods
    vi.spyOn(mockRaceResultStore, 'saveResults').mockResolvedValue([]);
    vi.spyOn(mockRaceResultStore, 'fetchResults').mockResolvedValue();
    vi.spyOn(mockSeasonDriverStore, 'fetchSeasonDrivers').mockResolvedValue();
    vi.spyOn(mockSeasonDriverStore, 'resetFilters').mockReturnValue();

    // Setup mock data
    mockSeasonDriverStore.seasonDrivers = mockDrivers;
    mockDivisionStore.divisions = mockDivisions;
    (mockRaceResultStore as any).results = [];
    Object.defineProperty(mockRaceResultStore, 'hasResults', {
      value: false,
      writable: true,
      configurable: true,
    });
  });

  describe('Position Calculation and Payload Generation', () => {
    beforeEach(() => {
      mockSeasonStore.currentSeason = {
        id: 1,
        race_divisions_enabled: false,
        race_times_required: true,
      } as any;
    });

    it('should calculate positions based on race time', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Access component instance
      const vm = wrapper.vm as any;

      // Setup form results with race times
      vm.formResults = [
        {
          driver_id: 1,
          division_id: null,
          position: null,
          original_race_time: '00:01:30.500',
          original_race_time_difference: '',
          fastest_lap: '00:01:25.123',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: null,
          position: null,
          original_race_time: '00:01:31.000',
          original_race_time_difference: '',
          fastest_lap: '00:01:26.456',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      // Trigger save
      await vm.handleSave();

      // Verify saveResults was called with positions
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              position: 1, // Faster time
              has_fastest_lap: false, // Backend calculates this
            }),
            expect.objectContaining({
              driver_id: 2,
              position: 2, // Slower time
              has_fastest_lap: false, // Backend calculates this
            }),
          ]),
        }),
      );
    });

    it('should send fastest lap data to backend without calculating has_fastest_lap', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Setup form results - has_fastest_lap stays false (backend will calculate)
      vm.formResults = [
        {
          driver_id: 1,
          division_id: null,
          position: null,
          original_race_time: '00:01:30.500',
          original_race_time_difference: '',
          fastest_lap: '00:01:25.123',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: null,
          position: null,
          original_race_time: '00:01:31.000',
          original_race_time_difference: '',
          fastest_lap: '00:01:26.456',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // Verify fastest lap times are sent but has_fastest_lap remains false
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              fastest_lap: '00:01:25.123',
              has_fastest_lap: false, // Backend will calculate
            }),
            expect.objectContaining({
              driver_id: 2,
              fastest_lap: '00:01:26.456',
              has_fastest_lap: false, // Backend will calculate
            }),
          ]),
        }),
      );
    });
  });

  describe('Qualifying Sessions', () => {
    const mockQualifyingRace: Race = {
      ...mockRace,
      is_qualifier: true,
    };

    beforeEach(() => {
      mockSeasonStore.currentSeason = {
        id: 1,
        race_divisions_enabled: false,
        race_times_required: true,
      } as any;
    });

    it('should calculate positions based on fastest lap for qualifying', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockQualifyingRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Setup qualifying results
      vm.formResults = [
        {
          driver_id: 1,
          division_id: null,
          position: null,
          original_race_time: '',
          original_race_time_difference: '',
          fastest_lap: '00:01:25.123', // Fastest qualifying time
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: null,
          position: null,
          original_race_time: '',
          original_race_time_difference: '',
          fastest_lap: '00:01:26.456', // Slower qualifying time
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // Positions should be calculated based on fastest lap time
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockQualifyingRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              position: 1, // Faster lap
              has_fastest_lap: false, // Backend calculates this
            }),
            expect.objectContaining({
              driver_id: 2,
              position: 2, // Slower lap
              has_fastest_lap: false, // Backend calculates this
            }),
          ]),
        }),
      );
    });
  });

  describe('Loading Existing Results', () => {
    beforeEach(() => {
      mockSeasonStore.currentSeason = {
        id: 1,
        race_divisions_enabled: false,
        race_times_required: true,
      } as any;
    });

    it('should populate form with existing results on first modal open', async () => {
      // Setup existing results in the store
      const existingResults = [
        {
          id: 1,
          race_id: 1,
          driver_id: 1,
          division_id: null,
          position: 1,
          original_race_time: '00:01:30.500',
          original_race_time_difference: null,
          fastest_lap: '00:01:25.123',
          penalties: null,
          has_fastest_lap: true,
          has_pole: false,
          dnf: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          race_id: 1,
          driver_id: 2,
          division_id: null,
          position: 2,
          original_race_time: '00:01:31.000',
          original_race_time_difference: null,
          fastest_lap: '00:01:26.456',
          penalties: null,
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Mock fetchResults to populate the store synchronously
      (mockRaceResultStore as any).results = [];
      vi.spyOn(mockRaceResultStore, 'fetchResults').mockImplementation(async () => {
        (mockRaceResultStore as any).results = existingResults;
      });

      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: false, // Start with modal closed
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      // Open the modal by setting visible to true
      await wrapper.setProps({ visible: true });

      // Wait for the watcher to trigger and loadData to complete
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Wait for isLoadingDrivers to become false
      await vi.waitFor(() => {
        expect(vm.isLoadingDrivers).toBe(false);
      });

      // Verify form was populated with existing results
      expect(vm.formResults).toHaveLength(2);
      expect(vm.formResults[0]).toMatchObject({
        driver_id: 1,
        position: 1,
        original_race_time: '00:01:30.500',
        fastest_lap: '00:01:25.123',
        has_fastest_lap: true,
      });
      expect(vm.formResults[1]).toMatchObject({
        driver_id: 2,
        position: 2,
        original_race_time: '00:01:31.000',
        fastest_lap: '00:01:26.456',
        has_fastest_lap: false,
      });
    });

    it('should show empty form when no existing results', async () => {
      // Mock fetchResults to return no results
      vi.spyOn(mockRaceResultStore, 'fetchResults').mockImplementation(async () => {
        (mockRaceResultStore as any).results = [];
      });

      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      // Wait for loadData to complete
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Verify form is empty
      expect(vm.formResults).toHaveLength(0);
    });

    it('should load existing results immediately when mounted with visible=true (v-if scenario)', async () => {
      // This tests the bug fix: when modal is rendered with v-if and visible=true,
      // the watch should fire immediately due to { immediate: true }

      // Setup existing results in the store
      const existingResults = [
        {
          id: 1,
          race_id: 1,
          driver_id: 1,
          division_id: null,
          position: 1,
          original_race_time: '00:01:30.500',
          original_race_time_difference: null,
          fastest_lap: '00:01:25.123',
          penalties: null,
          has_fastest_lap: true,
          has_pole: false,
          dnf: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Mock fetchResults to populate the store
      vi.spyOn(mockRaceResultStore, 'fetchResults').mockImplementation(async () => {
        (mockRaceResultStore as any).results = existingResults;
      });

      // Mount the component with visible=true from the start (simulates v-if behavior)
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true, // Already visible on mount
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      // Wait for loadData to complete
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Wait for isLoadingDrivers to become false
      await vi.waitFor(() => {
        expect(vm.isLoadingDrivers).toBe(false);
      });

      // Verify fetchResults was called immediately on mount (not waiting for prop change)
      expect(mockRaceResultStore.fetchResults).toHaveBeenCalledWith(mockRace.id);

      // Verify form was populated with existing results
      expect(vm.formResults).toHaveLength(1);
      expect(vm.formResults[0]).toMatchObject({
        driver_id: 1,
        position: 1,
        original_race_time: '00:01:30.500',
        fastest_lap: '00:01:25.123',
        has_fastest_lap: true,
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSeasonStore.currentSeason = {
        id: 1,
        race_divisions_enabled: false,
        race_times_required: true,
      } as any;
    });

    it('should send has_fastest_lap as-is without modification', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Setup form results - has_fastest_lap field is preserved from form state
      vm.formResults = [
        {
          driver_id: 1,
          division_id: null,
          position: null,
          original_race_time: '00:01:30.500',
          original_race_time_difference: '',
          fastest_lap: '00:01:26.000',
          penalties: '',
          has_fastest_lap: true, // User manually set this or from previous backend response
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: null,
          position: null,
          original_race_time: '00:01:31.000',
          original_race_time_difference: '',
          fastest_lap: '00:01:25.123',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // Frontend sends has_fastest_lap as-is (backend will recalculate)
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              has_fastest_lap: true, // Sent as-is from form
            }),
            expect.objectContaining({
              driver_id: 2,
              has_fastest_lap: false, // Sent as-is from form
            }),
          ]),
        }),
      );
    });

    it('should handle drivers with no fastest lap times', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      vm.formResults = [
        {
          driver_id: 1,
          division_id: null,
          position: null,
          original_race_time: '00:01:30.500',
          original_race_time_difference: '',
          fastest_lap: '', // No fastest lap
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: null,
          position: null,
          original_race_time: '00:01:31.000',
          original_race_time_difference: '',
          fastest_lap: '', // No fastest lap
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // Should send null for empty fastest lap times
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              fastest_lap: null,
              has_fastest_lap: false,
            }),
            expect.objectContaining({
              driver_id: 2,
              fastest_lap: null,
              has_fastest_lap: false,
            }),
          ]),
        }),
      );
    });
  });

  describe('Missing Driver Detection', () => {
    beforeEach(() => {
      mockSeasonStore.currentSeason = {
        id: 1,
        race_divisions_enabled: false,
        race_times_required: true,
      } as any;
    });

    it('should track missing drivers when CSV contains unknown driver names', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
            Message: {
              name: 'Message',
              template: '<div class="p-message"><slot /></div>',
              props: ['severity', 'closable'],
            },
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Mock CSV parsed rows with some unknown drivers
      const csvRows = [
        {
          driver: 'JD', // Should match John Doe by nickname
          race_time: '00:01:30.500',
          fastest_lap_time: '00:01:25.123',
        },
        {
          driver: 'Unknown Driver 1', // Should not match anyone
          race_time: '00:01:31.000',
          fastest_lap_time: '00:01:26.456',
        },
        {
          driver: 'JS', // Should match Jane Smith by nickname
          race_time: '00:01:32.000',
          fastest_lap_time: '00:01:27.789',
        },
        {
          driver: 'Unknown Driver 2', // Should not match anyone
          race_time: '00:01:33.000',
          fastest_lap_time: '00:01:28.000',
        },
      ];

      // Call handleCsvParse directly
      vm.handleCsvParse(csvRows);

      // Verify missing drivers are tracked
      expect(vm.missingDriverNames).toHaveLength(2);
      expect(vm.missingDriverNames).toContain('Unknown Driver 1');
      expect(vm.missingDriverNames).toContain('Unknown Driver 2');

      // Verify only known drivers were added to formResults
      expect(vm.formResults).toHaveLength(2);
      expect(vm.formResults[0].driver_id).toBe(1); // John Doe
      expect(vm.formResults[1].driver_id).toBe(2); // Jane Smith
    });

    it('should show toast warning when missing drivers are detected', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Spy on the toast instance used by the component
      const toastAddSpy = vi.spyOn(vm.toast, 'add');

      const csvRows = [
        {
          driver: 'Unknown Driver',
          race_time: '00:01:30.500',
          fastest_lap_time: '00:01:25.123',
        },
      ];

      vm.handleCsvParse(csvRows);

      // Verify toast warning was shown
      expect(toastAddSpy).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Drivers Not Found',
        detail: '1 driver(s) from CSV were not found in the season.',
        life: 5000,
      });
    });

    it('should reset missing drivers list when parsing new CSV', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // First CSV parse with missing drivers
      vm.handleCsvParse([
        {
          driver: 'Unknown Driver 1',
          race_time: '00:01:30.500',
          fastest_lap_time: '00:01:25.123',
        },
      ]);

      expect(vm.missingDriverNames).toHaveLength(1);

      // Second CSV parse with different missing drivers
      vm.handleCsvParse([
        {
          driver: 'Unknown Driver 2',
          race_time: '00:01:31.000',
          fastest_lap_time: '00:01:26.456',
        },
        {
          driver: 'Unknown Driver 3',
          race_time: '00:01:32.000',
          fastest_lap_time: '00:01:27.789',
        },
      ]);

      // Should have replaced the old missing drivers list
      expect(vm.missingDriverNames).toHaveLength(2);
      expect(vm.missingDriverNames).toContain('Unknown Driver 2');
      expect(vm.missingDriverNames).toContain('Unknown Driver 3');
      expect(vm.missingDriverNames).not.toContain('Unknown Driver 1');
    });

    it('should clear missing drivers list when modal is closed', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Parse CSV with missing drivers
      vm.handleCsvParse([
        {
          driver: 'Unknown Driver',
          race_time: '00:01:30.500',
          fastest_lap_time: '00:01:25.123',
        },
      ]);

      expect(vm.missingDriverNames).toHaveLength(1);

      // Close the modal
      vm.handleClose();

      // Missing drivers list should be cleared
      expect(vm.missingDriverNames).toHaveLength(0);
    });

    it('should not show warning or track missing drivers when all CSV drivers are found', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // Spy on the toast instance used by the component
      const toastAddSpy = vi.spyOn(vm.toast, 'add');

      // CSV with only known drivers
      const csvRows = [
        {
          driver: 'JD',
          race_time: '00:01:30.500',
          fastest_lap_time: '00:01:25.123',
        },
        {
          driver: 'JS',
          race_time: '00:01:31.000',
          fastest_lap_time: '00:01:26.456',
        },
      ];

      vm.handleCsvParse(csvRows);

      // No missing drivers
      expect(vm.missingDriverNames).toHaveLength(0);

      // No toast warning
      expect(toastAddSpy).not.toHaveBeenCalled();
    });

    it('should avoid duplicate entries in missing drivers list', async () => {
      const wrapper = mount(RaceResultModal, {
        props: {
          race: mockRace,
          round: mockRound,
          seasonId: 1,
          visible: true,
        },
        global: {
          plugins: [pinia, ToastService],
          stubs: {
            BaseModal: {
              template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
            },
            ResultCsvImport: true,
            ResultDivisionTabs: true,
            ResultEntryTable: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as any;

      // CSV with duplicate unknown driver names
      const csvRows = [
        {
          driver: 'Unknown Driver',
          race_time: '00:01:30.500',
          fastest_lap_time: '00:01:25.123',
        },
        {
          driver: 'Unknown Driver', // Duplicate
          race_time: '00:01:31.000',
          fastest_lap_time: '00:01:26.456',
        },
        {
          driver: 'Another Unknown',
          race_time: '00:01:32.000',
          fastest_lap_time: '00:01:27.789',
        },
      ];

      vm.handleCsvParse(csvRows);

      // Should have only 2 unique missing drivers
      expect(vm.missingDriverNames).toHaveLength(2);
      expect(
        vm.missingDriverNames.filter((name: string) => name === 'Unknown Driver'),
      ).toHaveLength(1);
      expect(vm.missingDriverNames).toContain('Another Unknown');
    });
  });
});
