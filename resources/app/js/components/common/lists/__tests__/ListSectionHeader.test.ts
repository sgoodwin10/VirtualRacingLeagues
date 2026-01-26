/**
 * ListSectionHeader Component Tests
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListSectionHeader from '../ListSectionHeader.vue';

describe('ListSectionHeader', () => {
  it('renders the title correctly', () => {
    const wrapper = mount(ListSectionHeader, {
      props: {
        title: 'Active Rounds',
      },
    });

    expect(wrapper.text()).toContain('Active Rounds');
  });

  it('applies uppercase styling to the title', () => {
    const wrapper = mount(ListSectionHeader, {
      props: {
        title: 'test section',
      },
    });

    const title = wrapper.find('span');
    expect(title.classes()).toContain('uppercase');
  });

  it('renders the extending line', () => {
    const wrapper = mount(ListSectionHeader, {
      props: {
        title: 'Section',
      },
    });

    const line = wrapper.find('.flex-1');
    expect(line.exists()).toBe(true);
    expect(line.classes()).toContain('bg-[var(--border)]');
  });

  it('applies ARIA separator role', () => {
    const wrapper = mount(ListSectionHeader, {
      props: {
        title: 'Section',
      },
    });

    expect(wrapper.attributes('role')).toBe('separator');
    expect(wrapper.attributes('aria-label')).toBe('Section divider');
  });

  it('applies custom classes', () => {
    const wrapper = mount(ListSectionHeader, {
      props: {
        title: 'Section',
        class: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
  });

  it('uses monospace font for title', () => {
    const wrapper = mount(ListSectionHeader, {
      props: {
        title: 'Section',
      },
    });

    const title = wrapper.find('span');
    expect(title.classes()).toContain('font-mono');
  });

  it('applies correct text size and tracking', () => {
    const wrapper = mount(ListSectionHeader, {
      props: {
        title: 'Section',
      },
    });

    const title = wrapper.find('span');
    expect(title.classes()).toContain('text-sm');
    expect(title.classes()).toContain('tracking-[1px]');
  });
});
