import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlIconButton from './VrlIconButton.vue';
import VrlButton from './VrlButton.vue';

// Mock icon component for testing
const MockIcon = {
  name: 'MockIcon',
  props: ['size'],
  template: '<svg :width="size" :height="size"><circle /></svg>',
};

// Mock tooltip directive
const tooltipDirective = {
  beforeMount: () => {},
  mounted: () => {},
  updated: () => {},
};

describe('VrlIconButton', () => {
  // Spy on console.warn for accessibility tests
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('Rendering', () => {
    it('renders with required icon prop', () => {
      const wrapper = mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
          ariaLabel: 'Test Icon',
        },
      });
      expect(wrapper.findComponent(VrlButton).exists()).toBe(true);
    });

    it('applies vrl-btn-icon class', () => {
      const wrapper = mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
          ariaLabel: 'Test',
        },
      });
      const vrlButton = wrapper.findComponent(VrlButton);
      expect(vrlButton.classes()).toContain('vrl-btn-icon');
    });
  });

  describe('Props', () => {
    it('forwards variant prop to VrlButton', () => {
      const wrapper = mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
          variant: 'primary',
          ariaLabel: 'Test',
        },
      });
      const vrlButton = wrapper.findComponent(VrlButton);
      expect(vrlButton.props('variant')).toBe('primary');
    });

    it('forwards size prop to VrlButton', () => {
      const wrapper = mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
          size: 'lg',
          ariaLabel: 'Test',
        },
      });
      const vrlButton = wrapper.findComponent(VrlButton);
      expect(vrlButton.props('size')).toBe('lg');
    });

    it('forwards disabled prop to VrlButton', () => {
      const wrapper = mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
          disabled: true,
          ariaLabel: 'Test',
        },
      });
      const vrlButton = wrapper.findComponent(VrlButton);
      expect(vrlButton.props('disabled')).toBe(true);
    });
  });

  describe('Events', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
          ariaLabel: 'Test',
        },
      });
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has aria-label from ariaLabel prop', () => {
      const wrapper = mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
          ariaLabel: 'Close Dialog',
        },
      });
      const vrlButton = wrapper.findComponent(VrlButton);
      expect(vrlButton.props('ariaLabel')).toBe('Close Dialog');
    });

    it('uses tooltip as aria-label when ariaLabel not provided', () => {
      const wrapper = mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
          tooltip: 'Settings',
        },
      });
      const vrlButton = wrapper.findComponent(VrlButton);
      expect(vrlButton.props('ariaLabel')).toBe('Settings');
    });

    it('warns when neither tooltip nor ariaLabel is provided', () => {
      mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
        },
      });
      // Find the VrlIconButton warning (not Vue warnings)
      const vrlWarning = consoleWarnSpy.mock.calls.find((call: unknown[]) =>
        String(call[0]).includes('[VrlIconButton]'),
      );
      expect(vrlWarning).toBeDefined();
      expect(String(vrlWarning?.[0])).toContain('tooltip');
      expect(String(vrlWarning?.[0])).toContain('ariaLabel');
    });
  });

  describe('VrlButton Integration', () => {
    it('wraps VrlButton component', () => {
      const wrapper = mount(VrlIconButton, {
        global: { directives: { tooltip: tooltipDirective } },
        props: {
          icon: MockIcon,
          ariaLabel: 'Test',
        },
      });
      expect(wrapper.findComponent(VrlButton).exists()).toBe(true);
    });
  });
});
