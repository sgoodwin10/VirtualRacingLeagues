import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlDriverCell from '../../cells/VrlDriverCell.vue';

describe('VrlDriverCell', () => {
  describe('Rendering', () => {
    it('renders driver name', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      expect(wrapper.find('.driver-name').text()).toBe('Max Velocity');
    });

    it('renders with avatar by default', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      expect(wrapper.find('.driver-avatar').exists()).toBe(true);
    });

    it('hides avatar when showAvatar is false', () => {
      const wrapper = mount(VrlDriverCell, {
        props: {
          name: 'Max Velocity',
          showAvatar: false,
        },
      });

      expect(wrapper.find('.driver-avatar').exists()).toBe(false);
    });

    it('renders team name when provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: {
          name: 'Max Velocity',
          team: 'Red Storm Racing',
        },
      });

      expect(wrapper.find('.driver-team').text()).toBe('Red Storm Racing');
    });

    it('does not render team element when team is not provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      expect(wrapper.find('.driver-team').exists()).toBe(false);
    });
  });

  describe('Avatar', () => {
    it('shows image when avatarUrl is provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: {
          name: 'Max Velocity',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      });

      const img = wrapper.find('.driver-avatar img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('https://example.com/avatar.jpg');
      expect(img.attributes('alt')).toBe('Max Velocity');
    });

    it('shows initials when no avatarUrl is provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      expect(wrapper.find('.driver-avatar').text()).toBe('MV');
    });

    it('uses custom initials when provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: {
          name: 'Max Velocity',
          initials: 'XX',
        },
      });

      expect(wrapper.find('.driver-avatar').text()).toBe('XX');
    });
  });

  describe('Initials Generation', () => {
    it('generates initials from first and last name', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      expect(wrapper.find('.driver-avatar').text()).toBe('MV');
    });

    it('generates initials from single name (first 2 characters)', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max' },
      });

      expect(wrapper.find('.driver-avatar').text()).toBe('MA');
    });

    it('generates initials from multiple names (first and last)', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Von Velocity' },
      });

      expect(wrapper.find('.driver-avatar').text()).toBe('MV');
    });

    it('handles extra whitespace in names', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: '  Max   Velocity  ' },
      });

      expect(wrapper.find('.driver-avatar').text()).toBe('MV');
    });

    it('uppercases initials', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'max velocity' },
      });

      expect(wrapper.find('.driver-avatar').text()).toBe('MV');
    });
  });

  describe('Structure', () => {
    it('has correct DOM structure', () => {
      const wrapper = mount(VrlDriverCell, {
        props: {
          name: 'Max Velocity',
          team: 'Red Storm Racing',
        },
      });

      expect(wrapper.find('.driver-cell').exists()).toBe(true);
      expect(wrapper.find('.driver-avatar').exists()).toBe(true);
      expect(wrapper.find('.driver-info').exists()).toBe(true);
      expect(wrapper.find('.driver-name').exists()).toBe(true);
      expect(wrapper.find('.driver-team').exists()).toBe(true);
    });
  });
});
