import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LeagueDetailView from './LeagueDetailView.vue';
import type { PublicLeagueDetailResponse } from '@public/types/public';

// Mock services
vi.mock('@public/services/leagueService', () => ({
  leagueService: {
    getLeagueDetail: vi.fn(),
  },
}));

// Mock Vue Router
const mockRoute = {
  params: {
    leagueSlug: 'test-league',
  },
  query: {},
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: vi.fn(),
  }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to'],
  },
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
vi.mock('@public/components/leagues/LeagueHeader.vue', () => ({
  default: {
    name: 'LeagueHeader',
    template: '<div class="league-header"></div>',
    props: ['league', 'stats'],
  },
}));
vi.mock('@public/components/leagues/CompetitionCard.vue', () => ({
  default: {
    name: 'CompetitionCard',
    template: '<div class="competition-card"></div>',
    props: ['competition', 'leagueSlug'],
  },
}));
vi.mock('@public/components/leagues/LeagueInfoModal.vue', () => ({
  default: {
    name: 'LeagueInfoModal',
    template: '<div class="league-info-modal"></div>',
    props: ['visible', 'league'],
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

describe('LeagueDetailView', () => {
  let wrapper: VueWrapper;
  let leagueService: any;

  // Mock data
  const mockLeagueDetail: PublicLeagueDetailResponse = {
    league: {
      id: 1,
      name: 'Test League',
      slug: 'test-league',
      tagline: 'Test tagline',
      description: 'Test description',
      logo_url: 'https://example.com/logo.png',
      logo: null,
      header_image_url: 'https://example.com/header.jpg',
      header_image: null,
      banner_url: null,
      banner: null,
      platforms: [{ id: 1, name: 'iRacing', slug: 'iracing' }],
      visibility: 'public',
      discord_url: 'https://discord.gg/test',
      website_url: 'https://test.com',
      twitter_handle: '@test',
      facebook_handle: '@test',
      instagram_handle: '@test',
      youtube_url: 'https://youtube.com/test',
      twitch_url: 'https://twitch.tv/test',
      created_at: '2024-01-01T00:00:00Z',
    },
    stats: {
      competitions_count: 3,
      active_seasons_count: 2,
      drivers_count: 25,
    },
    competitions: [
      {
        id: 1,
        name: 'Test Competition 1',
        slug: 'test-competition-1',
        description: 'Test competition description',
        logo_url: 'https://example.com/comp1.png',
        logo: null,
        competition_colour: null,
        platform: { id: 1, name: 'iRacing', slug: 'iracing' },
        stats: {
          total_seasons: 3,
          active_seasons: 1,
          total_drivers: 15,
        },
        seasons: [
          {
            id: 1,
            name: 'Season 1',
            slug: 'season-1',
            car_class: 'GT3',
            status: 'active',
            stats: {
              total_drivers: 15,
              active_drivers: 15,
              total_rounds: 10,
              completed_rounds: 5,
            },
          },
        ],
      },
      {
        id: 2,
        name: 'Test Competition 2',
        slug: 'test-competition-2',
        description: 'Test competition 2 description',
        logo_url: 'https://example.com/comp2.png',
        logo: null,
        competition_colour: null,
        platform: { id: 1, name: 'iRacing', slug: 'iracing' },
        stats: {
          total_seasons: 2,
          active_seasons: 1,
          total_drivers: 10,
        },
        seasons: [],
      },
    ],
    recent_activity: [],
    upcoming_races: [],
    championship_leaders: [],
  };

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset route params
    mockRoute.params.leagueSlug = 'test-league';

    // Import leagueService mock
    const { leagueService: service } = await import('@public/services/leagueService');
    leagueService = service;

    // Setup default mocks
    leagueService.getLeagueDetail.mockResolvedValue(mockLeagueDetail);
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Component Rendering', () => {
    it('renders background effects', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      expect(wrapper.find('.background-grid').exists()).toBe(true);
      expect(wrapper.find('.speed-lines').exists()).toBe(true);
    });

    it('renders back button with correct route', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const backBtn = wrapper.find('.back-btn');
      expect(backBtn.exists()).toBe(true);
      expect(backBtn.text()).toContain('Back to Leagues');
    });
  });

  describe('Loading State', () => {
    it('shows skeleton placeholders during loading', async () => {
      leagueService.getLeagueDetail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLeagueDetail), 100)),
      );

      wrapper = mount(LeagueDetailView);
      await wrapper.vm.$nextTick();

      const skeletons = wrapper.findAllComponents({ name: 'VrlSkeleton' });
      expect(skeletons.length).toBeGreaterThan(0);
      expect(skeletons).toHaveLength(3);
    });

    it('hides skeleton placeholders after loading completes', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const skeletons = wrapper.findAllComponents({ name: 'VrlSkeleton' });
      expect(skeletons).toHaveLength(0);
    });
  });

  describe('Error State', () => {
    it('shows error alert when fetch fails', async () => {
      leagueService.getLeagueDetail.mockRejectedValue(new Error('Network error'));

      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const alert = wrapper.findComponent({ name: 'VrlAlert' });
      expect(alert.exists()).toBe(true);
      expect(alert.props('type')).toBe('error');
    });

    it('displays error message in alert', async () => {
      leagueService.getLeagueDetail.mockRejectedValue(new Error('Network error'));

      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const alert = wrapper.findComponent({ name: 'VrlAlert' });
      expect(alert.text()).toBe('Failed to load league details. Please try again.');
    });

    it('shows toast notification on error', async () => {
      leagueService.getLeagueDetail.mockRejectedValue(new Error('Network error'));

      wrapper = mount(LeagueDetailView);
      await flushPromises();

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load league details',
        life: 3000,
      });
    });

    it('handles missing leagueSlug param', async () => {
      mockRoute.params.leagueSlug = '';

      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const alert = wrapper.findComponent({ name: 'VrlAlert' });
      expect(alert.exists()).toBe(true);
      expect(alert.text()).toBe('Invalid league');
    });
  });

  describe('League Data Rendering', () => {
    it('renders LeagueHeader with correct props', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const header = wrapper.findComponent({ name: 'LeagueHeader' });
      expect(header.exists()).toBe(true);
      expect(header.props('league')).toEqual(mockLeagueDetail.league);
      expect(header.props('stats')).toEqual(mockLeagueDetail.stats);
    });

    it('renders competitions section title', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      expect(wrapper.text()).toContain('COMPETITIONS');
    });

    it('renders CompetitionCard for each competition', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const competitionCards = wrapper.findAllComponents({ name: 'CompetitionCard' });
      expect(competitionCards).toHaveLength(2);
    });

    it('passes correct props to CompetitionCard', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const competitionCards = wrapper.findAllComponents({ name: 'CompetitionCard' });
      expect(competitionCards[0]?.props('competition')).toEqual(mockLeagueDetail.competitions[0]);
      expect(competitionCards[0]?.props('leagueSlug')).toBe('test-league');
      expect(competitionCards[1]?.props('competition')).toEqual(mockLeagueDetail.competitions[1]);
      expect(competitionCards[1]?.props('leagueSlug')).toBe('test-league');
    });
  });

  describe('Empty Competitions State', () => {
    it('shows "No competitions available" message when empty', async () => {
      const emptyLeagueDetail = {
        ...mockLeagueDetail,
        competitions: [],
      };
      leagueService.getLeagueDetail.mockResolvedValue(emptyLeagueDetail);

      wrapper = mount(LeagueDetailView);
      await flushPromises();

      expect(wrapper.text()).toContain('No competitions available');
    });

    it('does not render CompetitionCard when empty', async () => {
      const emptyLeagueDetail = {
        ...mockLeagueDetail,
        competitions: [],
      };
      leagueService.getLeagueDetail.mockResolvedValue(emptyLeagueDetail);

      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const competitionCards = wrapper.findAllComponents({ name: 'CompetitionCard' });
      expect(competitionCards).toHaveLength(0);
    });
  });

  describe('About Modal', () => {
    it('renders LeagueInfoModal', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const modal = wrapper.findComponent({ name: 'LeagueInfoModal' });
      expect(modal.exists()).toBe(true);
    });

    it('passes league data to modal', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const modal = wrapper.findComponent({ name: 'LeagueInfoModal' });
      expect(modal.props('league')).toEqual(mockLeagueDetail.league);
    });

    it('opens modal when LeagueHeader emits open-about', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      const modal = wrapper.findComponent({ name: 'LeagueInfoModal' });
      expect(modal.props('visible')).toBe(false);

      const header = wrapper.findComponent({ name: 'LeagueHeader' });
      await header.vm.$emit('open-about');
      await wrapper.vm.$nextTick();

      expect(modal.props('visible')).toBe(true);
    });

    it('closes modal when visible is set to false', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      // Open modal first
      const header = wrapper.findComponent({ name: 'LeagueHeader' });
      await header.vm.$emit('open-about');
      await wrapper.vm.$nextTick();

      const modal = wrapper.findComponent({ name: 'LeagueInfoModal' });
      expect(modal.props('visible')).toBe(true);

      // Close modal
      await modal.vm.$emit('update:visible', false);
      await wrapper.vm.$nextTick();

      expect(modal.props('visible')).toBe(false);
    });
  });

  describe('Data Fetching', () => {
    it('fetches league detail on mount', async () => {
      wrapper = mount(LeagueDetailView);
      await flushPromises();

      expect(leagueService.getLeagueDetail).toHaveBeenCalledTimes(1);
      expect(leagueService.getLeagueDetail).toHaveBeenCalledWith(
        'test-league',
        expect.any(AbortSignal),
      );
    });

    it('uses leagueSlug from route params', async () => {
      mockRoute.params.leagueSlug = 'custom-league';

      wrapper = mount(LeagueDetailView);
      await flushPromises();

      expect(leagueService.getLeagueDetail).toHaveBeenCalledWith(
        'custom-league',
        expect.any(AbortSignal),
      );
    });

    it('handles fetch errors gracefully', async () => {
      leagueService.getLeagueDetail.mockRejectedValue(new Error('Network error'));

      wrapper = mount(LeagueDetailView);
      await flushPromises();

      // Should still render view
      expect(wrapper.find('.league-detail-view').exists()).toBe(true);
      // Error is now handled with Sentry, no console.error expected
    });
  });
});
