import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import HowItWorksSection from './HowItWorksSection.vue';
import SectionHeader from '../SectionHeader.vue';
import StepCard from '../StepCard.vue';

describe('HowItWorksSection', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(HowItWorksSection, {
      global: {
        stubs: {
          SectionHeader: true,
          StepCard: true,
        },
      },
    });
  });

  describe('Rendering', () => {
    it('should render the section', () => {
      expect(wrapper.find('section').exists()).toBe(true);
      expect(wrapper.find('section').attributes('id')).toBe('how-it-works');
    });

    it('should render the section header', () => {
      const sectionHeader = wrapper.findComponent(SectionHeader);
      expect(sectionHeader.exists()).toBe(true);
    });

    it('should render 5 step cards', () => {
      wrapper = mount(HowItWorksSection);

      const stepCards = wrapper.findAllComponents(StepCard);
      expect(stepCards).toHaveLength(5);
    });

    it('should render steps container', () => {
      const stepsContainer = wrapper.find('.flex');
      expect(stepsContainer.exists()).toBe(true);
    });
  });

  describe('Step Cards Content', () => {
    beforeEach(() => {
      wrapper = mount(HowItWorksSection);
    });

    it('should render step 1: Create Your League', () => {
      const stepCards = wrapper.findAllComponents(StepCard);
      const step1 = stepCards[0];

      expect(step1).toBeDefined();
      expect(step1?.props('number')).toBe(1);
      expect(step1?.props('title')).toBe('Create Your League');
      expect(step1?.props('description')).toContain('Sign up and create your league');
    });

    it('should render step 2: Add Drivers', () => {
      const stepCards = wrapper.findAllComponents(StepCard);
      const step2 = stepCards[1];

      expect(step2).toBeDefined();
      expect(step2?.props('number')).toBe(2);
      expect(step2?.props('title')).toBe('Add Drivers');
      expect(step2?.props('description')).toContain('Import your driver roster');
    });

    it('should render step 3: Setup Season', () => {
      const stepCards = wrapper.findAllComponents(StepCard);
      const step3 = stepCards[2];

      expect(step3).toBeDefined();
      expect(step3?.props('number')).toBe(3);
      expect(step3?.props('title')).toBe('Setup Season');
      expect(step3?.props('description')).toContain('Create competitions');
    });

    it('should render step 4: Enter Results', () => {
      const stepCards = wrapper.findAllComponents(StepCard);
      const step4 = stepCards[3];

      expect(step4).toBeDefined();
      expect(step4?.props('number')).toBe(4);
      expect(step4?.props('title')).toBe('Enter Results');
      expect(step4?.props('description')).toContain('Add race results');
    });

    it('should render step 5: Share', () => {
      const stepCards = wrapper.findAllComponents(StepCard);
      const step5 = stepCards[4];

      expect(step5).toBeDefined();
      expect(step5?.props('number')).toBe(5);
      expect(step5?.props('title')).toBe('Share');
      expect(step5?.props('description')).toContain('Share your public link');
    });

    it('should mark last step card as last', () => {
      const stepCards = wrapper.findAllComponents(StepCard);
      const lastStep = stepCards[stepCards.length - 1];

      expect(lastStep).toBeDefined();
      expect(lastStep?.props('isLast')).toBe(true);
    });

    it('should not mark other steps as last', () => {
      const stepCards = wrapper.findAllComponents(StepCard);

      for (let i = 0; i < stepCards.length - 1; i++) {
        expect(stepCards[i]).toBeDefined();
        expect(stepCards[i]?.props('isLast')).toBe(false);
      }
    });
  });
});
