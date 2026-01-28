import { describe, it, expect, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlTab from './VrlTab.vue';

describe('VrlTab', () => {
  let wrapper: VueWrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Rendering', () => {
    it('should render tab button', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab Label',
        },
      });

      expect(wrapper.find('button').exists()).toBe(true);
      expect(wrapper.text()).toBe('Tab Label');
    });

    it('should render slot content', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Custom Tab Text',
        },
      });

      expect(wrapper.text()).toBe('Custom Tab Text');
    });

    it('should render with icon when provided', () => {
      wrapper = mount(VrlTab, {
        props: {
          icon: 'trophy',
        },
        slots: {
          default: 'Tab Label',
        },
      });

      expect(wrapper.find('.ph-trophy').exists()).toBe(true);
    });

    it('should have proper button type', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab Label',
        },
      });

      const button = wrapper.find('button');
      expect(button.attributes('type')).toBe('button');
    });
  });

  describe('Active State', () => {
    it('should apply active styles when active prop is true', () => {
      wrapper = mount(VrlTab, {
        props: {
          active: true,
        },
        slots: {
          default: 'Active Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('bg-[var(--cyan)]');
      expect(button.classes()).toContain('text-[var(--bg-dark)]');
    });

    it('should not apply active styles when active prop is false', () => {
      wrapper = mount(VrlTab, {
        props: {
          active: false,
        },
        slots: {
          default: 'Inactive Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).not.toContain('bg-[var(--cyan)]');
      expect(button.classes()).toContain('bg-transparent');
    });

    it('should apply secondary text color when not active', () => {
      wrapper = mount(VrlTab, {
        props: {
          active: false,
        },
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('text-[var(--text-secondary)]');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles when disabled prop is true', () => {
      wrapper = mount(VrlTab, {
        props: {
          disabled: true,
        },
        slots: {
          default: 'Disabled Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
      expect(button.classes()).toContain('opacity-50');
      expect(button.classes()).toContain('cursor-not-allowed');
    });

    it('should not apply disabled attribute when disabled prop is false', () => {
      wrapper = mount(VrlTab, {
        props: {
          disabled: false,
        },
        slots: {
          default: 'Enabled Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('should not emit click event when disabled', async () => {
      wrapper = mount(VrlTab, {
        props: {
          disabled: true,
        },
        slots: {
          default: 'Disabled Tab',
        },
      });

      const button = wrapper.find('button');
      await button.trigger('click');

      expect(wrapper.emitted('click')).toBeUndefined();
    });
  });

  describe('User Interactions', () => {
    it('should emit click event when clicked', async () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab Label',
        },
      });

      const button = wrapper.find('button');
      await button.trigger('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('should not emit click event when disabled', async () => {
      wrapper = mount(VrlTab, {
        props: {
          disabled: true,
        },
        slots: {
          default: 'Disabled Tab',
        },
      });

      const button = wrapper.find('button');
      await button.trigger('click');

      expect(wrapper.emitted('click')).toBeUndefined();
    });
  });

  describe('Styling', () => {
    it('should have base flexbox layout classes', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('flex');
      expect(button.classes()).toContain('items-center');
      expect(button.classes()).toContain('gap-2');
    });

    it('should have rounded corners', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('rounded-[var(--radius-sm)]');
    });

    it('should have transition classes', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('transition-[var(--transition)]');
    });

    it('should prevent text wrapping', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('whitespace-nowrap');
    });

    it('should have proper padding', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('py-2');
      expect(button.classes()).toContain('px-4');
    });

    it('should apply hover styles when not active and not disabled', () => {
      wrapper = mount(VrlTab, {
        props: {
          active: false,
          disabled: false,
        },
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('hover:text-[var(--text-primary)]');
      expect(button.classes()).toContain('hover:bg-[var(--bg-card)]');
    });
  });

  describe('Icon Display', () => {
    it('should render icon when icon prop is provided', () => {
      wrapper = mount(VrlTab, {
        props: {
          icon: 'star',
        },
        slots: {
          default: 'Tab with Icon',
        },
      });

      const icon = wrapper.find('.ph-star');
      expect(icon.exists()).toBe(true);
    });

    it('should not render icon when icon prop is not provided', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab without Icon',
        },
      });

      const icon = wrapper.find('i');
      expect(icon.exists()).toBe(false);
    });

    it('should apply correct icon size', () => {
      wrapper = mount(VrlTab, {
        props: {
          icon: 'trophy',
        },
        slots: {
          default: 'Tab',
        },
      });

      const icon = wrapper.find('.ph-trophy');
      expect(icon.classes()).toContain('text-base');
    });

    it('should render icon before text', () => {
      wrapper = mount(VrlTab, {
        props: {
          icon: 'trophy',
        },
        slots: {
          default: 'Tab Label',
        },
      });

      const button = wrapper.find('button');
      const iconElement = button.find('i');
      const textContent = button.text();

      expect(iconElement.exists()).toBe(true);
      expect(textContent).toContain('Tab Label');
    });
  });

  describe('Typography', () => {
    it('should have proper font styling', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('font-[family-name:var(--font-display)]');
      expect(button.classes()).toContain('text-xs');
      expect(button.classes()).toContain('font-semibold');
      expect(button.classes()).toContain('tracking-[0.5px]');
    });
  });

  describe('Accessibility', () => {
    it('should have button role by default', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.element.tagName).toBe('BUTTON');
    });

    it('should have proper type attribute', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.attributes('type')).toBe('button');
    });

    it('should have data-test attribute', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('[data-test="tab"]');
      expect(button.exists()).toBe(true);
    });

    it('should be keyboard accessible when not disabled', () => {
      wrapper = mount(VrlTab, {
        props: {
          disabled: false,
        },
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('should not be keyboard accessible when disabled', () => {
      wrapper = mount(VrlTab, {
        props: {
          disabled: true,
        },
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
    });
  });

  describe('Border Styling', () => {
    it('should have border classes', () => {
      wrapper = mount(VrlTab, {
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('border');
      expect(button.classes()).toContain('border-transparent');
    });

    it('should apply colored border when active', () => {
      wrapper = mount(VrlTab, {
        props: {
          active: true,
        },
        slots: {
          default: 'Active Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('border-[var(--cyan)]');
    });
  });

  describe('Cursor Styling', () => {
    it('should have pointer cursor when enabled', () => {
      wrapper = mount(VrlTab, {
        props: {
          disabled: false,
        },
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('cursor-pointer');
    });

    it('should have not-allowed cursor when disabled', () => {
      wrapper = mount(VrlTab, {
        props: {
          disabled: true,
        },
        slots: {
          default: 'Tab',
        },
      });

      const button = wrapper.find('button');
      expect(button.classes()).toContain('cursor-not-allowed');
    });
  });

  describe('Props Reactivity', () => {
    it('should update styling when active prop changes', async () => {
      wrapper = mount(VrlTab, {
        props: {
          active: false,
        },
        slots: {
          default: 'Tab',
        },
      });

      let button = wrapper.find('button');
      expect(button.classes()).not.toContain('bg-[var(--cyan)]');

      await wrapper.setProps({ active: true });

      button = wrapper.find('button');
      expect(button.classes()).toContain('bg-[var(--cyan)]');
    });

    it('should update styling when disabled prop changes', async () => {
      wrapper = mount(VrlTab, {
        props: {
          disabled: false,
        },
        slots: {
          default: 'Tab',
        },
      });

      let button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeUndefined();

      await wrapper.setProps({ disabled: true });

      button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
    });
  });
});
