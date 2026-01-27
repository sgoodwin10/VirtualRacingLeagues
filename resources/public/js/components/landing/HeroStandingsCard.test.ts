import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HeroStandingsCard from './HeroStandingsCard.vue';
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
import StandingsRow from './StandingsRow.vue';

describe('HeroStandingsCard', () => {
  const mockStandings = [
    { position: 1, initials: 'MV', name: 'Max Verstappen', team: 'Red Bull Racing', points: 256 },
    { position: 2, initials: 'LH', name: 'Lewis Hamilton', team: 'Mercedes', points: 243 },
    { position: 3, initials: 'CL', name: 'Charles Leclerc', team: 'Ferrari', points: 231 },
  ];

  describe('Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mount(HeroStandingsCard, {
        props: {
          standings: mockStandings,
        },
        global: {
          stubs: {
            VrlBadge: true,
            StandingsRow: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render default title', () => {
      const wrapper = mount(HeroStandingsCard, {
        props: {
          standings: mockStandings,
        },
        global: {
          stubs: {
            VrlBadge: true,
            StandingsRow: true,
          },
        },
      });

      expect(wrapper.text()).toContain('GT4 CHAMPIONSHIP');
    });

    it('should render custom title when provided', () => {
      const wrapper = mount(HeroStandingsCard, {
        props: {
          title: 'F1 CHAMPIONSHIP',
          standings: mockStandings,
        },
        global: {
          stubs: {
            VrlBadge: true,
            StandingsRow: true,
          },
        },
      });

      expect(wrapper.text()).toContain('F1 CHAMPIONSHIP');
    });

    it('should render LIVE badge', () => {
      const wrapper = mount(HeroStandingsCard, {
        props: {
          standings: mockStandings,
        },
        global: {
          stubs: {
            StandingsRow: true,
          },
        },
      });

      const badge = wrapper.findComponent(VrlBadge);
      expect(badge.exists()).toBe(true);
      expect(badge.text()).toBe('LIVE');
    });

    it('should render standings rows for each driver', () => {
      const wrapper = mount(HeroStandingsCard, {
        props: {
          standings: mockStandings,
        },
        global: {
          stubs: {
            VrlBadge: true,
          },
        },
      });

      const rows = wrapper.findAllComponents(StandingsRow);
      expect(rows).toHaveLength(3);
    });

    it('should pass correct props to StandingsRow components', () => {
      const wrapper = mount(HeroStandingsCard, {
        props: {
          standings: mockStandings,
        },
        global: {
          stubs: {
            VrlBadge: true,
          },
        },
      });

      const rows = wrapper.findAllComponents(StandingsRow);
      expect(rows[0]).toBeDefined();
      expect(rows[0]?.props()).toEqual({
        position: 1,
        initials: 'MV',
        name: 'Max Verstappen',
        team: 'Red Bull Racing',
        points: 256,
      });
    });
  });
});
