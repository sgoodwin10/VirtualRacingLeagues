import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CompetitionCard from './CompetitionCard.vue';
import SeasonChip from './SeasonChip.vue';
import type { PublicCompetitionDetail } from '@public/types/public';

describe('CompetitionCard', () => {
  const mockCompetition: PublicCompetitionDetail = {
    id: 1,
    name: 'GT3 Championship',
    slug: 'gt3-championship',
    description: 'Elite GT3 racing',
    logo_url: 'https://example.com/logo.png',
    logo: null,
    competition_colour: null,
    platform: { id: 1, name: 'iRacing', slug: 'iracing' },
    stats: {
      total_seasons: 3,
      active_seasons: 1,
      total_drivers: 45,
    },
    seasons: [
      {
        id: 1,
        name: 'Season 1',
        slug: 'season-1',
        car_class: 'GT3',
        status: 'active',
        stats: {
          total_drivers: 30,
          active_drivers: 28,
          total_rounds: 8,
          completed_rounds: 3,
        },
      },
      {
        id: 2,
        name: 'Season 2',
        slug: 'season-2',
        car_class: 'GT3',
        status: 'completed',
        stats: {
          total_drivers: 25,
          active_drivers: 0,
          total_rounds: 10,
          completed_rounds: 10,
        },
      },
    ],
  };

  const defaultProps = {
    competition: mockCompetition,
    leagueSlug: 'test-league',
  };

  describe('Rendering', () => {
    it('should render competition card', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const card = wrapper.find('.competition-card');
      expect(card.exists()).toBe(true);
    });

    it('should render competition name', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const name = wrapper.find('.competition-name');
      expect(name.exists()).toBe(true);
      expect(name.text()).toBe('GT3 Championship');
    });

    it('should render seasons list', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const seasonsList = wrapper.find('.seasons-list');
      expect(seasonsList.exists()).toBe(true);
    });

    it('should render SeasonChip for each season', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const seasonChips = wrapper.findAllComponents(SeasonChip);
      expect(seasonChips.length).toBe(2);
    });

    it('should pass correct season data to SeasonChip', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const seasonChips = wrapper.findAllComponents(SeasonChip);
      const firstChip = seasonChips[0];

      expect(firstChip?.props('season')).toMatchObject({
        id: 1,
        name: 'Season 1',
        slug: 'season-1',
        status: 'active',
      });
      expect(firstChip?.props('isCurrent')).toBe(true);
      expect(firstChip?.props('leagueSlug')).toBe('test-league');
      expect(firstChip?.props('competitionSlug')).toBe('gt3-championship');
    });

    it('should mark active season as current', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const seasonChips = wrapper.findAllComponents(SeasonChip);
      expect(seasonChips[0]?.props('isCurrent')).toBe(true);
      expect(seasonChips[1]?.props('isCurrent')).toBe(false);
    });

    it('should apply hover effect classes', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const card = wrapper.find('.competition-card');
      expect(card.classes()).toContain('hover:border-[var(--cyan)]');
    });
  });

  describe('Season Routing', () => {
    it('should pass correct route components to SeasonChip', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const seasonChips = wrapper.findAllComponents(SeasonChip);
      const firstChip = seasonChips[0];

      expect(firstChip?.props('leagueSlug')).toBe('test-league');
      expect(firstChip?.props('competitionSlug')).toBe('gt3-championship');
      expect(firstChip?.props('season').slug).toBe('season-1');
    });

    it('should use season slug for routing', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const seasonChips = wrapper.findAllComponents(SeasonChip);
      expect(seasonChips[0]?.props('season').slug).toBe('season-1');
      expect(seasonChips[1]?.props('season').slug).toBe('season-2');
    });
  });

  describe('Computed Properties', () => {
    it('should transform PublicSeasonSummary to PublicSeason format', () => {
      const wrapper = mount(CompetitionCard, {
        props: defaultProps,
      });

      const seasonChips = wrapper.findAllComponents(SeasonChip);
      const season = seasonChips[0]?.props('season');

      // Verify required PublicSeason properties are present
      expect(season).toHaveProperty('id');
      expect(season).toHaveProperty('name');
      expect(season).toHaveProperty('slug');
      expect(season).toHaveProperty('car_class');
      expect(season).toHaveProperty('description');
      expect(season).toHaveProperty('logo_url');
      expect(season).toHaveProperty('status');
      expect(season).toHaveProperty('is_active');
      expect(season).toHaveProperty('is_completed');
    });
  });
});
