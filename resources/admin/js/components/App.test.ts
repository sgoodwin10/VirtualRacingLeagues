import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from './App.vue';

describe('App', () => {
  it('renders without errors', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Toast: true,
          RouterView: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('includes Toast component', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Toast: true,
          RouterView: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'Toast' }).exists()).toBe(true);
  });

  it('includes RouterView component', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Toast: true,
          RouterView: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true);
  });
});
