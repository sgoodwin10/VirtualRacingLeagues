import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TagIndicator from './TagIndicator.vue';

describe('TagIndicator', () => {
  describe('Rendering', () => {
    it('renders default slot content', () => {
      const wrapper = mount(TagIndicator, {
        slots: {
          default: 'Test Tag',
        },
      });

      expect(wrapper.text()).toBe('Test Tag');
    });

    it('renders with default props', () => {
      const wrapper = mount(TagIndicator, {
        slots: {
          default: 'Default',
        },
      });

      expect(wrapper.classes()).toContain('tag-indicator');
      expect(wrapper.classes()).toContain('tag-indicator--cyan');
      expect(wrapper.classes()).toContain('tag-indicator--sm');
    });
  });

  describe('Variant Prop', () => {
    const variants = ['default', 'cyan', 'warning', 'success', 'danger'] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant correctly`, () => {
        const wrapper = mount(TagIndicator, {
          props: { variant },
          slots: {
            default: 'Tag',
          },
        });

        expect(wrapper.classes()).toContain(`tag-indicator--${variant}`);
      });
    });

    it('applies default variant when variant is not specified', () => {
      const wrapper = mount(TagIndicator);

      expect(wrapper.classes()).toContain('tag-indicator--cyan');
    });
  });

  describe('Size Prop', () => {
    const sizes = ['xs', 'sm'] as const;

    sizes.forEach((size) => {
      it(`renders ${size} size correctly`, () => {
        const wrapper = mount(TagIndicator, {
          props: { size },
          slots: {
            default: 'Tag',
          },
        });

        expect(wrapper.classes()).toContain(`tag-indicator--${size}`);
      });
    });

    it('applies sm size when size is not specified', () => {
      const wrapper = mount(TagIndicator);

      expect(wrapper.classes()).toContain('tag-indicator--sm');
    });
  });

  describe('Combined Props', () => {
    it('renders with custom variant and size', () => {
      const wrapper = mount(TagIndicator, {
        props: {
          variant: 'danger',
          size: 'xs',
        },
        slots: {
          default: 'Alert',
        },
      });

      expect(wrapper.classes()).toContain('tag-indicator--danger');
      expect(wrapper.classes()).toContain('tag-indicator--xs');
      expect(wrapper.text()).toBe('Alert');
    });

    it('renders warning variant with xs size', () => {
      const wrapper = mount(TagIndicator, {
        props: {
          variant: 'warning',
          size: 'xs',
        },
        slots: {
          default: 'Warning',
        },
      });

      expect(wrapper.classes()).toContain('tag-indicator--warning');
      expect(wrapper.classes()).toContain('tag-indicator--xs');
    });

    it('renders success variant with sm size', () => {
      const wrapper = mount(TagIndicator, {
        props: {
          variant: 'success',
          size: 'sm',
        },
        slots: {
          default: 'Success',
        },
      });

      expect(wrapper.classes()).toContain('tag-indicator--success');
      expect(wrapper.classes()).toContain('tag-indicator--sm');
    });
  });

  describe('HTML Structure', () => {
    it('renders as a span element', () => {
      const wrapper = mount(TagIndicator);

      expect(wrapper.element.tagName).toBe('SPAN');
    });

    it('always includes base tag-indicator class', () => {
      const wrapper = mount(TagIndicator, {
        props: {
          variant: 'default',
          size: 'xs',
        },
      });

      expect(wrapper.classes()).toContain('tag-indicator');
    });
  });

  describe('Slot Content', () => {
    it('renders complex slot content', () => {
      const wrapper = mount(TagIndicator, {
        slots: {
          default: '<strong>Bold</strong> Text',
        },
      });

      expect(wrapper.html()).toContain('<strong>Bold</strong> Text');
    });

    it('renders empty slot gracefully', () => {
      const wrapper = mount(TagIndicator);

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toBe('');
    });

    it('renders numeric content', () => {
      const wrapper = mount(TagIndicator, {
        slots: {
          default: '42',
        },
      });

      expect(wrapper.text()).toBe('42');
    });
  });
});
