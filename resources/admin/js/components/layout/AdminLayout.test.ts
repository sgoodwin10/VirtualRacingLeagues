import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import AdminLayout from './AdminLayout.vue';

describe('AdminLayout', () => {
  it('renders without errors', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppSidebar: true,
          AppTopbar: true,
          RouterView: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders AppSidebar component', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppSidebar: true,
          AppTopbar: true,
          RouterView: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'AppSidebar' }).exists()).toBe(true);
  });

  it('renders AppTopbar component', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppSidebar: true,
          AppTopbar: true,
          RouterView: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'AppTopbar' }).exists()).toBe(true);
  });

  it('renders main content area', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppSidebar: true,
          AppTopbar: true,
          RouterView: true,
        },
      },
    });

    expect(wrapper.find('main').exists()).toBe(true);
  });

  it('renders RouterView for nested routes', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppSidebar: true,
          AppTopbar: true,
          RouterView: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true);
  });
});
