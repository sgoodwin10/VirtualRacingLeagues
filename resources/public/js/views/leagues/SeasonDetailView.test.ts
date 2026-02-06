import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SeasonDetailView from './SeasonDetailView.vue';
import type { PublicSeasonDetailResponse } from '@public/types/public';

// Mock services
vi.mock('@public/services/leagueService', () => ({
  leagueService: {
    getSeasonDetail: vi.fn(),
  },
}));

// Mock Vue Router
const mockRoute = {
  params: {
    leagueSlug: 'test-league',
    seasonSlug: 'season-1',
  },
  query: {},
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock PrimeVue Toast
const mockToastAdd = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: mockToastAdd,
  }),
}));

// Mock child components
vi.mock('@public/components/landing/BackgroundGrid.vue', () => ({
  default: { name: 'BackgroundGrid', template: '<div class="background-grid"></div>' },
}));
vi.mock('@public/components/landing/SpeedLines.vue', () => ({
  default: { name: 'SpeedLines', template: '<div class="speed-lines"></div>' },
}));
vi.mock('@public/components/leagues/StandingsTable.vue', () => ({
  default: {
    name: 'StandingsTable',
    template: '<div class="standings-table"></div>',
    props: ['seasonId', 'leagueSlug', 'seasonSlug'],
  },
}));
vi.mock('@public/components/leagues/rounds/RoundsSection.vue', () => ({
  default: {
    name: 'RoundsSection',
    template: '<div class="rounds-section"></div>',
    props: ['rounds', 'hasDivisions', 'raceTimesRequired'],
  },
}));
vi.mock('@public/components/common/navigation/VrlBreadcrumbs.vue', () => ({
  default: {
    name: 'VrlBreadcrumbs',
    template: '<div class="breadcrumbs"></div>',
    props: ['items'],
  },
}));
vi.mock('@public/components/common/alerts/VrlAlert.vue', () => ({
  default: {
    name: 'VrlAlert',
    template: '<div class="alert"><slot></slot></div>',
    props: ['type', 'title'],
  },
}));
vi.mock('@public/components/common/loading/VrlSkeleton.vue', () => ({
  default: { name: 'VrlSkeleton', template: '<div class="skeleton"></div>', props: ['class'] },
}));

describe('SeasonDetailView', () => {
  let wrapper: VueWrapper;
  let leagueService: any;

  // Mock data
  const mockSeasonDetail: PublicSeasonDetailResponse = {
    league: {
      name: 'Test League',
      slug: 'test-league',
      logo_url: 'https://example.com/logo.png',
      logo: null,
      header_image_url: null,
      header_image: null,
    },
    competition: {
      name: 'Test Competition',
      slug: 'test-competition',
    },
    season: {
      id: 1,
      name: 'Season 1',
      slug: 'season-1',
      car_class: 'GT3',
      description: 'Test season',
      logo_url: 'https://example.com/season-logo.png',
      logo: null,
      banner_url: null,
      banner: null,
      status: 'active',
      is_active: true,
      is_completed: false,
      race_divisions_enabled: false,
      race_times_required: true,
      stats: {
        total_drivers: 15,
        active_drivers: 15,
        total_rounds: 10,
        completed_rounds: 5,
        total_races: 20,
        completed_races: 10,
      },
    },
    rounds: [
      {
        id: 1,
        round_number: 1,
        name: 'Round 1',
        slug: 'round-1',
        scheduled_at: '2024-01-15T19:00:00Z',
        circuit_name: 'Monza',
        circuit_country: 'Italy',
        track_name: 'Autodromo Nazionale Monza',
        track_layout: 'GP',
        status: 'completed',
        status_label: 'Completed',
        races: [],
      },
      {
        id: 2,
        round_number: 2,
        name: 'Round 2',
        slug: 'round-2',
        scheduled_at: '2024-01-22T19:00:00Z',
        circuit_name: 'Spa',
        circuit_country: 'Belgium',
        track_name: 'Circuit de Spa-Francorchamps',
        track_layout: 'GP',
        status: 'scheduled',
        status_label: 'Scheduled',
        races: [],
      },
    ],
    standings: [],
    has_divisions: false,
    drop_round_enabled: false,
  };

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset route params
    mockRoute.params.leagueSlug = 'test-league';
    mockRoute.params.seasonSlug = 'season-1';

    // Import leagueService mock
    const { leagueService: service } = await import('@public/services/leagueService');
    leagueService = service;

    // Setup default mocks
    leagueService.getSeasonDetail.mockResolvedValue(mockSeasonDetail);
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Component Rendering', () => {
    it('renders background effects', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      expect(wrapper.find('.background-grid').exists()).toBe(true);
      expect(wrapper.find('.speed-lines').exists()).toBe(true);
    });

    it('renders breadcrumbs when data loaded', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const breadcrumbs = wrapper.findComponent({ name: 'VrlBreadcrumbs' });
      expect(breadcrumbs.exists()).toBe(true);
    });

    it('does not render breadcrumbs during loading', async () => {
      leagueService.getSeasonDetail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSeasonDetail), 100)),
      );

      wrapper = mount(SeasonDetailView);
      await wrapper.vm.$nextTick();

      const breadcrumbs = wrapper.findComponent({ name: 'VrlBreadcrumbs' });
      expect(breadcrumbs.exists()).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('shows skeleton placeholders during loading', async () => {
      leagueService.getSeasonDetail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSeasonDetail), 100)),
      );

      wrapper = mount(SeasonDetailView);
      await wrapper.vm.$nextTick();

      const skeletons = wrapper.findAllComponents({ name: 'VrlSkeleton' });
      expect(skeletons.length).toBeGreaterThan(0);
      expect(skeletons).toHaveLength(2);
    });

    it('hides skeleton placeholders after loading completes', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const skeletons = wrapper.findAllComponents({ name: 'VrlSkeleton' });
      expect(skeletons).toHaveLength(0);
    });
  });

  describe('Error State', () => {
    it('shows error alert when fetch fails', async () => {
      leagueService.getSeasonDetail.mockRejectedValue(new Error('Network error'));

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const alert = wrapper.findComponent({ name: 'VrlAlert' });
      expect(alert.exists()).toBe(true);
      expect(alert.props('type')).toBe('error');
    });

    it('shows toast notification on error', async () => {
      leagueService.getSeasonDetail.mockRejectedValue(new Error('Network error'));

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load season details',
        life: 3000,
      });
    });

    it('handles invalid slugs', async () => {
      mockRoute.params.leagueSlug = '';
      mockRoute.params.seasonSlug = '';

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const alert = wrapper.findComponent({ name: 'VrlAlert' });
      expect(alert.exists()).toBe(true);
      expect(alert.text()).toBe('Invalid season');
    });
  });

  describe('Page Header', () => {
    it('renders league logo when available', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const logoImg = wrapper.find('.logo-image-wrapper img');
      expect(logoImg.exists()).toBe(true);
      expect(logoImg.attributes('src')).toBe('https://example.com/logo.png');
      expect(logoImg.attributes('alt')).toContain('Test League');
    });

    it('renders league logo from new media object', async () => {
      const seasonDetailWithMedia = {
        ...mockSeasonDetail,
        league: {
          ...mockSeasonDetail.league,
          logo: {
            original: 'https://example.com/media-logo.png',
            conversions: {},
          },
        },
      };
      leagueService.getSeasonDetail.mockResolvedValue(seasonDetailWithMedia);

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const logoImg = wrapper.find('.logo-image-wrapper img');
      expect(logoImg.exists()).toBe(true);
      expect(logoImg.attributes('src')).toBe('https://example.com/media-logo.png');
    });

    it('renders initials when logo not available', async () => {
      const seasonDetailNoLogo = {
        ...mockSeasonDetail,
        league: {
          ...mockSeasonDetail.league,
          logo_url: null,
          logo: null,
        },
      };
      leagueService.getSeasonDetail.mockResolvedValue(seasonDetailNoLogo);

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const initials = wrapper.find('.league-logo-initials');
      expect(initials.exists()).toBe(true);
      expect(initials.text()).toBe('TL'); // Test League
    });

    it('renders league name', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const leagueName = wrapper.find('.league-name');
      expect(leagueName.exists()).toBe(true);
      expect(leagueName.text()).toBe('Test League');
    });
  });

  describe('Standings Section', () => {
    it('renders standings header', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const standingsHeader = wrapper.find('.standings-header');
      expect(standingsHeader.exists()).toBe(true);
      expect(standingsHeader.text()).toContain('Championship Standings');
    });

    it('renders competition and season name in header', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const standingsTitle = wrapper.find('.standings-title');
      expect(standingsTitle.exists()).toBe(true);
      expect(standingsTitle.text()).toBe('TEST COMPETITION - SEASON 1');
    });

    it('renders season logo when available', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const seasonLogo = wrapper.find('.season-logo-container img');
      expect(seasonLogo.exists()).toBe(true);
      expect(seasonLogo.attributes('src')).toBe('https://example.com/season-logo.png');
      expect(seasonLogo.attributes('alt')).toContain('Season 1');
    });

    it('renders season logo from new media object', async () => {
      const seasonDetailWithMedia = {
        ...mockSeasonDetail,
        season: {
          ...mockSeasonDetail.season,
          logo: {
            original: 'https://example.com/media-season-logo.png',
            conversions: {},
          },
        },
      };
      leagueService.getSeasonDetail.mockResolvedValue(seasonDetailWithMedia);

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const seasonLogo = wrapper.find('.season-logo-container img');
      expect(seasonLogo.exists()).toBe(true);
      expect(seasonLogo.attributes('src')).toBe('https://example.com/media-season-logo.png');
    });

    it('does not render season logo container when logo not available', async () => {
      const seasonDetailNoLogo = {
        ...mockSeasonDetail,
        season: {
          ...mockSeasonDetail.season,
          logo_url: null,
          logo: null,
        },
      };
      leagueService.getSeasonDetail.mockResolvedValue(seasonDetailNoLogo);

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const seasonLogoContainer = wrapper.find('.season-logo-container');
      expect(seasonLogoContainer.exists()).toBe(false);
    });

    it('renders StandingsTable with correct props', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const standingsTable = wrapper.findComponent({ name: 'StandingsTable' });
      expect(standingsTable.exists()).toBe(true);
      expect(standingsTable.props('seasonId')).toBe(1);
      expect(standingsTable.props('leagueSlug')).toBe('test-league');
      expect(standingsTable.props('seasonSlug')).toBe('season-1');
    });
  });

  describe('Rounds Section', () => {
    it('renders RoundsSection with rounds data', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const roundsSection = wrapper.findComponent({ name: 'RoundsSection' });
      expect(roundsSection.exists()).toBe(true);
      expect(roundsSection.props('rounds')).toEqual(mockSeasonDetail.rounds);
    });

    it('passes has_divisions flag to RoundsSection', async () => {
      const seasonDetailWithDivisions = {
        ...mockSeasonDetail,
        has_divisions: true,
      };
      leagueService.getSeasonDetail.mockResolvedValue(seasonDetailWithDivisions);

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const roundsSection = wrapper.findComponent({ name: 'RoundsSection' });
      expect(roundsSection.props('hasDivisions')).toBe(true);
    });

    it('passes race_times_required flag to RoundsSection', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const roundsSection = wrapper.findComponent({ name: 'RoundsSection' });
      expect(roundsSection.props('raceTimesRequired')).toBe(true);
    });

    it('defaults race_times_required to false when undefined', async () => {
      const seasonDetailNoRaceTimes = {
        ...mockSeasonDetail,
        season: {
          ...mockSeasonDetail.season,
          race_times_required: undefined,
        },
      };
      leagueService.getSeasonDetail.mockResolvedValue(seasonDetailNoRaceTimes);

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const roundsSection = wrapper.findComponent({ name: 'RoundsSection' });
      expect(roundsSection.props('raceTimesRequired')).toBe(false);
    });
  });

  describe('Breadcrumbs Computation', () => {
    it('generates correct breadcrumb items', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const breadcrumbs = wrapper.findComponent({ name: 'VrlBreadcrumbs' });
      const items = breadcrumbs.props('items');

      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({ label: 'Leagues', to: '/leagues' });
      expect(items[1]).toEqual({ label: 'Test League', to: '/leagues/test-league' });
      expect(items[2]).toEqual({ label: 'Test Competition - Season 1' });
    });

    it('generates correct routes in breadcrumbs', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const breadcrumbs = wrapper.findComponent({ name: 'VrlBreadcrumbs' });
      const items = breadcrumbs.props('items');

      expect(items[0].to).toBe('/leagues');
      expect(items[1].to).toBe('/leagues/test-league');
      expect(items[2].to).toBeUndefined(); // Current page has no route
    });

    it('generates correct labels in breadcrumbs', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const breadcrumbs = wrapper.findComponent({ name: 'VrlBreadcrumbs' });
      const items = breadcrumbs.props('items');

      expect(items[0].label).toBe('Leagues');
      expect(items[1].label).toBe('Test League');
      expect(items[2].label).toBe('Test Competition - Season 1');
    });
  });

  describe('Logo URL Computation', () => {
    it('prefers new media object for league logo', async () => {
      const seasonDetailWithMedia = {
        ...mockSeasonDetail,
        league: {
          ...mockSeasonDetail.league,
          logo: {
            original: 'https://example.com/media-logo.png',
            conversions: {},
          },
          logo_url: 'https://example.com/old-logo.png',
        },
      };
      leagueService.getSeasonDetail.mockResolvedValue(seasonDetailWithMedia);

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const logoImg = wrapper.find('.logo-image-wrapper img');
      expect(logoImg.attributes('src')).toBe('https://example.com/media-logo.png');
    });

    it('falls back to logo_url when media object not available', async () => {
      const seasonDetailNoMedia = {
        ...mockSeasonDetail,
        league: {
          ...mockSeasonDetail.league,
          logo: null,
          logo_url: 'https://example.com/fallback-logo.png',
        },
      };
      leagueService.getSeasonDetail.mockResolvedValue(seasonDetailNoMedia);

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const logoImg = wrapper.find('.logo-image-wrapper img');
      expect(logoImg.attributes('src')).toBe('https://example.com/fallback-logo.png');
    });

    it('returns null when no logo available', async () => {
      const seasonDetailNoLogo = {
        ...mockSeasonDetail,
        league: {
          ...mockSeasonDetail.league,
          logo: null,
          logo_url: null,
        },
      };
      leagueService.getSeasonDetail.mockResolvedValue(seasonDetailNoLogo);

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      const logoImg = wrapper.find('.logo-image-wrapper img');
      expect(logoImg.exists()).toBe(false);
      const initials = wrapper.find('.league-logo-initials');
      expect(initials.exists()).toBe(true);
    });
  });

  describe('Data Fetching', () => {
    it('fetches season detail on mount', async () => {
      wrapper = mount(SeasonDetailView);
      await flushPromises();

      expect(leagueService.getSeasonDetail).toHaveBeenCalledTimes(1);
      expect(leagueService.getSeasonDetail).toHaveBeenCalledWith('test-league', 'season-1', expect.any(AbortSignal));
    });

    it('uses leagueSlug from route params', async () => {
      mockRoute.params.leagueSlug = 'custom-league';
      mockRoute.params.seasonSlug = 'custom-season';

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      expect(leagueService.getSeasonDetail).toHaveBeenCalledWith('custom-league', 'custom-season', expect.any(AbortSignal));
    });

    it('uses seasonSlug from route params', async () => {
      mockRoute.params.leagueSlug = 'test-league';
      mockRoute.params.seasonSlug = 'season-2';

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      expect(leagueService.getSeasonDetail).toHaveBeenCalledWith('test-league', 'season-2', expect.any(AbortSignal));
    });

    it('handles fetch errors gracefully', async () => {
      leagueService.getSeasonDetail.mockRejectedValue(new Error('Network error'));

      wrapper = mount(SeasonDetailView);
      await flushPromises();

      // Should still render view
      expect(wrapper.find('.season-detail-view').exists()).toBe(true);
      // Error is now handled with Sentry, no console.error expected
    });
  });
});
