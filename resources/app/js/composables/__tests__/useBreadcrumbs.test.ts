import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useRoute } from 'vue-router';
import { useBreadcrumbs } from '../useBreadcrumbs';
import { useNavigationStore } from '@app/stores/navigationStore';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}));

describe('useBreadcrumbs', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Home Route', () => {
    it('generates breadcrumb for home route', () => {
      vi.mocked(useRoute).mockReturnValue({
        name: 'home',
        params: {},
        meta: { title: 'My Leagues' },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value).toHaveLength(1);
      expect(breadcrumbs.value[0]).toEqual({
        label: 'Home',
        to: undefined, // Home is non-clickable when on home
      });
    });
  });

  describe('League Detail Route', () => {
    it('generates breadcrumbs for league detail page', () => {
      const navigationStore = useNavigationStore();
      navigationStore.leagues = [
        { id: 1, name: 'Test League' } as any,
        { id: 2, name: 'Another League' } as any,
      ];

      vi.mocked(useRoute).mockReturnValue({
        name: 'league-detail',
        params: { id: '1' },
        meta: { title: 'League Details' },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value).toHaveLength(2);
      expect(breadcrumbs.value[0]).toEqual({
        label: 'Home',
        to: { name: 'home' },
      });
      expect(breadcrumbs.value[1]).toEqual({
        label: 'Test League',
      });
    });

    it('shows "League" when league name not found', () => {
      const navigationStore = useNavigationStore();
      navigationStore.leagues = [];

      vi.mocked(useRoute).mockReturnValue({
        name: 'league-detail',
        params: { id: '999' },
        meta: { title: 'League Details' },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value[1]).toEqual({
        label: 'League',
      });
    });
  });

  describe('Season Routes', () => {
    beforeEach(() => {
      const navigationStore = useNavigationStore();
      navigationStore.leagues = [{ id: 1, name: 'Test League' } as any];
      navigationStore.currentCompetition = { name: 'F1 2024' } as any;
      navigationStore.currentSeason = { name: 'Season 1' } as any;
    });

    it('generates breadcrumbs for season rounds page', () => {
      vi.mocked(useRoute).mockReturnValue({
        name: 'season-rounds',
        params: {
          leagueId: '1',
          competitionId: '10',
          seasonId: '20',
        },
        meta: { title: 'Rounds', requiresCompetitionContext: true },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value).toHaveLength(3);
      expect(breadcrumbs.value[0]).toEqual({
        label: 'Home',
        to: { name: 'home' },
      });
      expect(breadcrumbs.value[1]).toEqual({
        label: 'Test League',
        to: { name: 'league-detail', params: { id: '1' } },
      });
      expect(breadcrumbs.value[2]).toEqual({
        label: 'F1 2024 / Season 1',
        to: {
          name: 'season-rounds',
          params: {
            leagueId: '1',
            competitionId: '10',
            seasonId: '20',
          },
        },
      });
    });

    it('generates breadcrumbs for season standings page', () => {
      vi.mocked(useRoute).mockReturnValue({
        name: 'season-standings',
        params: {
          leagueId: '1',
          competitionId: '10',
          seasonId: '20',
        },
        meta: { title: 'Standings', requiresCompetitionContext: true },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value).toHaveLength(4);
      expect(breadcrumbs.value[3]).toEqual({
        label: 'Standings',
      });
    });

    it('generates breadcrumbs for season drivers page', () => {
      vi.mocked(useRoute).mockReturnValue({
        name: 'season-drivers',
        params: {
          leagueId: '1',
          competitionId: '10',
          seasonId: '20',
        },
        meta: { title: 'Drivers', requiresCompetitionContext: true },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value).toHaveLength(4);
      expect(breadcrumbs.value[3]).toEqual({
        label: 'Drivers',
      });
    });

    it('generates breadcrumbs for season divisions-teams page', () => {
      vi.mocked(useRoute).mockReturnValue({
        name: 'season-divisions-teams',
        params: {
          leagueId: '1',
          competitionId: '10',
          seasonId: '20',
        },
        meta: { title: 'Divisions & Teams', requiresCompetitionContext: true },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value).toHaveLength(4);
      expect(breadcrumbs.value[3]).toEqual({
        label: 'Divisions & Teams',
      });
    });

    it('generates breadcrumbs for season status page', () => {
      vi.mocked(useRoute).mockReturnValue({
        name: 'season-status',
        params: {
          leagueId: '1',
          competitionId: '10',
          seasonId: '20',
        },
        meta: { title: 'Season Status', requiresCompetitionContext: true },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value).toHaveLength(4);
      expect(breadcrumbs.value[3]).toEqual({
        label: 'Season Status',
      });
    });

    it('uses fallback names when competition/season data not loaded', () => {
      const navigationStore = useNavigationStore();
      navigationStore.currentCompetition = null;
      navigationStore.currentSeason = null;

      vi.mocked(useRoute).mockReturnValue({
        name: 'season-rounds',
        params: {
          leagueId: '1',
          competitionId: '10',
          seasonId: '20',
        },
        meta: { title: 'Rounds', requiresCompetitionContext: true },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value[2]).toEqual({
        label: 'Competition / Season',
        to: {
          name: 'season-rounds',
          params: {
            leagueId: '1',
            competitionId: '10',
            seasonId: '20',
          },
        },
      });
    });
  });

  describe('Unknown Routes', () => {
    it('uses route meta title for unknown routes', () => {
      vi.mocked(useRoute).mockReturnValue({
        name: 'unknown-route',
        params: {},
        meta: { title: 'Unknown Page' },
      } as any);

      const breadcrumbs = useBreadcrumbs();

      expect(breadcrumbs.value).toHaveLength(2);
      expect(breadcrumbs.value[1]).toEqual({
        label: 'Unknown Page',
      });
    });

    it('does not add extra breadcrumb when route has no title', () => {
      vi.mocked(useRoute).mockReturnValue({
        name: 'unknown-route',
        params: {},
        meta: {},
      } as any);

      const breadcrumbs = useBreadcrumbs();

      // Should only have Home breadcrumb
      expect(breadcrumbs.value).toHaveLength(1);
      expect(breadcrumbs.value[0]).toEqual({
        label: 'Home',
        to: { name: 'home' },
      });
    });
  });

  describe('Reactivity', () => {
    it('updates breadcrumbs when route changes', () => {
      const navigationStore = useNavigationStore();

      // Set up leagues first
      navigationStore.leagues = [{ id: 1, name: 'New League' } as any];

      const mockRoute = {
        name: 'league-detail',
        params: { id: '1' },
        meta: { title: 'League Details' },
      } as any;

      vi.mocked(useRoute).mockReturnValue(mockRoute);

      const breadcrumbs = useBreadcrumbs();

      // Should have Home + League breadcrumbs
      expect(breadcrumbs.value).toHaveLength(2);
      expect(breadcrumbs.value[0]?.label).toBe('Home');
      expect(breadcrumbs.value[1]?.label).toBe('New League');
    });
  });
});
