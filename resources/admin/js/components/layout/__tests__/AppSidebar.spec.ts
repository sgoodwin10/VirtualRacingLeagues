import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import AppSidebar from '../AppSidebar.vue';
import { useAdminStore } from '@admin/stores/adminStore';
import { useSiteConfigStore } from '@admin/stores/siteConfigStore';

describe('AppSidebar', () => {
  let router: ReturnType<typeof createRouter>;
  let wrapper: VueWrapper;

  beforeEach(async () => {
    // Create router with memory history
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
        { path: '/users', name: 'users', component: { template: '<div>Users</div>' } },
        {
          path: '/admin-users',
          name: 'admin-users',
          component: { template: '<div>Admin Users</div>' },
        },
        {
          path: '/activity-logs',
          name: 'activity-logs',
          component: { template: '<div>Activity Logs</div>' },
        },
        {
          path: '/site-config',
          name: 'site-config',
          component: { template: '<div>Site Config</div>' },
        },
      ],
    });

    // Push to initial route
    await router.push('/');
    await router.isReady();
  });

  const createWrapper = (adminRole: 'super_admin' | 'admin' | 'moderator' = 'admin') => {
    const pinia = createPinia();

    const testWrapper = mount(AppSidebar, {
      global: {
        plugins: [pinia, router],
        stubs: {
          RouterLink: true,
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
      role: adminRole,
      status: 'active',
      last_login_at: null,
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
      deleted_at: null,
    });

    const siteConfigStore = useSiteConfigStore(pinia);
    siteConfigStore.updateConfig({
      id: 1,
      site_name: 'Test Site',
      maintenance_mode: false,
      timezone: 'UTC',
      user_registration_enabled: true,
      google_tag_manager_id: null,
      google_analytics_id: null,
      google_search_console_code: null,
      discord_link: null,
      support_email: null,
      contact_email: 'contact@test.com',
      admin_email: null,
      files: {
        logo: null,
        favicon: null,
        og_image: null,
      },
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    });

    return testWrapper;
  };

  it('renders without errors', () => {
    wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders as an aside element', () => {
    wrapper = createWrapper();
    expect(wrapper.find('aside').exists()).toBe(true);
  });

  it('has admin-sidebar class', () => {
    wrapper = createWrapper();
    expect(wrapper.find('.admin-sidebar').exists()).toBe(true);
  });

  it('renders navigation menu', () => {
    wrapper = createWrapper();
    expect(wrapper.find('nav').exists()).toBe(true);
  });

  it('renders logo section', () => {
    wrapper = createWrapper();
    expect(wrapper.find('.pi-shield').exists()).toBe(true);
  });
});
