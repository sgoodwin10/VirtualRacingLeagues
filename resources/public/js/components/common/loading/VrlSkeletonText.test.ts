import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlSkeletonText from './VrlSkeletonText.vue';
import VrlSkeleton from './VrlSkeleton.vue';

describe('VrlSkeletonText', () => {
  describe('rendering', () => {
    it('should render with default props (3 lines)', () => {
      const wrapper = mount(VrlSkeletonText);

      const skeletons = wrapper.findAllComponents(VrlSkeleton);
      expect(skeletons).toHaveLength(3);
    });

    it('should render wrapper with proper class', () => {
      const wrapper = mount(VrlSkeletonText);

      expect(wrapper.find('[data-test="skeleton-text-wrapper"]').exists()).toBe(true);
    });
  });

  describe('lines prop', () => {
    it('should render specified number of lines', () => {
      const wrapper = mount(VrlSkeletonText, {
        props: { lines: 5 },
      });

      const skeletons = wrapper.findAllComponents(VrlSkeleton);
      expect(skeletons).toHaveLength(5);
    });

    it('should render single line', () => {
      const wrapper = mount(VrlSkeletonText, {
        props: { lines: 1 },
      });

      const skeletons = wrapper.findAllComponents(VrlSkeleton);
      expect(skeletons).toHaveLength(1);
    });
  });

  describe('shortLastLine prop', () => {
    it('should make last line 60% width by default', () => {
      const wrapper = mount(VrlSkeletonText, {
        props: { lines: 3 },
      });

      const skeletons = wrapper.findAllComponents(VrlSkeleton);
      const lastSkeleton = skeletons[skeletons.length - 1];

      expect(lastSkeleton?.props('width')).toBe('60%');
    });

    it('should make all lines full width when shortLastLine is false', () => {
      const wrapper = mount(VrlSkeletonText, {
        props: { lines: 3, shortLastLine: false },
      });

      const skeletons = wrapper.findAllComponents(VrlSkeleton);

      skeletons.forEach((skeleton) => {
        expect(skeleton.props('width')).toBe('100%');
      });
    });

    it('should make first two lines full width', () => {
      const wrapper = mount(VrlSkeletonText, {
        props: { lines: 3, shortLastLine: true },
      });

      const skeletons = wrapper.findAllComponents(VrlSkeleton);

      expect(skeletons[0]?.props('width')).toBe('100%');
      expect(skeletons[1]?.props('width')).toBe('100%');
    });
  });

  describe('gap prop', () => {
    it('should apply default gap', () => {
      const wrapper = mount(VrlSkeletonText);

      const wrapperElement = wrapper.find('[data-test="skeleton-text-wrapper"]')
        .element as HTMLElement;
      expect(wrapperElement.style.gap).toBe('0.5rem');
    });

    it('should apply custom gap', () => {
      const wrapper = mount(VrlSkeletonText, {
        props: { gap: '1rem' },
      });

      const wrapperElement = wrapper.find('[data-test="skeleton-text-wrapper"]')
        .element as HTMLElement;
      expect(wrapperElement.style.gap).toBe('1rem');
    });
  });

  describe('skeleton type', () => {
    it('should render all skeletons with type "text"', () => {
      const wrapper = mount(VrlSkeletonText, {
        props: { lines: 4 },
      });

      const skeletons = wrapper.findAllComponents(VrlSkeleton);

      skeletons.forEach((skeleton) => {
        expect(skeleton.props('type')).toBe('text');
      });
    });
  });
});
