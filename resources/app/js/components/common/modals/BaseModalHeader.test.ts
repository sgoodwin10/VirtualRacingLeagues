import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseModalHeader from './BaseModalHeader.vue';

describe('BaseModalHeader', () => {
  describe('Rendering', () => {
    it('renders with title prop', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Test Title',
        },
      });

      expect(wrapper.text()).toBe('Test Title');
    });

    it('renders with default slot content', () => {
      const wrapper = mount(BaseModalHeader, {
        slots: {
          default: '<span>Custom Content</span>',
        },
      });

      expect(wrapper.html()).toContain('<span>Custom Content</span>');
    });

    it('prioritizes slot content over title prop', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Title Prop',
        },
        slots: {
          default: '<span>Slot Content</span>',
        },
      });

      expect(wrapper.html()).toContain('<span>Slot Content</span>');
      expect(wrapper.text()).not.toBe('Title Prop');
    });

    it('renders empty when no title or slot provided', () => {
      const wrapper = mount(BaseModalHeader);

      expect(wrapper.text()).toBe('');
    });
  });

  describe('CSS Classes', () => {
    it('applies default classes', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Test',
        },
      });

      const div = wrapper.find('div');
      expect(div.classes()).toContain('text-lg');
      expect(div.classes()).toContain('font-bold');
      expect(div.classes()).toContain('text-primary');
    });

    it('merges additional classes with defaults', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Test',
          class: 'text-xl uppercase',
        },
      });

      const div = wrapper.find('div');
      // Default classes
      expect(div.classes()).toContain('text-lg');
      expect(div.classes()).toContain('font-bold');
      expect(div.classes()).toContain('text-primary');
      // Additional classes
      expect(div.classes()).toContain('text-xl');
      expect(div.classes()).toContain('uppercase');
    });

    it('overrides default classes when overrideClass is true', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Test',
          class: 'text-2xl font-medium text-blue-600',
          overrideClass: true,
        },
      });

      const div = wrapper.find('div');
      // Custom classes
      expect(div.classes()).toContain('text-2xl');
      expect(div.classes()).toContain('font-medium');
      expect(div.classes()).toContain('text-blue-600');
      // Default classes should NOT be present
      expect(div.classes()).not.toContain('text-lg');
      expect(div.classes()).not.toContain('font-bold');
      expect(div.classes()).not.toContain('text-primary');
    });

    it('uses default classes when overrideClass is true but no class provided', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Test',
          overrideClass: true,
        },
      });

      const div = wrapper.find('div');
      expect(div.classes()).toContain('text-lg');
      expect(div.classes()).toContain('font-bold');
      expect(div.classes()).toContain('text-primary');
    });

    it('handles empty string class prop', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Test',
          class: '',
        },
      });

      const div = wrapper.find('div');
      expect(div.classes()).toContain('text-lg');
      expect(div.classes()).toContain('font-bold');
      expect(div.classes()).toContain('text-primary');
    });
  });

  describe('TypeScript Props', () => {
    it('accepts all valid props', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Test Title',
          class: 'custom-class',
          overrideClass: false,
        },
      });

      expect(wrapper.props()).toEqual({
        title: 'Test Title',
        class: 'custom-class',
        overrideClass: false,
      });
    });

    it('handles undefined optional props', () => {
      const wrapper = mount(BaseModalHeader);

      expect(wrapper.props()).toEqual({
        title: undefined,
        class: undefined,
        overrideClass: false,
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('works with complex slot content', () => {
      const wrapper = mount(BaseModalHeader, {
        slots: {
          default: `
            <div class="flex items-center gap-2">
              <span class="icon">📝</span>
              <span class="title">Complex Header</span>
            </div>
          `,
        },
      });

      expect(wrapper.html()).toContain('Complex Header');
      expect(wrapper.html()).toContain('icon');
    });

    it('renders title with internal spaces', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Title with internal spaces',
        },
      });

      expect(wrapper.text()).toBe('Title with internal spaces');
    });

    it('handles special characters in title', () => {
      const wrapper = mount(BaseModalHeader, {
        props: {
          title: 'Title & Special <Characters>',
        },
      });

      expect(wrapper.text()).toBe('Title & Special <Characters>');
    });
  });
});
