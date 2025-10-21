import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PageHeader from '../PageHeader.vue';
import HTag from '../HTag.vue';

describe('PageHeader', () => {
  describe('Rendering', () => {
    it('renders the title correctly', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      expect(wrapper.text()).toContain('Test Title');
    });

    it('renders the description when provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          description: 'Test description text',
        },
      });

      expect(wrapper.text()).toContain('Test description text');
    });

    it('does not render description paragraph when description is not provided', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
      });

      const descriptionElement = wrapper.find('p');
      expect(descriptionElement.exists()).toBe(false);
    });

    it('renders HTag component for the title', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
        global: {
          components: {
            HTag,
          },
        },
      });

      const hTag = wrapper.findComponent(HTag);
      expect(hTag.exists()).toBe(true);
      expect(hTag.text()).toBe('Test Title');
    });
  });

  describe('Styling', () => {
    it('applies mb-2 class to HTag component', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
        global: {
          components: {
            HTag,
          },
        },
      });

      const hTag = wrapper.findComponent(HTag);
      expect(hTag.props('additionalClasses')).toBe('mb-2');
    });

    it('applies text-gray-600 class to description paragraph', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          description: 'Test description',
        },
      });

      const descriptionElement = wrapper.find('p');
      expect(descriptionElement.classes()).toContain('text-gray-600');
    });
  });

  describe('Props', () => {
    it('accepts title prop as required', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Required Title',
        },
      });

      expect(wrapper.props('title')).toBe('Required Title');
    });

    it('accepts description prop as optional', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          description: 'Optional description',
        },
      });

      expect(wrapper.props('description')).toBe('Optional description');
    });

    it('handles empty description prop', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          description: '',
        },
      });

      // Empty description should still render the paragraph element (v-if checks for truthiness)
      const descriptionElement = wrapper.find('p');
      expect(descriptionElement.exists()).toBe(false);
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot with title only', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
        },
        global: {
          components: {
            HTag,
          },
        },
      });

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('matches snapshot with title and description', () => {
      const wrapper = mount(PageHeader, {
        props: {
          title: 'Test Title',
          description: 'Test description text',
        },
        global: {
          components: {
            HTag,
          },
        },
      });

      expect(wrapper.html()).toMatchSnapshot();
    });
  });
});
