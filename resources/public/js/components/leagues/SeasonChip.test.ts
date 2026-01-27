import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { RouterLinkStub } from '@vue/test-utils';
import SeasonChip from './SeasonChip.vue';
import type { PublicSeason } from '@public/types/public';

describe('SeasonChip', () => {
  const mockSeason: PublicSeason = {
    id: 1,
    name: 'Season 1 2024',
    slug: 'season-1-2024',
    car_class: 'GT3',
    description: 'Test season',
    logo_url: '',
    logo: null,
    banner_url: null,
    banner: null,
    status: 'active',
    is_active: true,
    is_completed: false,
    race_divisions_enabled: false,
    stats: {
      total_drivers: 30,
      active_drivers: 28,
      total_rounds: 8,
      completed_rounds: 3,
      total_races: 16,
      completed_races: 6,
    },
  };

  const defaultProps = {
    season: mockSeason,
    isCurrent: false,
    leagueSlug: 'test-league',
    competitionSlug: 'gt3-championship',
  };

  describe('Rendering', () => {
    it('should render as router-link', () => {
      const wrapper = mount(SeasonChip, {
        props: defaultProps,
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const link = wrapper.findComponent(RouterLinkStub);
      expect(link.exists()).toBe(true);
    });

    it('should render season name', () => {
      const wrapper = mount(SeasonChip, {
        props: defaultProps,
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      expect(wrapper.text()).toBe('Season 1 2024');
    });

    it('should link to correct season detail route', () => {
      const wrapper = mount(SeasonChip, {
        props: defaultProps,
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const link = wrapper.findComponent(RouterLinkStub);
      expect(link.props('to')).toBe('/leagues/test-league/gt3-championship/season-1-2024');
    });

    it('should apply current season styles when isCurrent is true', () => {
      const wrapper = mount(SeasonChip, {
        props: {
          ...defaultProps,
          isCurrent: true,
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const chip = wrapper.find('.season-chip');
      expect(chip.classes()).toContain('bg-[var(--cyan-dim)]');
      expect(chip.classes()).toContain('border-[var(--cyan)]');
      expect(chip.classes()).toContain('text-[var(--cyan)]');
    });

    it('should apply default styles when isCurrent is false', () => {
      const wrapper = mount(SeasonChip, {
        props: {
          ...defaultProps,
          isCurrent: false,
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const chip = wrapper.find('.season-chip');
      expect(chip.classes()).toContain('bg-[var(--bg-elevated)]');
      expect(chip.classes()).toContain('border-[var(--border)]');
      expect(chip.classes()).toContain('text-[var(--text-secondary)]');
    });

    it('should apply hover styles', () => {
      const wrapper = mount(SeasonChip, {
        props: defaultProps,
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const chip = wrapper.find('.season-chip');
      expect(chip.classes()).toContain('hover:border-[var(--cyan)]');
      expect(chip.classes()).toContain('hover:text-[var(--cyan)]');
    });

    it('should have chip appearance with proper styling', () => {
      const wrapper = mount(SeasonChip, {
        props: defaultProps,
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const chip = wrapper.find('.season-chip');
      expect(chip.classes()).toContain('inline-block');
      expect(chip.classes()).toContain('rounded-[var(--radius)]');
      expect(chip.classes()).toContain('transition-all');
    });
  });

  describe('Props Handling', () => {
    it('should handle different season names', () => {
      const wrapper = mount(SeasonChip, {
        props: {
          ...defaultProps,
          season: { ...mockSeason, name: 'Championship 2025' },
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      expect(wrapper.text()).toBe('Championship 2025');
    });

    it('should construct correct route with different slugs', () => {
      const wrapper = mount(SeasonChip, {
        props: {
          ...defaultProps,
          leagueSlug: 'premium-league',
          competitionSlug: 'formula-series',
          season: { ...mockSeason, slug: 'winter-2024' },
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });

      const link = wrapper.findComponent(RouterLinkStub);
      expect(link.props('to')).toBe('/leagues/premium-league/formula-series/winter-2024');
    });
  });
});
