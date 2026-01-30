import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlListRowStat from './VrlListRowStat.vue';

describe('VrlListRowStat', () => {
  it('renders value and label from props', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '24',
        label: 'Drivers',
      },
    });

    expect(wrapper.find('[data-test="stat-value"]').text()).toBe('24');
    expect(wrapper.find('[data-test="stat-label"]').text()).toBe('Drivers');
  });

  it('renders numeric value', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: 42,
        label: 'Points',
      },
    });

    expect(wrapper.find('[data-test="stat-value"]').text()).toBe('42');
  });

  it('renders string value', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '14/22',
        label: 'Progress',
      },
    });

    expect(wrapper.find('[data-test="stat-value"]').text()).toBe('14/22');
  });

  it('applies cyan color class', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '24',
        label: 'Drivers',
        valueColor: 'cyan',
      },
    });

    expect(wrapper.find('[data-test="stat-value"]').classes()).toContain('text-[var(--cyan)]');
  });

  it('applies orange color class', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '18',
        label: 'Registered',
        valueColor: 'orange',
      },
    });

    expect(wrapper.find('[data-test="stat-value"]').classes()).toContain('text-[var(--orange)]');
  });

  it('applies green color class', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '10',
        label: 'Completed',
        valueColor: 'green',
      },
    });

    expect(wrapper.find('[data-test="stat-value"]').classes()).toContain('text-[var(--green)]');
  });

  it('applies red color class', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '3',
        label: 'Failed',
        valueColor: 'red',
      },
    });

    expect(wrapper.find('[data-test="stat-value"]').classes()).toContain('text-[var(--red)]');
  });

  it('applies purple color class', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '5',
        label: 'Special',
        valueColor: 'purple',
      },
    });

    expect(wrapper.find('[data-test="stat-value"]').classes()).toContain('text-[var(--purple)]');
  });

  it('does not apply color class when valueColor not provided', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '24',
        label: 'Drivers',
      },
    });

    const valueElement = wrapper.find('[data-test="stat-value"]');
    expect(valueElement.classes()).not.toContain('text-[var(--cyan)]');
    expect(valueElement.classes()).not.toContain('text-[var(--orange)]');
  });

  it('renders value from slot', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '24',
        label: 'Drivers',
      },
      slots: {
        value: '<strong>42</strong>',
      },
    });

    expect(wrapper.html()).toContain('<strong>42</strong>');
  });

  it('renders label from slot', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '24',
        label: 'Drivers',
      },
      slots: {
        label: '<em>Players</em>',
      },
    });

    expect(wrapper.html()).toContain('<em>Players</em>');
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '24',
        label: 'Drivers',
      },
    });

    expect(wrapper.attributes('role')).toBe('group');
    expect(wrapper.attributes('aria-label')).toBe('24 Drivers');
  });

  it('combines numeric value with label in ARIA', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: 42,
        label: 'Points',
      },
    });

    expect(wrapper.attributes('aria-label')).toBe('42 Points');
  });

  it('has text-right class', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '24',
        label: 'Drivers',
      },
    });

    expect(wrapper.classes()).toContain('text-right');
  });

  it('has data-test attribute', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '24',
        label: 'Drivers',
      },
    });

    expect(wrapper.attributes('data-test')).toBe('list-row-stat');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlListRowStat, {
      props: {
        value: '24',
        label: 'Drivers',
        class: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('text-right');
  });
});
