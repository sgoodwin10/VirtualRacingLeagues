import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlListRowStats from '../VrlListRowStats.vue';

describe('VrlListRowStats', () => {
  it('renders slot content', () => {
    const wrapper = mount(VrlListRowStats, {
      slots: {
        default: '<div class="test-stat">Stat 1</div><div class="test-stat">Stat 2</div>',
      },
    });

    expect(wrapper.findAll('.test-stat')).toHaveLength(2);
    expect(wrapper.text()).toContain('Stat 1');
    expect(wrapper.text()).toContain('Stat 2');
  });

  it('applies default gap (1.5rem)', () => {
    const wrapper = mount(VrlListRowStats);

    expect(wrapper.element.style.gap).toBe('1.5rem');
  });

  it('applies custom gap as string', () => {
    const wrapper = mount(VrlListRowStats, {
      props: {
        gap: '2rem',
      },
    });

    expect(wrapper.element.style.gap).toBe('2rem');
  });

  it('applies custom gap as number (converts to px)', () => {
    const wrapper = mount(VrlListRowStats, {
      props: {
        gap: 24,
      },
    });

    expect(wrapper.element.style.gap).toBe('24px');
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(VrlListRowStats);

    expect(wrapper.attributes('role')).toBe('group');
    expect(wrapper.attributes('aria-label')).toBe('Statistics');
  });

  it('has flex and gap classes', () => {
    const wrapper = mount(VrlListRowStats);

    expect(wrapper.classes()).toContain('flex');
    expect(wrapper.classes()).toContain('gap-6');
    expect(wrapper.classes()).toContain('shrink-0');
  });

  it('has responsive hidden class for mobile', () => {
    const wrapper = mount(VrlListRowStats);

    expect(wrapper.classes()).toContain('max-md:hidden');
  });

  it('has data-test attribute', () => {
    const wrapper = mount(VrlListRowStats);

    expect(wrapper.attributes('data-test')).toBe('list-row-stats');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlListRowStats, {
      props: {
        class: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('flex');
  });
});
