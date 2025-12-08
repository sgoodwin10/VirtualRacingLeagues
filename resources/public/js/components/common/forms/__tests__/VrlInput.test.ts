import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlInput from '../VrlInput.vue';

describe('VrlInput', () => {
  it('renders with default props', () => {
    const wrapper = mount(VrlInput, {
      props: {
        modelValue: '',
      },
    });

    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('type')).toBe('text');
  });

  describe('v-model binding', () => {
    it('displays modelValue', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: 'test value',
        },
      });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('test value');
    });

    it('emits update:modelValue on input', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      await input.setValue('new value');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value']);
    });

    it('handles number type correctly', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: 0,
          type: 'number',
        },
      });

      const input = wrapper.find('input');
      await input.setValue('42');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([42]);
    });

    it('emits null for empty number input', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: 42,
          type: 'number',
        },
      });

      const input = wrapper.find('input');
      await input.setValue('');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
    });

    it('emits null when invalid characters entered in number input', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: 42,
          type: 'number',
        },
      });

      const input = wrapper.find('input');
      const inputElement = input.element as HTMLInputElement;

      // Simulate typing invalid characters
      // Note: HTML number inputs automatically convert invalid values to empty string
      inputElement.value = 'abc';
      await input.trigger('input');

      // Browser converts 'abc' to empty string for number inputs
      // So we emit null for empty input
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
      expect(inputElement.value).toBe('');
    });

    it('handles decimal numbers correctly', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: 0,
          type: 'number',
        },
      });

      const input = wrapper.find('input');
      await input.setValue('3.14');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3.14]);
    });

    it('handles negative numbers correctly', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: 0,
          type: 'number',
        },
      });

      const input = wrapper.find('input');
      await input.setValue('-42');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([-42]);
    });
  });

  describe('type prop', () => {
    const types: Array<'text' | 'email' | 'password' | 'number' | 'tel' | 'url'> = [
      'text',
      'email',
      'password',
      'number',
      'tel',
      'url',
    ];

    types.forEach((type) => {
      it(`renders with type ${type}`, () => {
        const wrapper = mount(VrlInput, {
          props: {
            modelValue: '',
            type,
          },
        });

        const input = wrapper.find('input');
        expect(input.attributes('type')).toBe(type);
      });
    });
  });

  describe('size prop', () => {
    it('renders small size', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          size: 'sm',
        },
      });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('h-8');
      expect(input.classes()).toContain('px-3');
      expect(input.classes()).toContain('text-xs');
    });

    it('renders medium size (default)', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          size: 'md',
        },
      });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('h-10');
      expect(input.classes()).toContain('px-4');
      expect(input.classes()).toContain('text-sm');
    });

    it('renders large size', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          size: 'lg',
        },
      });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('h-12');
      expect(input.classes()).toContain('px-5');
      expect(input.classes()).toContain('text-base');
    });
  });

  describe('disabled and readonly states', () => {
    it('applies disabled attribute', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          disabled: true,
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('disabled')).toBeDefined();
      expect(input.classes()).toContain('opacity-50');
      expect(input.classes()).toContain('cursor-not-allowed');
    });

    it('applies readonly attribute', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          readonly: true,
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('readonly')).toBeDefined();
      expect(input.classes()).toContain('cursor-default');
    });
  });

  describe('invalid state and error message', () => {
    it('applies invalid state styles', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          invalid: true,
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('aria-invalid')).toBe('true');
      expect(input.classes()).toContain('border-racing-danger/50');
    });

    it('displays error message when invalid', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          invalid: true,
          errorMessage: 'This field is required',
        },
      });

      const error = wrapper.find('small');
      expect(error.exists()).toBe(true);
      expect(error.text()).toBe('This field is required');
      expect(error.classes()).toContain('text-racing-danger');
    });

    it('does not display error message when not invalid', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          invalid: false,
          errorMessage: 'This field is required',
        },
      });

      const error = wrapper.find('small');
      expect(error.exists()).toBe(false);
    });

    it('links error message with aria-describedby', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          invalid: true,
          errorMessage: 'Error',
        },
      });

      const input = wrapper.find('input');
      const error = wrapper.find('small');

      expect(input.attributes('aria-describedby')).toBe(error.attributes('id'));
    });
  });

  describe('label and required', () => {
    it('displays label', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          label: 'Username',
        },
      });

      const label = wrapper.find('label');
      expect(label.exists()).toBe(true);
      expect(label.text()).toContain('Username');
    });

    it('displays required indicator', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          label: 'Email',
          required: true,
        },
      });

      const label = wrapper.find('label');
      expect(label.text()).toContain('*');
    });

    it('links label with input via for/id', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          label: 'Test',
        },
      });

      const label = wrapper.find('label');
      const input = wrapper.find('input');

      expect(label.attributes('for')).toBe(input.attributes('id'));
    });
  });

  describe('placeholder', () => {
    it('displays placeholder', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          placeholder: 'Enter your name',
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('placeholder')).toBe('Enter your name');
    });
  });

  describe('accessibility', () => {
    it('has proper aria attributes', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          invalid: false,
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('aria-invalid')).toBe('false');
    });

    it('generates unique id', () => {
      const wrapper1 = mount(VrlInput, { props: { modelValue: '' } });
      const wrapper2 = mount(VrlInput, { props: { modelValue: '' } });

      const id1 = wrapper1.find('input').attributes('id');
      const id2 = wrapper2.find('input').attributes('id');

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });
});
