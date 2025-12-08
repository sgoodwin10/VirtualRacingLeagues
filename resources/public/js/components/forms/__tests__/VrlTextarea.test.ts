import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlTextarea from '../VrlTextarea.vue';

describe('VrlTextarea', () => {
  it('renders with default props', () => {
    const wrapper = mount(VrlTextarea, {
      props: {
        modelValue: '',
      },
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);
  });

  describe('v-model binding', () => {
    it('displays modelValue', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: 'test content',
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.element.value).toBe('test content');
    });

    it('emits update:modelValue on input', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      const textarea = wrapper.find('textarea');
      await textarea.setValue('new content');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new content']);
    });
  });

  describe('rows prop', () => {
    it('uses default rows value', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('rows')).toBe('4');
    });

    it('applies custom rows value', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          rows: 8,
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('rows')).toBe('8');
    });
  });

  describe('disabled and readonly states', () => {
    it('applies disabled attribute', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          disabled: true,
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('disabled')).toBeDefined();
      expect(textarea.classes()).toContain('opacity-50');
      expect(textarea.classes()).toContain('cursor-not-allowed');
    });

    it('applies readonly attribute', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          readonly: true,
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('readonly')).toBeDefined();
      expect(textarea.classes()).toContain('cursor-default');
    });
  });

  describe('invalid state and error message', () => {
    it('applies invalid state styles', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          invalid: true,
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('aria-invalid')).toBe('true');
      expect(textarea.classes()).toContain('border-racing-danger/50');
    });

    it('displays error message when invalid', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          invalid: true,
          errorMessage: 'Description is too short',
        },
      });

      const error = wrapper.find('small');
      expect(error.exists()).toBe(true);
      expect(error.text()).toBe('Description is too short');
      expect(error.classes()).toContain('text-racing-danger');
    });

    it('does not display error message when not invalid', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          invalid: false,
          errorMessage: 'Error',
        },
      });

      const error = wrapper.find('small');
      expect(error.exists()).toBe(false);
    });

    it('links error message with aria-describedby', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          invalid: true,
          errorMessage: 'Error',
        },
      });

      const textarea = wrapper.find('textarea');
      const error = wrapper.find('small');

      expect(textarea.attributes('aria-describedby')).toBe(error.attributes('id'));
    });
  });

  describe('label and required', () => {
    it('displays label', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          label: 'Description',
        },
      });

      const label = wrapper.find('label');
      expect(label.exists()).toBe(true);
      expect(label.text()).toContain('Description');
    });

    it('displays required indicator', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          label: 'Bio',
          required: true,
        },
      });

      const label = wrapper.find('label');
      expect(label.text()).toContain('*');
    });

    it('links label with textarea via for/id', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          label: 'Test',
        },
      });

      const label = wrapper.find('label');
      const textarea = wrapper.find('textarea');

      expect(label.attributes('for')).toBe(textarea.attributes('id'));
    });
  });

  describe('placeholder', () => {
    it('displays placeholder', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          placeholder: 'Enter description...',
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('placeholder')).toBe('Enter description...');
    });
  });

  describe('styling', () => {
    it('applies resize-y class', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.classes()).toContain('resize-y');
    });

    it('has correct padding and text size', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.classes()).toContain('px-4');
      expect(textarea.classes()).toContain('py-3');
      expect(textarea.classes()).toContain('text-sm');
    });
  });

  describe('accessibility', () => {
    it('has proper aria attributes', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          invalid: false,
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('aria-invalid')).toBe('false');
    });

    it('generates unique id', () => {
      const wrapper1 = mount(VrlTextarea, { props: { modelValue: '' } });
      const wrapper2 = mount(VrlTextarea, { props: { modelValue: '' } });

      const id1 = wrapper1.find('textarea').attributes('id');
      const id2 = wrapper2.find('textarea').attributes('id');

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });
});
