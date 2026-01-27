import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TeamCell from './TeamCell.vue';

describe('TeamCell', () => {
  it('renders team name', () => {
    const wrapper = mount(TeamCell, {
      props: {
        name: 'Red Bull Racing',
      },
    });

    expect(wrapper.text()).toContain('Red Bull Racing');
  });

  it('displays color dot when color is provided', () => {
    const wrapper = mount(TeamCell, {
      props: {
        name: 'Red Bull Racing',
        color: '#0600ef',
      },
    });

    const dot = wrapper.find('.dot');
    expect(dot.exists()).toBe(true);
    const style = dot.attributes('style');
    // Accept either hex or rgb format
    expect(style).toMatch(/background-color:\s*(#0600ef|rgb\(6,\s*0,\s*239\))/i);
  });

  it('does not display dot when color is not provided', () => {
    const wrapper = mount(TeamCell, {
      props: {
        name: 'Red Bull Racing',
      },
    });

    expect(wrapper.find('.dot').exists()).toBe(false);
  });

  it('displays team logo when logo URL is provided', () => {
    const wrapper = mount(TeamCell, {
      props: {
        name: 'Red Bull Racing',
        logo: 'https://example.com/logo.png',
      },
    });

    const logo = wrapper.find('.team-logo');
    expect(logo.exists()).toBe(true);
    expect(logo.attributes('src')).toBe('https://example.com/logo.png');
    expect(logo.attributes('alt')).toBe('Red Bull Racing');
  });

  it('prioritizes logo over color dot', () => {
    const wrapper = mount(TeamCell, {
      props: {
        name: 'Red Bull Racing',
        color: '#0600ef',
        logo: 'https://example.com/logo.png',
      },
    });

    expect(wrapper.find('.team-logo').exists()).toBe(true);
    expect(wrapper.find('.dot').exists()).toBe(false);
  });

  it('has correct structure', () => {
    const wrapper = mount(TeamCell, {
      props: {
        name: 'Red Bull Racing',
        color: '#0600ef',
      },
    });

    expect(wrapper.find('.team-indicator').exists()).toBe(true);
  });
});
