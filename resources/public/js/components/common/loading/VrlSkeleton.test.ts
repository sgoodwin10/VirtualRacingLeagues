import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlSkeleton from '../VrlSkeleton.vue';

describe('VrlSkeleton', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const wrapper = mount(VrlSkeleton);

      expect(wrapper.find('.skeleton').exists()).toBe(true);
      expect(wrapper.attributes('role')).toBe('status');
      expect(wrapper.attributes('aria-live')).toBe('polite');
      expect(wrapper.attributes('aria-label')).toBe('Loading content');
    });

    it('should apply custom class', () => {
      const wrapper = mount(VrlSkeleton, {
        props: { class: 'custom-class' },
      });

      expect(wrapper.classes()).toContain('skeleton');
      expect(wrapper.classes()).toContain('custom-class');
    });
  });

  describe('type presets', () => {
    it('should apply text preset', () => {
      const wrapper = mount(VrlSkeleton, {
        props: { type: 'text' },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('100%');
      expect(element.style.height).toBe('14px');
      expect(element.style.borderRadius).toBe('var(--radius)');
    });

    it('should apply title preset', () => {
      const wrapper = mount(VrlSkeleton, {
        props: { type: 'title' },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('40%');
      expect(element.style.height).toBe('20px');
      expect(element.style.borderRadius).toBe('var(--radius)');
    });

    it('should apply avatar preset', () => {
      const wrapper = mount(VrlSkeleton, {
        props: { type: 'avatar' },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('40px');
      expect(element.style.height).toBe('40px');
      expect(element.style.borderRadius).toBe('var(--radius)');
    });

    it('should apply card preset', () => {
      const wrapper = mount(VrlSkeleton, {
        props: { type: 'card' },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('100%');
      expect(element.style.height).toBe('120px');
      expect(element.style.borderRadius).toBe('var(--radius-md)');
    });
  });

  describe('custom dimensions', () => {
    it('should apply custom width and height', () => {
      const wrapper = mount(VrlSkeleton, {
        props: {
          width: '200px',
          height: '50px',
        },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('200px');
      expect(element.style.height).toBe('50px');
    });

    it('should apply custom border radius', () => {
      const wrapper = mount(VrlSkeleton, {
        props: {
          borderRadius: '12px',
        },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.borderRadius).toBe('12px');
    });

    it('should apply all custom dimensions together', () => {
      const wrapper = mount(VrlSkeleton, {
        props: {
          width: '150px',
          height: '30px',
          borderRadius: '8px',
        },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('150px');
      expect(element.style.height).toBe('30px');
      expect(element.style.borderRadius).toBe('8px');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const wrapper = mount(VrlSkeleton);

      expect(wrapper.attributes('role')).toBe('status');
      expect(wrapper.attributes('aria-live')).toBe('polite');
      expect(wrapper.attributes('aria-label')).toBe('Loading content');
    });
  });

  describe('CSS classes', () => {
    it('should have skeleton base class', () => {
      const wrapper = mount(VrlSkeleton);
      expect(wrapper.classes()).toContain('skeleton');
    });
  });
});
