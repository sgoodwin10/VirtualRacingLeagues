import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RoundsSection from './RoundsSection.vue';
import RoundAccordion from './RoundAccordion.vue';
import VrlAccordion from '@public/components/common/accordions/VrlAccordion.vue';
import type { PublicRound } from '@public/types/public';

describe('RoundsSection', () => {
  const mockRounds: PublicRound[] = [
    {
      id: 1,
      round_number: 1,
      name: 'Season Opener',
      slug: 'season-opener',
      scheduled_at: '2024-03-15T14:00:00Z',
      circuit_name: 'Silverstone',
      circuit_country: 'United Kingdom',
      track_name: null,
      track_layout: 'Grand Prix',
      status: 'completed',
      status_label: 'Completed',
      races: [],
    },
    {
      id: 2,
      round_number: 2,
      name: 'European GP',
      slug: 'european-gp',
      scheduled_at: '2024-03-22T14:00:00Z',
      circuit_name: 'Spa-Francorchamps',
      circuit_country: 'Belgium',
      track_name: null,
      track_layout: null,
      status: 'in_progress',
      status_label: 'In Progress',
      races: [],
    },
  ];

  const defaultProps = {
    rounds: mockRounds,
    hasDivisions: false,
    raceTimesRequired: false,
  };

  describe('Rendering', () => {
    it('should render rounds section container', () => {
      const wrapper = mount(RoundsSection, {
        props: defaultProps,
      });

      const section = wrapper.find('.rounds-section');
      expect(section.exists()).toBe(true);
    });

    it('should render section header', () => {
      const wrapper = mount(RoundsSection, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Race Rounds');
    });

    it('should render VrlAccordion component', () => {
      const wrapper = mount(RoundsSection, {
        props: defaultProps,
      });

      const accordion = wrapper.findComponent(VrlAccordion);
      expect(accordion.exists()).toBe(true);
    });

    it('should render RoundAccordion for each round', () => {
      const wrapper = mount(RoundsSection, {
        props: defaultProps,
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      expect(roundAccordions.length).toBe(2);
    });

    it('should pass round data to RoundAccordion components', () => {
      const wrapper = mount(RoundsSection, {
        props: defaultProps,
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      const firstAccordion = roundAccordions[0];

      expect(firstAccordion?.props('round')).toEqual(mockRounds[0]);
    });

    it('should pass hasDivisions prop to RoundAccordion', () => {
      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          hasDivisions: true,
        },
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      roundAccordions.forEach((accordion) => {
        expect(accordion.props('hasDivisions')).toBe(true);
      });
    });

    it('should pass raceTimesRequired prop to RoundAccordion', () => {
      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          raceTimesRequired: true,
        },
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      roundAccordions.forEach((accordion) => {
        expect(accordion.props('raceTimesRequired')).toBe(true);
      });
    });

    it('should pass correct value prop to each RoundAccordion', () => {
      const wrapper = mount(RoundsSection, {
        props: defaultProps,
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      expect(roundAccordions[0]?.props('value')).toBe('1');
      expect(roundAccordions[1]?.props('value')).toBe('2');
    });

    it('should pass initiallyExpanded as false to all rounds', () => {
      const wrapper = mount(RoundsSection, {
        props: defaultProps,
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      roundAccordions.forEach((accordion) => {
        expect(accordion.props('initiallyExpanded')).toBeFalsy();
      });
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no rounds', () => {
      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          rounds: [],
        },
      });

      expect(wrapper.text()).toContain('No rounds scheduled yet');
    });

    it('should not render VrlAccordion when no rounds', () => {
      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          rounds: [],
        },
      });

      const accordion = wrapper.findComponent(VrlAccordion);
      expect(accordion.exists()).toBe(false);
    });

    it('should not render RoundAccordion components when no rounds', () => {
      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          rounds: [],
        },
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      expect(roundAccordions.length).toBe(0);
    });

    it('should render empty state icon', () => {
      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          rounds: [],
        },
      });

      const emptyState = wrapper.find('.ph-calendar-blank');
      expect(emptyState.exists()).toBe(true);
    });
  });

  describe('Props Handling', () => {
    it('should handle single round', () => {
      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          rounds: [mockRounds[0] as PublicRound],
        },
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      expect(roundAccordions.length).toBe(1);
    });

    it('should handle multiple rounds', () => {
      const manyRounds = Array.from({ length: 10 }, (_, i) => ({
        ...mockRounds[0],
        id: i + 1,
        round_number: i + 1,
        slug: `round-${i + 1}`,
      }));

      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          rounds: manyRounds as PublicRound[],
        },
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      expect(roundAccordions.length).toBe(10);
    });

    it('should correctly pass through hasDivisions false', () => {
      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          hasDivisions: false,
        },
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      roundAccordions.forEach((accordion) => {
        expect(accordion.props('hasDivisions')).toBe(false);
      });
    });

    it('should correctly pass through raceTimesRequired false', () => {
      const wrapper = mount(RoundsSection, {
        props: {
          ...defaultProps,
          raceTimesRequired: false,
        },
      });

      const roundAccordions = wrapper.findAllComponents(RoundAccordion);
      roundAccordions.forEach((accordion) => {
        expect(accordion.props('raceTimesRequired')).toBe(false);
      });
    });
  });

  describe('Computed Properties', () => {
    it('should compute expandedRound as undefined by default', () => {
      const wrapper = mount(RoundsSection, {
        props: defaultProps,
      });

      const accordion = wrapper.findComponent(VrlAccordion);
      expect(accordion.props('modelValue')).toBeUndefined();
    });
  });
});
