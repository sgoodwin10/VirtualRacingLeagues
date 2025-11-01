import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createTestRouter, mountWithStubs } from '@app/__tests__/setup';
import Header from '@app/components/layout/Header.vue';
import { useUserStore } from '@app/stores/userStore';

describe('Header', () => {
  const router = createTestRouter([
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
  ]);

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the header with brand name', () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    // Set up authenticated user for authenticated-only dashboard
    const userStore = useUserStore();
    userStore.user = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };
    userStore.isAuthenticated = true;

    const wrapper = mountWithStubs(Header, {
      global: {
        plugins: [router, pinia],
      },
    });

    // Header now displays site name from siteConfigStore
    expect(wrapper.text()).toContain('Virtual Racing Leagues');
  });

  it('renders user menu with authenticated user', () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const userStore = useUserStore();
    userStore.user = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };
    userStore.isAuthenticated = true;

    const wrapper = mountWithStubs(Header, {
      global: {
        plugins: [router, pinia],
      },
    });

    // Header has navigation links but doesn't display user name directly
    expect(wrapper.text()).toContain('Your Leagues');
    expect(wrapper.text()).toContain('Profile');
    expect(wrapper.text()).toContain('Logout');
  });

  it('renders brand router link', () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    // Set up authenticated user
    const userStore = useUserStore();
    userStore.user = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };
    userStore.isAuthenticated = true;

    const wrapper = mountWithStubs(Header, {
      global: {
        plugins: [router, pinia],
      },
    });

    const brandLink = wrapper.find('a[href="/"]');
    expect(brandLink.exists()).toBe(true);
    expect(brandLink.text()).toContain('Virtual Racing Leagues');
  });

  it('opens profile modal when profile button is clicked', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    // Set up authenticated user
    const userStore = useUserStore();
    userStore.user = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };
    userStore.isAuthenticated = true;

    const wrapper = mountWithStubs(Header, {
      global: {
        plugins: [router, pinia],
      },
    });

    // Find and click the profile button
    const profileButton = wrapper.findAll('button').find((btn) => btn.text().includes('Profile'));
    expect(profileButton).toBeDefined();

    // ProfileSettingsModal should exist in the component
    const modal = wrapper.findComponent({ name: 'ProfileSettingsModal' });
    expect(modal.exists()).toBe(true);

    // Initially modal should not be visible
    expect(modal.props('visible')).toBe(false);

    await profileButton!.trigger('click');
    await wrapper.vm.$nextTick();

    // Modal should be visible after clicking
    expect(modal.props('visible')).toBe(true);
  });
});
