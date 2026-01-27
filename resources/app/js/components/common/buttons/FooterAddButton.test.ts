import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FooterAddButton from '@app/components/common/buttons/FooterAddButton.vue';
import { PhPlus, PhPencil } from '@phosphor-icons/vue';

describe('FooterAddButton', () => {
  const mountFooterAddButton = (props = {}) => {
    return mount(FooterAddButton, {
      props: {
        label: 'Add Item',
        ...props,
      },
    });
  };

  describe('Rendering', () => {
    it('renders with label', () => {
      const wrapper = mountFooterAddButton({ label: 'Add Division' });
      expect(wrapper.text()).toContain('Add Division');
    });

    it('renders default icon (PhPlus) when no icon provided', () => {
      const wrapper = mountFooterAddButton();
      expect(wrapper.findComponent(PhPlus).exists()).toBe(true);
    });

    it('renders custom icon when provided', () => {
      const wrapper = mountFooterAddButton({ icon: PhPencil });
      expect(wrapper.findComponent(PhPencil).exists()).toBe(true);
      expect(wrapper.findComponent(PhPlus).exists()).toBe(false);
    });

    it('applies default variant class by default', () => {
      const wrapper = mountFooterAddButton();
      expect(wrapper.find('button').classes()).toContain('footer-add-button');
      expect(wrapper.find('button').classes()).toContain('footer-add-button--default');
      expect(wrapper.find('button').classes()).not.toContain('footer-add-button--elevated');
    });

    it('applies elevated variant class when specified', () => {
      const wrapper = mountFooterAddButton({ variant: 'elevated' });
      expect(wrapper.find('button').classes()).toContain('footer-add-button');
      expect(wrapper.find('button').classes()).toContain('footer-add-button--elevated');
      expect(wrapper.find('button').classes()).not.toContain('footer-add-button--default');
    });

    it('has wrapper class for margin', () => {
      const wrapper = mountFooterAddButton();
      expect(wrapper.find('div').classes()).toContain('footer-add-button-wrapper');
    });

    it('renders button with footer-add-button base class', () => {
      const wrapper = mountFooterAddButton();
      const button = wrapper.find('button');
      expect(button.classes()).toContain('footer-add-button');
    });
  });

  describe('Icon Configuration', () => {
    it('renders icon with size 14', () => {
      const wrapper = mountFooterAddButton();
      const icon = wrapper.findComponent(PhPlus);
      expect(icon.props('size')).toBe(14);
    });

    it('renders icon with bold weight', () => {
      const wrapper = mountFooterAddButton();
      const icon = wrapper.findComponent(PhPlus);
      expect(icon.props('weight')).toBe('bold');
    });

    it('applies icon class', () => {
      const wrapper = mountFooterAddButton();
      const icon = wrapper.findComponent(PhPlus);
      expect(icon.classes()).toContain('footer-add-button__icon');
    });
  });

  describe('Label Styling', () => {
    it('applies label class', () => {
      const wrapper = mountFooterAddButton({ label: 'Add Team' });
      const span = wrapper.find('span');
      expect(span.classes()).toContain('footer-add-button__label');
    });

    it('displays the correct label text', () => {
      const wrapper = mountFooterAddButton({ label: 'Add Team' });
      const span = wrapper.find('span');
      expect(span.text()).toBe('Add Team');
    });
  });

  describe('Interactive Behavior', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mountFooterAddButton();
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('does not emit click when disabled', async () => {
      const wrapper = mountFooterAddButton({ disabled: true });
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('stops event propagation with click.stop', async () => {
      const wrapper = mountFooterAddButton();
      const button = wrapper.find('button');

      let propagated = false;
      wrapper.element.addEventListener('click', () => {
        propagated = true;
      });

      await button.trigger('click');

      // The event should not propagate due to @click.stop
      expect(propagated).toBe(false);
    });

    it('applies disabled attribute when disabled', () => {
      const wrapper = mountFooterAddButton({ disabled: true });
      expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    });

    it('does not apply disabled attribute when enabled', () => {
      const wrapper = mountFooterAddButton({ disabled: false });
      expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
    });
  });

  describe('Disabled State Styling', () => {
    it('applies disabled class when disabled', () => {
      const wrapper = mountFooterAddButton({ disabled: true });
      const button = wrapper.find('button');
      expect(button.classes()).toContain('footer-add-button--disabled');
    });

    it('does not apply disabled class when enabled', () => {
      const wrapper = mountFooterAddButton({ disabled: false });
      const button = wrapper.find('button');
      expect(button.classes()).not.toContain('footer-add-button--disabled');
    });
  });

  describe('Button Type', () => {
    it('renders as type button', () => {
      const wrapper = mountFooterAddButton();
      expect(wrapper.find('button').attributes('type')).toBe('button');
    });
  });

  describe('Props Validation', () => {
    it('renders with all props specified', () => {
      const wrapper = mountFooterAddButton({
        label: 'Custom Label',
        icon: PhPencil,
        disabled: true,
        variant: 'elevated',
      });

      expect(wrapper.text()).toContain('Custom Label');
      expect(wrapper.findComponent(PhPencil).exists()).toBe(true);
      expect(wrapper.find('button').attributes('disabled')).toBeDefined();
      expect(wrapper.find('button').classes()).toContain('footer-add-button--elevated');
      expect(wrapper.find('button').classes()).toContain('footer-add-button--disabled');
    });
  });
});
