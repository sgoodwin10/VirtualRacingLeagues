import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EditLeagueProgress from './EditLeagueProgress.vue';

describe('EditLeagueProgress', () => {
  it('renders correctly with default values', () => {
    const wrapper = mount(EditLeagueProgress, {
      props: {
        leagueName: '',
        platformCount: 0,
        visibility: 'public',
        mediaCount: 0,
        progressPercentage: 10,
      },
    });

    expect(wrapper.text()).toContain('Completion');
    expect(wrapper.text()).toContain('Name');
    expect(wrapper.text()).toContain('Platforms');
    expect(wrapper.text()).toContain('Visibility');
    expect(wrapper.text()).toContain('Media');
  });

  it('displays league name when provided', () => {
    const wrapper = mount(EditLeagueProgress, {
      props: {
        leagueName: 'Test League',
        platformCount: 2,
        visibility: 'public',
        mediaCount: 1,
        progressPercentage: 50,
      },
    });

    expect(wrapper.text()).toContain('Test League');
  });

  it('truncates long league names', () => {
    const wrapper = mount(EditLeagueProgress, {
      props: {
        leagueName: 'This is a very long league name that should be truncated',
        platformCount: 2,
        visibility: 'public',
        mediaCount: 1,
        progressPercentage: 50,
      },
    });

    // Component truncates at 15 chars + "..."
    expect(wrapper.text()).toContain('This is a very ...');
  });

  it('shows -- when no league name provided', () => {
    const wrapper = mount(EditLeagueProgress, {
      props: {
        leagueName: '',
        platformCount: 0,
        visibility: 'public',
        mediaCount: 0,
        progressPercentage: 10,
      },
    });

    expect(wrapper.text()).toContain('--');
  });

  it('displays platform count correctly', () => {
    const wrapper = mount(EditLeagueProgress, {
      props: {
        leagueName: 'Test League',
        platformCount: 3,
        visibility: 'public',
        mediaCount: 2,
        progressPercentage: 75,
      },
    });

    expect(wrapper.text()).toContain('3');
  });

  it('displays media count in correct format', () => {
    const wrapper = mount(EditLeagueProgress, {
      props: {
        leagueName: 'Test League',
        platformCount: 2,
        visibility: 'public',
        mediaCount: 2,
        progressPercentage: 60,
      },
    });

    expect(wrapper.text()).toContain('2/3');
  });

  it('applies correct styling for complete fields', () => {
    const wrapper = mount(EditLeagueProgress, {
      props: {
        leagueName: 'Test League',
        platformCount: 2,
        visibility: 'public',
        mediaCount: 2,
        progressPercentage: 90,
      },
    });

    // Component uses CSS variable: text-[var(--green)]
    const nameValue = wrapper.find('.text-\\[var\\(--green\\)\\]');
    expect(nameValue.exists()).toBe(true);
  });

  it('updates progress bar width based on percentage', () => {
    const wrapper = mount(EditLeagueProgress, {
      props: {
        leagueName: 'Test League',
        platformCount: 2,
        visibility: 'public',
        mediaCount: 1,
        progressPercentage: 75,
      },
    });

    const progressBar = wrapper.find('.bg-gradient-to-r');
    expect(progressBar.attributes('style')).toContain('width: 75%');
  });

  it('shows visibility in uppercase', () => {
    const wrapper = mount(EditLeagueProgress, {
      props: {
        leagueName: 'Test League',
        platformCount: 2,
        visibility: 'unlisted',
        mediaCount: 1,
        progressPercentage: 50,
      },
    });

    // The component applies uppercase CSS class
    const visibilitySpan = wrapper.find('.uppercase');
    expect(visibilitySpan.exists()).toBe(true);
    expect(visibilitySpan.text().toLowerCase()).toBe('unlisted');
  });
});
