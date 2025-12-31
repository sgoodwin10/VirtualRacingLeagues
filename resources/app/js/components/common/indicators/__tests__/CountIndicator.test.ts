import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CountIndicator from '../CountIndicator.vue';

describe('CountIndicator', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(CountIndicator);

      expect(wrapper.find('.count-indicator').exists()).toBe(true);
      expect(wrapper.text()).toBe('0');
    });

    it('renders with default cyan variant', () => {
      const wrapper = mount(CountIndicator);

      expect(wrapper.classes()).toContain('count-indicator');
      expect(wrapper.classes()).toContain('count-indicator--cyan');
    });

    it('renders as a span element', () => {
      const wrapper = mount(CountIndicator);

      expect(wrapper.element.tagName).toBe('SPAN');
    });
  });

  describe('Count Prop - Numeric Values', () => {
    it('renders zero count correctly', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 0,
        },
      });

      expect(wrapper.text()).toBe('0');
    });

    it('renders single digit count', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 5,
        },
      });

      expect(wrapper.text()).toBe('5');
    });

    it('renders double digit count', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 42,
        },
      });

      expect(wrapper.text()).toBe('42');
    });

    it('renders count equal to max', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 99,
          max: 99,
        },
      });

      expect(wrapper.text()).toBe('99');
    });

    it('renders large count within max limit', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 150,
          max: 200,
        },
      });

      expect(wrapper.text()).toBe('150');
    });
  });

  describe('Count Prop - String Values', () => {
    it('renders string count as-is', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 'NEW',
        },
      });

      expect(wrapper.text()).toBe('NEW');
    });

    it('renders numeric string as-is', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: '123',
        },
      });

      expect(wrapper.text()).toBe('123');
    });

    it('renders empty string', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: '',
        },
      });

      expect(wrapper.text()).toBe('');
    });

    it('renders special characters in string count', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: '10+',
        },
      });

      expect(wrapper.text()).toBe('10+');
    });
  });

  describe('Max Overflow Logic', () => {
    it('displays max+ when count exceeds max (default max of 99)', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 100,
        },
      });

      expect(wrapper.text()).toBe('99+');
    });

    it('displays max+ when count exceeds max (custom max)', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 150,
          max: 100,
        },
      });

      expect(wrapper.text()).toBe('100+');
    });

    it('displays max+ when count significantly exceeds max', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 9999,
          max: 99,
        },
      });

      expect(wrapper.text()).toBe('99+');
    });

    it('displays max+ with small max value', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 10,
          max: 5,
        },
      });

      expect(wrapper.text()).toBe('5+');
    });

    it('does not add + when count is exactly at max', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 50,
          max: 50,
        },
      });

      expect(wrapper.text()).toBe('50');
    });

    it('does not apply max logic to string counts', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: '999',
          max: 99,
        },
      });

      expect(wrapper.text()).toBe('999');
    });
  });

  describe('Variant Prop', () => {
    it('renders cyan variant correctly', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          variant: 'cyan',
          count: 5,
        },
      });

      expect(wrapper.classes()).toContain('count-indicator--cyan');
      expect(wrapper.classes()).not.toContain('count-indicator--orange');
      expect(wrapper.classes()).not.toContain('count-indicator--red');
    });

    it('renders orange variant correctly', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          variant: 'orange',
          count: 10,
        },
      });

      expect(wrapper.classes()).toContain('count-indicator--orange');
      expect(wrapper.classes()).not.toContain('count-indicator--cyan');
      expect(wrapper.classes()).not.toContain('count-indicator--red');
    });

    it('renders red variant correctly', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          variant: 'red',
          count: 15,
        },
      });

      expect(wrapper.classes()).toContain('count-indicator--red');
      expect(wrapper.classes()).not.toContain('count-indicator--cyan');
      expect(wrapper.classes()).not.toContain('count-indicator--orange');
    });

    it('applies default cyan variant when not specified', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 20,
        },
      });

      expect(wrapper.classes()).toContain('count-indicator--cyan');
    });
  });

  describe('Combined Props', () => {
    it('handles all props together with numeric count', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 42,
          variant: 'orange',
          max: 99,
        },
      });

      expect(wrapper.classes()).toContain('count-indicator');
      expect(wrapper.classes()).toContain('count-indicator--orange');
      expect(wrapper.text()).toBe('42');
    });

    it('handles all props together with count exceeding max', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 150,
          variant: 'red',
          max: 100,
        },
      });

      expect(wrapper.classes()).toContain('count-indicator--red');
      expect(wrapper.text()).toBe('100+');
    });

    it('handles all props together with string count', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 'ALERT',
          variant: 'red',
          max: 50,
        },
      });

      expect(wrapper.classes()).toContain('count-indicator--red');
      expect(wrapper.text()).toBe('ALERT');
    });

    it('handles cyan variant with zero count', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 0,
          variant: 'cyan',
        },
      });

      expect(wrapper.classes()).toContain('count-indicator--cyan');
      expect(wrapper.text()).toBe('0');
    });

    it('handles orange variant with max overflow', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 200,
          variant: 'orange',
          max: 99,
        },
      });

      expect(wrapper.classes()).toContain('count-indicator--orange');
      expect(wrapper.text()).toBe('99+');
    });
  });

  describe('Edge Cases', () => {
    it('handles negative count', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: -5,
        },
      });

      expect(wrapper.text()).toBe('-5');
    });

    it('handles very large count with overflow', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 999999,
          max: 999,
        },
      });

      expect(wrapper.text()).toBe('999+');
    });

    it('handles max of 0', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 5,
          max: 0,
        },
      });

      expect(wrapper.text()).toBe('0+');
    });

    it('handles count of 1 with max of 1', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 1,
          max: 1,
        },
      });

      expect(wrapper.text()).toBe('1');
    });

    it('handles floating point count by converting to string', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 5.5,
        },
      });

      expect(wrapper.text()).toBe('5.5');
    });
  });

  describe('Accessibility', () => {
    it('displays count content for screen readers', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 42,
        },
      });

      expect(wrapper.text()).toBe('42');
    });

    it('displays overflow indicator for screen readers', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 150,
          max: 99,
        },
      });

      expect(wrapper.text()).toBe('99+');
    });

    it('displays string count for screen readers', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 'NEW',
        },
      });

      expect(wrapper.text()).toBe('NEW');
    });
  });

  describe('HTML Structure', () => {
    it('always includes base count-indicator class', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          variant: 'red',
          count: 99,
        },
      });

      expect(wrapper.classes()).toContain('count-indicator');
    });

    it('renders single root element', () => {
      const wrapper = mount(CountIndicator);

      expect(wrapper.element.children.length).toBe(0);
      expect(wrapper.element.tagName).toBe('SPAN');
    });

    it('has no child elements', () => {
      const wrapper = mount(CountIndicator, {
        props: {
          count: 42,
        },
      });

      expect(wrapper.element.children.length).toBe(0);
      expect(wrapper.text()).toBe('42');
    });
  });
});
