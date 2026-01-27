import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import PricingSection from './PricingSection.vue';
import SectionHeader from '../SectionHeader.vue';
import PricingCard from '../PricingCard.vue';

describe('PricingSection', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(PricingSection, {
      global: {
        stubs: {
          SectionHeader: true,
          PricingCard: true,
        },
      },
    });
  });

  describe('Rendering', () => {
    it('should render the section', () => {
      expect(wrapper.find('section').exists()).toBe(true);
      expect(wrapper.find('section').attributes('id')).toBe('pricing');
    });

    it('should render the section header', () => {
      const sectionHeader = wrapper.findComponent(SectionHeader);
      expect(sectionHeader.exists()).toBe(true);
    });

    it('should render the pricing card', () => {
      const pricingCard = wrapper.findComponent(PricingCard);
      expect(pricingCard.exists()).toBe(true);
    });
  });
});
