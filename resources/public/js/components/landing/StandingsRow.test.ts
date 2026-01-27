import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StandingsRow from './StandingsRow.vue';
import VrlPositionIndicator from '@public/components/common/indicators/VrlPositionIndicator.vue';

describe('StandingsRow', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const wrapper = mount(StandingsRow, {
        props: {
          position: 1,
          initials: 'MV',
          name: 'Max Verstappen',
          team: 'Red Bull Racing',
          points: 256,
        },
        global: {
          stubs: {
            VrlPositionIndicator: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render position indicator', () => {
      const wrapper = mount(StandingsRow, {
        props: {
          position: 1,
          initials: 'MV',
          name: 'Max Verstappen',
          team: 'Red Bull Racing',
          points: 256,
        },
      });

      const positionIndicator = wrapper.findComponent(VrlPositionIndicator);
      expect(positionIndicator.exists()).toBe(true);
      expect(positionIndicator.props('position')).toBe(1);
    });

    it('should render driver name', () => {
      const wrapper = mount(StandingsRow, {
        props: {
          position: 1,
          initials: 'MV',
          name: 'Max Verstappen',
          team: 'Red Bull Racing',
          points: 256,
        },
        global: {
          stubs: {
            VrlPositionIndicator: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Max Verstappen');
    });

    it('should render team name', () => {
      const wrapper = mount(StandingsRow, {
        props: {
          position: 1,
          initials: 'MV',
          name: 'Max Verstappen',
          team: 'Red Bull Racing',
          points: 256,
        },
        global: {
          stubs: {
            VrlPositionIndicator: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Red Bull Racing');
    });

    it('should render points', () => {
      const wrapper = mount(StandingsRow, {
        props: {
          position: 1,
          initials: 'MV',
          name: 'Max Verstappen',
          team: 'Red Bull Racing',
          points: 256,
        },
        global: {
          stubs: {
            VrlPositionIndicator: true,
          },
        },
      });

      expect(wrapper.text()).toContain('256');
    });

    it('should handle different driver data', () => {
      const wrapper = mount(StandingsRow, {
        props: {
          position: 2,
          initials: 'LH',
          name: 'Lewis Hamilton',
          team: 'Mercedes',
          points: 243,
        },
        global: {
          stubs: {
            VrlPositionIndicator: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Mercedes');
      expect(wrapper.text()).toContain('243');
    });
  });
});
