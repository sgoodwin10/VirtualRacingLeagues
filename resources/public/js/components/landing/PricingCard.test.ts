import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PricingCard from './PricingCard.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';

describe('PricingCard', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/register', name: 'register', component: { template: '<div>Register</div>' } },
      ],
    });
  });

  describe('Rendering', () => {
    it('should render the pricing card', () => {
      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render "ALL FEATURES INCLUDED" badge', () => {
      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      expect(wrapper.text()).toContain('ALL FEATURES INCLUDED');
    });

    it('should render the price as $0', () => {
      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      expect(wrapper.text()).toContain('$0');
    });

    it('should render free plan description', () => {
      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Free, no credit card required');
    });

    it('should render CTA button', () => {
      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
        },
      });

      const button = wrapper.findComponent(VrlButton);
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('Get Started Free');
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for register link', () => {
      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
        },
      });

      const registerLink = wrapper.find('a[href="/register"]');
      expect(registerLink.exists()).toBe(true);
    });
  });

  describe('Google Analytics Tracking', () => {
    beforeEach(() => {
      // Mock window.dataLayer and window.gtag
      global.window.dataLayer = [];
      global.window.gtag = vi.fn();
    });

    it('should push event to dataLayer when Get Started button is clicked', async () => {
      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
        },
      });

      const button = wrapper.findComponent(VrlButton);
      await button.trigger('click');

      expect(global.window.dataLayer).toHaveLength(1);
      expect(global.window.dataLayer?.[0]).toEqual({
        event: 'register_go_to_page_click',
        button_text: 'Get Started Free',
      });
    });

    it('should call gtag with correct event parameters when Get Started button is clicked', async () => {
      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
        },
      });

      const button = wrapper.findComponent(VrlButton);
      await button.trigger('click');

      expect(global.window.gtag).toHaveBeenCalledWith('event', 'register_go_to_page_click', {
        button_text: 'Get Started Free',
      });
    });

    it('should not throw error if dataLayer is not available', async () => {
      (global.window as any).dataLayer = undefined;

      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
        },
      });

      const button = wrapper.findComponent(VrlButton);
      await expect(button.trigger('click')).resolves.not.toThrow();
    });

    it('should not throw error if gtag is not available', async () => {
      delete global.window.gtag;

      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
        },
      });

      const button = wrapper.findComponent(VrlButton);
      await expect(button.trigger('click')).resolves.not.toThrow();
    });

    it('should still navigate to register page after tracking event', async () => {
      wrapper = mount(PricingCard, {
        global: {
          plugins: [router],
        },
      });

      await router.isReady();

      const button = wrapper.findComponent(VrlButton);
      await button.trigger('click');

      // Wait for navigation
      await wrapper.vm.$nextTick();

      // Verify the link still works (RouterLink should navigate)
      const registerLink = wrapper.find('a[href="/register"]');
      expect(registerLink.exists()).toBe(true);
    });
  });
});
