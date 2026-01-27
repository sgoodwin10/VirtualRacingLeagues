import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormLabel from './FormLabel.vue';

describe('FormLabel', () => {
  describe('Rendering', () => {
    it('renders the label text correctly', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' },
      });
      expect(wrapper.text()).toContain('Test Label');
    });

    it('renders as a label element', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' },
      });
      expect(wrapper.element.tagName).toBe('LABEL');
    });
  });

  describe('Design System Integration', () => {
    it('applies text-form-label utility class', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' },
      });
      expect(wrapper.classes()).toContain('text-form-label');
    });

    it('applies block display class', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' },
      });
      expect(wrapper.classes()).toContain('block');
    });

    it('applies mb-2 margin class', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' },
      });
      expect(wrapper.classes()).toContain('mb-2');
    });
  });

  describe('Required Field Indicator', () => {
    it('shows asterisk when required is true', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', required: true },
      });
      const asterisk = wrapper.find('span');
      expect(asterisk.exists()).toBe(true);
      expect(asterisk.text()).toBe('*');
      expect(asterisk.classes()).toContain('text-red-500');
    });

    it('hides asterisk when required is false', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', required: false },
      });
      expect(wrapper.find('span').exists()).toBe(false);
    });

    it('hides asterisk by default', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' },
      });
      expect(wrapper.find('span').exists()).toBe(false);
    });
  });

  describe('Input Association', () => {
    it('binds for attribute correctly when provided', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', for: 'test-input' },
      });
      expect(wrapper.attributes('for')).toBe('test-input');
    });

    it('does not have for attribute when not provided', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' },
      });
      expect(wrapper.attributes('for')).toBeUndefined();
    });
  });

  describe('Custom Classes', () => {
    it('applies custom classes via class prop', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', class: 'custom-class' },
      });
      expect(wrapper.classes()).toContain('custom-class');
    });

    it('preserves base classes when custom classes applied', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', class: 'custom-class another-class' },
      });
      expect(wrapper.classes()).toContain('text-form-label');
      expect(wrapper.classes()).toContain('block');
      expect(wrapper.classes()).toContain('mb-2');
      expect(wrapper.classes()).toContain('custom-class');
      expect(wrapper.classes()).toContain('another-class');
    });

    it('works correctly without custom classes', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' },
      });
      expect(wrapper.classes()).toEqual(['block', 'text-form-label', 'mb-2']);
    });
  });

  describe('Props Integration', () => {
    it('accepts all valid props together', () => {
      const wrapper = mount(FormLabel, {
        props: {
          for: 'test-id',
          required: true,
          text: 'Test Label',
          class: 'custom-class',
        },
      });
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('Test Label');
      expect(wrapper.text()).toContain('*');
      expect(wrapper.attributes('for')).toBe('test-id');
      expect(wrapper.classes()).toContain('custom-class');
    });

    it('works with minimal props', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Minimal Label' },
      });
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toBe('Minimal Label');
      expect(wrapper.find('span').exists()).toBe(false);
      expect(wrapper.attributes('for')).toBeUndefined();
    });
  });

  describe('Text Content', () => {
    it('renders text prop content', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Email Address' },
      });
      expect(wrapper.text()).toContain('Email Address');
    });

    it('renders multi-word text correctly', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'This is a very long label text' },
      });
      expect(wrapper.text()).toContain('This is a very long label text');
    });

    it('renders special characters in text', () => {
      const wrapper = mount(FormLabel, {
        props: { text: "User's Email (Required)" },
      });
      expect(wrapper.text()).toContain("User's Email (Required)");
    });
  });
});
