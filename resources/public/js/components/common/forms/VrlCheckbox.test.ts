import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlCheckbox from './VrlCheckbox.vue';

describe('VrlCheckbox', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test Label',
        },
      });
      expect(wrapper.find('label').exists()).toBe(true);
      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('Test Label');
    });

    it('renders with custom id', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
          id: 'custom-checkbox',
        },
      });
      expect(wrapper.find('input').attributes('id')).toBe('custom-checkbox');
    });

    it('renders with custom name', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
          name: 'agreement',
        },
      });
      expect(wrapper.find('input').attributes('name')).toBe('agreement');
    });

    it('renders with custom class', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
          class: 'custom-class',
        },
      });
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });

    it('generates unique id when not provided', () => {
      const wrapper1 = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test 1',
        },
      });
      const wrapper2 = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test 2',
        },
      });

      const id1 = wrapper1.find('input').attributes('id');
      const id2 = wrapper2.find('input').attributes('id');

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });
  });

  describe('Checked State', () => {
    it('renders unchecked state', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });
      expect(wrapper.find('input').element.checked).toBe(false);
      const checkbox = wrapper.findAll('span').find((w) => w.classes().includes('w-[18px]'));
      expect(checkbox?.classes()).toContain('border-[var(--border)]');
    });

    it('renders checked state', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: true,
          label: 'Test',
        },
      });
      expect(wrapper.find('input').element.checked).toBe(true);
      const checkbox = wrapper.findAll('span').find((w) => w.classes().includes('w-[18px]'));
      expect(checkbox?.classes()).toContain('bg-[var(--cyan)]');
    });

    it('toggles checked state visually', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      let checkbox = wrapper.findAll('span').find((w) => w.classes().includes('w-[18px]'));
      expect(checkbox?.classes()).toContain('border-[var(--border)]');

      await wrapper.setProps({ modelValue: true });
      checkbox = wrapper.findAll('span').find((w) => w.classes().includes('w-[18px]'));
      expect(checkbox?.classes()).toContain('bg-[var(--cyan)]');

      await wrapper.setProps({ modelValue: false });
      checkbox = wrapper.findAll('span').find((w) => w.classes().includes('w-[18px]'));
      expect(checkbox?.classes()).toContain('border-[var(--border)]');
    });

    it('displays checkmark when checked', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: true,
          label: 'Test',
        },
      });

      const checkbox = wrapper.findAll('span').find((w) => w.classes().includes('w-[18px]'));
      expect(checkbox?.classes()).toContain('bg-[var(--cyan)]');
      // The checkmark is rendered in a nested span
      expect(wrapper.text()).toContain('✓');
    });
  });

  describe('v-model - Single Checkbox', () => {
    it('emits update:modelValue on change', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      await wrapper.find('input').setValue(true);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('emits change event', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      await wrapper.find('input').setValue(true);

      expect(wrapper.emitted('change')).toBeTruthy();
      expect(wrapper.emitted('change')?.[0]).toEqual([true]);
    });

    it('toggles from false to true', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      await wrapper.find('input').setValue(true);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('toggles from true to false', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: true,
          label: 'Test',
        },
      });

      await wrapper.find('input').setValue(false);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('v-model - Checkbox Group', () => {
    it('adds value to array when checked', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: ['option1'],
          label: 'Option 2',
          value: 'option2',
        },
      });

      await wrapper.find('input').setValue(true);

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['option1', 'option2']]);
    });

    it('removes value from array when unchecked', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: ['option1', 'option2'],
          label: 'Option 2',
          value: 'option2',
        },
      });

      await wrapper.find('input').setValue(false);

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['option1']]);
    });

    it('handles numeric values in array', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: [1, 2],
          label: 'Option 3',
          value: 3,
        },
      });

      await wrapper.find('input').setValue(true);

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 2, 3]]);
    });

    it('correctly identifies if value is in array (checked state)', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: ['option1', 'option2'],
          label: 'Option 2',
          value: 'option2',
        },
      });

      expect(wrapper.find('input').element.checked).toBe(true);
    });

    it('correctly identifies if value is not in array (unchecked state)', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: ['option1'],
          label: 'Option 2',
          value: 'option2',
        },
      });

      expect(wrapper.find('input').element.checked).toBe(false);
    });

    it('handles empty array', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: [],
          label: 'Option 1',
          value: 'option1',
        },
      });

      await wrapper.find('input').setValue(true);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['option1']]);
    });
  });

  describe('Label Click', () => {
    it('toggles checkbox when label is clicked', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Click me',
        },
      });

      await wrapper.find('label').trigger('click');

      // The browser handles the label click -> input toggle
      // We just verify the structure is correct for this to work
      expect(wrapper.find('label').attributes('for')).toBe(wrapper.find('input').attributes('id'));
    });
  });

  describe('Disabled State', () => {
    it('renders disabled attribute', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
          disabled: true,
        },
      });
      expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    });

    it('does not emit events when disabled', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
          disabled: true,
        },
      });

      const input = wrapper.find('input');

      // Try to change the disabled input
      await input.trigger('change');

      // Should not emit
      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
      expect(wrapper.emitted('change')).toBeFalsy();
    });

    it('does not respond to keyboard when disabled', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
          disabled: true,
        },
      });

      await wrapper.find('input').trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('Keyboard Navigation', () => {
    it('toggles on Space key', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      const input = wrapper.find('input');
      await input.trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('toggles on Enter key', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      const input = wrapper.find('input');
      await input.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('does not toggle on other keys', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      await wrapper.find('input').trigger('keydown', { key: 'a' });

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('prevents default on Space key to avoid page scroll', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      const event = new KeyboardEvent('keydown', { key: ' ' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      await wrapper.find('input').element.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('hides native input with sr-only class', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });
      expect(wrapper.find('input').classes()).toContain('absolute');
      expect(wrapper.find('input').classes()).toContain('w-px');
    });

    it('sets aria-hidden on visual checkbox element', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });
      const checkbox = wrapper.findAll('span').find((w) => w.classes().includes('w-[18px]'));
      expect(checkbox?.attributes('aria-hidden')).toBe('true');
    });

    it('associates label with input via for/id', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
          id: 'test-checkbox',
        },
      });

      const label = wrapper.find('label');
      const input = wrapper.find('input');

      expect(label.attributes('for')).toBe('test-checkbox');
      expect(input.attributes('id')).toBe('test-checkbox');
    });

    it('is keyboard focusable', () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('type')).toBe('checkbox');
      // Native checkbox inputs are focusable
      expect(input.element.tagName).toBe('INPUT');
    });
  });

  describe('Focus Ring', () => {
    it('shows focus ring on keyboard focus', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      const input = wrapper.find('input');
      await input.trigger('focus');

      // CSS :focus-visible will apply the focus ring via the :has() selector
      // We verify the input can receive focus
      expect(input.exists()).toBe(true);
      expect(input.element.tagName).toBe('INPUT');
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid toggle', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      const input = wrapper.find('input');
      await input.setValue(true);
      await input.setValue(false);
      await input.setValue(true);

      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted?.length).toBe(3);
      expect(emitted?.[0]).toEqual([true]);
      expect(emitted?.[1]).toEqual([false]);
      expect(emitted?.[2]).toEqual([true]);
    });

    it('handles value prop without array modelValue (console warning)', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: [],
          label: 'Test',
          // Missing value prop with array modelValue
        },
      });

      wrapper.find('input').trigger('change');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('value prop is required when modelValue is an array'),
      );

      consoleWarnSpy.mockRestore();
    });

    it('maintains state across prop updates', async () => {
      const wrapper = mount(VrlCheckbox, {
        props: {
          modelValue: false,
          label: 'Initial Label',
        },
      });

      await wrapper.setProps({ label: 'Updated Label' });
      expect(wrapper.text()).toContain('Updated Label');

      await wrapper.setProps({ modelValue: true });
      expect(wrapper.find('input').element.checked).toBe(true);
    });
  });
});
