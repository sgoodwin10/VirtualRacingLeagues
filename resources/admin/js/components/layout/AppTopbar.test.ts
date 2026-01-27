import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import AppTopbar from './AppTopbar.vue';
import { useAdminStore } from '@admin/stores/adminStore';

describe('AppTopbar', () => {
  let router: ReturnType<typeof createRouter>;
  let wrapper: VueWrapper;

  beforeEach(async () => {
    // Create router with memory history
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/admin',
          name: 'dashboard',
          component: { template: '<div>Dashboard</div>' },
          meta: { title: 'Dashboard' },
        },
        {
          path: '/users',
          name: 'users',
          component: { template: '<div>Users</div>' },
          meta: { title: 'Users' },
        },
      ],
    });

    // Push to initial route
    await router.push('/admin');
    await router.isReady();
  });

  const createWrapper = () => {
    const pinia = createPinia();

    const testWrapper = mount(AppTopbar, {
      global: {
        plugins: [pinia, router, PrimeVue, ToastService],
        directives: {
          tooltip: () => {},
        },
        stubs: {
          Button: true,
          Breadcrumb: true,
          InputText: true,
          IconField: true,
          InputIcon: true,
          Popover: true,
          OverlayBadge: true,
          RouterLink: true,
          Badge: true,
          ViewAdminUserModal: true,
          EditAdminUserModal: true,
        },
      },
    });

    // Setup stores after mount
    const adminStore = useAdminStore(pinia);
    adminStore.setAdmin({
      id: 1,
      name: 'Test Admin',
      first_name: 'Test',
      last_name: 'Admin',
      email: 'test@example.com',
      role: 'admin',
      status: 'active',
      last_login_at: null,
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
      deleted_at: null,
    });

    return testWrapper;
  };

  it('renders without errors', () => {
    wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders as a header element', () => {
    wrapper = createWrapper();
    expect(wrapper.find('header').exists()).toBe(true);
  });

  it('renders search input', () => {
    wrapper = createWrapper();
    // The InputText component is stubbed, so we check if the IconField wrapper exists
    expect(wrapper.html()).toContain('icon-field-stub');
  });

  it('renders breadcrumb navigation', () => {
    wrapper = createWrapper();
    expect(wrapper.findComponent({ name: 'Breadcrumb' }).exists()).toBe(true);
  });
});
