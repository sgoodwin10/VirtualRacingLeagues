import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlSkeletonAvatar from './VrlSkeletonAvatar.vue';

describe('VrlSkeletonAvatar', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const wrapper = mount(VrlSkeletonAvatar);

      expect(wrapper.find('[data-test="skeleton-avatar"]').exists()).toBe(true);
    });

    it('should have proper ARIA attributes', () => {
      const wrapper = mount(VrlSkeletonAvatar);

      expect(wrapper.attributes('role')).toBe('status');
      expect(wrapper.attributes('aria-label')).toBe('Loading avatar');
    });
  });

  describe('size prop', () => {
    it('should apply sm size (32px)', () => {
      const wrapper = mount(VrlSkeletonAvatar, {
        props: { size: 'sm' },
      });

      const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
      expect(element.style.width).toBe('32px');
      expect(element.style.height).toBe('32px');
    });

    it('should apply md size (40px) by default', () => {
      const wrapper = mount(VrlSkeletonAvatar);

      const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
      expect(element.style.width).toBe('40px');
      expect(element.style.height).toBe('40px');
    });

    it('should apply lg size (56px)', () => {
      const wrapper = mount(VrlSkeletonAvatar, {
        props: { size: 'lg' },
      });

      const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
      expect(element.style.width).toBe('56px');
      expect(element.style.height).toBe('56px');
    });

    it('should apply xl size (72px)', () => {
      const wrapper = mount(VrlSkeletonAvatar, {
        props: { size: 'xl' },
      });

      const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
      expect(element.style.width).toBe('72px');
      expect(element.style.height).toBe('72px');
    });
  });

  describe('shape prop', () => {
    it('should apply circle shape by default (50% border radius)', () => {
      const wrapper = mount(VrlSkeletonAvatar);

      const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
      expect(element.style.borderRadius).toBe('50%');
    });

    it('should apply square shape with sm size', () => {
      const wrapper = mount(VrlSkeletonAvatar, {
        props: { size: 'sm', shape: 'square' },
      });

      const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
      expect(element.style.borderRadius).toBe('var(--radius-sm)');
    });

    it('should apply square shape with md size', () => {
      const wrapper = mount(VrlSkeletonAvatar, {
        props: { size: 'md', shape: 'square' },
      });

      const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
      expect(element.style.borderRadius).toBe('var(--radius)');
    });

    it('should apply square shape with lg size', () => {
      const wrapper = mount(VrlSkeletonAvatar, {
        props: { size: 'lg', shape: 'square' },
      });

      const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
      expect(element.style.borderRadius).toBe('var(--radius-md)');
    });

    it('should apply square shape with xl size', () => {
      const wrapper = mount(VrlSkeletonAvatar, {
        props: { size: 'xl', shape: 'square' },
      });

      const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
      expect(element.style.borderRadius).toBe('var(--radius-lg)');
    });
  });

  describe('combined props', () => {
    it('should apply circle shape regardless of size', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'] as const;

      sizes.forEach((size) => {
        const wrapper = mount(VrlSkeletonAvatar, {
          props: { size, shape: 'circle' },
        });

        const element = wrapper.find('[data-test="skeleton-avatar"]').element as HTMLElement;
        expect(element.style.borderRadius).toBe('50%');
      });
    });
  });

  describe('CSS classes', () => {
    it('should have skeleton class', () => {
      const wrapper = mount(VrlSkeletonAvatar);

      expect(wrapper.classes()).toContain('skeleton');
    });
  });
});
