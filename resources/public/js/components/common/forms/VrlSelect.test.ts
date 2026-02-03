import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlSelect from './VrlSelect.vue';

describe('VrlSelect', () => {
  const mockOptions = [
    { label: 'Option 1', value: 1 },
    { label: 'Option 2', value: 2 },
    { label: 'Option 3', value: 3 },
  ];

  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });
      expect(wrapper.find('select').exists()).toBe(true);
      expect(wrapper.find('select').classes()).toContain('w-full');
    });

    it('renders all options', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });
      const options = wrapper.findAll('option');
      // Should have 3 options (no placeholder)
      expect(options.length).toBe(3);
    });

    it('renders options with correct labels and values', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });
      const options = wrapper.findAll('option');
      expect(options[0]?.text()).toBe('Option 1');
      expect(options[0]?.element.value).toBe('1');
      expect(options[1]?.text()).toBe('Option 2');
      expect(options[1]?.element.value).toBe('2');
    });

    it('renders placeholder as first disabled option', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          placeholder: 'Select an option',
        },
      });
      const options = wrapper.findAll('option');
      expect(options[0]?.text()).toBe('Select an option');
      expect(options[0]?.element.value).toBe('');
      expect(options[0]?.element.disabled).toBe(true);
      expect(options.length).toBe(4); // 3 options + 1 placeholder
    });

    it('renders with custom id', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          id: 'custom-select',
        },
      });
      expect(wrapper.find('select').attributes('id')).toBe('custom-select');
    });

    it('renders with custom name', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          name: 'category',
        },
      });
      expect(wrapper.find('select').attributes('name')).toBe('category');
    });

    it('renders with custom class', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          class: 'custom-class',
        },
      });
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });

    it('renders disabled options', () => {
      const optionsWithDisabled = [
        { label: 'Option 1', value: 1 },
        { label: 'Option 2', value: 2, disabled: true },
        { label: 'Option 3', value: 3 },
      ];
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: optionsWithDisabled,
        },
      });
      const options = wrapper.findAll('option');
      expect(options[1]?.element.disabled).toBe(true);
      expect(options[0]?.element.disabled).toBe(false);
      expect(options[2]?.element.disabled).toBe(false);
    });

    it('handles string values', () => {
      const stringOptions = [
        { label: 'Red', value: 'red' },
        { label: 'Blue', value: 'blue' },
      ];
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: stringOptions,
        },
      });
      const options = wrapper.findAll('option');
      expect(options[0]?.element.value).toBe('red');
      expect(options[1]?.element.value).toBe('blue');
    });
  });

  describe('States', () => {
    it('applies error class when error prop is string', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          error: 'Error message',
        },
      });
      expect(wrapper.find('select').classes()).toContain('border-[var(--red)]');
    });

    it('applies error class when error prop is array with errors', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          error: ['Error 1', 'Error 2'],
        },
      });
      expect(wrapper.find('select').classes()).toContain('border-[var(--red)]');
    });

    it('does not apply error class when error is empty', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          error: '',
        },
      });
      expect(wrapper.find('.error').exists()).toBe(false);
    });

    it('renders disabled state', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          disabled: true,
        },
      });
      expect(wrapper.find('select').attributes('disabled')).toBeDefined();
    });

    it('renders required attribute', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          required: true,
        },
      });
      expect(wrapper.find('select').attributes('required')).toBeDefined();
    });
  });

  describe('v-model', () => {
    it('emits update:modelValue on selection', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });

      const select = wrapper.find('select');
      await select.setValue('2');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2']);
    });

    it('displays selected value', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: 2,
          options: mockOptions,
        },
      });
      expect(wrapper.find('select').element.value).toBe('2');
    });

    it('handles null value', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          placeholder: 'Select',
        },
      });
      expect(wrapper.find('select').element.value).toBe('');
    });

    it('emits null when placeholder selected', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: 1,
          options: mockOptions,
          placeholder: 'Select',
        },
      });

      await wrapper.find('select').setValue('');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
    });

    it('handles string value selection', async () => {
      const stringOptions = [
        { label: 'Red', value: 'red' },
        { label: 'Blue', value: 'blue' },
      ];
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: stringOptions,
        },
      });

      await wrapper.find('select').setValue('blue');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['blue']);
    });

    it('handles number value selection', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });

      await wrapper.find('select').setValue('3');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['3']);
    });
  });

  describe('Events', () => {
    it('emits change event on selection', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });

      await wrapper.find('select').setValue('2');
      expect(wrapper.emitted('change')).toBeTruthy();
      expect(wrapper.emitted('change')?.[0]?.[0]).toBeInstanceOf(Event);
    });

    it('emits blur event', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });

      await wrapper.find('select').trigger('blur');
      expect(wrapper.emitted('blur')).toBeTruthy();
      expect(wrapper.emitted('blur')?.[0]?.[0]).toBeInstanceOf(FocusEvent);
    });

    it('emits focus event', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });

      await wrapper.find('select').trigger('focus');
      expect(wrapper.emitted('focus')).toBeTruthy();
      expect(wrapper.emitted('focus')?.[0]?.[0]).toBeInstanceOf(FocusEvent);
    });

    it('emits all events correctly', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });

      const select = wrapper.find('select');
      await select.trigger('focus');
      await select.setValue('2');
      await select.trigger('blur');

      expect(wrapper.emitted('focus')).toBeTruthy();
      expect(wrapper.emitted('change')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('blur')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('sets aria-invalid when error exists', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          error: 'Error message',
        },
      });
      expect(wrapper.find('select').attributes('aria-invalid')).toBe('true');
    });

    it('does not set aria-invalid when no error', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });
      expect(wrapper.find('select').attributes('aria-invalid')).toBeUndefined();
    });

    it('sets aria-required when required', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          required: true,
        },
      });
      expect(wrapper.find('select').attributes('aria-required')).toBe('true');
    });

    it('does not set aria-required when not required', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          required: false,
        },
      });
      expect(wrapper.find('select').attributes('aria-required')).toBeUndefined();
    });

    it('sets aria-describedby when error and id present', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          id: 'test-select',
          error: 'Error message',
        },
      });
      expect(wrapper.find('select').attributes('aria-describedby')).toBe('test-select-error');
    });

    it('does not set aria-describedby when no error', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          id: 'test-select',
        },
      });
      expect(wrapper.find('select').attributes('aria-describedby')).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: [],
        },
      });
      expect(wrapper.findAll('option').length).toBe(0);
    });

    it('handles single option', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: [{ label: 'Only Option', value: 1 }],
        },
      });
      expect(wrapper.findAll('option').length).toBe(1);
    });

    it('handles many options', () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => ({
        label: `Option ${i + 1}`,
        value: i + 1,
      }));
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: manyOptions,
        },
      });
      expect(wrapper.findAll('option').length).toBe(100);
    });

    it('handles options with special characters in labels', () => {
      const specialOptions = [
        { label: 'Option <1>', value: 1 },
        { label: 'Option & 2', value: 2 },
        { label: 'Option "3"', value: 3 },
      ];
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: specialOptions,
        },
      });
      const options = wrapper.findAll('option');
      expect(options[0]?.text()).toBe('Option <1>');
      expect(options[1]?.text()).toBe('Option & 2');
      expect(options[2]?.text()).toBe('Option "3"');
    });

    it('handles changing options array', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });
      expect(wrapper.findAll('option').length).toBe(3);

      const newOptions = [
        { label: 'New 1', value: 10 },
        { label: 'New 2', value: 20 },
      ];
      await wrapper.setProps({ options: newOptions });
      expect(wrapper.findAll('option').length).toBe(2);
    });

    it('maintains selection when options change', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: 2,
          options: mockOptions,
        },
      });
      expect(wrapper.find('select').element.value).toBe('2');

      const newOptions = [
        { label: 'Option 1', value: 1 },
        { label: 'Option 2', value: 2 },
        { label: 'Option 4', value: 4 },
      ];
      await wrapper.setProps({ options: newOptions });
      expect(wrapper.find('select').element.value).toBe('2');
    });

    it('handles unicode in option labels', () => {
      const unicodeOptions = [
        { label: '日本語', value: 'jp' },
        { label: '中文', value: 'cn' },
        { label: '🚀 Rocket', value: 'rocket' },
      ];
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: unicodeOptions,
        },
      });
      const options = wrapper.findAll('option');
      expect(options[0]?.text()).toBe('日本語');
      expect(options[1]?.text()).toBe('中文');
      expect(options[2]?.text()).toBe('🚀 Rocket');
    });

    it('handles disabled state correctly', () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
          disabled: true,
        },
      });
      expect(wrapper.find('select').attributes('disabled')).toBeDefined();
    });

    it('handles rapid selection changes', async () => {
      const wrapper = mount(VrlSelect, {
        props: {
          modelValue: null,
          options: mockOptions,
        },
      });

      const select = wrapper.find('select');
      await select.setValue('1');
      await select.setValue('2');
      await select.setValue('3');

      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted).toBeTruthy();
      expect(emitted?.length).toBe(3);
    });
  });
});
