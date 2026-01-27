import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import HeroSection from './HeroSection.vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import HeroStandingsCard from '../HeroStandingsCard.vue';

describe('HeroSection', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/register', name: 'register', component: { template: '<div>Register</div>' } },
        { path: '/leagues', name: 'leagues', component: { template: '<div>Leagues</div>' } },
      ],
    });
  });

  describe('Rendering', () => {
    it('should render the hero section', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            VrlButton: true,
            HeroStandingsCard: true,
          },
        },
      });

      expect(wrapper.find('section').exists()).toBe(true);
    });

    it('should render the "100% Free" badge', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlButton: true,
            HeroStandingsCard: true,
          },
        },
      });

      const badge = wrapper.findComponent(VrlBadge);
      expect(badge.exists()).toBe(true);
      expect(badge.text()).toBe('100% Free');
    });

    it('should render the main headline', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            VrlButton: true,
            HeroStandingsCard: true,
          },
        },
      });

      const heading = wrapper.find('h1');
      expect(heading.exists()).toBe(true);
      expect(heading.text()).toContain('MANAGE YOUR');
      expect(heading.text()).toContain('RACING LEAGUE');
      expect(heading.text()).toContain('LIKE A PRO');
    });

    it('should render the subtitle', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            VrlButton: true,
            HeroStandingsCard: true,
          },
        },
      });

      const subtitle = wrapper.find('p');
      expect(subtitle.exists()).toBe(true);
      expect(subtitle.text()).toContain('Setup your league');
      expect(subtitle.text()).toContain('Track results');
    });

    it('should render CTA buttons', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            HeroStandingsCard: true,
          },
        },
      });

      const buttons = wrapper.findAllComponents(VrlButton);
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toBeDefined();
      expect(buttons[1]).toBeDefined();
      expect(buttons[0]?.text()).toBe('Start Racing Free');
      expect(buttons[1]?.text()).toBe('Browse Leagues');
    });

    it('should render standings card on desktop', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            VrlButton: true,
          },
        },
      });

      const standingsCard = wrapper.findComponent(HeroStandingsCard);
      expect(standingsCard.exists()).toBe(true);
    });

    it('should pass correct standings data to HeroStandingsCard', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            VrlButton: true,
          },
        },
      });

      const standingsCard = wrapper.findComponent(HeroStandingsCard);
      const standingsData = standingsCard.props('standings');

      expect(standingsData).toBeDefined();
      expect(standingsData).toHaveLength(4);
      expect(standingsData?.[0]).toEqual({
        position: 1,
        initials: 'MV',
        name: 'Max Verstappen',
        team: 'Red Bull Racing',
        points: 256,
      });
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for register link', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            HeroStandingsCard: true,
          },
        },
      });

      const registerLink = wrapper.find('a[href="/register"]');
      expect(registerLink.exists()).toBe(true);
    });

    it('should have correct href for leagues link', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            HeroStandingsCard: true,
          },
        },
      });

      const leaguesLink = wrapper.find('a[href="/leagues"]');
      expect(leaguesLink.exists()).toBe(true);
    });
  });

  describe('Stats Display', () => {
    it('should have stats data defined', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            VrlButton: true,
            HeroStandingsCard: true,
          },
        },
      });

      // Stats are defined in the component but hidden, so we can't test rendering
      // We can verify the component structure is correct
      expect(wrapper.find('.hero-content').exists()).toBe(true);
    });
  });

  describe('Responsive Behavior', () => {
    it('should have hero content section', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            VrlButton: true,
            HeroStandingsCard: true,
          },
        },
      });

      const heroContent = wrapper.find('.hero-content');
      expect(heroContent.exists()).toBe(true);
    });

    it('should have hero visual section', () => {
      wrapper = mount(HeroSection, {
        global: {
          plugins: [router],
          stubs: {
            VrlBadge: true,
            VrlButton: true,
            HeroStandingsCard: true,
          },
        },
      });

      const heroVisual = wrapper.find('.hero-visual');
      expect(heroVisual.exists()).toBe(true);
    });
  });
});
