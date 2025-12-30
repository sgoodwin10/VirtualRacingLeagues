import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormCharacterCount from '../FormCharacterCount.vue';

describe('FormCharacterCount', () => {
  describe('Visual States', () => {
    it('should render default state (under 90%)', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 50,
          max: 100,
        },
      });

      const small = wrapper.find('small');
      expect(small.classes()).toContain('character-count');
      expect(small.classes()).not.toContain('character-count--warning');
      expect(small.classes()).not.toContain('character-count--error');
      expect(small.text()).toBe('50/100 characters');
    });

    it('should render warning state (90% or more)', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 91,
          max: 100,
        },
      });

      const small = wrapper.find('small');
      expect(small.classes()).toContain('character-count');
      expect(small.classes()).toContain('character-count--warning');
      expect(small.classes()).not.toContain('character-count--error');
      expect(small.text()).toBe('91/100 characters');
    });

    it('should render warning state at exactly 90%', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 90,
          max: 100,
        },
      });

      const small = wrapper.find('small');
      expect(small.classes()).toContain('character-count');
      expect(small.classes()).toContain('character-count--warning');
      expect(small.classes()).not.toContain('character-count--error');
      expect(small.text()).toBe('90/100 characters');
    });

    it('should render error state (over limit)', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 101,
          max: 100,
        },
      });

      const small = wrapper.find('small');
      expect(small.classes()).toContain('character-count');
      expect(small.classes()).not.toContain('character-count--warning');
      expect(small.classes()).toContain('character-count--error');
      expect(small.text()).toBe('101/100 characters');
    });

    it('should render default state at 89% (just below warning threshold)', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 89,
          max: 100,
        },
      });

      const small = wrapper.find('small');
      expect(small.classes()).toContain('character-count');
      expect(small.classes()).not.toContain('character-count--warning');
      expect(small.classes()).not.toContain('character-count--error');
      expect(small.text()).toBe('89/100 characters');
    });
  });

  describe('Props', () => {
    it('should display correct character count', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 25,
          max: 100,
        },
      });

      expect(wrapper.text()).toBe('25/100 characters');
    });

    it('should accept and apply custom class', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 50,
          max: 100,
          class: 'ml-2 custom-class',
        },
      });

      const small = wrapper.find('small');
      expect(small.classes()).toContain('character-count');
      expect(small.classes()).toContain('ml-2');
      expect(small.classes()).toContain('custom-class');
    });

    it('should work without custom class prop', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 50,
          max: 100,
        },
      });

      const small = wrapper.find('small');
      expect(small.classes()).toContain('character-count');
      expect(small.classes().length).toBeGreaterThanOrEqual(1);
    });

    it('should update display when current value changes', async () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 25,
          max: 100,
        },
      });

      expect(wrapper.text()).toBe('25/100 characters');

      await wrapper.setProps({ current: 75 });
      expect(wrapper.text()).toBe('75/100 characters');
    });

    it('should update state class when crossing thresholds', async () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 50,
          max: 100,
        },
      });

      const small = wrapper.find('small');

      // Default state
      expect(small.classes()).not.toContain('character-count--warning');
      expect(small.classes()).not.toContain('character-count--error');

      // Warning state
      await wrapper.setProps({ current: 90 });
      expect(small.classes()).toContain('character-count--warning');
      expect(small.classes()).not.toContain('character-count--error');

      // Error state
      await wrapper.setProps({ current: 101 });
      expect(small.classes()).not.toContain('character-count--warning');
      expect(small.classes()).toContain('character-count--error');

      // Back to default
      await wrapper.setProps({ current: 50 });
      expect(small.classes()).not.toContain('character-count--warning');
      expect(small.classes()).not.toContain('character-count--error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero current value', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 0,
          max: 100,
        },
      });

      const small = wrapper.find('small');
      expect(small.text()).toBe('0/100 characters');
      expect(small.classes()).toContain('character-count');
      expect(small.classes()).not.toContain('character-count--warning');
      expect(small.classes()).not.toContain('character-count--error');
    });

    it('should handle exact limit (should be error, at 100%)', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 100,
          max: 100,
        },
      });

      const small = wrapper.find('small');
      expect(small.text()).toBe('100/100 characters');
      expect(small.classes()).toContain('character-count--error');
      expect(small.classes()).not.toContain('character-count--warning');
    });

    it('should calculate threshold correctly at boundary', () => {
      // 89% - should be default
      const wrapper89 = mount(FormCharacterCount, {
        props: {
          current: 89,
          max: 100,
        },
      });
      expect(wrapper89.find('small').classes()).not.toContain('character-count--warning');

      // 90% - should be warning
      const wrapper90 = mount(FormCharacterCount, {
        props: {
          current: 90,
          max: 100,
        },
      });
      expect(wrapper90.find('small').classes()).toContain('character-count--warning');
    });

    it('should work with non-round max values', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 450,
          max: 500,
        },
      });

      const small = wrapper.find('small');
      expect(small.text()).toBe('450/500 characters');
      expect(small.classes()).toContain('character-count--warning'); // 90% of 500 is 450
    });

    it('should handle large character counts', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 9999,
          max: 10000,
        },
      });

      const small = wrapper.find('small');
      expect(small.text()).toBe('9999/10000 characters');
      expect(small.classes()).toContain('character-count--warning');
    });

    it('should handle very small limits', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 9,
          max: 10,
        },
      });

      const small = wrapper.find('small');
      expect(small.text()).toBe('9/10 characters');
      expect(small.classes()).toContain('character-count--warning'); // 90% of 10 is 9
    });

    it('should handle decimal thresholds correctly', () => {
      // Max of 150 means warning at 135 (90%)
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 134,
          max: 150,
        },
      });
      expect(wrapper.find('small').classes()).not.toContain('character-count--warning');

      const wrapperWarning = mount(FormCharacterCount, {
        props: {
          current: 135,
          max: 150,
        },
      });
      expect(wrapperWarning.find('small').classes()).toContain('character-count--warning');
    });
  });

  describe('Accessibility', () => {
    it('should render as semantic <small> element', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 50,
          max: 100,
        },
      });

      expect(wrapper.find('small').exists()).toBe(true);
      expect(wrapper.element.tagName.toLowerCase()).toBe('small');
    });

    it('should have readable text content', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 50,
          max: 100,
        },
      });

      const text = wrapper.text();
      expect(text).toMatch(/^\d+\/\d+ characters$/);
      expect(text).not.toContain('undefined');
      expect(text).not.toContain('null');
    });

    it('should maintain semantic structure in all states', () => {
      const states = [
        { current: 50, max: 100 }, // default
        { current: 90, max: 100 }, // warning
        { current: 101, max: 100 }, // error
      ];

      states.forEach(({ current, max }) => {
        const wrapper = mount(FormCharacterCount, {
          props: { current, max },
        });

        expect(wrapper.find('small').exists()).toBe(true);
        expect(wrapper.text()).toContain(`${current}/${max} characters`);
      });
    });
  });

  describe('Component Integration', () => {
    it('should work correctly in a form context', () => {
      // Simulate usage in DriverFormDialog
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 0,
          max: 500,
        },
      });

      expect(wrapper.text()).toBe('0/500 characters');
      expect(wrapper.find('small').classes()).toContain('character-count');
    });

    it('should preserve custom classes when applying state classes', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 101,
          max: 100,
          class: 'text-right mt-1',
        },
      });

      const small = wrapper.find('small');
      expect(small.classes()).toContain('character-count');
      expect(small.classes()).toContain('character-count--error');
      expect(small.classes()).toContain('text-right');
      expect(small.classes()).toContain('mt-1');
    });
  });

  describe('Styling', () => {
    it('should apply base character-count class', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 50,
          max: 100,
        },
      });

      expect(wrapper.find('small').classes()).toContain('character-count');
    });

    it('should apply warning modifier class when appropriate', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 91,
          max: 100,
        },
      });

      expect(wrapper.find('small').classes()).toContain('character-count--warning');
    });

    it('should apply error modifier class when appropriate', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 101,
          max: 100,
        },
      });

      expect(wrapper.find('small').classes()).toContain('character-count--error');
    });

    it('should not apply multiple state classes simultaneously', () => {
      const wrapper = mount(FormCharacterCount, {
        props: {
          current: 101,
          max: 100,
        },
      });

      const classes = wrapper.find('small').classes();
      const stateClasses = classes.filter((c) =>
        ['character-count--warning', 'character-count--error'].includes(c),
      );
      expect(stateClasses.length).toBe(1); // Only one state class should be present
    });
  });
});
