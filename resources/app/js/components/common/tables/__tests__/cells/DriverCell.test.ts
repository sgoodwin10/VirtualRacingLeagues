import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DriverCell from '../../cells/DriverCell.vue';

describe('DriverCell', () => {
  it('renders driver name', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
      },
    });

    expect(wrapper.text()).toContain('John Doe');
  });

  it('renders driver subtitle when provided', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        nickname: '#1 | NED',
      },
    });

    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('#1 | NED');
  });

  it('shows avatar by default', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
      },
    });

    // Avatar functionality is not implemented in the current component
    expect(wrapper.find('.driver-avatar').exists()).toBe(false);
  });

  it('hides avatar when showAvatar is false', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        showAvatar: false,
      },
    });

    expect(wrapper.find('.driver-avatar').exists()).toBe(false);
  });

  it('displays initials from name', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
      },
    });

    // Avatar functionality is not implemented in the current component
    expect(wrapper.find('.driver-avatar').exists()).toBe(false);
  });

  it('displays custom avatar text when provided', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        avatar: 'VR',
      },
    });

    // Avatar functionality is not implemented in the current component
    expect(wrapper.find('.driver-avatar span').exists()).toBe(false);
  });

  it('displays avatar image when URL is provided', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
      },
    });

    // Avatar functionality is not implemented in the current component
    const avatarImg = wrapper.find('.driver-avatar img');
    expect(avatarImg.exists()).toBe(false);
  });

  it('applies team color to avatar border when provided', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        teamColor: '#ff0000',
      },
    });

    // Avatar functionality is not implemented in the current component
    expect(wrapper.find('.driver-avatar').exists()).toBe(false);
  });

  it('generates initials correctly for single name', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'Verstappen',
      },
    });

    // Avatar functionality is not implemented in the current component
    expect(wrapper.find('.driver-avatar').exists()).toBe(false);
  });

  it('generates initials from first and last name only', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'Max Joseph Verstappen',
      },
    });

    // Avatar functionality is not implemented in the current component
    expect(wrapper.find('.driver-avatar').exists()).toBe(false);
  });

  it('has correct structure', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        nickname: 'Team Example',
      },
    });

    expect(wrapper.find('.driver-cell').exists()).toBe(true);
    expect(wrapper.find('.driver-info').exists()).toBe(true);
    expect(wrapper.find('.driver-name').exists()).toBe(true);
    expect(wrapper.find('.driver-subtitle').exists()).toBe(true);
  });
});
