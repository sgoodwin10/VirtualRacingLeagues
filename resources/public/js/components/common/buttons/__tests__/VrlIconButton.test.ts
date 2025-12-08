import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlIconButton from '../VrlIconButton.vue';

describe('VrlIconButton', () => {
  describe('Rendering', () => {
    it('renders correctly', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add item' },
      });
      expect(wrapper.element.tagName).toBe('BUTTON');
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('has type="button"', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.attributes('type')).toBe('button');
    });
  });

  describe('Icon Prop', () => {
    it('renders plus icon', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('renders trash icon', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'trash', ariaLabel: 'Delete' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('renders gear icon', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'gear', ariaLabel: 'Settings' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('renders dots-three icon', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'dots-three', ariaLabel: 'More options' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('renders dots-three-vertical icon', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'dots-three-vertical', ariaLabel: 'More options' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('renders star icon', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'star', ariaLabel: 'Favorite' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('handles invalid icon name gracefully', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'invalid-icon', ariaLabel: 'Invalid' },
      });
      expect(wrapper.find('svg').exists()).toBe(false);
    });
  });

  describe('Size Prop', () => {
    it('applies xs size classes', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', size: 'xs' },
      });
      expect(wrapper.classes()).toContain('w-7');
      expect(wrapper.classes()).toContain('h-7');
    });

    it('applies sm size classes', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', size: 'sm' },
      });
      expect(wrapper.classes()).toContain('w-9');
      expect(wrapper.classes()).toContain('h-9');
    });

    it('applies md size classes (default)', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.classes()).toContain('w-10');
      expect(wrapper.classes()).toContain('h-10');
    });

    it('applies lg size classes', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', size: 'lg' },
      });
      expect(wrapper.classes()).toContain('w-12');
      expect(wrapper.classes()).toContain('h-12');
    });
  });

  describe('Icon Size Integration', () => {
    it('applies correct icon size for xs button', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', size: 'xs' },
      });
      const icon = wrapper.find('svg');
      expect(icon.classes()).toContain('text-xs');
    });

    it('applies correct icon size for sm button', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', size: 'sm' },
      });
      const icon = wrapper.find('svg');
      expect(icon.classes()).toContain('text-sm');
    });

    it('applies correct icon size for md button', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', size: 'md' },
      });
      const icon = wrapper.find('svg');
      expect(icon.classes()).toContain('text-base');
    });

    it('applies correct icon size for lg button', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', size: 'lg' },
      });
      const icon = wrapper.find('svg');
      expect(icon.classes()).toContain('text-lg');
    });
  });

  describe('Variant Prop', () => {
    it('applies angled variant classes (default)', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.classes()).toContain('bg-racing-safety');
      expect(wrapper.classes()).toContain('text-racing-pit-white');
    });

    it('applies rounded variant classes', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', variant: 'rounded' },
      });
      expect(wrapper.classes()).toContain('bg-racing-safety');
      expect(wrapper.classes()).toContain('rounded');
    });

    it('applies circular variant classes', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', variant: 'circular' },
      });
      expect(wrapper.classes()).toContain('bg-racing-safety');
      expect(wrapper.classes()).toContain('rounded-full');
      expect(wrapper.classes()).toContain('shadow-md');
    });

    it('applies gold-outline variant classes', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'pencil-simple', ariaLabel: 'Edit', variant: 'gold-outline' },
      });
      expect(wrapper.classes()).toContain('bg-transparent');
      expect(wrapper.classes()).toContain('text-racing-gold');
      expect(wrapper.classes()).toContain('border');
      expect(wrapper.classes()).toContain('border-racing-gold');
      expect(wrapper.classes()).toContain('rounded');
    });

    it('applies ghost variant classes', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'gear', ariaLabel: 'Settings', variant: 'ghost' },
      });
      expect(wrapper.classes()).toContain('theme-text-muted');
      expect(wrapper.classes()).toContain('theme-bg-tertiary');
      expect(wrapper.classes()).toContain('rounded');
    });

    it('applies danger variant classes', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'trash', ariaLabel: 'Delete', variant: 'danger' },
      });
      expect(wrapper.classes()).toContain('bg-transparent');
      expect(wrapper.classes()).toContain('text-racing-danger');
      expect(wrapper.classes()).toContain('border');
      expect(wrapper.classes()).toContain('border-racing-danger/50');
    });
  });

  describe('Disabled State', () => {
    it('sets disabled attribute when disabled=true', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', disabled: true },
      });
      expect(wrapper.attributes('disabled')).toBeDefined();
    });

    it('does not emit click event when disabled', async () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', disabled: true },
      });
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('is not disabled by default', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Click Events', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.[0]).toBeDefined();
    });

    it('passes mouse event to click handler', async () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      await wrapper.trigger('click');
      const emittedEvent = wrapper.emitted('click')?.[0]?.[0];
      expect(emittedEvent).toBeInstanceOf(MouseEvent);
    });

    it('can be clicked multiple times', async () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      await wrapper.trigger('click');
      await wrapper.trigger('click');
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toHaveLength(3);
    });
  });

  describe('Base Classes', () => {
    it('always includes flex class', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.classes()).toContain('flex');
    });

    it('always includes items-center class', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.classes()).toContain('items-center');
    });

    it('always includes justify-center class', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.classes()).toContain('justify-center');
    });

    it('always includes transition-all class', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.classes()).toContain('transition-all');
    });
  });

  describe('Custom Class Prop', () => {
    it('applies custom classes from class prop', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', class: 'custom-class' },
      });
      expect(wrapper.classes()).toContain('custom-class');
    });

    it('combines custom classes with variant and size classes', () => {
      const wrapper = mount(VrlIconButton, {
        props: {
          icon: 'plus',
          ariaLabel: 'Add',
          variant: 'circular',
          size: 'lg',
          class: 'mt-4',
        },
      });
      expect(wrapper.classes()).toContain('mt-4');
      expect(wrapper.classes()).toContain('rounded-full');
      expect(wrapper.classes()).toContain('w-12');
    });
  });

  describe('Accessibility', () => {
    it('requires ariaLabel prop', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add item' },
      });
      expect(wrapper.attributes('aria-label')).toBe('Add item');
    });

    it('sets correct aria-label for different actions', () => {
      const deleteWrapper = mount(VrlIconButton, {
        props: { icon: 'trash', ariaLabel: 'Delete item' },
      });
      expect(deleteWrapper.attributes('aria-label')).toBe('Delete item');

      const editWrapper = mount(VrlIconButton, {
        props: { icon: 'pencil-simple', ariaLabel: 'Edit item' },
      });
      expect(editWrapper.attributes('aria-label')).toBe('Edit item');
    });

    it('is focusable when not disabled', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.attributes('disabled')).toBeUndefined();
    });

    it('is not focusable when disabled', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', disabled: true },
      });
      expect(wrapper.attributes('disabled')).toBeDefined();
    });

    it('has type="button" for semantic clarity', () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      expect(wrapper.attributes('type')).toBe('button');
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple rapid clicks', async () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add' },
      });
      await wrapper.trigger('click');
      await wrapper.trigger('click');
      await wrapper.trigger('click');
      await wrapper.trigger('click');
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toHaveLength(5);
    });

    it('maintains icon when switching variants', async () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', variant: 'angled' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);

      await wrapper.setProps({ variant: 'circular' });
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('maintains icon when switching sizes', async () => {
      const wrapper = mount(VrlIconButton, {
        props: { icon: 'plus', ariaLabel: 'Add', size: 'xs' },
      });
      expect(wrapper.find('svg').exists()).toBe(true);

      await wrapper.setProps({ size: 'lg' });
      expect(wrapper.find('svg').exists()).toBe(true);
    });
  });
});
