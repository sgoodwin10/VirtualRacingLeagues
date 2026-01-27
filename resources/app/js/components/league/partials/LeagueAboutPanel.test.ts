import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueAboutPanel from './LeagueAboutPanel.vue';

describe('LeagueAboutPanel', () => {
  it('renders league name in header', () => {
    const wrapper = mount(LeagueAboutPanel, {
      props: {
        leagueName: 'Test League',
        description: 'Test description',
      },
    });

    expect(wrapper.text()).toContain('About Test League');
  });

  it('renders description when provided', () => {
    const wrapper = mount(LeagueAboutPanel, {
      props: {
        leagueName: 'Test League',
        description: '<p>This is a test description</p>',
      },
    });

    expect(wrapper.html()).toContain('This is a test description');
  });

  it('renders description as HTML', () => {
    const wrapper = mount(LeagueAboutPanel, {
      props: {
        leagueName: 'Test League',
        description: '<p><strong>Bold text</strong></p>',
      },
    });

    const html = wrapper.html();
    expect(html).toContain('<strong>Bold text</strong>');
  });

  it('renders placeholder when description is null', () => {
    const wrapper = mount(LeagueAboutPanel, {
      props: {
        leagueName: 'Test League',
        description: null,
      },
    });

    expect(wrapper.text()).toContain('No description provided');
  });

  it('renders BasePanel component', () => {
    const wrapper = mount(LeagueAboutPanel, {
      props: {
        leagueName: 'Test League',
        description: 'Test',
      },
    });

    expect(wrapper.findComponent({ name: 'BasePanel' }).exists()).toBe(true);
  });
});
