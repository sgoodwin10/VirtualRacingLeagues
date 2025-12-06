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
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      points_system: null,
      round_points: false,
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
      race_points: false,
      points_system: { 1: 25, 2: 18, 3: 15 },
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      dnf_points: 0,
      dns_points: 0,
      race_notes: null,
      is_qualifier: false,
      status: 'scheduled' as const,
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
      race_points: false,
      points_system: {},
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      dnf_points: 0,
      dns_points: 0,
      race_notes: null,
      is_qualifier: true,
      status: 'scheduled' as const,
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
          ToggleSwitch: true,
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
      allRaceEventsByRound: Map<number, Race[]>;
      getAllRaceEvents: (roundId: number) => Race[];
    };

    // Verify all race events are properly organized (unified list)
    const allEvents = vm.getAllRaceEvents(1);
    expect(allEvents).toHaveLength(2); // 1 race + 1 qualifier
    expect(allEvents.find((r) => r.id === 1)).toBeDefined(); // Race
    expect(allEvents.find((r) => r.id === 2)).toBeDefined(); // Qualifier
    expect(allEvents.find((r) => r.is_qualifier === true)?.id).toBe(2);

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
      race_points: false,
      points_system: { 1: 25, 2: 18, 3: 15 },
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      dnf_points: 0,
      dns_points: 0,
      race_notes: null,
      is_qualifier: false,
      status: 'scheduled' as const,
      created_at: '2025-01-01T11:00:00Z', // Later timestamp
      updated_at: '2025-01-01T11:00:00Z',
    };

    raceStore.races = [...raceStore.races, newRace];
    await wrapper.vm.$nextTick();

    // Verify new race appears in unified list
    const updatedEvents = vm.getAllRaceEvents(1);
    expect(updatedEvents).toHaveLength(3); // 2 races + 1 qualifier
    expect(updatedEvents.find((r) => r.id === 3)).toBeDefined();
  });

  it('should sort all race events by created_at timestamp', async () => {
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
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      points_system: null,
      round_points: false,
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
      race_points: false,
      points_system: { 1: 25, 2: 18, 3: 15 },
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      dnf_points: 0,
      dns_points: 0,
      race_notes: null,
      updated_at: '2025-01-01T10:00:00Z',
    };

    roundStore.rounds = [mockRound];
    // Create races with different created_at timestamps (not in order)
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
        status: 'scheduled' as const,
        created_at: '2025-01-01T12:00:00Z', // Third (newest)
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
        status: 'scheduled' as const,
        created_at: '2025-01-01T10:00:00Z', // First (oldest)
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
        status: 'scheduled' as const,
        created_at: '2025-01-01T11:00:00Z', // Second
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
          ConfirmDialog: true,
          ToggleSwitch: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
        },
      },
    });

    await flushPromises();

    const vm = wrapper.vm as unknown as {
      getAllRaceEvents: (roundId: number) => Race[];
    };

    // Should get all events (races + qualifiers) sorted by created_at
    const allEvents = vm.getAllRaceEvents(1);
    expect(allEvents).toHaveLength(3);

    // Verify they're sorted by created_at (ascending - oldest first)
    expect(allEvents[0]?.id).toBe(2); // Qualifier (10:00)
    expect(allEvents[1]?.id).toBe(3); // Race 2 (11:00)
    expect(allEvents[2]?.id).toBe(1); // Race 1 (12:00)

    // Verify qualifier can be identified by is_qualifier flag
    const qualifier = allEvents.find((r) => r.is_qualifier === true);
    expect(qualifier).toBeDefined();
    expect(qualifier?.race_type).toBe('qualifying');
    expect(qualifier?.id).toBe(2);
  });

  it('should apply progressive color gradient to round number boxes using default grayscale', async () => {
    // Create multiple rounds to test gradient
    const mockRounds: Round[] = [
      {
        id: 1,
        season_id: 1,
        platform_track_id: 1,
        round_number: 1,
        name: 'Round 1',
        slug: 'round-1',
        scheduled_at: '2025-01-15T10:00:00Z',
        timezone: 'UTC',
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
        round_points: false,
        status: 'scheduled',
        status_label: 'Scheduled',
        created_by_user_id: 1,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        deleted_at: null,
      },
      {
        id: 2,
        season_id: 1,
        platform_track_id: 1,
        round_number: 2,
        name: 'Round 2',
        slug: 'round-2',
        scheduled_at: '2025-01-22T10:00:00Z',
        timezone: 'UTC',
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
        round_points: false,
        status: 'scheduled',
        status_label: 'Scheduled',
        created_by_user_id: 1,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        deleted_at: null,
      },
      {
        id: 3,
        season_id: 1,
        platform_track_id: 1,
        round_number: 3,
        name: 'Round 3',
        slug: 'round-3',
        scheduled_at: '2025-01-29T10:00:00Z',
        timezone: 'UTC',
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
        round_points: false,
        status: 'scheduled',
        status_label: 'Scheduled',
        created_by_user_id: 1,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        deleted_at: null,
      },
    ];

    roundStore.rounds = mockRounds;

    const wrapper = mount(RoundsPanel, {
      props: {
        seasonId: 1,
        platformId: 1,
        competitionColour: null, // No competition color, should use grayscale
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
          ConfirmDialog: true,
          ToggleSwitch: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
        },
      },
    });

    await flushPromises();

    const vm = wrapper.vm as unknown as {
      getRoundBackgroundColor: (index: number) => string;
    };

    // Test base color (index 0) - should be slate-300 (#cbd5e1 = rgb(203, 213, 225))
    const color0 = vm.getRoundBackgroundColor(0);
    expect(color0).toBe('rgb(203, 213, 225)');

    // Test first darker round (index 1) - 10% darker (multiply by 0.9)
    const color1 = vm.getRoundBackgroundColor(1);
    expect(color1).toBe('rgb(183, 192, 203)'); // 203*0.9=182.7, 213*0.9=191.7, 225*0.9=202.5

    // Test second darker round (index 2) - 19% darker (multiply by 0.9^2 = 0.81)
    const color2 = vm.getRoundBackgroundColor(2);
    expect(color2).toBe('rgb(164, 173, 182)'); // 203*0.81=164.43, 213*0.81=172.53, 225*0.81=182.25

    // Verify colors get progressively darker
    const rgb0 = color0.match(/\d+/g)?.map(Number) || [];
    const rgb1 = color1.match(/\d+/g)?.map(Number) || [];
    const rgb2 = color2.match(/\d+/g)?.map(Number) || [];

    // Each channel should be darker
    expect(rgb1[0]!).toBeLessThan(rgb0[0]!); // Red
    expect(rgb1[1]!).toBeLessThan(rgb0[1]!); // Green
    expect(rgb1[2]!).toBeLessThan(rgb0[2]!); // Blue

    expect(rgb2[0]!).toBeLessThan(rgb1[0]!); // Red
    expect(rgb2[1]!).toBeLessThan(rgb1[1]!); // Green
    expect(rgb2[2]!).toBeLessThan(rgb1[2]!); // Blue
  });

  it('should apply competition color range when competition color is provided', async () => {
    const mockRounds: Round[] = [
      {
        id: 1,
        season_id: 1,
        platform_track_id: 1,
        round_number: 1,
        name: 'Round 1',
        slug: 'round-1',
        scheduled_at: '2025-01-15T10:00:00Z',
        timezone: 'UTC',
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
        round_points: false,
        status: 'scheduled',
        status_label: 'Scheduled',
        created_by_user_id: 1,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        deleted_at: null,
      },
      {
        id: 2,
        season_id: 1,
        platform_track_id: 1,
        round_number: 2,
        name: 'Round 2',
        slug: 'round-2',
        scheduled_at: '2025-01-22T10:00:00Z',
        timezone: 'UTC',
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
        round_points: false,
        status: 'scheduled',
        status_label: 'Scheduled',
        created_by_user_id: 1,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        deleted_at: null,
      },
    ];

    roundStore.rounds = mockRounds;

    // Light orange color
    const competitionColour = JSON.stringify({ r: 227, g: 140, b: 18 });

    const wrapper = mount(RoundsPanel, {
      props: {
        seasonId: 1,
        platformId: 1,
        competitionColour,
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
          ConfirmDialog: true,
          ToggleSwitch: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
        },
      },
    });

    await flushPromises();

    const vm = wrapper.vm as unknown as {
      getRoundBackgroundColor: (index: number) => string;
    };

    const color0 = vm.getRoundBackgroundColor(0);
    const color1 = vm.getRoundBackgroundColor(1);

    // Both should be valid RGB strings
    expect(color0).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(color1).toMatch(/^rgb\(\d+, \d+, \d+\)$/);

    // Colors should not be the grayscale default
    expect(color0).not.toBe('rgb(203, 213, 225)');

    // Extract RGB values
    const rgb0 = color0.match(/\d+/g)?.map(Number) || [];
    const rgb1 = color1.match(/\d+/g)?.map(Number) || [];

    // All RGB values should be within valid range
    [...rgb0, ...rgb1].forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    });
  });

  it('should reload tracks after saving a round to prevent track display issues', async () => {
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
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      points_system: null,
      round_points: false,
      status: 'scheduled',
      status_label: 'Scheduled',
      created_by_user_id: 1,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      deleted_at: null,
    };

    roundStore.rounds = [mockRound];

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
          ConfirmDialog: true,
          ToggleSwitch: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
        },
      },
    });

    await flushPromises();

    // Clear the initial calls
    vi.clearAllMocks();

    // Get the component instance and call handleRoundSaved
    const vm = wrapper.vm as unknown as {
      handleRoundSaved: () => Promise<void>;
    };

    await vm.handleRoundSaved();

    // Verify that both rounds and tracks are reloaded
    expect(roundStore.fetchRounds).toHaveBeenCalledWith(1);
    expect(trackStore.fetchTracks).toHaveBeenCalledWith({ platform_id: 1, is_active: true });
  });

  it('should hide "Add Event" button when round status is completed', async () => {
    const completedRound: Round = {
      id: 1,
      season_id: 1,
      platform_track_id: 1,
      round_number: 1,
      name: 'Completed Round',
      slug: 'completed-round',
      scheduled_at: '2025-01-15T10:00:00Z',
      timezone: 'UTC',
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
      round_points: false,
      status: 'completed',
      status_label: 'Completed',
      created_by_user_id: 1,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      deleted_at: null,
    };

    roundStore.rounds = [completedRound];

    const wrapper = mount(RoundsPanel, {
      props: {
        seasonId: 1,
        platformId: 1,
      },
    });

    await flushPromises();

    // Find the wrapping div that should be conditionally rendered
    // When status is 'completed', the v-if should prevent the div from rendering
    const addEventWrapper = wrapper.find('[class*="flex items-center gap-2"]');
    const buttons = addEventWrapper.findAll('button');
    const addEventButton = buttons.find((btn) => btn.text().includes('Add Event'));

    expect(addEventButton).toBeUndefined();
  });

  it('should show "Add Event" button when round status is not completed', async () => {
    const scheduledRound: Round = {
      id: 1,
      season_id: 1,
      platform_track_id: 1,
      round_number: 1,
      name: 'Scheduled Round',
      slug: 'scheduled-round',
      scheduled_at: '2025-01-15T10:00:00Z',
      timezone: 'UTC',
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
      round_points: false,
      status: 'scheduled',
      status_label: 'Scheduled',
      created_by_user_id: 1,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      deleted_at: null,
    };

    roundStore.rounds = [scheduledRound];

    const wrapper = mount(RoundsPanel, {
      props: {
        seasonId: 1,
        platformId: 1,
      },
    });

    await flushPromises();

    // Find buttons with "Add Event" text
    const buttons = wrapper.findAll('button');
    const addEventButton = buttons.find((btn) => btn.text().includes('Add Event'));

    expect(addEventButton).toBeDefined();
  });

  it('should format round points tooltip with all configuration details', async () => {
    const roundWithPoints: Round = {
      id: 1,
      season_id: 1,
      platform_track_id: 1,
      round_number: 1,
      name: 'Round with Points',
      slug: 'round-with-points',
      scheduled_at: '2025-01-15T10:00:00Z',
      timezone: 'UTC',
      track_layout: null,
      track_conditions: null,
      technical_notes: null,
      stream_url: null,
      internal_notes: null,
      fastest_lap: 1,
      fastest_lap_top_10: true,
      qualifying_pole: 3,
      qualifying_pole_top_10: false,
      points_system: JSON.stringify({ 1: 25, 2: 18, 3: 15, 4: 12, 5: 10 }),
      round_points: true,
      status: 'scheduled',
      status_label: 'Scheduled',
      created_by_user_id: 1,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      deleted_at: null,
    };

    roundStore.rounds = [roundWithPoints];

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
          ConfirmDialog: true,
          ToggleSwitch: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
        },
      },
    });

    await flushPromises();

    const vm = wrapper.vm as unknown as {
      formatRoundPointsTooltip: (round: Round) => string;
    };

    const tooltipText = vm.formatRoundPointsTooltip(roundWithPoints);

    // Should contain header
    expect(tooltipText).toContain('Round Points Configuration');

    // Should contain position points with grid layout
    expect(tooltipText).toContain('Position Points:');
    expect(tooltipText).toContain(
      '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem 0.5rem; margin-top: 0.5rem;">',
    );
    // Check that position points are present (format is <span class="w-6">P1:</span> 25)
    expect(tooltipText).toContain('P1:');
    expect(tooltipText).toContain('25');
    expect(tooltipText).toContain('P2:');
    expect(tooltipText).toContain('18');
    expect(tooltipText).toContain('P5:');
    expect(tooltipText).toContain('10');

    // Should contain bonus points
    expect(tooltipText).toContain('Bonus Points:');
    expect(tooltipText).toContain('Fastest Lap: +1 pts (Top 10 only)');
    expect(tooltipText).toContain('Pole Position: +3 pts');
  });

  it('should format round points tooltip without bonus points when none configured', async () => {
    const roundWithoutBonuses: Round = {
      id: 1,
      season_id: 1,
      platform_track_id: 1,
      round_number: 1,
      name: 'Round without Bonuses',
      slug: 'round-without-bonuses',
      scheduled_at: '2025-01-15T10:00:00Z',
      timezone: 'UTC',
      track_layout: null,
      track_conditions: null,
      technical_notes: null,
      stream_url: null,
      internal_notes: null,
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      points_system: JSON.stringify({ 1: 25, 2: 18, 3: 15 }),
      round_points: true,
      status: 'scheduled',
      status_label: 'Scheduled',
      created_by_user_id: 1,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      deleted_at: null,
    };

    roundStore.rounds = [roundWithoutBonuses];

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
          ConfirmDialog: true,
          ToggleSwitch: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
        },
      },
    });

    await flushPromises();

    const vm = wrapper.vm as unknown as {
      formatRoundPointsTooltip: (round: Round) => string;
    };

    const tooltipText = vm.formatRoundPointsTooltip(roundWithoutBonuses);

    // Should contain header
    expect(tooltipText).toContain('Round Points Configuration');

    // Should contain position points with grid layout
    expect(tooltipText).toContain('Position Points:');
    expect(tooltipText).toContain(
      '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem 0.5rem; margin-top: 0.5rem;">',
    );
    expect(tooltipText).toContain('P1:');
    expect(tooltipText).toContain('25');
    expect(tooltipText).toContain('P2:');
    expect(tooltipText).toContain('18');
    expect(tooltipText).toContain('P3:');
    expect(tooltipText).toContain('15');

    // Should indicate no bonus points
    expect(tooltipText).toContain('Bonus Points:');
    expect(tooltipText).toContain('None');
  });

  it('should not show skeleton loading after initial load when toggling completion status', async () => {
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
      fastest_lap: null,
      fastest_lap_top_10: false,
      qualifying_pole: null,
      qualifying_pole_top_10: false,
      points_system: null,
      round_points: false,
      status: 'scheduled',
      status_label: 'Scheduled',
      created_by_user_id: 1,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      deleted_at: null,
    };

    roundStore.rounds = [mockRound];

    // Mock completeRound to simulate loading behavior
    vi.spyOn(roundStore, 'completeRound').mockImplementation(async (roundId: number) => {
      const round = roundStore.rounds.find((r) => r.id === roundId);
      if (round) {
        round.status = 'completed';
        round.status_label = 'Completed';
      }

      return round!;
    });

    const wrapper = mount(RoundsPanel, {
      props: {
        seasonId: 1,
        platformId: 1,
      },
      global: {
        stubs: {
          BasePanel: true,
          Button: true,
          Tag: true,
          Skeleton: true,
          ConfirmDialog: true,
          ToggleSwitch: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
          Accordion: true,
          AccordionPanel: true,
          AccordionHeader: true,
          AccordionContent: true,
        },
      },
    });

    await flushPromises();

    // After initial mount, skeleton should not be visible
    expect(wrapper.find('[class*="space-y-4"]').exists()).toBe(false);

    const vm = wrapper.vm as unknown as {
      handleToggleCompletion: (round: Round) => Promise<void>;
      initialLoadComplete: boolean;
    };

    // Verify initialLoadComplete is true after mount
    expect(vm.initialLoadComplete).toBe(true);

    // Toggle completion status
    await vm.handleToggleCompletion(mockRound);
    await wrapper.vm.$nextTick();

    // Even though roundStore.isLoading might temporarily be true during the toggle,
    // the skeleton should NOT show because initialLoadComplete is true
    expect(wrapper.find('[class*="space-y-4"]').exists()).toBe(false);
  });

  it('should preserve accordion state when toggling round completion status', async () => {
    // Create two rounds to test accordion state preservation
    const mockRounds: Round[] = [
      {
        id: 1,
        season_id: 1,
        platform_track_id: 1,
        round_number: 1,
        name: 'Round 1',
        slug: 'round-1',
        scheduled_at: '2025-01-15T10:00:00Z',
        timezone: 'UTC',
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
        round_points: false,
        status: 'scheduled',
        status_label: 'Scheduled',
        created_by_user_id: 1,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        deleted_at: null,
      },
      {
        id: 2,
        season_id: 1,
        platform_track_id: 1,
        round_number: 2,
        name: 'Round 2',
        slug: 'round-2',
        scheduled_at: '2025-01-22T10:00:00Z',
        timezone: 'UTC',
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
        round_points: false,
        status: 'scheduled',
        status_label: 'Scheduled',
        created_by_user_id: 1,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        deleted_at: null,
      },
    ];

    roundStore.rounds = mockRounds;

    // Mock the completeRound and uncompleteRound methods
    vi.spyOn(roundStore, 'completeRound').mockImplementation(async (roundId: number) => {
      const round = roundStore.rounds.find((r) => r.id === roundId);
      if (round) {
        round.status = 'completed';
        round.status_label = 'Completed';
        return round;
      }
      throw new Error('Round not found');
    });

    vi.spyOn(roundStore, 'uncompleteRound').mockImplementation(async (roundId: number) => {
      const round = roundStore.rounds.find((r) => r.id === roundId);
      if (round) {
        round.status = 'scheduled';
        round.status_label = 'Scheduled';
        return round;
      }
      throw new Error('Round not found');
    });

    const wrapper = mount(RoundsPanel, {
      props: {
        seasonId: 1,
        platformId: 1,
      },
      global: {
        stubs: {
          BasePanel: true,
          Button: true,
          Tag: true,
          Skeleton: true,
          ConfirmDialog: true,
          ToggleSwitch: true,
          RoundFormDrawer: true,
          RaceFormDrawer: true,
          RaceListItem: true,
          QualifierListItem: true,
          RaceResultModal: true,
          RoundResultsModal: true,
        },
      },
    });

    await flushPromises();

    // Access the component's activeIndexes ref
    const vm = wrapper.vm as unknown as {
      activeIndexes: number[];
      handleToggleCompletion: (round: Round) => Promise<void>;
    };

    // Initially no panels are open
    expect(vm.activeIndexes).toEqual([]);

    // Simulate opening the first round's accordion panel
    vm.activeIndexes.push(1);
    await wrapper.vm.$nextTick();

    // Verify first round is now in activeIndexes
    expect(vm.activeIndexes).toContain(1);
    expect(vm.activeIndexes).toHaveLength(1);

    // Toggle completion status of the second round (not the one that's open)
    const round2 = mockRounds[1]!;
    await vm.handleToggleCompletion(round2);
    await wrapper.vm.$nextTick();
    await flushPromises();

    // The activeIndexes should still contain round 1 (the open accordion should stay open)
    expect(vm.activeIndexes).toContain(1);
    expect(vm.activeIndexes).toHaveLength(1);

    // Verify the second round's status was actually updated
    expect(round2.status).toBe('completed');
  });
});
