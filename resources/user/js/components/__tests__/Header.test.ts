import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createTestRouter, mountWithStubs } from '@user/__tests__/setup';
import Header from '@user/components/layout/Header.vue';
import { useUserStore } from '@user/stores/userStore';

describe('Header', () => {
  const router = createTestRouter([
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
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

    expect(wrapper.text()).toContain('User Dashboard');
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

    expect(wrapper.text()).toContain('John Doe');
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
    expect(brandLink.text()).toContain('User Dashboard');
  });
});
