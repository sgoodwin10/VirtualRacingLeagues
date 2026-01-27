import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HTag from './HTag.vue';

describe('HTag', () => {
  describe('Default Rendering', () => {
    it('renders h1 tag by default', () => {
      const wrapper = mount(HTag, {
        slots: {
          default: 'Default Heading',
        },
      });

      const h1 = wrapper.find('h1');
      expect(h1.exists()).toBe(true);
      expect(h1.text()).toBe('Default Heading');
    });

    it('applies default h1 classes', () => {
      const wrapper = mount(HTag, {
        slots: {
          default: 'Test Heading',
        },
      });

      const h1 = wrapper.find('h1');
      expect(h1.classes()).toContain('text-3xl');
      expect(h1.classes()).toContain('font-bold');
    });

    it('renders slot content correctly', () => {
      const wrapper = mount(HTag, {
        slots: {
          default: '<span>Complex Content</span>',
        },
      });

      expect(wrapper.html()).toContain('<span>Complex Content</span>');
    });
  });

  describe('Heading Levels', () => {
    it('renders h1 with correct classes when level is 1', () => {
      const wrapper = mount(HTag, {
        props: { level: 1 },
        slots: { default: 'H1 Heading' },
      });

      const h1 = wrapper.find('h1');
      expect(h1.exists()).toBe(true);
      expect(h1.classes()).toContain('text-3xl');
      expect(h1.classes()).toContain('font-bold');
    });

    it('renders h2 with correct classes when level is 2', () => {
      const wrapper = mount(HTag, {
        props: { level: 2 },
        slots: { default: 'H2 Heading' },
      });

      const h2 = wrapper.find('h2');
      expect(h2.exists()).toBe(true);
      expect(h2.classes()).toContain('text-2xl');
      expect(h2.classes()).toContain('font-bold');
    });

    it('renders h3 with correct classes when level is 3', () => {
      const wrapper = mount(HTag, {
        props: { level: 3 },
        slots: { default: 'H3 Heading' },
      });

      const h3 = wrapper.find('h3');
      expect(h3.exists()).toBe(true);
      expect(h3.classes()).toContain('text-xl');
      expect(h3.classes()).toContain('font-semibold');
    });

    it('renders h4 with correct classes when level is 4', () => {
      const wrapper = mount(HTag, {
        props: { level: 4 },
        slots: { default: 'H4 Heading' },
      });

      const h4 = wrapper.find('h4');
      expect(h4.exists()).toBe(true);
      expect(h4.classes()).toContain('text-lg');
      expect(h4.classes()).toContain('font-semibold');
    });

    it('renders h5 with correct classes when level is 5', () => {
      const wrapper = mount(HTag, {
        props: { level: 5 },
        slots: { default: 'H5 Heading' },
      });

      const h5 = wrapper.find('h5');
      expect(h5.exists()).toBe(true);
      expect(h5.classes()).toContain('text-base');
      expect(h5.classes()).toContain('font-semibold');
    });

    it('renders h6 with correct classes when level is 6', () => {
      const wrapper = mount(HTag, {
        props: { level: 6 },
        slots: { default: 'H6 Heading' },
      });

      const h6 = wrapper.find('h6');
      expect(h6.exists()).toBe(true);
      expect(h6.classes()).toContain('text-sm');
      expect(h6.classes()).toContain('font-semibold');
    });
  });

  describe('Additional Classes', () => {
    it('merges additional classes with default classes', () => {
      const wrapper = mount(HTag, {
        props: {
          level: 1,
          additionalClasses: 'mb-4 text-primary',
        },
        slots: { default: 'Heading' },
      });

      const h1 = wrapper.find('h1');
      // Default classes should still be present
      expect(h1.classes()).toContain('text-3xl');
      expect(h1.classes()).toContain('font-bold');
      // Additional classes should be added
      expect(h1.classes()).toContain('mb-4');
      expect(h1.classes()).toContain('text-primary');
    });

    it('merges additional classes for h2', () => {
      const wrapper = mount(HTag, {
        props: {
          level: 2,
          additionalClasses: 'uppercase tracking-wide',
        },
        slots: { default: 'Section Title' },
      });

      const h2 = wrapper.find('h2');
      expect(h2.classes()).toContain('text-2xl');
      expect(h2.classes()).toContain('font-bold');
      expect(h2.classes()).toContain('uppercase');
      expect(h2.classes()).toContain('tracking-wide');
    });

    it('handles multiple additional classes correctly', () => {
      const wrapper = mount(HTag, {
        props: {
          level: 3,
          additionalClasses: 'mt-8 mb-4 text-gray-700 border-b pb-2',
        },
        slots: { default: 'Heading' },
      });

      const h3 = wrapper.find('h3');
      expect(h3.classes()).toContain('text-xl');
      expect(h3.classes()).toContain('font-semibold');
      expect(h3.classes()).toContain('mt-8');
      expect(h3.classes()).toContain('mb-4');
      expect(h3.classes()).toContain('text-gray-700');
      expect(h3.classes()).toContain('border-b');
      expect(h3.classes()).toContain('pb-2');
    });
  });

  describe('Override Classes', () => {
    it('replaces default classes with override classes', () => {
      const wrapper = mount(HTag, {
        props: {
          level: 1,
          overrideClasses: 'text-4xl font-black uppercase',
        },
        slots: { default: 'Custom Heading' },
      });

      const h1 = wrapper.find('h1');
      // Default classes should NOT be present
      expect(h1.classes()).not.toContain('text-3xl');
      expect(h1.classes()).not.toContain('font-bold');
      // Override classes should be present
      expect(h1.classes()).toContain('text-4xl');
      expect(h1.classes()).toContain('font-black');
      expect(h1.classes()).toContain('uppercase');
    });

    it('ignores additional classes when override classes are provided', () => {
      const wrapper = mount(HTag, {
        props: {
          level: 2,
          additionalClasses: 'mb-4 text-primary',
          overrideClasses: 'text-5xl font-light',
        },
        slots: { default: 'Heading' },
      });

      const h2 = wrapper.find('h2');
      // Override classes should be present
      expect(h2.classes()).toContain('text-5xl');
      expect(h2.classes()).toContain('font-light');
      // Default and additional classes should NOT be present
      expect(h2.classes()).not.toContain('text-2xl');
      expect(h2.classes()).not.toContain('font-bold');
      expect(h2.classes()).not.toContain('mb-4');
      expect(h2.classes()).not.toContain('text-primary');
    });

    it('handles empty override classes string', () => {
      const wrapper = mount(HTag, {
        props: {
          level: 3,
          overrideClasses: '',
        },
        slots: { default: 'Heading' },
      });

      const h3 = wrapper.find('h3');
      // Should fall back to default classes when override is empty string
      expect(h3.classes()).toContain('text-xl');
      expect(h3.classes()).toContain('font-semibold');
    });
  });

  describe('Combined Props Scenarios', () => {
    it('works with level and additional classes', () => {
      const wrapper = mount(HTag, {
        props: {
          level: 4,
          additionalClasses: 'text-blue-600',
        },
        slots: { default: 'Blue Heading' },
      });

      const h4 = wrapper.find('h4');
      expect(h4.classes()).toContain('text-lg');
      expect(h4.classes()).toContain('font-semibold');
      expect(h4.classes()).toContain('text-blue-600');
    });

    it('works with level and override classes', () => {
      const wrapper = mount(HTag, {
        props: {
          level: 5,
          overrideClasses: 'text-xs italic',
        },
        slots: { default: 'Small Italic' },
      });

      const h5 = wrapper.find('h5');
      expect(h5.classes()).toContain('text-xs');
      expect(h5.classes()).toContain('italic');
      expect(h5.classes()).not.toContain('text-base');
      expect(h5.classes()).not.toContain('font-semibold');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty slot content', () => {
      const wrapper = mount(HTag);
      const h1 = wrapper.find('h1');
      expect(h1.exists()).toBe(true);
      expect(h1.text()).toBe('');
    });

    it('handles complex HTML in slot', () => {
      const wrapper = mount(HTag, {
        slots: {
          default: '<strong>Bold</strong> and <em>italic</em> text',
        },
      });

      const h1 = wrapper.find('h1');
      expect(h1.html()).toContain('<strong>Bold</strong>');
      expect(h1.html()).toContain('<em>italic</em>');
    });

    it('handles numeric text content', () => {
      const wrapper = mount(HTag, {
        slots: {
          default: '12345',
        },
      });

      expect(wrapper.text()).toBe('12345');
    });
  });
});
