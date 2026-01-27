import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SectionHeader from './SectionHeader.vue';

describe('SectionHeader', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          tag: 'Features',
          title: 'Everything You Need',
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render the tag', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          tag: 'Features',
          title: 'Everything You Need',
        },
      });

      const tag = wrapper.find('.text-center > div');
      expect(tag.text()).toBe('Features');
    });

    it('should render the title', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          tag: 'Features',
          title: 'Everything You Need',
        },
      });

      const title = wrapper.find('h2');
      expect(title.text()).toBe('Everything You Need');
    });

    it('should render the subtitle when provided', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          tag: 'Features',
          title: 'Everything You Need',
          subtitle: 'Powerful tools for league managers',
        },
      });

      const subtitle = wrapper.find('p');
      expect(subtitle.exists()).toBe(true);
      expect(subtitle.text()).toBe('Powerful tools for league managers');
    });

    it('should not render subtitle when not provided', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          tag: 'Features',
          title: 'Everything You Need',
        },
      });

      const subtitle = wrapper.find('p');
      expect(subtitle.exists()).toBe(false);
    });
  });
});
