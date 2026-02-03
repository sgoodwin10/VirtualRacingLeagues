import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlInput from './VrlInput.vue';

describe('VrlInput', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });
      expect(wrapper.find('input').exists()).toBe(true);
      expect(wrapper.find('input').classes()).toContain('w-full');
    });

    it('renders with all input types', () => {
      const types = ['text', 'email', 'password', 'url', 'tel', 'number', 'search'] as const;

      types.forEach((type) => {
        const wrapper = mount(VrlInput, {
          props: {
            modelValue: '',
            type,
          },
        });
        expect(wrapper.find('input').attributes('type')).toBe(type);
      });
    });

    it('renders with placeholder', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          placeholder: 'Enter text here',
        },
      });
      expect(wrapper.find('input').attributes('placeholder')).toBe('Enter text here');
    });

    it('renders with value', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: 'Test Value',
        },
      });
      expect(wrapper.find('input').element.value).toBe('Test Value');
    });

    it('renders with custom id', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          id: 'custom-input',
        },
      });
      expect(wrapper.find('input').attributes('id')).toBe('custom-input');
    });

    it('renders with custom name', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          name: 'username',
        },
      });
      expect(wrapper.find('input').attributes('name')).toBe('username');
    });

    it('renders with custom class', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          class: 'custom-class',
        },
      });
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });
  });

  describe('States', () => {
    it('applies error class when error prop is string', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          error: 'Error message',
        },
      });
      expect(wrapper.find('input').classes()).toContain('border-[var(--red)]');
    });

    it('applies error class when error prop is array with errors', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          error: ['Error 1', 'Error 2'],
        },
      });
      expect(wrapper.find('input').classes()).toContain('border-[var(--red)]');
    });

    it('does not apply error class when error is empty string', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          error: '',
        },
      });
      expect(wrapper.find('.error').exists()).toBe(false);
    });

    it('does not apply error class when error is empty array', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          error: [],
        },
      });
      expect(wrapper.find('.error').exists()).toBe(false);
    });

    it('renders disabled state', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          disabled: true,
        },
      });
      expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    });

    it('renders readonly state', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          readonly: true,
        },
      });
      expect(wrapper.find('input').attributes('readonly')).toBeDefined();
    });

    it('renders required attribute', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          required: true,
        },
      });
      expect(wrapper.find('input').attributes('required')).toBeDefined();
    });
  });

  describe('Validation Attributes', () => {
    it('applies maxlength attribute', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          maxlength: 100,
        },
      });
      expect(wrapper.find('input').attributes('maxlength')).toBe('100');
    });

    it('applies minlength attribute', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          minlength: 5,
        },
      });
      expect(wrapper.find('input').attributes('minlength')).toBe('5');
    });

    it('applies pattern attribute', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          pattern: '[A-Za-z]+',
        },
      });
      expect(wrapper.find('input').attributes('pattern')).toBe('[A-Za-z]+');
    });

    it('applies autocomplete attribute', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          autocomplete: 'email',
        },
      });
      expect(wrapper.find('input').attributes('autocomplete')).toBe('email');
    });
  });

  describe('v-model', () => {
    it('emits update:modelValue on input', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      await input.setValue('New Value');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['New Value']);
    });

    it('updates value correctly through v-model', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: 'Initial',
        },
      });

      await wrapper.setProps({ modelValue: 'Updated' });
      expect(wrapper.find('input').element.value).toBe('Updated');
    });

    it('handles empty string value', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });
      expect(wrapper.find('input').element.value).toBe('');
    });
  });

  describe('Events', () => {
    it('emits input event', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('input').setValue('Test');
      expect(wrapper.emitted('input')).toBeTruthy();
    });

    it('emits blur event', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('input').trigger('blur');
      expect(wrapper.emitted('blur')).toBeTruthy();
      expect(wrapper.emitted('blur')?.[0]?.[0]).toBeInstanceOf(FocusEvent);
    });

    it('emits focus event', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('input').trigger('focus');
      expect(wrapper.emitted('focus')).toBeTruthy();
      expect(wrapper.emitted('focus')?.[0]?.[0]).toBeInstanceOf(FocusEvent);
    });

    it('emits all events correctly', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      await input.trigger('focus');
      await input.setValue('Test');
      await input.trigger('blur');

      expect(wrapper.emitted('focus')).toBeTruthy();
      expect(wrapper.emitted('input')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('blur')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('sets aria-invalid when error exists', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          error: 'Error message',
        },
      });
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
    });

    it('does not set aria-invalid when no error', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });
      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined();
    });

    it('sets aria-required when required', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          required: true,
        },
      });
      expect(wrapper.find('input').attributes('aria-required')).toBe('true');
    });

    it('does not set aria-required when not required', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          required: false,
        },
      });
      expect(wrapper.find('input').attributes('aria-required')).toBeUndefined();
    });

    it('sets aria-describedby when error and id present', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          id: 'test-input',
          error: 'Error message',
        },
      });
      expect(wrapper.find('input').attributes('aria-describedby')).toBe('test-input-error');
    });

    it('does not set aria-describedby when no error', () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          id: 'test-input',
        },
      });
      expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid input changes', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      await input.setValue('A');
      await input.setValue('AB');
      await input.setValue('ABC');

      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted).toBeTruthy();
      expect(emitted?.length).toBeGreaterThanOrEqual(3);
    });

    it('handles special characters', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('input').setValue('!@#$%^&*()');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['!@#$%^&*()']);
    });

    it('handles unicode characters', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('input').setValue('你好世界');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['你好世界']);
    });

    it('maintains disabled state', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: '',
          disabled: true,
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('disabled')).toBeDefined();

      // Disabled input should not emit events when interacted with
      await input.trigger('click');
      expect(input.attributes('disabled')).toBeDefined();
    });

    it('handles type switching', async () => {
      const wrapper = mount(VrlInput, {
        props: {
          modelValue: 'test',
          type: 'text',
        },
      });

      expect(wrapper.find('input').attributes('type')).toBe('text');

      await wrapper.setProps({ type: 'password' });
      expect(wrapper.find('input').attributes('type')).toBe('password');
    });
  });
});
