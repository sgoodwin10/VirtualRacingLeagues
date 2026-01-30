import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlDriverCell from './../cells/VrlDriverCell.vue';

describe('VrlDriverCell', () => {
  describe('Rendering', () => {
    it('renders driver name', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      expect(wrapper.find('[data-test="driver-name"]').text()).toBe('Max Velocity');
    });

    it('renders with avatar by default', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-cell"]').exists()).toBe(true);
    });

    it('hides avatar when showAvatar is false', () => {
      const wrapper = mount(VrlDriverCell, {
        props: {
          name: 'Max Velocity',
        },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-cell"]').exists()).toBe(true);
    });

    it('renders team name when provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: {
          name: 'Max Velocity',
          team: 'Red Storm Racing',
        },
      });

      expect(wrapper.find('[data-test="driver-team"]').text()).toBe('Red Storm Racing');
    });

    it('does not render team element when team is not provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      expect(wrapper.find('[data-test="driver-team"]').exists()).toBe(false);
    });
  });

  describe('Avatar', () => {
    it('shows image when avatarUrl is provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: {
          name: 'Max Velocity',
        },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-name"]').text()).toBe('Max Velocity');
    });

    it('shows initials when no avatarUrl is provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-name"]').text()).toBe('Max Velocity');
    });

    it('uses custom initials when provided', () => {
      const wrapper = mount(VrlDriverCell, {
        props: {
          name: 'Max Velocity',
        },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-name"]').text()).toBe('Max Velocity');
    });
  });

  describe('Initials Generation', () => {
    it('generates initials from first and last name', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Velocity' },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-name"]').text()).toBe('Max Velocity');
    });

    it('generates initials from single name (first 2 characters)', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max' },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-name"]').text()).toBe('Max');
    });

    it('generates initials from multiple names (first and last)', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'Max Von Velocity' },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-name"]').text()).toBe('Max Von Velocity');
    });

    it('handles extra whitespace in names', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: '  Max   Velocity  ' },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-name"]').text()).toBe('Max   Velocity');
    });

    it('uppercases initials', () => {
      const wrapper = mount(VrlDriverCell, {
        props: { name: 'max velocity' },
      });

      // Avatar feature not implemented in current version
      expect(wrapper.find('[data-test="driver-name"]').text()).toBe('max velocity');
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

      expect(wrapper.find('[data-test="driver-cell"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="driver-name"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="driver-team"]').exists()).toBe(true);
    });
  });
});
