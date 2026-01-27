import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import PublicHeader from './PublicHeader.vue';
import { useAuthStore } from '@public/stores/authStore';

describe('PublicHeader', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    setActivePinia(createPinia());

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/leagues', name: 'leagues', component: { template: '<div>Leagues</div>' } },
        { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
        { path: '/register', name: 'register', component: { template: '<div>Register</div>' } },
      ],
    });
  });

  describe('Rendering', () => {
    it('should render the header', () => {
      wrapper = mount(PublicHeader, {
        global: {
          plugins: [router],
        },
      });

      expect(wrapper.find('header').exists()).toBe(true);
      expect(wrapper.find('nav').exists()).toBe(true);
    });

    it('should render the app name/logo', () => {
      const appName = 'Test App';
      vi.stubEnv('VITE_APP_NAME', appName);

      wrapper = mount(PublicHeader, {
        global: {
          plugins: [router],
        },
      });

      const logoLink = wrapper.find('a[href="/"]');
      expect(logoLink.exists()).toBe(true);
      expect(logoLink.text()).toContain(appName);

      vi.unstubAllEnvs();
    });

    it('should render leagues link', () => {
      wrapper = mount(PublicHeader, {
        global: {
          plugins: [router],
        },
      });

      const leaguesLink = wrapper.find('a[href="/leagues"]');
      expect(leaguesLink.exists()).toBe(true);
      expect(leaguesLink.text()).toBe('Leagues');
    });

    it('should render login and sign up buttons when not authenticated', () => {
      const authStore = useAuthStore();
      authStore.isAuthenticated = false;

      wrapper = mount(PublicHeader, {
        global: {
          plugins: [router],
        },
      });

      const loginLink = wrapper.find('a[href="/login"]');
      const registerLink = wrapper.find('a[href="/register"]');

      expect(loginLink.exists()).toBe(true);
      expect(loginLink.text()).toBe('Login');
      expect(registerLink.exists()).toBe(true);
      expect(registerLink.text()).toBe('Sign Up');
    });

    it('should not render login and sign up buttons when authenticated', () => {
      const authStore = useAuthStore();
      authStore.isAuthenticated = true;

      wrapper = mount(PublicHeader, {
        global: {
          plugins: [router],
        },
      });

      const loginLink = wrapper.find('a[href="/login"]');
      const registerLink = wrapper.find('a[href="/register"]');

      expect(loginLink.exists()).toBe(false);
      expect(registerLink.exists()).toBe(false);
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for logo link', () => {
      wrapper = mount(PublicHeader, {
        global: {
          plugins: [router],
        },
      });

      const logoLink = wrapper.find('a[href="/"]');
      expect(logoLink.exists()).toBe(true);
    });

    it('should have correct href for leagues link', () => {
      wrapper = mount(PublicHeader, {
        global: {
          plugins: [router],
        },
      });

      const leaguesLink = wrapper.find('a[href="/leagues"]');
      expect(leaguesLink.exists()).toBe(true);
    });

    it('should have correct href for login link when not authenticated', () => {
      const authStore = useAuthStore();
      authStore.isAuthenticated = false;

      wrapper = mount(PublicHeader, {
        global: {
          plugins: [router],
        },
      });

      const loginLink = wrapper.find('a[href="/login"]');
      expect(loginLink.exists()).toBe(true);
    });

    it('should have correct href for register link when not authenticated', () => {
      const authStore = useAuthStore();
      authStore.isAuthenticated = false;

      wrapper = mount(PublicHeader, {
        global: {
          plugins: [router],
        },
      });

      const registerLink = wrapper.find('a[href="/register"]');
      expect(registerLink.exists()).toBe(true);
    });
  });
});
