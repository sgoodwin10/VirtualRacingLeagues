import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import CtaSection from './CtaSection.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';

describe('CtaSection', () => {
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
    it('should render the section', () => {
      wrapper = mount(CtaSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      expect(wrapper.find('section').exists()).toBe(true);
    });

    it('should render the headline', () => {
      wrapper = mount(CtaSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      const heading = wrapper.find('h2');
      expect(heading.exists()).toBe(true);
      expect(heading.text()).toBe('READY TO START RACING?');
    });

    it('should render the subtitle', () => {
      wrapper = mount(CtaSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
          },
        },
      });

      const subtitle = wrapper.find('p');
      expect(subtitle.exists()).toBe(true);
      expect(subtitle.text()).toContain('Join hundreds of league managers');
    });

    it('should render CTA button', () => {
      wrapper = mount(CtaSection, {
        global: {
          plugins: [router],
        },
      });

      const button = wrapper.findComponent(VrlButton);
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('Create Your League Now');
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for register link', () => {
      wrapper = mount(CtaSection, {
        global: {
          plugins: [router],
        },
      });

      const registerLink = wrapper.find('a[href="/register"]');
      expect(registerLink.exists()).toBe(true);
    });
  });
});
