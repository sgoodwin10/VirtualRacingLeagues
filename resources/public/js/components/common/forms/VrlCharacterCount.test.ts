import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlCharacterCount from './VrlCharacterCount.vue';

describe('VrlCharacterCount', () => {
  describe('Rendering', () => {
    it('renders with default state', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 75,
          max: 500,
        },
      });
      expect(wrapper.text()).toContain('75 / 500');
      expect(wrapper.find('small').exists()).toBe(true);
    });

    it('displays correct count format', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 123,
          max: 1000,
        },
      });
      expect(wrapper.text()).toBe('123 / 1000');
    });

    it('renders with custom class', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 50,
          max: 100,
          class: 'custom-class',
        },
      });
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });

    it('renders as small element', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 0,
          max: 100,
        },
      });
      expect(wrapper.element.tagName).toBe('SMALL');
    });
  });

  describe('State Classes', () => {
    it('applies no state class when under 90%', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 89,
          max: 100,
        },
      });
      expect(wrapper.find('.warning').exists()).toBe(false);
      expect(wrapper.find('.error').exists()).toBe(false);
    });

    it('applies warning class at exactly 90% threshold', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 90,
          max: 100,
        },
      });
      expect(wrapper.find('small').classes()).toContain('text-[var(--orange)]');
      expect(wrapper.find('small').classes()).not.toContain('text-[var(--red)]');
    });

    it('applies warning class between 90% and 99%', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 95,
          max: 100,
        },
      });
      expect(wrapper.find('small').classes()).toContain('text-[var(--orange)]');
      expect(wrapper.find('small').classes()).not.toContain('text-[var(--red)]');
    });

    it('applies error class at exactly 100% threshold', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 100,
          max: 100,
        },
      });
      expect(wrapper.find('small').classes()).toContain('text-[var(--red)]');
      expect(wrapper.find('small').classes()).toContain('font-semibold');
    });

    it('applies error class when over 100%', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 150,
          max: 100,
        },
      });
      expect(wrapper.find('small').classes()).toContain('text-[var(--red)]');
      expect(wrapper.find('small').classes()).toContain('font-semibold');
    });
  });

  describe('Computed Properties', () => {
    it('calculates percentage correctly', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 50,
          max: 100,
        },
      });
      expect(wrapper.vm.percentage).toBe(50);
    });

    it('calculates isNearLimit correctly', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 90,
          max: 100,
        },
      });
      expect(wrapper.vm.isNearLimit).toBe(true);
    });

    it('calculates isAtLimit correctly', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 100,
          max: 100,
        },
      });
      expect(wrapper.vm.isAtLimit).toBe(true);
    });
  });

  describe('Reactivity', () => {
    it('updates count when current changes', async () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 50,
          max: 100,
        },
      });
      expect(wrapper.text()).toContain('50 / 100');

      await wrapper.setProps({ current: 75 });
      expect(wrapper.text()).toContain('75 / 100');
    });

    it('updates state class when approaching limit', async () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 50,
          max: 100,
        },
      });
      expect(wrapper.find('small').classes()).not.toContain('text-[var(--orange)]');

      await wrapper.setProps({ current: 90 });
      expect(wrapper.find('small').classes()).toContain('text-[var(--orange)]');

      await wrapper.setProps({ current: 100 });
      expect(wrapper.find('small').classes()).toContain('text-[var(--red)]');
    });

    it('updates max correctly', async () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 100,
          max: 200,
        },
      });
      expect(wrapper.text()).toContain('100 / 200');

      await wrapper.setProps({ max: 500 });
      expect(wrapper.text()).toContain('100 / 500');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero current', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 0,
          max: 100,
        },
      });
      expect(wrapper.text()).toContain('0 / 100');
      expect(wrapper.find('.warning').exists()).toBe(false);
      expect(wrapper.find('.error').exists()).toBe(false);
    });

    it('handles large numbers', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 9999,
          max: 10000,
        },
      });
      expect(wrapper.text()).toContain('9999 / 10000');
    });

    it('handles exceeding max significantly', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 500,
          max: 100,
        },
      });
      expect(wrapper.text()).toContain('500 / 100');
      expect(wrapper.find('small').classes()).toContain('text-[var(--red)]');
    });

    it('handles exactly at 90% with decimal calculation', () => {
      const wrapper = mount(VrlCharacterCount, {
        props: {
          current: 45,
          max: 50,
        },
      });
      expect(wrapper.vm.percentage).toBe(90);
      expect(wrapper.find('small').classes()).toContain('text-[var(--orange)]');
    });
  });
});
