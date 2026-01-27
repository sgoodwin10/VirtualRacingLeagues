import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ComingSoonItem from './ComingSoonItem.vue';

describe('ComingSoonItem', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mount(ComingSoonItem, {
        props: {
          icon: '📈',
          text: 'GT7 Daily Race Stats',
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render the icon', () => {
      const wrapper = mount(ComingSoonItem, {
        props: {
          icon: '📈',
          text: 'GT7 Daily Race Stats',
        },
      });

      expect(wrapper.text()).toContain('📈');
    });

    it('should render the feature text', () => {
      const wrapper = mount(ComingSoonItem, {
        props: {
          icon: '📈',
          text: 'GT7 Daily Race Stats',
        },
      });

      expect(wrapper.text()).toContain('GT7 Daily Race Stats');
    });

    it('should handle different feature items', () => {
      const wrapper = mount(ComingSoonItem, {
        props: {
          icon: '🤖',
          text: 'AI OCR Reader',
        },
      });

      expect(wrapper.text()).toContain('🤖');
      expect(wrapper.text()).toContain('AI OCR Reader');
    });
  });
});
