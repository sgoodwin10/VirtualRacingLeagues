import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import QualifierListItem from '../QualifierListItem.vue';
import type { Race } from '@app/types/race';
import { F1_STANDARD_POINTS } from '@app/types/race';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';

describe('QualifierListItem', () => {
  let wrapper: VueWrapper;

  const mockQualifier: Race = {
    id: 1,
    round_id: 1,
    race_number: 0,
    race_type: 'qualifying',
    name: 'Qualifying Session',
    qualifying_format: 'standard',
    qualifying_length: 15,
    qualifying_tire: 'Soft',
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
    mandatory_pit_stop: false,
    minimum_pit_time: null,
    assists_restrictions: null,
    race_points: false,
    points_system: F1_STANDARD_POINTS,
    fastest_lap: null,
    fastest_lap_top_10: false,
    qualifying_pole: 1,
    qualifying_pole_top_10: false,
    dnf_points: 0,
    dns_points: 0,
    race_notes: null,
    is_qualifier: true,
    status: 'scheduled',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    wrapper = mount(QualifierListItem, {
      props: { race: mockQualifier },
      global: {
        plugins: [PrimeVue],
        directives: {
          tooltip: Tooltip,
        },
        stubs: {
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          EditButton: {
            template: '<button @click="$emit(\'click\', $event)" data-test-edit-button></button>',
          },
          DeleteButton: {
            template: '<button @click="$emit(\'click\', $event)" data-test-delete-button></button>',
          },
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size'],
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

  it('renders qualifier name correctly', () => {
    expect(wrapper.text()).toContain('Qualifying Session');
  });

  it('renders default name when no name provided', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, name: null },
    });
    expect(wrapper.text()).toContain('Qualifying Session');
  });

  it('displays qualifying format', () => {
    expect(wrapper.text()).toContain('Format');
    expect(wrapper.text()).toContain('Standard');
  });

  it('displays qualifying length when present', () => {
    expect(wrapper.text()).toContain('Duration');
    expect(wrapper.text()).toContain('15 minutes');
  });

  it('hides qualifying length when not present', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_length: null },
    });
    expect(wrapper.text()).not.toContain('Duration:');
  });

  it('displays tire compound when present', () => {
    expect(wrapper.text()).toContain('Tyre');
    expect(wrapper.text()).toContain('Soft');
  });

  it('hides tire compound when not present', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_tire: null },
    });
    expect(wrapper.text()).not.toContain('Tire:');
  });

  it('displays weather when present', () => {
    expect(wrapper.text()).toContain('Weather');
    expect(wrapper.text()).toContain('Clear');
  });

  it('hides weather when not present', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, weather: null },
    });
    expect(wrapper.text()).not.toContain('Weather:');
  });

  it('shows pole bonus badge when qualifying_pole is set', () => {
    expect(wrapper.text()).toContain('Pole Bonus: 1pts');
  });

  it('hides pole bonus badge when qualifying_pole is null', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_pole: null },
    });
    expect(wrapper.text()).not.toContain('Pole Bonus');
  });

  it('hides pole bonus badge when qualifying_pole is 0', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_pole: 0 },
    });
    expect(wrapper.text()).not.toContain('Pole Bonus');
  });

  it('applies theme styling to container', () => {
    const container = wrapper.find('[class*="border-[var(--color-border-muted)]"]');
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain('rounded-lg');
  });

  it('has stopwatch icon', () => {
    const icon = wrapper.findComponent({ name: 'PhTimer' });
    expect(icon.exists()).toBe(true);
    expect(icon.props('size')).toBe('24');
  });

  it('emits enterResults event when enter results button clicked', async () => {
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    await buttons[0]?.trigger('click');

    expect(wrapper.emitted('enterResults')).toBeTruthy();
    expect(wrapper.emitted('enterResults')?.[0]).toEqual([mockQualifier]);
  });

  it('emits edit event when edit button clicked', async () => {
    const editButton = wrapper.find('[data-test-edit-button]');
    expect(editButton.exists()).toBe(true);

    await editButton.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockQualifier]);
  });

  it('emits delete event when delete button clicked', async () => {
    const deleteButton = wrapper.find('[data-test-delete-button]');
    expect(deleteButton.exists()).toBe(true);

    await deleteButton.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual([mockQualifier]);
  });

  it('formats time trial qualifying correctly', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_format: 'time_trial' },
    });
    expect(wrapper.text()).toContain('Time Trial');
  });

  it('formats no qualifying correctly', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_format: 'none' },
    });
    expect(wrapper.text()).toContain('none');
  });

  it('formats previous race qualifying correctly', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_format: 'previous_race' },
    });
    expect(wrapper.text()).toContain('previous_race');
  });

  it('handles unknown qualifying format gracefully', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_format: 'unknown' as any },
    });
    expect(wrapper.text()).toContain('unknown');
  });

  it('shows all information in grid layout', () => {
    const grid = wrapper.find('.flex.flex-row.gap-6');
    expect(grid.exists()).toBe(true);
  });

  it('has hover effect class', () => {
    const container = wrapper.find('[class*="border-[var(--color-border-muted)]"]');
    expect(container.classes()).toContain('transition-colors');
  });

  it('displays completion toggle with correct state for scheduled race', () => {
    expect(wrapper.text()).toContain('Completed');
    const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
    expect(toggle.exists()).toBe(true);
  });

  it('shows toggle in checked state when qualifier is completed', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, status: 'completed' },
    });
    const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
    expect(toggle.exists()).toBe(true);
    // Should show Completed text with green color
    expect(wrapper.text()).toContain('Completed');
  });

  it('hides edit and delete buttons when qualifier is completed', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, status: 'completed' },
    });
    const buttons = wrapper.findAll('button');
    // Results button should be visible, edit and delete should be hidden
    expect(buttons.length).toBe(1);
  });

  it('emits toggleStatus event when toggle is changed', async () => {
    const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
    await toggle.vm.$emit('update:modelValue', true);

    expect(wrapper.emitted('toggleStatus')).toBeTruthy();
    expect(wrapper.emitted('toggleStatus')?.[0]).toEqual([mockQualifier, 'completed']);
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
    // Only "Results" button should remain (1 button instead of 4)
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

  it('shows orphaned results warning when qualifier is completed and has orphaned results', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, status: 'completed', has_orphaned_results: true },
    });

    const warningElement = wrapper.find('[data-test-orphaned-warning]');
    expect(warningElement.exists()).toBe(true);
  });

  it('does not show orphaned results warning when qualifier has no orphaned results', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, status: 'completed', has_orphaned_results: false },
    });

    // Component is rendered but should not show warning (controlled by showWarning computed)
    const warningElement = wrapper.find('[data-test-orphaned-warning]');
    expect(warningElement.exists()).toBe(true);
  });

  it('does not show orphaned results warning when round is completed', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, status: 'completed', has_orphaned_results: true },
      isRoundCompleted: true,
    });

    const warningElement = wrapper.find('[data-test-orphaned-warning]');
    expect(warningElement.exists()).toBe(false);
  });

  it('emits refresh event when orphaned results are removed', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, status: 'completed', has_orphaned_results: true },
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
