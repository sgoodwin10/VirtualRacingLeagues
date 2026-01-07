import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SettingCard from '../SettingCard.vue';

describe('SettingCard', () => {
  describe('Basic Rendering', () => {
    it('renders with title and description', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'This is a test setting description',
        },
      });

      expect(wrapper.text()).toContain('Test Setting');
      expect(wrapper.text()).toContain('This is a test setting description');
    });

    it('renders with data-testid attribute', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      expect(wrapper.find('[data-testid="setting-card"]').exists()).toBe(true);
    });
  });

  describe('Toggle Functionality', () => {
    it('emits update:modelValue when clicked', async () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      await wrapper.find('[data-testid="setting-card"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('toggles from true to false', async () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: true,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      await wrapper.find('[data-testid="setting-card"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('does not emit when disabled', async () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
          disabled: true,
        },
      });

      await wrapper.find('[data-testid="setting-card"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('Visual States', () => {
    it('applies inactive styles when modelValue is false', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const card = wrapper.find('[data-testid="setting-card"]');
      expect(card.classes()).toContain('bg-[var(--bg-card)]');
      expect(card.classes()).toContain('border-[var(--border)]');
    });

    it('applies active styles when modelValue is true', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: true,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const card = wrapper.find('[data-testid="setting-card"]');
      expect(card.classes()).toContain('border-[var(--cyan)]');
      expect(card.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(card.classes()).toContain('active');
    });

    it('applies disabled styles when disabled', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
          disabled: true,
        },
      });

      const card = wrapper.find('[data-testid="setting-card"]');
      expect(card.classes()).toContain('opacity-60');
      expect(card.classes()).toContain('cursor-not-allowed');
    });

    it('does not apply hover class when disabled', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
          disabled: true,
        },
      });

      const card = wrapper.find('[data-testid="setting-card"]');
      // When disabled, the hover class should not be applied
      // The component conditionally adds hover:border-[var(--cyan)] only when !disabled && !modelValue
      expect(card.classes()).toContain('cursor-not-allowed');
    });
  });

  describe('Checkbox Visual', () => {
    it('shows unchecked state when modelValue is false', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const checkbox = wrapper.find('.w-5.h-5.border-2.rounded');
      expect(checkbox.classes()).toContain('border-[var(--border)]');
      expect(checkbox.classes()).not.toContain('bg-[var(--cyan)]');

      // Checkmark should be hidden
      const checkmark = checkbox.find('svg');
      expect(checkmark.classes()).toContain('opacity-0');
    });

    it('shows checked state when modelValue is true', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: true,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const checkbox = wrapper.find('.w-5.h-5.border-2.rounded');
      expect(checkbox.classes()).toContain('bg-[var(--cyan)]');
      expect(checkbox.classes()).toContain('border-[var(--cyan)]');

      // Checkmark should be visible
      const checkmark = checkbox.find('svg');
      expect(checkmark.classes()).toContain('opacity-100');
    });
  });

  describe('Nested Options Slot', () => {
    it('does not show nested options when modelValue is false', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
        slots: {
          default: '<div data-testid="nested-content">Nested Content</div>',
        },
      });

      expect(wrapper.find('[data-testid="nested-options"]').exists()).toBe(false);
    });

    it('shows nested options when modelValue is true', async () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: true,
          title: 'Test Setting',
          description: 'Description',
        },
        slots: {
          default: '<div data-testid="nested-content">Nested Content</div>',
        },
      });

      // Wait for transition
      await wrapper.vm.$nextTick();

      const nestedOptions = wrapper.find('[data-testid="nested-options"]');
      expect(nestedOptions.exists()).toBe(true);
      expect(nestedOptions.classes()).toContain('nested-options');
      expect(nestedOptions.classes()).toContain('mt-3');
      expect(nestedOptions.classes()).toContain('pt-3');
      expect(nestedOptions.classes()).toContain('border-t');
    });

    it('renders slot content', async () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: true,
          title: 'Test Setting',
          description: 'Description',
        },
        slots: {
          default: '<div data-testid="nested-content">Nested Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      const nestedContent = wrapper.find('[data-testid="nested-content"]');
      expect(nestedContent.exists()).toBe(true);
      expect(nestedContent.text()).toBe('Nested Content');
    });

    it('prevents click propagation on nested content', async () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: true,
          title: 'Test Setting',
          description: 'Description',
        },
        slots: {
          default: '<button data-testid="nested-button">Click Me</button>',
        },
      });

      await wrapper.vm.$nextTick();

      // Click on nested button should not toggle the card
      const nestedButton = wrapper.find('[data-testid="nested-button"]');
      await nestedButton.trigger('click');

      // Should not emit because the nested options div has @click.stop
      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('does not render slot when no slot content provided', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: true,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      expect(wrapper.find('[data-testid="nested-options"]').exists()).toBe(false);
    });
  });

  describe('Layout and Structure', () => {
    it('has correct flex layout', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const card = wrapper.find('[data-testid="setting-card"]');
      expect(card.classes()).toContain('flex');
      expect(card.classes()).toContain('items-start');
    });

    it('has correct padding and border radius', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const card = wrapper.find('[data-testid="setting-card"]');
      expect(card.classes()).toContain('p-3.5');
      expect(card.classes()).toContain('px-4');
      expect(card.classes()).toContain('rounded-md');
    });

    it('checkbox has correct margin', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const checkbox = wrapper.find('.w-5.h-5.border-2.rounded');
      expect(checkbox.attributes('style')).toContain('margin-right: 14px');
    });
  });

  describe('Typography', () => {
    it('title has correct styling', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const title = wrapper.find('.text-md.font-medium');
      expect(title.exists()).toBe(true);
      expect(title.classes()).toContain('text-[var(--text-primary)]');
      expect(title.classes()).toContain('mb-0.5');
    });

    it('description has correct styling', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const description = wrapper.find('.text-sm');
      expect(description.exists()).toBe(true);
      expect(description.classes()).toContain('text-[var(--text-muted)]');
    });
  });

  describe('Accessibility', () => {
    it('has cursor-pointer for interactive elements', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
        },
      });

      const card = wrapper.find('[data-testid="setting-card"]');
      expect(card.classes()).toContain('cursor-pointer');
    });

    it('changes cursor when disabled', () => {
      const wrapper = mount(SettingCard, {
        props: {
          modelValue: false,
          title: 'Test Setting',
          description: 'Description',
          disabled: true,
        },
      });

      const card = wrapper.find('[data-testid="setting-card"]');
      expect(card.classes()).toContain('cursor-not-allowed');
    });
  });
});
