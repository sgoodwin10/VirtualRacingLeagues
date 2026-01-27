import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import ComingSoonSection from './ComingSoonSection.vue';
import SectionHeader from '../SectionHeader.vue';
import ComingSoonItem from '../ComingSoonItem.vue';

describe('ComingSoonSection', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(ComingSoonSection, {
      global: {
        stubs: {
          SectionHeader: true,
          ComingSoonItem: true,
        },
      },
    });
  });

  describe('Rendering', () => {
    it('should render the section', () => {
      expect(wrapper.find('section').exists()).toBe(true);
    });

    it('should render the section header', () => {
      const sectionHeader = wrapper.findComponent(SectionHeader);
      expect(sectionHeader.exists()).toBe(true);
    });

    it('should render 8 coming soon items', () => {
      wrapper = mount(ComingSoonSection);

      const comingSoonItems = wrapper.findAllComponents(ComingSoonItem);
      expect(comingSoonItems).toHaveLength(8);
    });

    it('should render items grid', () => {
      const grid = wrapper.find('.grid');
      expect(grid.exists()).toBe(true);
    });
  });

  describe('Coming Soon Items Content', () => {
    beforeEach(() => {
      wrapper = mount(ComingSoonSection);
    });

    it('should render GT7 Daily Race Stats item', () => {
      const items = wrapper.findAllComponents(ComingSoonItem);
      const gt7Item = items.find((item) => item.props('text') === 'GT7 Daily Race Stats');

      expect(gt7Item).toBeDefined();
      expect(gt7Item?.props('icon')).toBe('📈');
    });

    it('should render Track Database item', () => {
      const items = wrapper.findAllComponents(ComingSoonItem);
      const trackItem = items.find((item) => item.props('text') === 'Track Database');

      expect(trackItem).toBeDefined();
      expect(trackItem?.props('icon')).toBe('🛤️');
    });

    it('should render Car Selection item', () => {
      const items = wrapper.findAllComponents(ComingSoonItem);
      const carItem = items.find((item) => item.props('text') === 'Car Selection');

      expect(carItem).toBeDefined();
      expect(carItem?.props('icon')).toBe('🚗');
    });

    it('should render AI OCR Reader item', () => {
      const items = wrapper.findAllComponents(ComingSoonItem);
      const aiItem = items.find((item) => item.props('text') === 'AI OCR Reader');

      expect(aiItem).toBeDefined();
      expect(aiItem?.props('icon')).toBe('🤖');
    });

    it('should render Google Sheets Import item', () => {
      const items = wrapper.findAllComponents(ComingSoonItem);
      const sheetsItem = items.find((item) => item.props('text') === 'Google Sheets Import');

      expect(sheetsItem).toBeDefined();
      expect(sheetsItem?.props('icon')).toBe('📊');
    });

    it('should render More Platforms item', () => {
      const items = wrapper.findAllComponents(ComingSoonItem);
      const platformsItem = items.find((item) => item.props('text') === 'More Platforms');

      expect(platformsItem).toBeDefined();
      expect(platformsItem?.props('icon')).toBe('🎯');
    });

    it('should render Mobile App item', () => {
      const items = wrapper.findAllComponents(ComingSoonItem);
      const mobileItem = items.find((item) => item.props('text') === 'Mobile App');

      expect(mobileItem).toBeDefined();
      expect(mobileItem?.props('icon')).toBe('📱');
    });

    it('should render Discord Integration item', () => {
      const items = wrapper.findAllComponents(ComingSoonItem);
      const discordItem = items.find((item) => item.props('text') === 'Discord Integration');

      expect(discordItem).toBeDefined();
      expect(discordItem?.props('icon')).toBe('🔔');
    });
  });
});
