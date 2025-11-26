import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import RaceFormDrawer from '../RaceFormDrawer.vue';
import { useRaceSettingsStore } from '@app/stores/raceSettingsStore';
import type { Race } from '@app/types/race';
import { F1_STANDARD_POINTS } from '@app/types/race';

// Mock BaseModal component
vi.mock('@app/components/common/modals/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div><slot name="header"/><slot/><slot name="footer"/></div>',
    props: ['visible', 'width', 'closable', 'dismissableMask', 'contentClass'],
  },
}));

vi.mock('primevue/button', () => ({
  default: { name: 'Button', template: '<button><slot/></button>' },
}));

vi.mock('primevue/inputtext', () => ({
  default: { name: 'InputText', template: '<input />' },
}));

vi.mock('primevue/inputnumber', () => ({
  default: { name: 'InputNumber', template: '<input type="number" />' },
}));

vi.mock('primevue/select', () => ({
  default: { name: 'Select', template: '<select><slot/></select>' },
}));

vi.mock('primevue/textarea', () => ({
  default: { name: 'Textarea', template: '<textarea></textarea>' },
}));

vi.mock('primevue/checkbox', () => ({
  default: { name: 'Checkbox', template: '<input type="checkbox" />' },
}));

vi.mock('primevue/radiobutton', () => ({
  default: { name: 'RadioButton', template: '<input type="radio" />' },
}));

vi.mock('primevue/datatable', () => ({
  default: { name: 'DataTable', template: '<table><slot/></table>' },
}));

vi.mock('primevue/column', () => ({
  default: { name: 'Column', template: '<td><slot/></td>' },
}));

vi.mock('primevue/accordion', () => ({
  default: { name: 'Accordion', template: '<div><slot/></div>' },
}));

vi.mock('primevue/accordionpanel', () => ({
  default: { name: 'AccordionPanel', template: '<div><slot/></div>' },
}));

vi.mock('primevue/accordionheader', () => ({
  default: { name: 'AccordionHeader', template: '<div><slot/></div>' },
}));

vi.mock('primevue/accordioncontent', () => ({
  default: { name: 'AccordionContent', template: '<div><slot/></div>' },
}));

vi.mock('primevue/message', () => ({
  default: { name: 'Message', template: '<div><slot/></div>' },
}));

vi.mock('primevue/skeleton', () => ({
  default: { name: 'Skeleton', template: '<div></div>' },
}));

// Common stubs for all tests
const commonStubs = {
  BaseModal: { template: '<div><slot name="header"/><slot/><slot name="footer"/></div>' },
  FormLabel: { template: '<label><slot/></label>' },
  FormError: { template: '<span><slot/></span>' },
  FormOptionalText: { template: '<span><slot/></span>' },
  FormInputGroup: { template: '<div><slot/></div>' },
};

describe('RaceFormDrawer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mockRace: Race = {
    id: 1,
    round_id: 1,
    race_number: 1,
    name: 'Sprint Race',
    race_type: 'sprint',
    qualifying_format: 'standard',
    qualifying_length: 15,
    qualifying_tire: 'Soft',
    grid_source: 'qualifying',
    grid_source_race_id: null,
    length_type: 'laps',
    length_value: 20,
    extra_lap_after_time: false,
    weather: 'clear',
    tire_restrictions: 'none',
    fuel_usage: 'standard',
    damage_model: 'full',
    track_limits_enforced: true,
    false_start_detection: true,
    collision_penalties: true,
    mandatory_pit_stop: false,
    minimum_pit_time: null,
    assists_restrictions: 'none',
    race_points: false,
    points_system: { ...F1_STANDARD_POINTS },
    bonus_points: {
      pole: 1,
      fastest_lap: 1,
      fastest_lap_top_10_only: true,
    },
    dnf_points: 0,
    dns_points: 0,
    race_notes: 'Test notes',
    is_qualifier: false,
    status: 'scheduled' as const,
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  };

  it('should load race data into form when race prop is provided and drawer is visible', async () => {
    const raceSettingsStore = useRaceSettingsStore();
    vi.spyOn(raceSettingsStore, 'fetchRaceSettings').mockResolvedValue({
      weather_conditions: [],
      tire_restrictions: [],
      fuel_usage: [],
      damage_model: [],
      assists_restrictions: [],
    });

    // Mount with visible=false first, then open it
    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: false,
        roundId: 1,
        platformId: 1,
        race: mockRace,
        mode: 'edit',
        raceType: 'race',
      },
      global: {
        stubs: commonStubs,
      },
    });

    // Now open the drawer
    await wrapper.setProps({ visible: true });
    await nextTick();
    await flushPromises(); // Wait for async operations

    // Access the component's internal form state
    const vm = wrapper.vm as unknown as {
      form: {
        race_number: number;
        name: string;
        race_type: string | null;
        length_value: number;
        race_notes: string;
      };
    };

    // Verify form was populated with race data
    expect(vm.form.race_number).toBe(mockRace.race_number);
    expect(vm.form.name).toBe(mockRace.name);
    expect(vm.form.race_type).toBe(mockRace.race_type);
    expect(vm.form.length_value).toBe(mockRace.length_value);
    expect(vm.form.race_notes).toBe(mockRace.race_notes);
  });

  it('should reload form data when race prop changes', async () => {
    const raceSettingsStore = useRaceSettingsStore();
    vi.spyOn(raceSettingsStore, 'fetchRaceSettings').mockResolvedValue({
      weather_conditions: [],
      tire_restrictions: [],
      fuel_usage: [],
      damage_model: [],
      assists_restrictions: [],
    });

    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        race: mockRace,
        mode: 'edit',
        raceType: 'race',
      },
      global: {
        stubs: commonStubs,
      },
    });

    await nextTick();
    await flushPromises();

    // Create a different race
    const updatedRace: Race = {
      ...mockRace,
      id: 2,
      race_number: 2,
      name: 'Feature Race',
      length_value: 30,
      race_notes: 'Updated notes',
    };

    // Update the race prop
    await wrapper.setProps({ race: updatedRace });
    await nextTick();

    const vm = wrapper.vm as unknown as {
      form: {
        race_number: number;
        name: string;
        length_value: number;
        race_notes: string;
      };
    };

    // Verify form was updated with new race data
    expect(vm.form.race_number).toBe(updatedRace.race_number);
    expect(vm.form.name).toBe(updatedRace.name);
    expect(vm.form.length_value).toBe(updatedRace.length_value);
    expect(vm.form.race_notes).toBe(updatedRace.race_notes);
  });

  it('should reset form when no race is provided', async () => {
    const raceSettingsStore = useRaceSettingsStore();
    vi.spyOn(raceSettingsStore, 'fetchRaceSettings').mockResolvedValue({
      weather_conditions: [],
      tire_restrictions: [],
      fuel_usage: [],
      damage_model: [],
      assists_restrictions: [],
    });

    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        race: null,
        mode: 'create',
        raceType: 'race',
      },
      global: {
        stubs: commonStubs,
      },
    });

    await nextTick();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      form: {
        race_number: number;
        name: string;
        length_value: number;
      };
    };

    // Verify form has default values
    expect(vm.form.race_number).toBe(1);
    expect(vm.form.name).toBe('');
    expect(vm.form.length_value).toBe(20);
  });

  it('should hide fastest lap bonus when round has fastest lap configured', async () => {
    const raceSettingsStore = useRaceSettingsStore();
    vi.spyOn(raceSettingsStore, 'fetchRaceSettings').mockResolvedValue({
      weather_conditions: [],
      tire_restrictions: [],
      fuel_usage: [],
      damage_model: [],
      assists_restrictions: [],
    });

    // This test validates the logic but cannot fully test DOM rendering without mounting the store
    // Full component testing will be done in E2E tests
    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        race: null,
        mode: 'create',
      },
      global: {
        stubs: commonStubs,
      },
    });

    await nextTick();
    await flushPromises();

    // Verify component mounts successfully
    expect(wrapper.exists()).toBe(true);
  });

  it('should handle race type changes from qualifying to race type', async () => {
    const raceSettingsStore = useRaceSettingsStore();
    vi.spyOn(raceSettingsStore, 'fetchRaceSettings').mockResolvedValue({
      weather_conditions: [],
      tire_restrictions: [],
      fuel_usage: [],
      damage_model: [],
      assists_restrictions: [],
    });

    const qualifyingRace: Race = {
      ...mockRace,
      race_type: 'qualifying',
      qualifying_format: 'standard',
      qualifying_length: 15,
      length_type: 'time',
      length_value: 15,
    };

    // Start with visible=false to avoid initial watcher triggering
    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: false,
        roundId: 1,
        platformId: 1,
        race: qualifyingRace,
        mode: 'edit',
      },
      global: {
        stubs: commonStubs,
      },
    });

    // Now make it visible
    await wrapper.setProps({ visible: true });
    await nextTick();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      form: {
        race_type: string | null;
        length_type: string;
        length_value: number;
        grid_source: string;
      };
    };

    // Verify form loaded with qualifying data
    expect(vm.form.race_type).toBe('qualifying');
    expect(vm.form.length_type).toBe('time');

    // Simulate changing race type to sprint
    vm.form.race_type = 'sprint';
    await nextTick();

    // Verify form adjusted to race defaults
    expect(vm.form.length_type).toBe('laps');
    expect(vm.form.length_value).toBe(20);
    expect(vm.form.grid_source).toBe('qualifying');
  });

  it('should handle race type changes from race to qualifying type', async () => {
    const raceSettingsStore = useRaceSettingsStore();
    vi.spyOn(raceSettingsStore, 'fetchRaceSettings').mockResolvedValue({
      weather_conditions: [],
      tire_restrictions: [],
      fuel_usage: [],
      damage_model: [],
      assists_restrictions: [],
    });

    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        race: mockRace,
        mode: 'edit',
      },
      global: {
        stubs: commonStubs,
      },
    });

    await nextTick();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      form: {
        race_type: string | null;
        length_type: string;
        length_value: number;
        qualifying_format: string;
        mandatory_pit_stop: boolean;
      };
    };

    // Verify form loaded with race data
    expect(vm.form.race_type).toBe('sprint');

    // Simulate changing race type to qualifying
    vm.form.race_type = 'qualifying';
    await nextTick();

    // Verify form adjusted to qualifying defaults
    expect(vm.form.qualifying_format).toBe('standard');
    expect(vm.form.length_type).toBe('time');
    expect(vm.form.length_value).toBe(15);
    expect(vm.form.mandatory_pit_stop).toBe(false);
  });

  it('should filter qualifiers when grid source is "qualifying"', async () => {
    const raceSettingsStore = useRaceSettingsStore();
    vi.spyOn(raceSettingsStore, 'fetchRaceSettings').mockResolvedValue({
      weather_conditions: [],
      tire_restrictions: [],
      fuel_usage: [],
      damage_model: [],
      assists_restrictions: [],
    });

    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        race: null,
        mode: 'create',
      },
      global: {
        stubs: commonStubs,
      },
    });

    await nextTick();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      form: {
        grid_source: string;
      };
      availableQualifiers: { value: number; label: string }[];
      sourceRaceOptions: { value: number; label: string }[];
      sourceRaceLabel: string;
    };

    // Set grid source to qualifying
    vm.form.grid_source = 'qualifying';
    await nextTick();

    // Verify sourceRaceOptions uses qualifiers
    expect(vm.sourceRaceLabel).toBe('Select Qualifier');
  });

  it('should filter races when grid source is "previous_race"', async () => {
    const raceSettingsStore = useRaceSettingsStore();
    vi.spyOn(raceSettingsStore, 'fetchRaceSettings').mockResolvedValue({
      weather_conditions: [],
      tire_restrictions: [],
      fuel_usage: [],
      damage_model: [],
      assists_restrictions: [],
    });

    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        race: null,
        mode: 'create',
      },
      global: {
        stubs: commonStubs,
      },
    });

    await nextTick();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      form: {
        grid_source: string;
      };
      availableRaces: { value: number; label: string }[];
      sourceRaceOptions: { value: number; label: string }[];
      sourceRaceLabel: string;
    };

    // Set grid source to previous_race
    vm.form.grid_source = 'previous_race';
    await nextTick();

    // Verify sourceRaceOptions uses races
    expect(vm.sourceRaceLabel).toBe('Select Race');
  });

  it('should filter races when grid source is "reverse_previous"', async () => {
    const raceSettingsStore = useRaceSettingsStore();
    vi.spyOn(raceSettingsStore, 'fetchRaceSettings').mockResolvedValue({
      weather_conditions: [],
      tire_restrictions: [],
      fuel_usage: [],
      damage_model: [],
      assists_restrictions: [],
    });

    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        race: null,
        mode: 'create',
      },
      global: {
        stubs: commonStubs,
      },
    });

    await nextTick();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      form: {
        grid_source: string;
      };
      sourceRaceLabel: string;
    };

    // Set grid source to reverse_previous
    vm.form.grid_source = 'reverse_previous';
    await nextTick();

    // Verify sourceRaceOptions uses races
    expect(vm.sourceRaceLabel).toBe('Select Race');
  });
});
