import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ResponsiveImage from '../ResponsiveImage.vue';
import type { MediaObject } from '@public/types/media';

describe('ResponsiveImage', () => {
  const mockMediaObject: MediaObject = {
    id: 1,
    original: '/media/original.jpg',
    conversions: {
      thumb: '/media/thumb.webp',
      small: '/media/small.webp',
      medium: '/media/medium.webp',
      large: '/media/large.webp',
    },
    srcset:
      '/media/thumb.webp 150w, /media/small.webp 320w, /media/medium.webp 640w, /media/large.webp 1280w',
  };

  it('renders with media object', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMediaObject,
        alt: 'Test image',
      },
    });

    const img = wrapper.find('img.responsive-image');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('/media/original.jpg');
    expect(img.attributes('srcset')).toBe(mockMediaObject.srcset);
    expect(img.attributes('alt')).toBe('Test image');
  });

  it('renders with specific conversion', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMediaObject,
        alt: 'Test image',
        conversion: 'medium',
      },
    });

    const img = wrapper.find('img.responsive-image');
    expect(img.attributes('src')).toBe('/media/medium.webp');
  });

  it('renders with fallback URL when no media provided', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: null,
        fallbackUrl: '/fallback.jpg',
        alt: 'Test image',
      },
    });

    const img = wrapper.find('img.responsive-image');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('/fallback.jpg');
    expect(img.attributes('srcset')).toBe('');
  });

  it('does not render when no media or fallback provided', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: null,
        alt: 'Test image',
      },
    });

    const wrapper_div = wrapper.find('.responsive-image-wrapper');
    expect(wrapper_div.exists()).toBe(false);
  });

  it('applies custom sizes attribute', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMediaObject,
        alt: 'Test image',
        sizes: '(max-width: 640px) 100vw, 640px',
      },
    });

    const img = wrapper.find('img.responsive-image');
    expect(img.attributes('sizes')).toBe('(max-width: 640px) 100vw, 640px');
  });

  it('applies custom image class', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMediaObject,
        alt: 'Test image',
        imageClass: 'rounded-lg shadow-md',
      },
    });

    const img = wrapper.find('img.responsive-image');
    expect(img.classes()).toContain('rounded-lg');
    expect(img.classes()).toContain('shadow-md');
  });

  it('sets loading attribute correctly', () => {
    const lazyWrapper = mount(ResponsiveImage, {
      props: {
        media: mockMediaObject,
        alt: 'Test image',
        loading: 'lazy',
      },
    });

    expect(lazyWrapper.find('img.responsive-image').attributes('loading')).toBe('lazy');

    const eagerWrapper = mount(ResponsiveImage, {
      props: {
        media: mockMediaObject,
        alt: 'Test image',
        loading: 'eager',
      },
    });

    expect(eagerWrapper.find('img.responsive-image').attributes('loading')).toBe('eager');
  });

  it('uses default values when not provided', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMediaObject,
        alt: 'Test image',
      },
    });

    const img = wrapper.find('img.responsive-image');
    expect(img.attributes('sizes')).toBe('100vw');
    expect(img.attributes('loading')).toBe('lazy');
  });

  it('prioritizes media over fallbackUrl', () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        media: mockMediaObject,
        fallbackUrl: '/fallback.jpg',
        alt: 'Test image',
      },
    });

    const img = wrapper.find('img.responsive-image');
    expect(img.attributes('src')).toBe('/media/original.jpg');
    expect(img.attributes('srcset')).toBe(mockMediaObject.srcset);
  });

  describe('Loading Placeholder', () => {
    it('shows placeholder by default when image is not loaded', () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'Test image',
        },
      });

      const placeholder = wrapper.find('.image-placeholder');
      expect(placeholder.exists()).toBe(true);
      expect(placeholder.find('.shimmer').exists()).toBe(true);
    });

    it('hides placeholder when showPlaceholder is false', () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'Test image',
          showPlaceholder: false,
        },
      });

      const placeholder = wrapper.find('.image-placeholder');
      expect(placeholder.exists()).toBe(false);
    });

    it('hides placeholder when image loads', async () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'Test image',
        },
      });

      expect(wrapper.find('.image-placeholder').exists()).toBe(true);

      const img = wrapper.find('img.responsive-image');
      await img.trigger('load');
      await nextTick();

      expect(wrapper.find('.image-placeholder').exists()).toBe(false);
    });

    it('hides placeholder on image error', async () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'Test image',
        },
      });

      expect(wrapper.find('.image-placeholder').exists()).toBe(true);

      const img = wrapper.find('img.responsive-image');
      await img.trigger('error');
      await nextTick();

      expect(wrapper.find('.image-placeholder').exists()).toBe(false);
    });

    it('adds image-loaded class when image loads', async () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'Test image',
        },
      });

      const img = wrapper.find('img.responsive-image');
      expect(img.classes()).not.toContain('image-loaded');

      await img.trigger('load');
      await nextTick();

      expect(img.classes()).toContain('image-loaded');
    });

    it('applies custom placeholder color', () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'Test image',
          placeholderColor: '#f0f0f0',
        },
      });

      const placeholder = wrapper.find('.image-placeholder');
      expect(placeholder.attributes('style')).toContain('background-color: #f0f0f0');
    });
  });

  describe('Aspect Ratio', () => {
    it('applies aspect ratio when provided', () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'Test image',
          aspectRatio: '16/9',
        },
      });

      const container = wrapper.find('.responsive-image-wrapper');
      expect(container.attributes('style')).toContain('aspect-ratio: 16 / 9');
    });

    it('does not apply aspect ratio when not provided', () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'Test image',
        },
      });

      const container = wrapper.find('.responsive-image-wrapper');
      expect(container.attributes('style')).toBeUndefined();
    });
  });

  describe('Accessibility', () => {
    it('marks placeholder as aria-hidden', () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'Test image',
        },
      });

      const placeholder = wrapper.find('.image-placeholder');
      expect(placeholder.attributes('aria-hidden')).toBe('true');
    });

    it('provides alt text to image', () => {
      const wrapper = mount(ResponsiveImage, {
        props: {
          media: mockMediaObject,
          alt: 'League championship banner',
        },
      });

      const img = wrapper.find('img.responsive-image');
      expect(img.attributes('alt')).toBe('League championship banner');
    });
  });
});
