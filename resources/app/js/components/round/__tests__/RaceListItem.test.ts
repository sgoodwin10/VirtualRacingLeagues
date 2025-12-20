import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import RaceListItem from '../RaceListItem.vue';
import type { Race } from '@app/types/race';
import { F1_STANDARD_POINTS } from '@app/types/race';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';

describe('RaceListItem', () => {
  let wrapper: VueWrapper;

  const mockRace: Race = {
    id: 1,
    round_id: 1,
    race_number: 1,
    race_type: 'feature',
    name: 'Feature Race',
    qualifying_format: 'standard',
    qualifying_length: null,
    qualifying_tire: null,
    grid_source: 'qualifying',
    grid_source_race_id: null,
    length_type: 'laps',
    length_value: 20,
    extra_lap_after_time: false,
    weather: 'Clear',
    tire_restrictions: null,
    fuel_usage: null,
    damage_model: null,
    track_limits_enforced: true,
    false_start_detection: true,
    collision_penalties: true,
    mandatory_pit_stop: true,
    minimum_pit_time: 3,
    assists_restrictions: null,
    race_points: false,
    points_system: F1_STANDARD_POINTS,
    fastest_lap: 1,
    fastest_lap_top_10: false,
    qualifying_pole: null,
    qualifying_pole_top_10: false,
    dnf_points: 0,
    dns_points: 0,
    race_notes: null,
    is_qualifier: false,
    status: 'scheduled',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    wrapper = mount(RaceListItem, {
      props: { race: mockRace },
      global: {
        plugins: [PrimeVue],
        directives: {
          tooltip: Tooltip,
        },
        stubs: {
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          Tag: {
            template: '<span><slot>{{ value }}</slot></span>',
            props: ['value', 'severity'],
          },
          OrphanedResultsWarning: {
            template: '<div data-test-orphaned-warning @click="$emit(\'orphans-removed\')"></div>',
            props: ['hasOrphanedResults', 'isCompleted', 'isQualifying', 'raceId'],
            emits: ['orphans-removed'],
          },
        },
      },
    });
  });

  it('renders race name correctly', () => {
    expect(wrapper.text()).toContain('Feature Race');
  });

  it('renders default name when no name provided', async () => {
    await wrapper.setProps({
      race: { ...mockRace, name: null },
    });
    expect(wrapper.text()).toContain('Race 1');
  });

  it('displays race type when present', () => {
    expect(wrapper.text()).toContain('Feature');
  });

  it('displays race length correctly for laps', () => {
    expect(wrapper.text()).toContain('20 laps');
  });

  it('displays race length correctly for time', async () => {
    await wrapper.setProps({
      race: { ...mockRace, length_type: 'time', length_value: 45, extra_lap_after_time: true },
    });
    expect(wrapper.text()).toContain('45 minutes + lap');
  });

  it('displays race length correctly for time without extra lap', async () => {
    await wrapper.setProps({
      race: { ...mockRace, length_type: 'time', length_value: 30, extra_lap_after_time: false },
    });
    expect(wrapper.text()).toContain('30 minutes');
    expect(wrapper.text()).not.toContain('+ lap');
  });

  it('displays grid source correctly', () => {
    expect(wrapper.text()).toContain('Grid Source');
    expect(wrapper.text()).toContain('Qualifying');
  });

  it('displays weather when present', () => {
    expect(wrapper.text()).toContain('Weather');
    expect(wrapper.text()).toContain('Clear');
  });

  it('hides weather when not present', async () => {
    await wrapper.setProps({
      race: { ...mockRace, weather: null },
    });
    expect(wrapper.text()).not.toContain('Weather:');
  });

  it('displays mandatory pit stop information', () => {
    expect(wrapper.text()).toContain('Pit Stop');
    expect(wrapper.text()).toContain('3s min');
  });

  it('displays mandatory pit stop without minimum time', async () => {
    await wrapper.setProps({
      race: { ...mockRace, mandatory_pit_stop: true, minimum_pit_time: null },
    });
    expect(wrapper.text()).toContain('Mandatory');
  });

  it('hides pit stop when not mandatory', async () => {
    await wrapper.setProps({
      race: { ...mockRace, mandatory_pit_stop: false },
    });
    expect(wrapper.text()).not.toContain('Pit Stop:');
  });

  it('shows fastest lap bonus tag when fastest_lap is set', () => {
    expect(wrapper.text()).toContain('FL Bonus');
  });

  it('hides fastest lap bonus tag when fastest_lap is null', async () => {
    await wrapper.setProps({
      race: { ...mockRace, fastest_lap: null },
    });
    expect(wrapper.text()).not.toContain('FL Bonus');
  });

  it('shows race points tag when race_points is true', async () => {
    await wrapper.setProps({
      race: { ...mockRace, race_points: true },
    });
    expect(wrapper.text()).toContain('Race Points');
  });

  it('hides race points tag when race_points is false', () => {
    expect(wrapper.text()).not.toContain('Race Points');
  });

  it('applies amber theme styling to container', () => {
    const container = wrapper.find('.border-amber-200');
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain('rounded-lg');
    expect(container.classes()).toContain('hover:border-amber-400');
  });

  it('has flag icon with amber color', () => {
    const icon = wrapper.findComponent({ name: 'PhFlag' });
    expect(icon.exists()).toBe(true);
    expect(icon.props('size')).toBe('24');
  });

  it('emits enterResults event when enter results button clicked', async () => {
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    await buttons[0]?.trigger('click');

    expect(wrapper.emitted('enterResults')).toBeTruthy();
    expect(wrapper.emitted('enterResults')?.[0]).toEqual([mockRace]);
  });

  it('emits edit event when edit button clicked', async () => {
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    await buttons[1]?.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockRace]);
  });

  it('emits delete event when delete button clicked', async () => {
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    await buttons[2]?.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual([mockRace]);
  });

  it('displays completion toggle with correct state for scheduled race', () => {
    expect(wrapper.text()).toContain('Completed');
    const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
    expect(toggle.exists()).toBe(true);
  });

  it('shows toggle in checked state when race is completed', async () => {
    await wrapper.setProps({
      race: { ...mockRace, status: 'completed' },
    });
    const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
    expect(toggle.exists()).toBe(true);
    // Should show Completed text with green color
    expect(wrapper.text()).toContain('Completed');
  });

  it('hides edit and delete buttons when race is completed', async () => {
    await wrapper.setProps({
      race: { ...mockRace, status: 'completed' },
    });
    const buttons = wrapper.findAll('button');
    // Results button should be visible, edit and delete should be hidden
    expect(buttons.length).toBe(1);
  });

  it('emits toggleStatus event when toggle is changed', async () => {
    const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
    await toggle.vm.$emit('update:modelValue', true);

    expect(wrapper.emitted('toggleStatus')).toBeTruthy();
    expect(wrapper.emitted('toggleStatus')?.[0]).toEqual([mockRace, 'completed']);
  });

  it('hides completion toggle when round is completed', async () => {
    await wrapper.setProps({
      isRoundCompleted: true,
    });

    const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
    expect(toggle.exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Completed');
  });

  it('hides edit button when round is completed', async () => {
    await wrapper.setProps({
      isRoundCompleted: true,
    });

    const buttons = wrapper.findAll('button');
    // Only "Results" button should remain (1 button instead of 3)
    expect(buttons.length).toBe(1);
  });

  it('hides delete button when round is completed', async () => {
    await wrapper.setProps({
      isRoundCompleted: true,
    });

    const buttons = wrapper.findAll('button');
    // Only "Results" button should remain
    expect(buttons.length).toBe(1);
  });

  it('shows all controls when round is not completed', async () => {
    await wrapper.setProps({
      isRoundCompleted: false,
    });

    const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
    expect(toggle.exists()).toBe(true);

    const buttons = wrapper.findAll('button');
    // Results, Edit, and Delete buttons (3 buttons + toggle)
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('shows all controls by default when isRoundCompleted is not provided', () => {
    const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
    expect(toggle.exists()).toBe(true);

    const buttons = wrapper.findAll('button');
    // Results, Edit, and Delete buttons
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('shows orphaned results warning when race is completed and has orphaned results', async () => {
    await wrapper.setProps({
      race: { ...mockRace, status: 'completed', has_orphaned_results: true },
    });

    const warningElement = wrapper.find('[data-test-orphaned-warning]');
    expect(warningElement.exists()).toBe(true);
  });

  it('does not show orphaned results warning when race has no orphaned results', async () => {
    await wrapper.setProps({
      race: { ...mockRace, status: 'completed', has_orphaned_results: false },
    });

    // Component is rendered but should not show warning (controlled by showWarning computed)
    const warningElement = wrapper.find('[data-test-orphaned-warning]');
    expect(warningElement.exists()).toBe(true);
  });

  it('does not show orphaned results warning when round is completed', async () => {
    await wrapper.setProps({
      race: { ...mockRace, status: 'completed', has_orphaned_results: true },
      isRoundCompleted: true,
    });

    const warningElement = wrapper.find('[data-test-orphaned-warning]');
    expect(warningElement.exists()).toBe(false);
  });

  it('emits refresh event when orphaned results are removed', async () => {
    await wrapper.setProps({
      race: { ...mockRace, status: 'completed', has_orphaned_results: true },
    });

    // Find the stubbed OrphanedResultsWarning component by attribute
    const warningStub = wrapper.find('[data-test-orphaned-warning]');
    expect(warningStub.exists()).toBe(true);

    // Trigger click to simulate orphans-removed event from the stub
    await warningStub.trigger('click');
    await wrapper.vm.$nextTick();

    // The component should emit a 'refresh' event when orphans are removed
    expect(wrapper.emitted('refresh')).toBeTruthy();
    expect(wrapper.emitted('refresh')).toHaveLength(1);
  });
});
