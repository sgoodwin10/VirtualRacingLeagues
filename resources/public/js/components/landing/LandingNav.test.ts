import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import LandingNav from './LandingNav.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';

describe('LandingNav', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
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
    it('should render the navigation', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      expect(wrapper.find('nav').exists()).toBe(true);
    });

    it('should render the logo/brand', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      const logoLink = wrapper.find('a[href="/"]');
      expect(logoLink.exists()).toBe(true);
      expect(logoLink.text()).toContain('Virtual Racing Leagues');
    });

    it('should render navigation links', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      const featuresLink = wrapper.find('a[href="#features"]');
      const howItWorksLink = wrapper.find('a[href="#how-it-works"]');
      const leaguesLink = wrapper.find('a[href="/leagues"]');

      expect(featuresLink.exists()).toBe(true);
      expect(featuresLink.text()).toBe('Features');
      expect(howItWorksLink.exists()).toBe(true);
      expect(howItWorksLink.text()).toBe('How It Works');
      expect(leaguesLink.exists()).toBe(true);
      expect(leaguesLink.text()).toBe('Browse Leagues');
    });

    it('should render login button', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
        },
      });

      const loginLink = wrapper.find('a[href="/login"]');
      expect(loginLink.exists()).toBe(true);

      const loginButton = loginLink.findComponent(VrlButton);
      expect(loginButton.exists()).toBe(true);
      expect(loginButton.text()).toBe('Login');
    });

    it('should render get started button', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
        },
      });

      const registerLink = wrapper.find('a[href="/register"]');
      expect(registerLink.exists()).toBe(true);

      const registerButton = registerLink.findComponent(VrlButton);
      expect(registerButton.exists()).toBe(true);
      expect(registerButton.text()).toBe('Get Started');
    });

    it('should have fixed positioning', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      const nav = wrapper.find('nav');
      expect(nav.classes()).toContain('fixed');
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for logo link', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      const logoLink = wrapper.find('a[href="/"]');
      expect(logoLink.exists()).toBe(true);
    });

    it('should have correct href for leagues link', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      const leaguesLink = wrapper.find('a[href="/leagues"]');
      expect(leaguesLink.exists()).toBe(true);
    });

    it('should have correct href for login link', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
        },
      });

      const loginLink = wrapper.find('a[href="/login"]');
      expect(loginLink.exists()).toBe(true);
    });

    it('should have correct href for register link', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
        },
      });

      const registerLink = wrapper.find('a[href="/register"]');
      expect(registerLink.exists()).toBe(true);
    });
  });

  describe('Smooth Scroll', () => {
    it('should handle smooth scroll on same page', async () => {
      // Mock scrollIntoView
      const scrollIntoViewMock = vi.fn();
      const mockElement = {
        scrollIntoView: scrollIntoViewMock,
      };

      vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as any);

      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      await router.push('/');

      const featuresLink = wrapper.find('a[href="#features"]');
      await featuresLink.trigger('click');

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

      vi.restoreAllMocks();
    });

    it('should have anchor links for smooth scrolling', () => {
      wrapper = mount(LandingNav, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      const featuresLink = wrapper.find('a[href="#features"]');
      const howItWorksLink = wrapper.find('a[href="#how-it-works"]');

      expect(featuresLink.exists()).toBe(true);
      expect(howItWorksLink.exists()).toBe(true);
    });
  });
});
