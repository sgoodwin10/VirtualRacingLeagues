import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Alert from '@app/components/common/cards/Alert.vue';
import { PhCheckCircle, PhWarning, PhXCircle, PhInfo, PhRocket } from '@phosphor-icons/vue';

describe('Alert', () => {
  it('renders with required props', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test Alert',
        message: 'Test message',
      },
    });
    expect(wrapper.text()).toContain('Test Alert');
    expect(wrapper.text()).toContain('Test message');
  });

  it('applies info variant by default', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    expect(wrapper.find('.alert--info').exists()).toBe(true);
    expect(wrapper.findComponent(PhInfo).exists()).toBe(true);
  });

  it('applies all variant classes correctly', () => {
    const variants = ['success', 'warning', 'error', 'info'] as const;

    variants.forEach((variant) => {
      const wrapper = mount(Alert, {
        props: {
          title: 'Test',
          message: 'Test',
          variant,
        },
      });
      expect(wrapper.find(`.alert--${variant}`).exists()).toBe(true);
    });
  });

  it('shows correct default icon for each variant', () => {
    const variantIconMap = {
      success: PhCheckCircle,
      warning: PhWarning,
      error: PhXCircle,
      info: PhInfo,
    } as const;

    Object.entries(variantIconMap).forEach(([variant, IconComponent]) => {
      const wrapper = mount(Alert, {
        props: {
          title: 'Test',
          message: 'Test',
          variant: variant as any,
        },
      });
      expect(wrapper.findComponent(IconComponent).exists()).toBe(true);
    });
  });

  it('renders custom icon when provided', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        icon: PhRocket,
      },
    });
    expect(wrapper.findComponent(PhRocket).exists()).toBe(true);
    expect(wrapper.findComponent(PhInfo).exists()).toBe(false);
  });

  it('shows dismiss button when dismissible', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        dismissible: true,
      },
    });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('hides dismiss button when not dismissible', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        dismissible: false,
      },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('emits dismiss event when dismiss button clicked', async () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        dismissible: true,
      },
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('dismiss')).toBeTruthy();
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('does not show dismiss button by default', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders title slot content', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Default',
        message: 'Test',
      },
      slots: {
        title: '<span class="custom-title">Custom Title</span>',
      },
    });
    expect(wrapper.find('.custom-title').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default');
  });

  it('renders message slot content', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Default',
      },
      slots: {
        message: '<p class="custom-message">Custom message</p>',
      },
    });
    expect(wrapper.find('.custom-message').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Default');
  });

  it('renders default slot as message', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Default',
      },
      slots: {
        default: '<p class="custom-content">Custom content</p>',
      },
    });
    expect(wrapper.find('.custom-content').exists()).toBe(true);
  });

  it('renders icon slot content', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
      slots: {
        icon: '<svg class="custom-icon"></svg>',
      },
    });
    expect(wrapper.find('.custom-icon').exists()).toBe(true);
  });

  it('applies custom classes', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        class: 'custom-class',
      },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('has accessible role', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    expect(wrapper.attributes('role')).toBe('alert');
  });

  it('has aria-live="polite" for non-error variants', () => {
    const variants = ['success', 'warning', 'info'] as const;

    variants.forEach((variant) => {
      const wrapper = mount(Alert, {
        props: {
          title: 'Test',
          message: 'Test',
          variant,
        },
      });
      expect(wrapper.attributes('aria-live')).toBe('polite');
    });
  });

  it('has aria-live="assertive" for error variant', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        variant: 'error',
      },
    });
    expect(wrapper.attributes('aria-live')).toBe('assertive');
  });

  it('dismiss button has accessible label', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
        variant: 'warning',
        dismissible: true,
      },
    });
    const button = wrapper.find('button');
    expect(button.attributes('aria-label')).toBe('Dismiss warning alert');
  });

  it('icons are hidden from screen readers', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    const icons = wrapper.findAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('has correct layout classes', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Test',
        message: 'Test',
      },
    });
    const alert = wrapper.find('.alert');
    expect(alert.classes()).toContain('flex');
    expect(alert.classes()).toContain('items-start');
    expect(alert.classes()).toContain('gap-3');
  });
});
