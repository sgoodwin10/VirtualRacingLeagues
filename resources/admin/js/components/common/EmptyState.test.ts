import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EmptyState from './EmptyState.vue';
import { PhClock } from '@phosphor-icons/vue';

describe('EmptyState', () => {
  it('renders without errors', () => {
    const wrapper = mount(EmptyState);

    expect(wrapper.exists()).toBe(true);
  });

  it('displays default message', () => {
    const wrapper = mount(EmptyState);

    expect(wrapper.text()).toContain('No data found');
  });

  it('displays custom message', () => {
    const wrapper = mount(EmptyState, {
      props: {
        message: 'No items available',
      },
    });

    expect(wrapper.text()).toContain('No items available');
  });

  it('renders default icon', () => {
    const wrapper = mount(EmptyState);

    expect(wrapper.findComponent(PhClock).exists()).toBe(true);
  });

  it('applies default icon classes', () => {
    const wrapper = mount(EmptyState, {
      props: {
        iconClass: 'text-gray-400',
      },
    });

    expect(wrapper.html()).toContain('text-gray-400');
  });

  it('applies custom icon classes', () => {
    const wrapper = mount(EmptyState, {
      props: {
        iconClass: 'text-red-500',
      },
    });

    expect(wrapper.html()).toContain('text-red-500');
  });

  it('applies default message classes', () => {
    const wrapper = mount(EmptyState, {
      props: {
        messageClass: 'text-gray-600',
      },
    });

    expect(wrapper.html()).toContain('text-gray-600');
  });
});
