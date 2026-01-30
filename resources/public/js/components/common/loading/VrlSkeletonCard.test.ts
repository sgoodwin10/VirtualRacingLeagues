import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlSkeletonCard from './VrlSkeletonCard.vue';
import VrlSkeleton from './VrlSkeleton.vue';
import VrlSkeletonAvatar from './VrlSkeletonAvatar.vue';
import VrlSkeletonText from './VrlSkeletonText.vue';

describe('VrlSkeletonCard', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const wrapper = mount(VrlSkeletonCard);

      expect(wrapper.find('[data-test="skeleton-card"]').exists()).toBe(true);
      expect(wrapper.findComponent(VrlSkeletonAvatar).exists()).toBe(true);
      expect(wrapper.findComponent(VrlSkeleton).exists()).toBe(true);
      expect(wrapper.findComponent(VrlSkeletonText).exists()).toBe(true);
    });

    it('should render with horizontal layout by default', () => {
      const wrapper = mount(VrlSkeletonCard);

      expect(wrapper.classes()).toContain('flex-row');
    });
  });

  describe('showAvatar prop', () => {
    it('should show avatar by default', () => {
      const wrapper = mount(VrlSkeletonCard);

      expect(wrapper.findComponent(VrlSkeletonAvatar).exists()).toBe(true);
    });

    it('should hide avatar when showAvatar is false', () => {
      const wrapper = mount(VrlSkeletonCard, {
        props: { showAvatar: false },
      });

      expect(wrapper.findComponent(VrlSkeletonAvatar).exists()).toBe(false);
    });
  });

  describe('avatarSize prop', () => {
    it('should apply md avatar size by default', () => {
      const wrapper = mount(VrlSkeletonCard);

      const avatar = wrapper.findComponent(VrlSkeletonAvatar);
      expect(avatar.props('size')).toBe('md');
    });

    it('should apply custom avatar size', () => {
      const wrapper = mount(VrlSkeletonCard, {
        props: { avatarSize: 'lg' },
      });

      const avatar = wrapper.findComponent(VrlSkeletonAvatar);
      expect(avatar.props('size')).toBe('lg');
    });
  });

  describe('showTitle prop', () => {
    it('should show title by default', () => {
      const wrapper = mount(VrlSkeletonCard);

      const titleSkeleton = wrapper.findComponent(VrlSkeleton);
      expect(titleSkeleton.exists()).toBe(true);
      expect(titleSkeleton.props('type')).toBe('title');
    });

    it('should hide title when showTitle is false', () => {
      const wrapper = mount(VrlSkeletonCard, {
        props: { showTitle: false },
      });

      const skeletons = wrapper.findAllComponents(VrlSkeleton);
      const titleSkeleton = skeletons.find((s) => s.props('type') === 'title');
      expect(titleSkeleton).toBeUndefined();
    });
  });

  describe('textLines prop', () => {
    it('should render 2 text lines by default', () => {
      const wrapper = mount(VrlSkeletonCard);

      const textSkeleton = wrapper.findComponent(VrlSkeletonText);
      expect(textSkeleton.props('lines')).toBe(2);
    });

    it('should render custom number of text lines', () => {
      const wrapper = mount(VrlSkeletonCard, {
        props: { textLines: 4 },
      });

      const textSkeleton = wrapper.findComponent(VrlSkeletonText);
      expect(textSkeleton.props('lines')).toBe(4);
    });
  });

  describe('layout prop', () => {
    it('should apply horizontal layout by default', () => {
      const wrapper = mount(VrlSkeletonCard);

      expect(wrapper.classes()).toContain('flex-row');
      expect(wrapper.classes()).not.toContain('flex-col');
    });

    it('should apply vertical layout', () => {
      const wrapper = mount(VrlSkeletonCard, {
        props: { layout: 'vertical' },
      });

      expect(wrapper.classes()).toContain('flex-col');
      expect(wrapper.classes()).not.toContain('flex-row');
    });
  });

  describe('content structure', () => {
    it('should have content wrapper', () => {
      const wrapper = mount(VrlSkeletonCard);

      expect(wrapper.find('[data-test="skeleton-card-content"]').exists()).toBe(true);
    });

    it('should have title with proper class', () => {
      const wrapper = mount(VrlSkeletonCard);

      expect(wrapper.find('[data-test="skeleton-card-title"]').exists()).toBe(true);
    });

    it('should have text with proper class', () => {
      const wrapper = mount(VrlSkeletonCard);

      expect(wrapper.find('[data-test="skeleton-card-text"]').exists()).toBe(true);
    });
  });

  describe('combined props', () => {
    it('should render minimal card (no avatar, no title)', () => {
      const wrapper = mount(VrlSkeletonCard, {
        props: {
          showAvatar: false,
          showTitle: false,
          textLines: 1,
        },
      });

      expect(wrapper.findComponent(VrlSkeletonAvatar).exists()).toBe(false);
      // VrlSkeletonText uses VrlSkeleton internally, so we check for title skeleton specifically
      const titleSkeleton = wrapper.findAll('[data-test="skeleton-card-title"]');
      expect(titleSkeleton).toHaveLength(0);
      expect(wrapper.findComponent(VrlSkeletonText).exists()).toBe(true);
    });

    it('should render full card with all elements', () => {
      const wrapper = mount(VrlSkeletonCard, {
        props: {
          showAvatar: true,
          avatarSize: 'lg',
          showTitle: true,
          textLines: 3,
          layout: 'horizontal',
        },
      });

      expect(wrapper.findComponent(VrlSkeletonAvatar).exists()).toBe(true);
      expect(wrapper.findComponent(VrlSkeleton).exists()).toBe(true);
      expect(wrapper.findComponent(VrlSkeletonText).exists()).toBe(true);
    });
  });
});
