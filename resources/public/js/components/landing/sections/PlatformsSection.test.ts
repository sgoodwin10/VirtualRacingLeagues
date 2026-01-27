import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import PlatformsSection from './PlatformsSection.vue';
import SectionHeader from '../SectionHeader.vue';
import PlatformCard from '../PlatformCard.vue';

describe('PlatformsSection', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(PlatformsSection, {
      global: {
        stubs: {
          SectionHeader: true,
          PlatformCard: true,
        },
      },
    });
  });

  describe('Rendering', () => {
    it('should render the section', () => {
      expect(wrapper.find('section').exists()).toBe(true);
    });

    it('should render the section header', () => {
      const sectionHeader = wrapper.findComponent(SectionHeader);
      expect(sectionHeader.exists()).toBe(true);
    });

    it('should render platform cards', () => {
      wrapper = mount(PlatformsSection);

      const platformCards = wrapper.findAllComponents(PlatformCard);
      expect(platformCards).toHaveLength(2);
    });

    it('should render platforms container', () => {
      const container = wrapper.find('.flex');
      expect(container.exists()).toBe(true);
    });
  });

  describe('Platform Cards Content', () => {
    beforeEach(() => {
      wrapper = mount(PlatformsSection);
    });

    it('should render Gran Turismo 7 platform card', () => {
      const platformCards = wrapper.findAllComponents(PlatformCard);
      const gt7Card = platformCards.find((card) => card.props('name') === 'Gran Turismo 7');

      expect(gt7Card).toBeDefined();
      expect(gt7Card?.props('icon')).toBe('🎮');
    });

    it('should render iRacing platform card', () => {
      const platformCards = wrapper.findAllComponents(PlatformCard);
      const iRacingCard = platformCards.find((card) => card.props('name') === 'iRacing');

      expect(iRacingCard).toBeDefined();
      expect(iRacingCard?.props('icon')).toBe('🏎️');
    });
  });
});
