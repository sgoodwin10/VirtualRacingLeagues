import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PlatformCard from './PlatformCard.vue';

describe('PlatformCard', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mount(PlatformCard, {
        props: {
          icon: '🎮',
          name: 'Gran Turismo 7',
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render the icon', () => {
      const wrapper = mount(PlatformCard, {
        props: {
          icon: '🎮',
          name: 'Gran Turismo 7',
        },
      });

      expect(wrapper.text()).toContain('🎮');
    });

    it('should render the platform name', () => {
      const wrapper = mount(PlatformCard, {
        props: {
          icon: '🎮',
          name: 'Gran Turismo 7',
        },
      });

      expect(wrapper.text()).toContain('Gran Turismo 7');
    });

    it('should handle different platforms', () => {
      const wrapper = mount(PlatformCard, {
        props: {
          icon: '🏎️',
          name: 'iRacing',
        },
      });

      expect(wrapper.text()).toContain('🏎️');
      expect(wrapper.text()).toContain('iRacing');
    });
  });
});
