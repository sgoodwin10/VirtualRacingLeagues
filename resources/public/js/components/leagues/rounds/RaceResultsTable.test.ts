import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RaceResultsTable from './RaceResultsTable.vue';
import VrlPanel from '@public/components/common/panels/VrlPanel.vue';
import type { PublicRace } from '@public/types/public';

describe('RaceResultsTable', () => {
  const mockRace: PublicRace = {
    id: 1,
    race_number: 1,
    name: 'Feature Race',
    race_type: 'feature',
    status: 'completed',
    is_qualifier: false,
    race_points: true,
  };

  const mockQualifying: PublicRace = {
    id: 2,
    race_number: 1,
    name: 'Qualifying',
    race_type: 'qualifying',
    status: 'completed',
    is_qualifier: true,
    race_points: false,
  };

  const defaultProps = {
    race: mockRace,
    roundId: 1,
  };

  describe('Rendering', () => {
    it('should render VrlPanel component', () => {
      const wrapper = mount(RaceResultsTable, {
        props: defaultProps,
      });

      const panel = wrapper.findComponent(VrlPanel);
      expect(panel.exists()).toBe(true);
    });

    it('should render panel with race title', () => {
      const wrapper = mount(RaceResultsTable, {
        props: defaultProps,
      });

      const panel = wrapper.findComponent(VrlPanel);
      expect(panel.props('title')).toBe('Feature Race (Feature)');
    });

    it('should render empty state when no results', () => {
      const wrapper = mount(RaceResultsTable, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Results not available yet');
    });

    it('should render empty state icon', () => {
      const wrapper = mount(RaceResultsTable, {
        props: defaultProps,
      });

      const icon = wrapper.find('.ph-flag-checkered');
      expect(icon.exists()).toBe(true);
    });
  });

  describe('Race Title Computation', () => {
    it('should display race name with race type for feature race', () => {
      const wrapper = mount(RaceResultsTable, {
        props: defaultProps,
      });

      const panel = wrapper.findComponent(VrlPanel);
      expect(panel.props('title')).toBe('Feature Race (Feature)');
    });

    it('should display "Qualifying" type for qualifying race', () => {
      const wrapper = mount(RaceResultsTable, {
        props: {
          race: mockQualifying,
          roundId: 1,
        },
      });

      const panel = wrapper.findComponent(VrlPanel);
      expect(panel.props('title')).toBe('Qualifying (Qualifying)');
    });

    it('should use race number when name is null', () => {
      const raceWithoutName = { ...mockRace, name: null };
      const wrapper = mount(RaceResultsTable, {
        props: {
          race: raceWithoutName,
          roundId: 1,
        },
      });

      const panel = wrapper.findComponent(VrlPanel);
      expect(panel.props('title')).toContain('Race 1');
    });

    it('should display "Sprint" type label correctly', () => {
      const sprintRace = { ...mockRace, race_type: 'sprint' as const };
      const wrapper = mount(RaceResultsTable, {
        props: {
          race: sprintRace,
          roundId: 1,
        },
      });

      const panel = wrapper.findComponent(VrlPanel);
      expect(panel.props('title')).toContain('Sprint');
    });

    it('should display "Endurance" type label correctly', () => {
      const enduranceRace = {
        ...mockRace,
        name: 'Le Mans',
        race_type: 'endurance' as const,
      };
      const wrapper = mount(RaceResultsTable, {
        props: {
          race: enduranceRace,
          roundId: 1,
        },
      });

      const panel = wrapper.findComponent(VrlPanel);
      expect(panel.props('title')).toBe('Le Mans (Endurance)');
    });

    it('should display custom race type as "Race"', () => {
      const customRace = {
        ...mockRace,
        name: 'Special Event',
        race_type: 'custom' as const,
      };
      const wrapper = mount(RaceResultsTable, {
        props: {
          race: customRace,
          roundId: 1,
        },
      });

      const panel = wrapper.findComponent(VrlPanel);
      expect(panel.props('title')).toBe('Special Event (Race)');
    });
  });

  describe('Props Handling', () => {
    it('should accept and use roundId prop', () => {
      const wrapper = mount(RaceResultsTable, {
        props: {
          race: mockRace,
          roundId: 5,
        },
      });

      expect(wrapper.props('roundId')).toBe(5);
    });

    it('should handle different race types', () => {
      const raceTypes: Array<PublicRace['race_type']> = [
        'sprint',
        'feature',
        'endurance',
        'qualifying',
        'custom',
      ];

      raceTypes.forEach((type) => {
        const race = { ...mockRace, race_type: type };
        const wrapper = mount(RaceResultsTable, {
          props: {
            race,
            roundId: 1,
          },
        });

        expect(wrapper.findComponent(VrlPanel).exists()).toBe(true);
      });
    });

    it('should handle qualifier flag correctly', () => {
      const wrapper = mount(RaceResultsTable, {
        props: {
          race: mockQualifying,
          roundId: 1,
        },
      });

      expect(wrapper.props('race').is_qualifier).toBe(true);
    });

    it('should handle race_points flag correctly', () => {
      const wrapper = mount(RaceResultsTable, {
        props: defaultProps,
      });

      expect(wrapper.props('race').race_points).toBe(true);
    });
  });

  describe('Empty State', () => {
    it('should show empty state by default', () => {
      const wrapper = mount(RaceResultsTable, {
        props: defaultProps,
      });

      const emptyState = wrapper.find('.ph-flag-checkered');
      expect(emptyState.exists()).toBe(true);
      expect(wrapper.text()).toContain('Results not available yet');
    });

    it('should have proper empty state styling', () => {
      const wrapper = mount(RaceResultsTable, {
        props: defaultProps,
      });

      const emptyContainer = wrapper.find('.flex.flex-col.items-center');
      expect(emptyContainer.exists()).toBe(true);
    });
  });
});
