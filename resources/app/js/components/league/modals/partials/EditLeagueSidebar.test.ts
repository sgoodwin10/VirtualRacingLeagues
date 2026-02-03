import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EditLeagueSidebar from './EditLeagueSidebar.vue';

describe('EditLeagueSidebar', () => {
  const defaultProps = {
    activeSection: 'basic' as const,
    leagueName: 'Test League',
    platformCount: 2,
    visibility: 'public',
    mediaCount: 1,
    isNameValid: true,
    isPlatformsValid: true,
  };

  it('renders all navigation sections', () => {
    const wrapper = mount(EditLeagueSidebar, {
      props: defaultProps,
    });

    expect(wrapper.text()).toContain('Basic Info');
    expect(wrapper.text()).toContain('Contact');
    expect(wrapper.text()).toContain('Media');
    expect(wrapper.text()).toContain('Social Links');
  });

  it('highlights active section', () => {
    const wrapper = mount(EditLeagueSidebar, {
      props: defaultProps,
    });

    const buttons = wrapper.findAll('button');
    expect(buttons[0]!.classes()).toContain('bg-[var(--cyan-dim)]');
  });

  it('emits change-section event when section is clicked', async () => {
    const wrapper = mount(EditLeagueSidebar, {
      props: defaultProps,
    });

    const buttons = wrapper.findAll('button');
    await buttons[1]!.trigger('click');

    expect(wrapper.emitted('change-section')).toBeTruthy();
    expect(wrapper.emitted('change-section')?.[0]).toEqual(['contact']);
  });

  it('shows required badge on basic info when incomplete', () => {
    const wrapper = mount(EditLeagueSidebar, {
      props: {
        ...defaultProps,
        isNameValid: false,
        isPlatformsValid: false,
      },
    });

    const basicInfoButton = wrapper.findAll('button')[0];
    // PhWarning is rendered as a component, so we check for the badge span
    expect(basicInfoButton!.find('.bg-\\[var\\(--orange-dim\\)\\]').exists()).toBe(true);
  });

  it('shows complete checkmark when basic info is valid', () => {
    const wrapper = mount(EditLeagueSidebar, {
      props: defaultProps,
    });

    const basicInfoButton = wrapper.findAll('button')[0];
    // PhCheckCircle is rendered as a component with green color
    expect(basicInfoButton!.find('.text-\\[var\\(--green\\)\\]').exists()).toBe(true);
  });

  it('renders progress component with correct props', () => {
    const wrapper = mount(EditLeagueSidebar, {
      props: defaultProps,
    });

    const progress = wrapper.findComponent({ name: 'EditLeagueProgress' });
    expect(progress.exists()).toBe(true);
    expect(progress.props('leagueName')).toBe('Test League');
    expect(progress.props('platformCount')).toBe(2);
    expect(progress.props('visibility')).toBe('public');
    expect(progress.props('mediaCount')).toBe(1);
  });

  it('calculates progress percentage correctly', () => {
    const wrapper = mount(EditLeagueSidebar, {
      props: {
        ...defaultProps,
        isNameValid: true,
        isPlatformsValid: true,
        mediaCount: 4, // Base 10 + Name 40 + Platforms 40 + Media (4*3=10, capped at 10) = 100
      },
    });

    const progress = wrapper.findComponent({ name: 'EditLeagueProgress' });
    // Base 10 + Name 40 + Platforms 40 + Media 10 = 100
    expect(progress.props('progressPercentage')).toBe(100);
  });

  it('updates active section styling when prop changes', async () => {
    const wrapper = mount(EditLeagueSidebar, {
      props: defaultProps,
    });

    await wrapper.setProps({ activeSection: 'contact' });

    const buttons = wrapper.findAll('button');
    expect(buttons[0]!.classes()).not.toContain('bg-[var(--cyan-dim)]');
    expect(buttons[1]!.classes()).toContain('bg-[var(--cyan-dim)]');
  });
});
