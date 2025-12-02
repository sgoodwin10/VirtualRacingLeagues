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

describe('RaceResultModal - Fastest Lap Detection', () => {
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
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      season_id: 1,
      name: 'Division B',
      description: 'Second division',
      logo_url: null,
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

  describe('Single Fastest Lap (No Divisions)', () => {
    beforeEach(() => {
      mockSeasonStore.currentSeason = {
        id: 1,
        race_divisions_enabled: false,
      } as any;
    });

    it('should automatically set has_fastest_lap for driver with fastest lap', async () => {
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

      // Setup form results with fastest lap times
      vm.formResults = [
        {
          driver_id: 1,
          division_id: null,
          position: null,
          race_time: '00:01:30.500',
          race_time_difference: '',
          fastest_lap: '00:01:25.123', // Fastest
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: null,
          position: null,
          race_time: '00:01:31.000',
          race_time_difference: '',
          fastest_lap: '00:01:26.456', // Slower
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      // Trigger save
      await vm.handleSave();

      // Verify saveResults was called with correct has_fastest_lap flags
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              has_fastest_lap: true, // Should be true for fastest lap
            }),
            expect.objectContaining({
              driver_id: 2,
              has_fastest_lap: false, // Should be false
            }),
          ]),
        }),
      );
    });

    it('should handle ties - multiple drivers with same fastest lap', async () => {
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

      // Setup form results with tied fastest laps
      vm.formResults = [
        {
          driver_id: 1,
          division_id: null,
          position: null,
          race_time: '00:01:30.500',
          race_time_difference: '',
          fastest_lap: '00:01:25.123', // Tied for fastest
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: null,
          position: null,
          race_time: '00:01:31.000',
          race_time_difference: '',
          fastest_lap: '00:01:25.123', // Tied for fastest
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // Both drivers should have has_fastest_lap = true
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              has_fastest_lap: true,
            }),
            expect.objectContaining({
              driver_id: 2,
              has_fastest_lap: true,
            }),
          ]),
        }),
      );
    });

    it('should ignore drivers without fastest lap times', async () => {
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

      // Setup form results with one missing fastest lap
      vm.formResults = [
        {
          driver_id: 1,
          division_id: null,
          position: null,
          race_time: '00:01:30.500',
          race_time_difference: '',
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
          race_time: '00:01:31.000',
          race_time_difference: '',
          fastest_lap: '', // No fastest lap time
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              has_fastest_lap: true, // Only driver with fastest lap
            }),
            expect.objectContaining({
              driver_id: 2,
              has_fastest_lap: false,
            }),
          ]),
        }),
      );
    });
  });

  describe('Fastest Lap Per Division', () => {
    beforeEach(() => {
      mockSeasonStore.currentSeason = {
        id: 1,
        race_divisions_enabled: true,
      } as any;
    });

    it('should calculate fastest lap separately for each division', async () => {
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

      // Setup form results with drivers in different divisions
      vm.formResults = [
        {
          driver_id: 1,
          division_id: 1, // Division A
          position: null,
          race_time: '00:01:30.500',
          race_time_difference: '',
          fastest_lap: '00:01:25.123', // Fastest in Division A
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: 1, // Division A
          position: null,
          race_time: '00:01:31.000',
          race_time_difference: '',
          fastest_lap: '00:01:26.456', // Slower in Division A
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 3,
          division_id: 2, // Division B
          position: null,
          race_time: '00:01:32.000',
          race_time_difference: '',
          fastest_lap: '00:01:24.000', // Fastest in Division B (faster overall but different division)
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // Each division should have its own fastest lap holder
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              division_id: 1,
              has_fastest_lap: true, // Fastest in Division A
            }),
            expect.objectContaining({
              driver_id: 2,
              division_id: 1,
              has_fastest_lap: false,
            }),
            expect.objectContaining({
              driver_id: 3,
              division_id: 2,
              has_fastest_lap: true, // Fastest in Division B
            }),
          ]),
        }),
      );
    });

    it('should handle ties within each division separately', async () => {
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

      // Add a fourth driver for more complex scenario
      vm.formResults = [
        {
          driver_id: 1,
          division_id: 1,
          position: null,
          race_time: '00:01:30.500',
          race_time_difference: '',
          fastest_lap: '00:01:25.123', // Tied in Division A
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: 1,
          position: null,
          race_time: '00:01:31.000',
          race_time_difference: '',
          fastest_lap: '00:01:25.123', // Tied in Division A
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 3,
          division_id: 2,
          position: null,
          race_time: '00:01:32.000',
          race_time_difference: '',
          fastest_lap: '00:01:24.000', // Fastest in Division B
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // Both drivers in Division A should have has_fastest_lap = true
      // Only the driver in Division B should have has_fastest_lap = true
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              division_id: 1,
              has_fastest_lap: true, // Tied in Division A
            }),
            expect.objectContaining({
              driver_id: 2,
              division_id: 1,
              has_fastest_lap: true, // Tied in Division A
            }),
            expect.objectContaining({
              driver_id: 3,
              division_id: 2,
              has_fastest_lap: true, // Fastest in Division B
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
      } as any;
    });

    it('should NOT calculate fastest lap for qualifying sessions', async () => {
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
          race_time: '',
          race_time_difference: '',
          fastest_lap: '00:01:25.123', // Qualifying time
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: null,
          position: null,
          race_time: '',
          race_time_difference: '',
          fastest_lap: '00:01:26.456',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // All should have has_fastest_lap = false in qualifying
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockQualifyingRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              has_fastest_lap: false,
            }),
            expect.objectContaining({
              driver_id: 2,
              has_fastest_lap: false,
            }),
          ]),
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSeasonStore.currentSeason = {
        id: 1,
        race_divisions_enabled: false,
      } as any;
    });

    it('should reset has_fastest_lap to false before recalculating', async () => {
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

      // Setup form results with one already having has_fastest_lap = true (from previous save)
      vm.formResults = [
        {
          driver_id: 1,
          division_id: null,
          position: null,
          race_time: '00:01:30.500',
          race_time_difference: '',
          fastest_lap: '00:01:26.000', // Slower now
          penalties: '',
          has_fastest_lap: true, // Previously had fastest lap
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: null,
          position: null,
          race_time: '00:01:31.000',
          race_time_difference: '',
          fastest_lap: '00:01:25.123', // Now fastest
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // Driver 1 should have has_fastest_lap reset to false
      // Driver 2 should now have has_fastest_lap = true
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              has_fastest_lap: false, // Should be reset
            }),
            expect.objectContaining({
              driver_id: 2,
              has_fastest_lap: true, // Should be set
            }),
          ]),
        }),
      );
    });

    it('should handle all drivers having no fastest lap times', async () => {
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
          race_time: '00:01:30.500',
          race_time_difference: '',
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
          race_time: '00:01:31.000',
          race_time_difference: '',
          fastest_lap: '', // No fastest lap
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];

      await vm.handleSave();

      // All should remain false
      expect(mockRaceResultStore.saveResults).toHaveBeenCalledWith(
        mockRace.id,
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              driver_id: 1,
              has_fastest_lap: false,
            }),
            expect.objectContaining({
              driver_id: 2,
              has_fastest_lap: false,
            }),
          ]),
        }),
      );
    });
  });
});
