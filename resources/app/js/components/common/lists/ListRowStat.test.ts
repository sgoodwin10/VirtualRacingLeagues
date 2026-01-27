/**
 * ListRowStat Component Tests
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListRowStat from './ListRowStat.vue';

describe('ListRowStat', () => {
  it('renders value and label correctly', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: '12',
        label: 'Races',
      },
    });

    expect(wrapper.text()).toContain('12');
    expect(wrapper.text()).toContain('Races');
  });

  it('renders numeric value', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: 42,
        label: 'Points',
      },
    });

    expect(wrapper.text()).toContain('42');
  });

  it('renders custom value slot', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: '10',
        label: 'Score',
      },
      slots: {
        value: '<span class="custom-value">Custom Value</span>',
      },
    });

    expect(wrapper.find('.custom-value').text()).toBe('Custom Value');
  });

  it('renders custom label slot', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: '10',
        label: 'Score',
      },
      slots: {
        label: '<span class="custom-label">Custom Label</span>',
      },
    });

    expect(wrapper.find('.custom-label').text()).toBe('Custom Label');
  });

  it('applies ARIA group role', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: '10',
        label: 'Score',
      },
    });

    expect(wrapper.attributes('role')).toBe('group');
  });

  it('applies correct ARIA label', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: '15',
        label: 'Drivers',
      },
    });

    expect(wrapper.attributes('aria-label')).toBe('15 Drivers');
  });

  it('applies custom classes', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: '10',
        label: 'Score',
        class: 'custom-stat',
      },
    });

    expect(wrapper.classes()).toContain('custom-stat');
  });

  it('uses monospace font for value', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: '10',
        label: 'Score',
      },
    });

    const valueElement = wrapper.find('.font-mono.text-\\[16px\\]');
    expect(valueElement.exists()).toBe(true);
  });

  it('uses monospace font for label with uppercase', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: '10',
        label: 'Score',
      },
    });

    const labelElement = wrapper.find('.font-mono.text-\\[9px\\].uppercase');
    expect(labelElement.exists()).toBe(true);
  });

  it('uses flex column layout', () => {
    const wrapper = mount(ListRowStat, {
      props: {
        value: '10',
        label: 'Score',
      },
    });

    expect(wrapper.classes()).toContain('flex');
    expect(wrapper.classes()).toContain('flex-col');
  });
});
