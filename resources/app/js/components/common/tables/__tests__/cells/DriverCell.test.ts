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
        subtitle: '#1 | NED',
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

    expect(wrapper.find('.driver-avatar').exists()).toBe(true);
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

    const avatar = wrapper.find('.driver-avatar');
    expect(avatar.text()).toBe('JD');
  });

  it('displays custom avatar text when provided', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        avatar: 'VR',
      },
    });

    const avatar = wrapper.find('.driver-avatar span');
    expect(avatar.text()).toBe('VR');
  });

  it('displays avatar image when URL is provided', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
      },
    });

    const avatarImg = wrapper.find('.driver-avatar img');
    expect(avatarImg.exists()).toBe(true);
    expect(avatarImg.attributes('src')).toBe('https://example.com/avatar.jpg');
    expect(avatarImg.attributes('alt')).toBe('John Doe');
  });

  it('applies team color to avatar border when provided', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        teamColor: '#ff0000',
      },
    });

    const avatar = wrapper.find('.driver-avatar');
    const style = avatar.attributes('style');
    // Accept either hex or rgb format
    expect(style).toMatch(/border-color:\s*(#ff0000|rgb\(255,\s*0,\s*0\))/i);
  });

  it('generates initials correctly for single name', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'Verstappen',
      },
    });

    const avatar = wrapper.find('.driver-avatar');
    expect(avatar.text()).toBe('VE');
  });

  it('generates initials from first and last name only', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'Max Joseph Verstappen',
      },
    });

    const avatar = wrapper.find('.driver-avatar');
    expect(avatar.text()).toBe('MV');
  });

  it('has correct structure', () => {
    const wrapper = mount(DriverCell, {
      props: {
        name: 'John Doe',
        subtitle: 'Team Example',
      },
    });

    expect(wrapper.find('.driver-cell').exists()).toBe(true);
    expect(wrapper.find('.driver-info').exists()).toBe(true);
    expect(wrapper.find('.driver-name').exists()).toBe(true);
    expect(wrapper.find('.driver-subtitle').exists()).toBe(true);
  });
});
