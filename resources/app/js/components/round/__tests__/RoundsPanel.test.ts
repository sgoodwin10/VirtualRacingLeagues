import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import { useRoundStore } from '@app/stores/roundStore';
import { useRaceStore } from '@app/stores/raceStore';
import { useTrackStore } from '@app/stores/trackStore';
import RoundsPanel from '../RoundsPanel.vue';
import type { Round } from '@app/types/round';
import type { Race } from '@app/types/race';

// Mock PrimeVue components
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: vi.fn(),
  }),
}));

describe('RoundsPanel', () => {
  let roundStore: ReturnType<typeof useRoundStore>;
  let raceStore: ReturnType<typeof useRaceStore>;
  let trackStore: ReturnType<typeof useTrackStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    roundStore = useRoundStore();
    raceStore = useRaceStore();
    trackStore = useTrackStore();

    // Mock store methods
    vi.spyOn(roundStore, 'fetchRounds').mockResolvedValue(undefined);
    vi.spyOn(raceStore, 'fetchRaces').mockResolvedValue(undefined);
    vi.spyOn(trackStore, 'fetchTracks').mockResolvedValue([]);
  });

  it('should load races on mount and display them reactively', async () => {
    // Setup mock data
    const mockRound: Round = {
      id: 1,
      season_id: 1,
      platform_track_id: 1,
      round_number: 1,
      name: 'Test Round',
      slug: 'test-round',
      scheduled_at: '2025-01-15T10:00:00Z',
      timezone: 'UTC',
      track_layout: null,
      track_conditions: null,
      technical_notes: null,
      stream_url: null,
      internal_notes: null,
      status: 'scheduled',
      status_label: 'Scheduled',
      created_by_user_id: 1,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      deleted_at: null,
    };

    const mockRace: Race = {
      id: 1,
      round_id: 1,
      race_number: 1,
      name: 'Feature Race',
      race_type: 'feature',
      qualifying_format: 'none',
      qualifying_length: null,
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
      race_divisions: false,
      points_system: { 1: 25, 2: 18, 3: 15 },
      bonus_points: null,
      dnf_points: 0,
      dns_points: 0,
      race_notes: null,
      is_qualifier: false,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
    };

    const mockQualifier: Race = {
      id: 2,
      round_id: 1,
      race_number: 0,
      name: 'Qualifying',
      race_type: 'qualifying',
      qualifying_format: 'standard',
      qualifying_length: 15,
      qualifying_tire: null,
      grid_source: 'qualifying',
      grid_source_race_id: null,
      length_type: 'time',
      length_value: 15,
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
      race_divisions: false,
      points_system: {},
      bonus_points: null,
      dnf_points: 0,
      dns_points: 0,
      race_notes: null,
      is_qualifier: true,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
    };

    // Populate stores
    roundStore.rounds = [mockRound];
    raceStore.races = [mockRace, mockQualifier];

    // Mount component
    const wrapper = mount(RoundsPanel, {
      props: {
        seasonId: 1,
        platformId: 1,
      },
      global: {
        stubs: {
          BasePanel: true,
          Button: true,
          Accordion: true,
          AccordionPanel: true,
          AccordionHeader: true,
          AccordionContent: true,
          Tag: true,
          Skeleton: true,
          Divider: true,
          ConfirmDialog: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
        },
      },
    });

    await flushPromises();

    // Verify stores were called
    expect(roundStore.fetchRounds).toHaveBeenCalledWith(1);
    expect(raceStore.fetchRaces).toHaveBeenCalledWith(1);
    expect(trackStore.fetchTracks).toHaveBeenCalledWith({ platform_id: 1, is_active: true });

    // Get component instance to test computed properties
    const vm = wrapper.vm as unknown as {
      racesByRound: Map<number, Race[]>;
      qualifiersByRound: Map<number, Race | null>;
      getRaces: (roundId: number) => Race[];
      getQualifier: (roundId: number) => Race | null;
    };

    // Verify races are properly organized
    expect(vm.getRaces(1)).toHaveLength(1);
    expect(vm.getRaces(1)[0]?.id).toBe(1);
    expect(vm.getQualifier(1)?.id).toBe(2);

    // Verify reactivity by adding a new race
    const newRace: Race = {
      id: 3,
      round_id: 1,
      race_number: 2,
      name: 'Sprint Race',
      race_type: 'sprint',
      qualifying_format: 'none',
      qualifying_length: null,
      qualifying_tire: null,
      grid_source: 'qualifying',
      grid_source_race_id: null,
      length_type: 'laps',
      length_value: 10,
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
      race_divisions: false,
      points_system: { 1: 25, 2: 18, 3: 15 },
      bonus_points: null,
      dnf_points: 0,
      dns_points: 0,
      race_notes: null,
      is_qualifier: false,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
    };

    raceStore.races = [...raceStore.races, newRace];
    await wrapper.vm.$nextTick();

    // Verify new race appears
    expect(vm.getRaces(1)).toHaveLength(2);
    expect(vm.getRaces(1).find((r) => r.id === 3)).toBeDefined();
  });

  it('should filter races and qualifiers correctly', async () => {
    const mockRound: Round = {
      id: 1,
      season_id: 1,
      platform_track_id: 1,
      round_number: 1,
      name: 'Test Round',
      slug: 'test-round',
      scheduled_at: '2025-01-15T10:00:00Z',
      timezone: 'UTC',
      track_layout: null,
      track_conditions: null,
      technical_notes: null,
      stream_url: null,
      internal_notes: null,
      status: 'scheduled',
      status_label: 'Scheduled',
      created_by_user_id: 1,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      deleted_at: null,
    };

    const baseRaceFields = {
      qualifying_format: 'none' as const,
      qualifying_length: null,
      qualifying_tire: null,
      grid_source: 'qualifying' as const,
      grid_source_race_id: null,
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
      race_divisions: false,
      points_system: { 1: 25, 2: 18, 3: 15 },
      bonus_points: null,
      dnf_points: 0,
      dns_points: 0,
      race_notes: null,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
    };

    roundStore.rounds = [mockRound];
    raceStore.races = [
      {
        ...baseRaceFields,
        id: 1,
        round_id: 1,
        race_number: 1,
        name: 'Race 1',
        race_type: 'feature' as const,
        length_type: 'laps' as const,
        length_value: 20,
        is_qualifier: false,
      },
      {
        ...baseRaceFields,
        id: 2,
        round_id: 1,
        race_number: 0,
        name: 'Qualifying',
        race_type: 'qualifying' as const,
        qualifying_format: 'standard' as const,
        qualifying_length: 15,
        length_type: 'time' as const,
        length_value: 15,
        points_system: {},
        is_qualifier: true,
      },
      {
        ...baseRaceFields,
        id: 3,
        round_id: 1,
        race_number: 2,
        name: 'Race 2',
        race_type: 'sprint' as const,
        length_type: 'laps' as const,
        length_value: 15,
        is_qualifier: false,
      },
    ];

    const wrapper = mount(RoundsPanel, {
      props: {
        seasonId: 1,
        platformId: 1,
      },
      global: {
        stubs: {
          BasePanel: true,
          Button: true,
          Accordion: true,
          AccordionPanel: true,
          AccordionHeader: true,
          AccordionContent: true,
          Tag: true,
          Skeleton: true,
          Divider: true,
          ConfirmDialog: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
        },
      },
    });

    await flushPromises();

    const vm = wrapper.vm as unknown as {
      getRaces: (roundId: number) => Race[];
      getQualifier: (roundId: number) => Race | null;
    };

    // Should get only races (not qualifiers)
    const races = vm.getRaces(1);
    expect(races).toHaveLength(2);
    expect(races.every((r) => r.race_type !== 'qualifying')).toBe(true);

    // Should get the qualifier
    const qualifier = vm.getQualifier(1);
    expect(qualifier).toBeDefined();
    expect(qualifier?.race_type).toBe('qualifying');
  });
});
