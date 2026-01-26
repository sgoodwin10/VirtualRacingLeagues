import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlConfirmDialog from '../VrlConfirmDialog.vue';
import { PhWarning } from '@phosphor-icons/vue';
import { Button } from '@app/components/common/buttons';
import { DialogStub } from '@app/__tests__/setup/primevueStubs';

describe('VrlConfirmDialog', () => {
  const defaultProps = {
    visible: true,
    header: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  const mountOptions = {
    global: {
      stubs: {
        Dialog: DialogStub,
      },
    },
  };

  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.findComponent(DialogStub).exists()).toBe(true);
    });

    it('renders header text correctly', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      expect(wrapper.text()).toContain('Confirm Action');
    });

    it('renders message correctly', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      expect(wrapper.text()).toContain('Are you sure you want to proceed?');
    });

    it('renders icon when provided', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          icon: PhWarning,
        },
        ...mountOptions,
      });

      // Check if the icon component is rendered
      const iconWrapper = wrapper.findComponent(PhWarning);
      expect(iconWrapper.exists()).toBe(true);
    });

    it('does not render icon when not provided', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      const iconWrapper = wrapper.findComponent(PhWarning);
      expect(iconWrapper.exists()).toBe(false);
    });

    it('renders custom accept and reject labels', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          acceptLabel: 'Delete',
          rejectLabel: 'Keep',
        },
        ...mountOptions,
      });

      expect(wrapper.text()).toContain('Delete');
      expect(wrapper.text()).toContain('Keep');
    });

    it('renders default button labels', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      expect(wrapper.text()).toContain('Confirm');
      expect(wrapper.text()).toContain('Cancel');
    });
  });

  describe('Visibility', () => {
    it('passes visible prop to Dialog', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          visible: true,
        },
        ...mountOptions,
      });

      const dialog = wrapper.findComponent(DialogStub);
      expect(dialog.props('visible')).toBe(true);
    });

    it('emits update:visible when visibility changes', async () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      const dialog = wrapper.findComponent(DialogStub);
      await dialog.vm.$emit('update:visible', false);

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('emits hide event when dialog is hidden', async () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      const dialog = wrapper.findComponent(DialogStub);
      await dialog.vm.$emit('hide');

      expect(wrapper.emitted('hide')).toBeTruthy();
    });
  });

  describe('Button Actions', () => {
    it('emits accept event when confirm button is clicked', async () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      const buttons = wrapper.findAllComponents(Button);
      const acceptButton = buttons[1]; // Second button is accept

      await acceptButton.vm.$emit('click');

      expect(wrapper.emitted('accept')).toBeTruthy();
    });

    it('emits reject event when cancel button is clicked', async () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      const buttons = wrapper.findAllComponents(Button);
      const rejectButton = buttons[0]; // First button is reject

      await rejectButton.vm.$emit('click');

      expect(wrapper.emitted('reject')).toBeTruthy();
    });

    it('closes dialog when reject button is clicked', async () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        ...mountOptions,
      });

      const buttons = wrapper.findAllComponents(Button);
      const rejectButton = buttons[0];

      await rejectButton.vm.$emit('click');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('does not emit accept when disabled', async () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          disabled: true,
        },
        ...mountOptions,
      });

      const buttons = wrapper.findAllComponents(Button);
      const acceptButton = buttons[1];

      await acceptButton.vm.$emit('click');

      expect(wrapper.emitted('accept')).toBeFalsy();
    });

    it('does not emit reject when disabled', async () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          disabled: true,
        },
        ...mountOptions,
      });

      const buttons = wrapper.findAllComponents(Button);
      const rejectButton = buttons[0];

      await rejectButton.vm.$emit('click');

      expect(wrapper.emitted('reject')).toBeFalsy();
    });

    it('does not emit accept when loading', async () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          loading: true,
        },
        ...mountOptions,
      });

      const buttons = wrapper.findAllComponents(Button);
      const acceptButton = buttons[1];

      await acceptButton.vm.$emit('click');

      expect(wrapper.emitted('accept')).toBeFalsy();
    });
  });

  describe('Button States', () => {
    it('passes loading state to accept button', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          loading: true,
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const acceptButton = buttons[1];

      expect(acceptButton.props('loading')).toBe(true);
    });

    it('disables both buttons when disabled prop is true', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          disabled: true,
        },
      });

      const buttons = wrapper.findAllComponents(Button);

      buttons.forEach((button) => {
        expect(button.props('disabled')).toBe(true);
      });
    });

    it('disables both buttons when loading', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          loading: true,
        },
      });

      const buttons = wrapper.findAllComponents(Button);

      buttons.forEach((button) => {
        expect(button.props('disabled') || button.props('loading')).toBe(true);
      });
    });
  });

  describe('Button Variants', () => {
    it('applies custom accept button variant', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          acceptVariant: 'success',
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const acceptButton = buttons[1];

      expect(acceptButton.props('variant')).toBe('success');
    });

    it('applies custom reject button variant', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          rejectVariant: 'outline',
        },
      });

      const buttons = wrapper.findAllComponents(Button);
      const rejectButton = buttons[0];

      expect(rejectButton.props('variant')).toBe('outline');
    });

    it('uses default danger variant for accept button', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
      });

      const buttons = wrapper.findAllComponents(Button);
      const acceptButton = buttons[1];

      expect(acceptButton.props('variant')).toBe('danger');
    });

    it('uses default secondary variant for reject button', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
      });

      const buttons = wrapper.findAllComponents(Button);
      const rejectButton = buttons[0];

      expect(rejectButton.props('variant')).toBe('secondary');
    });
  });

  describe('Dialog Options', () => {
    it('passes modal prop to Dialog', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          modal: false,
        },
      });

      const dialog = wrapper.findComponent(DialogStub);
      expect(dialog.props('modal')).toBe(false);
    });

    it('passes closable prop to Dialog', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          closable: false,
        },
      });

      const dialog = wrapper.findComponent(DialogStub);
      expect(dialog.props('closable')).toBe(false);
    });

    it('passes dismissableMask prop to Dialog', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          dismissableMask: true,
        },
      });

      const dialog = wrapper.findComponent(DialogStub);
      expect(dialog.props('dismissableMask')).toBe(true);
    });
  });

  describe('Slots', () => {
    it('renders custom header slot', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        slots: {
          header: '<div class="custom-header">Custom Header</div>',
        },
      });

      expect(wrapper.html()).toContain('Custom Header');
    });

    it('renders custom content slot', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          message: undefined,
        },
        slots: {
          default: '<div class="custom-content">Custom Content</div>',
        },
      });

      expect(wrapper.html()).toContain('Custom Content');
    });

    it('renders custom footer slot', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: defaultProps,
        slots: {
          footer: '<div class="custom-footer">Custom Footer</div>',
        },
      });

      expect(wrapper.html()).toContain('Custom Footer');
    });
  });

  describe('Icon Styling', () => {
    it('applies custom icon color', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          icon: PhWarning,
          iconColor: '#ff0000',
        },
      });

      const iconContainer = wrapper.find('.flex.items-center.justify-center');
      expect(iconContainer.attributes('style')).toContain('border-color: #ff0000');
    });

    it('applies custom icon background color', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          icon: PhWarning,
          iconBgColor: '#00ff00',
        },
      });

      const iconContainer = wrapper.find('.flex.items-center.justify-center');
      expect(iconContainer.attributes('style')).toContain('background-color: #00ff00');
    });

    it('uses default icon colors when not provided', () => {
      const wrapper = mount(VrlConfirmDialog, {
        ...mountOptions,
        props: {
          ...defaultProps,
          icon: PhWarning,
        },
      });

      const iconContainer = wrapper.find('.flex.items-center.justify-center');
      expect(iconContainer.attributes('style')).toContain('var(--orange)');
    });
  });
});
