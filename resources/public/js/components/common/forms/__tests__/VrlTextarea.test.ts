import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlTextarea from '../VrlTextarea.vue';
import VrlCharacterCount from '../VrlCharacterCount.vue';

describe('VrlTextarea', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });
      expect(wrapper.find('.form-textarea').exists()).toBe(true);
      expect(wrapper.find('textarea').exists()).toBe(true);
    });

    it('renders with placeholder', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          placeholder: 'Enter description',
        },
      });
      expect(wrapper.find('textarea').attributes('placeholder')).toBe('Enter description');
    });

    it('renders with value', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: 'Test content',
        },
      });
      expect(wrapper.find('textarea').element.value).toBe('Test content');
    });

    it('renders with custom id', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          id: 'custom-textarea',
        },
      });
      expect(wrapper.find('textarea').attributes('id')).toBe('custom-textarea');
    });

    it('renders with custom name', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          name: 'description',
        },
      });
      expect(wrapper.find('textarea').attributes('name')).toBe('description');
    });

    it('renders with custom class', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          class: 'custom-class',
        },
      });
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });

    it('renders with custom rows', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          rows: 8,
        },
      });
      expect(wrapper.find('textarea').attributes('rows')).toBe('8');
    });

    it('defaults to 4 rows', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });
      expect(wrapper.find('textarea').attributes('rows')).toBe('4');
    });
  });

  describe('Character Count', () => {
    it('does not show character count by default', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: 'Test',
          maxlength: 100,
        },
      });
      expect(wrapper.findComponent(VrlCharacterCount).exists()).toBe(false);
    });

    it('shows character count when enabled and maxlength set', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: 'Test',
          maxlength: 100,
          showCharacterCount: true,
        },
      });
      expect(wrapper.findComponent(VrlCharacterCount).exists()).toBe(true);
    });

    it('does not show character count without maxlength', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: 'Test',
          showCharacterCount: true,
        },
      });
      expect(wrapper.findComponent(VrlCharacterCount).exists()).toBe(false);
    });

    it('passes correct current count to character counter', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: 'Hello World',
          maxlength: 100,
          showCharacterCount: true,
        },
      });
      const counter = wrapper.findComponent(VrlCharacterCount);
      expect(counter.props('current')).toBe(11);
      expect(counter.props('max')).toBe(100);
    });

    it('updates character count on input', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          maxlength: 100,
          showCharacterCount: true,
        },
      });

      await wrapper.setProps({ modelValue: 'Updated text' });
      const counter = wrapper.findComponent(VrlCharacterCount);
      expect(counter.props('current')).toBe(12);
    });
  });

  describe('States', () => {
    it('applies error class when error prop is string', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          error: 'Error message',
        },
      });
      expect(wrapper.find('.error').exists()).toBe(true);
    });

    it('applies error class when error prop is array with errors', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          error: ['Error 1', 'Error 2'],
        },
      });
      expect(wrapper.find('.error').exists()).toBe(true);
    });

    it('does not apply error class when error is empty', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          error: '',
        },
      });
      expect(wrapper.find('.error').exists()).toBe(false);
    });

    it('renders disabled state', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          disabled: true,
        },
      });
      expect(wrapper.find('textarea').attributes('disabled')).toBeDefined();
    });

    it('renders readonly state', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          readonly: true,
        },
      });
      expect(wrapper.find('textarea').attributes('readonly')).toBeDefined();
    });

    it('renders required attribute', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          required: true,
        },
      });
      expect(wrapper.find('textarea').attributes('required')).toBeDefined();
    });
  });

  describe('Validation Attributes', () => {
    it('applies maxlength attribute', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          maxlength: 500,
        },
      });
      expect(wrapper.find('textarea').attributes('maxlength')).toBe('500');
    });

    it('applies minlength attribute', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          minlength: 10,
        },
      });
      expect(wrapper.find('textarea').attributes('minlength')).toBe('10');
    });
  });

  describe('v-model', () => {
    it('emits update:modelValue on input', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      const textarea = wrapper.find('textarea');
      await textarea.setValue('New Value');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['New Value']);
    });

    it('updates value correctly through v-model', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: 'Initial',
        },
      });

      await wrapper.setProps({ modelValue: 'Updated' });
      expect(wrapper.find('textarea').element.value).toBe('Updated');
    });

    it('handles multiline text', async () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('textarea').setValue(multilineText);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([multilineText]);
    });
  });

  describe('Events', () => {
    it('emits input event', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('textarea').setValue('Test');
      expect(wrapper.emitted('input')).toBeTruthy();
    });

    it('emits blur event', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('textarea').trigger('blur');
      expect(wrapper.emitted('blur')).toBeTruthy();
      expect(wrapper.emitted('blur')?.[0][0]).toBeInstanceOf(FocusEvent);
    });

    it('emits focus event', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('textarea').trigger('focus');
      expect(wrapper.emitted('focus')).toBeTruthy();
      expect(wrapper.emitted('focus')?.[0][0]).toBeInstanceOf(FocusEvent);
    });

    it('emits all events correctly', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      const textarea = wrapper.find('textarea');
      await textarea.trigger('focus');
      await textarea.setValue('Test');
      await textarea.trigger('blur');

      expect(wrapper.emitted('focus')).toBeTruthy();
      expect(wrapper.emitted('input')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('blur')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('sets aria-invalid when error exists', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          error: 'Error message',
        },
      });
      expect(wrapper.find('textarea').attributes('aria-invalid')).toBe('true');
    });

    it('does not set aria-invalid when no error', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });
      expect(wrapper.find('textarea').attributes('aria-invalid')).toBeUndefined();
    });

    it('sets aria-required when required', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          required: true,
        },
      });
      expect(wrapper.find('textarea').attributes('aria-required')).toBe('true');
    });

    it('does not set aria-required when not required', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          required: false,
        },
      });
      expect(wrapper.find('textarea').attributes('aria-required')).toBeUndefined();
    });

    it('sets aria-describedby when error and id present', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          id: 'test-textarea',
          error: 'Error message',
        },
      });
      expect(wrapper.find('textarea').attributes('aria-describedby')).toBe('test-textarea-error');
    });

    it('does not set aria-describedby when no error', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          id: 'test-textarea',
        },
      });
      expect(wrapper.find('textarea').attributes('aria-describedby')).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string value', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });
      expect(wrapper.find('textarea').element.value).toBe('');
    });

    it('handles very long text', async () => {
      const longText = 'A'.repeat(1000);
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('textarea').setValue(longText);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([longText]);
    });

    it('handles special characters', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('textarea').setValue('!@#$%^&*()\n<script>alert("test")</script>');
      expect(wrapper.emitted('update:modelValue')?.[0][0]).toContain('!@#$%^&*()');
    });

    it('handles unicode characters', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
        },
      });

      await wrapper.find('textarea').setValue('你好世界\n🚀🎉');
      expect(wrapper.emitted('update:modelValue')?.[0][0]).toContain('你好世界');
    });

    it('maintains disabled state', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: '',
          disabled: true,
        },
      });

      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('disabled')).toBeDefined();
    });

    it('character count with exactly at max', () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: 'A'.repeat(100),
          maxlength: 100,
          showCharacterCount: true,
        },
      });

      const counter = wrapper.findComponent(VrlCharacterCount);
      expect(counter.props('current')).toBe(100);
      expect(counter.props('max')).toBe(100);
    });

    it('character count updates correctly on prop change', async () => {
      const wrapper = mount(VrlTextarea, {
        props: {
          modelValue: 'Initial',
          maxlength: 100,
          showCharacterCount: true,
        },
      });

      expect(wrapper.findComponent(VrlCharacterCount).props('current')).toBe(7);

      await wrapper.setProps({ modelValue: 'Updated text content' });
      expect(wrapper.findComponent(VrlCharacterCount).props('current')).toBe(20);
    });
  });
});
