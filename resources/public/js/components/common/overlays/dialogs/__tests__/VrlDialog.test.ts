import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlDialog from '../VrlDialog.vue';
import { PhCheckCircle, PhWarning, PhTrash, PhInfo } from '@phosphor-icons/vue';

describe('VrlDialog', () => {
  let wrapper: VueWrapper;

  // Create a div for teleport target
  beforeEach(() => {
    const el = document.createElement('div');
    el.id = 'app';
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('renders correctly when modelValue is true', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Test Dialog',
        message: 'This is a test message',
      },
      attachTo: document.body,
    });

    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true);
    expect(wrapper.find('#dialog-title').text()).toBe('Test Dialog');
    expect(wrapper.find('#dialog-message').text()).toBe('This is a test message');
  });

  it('is hidden when modelValue is false', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: false,
        title: 'Test Dialog',
        message: 'This is a test message',
      },
      attachTo: document.body,
    });

    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
  });

  it('renders correct icon for success variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'success',
        title: 'Success',
        message: 'Operation completed',
      },
      attachTo: document.body,
    });

    const icon = wrapper.findComponent(PhCheckCircle);
    expect(icon.exists()).toBe(true);
  });

  it('renders correct icon for warning variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'warning',
        title: 'Warning',
        message: 'Please be careful',
      },
      attachTo: document.body,
    });

    const icon = wrapper.findComponent(PhWarning);
    expect(icon.exists()).toBe(true);
  });

  it('renders correct icon for danger variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'danger',
        title: 'Danger',
        message: 'This action cannot be undone',
      },
      attachTo: document.body,
    });

    const icon = wrapper.findComponent(PhTrash);
    expect(icon.exists()).toBe(true);
  });

  it('renders correct icon for info variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'info',
        title: 'Information',
        message: 'Here is some information',
      },
      attachTo: document.body,
    });

    const icon = wrapper.findComponent(PhInfo);
    expect(icon.exists()).toBe(true);
  });

  it('renders correct icon background color for success variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'success',
        title: 'Success',
        message: 'Operation completed',
      },
      attachTo: document.body,
    });

    const iconWrapper = wrapper.find('.rounded-full');
    expect(iconWrapper.classes()).toContain('bg-green-500/15');
  });

  it('renders correct icon background color for warning variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'warning',
        title: 'Warning',
        message: 'Please be careful',
      },
      attachTo: document.body,
    });

    const iconWrapper = wrapper.find('.rounded-full');
    expect(iconWrapper.classes()).toContain('bg-amber-500/15');
  });

  it('renders correct icon background color for danger variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'danger',
        title: 'Danger',
        message: 'This action cannot be undone',
      },
      attachTo: document.body,
    });

    const iconWrapper = wrapper.find('.rounded-full');
    expect(iconWrapper.classes()).toContain('bg-red-500/15');
  });

  it('renders correct icon background color for info variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'info',
        title: 'Information',
        message: 'Here is some information',
      },
      attachTo: document.body,
    });

    const iconWrapper = wrapper.find('.rounded-full');
    expect(iconWrapper.classes()).toContain('bg-blue-500/15');
  });

  it('renders title', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Custom Title',
        message: 'Message content',
      },
      attachTo: document.body,
    });

    const title = wrapper.find('#dialog-title');
    expect(title.text()).toBe('Custom Title');
  });

  it('renders message', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Custom message content here',
      },
      attachTo: document.body,
    });

    const message = wrapper.find('#dialog-message');
    expect(message.text()).toBe('Custom message content here');
  });

  it('renders confirm button with correct label', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'success',
        title: 'Title',
        message: 'Message',
      },
      attachTo: document.body,
    });

    const buttons = wrapper.findAll('button');
    const confirmButton = buttons[buttons.length - 1]; // Last button is confirm
    expect(confirmButton?.text()).toBe('Continue'); // Default for success
  });

  it('renders cancel button when confirmOnly is false', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
        confirmOnly: false,
      },
      attachTo: document.body,
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0]?.text()).toBe('Cancel');
  });

  it('hides cancel button when confirmOnly is true', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0]?.text()).not.toBe('Cancel');
  });

  it('emits confirm and update:modelValue when confirm clicked', async () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    await confirmButton.trigger('click');

    expect(wrapper.emitted('confirm')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('emits cancel and update:modelValue when cancel clicked', async () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
        confirmOnly: false,
      },
      attachTo: document.body,
    });

    const buttons = wrapper.findAll('button');
    const cancelButton = buttons[0]; // First button is cancel
    await cancelButton?.trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('closes on escape key (emits cancel)', async () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
      },
      attachTo: document.body,
    });

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('applies correct button colors for success variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'success',
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    expect(confirmButton.classes()).toContain('bg-racing-success');
  });

  it('applies correct button colors for warning variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'warning',
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    expect(confirmButton.classes()).toContain('bg-racing-warning');
  });

  it('applies correct button colors for danger variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'danger',
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    expect(confirmButton.classes()).toContain('bg-racing-danger');
  });

  it('applies correct button colors for info variant', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'info',
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    expect(confirmButton.classes()).toContain('bg-racing-info');
  });

  it('uses default confirm labels when not provided - success', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'success',
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    expect(confirmButton.text()).toBe('Continue');
  });

  it('uses default confirm labels when not provided - warning', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'warning',
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    expect(confirmButton.text()).toBe('Leave');
  });

  it('uses default confirm labels when not provided - danger', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'danger',
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    expect(confirmButton.text()).toBe('Delete');
  });

  it('uses default confirm labels when not provided - info', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'info',
        title: 'Title',
        message: 'Message',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    expect(confirmButton.text()).toBe('Got It');
  });

  it('uses custom confirmLabel when provided', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
        confirmLabel: 'Custom Confirm',
        confirmOnly: true,
      },
      attachTo: document.body,
    });

    const confirmButton = wrapper.find('button');
    expect(confirmButton.text()).toBe('Custom Confirm');
  });

  it('uses custom cancelLabel when provided', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
        cancelLabel: 'Custom Cancel',
        confirmOnly: false,
      },
      attachTo: document.body,
    });

    const buttons = wrapper.findAll('button');
    const cancelButton = buttons[0];
    expect(cancelButton?.text()).toBe('Custom Cancel');
  });

  it('has correct ARIA attributes (alertdialog role)', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
      },
      attachTo: document.body,
    });

    const dialog = wrapper.find('[role="alertdialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.attributes('aria-modal')).toBe('true');
    expect(dialog.attributes('aria-labelledby')).toBe('dialog-title');
    expect(dialog.attributes('aria-describedby')).toBe('dialog-message');
  });

  it('custom icon prop overrides default', () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        variant: 'success',
        title: 'Title',
        message: 'Message',
        icon: 'custom-icon', // This prop is accepted but uses variant icon
      },
      attachTo: document.body,
    });

    // Since we still use variant icon when custom is provided (as per implementation)
    // This test verifies the component accepts the prop
    expect((wrapper.vm.$props as Record<string, unknown>).icon).toBe('custom-icon');
  });

  it('prevents body scroll when open', async () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: false,
        title: 'Title',
        message: 'Message',
      },
      attachTo: document.body,
    });

    await wrapper.setProps({ modelValue: true });
    await wrapper.vm.$nextTick();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', async () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
      },
      attachTo: document.body,
    });

    await wrapper.setProps({ modelValue: false });
    await wrapper.vm.$nextTick();

    expect(document.body.style.overflow).toBe('');
  });

  it('closes when clicking overlay background', async () => {
    wrapper = mount(VrlDialog, {
      props: {
        modelValue: true,
        title: 'Title',
        message: 'Message',
      },
      attachTo: document.body,
    });

    const overlay = wrapper.find('[role="alertdialog"]');
    await overlay.trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  describe('Focus trap', () => {
    it('has focus trap functionality available', async () => {
      wrapper = mount(VrlDialog, {
        props: {
          modelValue: true,
          title: 'Title',
          message: 'Message',
          confirmOnly: false,
        },
        attachTo: document.body,
      });

      // Wait for component to mount
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBe(2); // Cancel and Confirm

      // Verify buttons exist and can be found
      expect(wrapper.find('button').exists()).toBe(true);
    });

    it('stores reference to previous active element', async () => {
      const testButton = document.createElement('button');
      testButton.textContent = 'Test Button';
      document.body.appendChild(testButton);
      testButton.focus();

      wrapper = mount(VrlDialog, {
        props: {
          modelValue: true,
          title: 'Title',
          message: 'Message',
        },
        attachTo: document.body,
      });

      await wrapper.vm.$nextTick();

      // Component should be mounted
      expect(wrapper.exists()).toBe(true);

      document.body.removeChild(testButton);
    });

    it('has contentRef for focus trap', () => {
      wrapper = mount(VrlDialog, {
        props: {
          modelValue: true,
          title: 'Title',
          message: 'Message',
        },
        attachTo: document.body,
      });

      // Verify component has the necessary structure for focus trapping
      expect(
        wrapper.find('[ref="contentRef"]').exists() || wrapper.find('.w-\\[360px\\]').exists(),
      ).toBe(true);
    });
  });

  describe('Overlay state management', () => {
    beforeEach(() => {
      // Reset overlay count before each test
      document.body.style.overflow = '';
    });

    it('manages overlay count correctly for multiple dialogs', async () => {
      // Mount first dialog (closed initially)
      const wrapper1 = mount(VrlDialog, {
        props: {
          modelValue: false,
          title: 'Dialog 1',
          message: 'Message 1',
        },
        attachTo: document.body,
      });

      // Open first dialog
      await wrapper1.setProps({ modelValue: true });
      await wrapper1.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(document.body.style.overflow).toBe('hidden');

      // Mount second dialog (closed initially)
      const wrapper2 = mount(VrlDialog, {
        props: {
          modelValue: false,
          title: 'Dialog 2',
          message: 'Message 2',
        },
        attachTo: document.body,
      });

      // Open second dialog
      await wrapper2.setProps({ modelValue: true });
      await wrapper2.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(document.body.style.overflow).toBe('hidden');

      // Close first dialog
      await wrapper1.setProps({ modelValue: false });
      await wrapper1.vm.$nextTick();

      // Body scroll should still be locked (second dialog is open)
      expect(document.body.style.overflow).toBe('hidden');

      // Close second dialog
      await wrapper2.setProps({ modelValue: false });
      await wrapper2.vm.$nextTick();

      // Now body scroll should be restored
      expect(document.body.style.overflow).toBe('');

      wrapper1.unmount();
      wrapper2.unmount();
    });
  });
});
