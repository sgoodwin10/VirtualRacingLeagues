import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlHeading from '../VrlHeading.vue';

describe('VrlHeading', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlHeading, {
        slots: { default: 'Test Heading' },
      });
      expect(wrapper.text()).toBe('Test Heading');
      expect(wrapper.element.tagName).toBe('H2');
    });

    it('renders slot content correctly', () => {
      const wrapper = mount(VrlHeading, {
        slots: { default: 'Championship Standings' },
      });
      expect(wrapper.text()).toBe('Championship Standings');
    });

    it('renders with HTML content in slot', () => {
      const wrapper = mount(VrlHeading, {
        slots: { default: 'Setup. <span>Race.</span>' },
      });
      expect(wrapper.html()).toContain('<span>Race.</span>');
    });
  });

  describe('Level Prop', () => {
    it('renders h1 when level is 1', () => {
      const wrapper = mount(VrlHeading, {
        props: { level: 1 },
        slots: { default: 'H1 Heading' },
      });
      expect(wrapper.element.tagName).toBe('H1');
    });

    it('renders h3 when level is 3', () => {
      const wrapper = mount(VrlHeading, {
        props: { level: 3 },
        slots: { default: 'H3 Heading' },
      });
      expect(wrapper.element.tagName).toBe('H3');
    });

    it('renders h6 when level is 6', () => {
      const wrapper = mount(VrlHeading, {
        props: { level: 6 },
        slots: { default: 'H6 Heading' },
      });
      expect(wrapper.element.tagName).toBe('H6');
    });
  });

  describe('As Prop (Semantic Override)', () => {
    it('renders div when as="div"', () => {
      const wrapper = mount(VrlHeading, {
        props: { level: 2, as: 'div' },
        slots: { default: 'Div Heading' },
      });
      expect(wrapper.element.tagName).toBe('DIV');
    });

    it('renders span when as="span"', () => {
      const wrapper = mount(VrlHeading, {
        props: { level: 2, as: 'span' },
        slots: { default: 'Span Heading' },
      });
      expect(wrapper.element.tagName).toBe('SPAN');
    });

    it('renders h1 when as="h1" but level is 3', () => {
      const wrapper = mount(VrlHeading, {
        props: { level: 3, as: 'h1' },
        slots: { default: 'H1 Override' },
      });
      expect(wrapper.element.tagName).toBe('H1');
    });
  });

  describe('Variant Prop', () => {
    it('applies hero variant classes', () => {
      const wrapper = mount(VrlHeading, {
        props: { variant: 'hero' },
        slots: { default: 'Hero Title' },
      });
      expect(wrapper.classes()).toContain('text-3xl');
      expect(wrapper.classes()).toContain('sm:text-4xl');
      expect(wrapper.classes()).toContain('lg:text-5xl');
    });

    it('applies section variant classes', () => {
      const wrapper = mount(VrlHeading, {
        props: { variant: 'section' },
        slots: { default: 'Section Title' },
      });
      expect(wrapper.classes()).toContain('text-2xl');
      expect(wrapper.classes()).toContain('sm:text-3xl');
    });

    it('applies card variant classes', () => {
      const wrapper = mount(VrlHeading, {
        props: { variant: 'card' },
        slots: { default: 'Card Title' },
      });
      expect(wrapper.classes()).toContain('text-base');
      expect(wrapper.classes()).toContain('sm:text-lg');
    });

    it('applies default variant with level 1 classes', () => {
      const wrapper = mount(VrlHeading, {
        props: { variant: 'default', level: 1 },
        slots: { default: 'Default H1' },
      });
      expect(wrapper.classes()).toContain('text-4xl');
      expect(wrapper.classes()).toContain('sm:text-5xl');
    });

    it('applies default variant with level 4 classes', () => {
      const wrapper = mount(VrlHeading, {
        props: { variant: 'default', level: 4 },
        slots: { default: 'Default H4' },
      });
      expect(wrapper.classes()).toContain('text-xl');
      expect(wrapper.classes()).toContain('sm:text-2xl');
    });
  });

  describe('Base Classes', () => {
    it('always includes font-display class', () => {
      const wrapper = mount(VrlHeading, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('font-display');
    });

    it('always includes uppercase class', () => {
      const wrapper = mount(VrlHeading, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('uppercase');
    });

    it('always includes tracking-wide class', () => {
      const wrapper = mount(VrlHeading, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('tracking-wide');
    });

    it('always includes theme-text-primary class', () => {
      const wrapper = mount(VrlHeading, {
        slots: { default: 'Test' },
      });
      expect(wrapper.classes()).toContain('theme-text-primary');
    });
  });

  describe('Custom Class Prop', () => {
    it('applies custom classes from class prop', () => {
      const wrapper = mount(VrlHeading, {
        props: { class: 'custom-class another-class' },
        slots: { default: 'Custom' },
      });
      expect(wrapper.classes()).toContain('custom-class');
      expect(wrapper.classes()).toContain('another-class');
    });

    it('combines custom classes with variant classes', () => {
      const wrapper = mount(VrlHeading, {
        props: { variant: 'hero', class: 'mb-4' },
        slots: { default: 'Hero with margin' },
      });
      expect(wrapper.classes()).toContain('mb-4');
      expect(wrapper.classes()).toContain('text-3xl');
    });
  });

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy with level prop', () => {
      const wrapper = mount(VrlHeading, {
        props: { level: 3 },
        slots: { default: 'Accessible Heading' },
      });
      expect(wrapper.element.tagName).toBe('H3');
    });

    it('allows semantic override for styling purposes', () => {
      const wrapper = mount(VrlHeading, {
        props: { level: 1, as: 'div' },
        slots: { default: 'Styled as H1, but div' },
      });
      expect(wrapper.element.tagName).toBe('DIV');
      expect(wrapper.classes()).toContain('text-4xl'); // H1 styling
    });
  });

  describe('Edge Cases', () => {
    it('handles empty slot content', () => {
      const wrapper = mount(VrlHeading);
      expect(wrapper.exists()).toBe(true);
    });

    it('handles multiple child elements in slot', () => {
      const wrapper = mount(VrlHeading, {
        slots: {
          default: '<span>First</span><span>Second</span>',
        },
      });
      expect(wrapper.findAll('span')).toHaveLength(2);
    });

    it('handles special characters in slot content', () => {
      const wrapper = mount(VrlHeading, {
        slots: { default: 'Setup. Race. Share.' },
      });
      expect(wrapper.text()).toContain('Setup. Race. Share.');
    });
  });
});
