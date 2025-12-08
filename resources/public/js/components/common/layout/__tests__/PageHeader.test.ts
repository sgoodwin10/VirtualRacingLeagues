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
      expect(style).toContain('background-color: var(--color-asphalt)');
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

    it('constrains content width', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

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
});
