import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlAlert from './VrlAlert.vue';
import { PhInfo, PhCheckCircle, PhWarning, PhXCircle } from '@phosphor-icons/vue';

// Mock icon component
const CustomIcon = {
  name: 'CustomIcon',
  template: '<svg class="custom-icon"><circle /></svg>',
};

describe('VrlAlert', () => {
  it('renders with required props', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Test Alert',
      },
    });
    expect(wrapper.find('[data-test="alert"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="alert-title"]').text()).toBe('Test Alert');
  });

  it('renders with title and message', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Alert Title',
        message: 'Alert message text',
      },
    });
    expect(wrapper.find('[data-test="alert-title"]').text()).toBe('Alert Title');
    expect(wrapper.find('[data-test="alert-message"]').text()).toBe('Alert message text');
  });

  it('applies default type (info)', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Info Alert',
      },
    });
    expect(wrapper.find('[data-test="alert"][data-type="info"]').exists()).toBe(true);
  });

  it('applies success type', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'success',
        title: 'Success Alert',
      },
    });
    expect(wrapper.find('[data-test="alert"][data-type="success"]').exists()).toBe(true);
  });

  it('applies warning type', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'warning',
        title: 'Warning Alert',
      },
    });
    expect(wrapper.find('[data-test="alert"][data-type="warning"]').exists()).toBe(true);
  });

  it('applies error type', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'error',
        title: 'Error Alert',
      },
    });
    expect(wrapper.find('[data-test="alert"][data-type="error"]').exists()).toBe(true);
  });

  it('shows default info icon', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'info',
        title: 'Info',
      },
    });
    expect(wrapper.findComponent(PhInfo).exists()).toBe(true);
  });

  it('shows default success icon', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'success',
        title: 'Success',
      },
    });
    expect(wrapper.findComponent(PhCheckCircle).exists()).toBe(true);
  });

  it('shows default warning icon', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'warning',
        title: 'Warning',
      },
    });
    expect(wrapper.findComponent(PhWarning).exists()).toBe(true);
  });

  it('shows default error icon', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'error',
        title: 'Error',
      },
    });
    expect(wrapper.findComponent(PhXCircle).exists()).toBe(true);
  });

  it('renders custom icon when provided', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Custom Icon Alert',
        icon: CustomIcon,
      },
    });
    expect(wrapper.findComponent(CustomIcon).exists()).toBe(true);
    expect(wrapper.findComponent(PhInfo).exists()).toBe(false);
  });

  it('renders icon slot content', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Alert',
      },
      slots: {
        icon: '<div class="slot-icon">🔔</div>',
      },
    });
    expect(wrapper.find('.slot-icon').exists()).toBe(true);
  });

  it('does not show dismiss button by default', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Alert',
      },
    });
    expect(wrapper.find('[data-test="alert-dismiss"]').exists()).toBe(false);
  });

  it('shows dismiss button when dismissible is true', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Dismissible Alert',
        dismissible: true,
      },
    });
    expect(wrapper.find('[data-test="alert-dismiss"]').exists()).toBe(true);
  });

  it('emits dismiss event when dismiss button clicked', async () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Alert',
        dismissible: true,
      },
    });
    await wrapper.find('[data-test="alert-dismiss"]').trigger('click');
    expect(wrapper.emitted('dismiss')).toBeTruthy();
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('renders title slot content', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Default Title',
      },
      slots: {
        title: '<strong class="custom-title">Custom Title</strong>',
      },
    });
    expect(wrapper.find('.custom-title').exists()).toBe(true);
    expect(wrapper.html()).toContain('Custom Title');
    expect(wrapper.html()).not.toContain('Default Title');
  });

  it('renders message slot content', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Title',
        message: 'Default Message',
      },
      slots: {
        message: '<p class="custom-message">Custom Message</p>',
      },
    });
    expect(wrapper.find('.custom-message').exists()).toBe(true);
    expect(wrapper.html()).toContain('Custom Message');
  });

  it('renders default slot as message', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Title',
      },
      slots: {
        default: '<p class="default-slot">Default slot content</p>',
      },
    });
    expect(wrapper.find('[data-test="alert-message"]').exists()).toBe(true);
    expect(wrapper.find('.default-slot').exists()).toBe(true);
  });

  it('does not render message container when no message or slot', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Title Only',
      },
    });
    expect(wrapper.find('[data-test="alert-message"]').exists()).toBe(false);
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Alert',
        class: 'custom-alert-class',
      },
    });
    const alert = wrapper.find('[data-test="alert"]');
    expect(alert.classes()).toContain('custom-alert-class');
  });

  it('has correct accessibility attributes', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Accessible Alert',
      },
    });
    const alert = wrapper.find('[data-test="alert"]');
    expect(alert.attributes('role')).toBe('alert');
  });

  it('has aria-live polite for info type', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'info',
        title: 'Info',
      },
    });
    expect(wrapper.find('[data-test="alert"]').attributes('aria-live')).toBe('polite');
  });

  it('has aria-live polite for success type', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'success',
        title: 'Success',
      },
    });
    expect(wrapper.find('[data-test="alert"]').attributes('aria-live')).toBe('polite');
  });

  it('has aria-live polite for warning type', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'warning',
        title: 'Warning',
      },
    });
    expect(wrapper.find('[data-test="alert"]').attributes('aria-live')).toBe('polite');
  });

  it('has aria-live assertive for error type', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'error',
        title: 'Error',
      },
    });
    expect(wrapper.find('[data-test="alert"]').attributes('aria-live')).toBe('assertive');
  });

  it('icon has aria-hidden attribute', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        title: 'Alert',
      },
    });
    expect(wrapper.find('[data-test="alert-icon"]').attributes('aria-hidden')).toBe('true');
  });

  it('dismiss button has correct aria-label for info', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'info',
        title: 'Info Alert',
        dismissible: true,
      },
    });
    expect(wrapper.find('[data-test="alert-dismiss"]').attributes('aria-label')).toBe(
      'Dismiss info alert',
    );
  });

  it('dismiss button has correct aria-label for error', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'error',
        title: 'Error Alert',
        dismissible: true,
      },
    });
    expect(wrapper.find('[data-test="alert-dismiss"]').attributes('aria-label')).toBe(
      'Dismiss error alert',
    );
  });

  it('renders complete alert with all features', () => {
    const wrapper = mount(VrlAlert, {
      props: {
        type: 'warning',
        title: 'Complete Alert',
        message: 'Alert message',
        dismissible: true,
        class: 'custom-class',
      },
    });
    expect(wrapper.find('[data-test="alert"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="alert"][data-type="warning"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="alert-icon"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="alert-title"]').text()).toBe('Complete Alert');
    expect(wrapper.find('[data-test="alert-message"]').text()).toBe('Alert message');
    expect(wrapper.find('[data-test="alert-dismiss"]').exists()).toBe(true);
    expect(wrapper.classes()).toContain('custom-class');
  });
});
