import { describe, it, expect, beforeEach } from 'vitest';
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
});
