import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatItem from './StatItem.vue';

describe('StatItem', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mount(StatItem, {
        props: {
          value: '500+',
          label: 'Active Leagues',
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render the value', () => {
      const wrapper = mount(StatItem, {
        props: {
          value: '500+',
          label: 'Active Leagues',
        },
      });

      expect(wrapper.text()).toContain('500+');
    });

    it('should render the label', () => {
      const wrapper = mount(StatItem, {
        props: {
          value: '500+',
          label: 'Active Leagues',
        },
      });

      expect(wrapper.text()).toContain('Active Leagues');
    });

    it('should handle different stat values', () => {
      const wrapper = mount(StatItem, {
        props: {
          value: '10K+',
          label: 'Drivers',
        },
      });

      expect(wrapper.text()).toContain('10K+');
      expect(wrapper.text()).toContain('Drivers');
    });
  });
});
