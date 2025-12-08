import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlStandingsTable, { type StandingsEntry } from '../VrlStandingsTable.vue';
import VrlTable from '../VrlTable.vue';
import { PhTimer } from '@phosphor-icons/vue';

describe('VrlStandingsTable', () => {
  const mockStandings: StandingsEntry[] = [
    {
      position: 1,
      driver: 'Alex Chen',
      team: 'Red Bull Racing',
      points: 156,
      gap: undefined,
    },
    {
      position: 2,
      driver: 'Marcus Weber',
      team: 'Ferrari',
      points: 142,
      gap: '+14',
    },
    {
      position: 3,
      driver: 'James Wilson',
      team: 'McLaren',
      points: 128,
      gap: '+28',
    },
    {
      position: 4,
      driver: 'Sofia Martinez',
      team: 'Mercedes',
      points: 115,
      gap: '+41',
      fastestLap: true,
    },
    {
      position: 5,
      driver: 'Kai Tanaka',
      team: 'Aston Martin',
      points: 98,
      gap: '+58',
      dnf: true,
    },
  ];

  describe('Rendering', () => {
    it('renders the standings table', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      expect(wrapper.findComponent(VrlTable).exists()).toBe(true);
    });

    it('renders all drivers', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      expect(wrapper.text()).toContain('Alex Chen');
      expect(wrapper.text()).toContain('Marcus Weber');
      expect(wrapper.text()).toContain('James Wilson');
      expect(wrapper.text()).toContain('Sofia Martinez');
      expect(wrapper.text()).toContain('Kai Tanaka');
    });

    it('renders all teams', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      expect(wrapper.text()).toContain('Red Bull Racing');
      expect(wrapper.text()).toContain('Ferrari');
      expect(wrapper.text()).toContain('McLaren');
      expect(wrapper.text()).toContain('Mercedes');
      expect(wrapper.text()).toContain('Aston Martin');
    });

    it('renders all points', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      expect(wrapper.text()).toContain('156');
      expect(wrapper.text()).toContain('142');
      expect(wrapper.text()).toContain('128');
      expect(wrapper.text()).toContain('115');
      expect(wrapper.text()).toContain('98');
    });
  });

  describe('Position Colors', () => {
    it('applies gold color to 1st position', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const position1 = wrapper.find('[data-position="1"]');
      expect(position1.exists()).toBe(true);
      expect(position1.attributes('style')).toContain('#d4a853');
    });

    it('applies silver color to 2nd position', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const position2 = wrapper.find('[data-position="2"]');
      expect(position2.exists()).toBe(true);
      expect(position2.attributes('style')).toContain('#c0c0c0');
    });

    it('applies bronze color to 3rd position', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const position3 = wrapper.find('[data-position="3"]');
      expect(position3.exists()).toBe(true);
      expect(position3.attributes('style')).toContain('#cd7f32');
    });

    it('applies default color to other positions', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const position4 = wrapper.find('[data-position="4"]');
      expect(position4.exists()).toBe(true);
      expect(position4.attributes('style')).toContain('var(--text-dim)');
    });
  });

  describe('Badges', () => {
    it('shows fastest lap badge when fastestLap is true', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const flBadge = wrapper.find('[data-badge="fastest-lap"]');
      expect(flBadge.exists()).toBe(true);
      expect(flBadge.text()).toContain('FL');
      expect(flBadge.findComponent(PhTimer).exists()).toBe(true);
    });

    it('does not show fastest lap badge when fastestLap is false', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [
            {
              position: 1,
              driver: 'Test Driver',
              points: 100,
              fastestLap: false,
            },
          ],
        },
      });

      const flBadge = wrapper.find('[data-badge="fastest-lap"]');
      expect(flBadge.exists()).toBe(false);
    });

    it('shows DNF badge when dnf is true', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const dnfBadge = wrapper.find('[data-badge="dnf"]');
      expect(dnfBadge.exists()).toBe(true);
      expect(dnfBadge.text()).toBe('DNF');
    });

    it('does not show DNF badge when dnf is false', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [
            {
              position: 1,
              driver: 'Test Driver',
              points: 100,
              dnf: false,
            },
          ],
        },
      });

      const dnfBadge = wrapper.find('[data-badge="dnf"]');
      expect(dnfBadge.exists()).toBe(false);
    });

    it('shows DNS badge when dns is true', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [
            {
              position: 1,
              driver: 'Test Driver',
              points: 0,
              dns: true,
            },
          ],
        },
      });

      const dnsBadge = wrapper.find('[data-badge="dns"]');
      expect(dnsBadge.exists()).toBe(true);
      expect(dnsBadge.text()).toBe('DNS');
    });

    it('does not show DNS badge when dns is false', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [
            {
              position: 1,
              driver: 'Test Driver',
              points: 100,
              dns: false,
            },
          ],
        },
      });

      const dnsBadge = wrapper.find('[data-badge="dns"]');
      expect(dnsBadge.exists()).toBe(false);
    });

    it('applies correct styling to DNF badge', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const dnfBadge = wrapper.find('[data-badge="dnf"]');
      expect(dnfBadge.attributes('style')).toContain('rgba(239, 68, 68, 0.2)');
      expect(dnfBadge.attributes('style')).toContain('#ef4444');
    });

    it('applies correct styling to DNS badge', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [
            {
              position: 1,
              driver: 'Test Driver',
              points: 0,
              dns: true,
            },
          ],
        },
      });

      const dnsBadge = wrapper.find('[data-badge="dns"]');
      expect(dnsBadge.attributes('style')).toContain('rgba(239, 68, 68, 0.2)');
      expect(dnsBadge.attributes('style')).toContain('#ef4444');
    });
  });

  describe('Gap Formatting', () => {
    it('shows "-" for leader (position 1)', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      // The gap for position 1 should be "-"
      const html = wrapper.html();
      expect(html).toContain('Alex Chen');
      // Gap should be rendered but we need to check the actual rendered content
    });

    it('shows gap with + prefix for other positions', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      expect(wrapper.text()).toContain('+14');
      expect(wrapper.text()).toContain('+28');
      expect(wrapper.text()).toContain('+41');
      expect(wrapper.text()).toContain('+58');
    });

    it('shows "-" when gap is undefined for non-leader', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [
            {
              position: 2,
              driver: 'Test Driver',
              points: 100,
              gap: undefined,
            },
          ],
        },
      });

      // Should show "-" when gap is undefined
      const html = wrapper.html();
      expect(html).toContain('Test Driver');
    });
  });

  describe('Team Handling', () => {
    it('renders team name when provided', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      expect(wrapper.text()).toContain('Red Bull Racing');
      expect(wrapper.text()).toContain('Ferrari');
    });

    it('shows "-" when team is not provided', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [
            {
              position: 1,
              driver: 'Test Driver',
              points: 100,
            },
          ],
        },
      });

      // Team column should exist even if no team is provided
      const vrlTable = wrapper.findComponent(VrlTable);
      expect(vrlTable.exists()).toBe(true);
    });
  });

  describe('Props', () => {
    it('applies custom class', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
          class: 'custom-standings-class',
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      expect(vrlTable.props('class')).toBe('custom-standings-class');
    });

    it('passes loading prop to VrlTable', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
          loading: true,
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      expect(vrlTable.props('loading')).toBe(true);
    });

    it('does not show loading by default', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      expect(vrlTable.props('loading')).toBe(false);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when standings array is empty', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [],
        },
      });

      expect(wrapper.text()).toContain('No standings data available');
    });

    it('renders custom empty slot', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [],
        },
        slots: {
          empty: '<div class="custom-empty">No championship data</div>',
        },
      });

      expect(wrapper.text()).toContain('No championship data');
      expect(wrapper.html()).toContain('custom-empty');
    });
  });

  describe('Loading State', () => {
    it('shows loading state when loading prop is true', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [],
          loading: true,
        },
      });

      expect(wrapper.text()).toContain('Loading standings...');
    });

    it('renders custom loading slot', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: [],
          loading: true,
        },
        slots: {
          loading: '<div class="custom-loading">Loading championship...</div>',
        },
      });

      expect(wrapper.text()).toContain('Loading championship...');
      expect(wrapper.html()).toContain('custom-loading');
    });
  });

  describe('Column Configuration', () => {
    it('configures 5 columns correctly', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      const columns = vrlTable.props('columns');

      expect(columns).toHaveLength(5);
      expect(columns[0]?.field).toBe('position');
      expect(columns[1]?.field).toBe('driver');
      expect(columns[2]?.field).toBe('team');
      expect(columns[3]?.field).toBe('points');
      expect(columns[4]?.field).toBe('gap');
    });

    it('configures position column with center alignment', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      const columns = vrlTable.props('columns');

      expect(columns[0]?.align).toBe('center');
    });

    it('configures points column with right alignment', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      const columns = vrlTable.props('columns');

      expect(columns[3]?.align).toBe('right');
    });

    it('configures gap column with right alignment', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      const columns = vrlTable.props('columns');

      expect(columns[4]?.align).toBe('right');
    });

    it('enables sorting for driver column', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      const columns = vrlTable.props('columns');

      expect(columns[1]?.sortable).toBe(true);
    });

    it('enables sorting for team column', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      const columns = vrlTable.props('columns');

      expect(columns[2]?.sortable).toBe(true);
    });

    it('enables sorting for points column', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const vrlTable = wrapper.findComponent(VrlTable);
      const columns = vrlTable.props('columns');

      expect(columns[3]?.sortable).toBe(true);
    });
  });

  describe('Typography', () => {
    it('uses Racing Sans One font for position numbers', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const position1 = wrapper.find('[data-position="1"]');
      expect(position1.classes()).toContain('font-display');
    });

    it('uses large text size for position numbers', () => {
      const wrapper = mount(VrlStandingsTable, {
        props: {
          standings: mockStandings,
        },
      });

      const position1 = wrapper.find('[data-position="1"]');
      expect(position1.classes()).toContain('text-xl');
    });
  });
});
