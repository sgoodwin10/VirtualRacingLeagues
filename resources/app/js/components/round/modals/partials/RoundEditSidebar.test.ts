import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RoundEditSidebar from './RoundEditSidebar.vue';

describe('RoundEditSidebar', () => {
  describe('Rendering', () => {
    it('renders all sections', () => {
      const wrapper = mount(RoundEditSidebar, {
        props: {
          activeSection: 'basic',
          hasTrack: false,
          hasSchedule: false,
          hasPointsEnabled: false,
        },
      } as any);

      const buttons = wrapper.findAll('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]!.text()).toContain('Basic Info');
      expect(buttons[1]!.text()).toContain('Points System');
    });

    it('highlights active section', () => {
      const wrapper = mount(RoundEditSidebar, {
        props: {
          activeSection: 'basic',
          hasTrack: false,
          hasSchedule: false,
          hasPointsEnabled: false,
        },
      } as any);

      const buttons = wrapper.findAll('button');
      expect(buttons[0]!.classes()).toContain('bg-[var(--cyan-dim)]');
    });

    it('does not highlight inactive sections', () => {
      const wrapper = mount(RoundEditSidebar, {
        props: {
          activeSection: 'basic',
          hasTrack: false,
          hasSchedule: false,
          hasPointsEnabled: false,
        },
      } as any);

      const buttons = wrapper.findAll('button');
      expect(buttons[1]!.classes()).not.toContain('bg-[var(--cyan-dim)]');
    });
  });

  describe('Events', () => {
    it('emits change-section when basic section is clicked', async () => {
      const wrapper = mount(RoundEditSidebar, {
        props: {
          activeSection: 'points',
          hasTrack: false,
          hasSchedule: false,
          hasPointsEnabled: false,
        },
      } as any);

      const buttons = wrapper.findAll('button');
      await buttons[0]!.trigger('click');

      expect(wrapper.emitted('change-section')).toBeTruthy();
      expect(wrapper.emitted('change-section')?.[0]).toEqual(['basic']);
    });

    it('emits change-section when points section is clicked', async () => {
      const wrapper = mount(RoundEditSidebar, {
        props: {
          activeSection: 'basic',
          hasTrack: false,
          hasSchedule: false,
          hasPointsEnabled: false,
        },
      } as any);

      const buttons = wrapper.findAll('button');
      await buttons[1]!.trigger('click');

      expect(wrapper.emitted('change-section')).toBeTruthy();
      expect(wrapper.emitted('change-section')?.[0]).toEqual(['points']);
    });
  });

  describe('Props', () => {
    it('accepts activeSection prop', () => {
      const wrapper = mount(RoundEditSidebar, {
        props: {
          activeSection: 'points',
          hasTrack: false,
          hasSchedule: false,
          hasPointsEnabled: false,
        },
      } as any);

      expect(wrapper.props('activeSection')).toBe('points');
    });

    it('accepts hasTrack prop', () => {
      const wrapper = mount(RoundEditSidebar, {
        props: {
          activeSection: 'basic',
          hasTrack: true,
          hasSchedule: false,
          hasPointsEnabled: false,
        },
      } as any);

      expect(wrapper.props('hasTrack')).toBe(true);
    });

    it('accepts hasSchedule prop', () => {
      const wrapper = mount(RoundEditSidebar, {
        props: {
          activeSection: 'basic',
          hasTrack: false,
          hasSchedule: true,
          hasPointsEnabled: false,
        },
      } as any);

      expect(wrapper.props('hasSchedule')).toBe(true);
    });

    it('accepts hasPointsEnabled prop', () => {
      const wrapper = mount(RoundEditSidebar, {
        props: {
          activeSection: 'basic',
          hasTrack: false,
          hasSchedule: false,
          hasPointsEnabled: true,
        },
      } as any);

      expect(wrapper.props('hasPointsEnabled')).toBe(true);
    });
  });
});
