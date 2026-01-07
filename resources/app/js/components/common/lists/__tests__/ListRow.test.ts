/**
 * ListRow Component Tests
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListRow from '../ListRow.vue';
import ListRowIndicator from '../ListRowIndicator.vue';

describe('ListRow', () => {
  it('renders default slot content', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: '<div class="test-content">Row Content</div>',
      },
    });

    expect(wrapper.find('.test-content').text()).toBe('Row Content');
  });

  it('shows indicator when status is provided', () => {
    const wrapper = mount(ListRow, {
      props: {
        status: 'active',
      },
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.findComponent(ListRowIndicator).exists()).toBe(true);
  });

  it('hides indicator when showIndicator is false', () => {
    const wrapper = mount(ListRow, {
      props: {
        status: 'active',
        showIndicator: false,
      },
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.findComponent(ListRowIndicator).exists()).toBe(false);
  });

  it('shows indicator when showIndicator is true even without status', () => {
    const wrapper = mount(ListRow, {
      props: {
        showIndicator: true,
      },
      slots: {
        default: 'Content',
        indicator: '<div class="custom-indicator">Custom</div>',
      },
    });

    expect(wrapper.find('.custom-indicator').exists()).toBe(true);
  });

  it('renders custom indicator slot', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: 'Content',
        indicator: '<div class="custom-indicator">Custom Indicator</div>',
      },
    });

    expect(wrapper.find('.custom-indicator').text()).toBe('Custom Indicator');
  });

  it('renders stats slot', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: 'Content',
        stats: '<div class="test-stats">Statistics</div>',
      },
    });

    expect(wrapper.find('.test-stats').text()).toBe('Statistics');
  });

  it('renders action slot', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: 'Content',
        action: '<button class="test-action">Action</button>',
      },
    });

    expect(wrapper.find('.test-action').text()).toBe('Action');
  });

  it('emits click event when clickable', async () => {
    const wrapper = mount(ListRow, {
      props: {
        clickable: true,
      },
      slots: {
        default: 'Content',
      },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click event when not clickable', async () => {
    const wrapper = mount(ListRow, {
      props: {
        clickable: false,
      },
      slots: {
        default: 'Content',
      },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('has cursor-pointer class when clickable', () => {
    const wrapper = mount(ListRow, {
      props: {
        clickable: true,
      },
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.classes()).toContain('cursor-pointer');
  });

  it('has tabindex 0 when clickable', () => {
    const wrapper = mount(ListRow, {
      props: {
        clickable: true,
      },
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.attributes('tabindex')).toBe('0');
  });

  it('does not have tabindex when not clickable', () => {
    const wrapper = mount(ListRow, {
      props: {
        clickable: false,
      },
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.attributes('tabindex')).toBeUndefined();
  });

  it('triggers click on Enter key when clickable', async () => {
    const wrapper = mount(ListRow, {
      props: {
        clickable: true,
      },
      slots: {
        default: 'Content',
      },
    });

    await wrapper.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('triggers click on Space key when clickable', async () => {
    const wrapper = mount(ListRow, {
      props: {
        clickable: true,
      },
      slots: {
        default: 'Content',
      },
    });

    await wrapper.trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not trigger click on other keys', async () => {
    const wrapper = mount(ListRow, {
      props: {
        clickable: true,
      },
      slots: {
        default: 'Content',
      },
    });

    await wrapper.trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('applies hover classes by default', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.classes()).toContain('hover:border-[var(--cyan)]');
  });

  it('removes hover classes when noHover is true', () => {
    const wrapper = mount(ListRow, {
      props: {
        noHover: true,
      },
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.classes()).not.toContain('hover:border-[var(--cyan)]');
  });

  it('applies ARIA listitem role', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.attributes('role')).toBe('listitem');
  });

  it('applies custom ARIA label', () => {
    const wrapper = mount(ListRow, {
      props: {
        ariaLabel: 'Custom row description',
      },
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.attributes('aria-label')).toBe('Custom row description');
  });

  it('applies custom classes', () => {
    const wrapper = mount(ListRow, {
      props: {
        class: 'custom-row-class',
      },
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.classes()).toContain('custom-row-class');
  });

  it('has transition classes', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.classes()).toContain('transition-all');
    expect(wrapper.classes()).toContain('duration-200');
  });

  it('has reduced motion classes', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.classes()).toContain('motion-reduce:transition-none');
    expect(wrapper.classes()).toContain('motion-reduce:transform-none');
  });

  it('has rounded corners', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.classes()).toContain('rounded-[var(--radius)]');
  });

  it('has border and background', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: 'Content',
      },
    });

    expect(wrapper.classes()).toContain('border');
    expect(wrapper.classes()).toContain('border-[var(--border)]');
    expect(wrapper.classes()).toContain('bg-[var(--bg-card)]');
  });

  it('passes status to ListRowIndicator', () => {
    const wrapper = mount(ListRow, {
      props: {
        status: 'upcoming',
      },
      slots: {
        default: 'Content',
      },
    });

    const indicator = wrapper.findComponent(ListRowIndicator);
    expect(indicator.props('status')).toBe('upcoming');
  });
});
