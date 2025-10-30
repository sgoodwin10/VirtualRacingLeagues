import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import QualifierListItem from '../QualifierListItem.vue';
import type { Race } from '@user/types/race';
import { F1_STANDARD_POINTS } from '@user/types/race';
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
    race_divisions: true,
    points_system: F1_STANDARD_POINTS,
    bonus_points: { pole: 1 },
    dnf_points: 0,
    dns_points: 0,
    race_notes: null,
    is_qualifier: true,
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
          Tag: {
            template: '<span><slot>{{ value }}</slot></span>',
            props: ['value', 'severity'],
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
    expect(wrapper.text()).toContain('Format:');
    expect(wrapper.text()).toContain('Standard Qualifying');
  });

  it('displays qualifying length when present', () => {
    expect(wrapper.text()).toContain('Duration:');
    expect(wrapper.text()).toContain('15 minutes');
  });

  it('hides qualifying length when not present', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_length: null },
    });
    expect(wrapper.text()).not.toContain('Duration:');
  });

  it('displays tire compound when present', () => {
    expect(wrapper.text()).toContain('Tire:');
    expect(wrapper.text()).toContain('Soft');
  });

  it('hides tire compound when not present', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_tire: null },
    });
    expect(wrapper.text()).not.toContain('Tire:');
  });

  it('displays weather when present', () => {
    expect(wrapper.text()).toContain('Weather:');
    expect(wrapper.text()).toContain('Clear');
  });

  it('hides weather when not present', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, weather: null },
    });
    expect(wrapper.text()).not.toContain('Weather:');
  });

  it('shows divisions enabled tag when race_divisions is true', () => {
    expect(wrapper.text()).toContain('Divisions Enabled');
  });

  it('hides divisions tag when race_divisions is false', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, race_divisions: false },
    });
    expect(wrapper.text()).not.toContain('Divisions Enabled');
  });

  it('shows pole bonus tag when bonus_points.pole is set', () => {
    expect(wrapper.text()).toContain('Pole Bonus');
  });

  it('hides pole bonus tag when bonus_points is null', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, bonus_points: null },
    });
    expect(wrapper.text()).not.toContain('Pole Bonus');
  });

  it('hides pole bonus tag when bonus_points.pole is undefined', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, bonus_points: {} },
    });
    expect(wrapper.text()).not.toContain('Pole Bonus');
  });

  it('displays qualifying tag with info severity', () => {
    expect(wrapper.text()).toContain('Qualifying');
    // Tag component is stubbed, so we just check the text is present
  });

  it('applies blue theme styling to container', () => {
    const container = wrapper.find('.bg-blue-50');
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain('border-blue-200');
    expect(container.classes()).toContain('rounded-lg');
  });

  it('has stopwatch icon with blue color', () => {
    const icon = wrapper.find('.pi-stopwatch');
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('text-blue-600');
  });

  it('emits edit event when edit button clicked', async () => {
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    await buttons[0]?.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockQualifier]);
  });

  it('emits delete event when delete button clicked', async () => {
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    await buttons[1]?.trigger('click');

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
    expect(wrapper.text()).toContain('No Qualifying');
  });

  it('formats previous race qualifying correctly', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_format: 'previous_race' },
    });
    expect(wrapper.text()).toContain('Previous Race Result');
  });

  it('handles unknown qualifying format gracefully', async () => {
    await wrapper.setProps({
      race: { ...mockQualifier, qualifying_format: 'unknown' as any },
    });
    expect(wrapper.text()).toContain('unknown');
  });

  it('shows all information in grid layout', () => {
    const grid = wrapper.find('.grid.grid-cols-2');
    expect(grid.exists()).toBe(true);
  });

  it('has hover effect class', () => {
    const container = wrapper.find('.bg-blue-50');
    expect(container.classes()).toContain('hover:bg-blue-100');
    expect(container.classes()).toContain('transition-colors');
  });
});
