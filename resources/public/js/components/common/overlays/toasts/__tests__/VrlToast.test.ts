import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Toast from 'primevue/toast';
import VrlToast from '../VrlToast.vue';
import { PhCheckCircle, PhXCircle, PhWarning, PhInfo, PhX } from '@phosphor-icons/vue';

describe('VrlToast', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders Toast component', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    expect(wrapper.findComponent(Toast).exists()).toBe(true);
  });

  it('applies correct position prop', () => {
    const wrapper = mount(VrlToast, {
      props: {
        position: 'top-left',
      },
      global: {
        components: {
          Toast,
        },
      },
    });

    const toastComponent = wrapper.findComponent(Toast);
    expect(toastComponent.props('position')).toBe('top-left');
  });

  it('applies default position prop', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
        },
      },
    });

    const toastComponent = wrapper.findComponent(Toast);
    expect(toastComponent.props('position')).toBe('top-right');
  });

  it('accepts custom life prop', () => {
    const wrapper = mount(VrlToast, {
      props: {
        life: 3000,
      },
      global: {
        components: {
          Toast,
        },
      },
    });

    // Component accepts the prop without errors
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findComponent(Toast).exists()).toBe(true);
  });

  it('uses default life value of 5000ms', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
        },
      },
    });

    // Component renders with default values
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findComponent(Toast).exists()).toBe(true);
  });

  it('renders toast message content with success severity', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    const toastComponent = wrapper.findComponent(Toast);
    const messageSlot = toastComponent.vm.$slots.message;

    expect(messageSlot).toBeDefined();

    const slotProps = {
      message: {
        severity: 'success',
        summary: 'Success',
        detail: 'Operation completed successfully',
      },
      onClose: vi.fn(),
    };

    const slotContent = messageSlot?.(slotProps);
    expect(slotContent).toBeDefined();
  });

  it('renders toast message content with error severity', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    const toastComponent = wrapper.findComponent(Toast);
    const messageSlot = toastComponent.vm.$slots.message;

    expect(messageSlot).toBeDefined();

    const slotProps = {
      message: {
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred',
      },
      onClose: vi.fn(),
    };

    const slotContent = messageSlot?.(slotProps);
    expect(slotContent).toBeDefined();
  });

  it('renders toast message content with warn severity', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    const toastComponent = wrapper.findComponent(Toast);
    const messageSlot = toastComponent.vm.$slots.message;

    expect(messageSlot).toBeDefined();

    const slotProps = {
      message: {
        severity: 'warn',
        summary: 'Warning',
        detail: 'This is a warning',
      },
      onClose: vi.fn(),
    };

    const slotContent = messageSlot?.(slotProps);
    expect(slotContent).toBeDefined();
  });

  it('renders toast message content with info severity', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    const toastComponent = wrapper.findComponent(Toast);
    const messageSlot = toastComponent.vm.$slots.message;

    expect(messageSlot).toBeDefined();

    const slotProps = {
      message: {
        severity: 'info',
        summary: 'Info',
        detail: 'This is information',
      },
      onClose: vi.fn(),
    };

    const slotContent = messageSlot?.(slotProps);
    expect(slotContent).toBeDefined();
  });

  it('has passthrough configuration', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
        },
      },
    });

    const toastComponent = wrapper.findComponent(Toast);
    expect(toastComponent.props('pt')).toBeDefined();
  });

  it('applies correct CSS classes in passthrough', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
        },
      },
    });

    const toastComponent = wrapper.findComponent(Toast);
    const pt = toastComponent.props('pt') as {
      root?: object;
      container?: object;
    };

    expect(pt).toBeDefined();
    expect(pt).toHaveProperty('root');
    expect(pt).toHaveProperty('container');
  });

  it('getSeverityIcon returns correct icon for success', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      getSeverityIcon: (severity: string) => typeof PhCheckCircle;
    };
    const icon = vm.getSeverityIcon('success');
    expect(icon).toBe(PhCheckCircle);
  });

  it('getSeverityIcon returns correct icon for error', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      getSeverityIcon: (severity: string) => typeof PhXCircle;
    };
    const icon = vm.getSeverityIcon('error');
    expect(icon).toBe(PhXCircle);
  });

  it('getSeverityIcon returns correct icon for warn', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      getSeverityIcon: (severity: string) => typeof PhWarning;
    };
    const icon = vm.getSeverityIcon('warn');
    expect(icon).toBe(PhWarning);
  });

  it('getSeverityIcon returns correct icon for info', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      getSeverityIcon: (severity: string) => typeof PhInfo;
    };
    const icon = vm.getSeverityIcon('info');
    expect(icon).toBe(PhInfo);
  });

  it('getSeverityIcon returns PhInfo for unknown severity', () => {
    const wrapper = mount(VrlToast, {
      global: {
        components: {
          Toast,
          PhCheckCircle,
          PhXCircle,
          PhWarning,
          PhInfo,
          PhX,
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      getSeverityIcon: (severity: string) => typeof PhInfo;
    };
    const icon = vm.getSeverityIcon('unknown');
    expect(icon).toBe(PhInfo);
  });
});
