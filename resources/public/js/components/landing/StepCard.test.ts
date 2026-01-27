import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StepCard from './StepCard.vue';

describe('StepCard', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mount(StepCard, {
        props: {
          number: 1,
          title: 'Create Your League',
          description: 'Sign up and create your league',
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render the step number', () => {
      const wrapper = mount(StepCard, {
        props: {
          number: 1,
          title: 'Create Your League',
          description: 'Sign up and create your league',
        },
      });

      expect(wrapper.text()).toContain('1');
    });

    it('should render the title', () => {
      const wrapper = mount(StepCard, {
        props: {
          number: 1,
          title: 'Create Your League',
          description: 'Sign up and create your league',
        },
      });

      const title = wrapper.find('h3');
      expect(title.text()).toBe('Create Your League');
    });

    it('should render the description', () => {
      const wrapper = mount(StepCard, {
        props: {
          number: 1,
          title: 'Create Your League',
          description: 'Sign up and create your league',
        },
      });

      const description = wrapper.find('p');
      expect(description.text()).toBe('Sign up and create your league');
    });

    it('should show connector line when not last step', () => {
      const wrapper = mount(StepCard, {
        props: {
          number: 1,
          title: 'Create Your League',
          description: 'Sign up and create your league',
          isLast: false,
        },
      });

      const connector = wrapper.find('.absolute.top-1\\/2');
      expect(connector.exists()).toBe(true);
    });

    it('should not show connector line when last step', () => {
      const wrapper = mount(StepCard, {
        props: {
          number: 5,
          title: 'Share',
          description: 'Share your public link',
          isLast: true,
        },
      });

      const connector = wrapper.find('.absolute.top-1\\/2');
      expect(connector.exists()).toBe(false);
    });

    it('should default isLast to false', () => {
      const wrapper = mount(StepCard, {
        props: {
          number: 1,
          title: 'Create Your League',
          description: 'Sign up and create your league',
        },
      });

      const connector = wrapper.find('.absolute.top-1\\/2');
      expect(connector.exists()).toBe(true);
    });
  });
});
