import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { h, markRaw } from 'vue';
import BaseBadge from '../BaseBadge.vue';

// Mock Phosphor icon component
const MockIcon = markRaw({
  name: 'MockIcon',
  props: ['size', 'weight'],
  render() {
    return h('svg', { class: 'mock-icon' });
  },
});

describe('BaseBadge', () => {
  describe('Rendering', () => {
    it('renders default slot content', () => {
      const wrapper = mount(BaseBadge, {
        slots: {
          default: 'Test Badge',
        },
      });

      expect(wrapper.text()).toBe('Test Badge');
    });

    it('renders with default props', () => {
      const wrapper = mount(BaseBadge, {
        slots: {
          default: 'Default',
        },
      });

      expect(wrapper.classes()).toContain('base-badge');
      expect(wrapper.classes()).toContain('base-badge--default');
      expect(wrapper.classes()).toContain('base-badge--md');
      expect(wrapper.classes()).not.toContain('base-badge--uppercase');
    });
  });

  describe('Variant Prop', () => {
    const variants = ['default', 'cyan', 'green', 'orange', 'red', 'purple'] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant correctly`, () => {
        const wrapper = mount(BaseBadge, {
          props: { variant },
          slots: {
            default: 'Badge',
          },
        });

        expect(wrapper.classes()).toContain(`base-badge--${variant}`);
      });
    });

    it('applies default variant when variant is not specified', () => {
      const wrapper = mount(BaseBadge);

      expect(wrapper.classes()).toContain('base-badge--default');
    });
  });

  describe('Size Prop', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`renders ${size} size correctly`, () => {
        const wrapper = mount(BaseBadge, {
          props: { size },
          slots: {
            default: 'Badge',
          },
        });

        expect(wrapper.classes()).toContain(`base-badge--${size}`);
      });
    });

    it('applies md size when size is not specified', () => {
      const wrapper = mount(BaseBadge);

      expect(wrapper.classes()).toContain('base-badge--md');
    });
  });

  describe('Uppercase Prop', () => {
    it('applies uppercase class when uppercase is true', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          uppercase: true,
        },
        slots: {
          default: 'Badge',
        },
      });

      expect(wrapper.classes()).toContain('base-badge--uppercase');
    });

    it('does not apply uppercase class when uppercase is false', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          uppercase: false,
        },
        slots: {
          default: 'Badge',
        },
      });

      expect(wrapper.classes()).not.toContain('base-badge--uppercase');
    });

    it('does not apply uppercase class by default', () => {
      const wrapper = mount(BaseBadge, {
        slots: {
          default: 'Badge',
        },
      });

      expect(wrapper.classes()).not.toContain('base-badge--uppercase');
    });
  });

  describe('Icon Prop', () => {
    it('renders icon when icon prop is provided', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          icon: MockIcon,
        },
        slots: {
          default: 'Badge with Icon',
        },
      });

      expect(wrapper.find('.mock-icon').exists()).toBe(true);
      expect(wrapper.find('.base-badge__icon').exists()).toBe(true);
      expect(wrapper.text()).toBe('Badge with Icon');
    });

    it('does not render icon when icon prop is not provided', () => {
      const wrapper = mount(BaseBadge, {
        slots: {
          default: 'Badge without Icon',
        },
      });

      expect(wrapper.find('.mock-icon').exists()).toBe(false);
      expect(wrapper.find('.base-badge__icon').exists()).toBe(false);
    });

    it('renders icon component with base-badge__icon class', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          icon: MockIcon,
        },
      });

      const iconWrapper = wrapper.find('.base-badge__icon');
      expect(iconWrapper.exists()).toBe(true);
    });

    it('supports icon slot override', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          icon: MockIcon,
        },
        slots: {
          icon: '<svg class="custom-icon"></svg>',
          default: 'Badge with Custom Icon',
        },
      });

      expect(wrapper.find('.custom-icon').exists()).toBe(true);
      expect(wrapper.find('.mock-icon').exists()).toBe(false);
      expect(wrapper.text()).toBe('Badge with Custom Icon');
    });
  });

  describe('Combined Props', () => {
    it('renders with custom variant, size, and uppercase', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          variant: 'cyan',
          size: 'lg',
          uppercase: true,
        },
        slots: {
          default: 'Alert',
        },
      });

      expect(wrapper.classes()).toContain('base-badge--cyan');
      expect(wrapper.classes()).toContain('base-badge--lg');
      expect(wrapper.classes()).toContain('base-badge--uppercase');
      expect(wrapper.text()).toBe('Alert');
    });

    it('renders green variant with small size', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          variant: 'green',
          size: 'sm',
        },
        slots: {
          default: 'Success',
        },
      });

      expect(wrapper.classes()).toContain('base-badge--green');
      expect(wrapper.classes()).toContain('base-badge--sm');
    });

    it('renders red variant with icon and uppercase', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          variant: 'red',
          icon: MockIcon,
          uppercase: true,
        },
        slots: {
          default: 'Error',
        },
      });

      expect(wrapper.classes()).toContain('base-badge--red');
      expect(wrapper.classes()).toContain('base-badge--uppercase');
      expect(wrapper.find('.mock-icon').exists()).toBe(true);
      expect(wrapper.text()).toBe('Error');
    });

    it('renders all props together', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          variant: 'purple',
          size: 'lg',
          uppercase: true,
          icon: MockIcon,
        },
        slots: {
          default: 'Full Badge',
        },
      });

      expect(wrapper.classes()).toContain('base-badge--purple');
      expect(wrapper.classes()).toContain('base-badge--lg');
      expect(wrapper.classes()).toContain('base-badge--uppercase');
      expect(wrapper.find('.mock-icon').exists()).toBe(true);
      expect(wrapper.text()).toBe('Full Badge');
    });
  });

  describe('HTML Structure', () => {
    it('renders as a span element', () => {
      const wrapper = mount(BaseBadge);

      expect(wrapper.element.tagName).toBe('SPAN');
    });

    it('always includes base badge class', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          variant: 'orange',
          size: 'sm',
        },
      });

      expect(wrapper.classes()).toContain('base-badge');
    });
  });

  describe('Slot Content', () => {
    it('renders complex slot content', () => {
      const wrapper = mount(BaseBadge, {
        slots: {
          default: '<strong>Bold</strong> Text',
        },
      });

      expect(wrapper.html()).toContain('<strong>Bold</strong> Text');
    });

    it('renders empty slot gracefully', () => {
      const wrapper = mount(BaseBadge);

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toBe('');
    });

    it('renders numeric content', () => {
      const wrapper = mount(BaseBadge, {
        slots: {
          default: '42',
        },
      });

      expect(wrapper.text()).toBe('42');
    });

    it('renders with icon and text content', () => {
      const wrapper = mount(BaseBadge, {
        props: {
          icon: MockIcon,
        },
        slots: {
          default: 'With Icon',
        },
      });

      expect(wrapper.find('.mock-icon').exists()).toBe(true);
      expect(wrapper.text()).toBe('With Icon');
    });
  });

  describe('CSS Classes', () => {
    it('applies all variant classes correctly', () => {
      const variants: Array<'default' | 'cyan' | 'green' | 'orange' | 'red' | 'purple'> = [
        'default',
        'cyan',
        'green',
        'orange',
        'red',
        'purple',
      ];

      variants.forEach((variant) => {
        const wrapper = mount(BaseBadge, {
          props: { variant },
        });
        expect(wrapper.classes()).toContain(`base-badge--${variant}`);
      });
    });

    it('applies all size classes correctly', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

      sizes.forEach((size) => {
        const wrapper = mount(BaseBadge, {
          props: { size },
        });
        expect(wrapper.classes()).toContain(`base-badge--${size}`);
      });
    });
  });
});
