import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlTag from '../VrlTag.vue';

describe('VrlTag', () => {
  describe('Rendering', () => {
    it('renders with default variant', () => {
      const wrapper = mount(VrlTag, {
        slots: {
          default: 'Test Tag',
        },
      });

      expect(wrapper.text()).toBe('Test Tag');
      expect(wrapper.classes()).toContain('inline-flex');
      expect(wrapper.classes()).toContain('items-center');
    });

    it('renders slot content', () => {
      const wrapper = mount(VrlTag, {
        slots: {
          default: 'GT7',
        },
      });

      expect(wrapper.text()).toBe('GT7');
    });

    it('renders as a span element', () => {
      const wrapper = mount(VrlTag, {
        slots: {
          default: 'Test',
        },
      });

      expect(wrapper.element.tagName).toBe('SPAN');
    });

    it('renders with empty slot content', () => {
      const wrapper = mount(VrlTag);
      expect(wrapper.text()).toBe('');
    });
  });

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      const wrapper = mount(VrlTag, {
        props: { variant: 'default' },
        slots: { default: 'Default' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--bg-elevated)]');
      expect(wrapper.classes()).toContain('text-[var(--text-secondary)]');
    });

    it('renders cyan variant correctly', () => {
      const wrapper = mount(VrlTag, {
        props: { variant: 'cyan' },
        slots: { default: 'Platform' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--cyan)]');
    });

    it('renders success variant correctly', () => {
      const wrapper = mount(VrlTag, {
        props: { variant: 'success' },
        slots: { default: 'Complete' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--green-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--green)]');
    });

    it('renders warning variant correctly', () => {
      const wrapper = mount(VrlTag, {
        props: { variant: 'warning' },
        slots: { default: 'Warning' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--orange-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--orange)]');
    });

    it('renders danger variant correctly', () => {
      const wrapper = mount(VrlTag, {
        props: { variant: 'danger' },
        slots: { default: 'Error' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--red-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--red)]');
    });

    const variants = ['default', 'cyan', 'success', 'warning', 'danger'] as const;

    variants.forEach((variant) => {
      it(`applies correct styling for ${variant} variant`, () => {
        const wrapper = mount(VrlTag, {
          props: { variant },
          slots: { default: 'Test' },
        });

        expect(wrapper.classes()).toContain('inline-flex');
        expect(wrapper.classes()).toContain('items-center');
      });
    });
  });

  describe('Typography', () => {
    it('applies correct font size', () => {
      const wrapper = mount(VrlTag, {
        slots: { default: 'Test' },
      });

      expect(wrapper.classes()).toContain('text-[0.7rem]');
    });

    it('applies correct padding and border radius', () => {
      const wrapper = mount(VrlTag, {
        slots: { default: 'Test' },
      });

      // Check that base classes are applied
      expect(wrapper.classes()).toContain('px-2');
      expect(wrapper.classes()).toContain('py-1');
    });
  });

  describe('Accessibility', () => {
    it('text content is readable by screen readers', () => {
      const wrapper = mount(VrlTag, {
        slots: { default: 'GT7' },
      });

      expect(wrapper.text()).toBe('GT7');
    });

    it('renders as inline element', () => {
      const wrapper = mount(VrlTag, {
        slots: { default: 'Test' },
      });

      // Check that it renders as a span (which is inline by default)
      expect(wrapper.element.tagName).toBe('SPAN');
    });

    it('has semantic structure', () => {
      const wrapper = mount(VrlTag, {
        slots: { default: 'Test' },
      });

      expect(wrapper.element.tagName).toBe('SPAN');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long text content', () => {
      const longText = 'This is a very long tag text that might overflow the container';
      const wrapper = mount(VrlTag, {
        slots: { default: longText },
      });

      expect(wrapper.text()).toBe(longText);
    });

    it('handles special characters in content', () => {
      const wrapper = mount(VrlTag, {
        slots: { default: 'GT7 / iRacing & More!' },
      });

      expect(wrapper.text()).toBe('GT7 / iRacing & More!');
    });

    it('handles numeric content', () => {
      const wrapper = mount(VrlTag, {
        slots: { default: '123' },
      });

      expect(wrapper.text()).toBe('123');
    });

    it('multiple tags can be rendered together', () => {
      const wrapper1 = mount(VrlTag, {
        props: { variant: 'cyan' },
        slots: { default: 'Tag 1' },
      });

      const wrapper2 = mount(VrlTag, {
        props: { variant: 'success' },
        slots: { default: 'Tag 2' },
      });

      expect(wrapper1.exists()).toBe(true);
      expect(wrapper2.exists()).toBe(true);
      expect(wrapper1.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(wrapper2.classes()).toContain('bg-[var(--green-dim)]');
    });

    it('handles mixed case text', () => {
      const wrapper = mount(VrlTag, {
        slots: { default: 'MixedCase' },
      });

      expect(wrapper.text()).toBe('MixedCase');
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for default variant', () => {
      const wrapper = mount(VrlTag, {
        slots: { default: 'Default' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for cyan variant', () => {
      const wrapper = mount(VrlTag, {
        props: { variant: 'cyan' },
        slots: { default: 'Platform' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for success variant', () => {
      const wrapper = mount(VrlTag, {
        props: { variant: 'success' },
        slots: { default: 'Complete' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for warning variant', () => {
      const wrapper = mount(VrlTag, {
        props: { variant: 'warning' },
        slots: { default: 'Warning' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for danger variant', () => {
      const wrapper = mount(VrlTag, {
        props: { variant: 'danger' },
        slots: { default: 'Error' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });
  });
});
