import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseCheckbox from '../BaseCheckbox.vue';

describe('BaseCheckbox', () => {
  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const wrapper = mount(BaseCheckbox);

      expect(wrapper.find('[role="checkbox"]').exists()).toBe(true);
      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe('false');
    });

    it('renders with label when provided', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          label: 'Accept terms',
          id: 'terms',
        },
      });

      const label = wrapper.find('label');
      expect(label.exists()).toBe(true);
      expect(label.text()).toBe('Accept terms');
      expect(label.attributes('for')).toBe('terms');
    });

    it('renders slot content instead of label prop', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          label: 'This should not show',
        },
        slots: {
          default: '<span>Custom slot content</span>',
        },
      });

      expect(wrapper.text()).toContain('This should not show');
      expect(wrapper.text()).toContain('Custom slot content');
    });

    it('does not render label when label prop is not provided', () => {
      const wrapper = mount(BaseCheckbox);

      expect(wrapper.find('label').exists()).toBe(false);
    });

    it('applies checked styles when modelValue is true', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: true,
        },
      });

      const checkbox = wrapper.find('[data-testid="checkbox-box"]');
      expect(checkbox.classes()).toContain('bg-[var(--cyan)]');
      expect(checkbox.classes()).toContain('border-[var(--cyan)]');
    });

    it('applies unchecked styles when modelValue is false', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
        },
      });

      const checkbox = wrapper.find('[data-testid="checkbox-box"]');
      expect(checkbox.classes()).toContain('border-[var(--border)]');
      expect(checkbox.classes()).not.toContain('bg-[var(--cyan)]');
    });

    it('shows checkmark when checked', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: true,
        },
      });

      const svg = wrapper.find('svg');
      expect(svg.classes()).toContain('opacity-100');
    });

    it('hides checkmark when unchecked', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
        },
      });

      const svg = wrapper.find('svg');
      expect(svg.classes()).toContain('opacity-0');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: true,
          id: 'checkbox-1',
          ariaLabel: 'Custom aria label',
        },
      });

      const checkbox = wrapper.find('[role="checkbox"]');
      expect(checkbox.attributes('role')).toBe('checkbox');
      expect(checkbox.attributes('aria-checked')).toBe('true');
      expect(checkbox.attributes('aria-label')).toBe('Custom aria label');
      expect(checkbox.attributes('id')).toBe('checkbox-1');
    });

    it('uses label as aria-label when ariaLabel is not provided', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          label: 'Accept terms',
        },
      });

      const checkbox = wrapper.find('[role="checkbox"]');
      expect(checkbox.attributes('aria-label')).toBe('Accept terms');
    });

    it('is keyboard accessible with tabindex', () => {
      const wrapper = mount(BaseCheckbox);

      const checkbox = wrapper.find('[role="checkbox"]');
      expect(checkbox.attributes('tabindex')).toBe('0');
    });

    it('sets tabindex to -1 when disabled', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          disabled: true,
        },
      });

      const checkbox = wrapper.find('[role="checkbox"]');
      expect(checkbox.attributes('tabindex')).toBe('-1');
    });

    it('sets aria-disabled when disabled', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          disabled: true,
        },
      });

      const checkbox = wrapper.find('[role="checkbox"]');
      expect(checkbox.attributes('aria-disabled')).toBe('true');
    });
  });

  describe('Interaction', () => {
    it('emits update:modelValue event when clicked', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
        },
      });

      await wrapper.find('[role="checkbox"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('emits change event when clicked', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
        },
      });

      await wrapper.find('[role="checkbox"]').trigger('click');

      expect(wrapper.emitted('change')).toBeTruthy();
      expect(wrapper.emitted('change')?.[0]).toEqual([true]);
    });

    it('toggles from false to true when clicked', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
        },
      });

      await wrapper.find('[role="checkbox"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('toggles from true to false when clicked', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: true,
        },
      });

      await wrapper.find('[role="checkbox"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('can be toggled by clicking the container', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
          label: 'Test label',
        },
      });

      await wrapper.find('.inline-flex').trigger('click');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('does not emit events when disabled and clicked', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
          disabled: true,
        },
      });

      await wrapper.find('[role="checkbox"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
      expect(wrapper.emitted('change')).toBeFalsy();
    });
  });

  describe('Keyboard Navigation', () => {
    it('toggles when Space key is pressed', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
        },
      });

      await wrapper.find('[role="checkbox"]').trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('toggles when Enter key is pressed', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
        },
      });

      await wrapper.find('[role="checkbox"]').trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('prevents default behavior for Space key', async () => {
      const wrapper = mount(BaseCheckbox);
      const event = { key: ' ', preventDefault: vi.fn() };

      await wrapper.find('[role="checkbox"]').trigger('keydown', event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('prevents default behavior for Enter key', async () => {
      const wrapper = mount(BaseCheckbox);
      const event = { key: 'Enter', preventDefault: vi.fn() };

      await wrapper.find('[role="checkbox"]').trigger('keydown', event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not toggle when other keys are pressed', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
        },
      });

      await wrapper.find('[role="checkbox"]').trigger('keydown', { key: 'a' });

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('does not toggle when disabled and key is pressed', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
          disabled: true,
        },
      });

      await wrapper.find('[role="checkbox"]').trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('Focus and Blur Events', () => {
    it('emits focus event when focused', async () => {
      const wrapper = mount(BaseCheckbox);

      await wrapper.find('[role="checkbox"]').trigger('focus');

      expect(wrapper.emitted('focus')).toBeTruthy();
      expect(wrapper.emitted('focus')?.[0]).toHaveLength(1);
    });

    it('emits blur event when blurred', async () => {
      const wrapper = mount(BaseCheckbox);

      await wrapper.find('[role="checkbox"]').trigger('blur');

      expect(wrapper.emitted('blur')).toBeTruthy();
      expect(wrapper.emitted('blur')?.[0]).toHaveLength(1);
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles when disabled prop is true', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          disabled: true,
        },
      });

      const container = wrapper.find('.inline-flex');
      expect(container.classes()).toContain('opacity-60');
      expect(container.classes()).toContain('cursor-not-allowed');
    });

    it('does not apply disabled styles when disabled prop is false', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          disabled: false,
        },
      });

      const container = wrapper.find('.inline-flex');
      expect(container.classes()).not.toContain('opacity-60');
      expect(container.classes()).not.toContain('cursor-not-allowed');
      expect(container.classes()).toContain('cursor-pointer');
    });

    it('applies disabled cursor to label when disabled', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          disabled: true,
          label: 'Test label',
        },
      });

      const label = wrapper.find('label');
      expect(label.classes()).toContain('cursor-not-allowed');
    });
  });

  describe('Props', () => {
    it('accepts and uses name prop', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          name: 'terms-checkbox',
        },
      });

      expect(wrapper.props('name')).toBe('terms-checkbox');
    });

    it('accepts and uses id prop', () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          id: 'custom-id',
        },
      });

      const checkbox = wrapper.find('[role="checkbox"]');
      expect(checkbox.attributes('id')).toBe('custom-id');
    });
  });

  describe('v-model Integration', () => {
    it('works with v-model pattern', async () => {
      const wrapper = mount(BaseCheckbox, {
        props: {
          modelValue: false,
          'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }),
        },
      });

      expect(wrapper.props('modelValue')).toBe(false);

      await wrapper.find('[role="checkbox"]').trigger('click');

      const emitted = wrapper.emitted('update:modelValue')?.[0];
      expect(emitted).toEqual([true]);
    });
  });
});
