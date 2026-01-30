import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlTeamCell from './../cells/VrlTeamCell.vue';
import VrlTag from '@public/components/common/tags/VrlTag.vue';

describe('VrlTeamCell', () => {
  describe('Rendering', () => {
    it('renders team name', () => {
      const wrapper = mount(VrlTeamCell, {
        props: { name: 'RSR' },
      });

      expect(wrapper.text()).toBe('RSR');
    });

    it('uses VrlTag component', () => {
      const wrapper = mount(VrlTeamCell, {
        props: { name: 'RSR' },
      });

      expect(wrapper.findComponent(VrlTag).exists()).toBe(true);
    });

    it('passes name to VrlTag slot', () => {
      const wrapper = mount(VrlTeamCell, {
        props: { name: 'Red Storm Racing' },
      });

      expect(wrapper.findComponent(VrlTag).text()).toBe('Red Storm Racing');
    });
  });

  describe('Variants', () => {
    it('uses default variant by default', () => {
      const wrapper = mount(VrlTeamCell, {
        props: { name: 'RSR' },
      });

      const tag = wrapper.findComponent(VrlTag);
      expect(tag.props('variant')).toBe('default');
    });

    it('passes variant prop to VrlTag', () => {
      const wrapper = mount(VrlTeamCell, {
        props: {
          name: 'RSR',
          variant: 'cyan',
        },
      });

      const tag = wrapper.findComponent(VrlTag);
      expect(tag.props('variant')).toBe('cyan');
    });

    it('supports success variant', () => {
      const wrapper = mount(VrlTeamCell, {
        props: {
          name: 'RSR',
          variant: 'success',
        },
      });

      const tag = wrapper.findComponent(VrlTag);
      expect(tag.props('variant')).toBe('success');
    });

    it('supports warning variant', () => {
      const wrapper = mount(VrlTeamCell, {
        props: {
          name: 'RSR',
          variant: 'warning',
        },
      });

      const tag = wrapper.findComponent(VrlTag);
      expect(tag.props('variant')).toBe('warning');
    });

    it('supports danger variant', () => {
      const wrapper = mount(VrlTeamCell, {
        props: {
          name: 'RSR',
          variant: 'danger',
        },
      });

      const tag = wrapper.findComponent(VrlTag);
      expect(tag.props('variant')).toBe('danger');
    });
  });

  describe('Different Team Names', () => {
    it('renders short abbreviations', () => {
      const wrapper = mount(VrlTeamCell, {
        props: { name: 'RSR' },
      });

      expect(wrapper.text()).toBe('RSR');
    });

    it('renders full team names', () => {
      const wrapper = mount(VrlTeamCell, {
        props: { name: 'Red Storm Racing' },
      });

      expect(wrapper.text()).toBe('Red Storm Racing');
    });

    it('renders single character names', () => {
      const wrapper = mount(VrlTeamCell, {
        props: { name: 'A' },
      });

      expect(wrapper.text()).toBe('A');
    });
  });

  describe('Structure', () => {
    it('renders VrlTag as root component', () => {
      const wrapper = mount(VrlTeamCell, {
        props: { name: 'RSR' },
      });

      expect(wrapper.findComponent(VrlTag).exists()).toBe(true);
    });
  });
});
