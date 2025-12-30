/**
 * ListRowStats Component Tests
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListRowStats from '../ListRowStats.vue';

describe('ListRowStats', () => {
  it('renders default slot content', () => {
    const wrapper = mount(ListRowStats, {
      slots: {
        default: '<div class="stat-item">Stat 1</div><div class="stat-item">Stat 2</div>',
      },
    });

    expect(wrapper.findAll('.stat-item')).toHaveLength(2);
  });

  it('applies default gap of 24px', () => {
    const wrapper = mount(ListRowStats);

    expect(wrapper.attributes('style')).toContain('gap: 24px');
  });

  it('applies custom gap as number', () => {
    const wrapper = mount(ListRowStats, {
      props: {
        gap: 16,
      },
    });

    expect(wrapper.attributes('style')).toContain('gap: 16px');
  });

  it('applies custom gap as string', () => {
    const wrapper = mount(ListRowStats, {
      props: {
        gap: '2rem',
      },
    });

    expect(wrapper.attributes('style')).toContain('gap: 2rem');
  });

  it('applies ARIA group role', () => {
    const wrapper = mount(ListRowStats);

    expect(wrapper.attributes('role')).toBe('group');
  });

  it('applies correct ARIA label', () => {
    const wrapper = mount(ListRowStats);

    expect(wrapper.attributes('aria-label')).toBe('Statistics');
  });

  it('applies custom classes', () => {
    const wrapper = mount(ListRowStats, {
      props: {
        class: 'custom-stats-container',
      },
    });

    expect(wrapper.classes()).toContain('custom-stats-container');
  });

  it('uses flex layout with items center', () => {
    const wrapper = mount(ListRowStats);

    expect(wrapper.classes()).toContain('flex');
    expect(wrapper.classes()).toContain('items-center');
  });
});
