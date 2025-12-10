import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PageHeader from '../PageHeader.vue';

describe('PageHeader', () => {
  describe('rendering', () => {
    it('renders title correctly', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      expect(wrapper.find('h1').text()).toBe('Test Title');
    });

    it('renders label when provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          label: 'Test Label',
        },
      });

      const label = wrapper.find('span');
      expect(label.exists()).toBe(true);
      expect(label.text()).toBe('Test Label');
      expect(label.classes()).toContain('font-display');
      expect(label.classes()).toContain('uppercase');
    });

    it('does not render label when not provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      const labels = wrapper
        .findAll('span')
        .filter((span) => span.classes().includes('font-display'));
      expect(labels.length).toBe(0);
    });

    it('renders description when provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          description: 'Test description text',
        },
      });

      const description = wrapper.find('p');
      expect(description.exists()).toBe(true);
      expect(description.text()).toBe('Test description text');
    });

    it('does not render description when not provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      expect(wrapper.find('p').exists()).toBe(false);
    });

    it('renders all props together', () => {
      const wrapper = mount(PageHeader, {
        props: {
          label: 'Directory',
          title: 'Public Leagues',
          description: 'Discover sim racing leagues from the community.',
          backgroundImage: '/images/test-bg.jpg',
        },
      });

      expect(wrapper.find('span').text()).toBe('Directory');
      expect(wrapper.find('h1').text()).toBe('Public Leagues');
      expect(wrapper.find('p').text()).toBe('Discover sim racing leagues from the community.');
    });
  });

  describe('background image', () => {
    it('applies background color when no image provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).toContain('background-color: var(--bg-secondary)');
    });

    it('applies background image when provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: '/images/test-bg.jpg',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).toContain('background-image:');
      expect(style).toContain('/images/test-bg.jpg');
      expect(style).toContain('background-size: cover');
      expect(style).toContain('background-position: center');
    });

    it('renders overlay when background image is provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: '/images/test-bg.jpg',
        },
      });

      const overlay = wrapper.find('.absolute.inset-0.bg-gradient-to-b');
      expect(overlay.exists()).toBe(true);
    });

    it('does not render overlay when no background image', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      const overlay = wrapper.find('.absolute.inset-0.bg-gradient-to-b');
      expect(overlay.exists()).toBe(false);
    });
  });

  describe('styling', () => {
    it('applies correct Tailwind classes to section', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      const section = wrapper.find('section');
      expect(section.classes()).toContain('relative');
      expect(section.classes()).toContain('border-b');
    });

    it('applies correct classes to title', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      const title = wrapper.find('h1');
      expect(title.classes()).toContain('font-display');
      expect(title.classes()).toContain('uppercase');
      expect(title.classes()).toContain('leading-tight');
    });

    it('applies correct classes to description', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          description: 'Test description',
        },
      });

      const description = wrapper.find('p');
      expect(description.classes()).toContain('text-base');
      expect(description.classes()).toContain('leading-relaxed');
    });

    it('constrains content width with Tailwind classes', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      // The info section has max-w-[600px] Tailwind class
      const contentWrapper = wrapper.find('.max-w-\\[600px\\]');
      expect(contentWrapper.exists()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('uses semantic h1 for title', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      const h1 = wrapper.find('h1');
      expect(h1.exists()).toBe(true);
      expect(h1.element.tagName).toBe('H1');
    });

    it('uses semantic section element', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      expect(wrapper.element.tagName).toBe('SECTION');
    });

    it('properly layers content with z-index', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: '/images/test-bg.jpg',
        },
      });

      const container = wrapper.find('.container-racing');
      expect(container.classes()).toContain('relative');
      expect(container.classes()).toContain('z-10');
    });
  });

  describe('props validation', () => {
    it('requires title prop', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      expect(wrapper.props('title')).toBe('Test Title');
    });

    it('accepts optional label prop', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          label: 'Optional Label',
        },
      });

      expect(wrapper.props('label')).toBe('Optional Label');
    });

    it('accepts optional description prop', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          description: 'Optional description',
        },
      });

      expect(wrapper.props('description')).toBe('Optional description');
    });

    it('accepts optional backgroundImage prop', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: '/images/test.jpg',
        },
      });

      expect(wrapper.props('backgroundImage')).toBe('/images/test.jpg');
    });
  });

  describe('computed styles', () => {
    it('computes background styles without image', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).toBeTruthy();
      expect(style).toContain('background-color');
      expect(style).not.toContain('background-image');
    });

    it('computes background styles with image', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: '/images/test.jpg',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).toBeTruthy();
      expect(style).toContain('background-image');
      expect(style).toContain('background-size');
      expect(style).toContain('background-position');
      expect(style).toContain('background-repeat');
    });
  });

  describe('logo', () => {
    it('renders logo when logoUrl is provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          logoUrl: '/images/test-logo.png',
        },
      });

      const logo = wrapper.find('img');
      expect(logo.exists()).toBe(true);
      expect(logo.attributes('src')).toBe('/images/test-logo.png');
      expect(logo.attributes('alt')).toBe('Test Title logo');
    });

    it('does not render logo when logoUrl is not provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      const logo = wrapper.find('img');
      expect(logo.exists()).toBe(false);
    });

    it('applies correct Tailwind classes to logo image', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          logoUrl: '/images/test-logo.png',
        },
      });

      const logoImg = wrapper.find('img');
      expect(logoImg.exists()).toBe(true);
      expect(logoImg.classes()).toContain('object-contain');
      expect(logoImg.classes()).toContain('rounded-md');
    });

    it('accepts optional logoUrl prop', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          logoUrl: '/images/logo.png',
        },
      });

      expect(wrapper.props('logoUrl')).toBe('/images/logo.png');
    });
  });

  describe('security - XSS protection', () => {
    it('blocks javascript: protocol URLs', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: 'javascript:alert(1)',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).not.toContain('javascript:');
      expect(style).toContain('background-color: var(--bg-secondary)');
    });

    it('blocks data: protocol URLs', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: 'data:text/html,<script>alert(1)</script>',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).not.toContain('data:');
      expect(style).toContain('background-color: var(--bg-secondary)');
    });

    it('blocks file: protocol URLs', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: 'file:///etc/passwd',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).not.toContain('file:');
      expect(style).toContain('background-color: var(--bg-secondary)');
    });

    it('blocks ftp: protocol URLs', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: 'ftp://example.com/image.jpg',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).not.toContain('ftp:');
      expect(style).toContain('background-color: var(--bg-secondary)');
    });

    it('allows valid http: protocol URLs', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: 'http://example.com/image.jpg',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).toContain('background-image:');
      expect(style).toContain('http://example.com/image.jpg');
    });

    it('allows valid https: protocol URLs', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: 'https://example.com/image.jpg',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).toContain('background-image:');
      expect(style).toContain('https://example.com/image.jpg');
    });

    it('validates URL structure through URL constructor', () => {
      // The security fix uses URL constructor to validate URLs
      // This test verifies that valid URLs with standard characters work
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: 'https://example.com/images/test-image_123.jpg',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).toContain('background-image:');
      expect(style).toContain('https://example.com/images/test-image_123.jpg');
    });

    it('handles relative URLs by converting to absolute', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: 'not-a-valid-url',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      // Relative URLs are converted to absolute URLs with current origin
      expect(style).toContain('background-image:');
      expect(style).toContain('http://localhost:3000/not-a-valid-url');
    });

    it('handles path-only URLs by converting to absolute', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: '://invalid',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      // Even malformed relative paths get converted to absolute URLs
      expect(style).toContain('background-image:');
      expect(style).toContain('http://localhost:3000/://invalid');
    });

    it('handles empty string URLs gracefully', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: '',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).toContain('background-color: var(--bg-secondary)');
    });

    it('handles relative URLs by resolving them to current origin', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          backgroundImage: '/images/test.jpg',
        },
      });

      const section = wrapper.find('section');
      const style = section.attributes('style');
      expect(style).toContain('background-image:');
      // Should be converted to absolute URL with current origin
      expect(style).toContain('/images/test.jpg');
    });
  });
});
