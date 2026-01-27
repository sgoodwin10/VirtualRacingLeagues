import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueContactPanel from './LeagueContactPanel.vue';

describe('LeagueContactPanel', () => {
  it('renders organizer name', () => {
    const wrapper = mount(LeagueContactPanel, {
      props: {
        organizerName: 'John Doe',
        contactEmail: 'john@example.com',
      },
    });

    expect(wrapper.text()).toContain('John Doe');
  });

  it('renders contact email when provided', () => {
    const wrapper = mount(LeagueContactPanel, {
      props: {
        organizerName: 'John Doe',
        contactEmail: 'john@example.com',
      },
    });

    expect(wrapper.text()).toContain('john@example.com');
  });

  it('renders email as mailto link', () => {
    const wrapper = mount(LeagueContactPanel, {
      props: {
        organizerName: 'John Doe',
        contactEmail: 'john@example.com',
      },
    });

    const emailLink = wrapper.find('a[href="mailto:john@example.com"]');
    expect(emailLink.exists()).toBe(true);
  });

  it('renders placeholder when email is null', () => {
    const wrapper = mount(LeagueContactPanel, {
      props: {
        organizerName: 'John Doe',
        contactEmail: null,
      },
    });

    expect(wrapper.text()).toContain('Not provided');
  });

  it('does not render mailto link when email is null', () => {
    const wrapper = mount(LeagueContactPanel, {
      props: {
        organizerName: 'John Doe',
        contactEmail: null,
      },
    });

    const emailLinks = wrapper.findAll('a[href^="mailto:"]');
    expect(emailLinks).toHaveLength(0);
  });

  it('renders header text', () => {
    const wrapper = mount(LeagueContactPanel, {
      props: {
        organizerName: 'John Doe',
        contactEmail: null,
      },
    });

    expect(wrapper.text()).toContain('Contact Information');
  });

  it('renders BasePanel component', () => {
    const wrapper = mount(LeagueContactPanel, {
      props: {
        organizerName: 'John Doe',
        contactEmail: null,
      },
    });

    expect(wrapper.findComponent({ name: 'BasePanel' }).exists()).toBe(true);
  });
});
