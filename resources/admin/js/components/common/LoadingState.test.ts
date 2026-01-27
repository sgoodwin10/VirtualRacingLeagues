import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingState from './LoadingState.vue';
import { PhCircleNotch } from '@phosphor-icons/vue';

describe('LoadingState', () => {
  it('renders without errors', () => {
    const wrapper = mount(LoadingState);

    expect(wrapper.exists()).toBe(true);
  });

  it('displays default message', () => {
    const wrapper = mount(LoadingState);

    expect(wrapper.text()).toContain('Loading...');
  });

  it('displays custom message', () => {
    const wrapper = mount(LoadingState, {
      props: {
        message: 'Please wait...',
      },
    });

    expect(wrapper.text()).toContain('Please wait...');
  });

  it('renders default icon', () => {
    const wrapper = mount(LoadingState);

    expect(wrapper.findComponent(PhCircleNotch).exists()).toBe(true);
  });

  it('applies spin animation by default', () => {
    const wrapper = mount(LoadingState);

    expect(wrapper.html()).toContain('animate-spin');
  });

  it('does not apply spin animation when disabled', () => {
    const wrapper = mount(LoadingState, {
      props: {
        spin: false,
      },
    });

    expect(wrapper.html()).not.toContain('animate-spin');
  });

  it('applies default icon classes', () => {
    const wrapper = mount(LoadingState, {
      props: {
        iconClass: 'text-blue-500',
      },
    });

    expect(wrapper.html()).toContain('text-blue-500');
  });

  it('applies custom icon classes', () => {
    const wrapper = mount(LoadingState, {
      props: {
        iconClass: 'text-purple-600',
      },
    });

    expect(wrapper.html()).toContain('text-purple-600');
  });
});
