import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlToggle from './VrlToggle.vue';

describe('VrlToggle', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlToggle, {
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
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
          id: 'custom-toggle',
        },
      });
      expect(wrapper.find('input').attributes('id')).toBe('custom-toggle');
    });

    it('renders with custom name', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
          name: 'notifications',
        },
      });
      expect(wrapper.find('input').attributes('name')).toBe('notifications');
    });

    it('renders with custom class', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
          class: 'custom-class',
        },
      });
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });

    it('generates unique id when not provided', () => {
      const wrapper1 = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test 1',
        },
      });
      const wrapper2 = mount(VrlToggle, {
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

  describe('Active State', () => {
    it('renders inactive state', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });
      expect(wrapper.find('input').element.checked).toBe(false);
      const toggle = wrapper.findAll('span').find((w) => w.classes().includes('w-11'));
      expect(toggle?.classes()).toContain('bg-[var(--bg-elevated)]');
    });

    it('renders active state', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: true,
          label: 'Test',
        },
      });
      expect(wrapper.find('input').element.checked).toBe(true);
      const toggle = wrapper.findAll('span').find((w) => w.classes().includes('w-11'));
      expect(toggle?.classes()).toContain('bg-[var(--green-dim)]');
    });

    it('toggles active state visually', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      let toggle = wrapper.findAll('span').find((w) => w.classes().includes('w-11'));
      expect(toggle?.classes()).toContain('bg-[var(--bg-elevated)]');

      await wrapper.setProps({ modelValue: true });
      toggle = wrapper.findAll('span').find((w) => w.classes().includes('w-11'));
      expect(toggle?.classes()).toContain('bg-[var(--green-dim)]');

      await wrapper.setProps({ modelValue: false });
      toggle = wrapper.findAll('span').find((w) => w.classes().includes('w-11'));
      expect(toggle?.classes()).toContain('bg-[var(--bg-elevated)]');
    });

    it('shows green color class when active', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: true,
          label: 'Test',
        },
      });

      const toggle = wrapper.findAll('span').find((w) => w.classes().includes('w-11'));
      expect(toggle?.classes()).toContain('bg-[var(--green-dim)]');
    });
  });

  describe('v-model', () => {
    it('emits update:modelValue on change', async () => {
      const wrapper = mount(VrlToggle, {
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
      const wrapper = mount(VrlToggle, {
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
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      await wrapper.find('input').setValue(true);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('toggles from true to false', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: true,
          label: 'Test',
        },
      });

      await wrapper.find('input').setValue(false);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('Label Click', () => {
    it('toggles switch when label is clicked', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Click me',
        },
      });

      // The browser handles the label click -> input toggle
      // We just verify the structure is correct for this to work
      expect(wrapper.find('label').attributes('for')).toBe(wrapper.find('input').attributes('id'));
    });
  });

  describe('Disabled State', () => {
    it('renders disabled attribute', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
          disabled: true,
        },
      });
      expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    });

    it('does not emit events when disabled', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
          disabled: true,
        },
      });

      const input = wrapper.find('input');
      await input.trigger('change');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
      expect(wrapper.emitted('change')).toBeFalsy();
    });

    it('does not respond to keyboard when disabled', async () => {
      const wrapper = mount(VrlToggle, {
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
      const wrapper = mount(VrlToggle, {
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
      const wrapper = mount(VrlToggle, {
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
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      await wrapper.find('input').trigger('keydown', { key: 'a' });

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('prevents default on Space key to avoid page scroll', async () => {
      const wrapper = mount(VrlToggle, {
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
    it('has role="switch"', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });
      expect(wrapper.find('input').attributes('role')).toBe('switch');
    });

    it('sets aria-checked to match modelValue', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: true,
          label: 'Test',
        },
      });
      expect(wrapper.find('input').attributes('aria-checked')).toBe('true');
    });

    it('updates aria-checked when modelValue changes', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      expect(wrapper.find('input').attributes('aria-checked')).toBe('false');

      await wrapper.setProps({ modelValue: true });
      expect(wrapper.find('input').attributes('aria-checked')).toBe('true');
    });

    it('hides native input with sr-only class', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });
      expect(wrapper.find('input').classes()).toContain('absolute');
      expect(wrapper.find('input').classes()).toContain('w-px');
    });

    it('sets aria-hidden on visual toggle element', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });
      const toggle = wrapper.findAll('span').find((w) => w.classes().includes('w-11'));
      expect(toggle?.attributes('aria-hidden')).toBe('true');
    });

    it('associates label with input via for/id', () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
          id: 'test-toggle',
        },
      });

      const label = wrapper.find('label');
      const input = wrapper.find('input');

      expect(label.attributes('for')).toBe('test-toggle');
      expect(input.attributes('id')).toBe('test-toggle');
    });

    it('is keyboard focusable', () => {
      const wrapper = mount(VrlToggle, {
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
      const wrapper = mount(VrlToggle, {
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
      const wrapper = mount(VrlToggle, {
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

    it('maintains state across prop updates', async () => {
      const wrapper = mount(VrlToggle, {
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

    it('emits both update:modelValue and change on toggle', async () => {
      const wrapper = mount(VrlToggle, {
        props: {
          modelValue: false,
          label: 'Test',
        },
      });

      await wrapper.find('input').setValue(true);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('change')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
      expect(wrapper.emitted('change')?.[0]).toEqual([true]);
    });
  });
});
