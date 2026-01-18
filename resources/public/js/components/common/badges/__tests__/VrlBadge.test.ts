import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlBadge from '../VrlBadge.vue';

describe('VrlBadge', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlBadge, {
        slots: {
          default: 'Test Badge',
        },
      });

      expect(wrapper.text()).toBe('Test Badge');
      expect(wrapper.classes()).toContain('inline-flex');
      expect(wrapper.classes()).toContain('items-center');
    });

    it('renders slot content correctly', () => {
      const wrapper = mount(VrlBadge, {
        slots: {
          default: 'Platform: GT7',
        },
      });

      expect(wrapper.text()).toBe('Platform: GT7');
    });

    it('renders as a span element', () => {
      const wrapper = mount(VrlBadge, {
        slots: {
          default: 'Test',
        },
      });

      expect(wrapper.element.tagName).toBe('SPAN');
    });

    it('renders with empty slot content', () => {
      const wrapper = mount(VrlBadge);
      expect(wrapper.text()).toBe('');
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'cyan', 'green', 'orange', 'red', 'purple'] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant correctly`, () => {
        const wrapper = mount(VrlBadge, {
          props: { variant },
          slots: { default: 'Test' },
        });

        // Check that component has the base badge styling
        expect(wrapper.classes()).toContain('inline-flex');
        expect(wrapper.classes()).toContain('items-center');
      });
    });

    it('applies correct styling for cyan variant', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'cyan' },
        slots: { default: 'Cyan Badge' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--cyan)]');
    });

    it('applies correct styling for green variant', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'green' },
        slots: { default: 'Green Badge' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--green-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--green)]');
    });

    it('applies correct styling for orange variant', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'orange' },
        slots: { default: 'Orange Badge' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--orange-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--orange)]');
    });

    it('applies correct styling for red variant', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'red' },
        slots: { default: 'Red Badge' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--red-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--red)]');
    });

    it('applies correct styling for purple variant', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'purple' },
        slots: { default: 'Purple Badge' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--purple-dim)]');
      expect(wrapper.classes()).toContain('text-[var(--purple)]');
    });
  });

  describe('Dot Feature', () => {
    it('does not render dot by default', () => {
      const wrapper = mount(VrlBadge, {
        slots: { default: 'Test' },
      });

      expect(wrapper.classes()).not.toContain('badge-dot');
    });

    it('renders with dot when dot prop is true', () => {
      const wrapper = mount(VrlBadge, {
        props: { dot: true },
        slots: { default: 'Test' },
      });

      expect(wrapper.classes()).toContain('badge-dot');
    });

    it('does not render dot when dot prop is false', () => {
      const wrapper = mount(VrlBadge, {
        props: { dot: false },
        slots: { default: 'Test' },
      });

      expect(wrapper.classes()).not.toContain('badge-dot');
    });

    it('combines dot with variant', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'green', dot: true },
        slots: { default: 'Active' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--green-dim)]');
      expect(wrapper.classes()).toContain('badge-dot');
    });
  });

  describe('Pulse Animation', () => {
    it('does not apply pulse class by default', () => {
      const wrapper = mount(VrlBadge, {
        slots: { default: 'Test' },
      });

      expect(wrapper.classes()).not.toContain('pulse');
    });

    it('applies pulse class when both dot and pulse are true', () => {
      const wrapper = mount(VrlBadge, {
        props: { dot: true, pulse: true },
        slots: { default: 'Live' },
      });

      expect(wrapper.classes()).toContain('badge-dot');
      expect(wrapper.classes()).toContain('pulse');
    });

    it('does not apply pulse class when dot is false', () => {
      const wrapper = mount(VrlBadge, {
        props: { dot: false, pulse: true },
        slots: { default: 'Test' },
      });

      expect(wrapper.classes()).not.toContain('pulse');
    });

    it('does not apply pulse class when pulse is false', () => {
      const wrapper = mount(VrlBadge, {
        props: { dot: true, pulse: false },
        slots: { default: 'Test' },
      });

      expect(wrapper.classes()).toContain('badge-dot');
      expect(wrapper.classes()).not.toContain('pulse');
    });

    it('combines pulse with variant and dot', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'red', dot: true, pulse: true },
        slots: { default: 'Live' },
      });

      expect(wrapper.classes()).toContain('bg-[var(--red-dim)]');
      expect(wrapper.classes()).toContain('badge-dot');
      expect(wrapper.classes()).toContain('pulse');
    });
  });

  describe('Accessibility', () => {
    it('text content is readable', () => {
      const wrapper = mount(VrlBadge, {
        slots: { default: 'Platform: GT7' },
      });

      expect(wrapper.text()).toBe('Platform: GT7');
    });

    it('renders as inline element', () => {
      const wrapper = mount(VrlBadge, {
        slots: { default: 'Test' },
      });

      // Check that it renders as a span (which is inline by default)
      expect(wrapper.element.tagName).toBe('SPAN');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long text', () => {
      const longText = 'This is a very long badge text that might cause overflow issues';
      const wrapper = mount(VrlBadge, {
        slots: { default: longText },
      });

      expect(wrapper.text()).toBe(longText);
    });

    it('handles special characters', () => {
      const wrapper = mount(VrlBadge, {
        slots: { default: 'GT7 / iRacing & More!' },
      });

      expect(wrapper.text()).toBe('GT7 / iRacing & More!');
    });

    it('multiple badges can be rendered together', () => {
      const wrapper1 = mount(VrlBadge, {
        props: { variant: 'cyan' },
        slots: { default: 'Badge 1' },
      });

      const wrapper2 = mount(VrlBadge, {
        props: { variant: 'green' },
        slots: { default: 'Badge 2' },
      });

      expect(wrapper1.exists()).toBe(true);
      expect(wrapper2.exists()).toBe(true);
      expect(wrapper1.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(wrapper2.classes()).toContain('bg-[var(--green-dim)]');
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for default variant', () => {
      const wrapper = mount(VrlBadge, {
        slots: { default: 'Default' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot for cyan variant', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'cyan' },
        slots: { default: 'Cyan' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot with dot', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'green', dot: true },
        slots: { default: 'Active' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot with pulse', () => {
      const wrapper = mount(VrlBadge, {
        props: { variant: 'red', dot: true, pulse: true },
        slots: { default: 'Live' },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });
  });
});
