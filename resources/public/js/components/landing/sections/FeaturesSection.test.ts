import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import FeaturesSection from './FeaturesSection.vue';
import VrlFeatureCard from '@public/components/common/cards/VrlFeatureCard.vue';
import SectionHeader from '../SectionHeader.vue';

describe('FeaturesSection', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(FeaturesSection, {
      global: {
        stubs: {
          VrlFeatureCard: true,
          SectionHeader: true,
        },
      },
    });
  });

  describe('Rendering', () => {
    it('should render the section', () => {
      expect(wrapper.find('section').exists()).toBe(true);
      expect(wrapper.find('section').attributes('id')).toBe('features');
    });

    it('should render the section header', () => {
      const sectionHeader = wrapper.findComponent(SectionHeader);
      expect(sectionHeader.exists()).toBe(true);
    });

    it('should render 6 feature cards', () => {
      wrapper = mount(FeaturesSection);

      const featureCards = wrapper.findAllComponents(VrlFeatureCard);
      expect(featureCards).toHaveLength(6);
    });

    it('should render features grid', () => {
      const grid = wrapper.find('.grid');
      expect(grid.exists()).toBe(true);
    });
  });

  describe('Feature Cards Content', () => {
    beforeEach(() => {
      wrapper = mount(FeaturesSection);
    });

    it('should render feature card with Multiple Competitions & Seasons', () => {
      const featureCards = wrapper.findAllComponents(VrlFeatureCard);
      const competitionsCard = featureCards.find((card) =>
        card.props('title')?.includes('Multiple Competitions'),
      );

      expect(competitionsCard).toBeDefined();
      expect(competitionsCard?.props('iconText')).toBe('🏆');
    });

    it('should render feature card with Automatic Standings', () => {
      const featureCards = wrapper.findAllComponents(VrlFeatureCard);
      const standingsCard = featureCards.find((card) =>
        card.props('title')?.includes('Automatic Standings'),
      );

      expect(standingsCard).toBeDefined();
      expect(standingsCard?.props('iconText')).toBe('📊');
    });

    it('should render feature card with Driver Management', () => {
      const featureCards = wrapper.findAllComponents(VrlFeatureCard);
      const driverCard = featureCards.find((card) =>
        card.props('title')?.includes('Driver Management'),
      );

      expect(driverCard).toBeDefined();
      expect(driverCard?.props('iconText')).toBe('👥');
    });

    it('should render feature card with CSV Import/Export', () => {
      const featureCards = wrapper.findAllComponents(VrlFeatureCard);
      const csvCard = featureCards.find((card) => card.props('title')?.includes('CSV Import'));

      expect(csvCard).toBeDefined();
      expect(csvCard?.props('iconText')).toBe('📤');
    });

    it('should render feature card with Shareable Links', () => {
      const featureCards = wrapper.findAllComponents(VrlFeatureCard);
      const linksCard = featureCards.find((card) =>
        card.props('title')?.includes('Shareable Links'),
      );

      expect(linksCard).toBeDefined();
      expect(linksCard?.props('iconText')).toBe('🔗');
    });

    it('should render feature card with Multi-Platform Support', () => {
      const featureCards = wrapper.findAllComponents(VrlFeatureCard);
      const platformCard = featureCards.find((card) =>
        card.props('title')?.includes('Multi-Platform Support'),
      );

      expect(platformCard).toBeDefined();
      expect(platformCard?.props('iconText')).toBe('🏁');
    });

    it('should pass descriptions to feature cards', () => {
      const featureCards = wrapper.findAllComponents(VrlFeatureCard);

      featureCards.forEach((card) => {
        expect(card.props('description')).toBeTruthy();
        expect(card.props('description')).not.toBe('');
      });
    });
  });
});
