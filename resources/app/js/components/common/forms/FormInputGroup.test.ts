import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormInputGroup from './FormInputGroup.vue';

describe('FormInputGroup', () => {
  describe('Vertical Layout (default)', () => {
    it('renders with form-group class by default', () => {
      const wrapper = mount(FormInputGroup, {
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
    });

    it('renders with explicit vertical layout', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'vertical' },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
    });
  });

  describe('Horizontal Layout', () => {
    it('renders with form-row class for horizontal 2 columns', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'horizontal', columns: 2 },
        slots: {
          default: '<div>Field 1</div><div>Field 2</div>',
        },
      });

      expect(wrapper.classes()).toContain('form-row');
    });

    it('renders with form-row class for horizontal layout without explicit columns', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'horizontal' },
        slots: {
          default: '<div>Field 1</div><div>Field 2</div>',
        },
      });

      expect(wrapper.classes()).toContain('form-row');
    });

    it('renders with form-row-3 class for 3 columns', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'horizontal', columns: 3 },
        slots: {
          default: '<div>1</div><div>2</div><div>3</div>',
        },
      });

      expect(wrapper.classes()).toContain('form-row-3');
    });

    it('renders with form-row-4 class for 4 columns', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'horizontal', columns: 4 },
        slots: {
          default: '<div>1</div><div>2</div><div>3</div><div>4</div>',
        },
      });

      expect(wrapper.classes()).toContain('form-row-4');
    });
  });

  describe('Backward Compatibility', () => {
    it('supports legacy spacing prop', () => {
      const wrapper = mount(FormInputGroup, {
        props: { spacing: 'space-y-4' },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('space-y-4');
    });

    it('prioritizes spacing prop over layout when both provided', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          spacing: 'custom-spacing',
          layout: 'horizontal',
        },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('custom-spacing');
      expect(wrapper.classes()).not.toContain('form-row');
    });

    it('prioritizes spacing prop over layout and columns', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          spacing: 'space-y-2',
          layout: 'horizontal',
          columns: 3,
        },
        slots: {
          default: '<div>1</div><div>2</div><div>3</div>',
        },
      });

      expect(wrapper.classes()).toContain('space-y-2');
      expect(wrapper.classes()).not.toContain('form-row-3');
    });
  });

  describe('Custom Classes', () => {
    it('applies additional custom classes with vertical layout', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          layout: 'vertical',
          class: 'custom-class another-class',
        },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
      expect(wrapper.classes()).toContain('custom-class');
      expect(wrapper.classes()).toContain('another-class');
    });

    it('applies additional custom classes with horizontal layout', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          layout: 'horizontal',
          columns: 2,
          class: 'mb-4',
        },
        slots: {
          default: '<div>Field 1</div><div>Field 2</div>',
        },
      });

      expect(wrapper.classes()).toContain('form-row');
      expect(wrapper.classes()).toContain('mb-4');
    });

    it('applies custom classes with legacy spacing prop', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          spacing: 'space-y-3',
          class: 'mt-2',
        },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('space-y-3');
      expect(wrapper.classes()).toContain('mt-2');
    });
  });

  describe('Slot Content', () => {
    it('renders slot content correctly', () => {
      const wrapper = mount(FormInputGroup, {
        slots: {
          default: '<input type="text" id="test-input" />',
        },
      });

      expect(wrapper.html()).toContain('<input type="text" id="test-input"');
    });

    it('renders multiple slot children', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'horizontal' },
        slots: {
          default: `
            <div class="field-1">Field 1</div>
            <div class="field-2">Field 2</div>
          `,
        },
      });

      expect(wrapper.html()).toContain('field-1');
      expect(wrapper.html()).toContain('field-2');
    });

    it('renders complex form field structure', () => {
      const wrapper = mount(FormInputGroup, {
        slots: {
          default: `
            <label for="name">Name</label>
            <input type="text" id="name" />
            <span class="error">Error message</span>
          `,
        },
      });

      expect(wrapper.html()).toContain('<label for="name">Name</label>');
      expect(wrapper.html()).toContain('<input type="text" id="name"');
      expect(wrapper.html()).toContain('<span class="error">Error message</span>');
    });
  });

  describe('CSS Classes Combination', () => {
    it('combines form-group and custom class correctly', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          class: 'custom-wrapper',
        },
        slots: {
          default: '<input type="text" />',
        },
      });

      const classes = wrapper.classes().join(' ');
      expect(classes).toBe('form-group custom-wrapper');
    });

    it('combines form-row and custom class correctly', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          layout: 'horizontal',
          class: 'mb-4',
        },
        slots: {
          default: '<div>1</div><div>2</div>',
        },
      });

      const classes = wrapper.classes().join(' ');
      expect(classes).toBe('form-row mb-4');
    });

    it('generates correct class string with no custom class', () => {
      const wrapper = mount(FormInputGroup, {
        slots: {
          default: '<input type="text" />',
        },
      });

      const classes = wrapper.classes().join(' ');
      expect(classes).toBe('form-group');
    });
  });

  describe('Props Default Values', () => {
    it('uses vertical layout as default', () => {
      const wrapper = mount(FormInputGroup, {
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
      expect(wrapper.classes()).not.toContain('form-row');
    });

    it('uses 2 columns as default for horizontal layout', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          layout: 'horizontal',
          // columns not specified, should default to 2
        },
        slots: {
          default: '<div>1</div><div>2</div>',
        },
      });

      expect(wrapper.classes()).toContain('form-row');
      expect(wrapper.classes()).not.toContain('form-row-3');
      expect(wrapper.classes()).not.toContain('form-row-4');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty slot', () => {
      const wrapper = mount(FormInputGroup, {
        slots: {
          default: '',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
      expect(wrapper.html()).toContain('<div class="form-group"></div>');
    });

    it('handles undefined spacing prop', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          spacing: undefined,
        },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
    });

    it('handles empty custom class string', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          class: '',
        },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
      expect(wrapper.classes()).toHaveLength(1);
    });
  });
});
