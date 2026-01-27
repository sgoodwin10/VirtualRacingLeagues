import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlPasswordInput from './VrlPasswordInput.vue';

describe('VrlPasswordInput', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(VrlPasswordInput, {
      props: {
        modelValue: '',
      },
    });
  });

  describe('Rendering', () => {
    it('should render password input field', () => {
      const input = wrapper.find('input');
      expect(input.exists()).toBe(true);
    });

    it('should render as password type by default', () => {
      const input = wrapper.find('input');
      expect(input.attributes('type')).toBe('password');
    });

    it('should render toggle visibility button', () => {
      const toggleButton = wrapper.find('button[type="button"]');
      expect(toggleButton.exists()).toBe(true);
    });

    it('should display placeholder when provided', async () => {
      await wrapper.setProps({ placeholder: 'Enter password' });

      const input = wrapper.find('input');
      expect(input.attributes('placeholder')).toBe('Enter password');
    });

    it('should render with id attribute', async () => {
      await wrapper.setProps({ id: 'test-password' });

      const input = wrapper.find('input');
      expect(input.attributes('id')).toBe('test-password');
    });

    it('should render with name attribute', async () => {
      await wrapper.setProps({ name: 'password' });

      const input = wrapper.find('input');
      expect(input.attributes('name')).toBe('password');
    });
  });

  describe('User Interactions', () => {
    it('should toggle input type between password and text', async () => {
      const input = wrapper.find('input');
      const toggleButton = wrapper.find('button[type="button"]');

      expect(input.attributes('type')).toBe('password');

      await toggleButton.trigger('click');
      expect(input.attributes('type')).toBe('text');

      await toggleButton.trigger('click');
      expect(input.attributes('type')).toBe('password');
    });

    it('should emit update:modelValue on input', async () => {
      const input = wrapper.find('input');
      await input.setValue('password123');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['password123']);
    });

    it('should emit input event on input', async () => {
      const input = wrapper.find('input');
      await input.trigger('input');

      expect(wrapper.emitted('input')).toBeTruthy();
    });

    it('should emit focus event on focus', async () => {
      const input = wrapper.find('input');
      await input.trigger('focus');

      expect(wrapper.emitted('focus')).toBeTruthy();
    });

    it('should emit blur event on blur', async () => {
      const input = wrapper.find('input');
      await input.trigger('blur');

      expect(wrapper.emitted('blur')).toBeTruthy();
    });

    it('should not toggle visibility when disabled', async () => {
      await wrapper.setProps({ disabled: true });

      const input = wrapper.find('input');
      const toggleButton = wrapper.find('button[type="button"]');

      expect(input.attributes('type')).toBe('password');

      await toggleButton.trigger('click');
      expect(input.attributes('type')).toBe('password');
    });
  });

  describe('Props', () => {
    it('should accept and display modelValue', async () => {
      await wrapper.setProps({ modelValue: 'test-password' });

      const input = wrapper.find('input');
      expect((input.element as HTMLInputElement).value).toBe('test-password');
    });

    it('should apply disabled state', async () => {
      await wrapper.setProps({ disabled: true });

      const input = wrapper.find('input');
      const toggleButton = wrapper.find('button[type="button"]');

      expect(input.attributes('disabled')).toBeDefined();
      expect(toggleButton.attributes('disabled')).toBeDefined();
    });

    it('should apply required attribute', async () => {
      await wrapper.setProps({ required: true });

      const input = wrapper.find('input');
      expect(input.attributes('required')).toBeDefined();
    });

    it('should apply autocomplete attribute', async () => {
      await wrapper.setProps({ autocomplete: 'current-password' });

      const input = wrapper.find('input');
      expect(input.attributes('autocomplete')).toBe('current-password');
    });

    it('should apply custom class', async () => {
      await wrapper.setProps({ class: 'custom-class' });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('custom-class');
    });

    it('should accept error as string', async () => {
      await wrapper.setProps({ error: 'Password is required' });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('border-[var(--red)]');
    });

    it('should accept error as array', async () => {
      await wrapper.setProps({ error: ['Password is required', 'Must be at least 8 characters'] });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('border-[var(--red)]');
    });

    it('should not show error styles when error is empty string', async () => {
      await wrapper.setProps({ error: '' });

      const input = wrapper.find('input');
      expect(input.classes()).not.toContain('border-[var(--red)]');
    });

    it('should not show error styles when error is empty array', async () => {
      await wrapper.setProps({ error: [] });

      const input = wrapper.find('input');
      expect(input.classes()).not.toContain('border-[var(--red)]');
    });
  });

  describe('Visual States', () => {
    it('should apply error styling when error prop is set', async () => {
      await wrapper.setProps({ error: 'Invalid password' });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('border-[var(--red)]');
    });

    it('should apply normal styling when no error', () => {
      const input = wrapper.find('input');
      expect(input.classes()).toContain('border-[var(--border)]');
    });

    it('should apply disabled styling', async () => {
      await wrapper.setProps({ disabled: true });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('opacity-50');
      expect(input.classes()).toContain('cursor-not-allowed');
    });

    it('should change toggle button icon when visibility changes', async () => {
      const toggleButton = wrapper.find('button[type="button"]');

      // Should show eye icon initially (password hidden)
      expect(wrapper.findComponent({ name: 'PhEye' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'PhEyeSlash' }).exists()).toBe(false);

      // Toggle to show password
      await toggleButton.trigger('click');

      // Should show eye-slash icon (password visible)
      expect(wrapper.findComponent({ name: 'PhEye' }).exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'PhEyeSlash' }).exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive toggle button aria-label for hidden password', () => {
      const toggleButton = wrapper.find('button[type="button"]');
      expect(toggleButton.attributes('aria-label')).toBe('Show password');
    });

    it('should have descriptive toggle button aria-label for visible password', async () => {
      const toggleButton = wrapper.find('button[type="button"]');
      await toggleButton.trigger('click');

      expect(toggleButton.attributes('aria-label')).toBe('Hide password');
    });

    it('should have aria-invalid when error is present', async () => {
      await wrapper.setProps({ error: 'Invalid password', id: 'password' });

      const input = wrapper.find('input');
      expect(input.attributes('aria-invalid')).toBe('true');
    });

    it('should have aria-required when required', async () => {
      await wrapper.setProps({ required: true });

      const input = wrapper.find('input');
      expect(input.attributes('aria-required')).toBe('true');
    });

    it('should have aria-describedby when error is present with id', async () => {
      await wrapper.setProps({ error: 'Invalid password', id: 'password' });

      const input = wrapper.find('input');
      expect(input.attributes('aria-describedby')).toBe('password-error');
    });

    it('should have tabindex -1 on toggle button', () => {
      const toggleButton = wrapper.find('button[type="button"]');
      expect(toggleButton.attributes('tabindex')).toBe('-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', async () => {
      const input = wrapper.find('input');
      await input.setValue('');

      expect((input.element as HTMLInputElement).value).toBe('');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);

      await wrapper.setProps({ modelValue: longPassword });

      const input = wrapper.find('input');
      expect((input.element as HTMLInputElement).value).toBe(longPassword);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      await wrapper.setProps({ modelValue: specialPassword });

      const input = wrapper.find('input');
      expect((input.element as HTMLInputElement).value).toBe(specialPassword);
    });

    it('should handle multiple rapid toggles', async () => {
      const toggleButton = wrapper.find('button[type="button"]');

      await toggleButton.trigger('click');
      await toggleButton.trigger('click');
      await toggleButton.trigger('click');
      await toggleButton.trigger('click');

      const input = wrapper.find('input');
      expect(input.attributes('type')).toBe('password');
    });

    it('should maintain input value when toggling visibility', async () => {
      // Set value through props to ensure it's properly bound
      await wrapper.setProps({ modelValue: 'secretPassword' });

      const input = wrapper.find('input');
      expect((input.element as HTMLInputElement).value).toBe('secretPassword');

      const toggleButton = wrapper.find('button[type="button"]');
      await toggleButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect((input.element as HTMLInputElement).value).toBe('secretPassword');

      await toggleButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect((input.element as HTMLInputElement).value).toBe('secretPassword');
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus on input when toggling visibility', async () => {
      // Attach to document body for proper focus handling
      const container = document.createElement('div');
      document.body.appendChild(container);

      const focusWrapper = mount(VrlPasswordInput, {
        props: {
          modelValue: '',
        },
        attachTo: container,
      });

      const input = focusWrapper.find('input');
      const inputElement = input.element as HTMLInputElement;

      inputElement.focus();
      expect(document.activeElement).toBe(inputElement);

      const toggleButton = focusWrapper.find('button[type="button"]');
      await toggleButton.trigger('click');

      // Focus should remain on input (button has tabindex -1)
      expect(document.activeElement).toBe(inputElement);

      focusWrapper.unmount();
      document.body.removeChild(container);
    });
  });
});
