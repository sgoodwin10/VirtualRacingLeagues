import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlListRow from '../VrlListRow.vue';
import VrlListRowIndicator from '../VrlListRowIndicator.vue';

describe('VrlListRow', () => {
  it('renders content slot', () => {
    const wrapper = mount(VrlListRow, {
      slots: {
        content: '<div class="test-content">Test Content</div>',
      },
    });

    expect(wrapper.find('.test-content').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Content');
  });

  it('renders stats slot', () => {
    const wrapper = mount(VrlListRow, {
      slots: {
        stats: '<div class="test-stats">24 Drivers</div>',
      },
    });

    expect(wrapper.find('.test-stats').exists()).toBe(true);
    expect(wrapper.text()).toContain('24 Drivers');
  });

  it('renders action slot', () => {
    const wrapper = mount(VrlListRow, {
      slots: {
        action: '<button class="test-action">View</button>',
      },
    });

    expect(wrapper.find('.test-action').exists()).toBe(true);
    expect(wrapper.text()).toContain('View');
  });

  it('shows indicator when status provided', () => {
    const wrapper = mount(VrlListRow, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.findComponent(VrlListRowIndicator).exists()).toBe(true);
    expect(wrapper.findComponent(VrlListRowIndicator).props('status')).toBe('active');
  });

  it('does not show indicator when status not provided', () => {
    const wrapper = mount(VrlListRow);

    expect(wrapper.findComponent(VrlListRowIndicator).exists()).toBe(false);
  });

  it('supports custom indicator slot', () => {
    const wrapper = mount(VrlListRow, {
      props: {
        status: 'active',
      },
      slots: {
        indicator: '<div class="custom-indicator">Custom</div>',
      },
    });

    expect(wrapper.find('.custom-indicator').exists()).toBe(true);
    expect(wrapper.findComponent(VrlListRowIndicator).exists()).toBe(false);
  });

  it('emits click event when clickable', async () => {
    const wrapper = mount(VrlListRow, {
      props: {
        clickable: true,
      },
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click when not clickable', async () => {
    const wrapper = mount(VrlListRow, {
      props: {
        clickable: false,
      },
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('has cursor-pointer class when clickable', () => {
    const wrapper = mount(VrlListRow, {
      props: {
        clickable: true,
      },
    });

    expect(wrapper.classes()).toContain('cursor-pointer');
    expect(wrapper.attributes('data-clickable')).toBe('true');
  });

  it('does not have cursor-pointer class when not clickable', () => {
    const wrapper = mount(VrlListRow, {
      props: {
        clickable: false,
      },
    });

    expect(wrapper.classes()).not.toContain('cursor-pointer');
    expect(wrapper.attributes('data-clickable')).toBe('false');
  });

  it('supports keyboard navigation (Enter key)', async () => {
    const wrapper = mount(VrlListRow, {
      props: {
        clickable: true,
      },
    });

    await wrapper.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('supports keyboard navigation (Space key)', async () => {
    const wrapper = mount(VrlListRow, {
      props: {
        clickable: true,
      },
    });

    await wrapper.trigger('keydown', { key: ' ' });

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit on keyboard when not clickable', async () => {
    const wrapper = mount(VrlListRow, {
      props: {
        clickable: false,
      },
    });

    await wrapper.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('has tabindex="0" when clickable', () => {
    const wrapper = mount(VrlListRow, {
      props: {
        clickable: true,
      },
    });

    expect(wrapper.attributes('tabindex')).toBe('0');
  });

  it('does not have tabindex when not clickable', () => {
    const wrapper = mount(VrlListRow, {
      props: {
        clickable: false,
      },
    });

    expect(wrapper.attributes('tabindex')).toBeUndefined();
  });

  it('has proper ARIA role', () => {
    const wrapper = mount(VrlListRow);

    expect(wrapper.attributes('role')).toBe('listitem');
  });

  it('applies aria-label when provided', () => {
    const wrapper = mount(VrlListRow, {
      props: {
        ariaLabel: 'View GT4 Championship details',
      },
    });

    expect(wrapper.attributes('aria-label')).toBe('View GT4 Championship details');
  });

  it('has base flex layout classes', () => {
    const wrapper = mount(VrlListRow);

    expect(wrapper.classes()).toContain('flex');
    expect(wrapper.classes()).toContain('items-center');
    expect(wrapper.classes()).toContain('group');
  });

  it('has data-test attribute', () => {
    const wrapper = mount(VrlListRow);

    expect(wrapper.attributes('data-test')).toBe('list-row');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlListRow, {
      props: {
        class: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('flex');
  });

  it('renders all slots together', () => {
    const wrapper = mount(VrlListRow, {
      props: {
        status: 'active',
      },
      slots: {
        content: '<div class="content">Content</div>',
        stats: '<div class="stats">Stats</div>',
        action: '<div class="action">Action</div>',
      },
    });

    expect(wrapper.findComponent(VrlListRowIndicator).exists()).toBe(true);
    expect(wrapper.find('.content').exists()).toBe(true);
    expect(wrapper.find('.stats').exists()).toBe(true);
    expect(wrapper.find('.action').exists()).toBe(true);
  });
});
