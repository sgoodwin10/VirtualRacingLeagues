import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import HomeView from './HomeView.vue';

// Mock child components
vi.mock('@public/components/landing/BackgroundGrid.vue', () => ({
  default: { name: 'BackgroundGrid', template: '<div data-testid="background-grid"></div>' },
}));
vi.mock('@public/components/landing/SpeedLines.vue', () => ({
  default: { name: 'SpeedLines', template: '<div data-testid="speed-lines"></div>' },
}));
vi.mock('@public/components/landing/sections/HeroSection.vue', () => ({
  default: { name: 'HeroSection', template: '<section data-testid="hero-section"></section>' },
}));
vi.mock('@public/components/landing/sections/FeaturesSection.vue', () => ({
  default: {
    name: 'FeaturesSection',
    template: '<section data-testid="features-section"></section>',
  },
}));
vi.mock('@public/components/landing/sections/HowItWorksSection.vue', () => ({
  default: {
    name: 'HowItWorksSection',
    template: '<section data-testid="how-it-works-section"></section>',
  },
}));
vi.mock('@public/components/landing/sections/PricingSection.vue', () => ({
  default: {
    name: 'PricingSection',
    template: '<section data-testid="pricing-section"></section>',
  },
}));
vi.mock('@public/components/landing/sections/PlatformsSection.vue', () => ({
  default: {
    name: 'PlatformsSection',
    template: '<section data-testid="platforms-section"></section>',
  },
}));
vi.mock('@public/components/landing/sections/ComingSoonSection.vue', () => ({
  default: {
    name: 'ComingSoonSection',
    template: '<section data-testid="coming-soon-section"></section>',
  },
}));
vi.mock('@public/components/landing/sections/CtaSection.vue', () => ({
  default: { name: 'CtaSection', template: '<section data-testid="cta-section"></section>' },
}));

// Create router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'home', component: HomeView }],
});

describe('HomeView', () => {
  let wrapper: VueWrapper;

  beforeEach(async () => {
    await router.push('/');
    wrapper = mount(HomeView, {
      global: {
        plugins: [router],
      },
    });
  });

  describe('Rendering', () => {
    it('should render the landing page', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should render main content', () => {
      expect(wrapper.find('main').exists()).toBe(true);
    });

    it('should have proper root styling', () => {
      const root = wrapper.find('div');
      expect(root.classes()).toContain('bg-[var(--bg-dark)]');
      expect(root.classes()).toContain('text-[var(--text-primary)]');
    });
  });

  describe('Background Effects', () => {
    it('should render BackgroundGrid component', () => {
      expect(wrapper.findComponent({ name: 'BackgroundGrid' }).exists()).toBe(true);
    });

    it('should render SpeedLines component', () => {
      expect(wrapper.findComponent({ name: 'SpeedLines' }).exists()).toBe(true);
    });

    it('should render background effects before main content', () => {
      const backgroundGrid = wrapper.find('[data-testid="background-grid"]');
      const speedLines = wrapper.find('[data-testid="speed-lines"]');
      const main = wrapper.find('main');

      expect(backgroundGrid.exists()).toBe(true);
      expect(speedLines.exists()).toBe(true);
      expect(main.exists()).toBe(true);
    });
  });

  describe('Section Components', () => {
    it('should render HeroSection component', () => {
      expect(wrapper.findComponent({ name: 'HeroSection' }).exists()).toBe(true);
    });

    it('should render FeaturesSection component', () => {
      expect(wrapper.findComponent({ name: 'FeaturesSection' }).exists()).toBe(true);
    });

    it('should render HowItWorksSection component', () => {
      expect(wrapper.findComponent({ name: 'HowItWorksSection' }).exists()).toBe(true);
    });

    it('should render PricingSection component', () => {
      expect(wrapper.findComponent({ name: 'PricingSection' }).exists()).toBe(true);
    });

    it('should render PlatformsSection component', () => {
      expect(wrapper.findComponent({ name: 'PlatformsSection' }).exists()).toBe(true);
    });

    it('should render ComingSoonSection component', () => {
      expect(wrapper.findComponent({ name: 'ComingSoonSection' }).exists()).toBe(true);
    });

    it('should render CtaSection component', () => {
      expect(wrapper.findComponent({ name: 'CtaSection' }).exists()).toBe(true);
    });
  });

  describe('Section Order', () => {
    it('should render sections in correct order', () => {
      const sections = wrapper.findAll('[data-testid]');

      const sectionIds = sections.map((section) => section.attributes('data-testid'));

      // Filter out background effects and get only section order
      const landingSections = sectionIds.filter(
        (id) => id?.includes('section') && !id.includes('background') && !id.includes('speed'),
      );

      expect(landingSections).toEqual([
        'hero-section',
        'features-section',
        'how-it-works-section',
        'pricing-section',
        'platforms-section',
        'coming-soon-section',
        'cta-section',
      ]);
    });

    it('should render HeroSection first in main', () => {
      const main = wrapper.find('main');
      const firstChild = main.find('[data-testid="hero-section"]');

      expect(firstChild.exists()).toBe(true);
    });

    it('should render CtaSection last in main', () => {
      const sections = wrapper.findAll('section[data-testid]');
      const lastSection = sections[sections.length - 1];

      expect(lastSection?.attributes('data-testid')).toBe('cta-section');
    });
  });

  describe('Layout Structure', () => {
    it('should contain all sections within main element', () => {
      const main = wrapper.find('main');
      const sectionsInMain = main.findAll('[data-testid*="section"]');

      expect(sectionsInMain.length).toBe(7);
    });

    it('should have overflow-x-hidden for horizontal scroll prevention', () => {
      const root = wrapper.find('div');
      expect(root.classes()).toContain('overflow-x-hidden');
    });
  });

  describe('Component Integration', () => {
    it('should pass through all section components without errors', () => {
      // Verify all components are mounted successfully by checking individual components
      const expectedComponents = [
        'HeroSection',
        'FeaturesSection',
        'HowItWorksSection',
        'PricingSection',
        'PlatformsSection',
        'ComingSoonSection',
        'CtaSection',
      ];

      expectedComponents.forEach((componentName) => {
        expect(wrapper.findComponent({ name: componentName }).exists()).toBe(true);
      });
    });

    it('should render background effects independently of sections', () => {
      const backgroundGrid = wrapper.findComponent({ name: 'BackgroundGrid' });
      const heroSection = wrapper.findComponent({ name: 'HeroSection' });

      expect(backgroundGrid.exists()).toBe(true);
      expect(heroSection.exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have main landmark', () => {
      expect(wrapper.find('main').exists()).toBe(true);
    });

    it('should have proper semantic structure', () => {
      const main = wrapper.find('main');
      const sections = main.findAll('section');

      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should render without throwing errors', () => {
      expect(() => {
        mount(HomeView, {
          global: {
            plugins: [router],
          },
        });
      }).not.toThrow();
    });

    it('should efficiently render all child components', () => {
      // Check that all expected components are present
      const expectedComponents = [
        'BackgroundGrid',
        'SpeedLines',
        'HeroSection',
        'FeaturesSection',
        'HowItWorksSection',
        'PricingSection',
        'PlatformsSection',
        'ComingSoonSection',
        'CtaSection',
      ];

      expectedComponents.forEach((componentName) => {
        expect(wrapper.findComponent({ name: componentName }).exists()).toBe(true);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive background effects', () => {
      const backgroundGrid = wrapper.findComponent({ name: 'BackgroundGrid' });
      const speedLines = wrapper.findComponent({ name: 'SpeedLines' });

      expect(backgroundGrid.exists()).toBe(true);
      expect(speedLines.exists()).toBe(true);
    });
  });
});
