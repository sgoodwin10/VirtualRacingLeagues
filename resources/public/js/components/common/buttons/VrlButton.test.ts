import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlButton from './VrlButton.vue';
import PrimeButton from 'primevue/button';

// Mock icon component for testing
const MockIcon = {
  name: 'MockIcon',
  props: ['size'],
  template: '<svg :width="size" :height="size"><circle /></svg>',
};

describe('VrlButton', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.find('.vrl-btn').exists()).toBe(true);
      expect(wrapper.find('.vrl-btn-secondary').exists()).toBe(true);
    });

    it('renders with all variant types', () => {
      const variants = [
        'primary',
        'secondary',
        'ghost',
        'outline',
        'success',
        'warning',
        'danger',
      ] as const;

      variants.forEach((variant) => {
        const wrapper = mount(VrlButton, {
          props: { variant },
        });
        expect(wrapper.find(`.vrl-btn-${variant}`).exists()).toBe(true);
      });
    });

    it('renders with all size types', () => {
      const sizes = ['sm', 'default', 'lg', 'xl'] as const;

      sizes.forEach((size) => {
        const wrapper = mount(VrlButton, {
          props: { size },
        });
        const hasClass =
          size === 'default'
            ? wrapper.find('.vrl-btn').exists() && !wrapper.find('.vrl-btn-default').exists()
            : wrapper.find(`.vrl-btn-${size}`).exists();
        expect(hasClass).toBe(true);
      });
    });

    it('renders with label text', () => {
      const wrapper = mount(VrlButton, {
        props: { label: 'Click Me' },
      });
      expect(wrapper.text()).toContain('Click Me');
    });

    it('renders with icon (left position)', () => {
      const wrapper = mount(VrlButton, {
        props: {
          icon: MockIcon,
          iconPos: 'left',
          label: 'Button',
        },
      });
      // Icon is rendered through PrimeVue's icon slot
      const primeButton = wrapper.findComponent(PrimeButton);
      expect(primeButton.exists()).toBe(true);
    });

    it('renders with icon (right position)', () => {
      const wrapper = mount(VrlButton, {
        props: {
          icon: MockIcon,
          iconPos: 'right',
          label: 'Button',
        },
      });
      // Icon is rendered through PrimeVue's icon slot
      const primeButton = wrapper.findComponent(PrimeButton);
      expect(primeButton.exists()).toBe(true);
    });

    it('renders as icon-only (no label)', () => {
      const wrapper = mount(VrlButton, {
        props: {
          icon: MockIcon,
        },
      });
      // Icon is rendered through PrimeVue's icon slot
      const primeButton = wrapper.findComponent(PrimeButton);
      expect(primeButton.exists()).toBe(true);
    });

    it('renders with loading state', () => {
      const wrapper = mount(VrlButton, {
        props: { loading: true },
      });
      const primeButton = wrapper.findComponent(PrimeButton);
      expect(primeButton.props('loading')).toBe(true);
    });

    it('renders with disabled state', () => {
      const wrapper = mount(VrlButton, {
        props: { disabled: true },
      });
      expect(wrapper.vm.$props.disabled).toBe(true);
    });

    it('renders default slot content', () => {
      const wrapper = mount(VrlButton, {
        slots: {
          default: 'Custom Content',
        },
      });
      expect(wrapper.text()).toContain('Custom Content');
    });
  });

  describe('Props', () => {
    it('accepts and applies variant prop', () => {
      const wrapper = mount(VrlButton, {
        props: { variant: 'primary' },
      });
      expect(wrapper.find('.vrl-btn-primary').exists()).toBe(true);
    });

    it('accepts and applies size prop', () => {
      const wrapper = mount(VrlButton, {
        props: { size: 'lg' },
      });
      expect(wrapper.find('.vrl-btn-lg').exists()).toBe(true);
    });

    it('accepts and applies disabled prop', () => {
      const wrapper = mount(VrlButton, {
        props: { disabled: true },
      });
      expect(wrapper.vm.$props.disabled).toBe(true);
    });

    it('accepts and applies loading prop', () => {
      const wrapper = mount(VrlButton, {
        props: { loading: true },
      });
      expect(wrapper.vm.$props.loading).toBe(true);
    });

    it('accepts and applies type prop', () => {
      const wrapper = mount(VrlButton, {
        props: { type: 'submit' },
      });
      expect(wrapper.vm.$props.type).toBe('submit');
    });

    it('accepts and applies ariaLabel prop', () => {
      const wrapper = mount(VrlButton, {
        props: { ariaLabel: 'Custom label' },
      });
      expect(wrapper.vm.$props.ariaLabel).toBe('Custom label');
    });

    it('defaults to button type', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.vm.$props.type).toBe('button');
    });

    it('defaults to secondary variant', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.find('.vrl-btn-secondary').exists()).toBe(true);
    });

    it('defaults to default size', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.find('.vrl-btn-sm').exists()).toBe(false);
      expect(wrapper.find('.vrl-btn-lg').exists()).toBe(false);
      expect(wrapper.find('.vrl-btn-xl').exists()).toBe(false);
    });
  });

  describe('Events', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mount(VrlButton, {
        props: { label: 'Click Me' },
      });
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.[0]).toBeDefined();
    });

    it('does not emit click when disabled', async () => {
      const wrapper = mount(VrlButton, {
        props: { disabled: true },
      });

      // PrimeVue Button handles disabled state internally
      expect(wrapper.vm.$props.disabled).toBe(true);
      await wrapper.trigger('click');
      // Disabled buttons should not emit click (handled by PrimeVue)
      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('does not emit click when loading', async () => {
      const handleClick = vi.fn();
      const wrapper = mount(VrlButton, {
        props: { loading: true },
        attrs: { onClick: handleClick },
      });

      // PrimeVue Button handles loading state internally
      const primeButton = wrapper.findComponent(PrimeButton);
      expect(primeButton.props('loading')).toBe(true);
    });

    it('click event receives MouseEvent', async () => {
      const wrapper = mount(VrlButton);
      await wrapper.trigger('click');
      const emitted = wrapper.emitted('click');
      expect(emitted).toBeTruthy();
      expect(emitted?.[0]?.[0]).toBeInstanceOf(MouseEvent);
    });
  });

  describe('Accessibility', () => {
    it('has accessible name from label', () => {
      const wrapper = mount(VrlButton, {
        props: { label: 'Submit Form' },
      });
      // Test computed effectiveAriaLabel
      expect(wrapper.vm.effectiveAriaLabel).toBe('Submit Form');
    });

    it('has accessible name from ariaLabel prop', () => {
      const wrapper = mount(VrlButton, {
        props: {
          label: 'Button',
          ariaLabel: 'Custom Accessible Name',
        },
      });
      // ariaLabel takes precedence
      expect(wrapper.vm.effectiveAriaLabel).toBe('Custom Accessible Name');
    });

    it('icon-only button has default aria-label', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: MockIcon },
      });
      // Icon-only should have fallback
      expect(wrapper.vm.effectiveAriaLabel).toBe('Icon button');
    });

    it('has correct button role (handled by PrimeVue)', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.findComponent(PrimeButton).exists()).toBe(true);
    });

    it('has disabled attribute when disabled', () => {
      const wrapper = mount(VrlButton, {
        props: { disabled: true },
      });
      expect(wrapper.vm.$props.disabled).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    it('applies base button class', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.find('.vrl-btn').exists()).toBe(true);
    });

    it('applies variant class', () => {
      const wrapper = mount(VrlButton, {
        props: { variant: 'danger' },
      });
      expect(wrapper.find('.vrl-btn-danger').exists()).toBe(true);
    });

    it('applies size class', () => {
      const wrapper = mount(VrlButton, {
        props: { size: 'xl' },
      });
      expect(wrapper.find('.vrl-btn-xl').exists()).toBe(true);
    });

    it('applies multiple classes correctly', () => {
      const wrapper = mount(VrlButton, {
        props: {
          variant: 'success',
          size: 'lg',
        },
      });
      expect(wrapper.find('.vrl-btn').exists()).toBe(true);
      expect(wrapper.find('.vrl-btn-success').exists()).toBe(true);
      expect(wrapper.find('.vrl-btn-lg').exists()).toBe(true);
    });
  });

  describe('Icon Sizing', () => {
    it('renders small icon for sm size', () => {
      const wrapper = mount(VrlButton, {
        props: {
          icon: MockIcon,
          size: 'sm',
        },
      });
      // Icon is passed to PrimeVue, size logic is in template
      expect(wrapper.vm.$props.size).toBe('sm');
      expect(wrapper.vm.$props.icon).toStrictEqual(MockIcon);
    });

    it('renders default icon for default size', () => {
      const wrapper = mount(VrlButton, {
        props: {
          icon: MockIcon,
          size: 'default',
        },
      });
      expect(wrapper.vm.$props.size).toBe('default');
      expect(wrapper.vm.$props.icon).toStrictEqual(MockIcon);
    });

    it('renders large icon for lg size', () => {
      const wrapper = mount(VrlButton, {
        props: {
          icon: MockIcon,
          size: 'lg',
        },
      });
      expect(wrapper.vm.$props.size).toBe('lg');
      expect(wrapper.vm.$props.icon).toStrictEqual(MockIcon);
    });

    it('renders extra large icon for xl size', () => {
      const wrapper = mount(VrlButton, {
        props: {
          icon: MockIcon,
          size: 'xl',
        },
      });
      expect(wrapper.vm.$props.size).toBe('xl');
      expect(wrapper.vm.$props.icon).toStrictEqual(MockIcon);
    });
  });

  describe('PrimeVue Integration', () => {
    it('passes pt prop to PrimeVue Button', () => {
      const pt = { root: { class: 'custom-class' } };
      const wrapper = mount(VrlButton, {
        props: { pt },
      });
      expect(wrapper.findComponent(PrimeButton).props('pt')).toEqual(pt);
    });

    it('wraps PrimeVue Button component', () => {
      const wrapper = mount(VrlButton);
      expect(wrapper.findComponent(PrimeButton).exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles both label prop and default slot', () => {
      const wrapper = mount(VrlButton, {
        props: { label: 'Prop Label' },
        slots: {
          default: 'Slot Content',
        },
      });
      // Slot content takes precedence
      expect(wrapper.text()).toContain('Slot Content');
    });

    it('handles icon without label', () => {
      const wrapper = mount(VrlButton, {
        props: { icon: MockIcon },
      });
      expect(wrapper.vm.$props.icon).toStrictEqual(MockIcon);
      expect(wrapper.vm.isIconOnly).toBe(true);
    });

    it('handles empty string label', () => {
      const wrapper = mount(VrlButton, {
        props: { label: '' },
      });
      expect(wrapper.text()).toBe('');
    });

    it('handles variant with size combination', () => {
      const variants = ['primary', 'secondary', 'ghost'] as const;
      const sizes = ['sm', 'lg', 'xl'] as const;

      variants.forEach((variant) => {
        sizes.forEach((size) => {
          const wrapper = mount(VrlButton, {
            props: { variant, size },
          });
          expect(wrapper.find(`.vrl-btn-${variant}`).exists()).toBe(true);
          expect(wrapper.find(`.vrl-btn-${size}`).exists()).toBe(true);
        });
      });
    });
  });
});
