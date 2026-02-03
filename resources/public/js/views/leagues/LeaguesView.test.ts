import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LeaguesView from './LeaguesView.vue';
import type { LeagueListResponse } from '@public/services/leagueService';
import type { PublicLeague, Platform } from '@public/types/public';

// Mock services
vi.mock('@public/services/leagueService', () => ({
  leagueService: {
    getLeagues: vi.fn(),
    getPlatforms: vi.fn(),
  },
}));

// Mock Vue Router
const mockPush = vi.fn();
const mockRoute = {
  params: {},
  query: {},
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: mockPush,
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
vi.mock('@public/components/leagues/LeagueCard.vue', () => ({
  default: { name: 'LeagueCard', template: '<div class="league-card"></div>', props: ['league'] },
}));
vi.mock('@public/components/leagues/LeagueSearchBar.vue', () => ({
  default: {
    name: 'LeagueSearchBar',
    template: '<div class="league-search-bar"></div>',
    props: ['modelValue', 'platform', 'sortBy', 'platforms'],
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
vi.mock('@public/components/common/loading/VrlSkeletonCard.vue', () => ({
  default: { name: 'VrlSkeletonCard', template: '<div class="skeleton-card"></div>' },
}));
vi.mock('@public/components/common/tables/VrlTablePagination.vue', () => ({
  default: {
    name: 'VrlTablePagination',
    template: '<div class="pagination"></div>',
    props: [
      'currentPage',
      'totalPages',
      'totalItems',
      'itemsPerPage',
      'first',
      'last',
      'entityName',
    ],
  },
}));

describe('LeaguesView', () => {
  let wrapper: VueWrapper;
  let leagueService: any;

  // Mock data
  const mockLeagues: PublicLeague[] = [
    {
      id: 1,
      name: 'Test League 1',
      slug: 'test-league-1',
      tagline: 'Test tagline',
      description: 'Test description',
      logo_url: 'https://example.com/logo1.png',
      logo: null,
      header_image_url: null,
      header_image: null,
      banner_url: null,
      banner: null,
      platforms: [{ id: 1, name: 'iRacing', slug: 'iracing' }],
      discord_url: null,
      website_url: null,
      twitter_handle: null,
      facebook_handle: null,
      instagram_handle: null,
      youtube_url: null,
      twitch_url: null,
      visibility: 'public',
      competitions_count: 3,
      drivers_count: 25,
    },
    {
      id: 2,
      name: 'Test League 2',
      slug: 'test-league-2',
      tagline: 'Test tagline 2',
      description: 'Test description 2',
      logo_url: 'https://example.com/logo2.png',
      logo: null,
      header_image_url: null,
      header_image: null,
      banner_url: null,
      banner: null,
      platforms: [{ id: 2, name: 'Gran Turismo 7', slug: 'gt7' }],
      discord_url: null,
      website_url: null,
      twitter_handle: null,
      facebook_handle: null,
      instagram_handle: null,
      youtube_url: null,
      twitch_url: null,
      visibility: 'public',
      competitions_count: 2,
      drivers_count: 15,
    },
  ];

  const mockPlatforms: Platform[] = [
    { id: 1, name: 'iRacing', slug: 'iracing' },
    { id: 2, name: 'Gran Turismo 7', slug: 'gt7' },
    { id: 3, name: 'Assetto Corsa', slug: 'assetto-corsa' },
  ];

  const mockLeagueListResponse: LeagueListResponse = {
    data: mockLeagues,
    meta: {
      total: 2,
      per_page: 12,
      current_page: 1,
      last_page: 1,
    },
  };

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset route query
    mockRoute.query = {};

    // Import leagueService mock
    const { leagueService: service } = await import('@public/services/leagueService');
    leagueService = service;

    // Setup default mocks
    leagueService.getLeagues.mockResolvedValue(mockLeagueListResponse);
    leagueService.getPlatforms.mockResolvedValue(mockPlatforms);
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Component Rendering', () => {
    it('renders background effects', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(wrapper.find('.background-grid').exists()).toBe(true);
      expect(wrapper.find('.speed-lines').exists()).toBe(true);
    });

    it('renders page header with title and subtitle', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      const pageHeader = wrapper.find('.page-header');
      expect(pageHeader.exists()).toBe(true);
      expect(pageHeader.text()).toContain('LEAGUES');
      expect(pageHeader.text()).toContain(
        'Browse and explore racing leagues from around the world',
      );
    });

    it('renders breadcrumbs', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      const breadcrumbs = wrapper.findComponent({ name: 'VrlBreadcrumbs' });
      expect(breadcrumbs.exists()).toBe(true);
      expect(breadcrumbs.props('items')).toEqual([
        { label: 'Home', to: '/' },
        { label: 'Leagues' },
      ]);
    });

    it('renders LeagueSearchBar with correct props', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      const searchBar = wrapper.findComponent({ name: 'LeagueSearchBar' });
      expect(searchBar.exists()).toBe(true);
      expect(searchBar.props('platforms')).toEqual(mockPlatforms);
      expect(searchBar.props('sortBy')).toBe('popular');
      expect(searchBar.props('platform')).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('shows skeleton cards during loading', async () => {
      leagueService.getLeagues.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLeagueListResponse), 100)),
      );

      wrapper = mount(LeaguesView);
      await wrapper.vm.$nextTick(); // Wait for initial render
      // Don't flush promises yet - we want to see loading state

      const skeletonCards = wrapper.findAllComponents({ name: 'VrlSkeletonCard' });
      expect(skeletonCards).toHaveLength(6);
    });

    it('hides skeleton cards after loading completes', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      const skeletonCards = wrapper.findAllComponents({ name: 'VrlSkeletonCard' });
      expect(skeletonCards).toHaveLength(0);
    });
  });

  describe('Error State', () => {
    it('shows error alert when fetch fails', async () => {
      leagueService.getLeagues.mockRejectedValue(new Error('Network error'));

      wrapper = mount(LeaguesView);
      await flushPromises();

      const alert = wrapper.findComponent({ name: 'VrlAlert' });
      expect(alert.exists()).toBe(true);
      expect(alert.props('type')).toBe('error');
      expect(alert.text()).toContain('Failed to load leagues');
    });

    it('displays error message in alert', async () => {
      leagueService.getLeagues.mockRejectedValue(new Error('Network error'));

      wrapper = mount(LeaguesView);
      await flushPromises();

      const alert = wrapper.findComponent({ name: 'VrlAlert' });
      expect(alert.text()).toBe('Failed to load leagues. Please try again.');
    });

    it('shows toast notification on error', async () => {
      leagueService.getLeagues.mockRejectedValue(new Error('Network error'));

      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load leagues',
        life: 3000,
      });
    });
  });

  describe('Empty State', () => {
    it('shows "No leagues found" message when leagues array is empty', async () => {
      leagueService.getLeagues.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          per_page: 12,
          current_page: 1,
          last_page: 1,
        },
      });

      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(wrapper.text()).toContain('No leagues found');
      expect(wrapper.text()).toContain('Try adjusting your search or filters');
    });

    it('does not show leagues grid when empty', async () => {
      leagueService.getLeagues.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          per_page: 12,
          current_page: 1,
          last_page: 1,
        },
      });

      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(wrapper.find('.leagues-grid').exists()).toBe(false);
    });
  });

  describe('Leagues Grid', () => {
    it('renders LeagueCard for each league', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      const leagueCards = wrapper.findAllComponents({ name: 'LeagueCard' });
      expect(leagueCards).toHaveLength(2);
    });

    it('passes correct data to LeagueCard', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      const leagueCards = wrapper.findAllComponents({ name: 'LeagueCard' });
      expect(leagueCards[0]?.props('league')).toEqual(mockLeagues[0]);
      expect(leagueCards[1]?.props('league')).toEqual(mockLeagues[1]);
    });

    it('renders leagues in grid layout', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      const grid = wrapper.find('.leagues-grid');
      expect(grid.exists()).toBe(true);
      expect(grid.classes()).toContain('grid');
      expect(grid.classes()).toContain('grid-cols-1');
    });
  });

  describe('Pagination', () => {
    it('renders pagination when leagues exist', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      const pagination = wrapper.findComponent({ name: 'VrlTablePagination' });
      expect(pagination.exists()).toBe(true);
    });

    it('passes correct pagination props', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      const pagination = wrapper.findComponent({ name: 'VrlTablePagination' });
      expect(pagination.props('currentPage')).toBe(1);
      expect(pagination.props('totalPages')).toBe(1);
      expect(pagination.props('totalItems')).toBe(2);
      expect(pagination.props('itemsPerPage')).toBe(12);
      expect(pagination.props('entityName')).toBe('leagues');
    });

    it('does not render pagination during loading', async () => {
      leagueService.getLeagues.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLeagueListResponse), 100)),
      );

      wrapper = mount(LeaguesView);

      const pagination = wrapper.findComponent({ name: 'VrlTablePagination' });
      expect(pagination.exists()).toBe(false);
    });

    it('does not render pagination when leagues are empty', async () => {
      leagueService.getLeagues.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          per_page: 12,
          current_page: 1,
          last_page: 1,
        },
      });

      wrapper = mount(LeaguesView);
      await flushPromises();

      const pagination = wrapper.findComponent({ name: 'VrlTablePagination' });
      expect(pagination.exists()).toBe(false);
    });

    it('handles page change event', async () => {
      const mockMultiPageResponse: LeagueListResponse = {
        data: mockLeagues,
        meta: {
          total: 24,
          per_page: 12,
          current_page: 1,
          last_page: 2,
        },
      };

      leagueService.getLeagues.mockResolvedValue(mockMultiPageResponse);

      wrapper = mount(LeaguesView);
      await flushPromises();

      // Mock window.scrollTo
      const scrollToMock = vi.fn();
      window.scrollTo = scrollToMock;

      const pagination = wrapper.findComponent({ name: 'VrlTablePagination' });
      await pagination.vm.$emit('page-change', 2);
      await flushPromises();

      // Should fetch with new page number
      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );
    });

    it('scrolls to top on page change', async () => {
      const mockMultiPageResponse: LeagueListResponse = {
        data: mockLeagues,
        meta: {
          total: 24,
          per_page: 12,
          current_page: 1,
          last_page: 2,
        },
      };

      leagueService.getLeagues.mockResolvedValue(mockMultiPageResponse);

      wrapper = mount(LeaguesView);
      await flushPromises();

      // Mock window.scrollTo
      const scrollToMock = vi.fn();
      window.scrollTo = scrollToMock;

      const pagination = wrapper.findComponent({ name: 'VrlTablePagination' });
      await pagination.vm.$emit('page-change', 2);
      await flushPromises();

      expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('debounces search with 300ms delay', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      // Clear initial calls
      leagueService.getLeagues.mockClear();

      // Trigger search
      const searchBar = wrapper.findComponent({ name: 'LeagueSearchBar' });
      await searchBar.vm.$emit('update:modelValue', 'test');

      // Should not call immediately
      expect(leagueService.getLeagues).not.toHaveBeenCalled();

      // Advance timers by 300ms
      vi.advanceTimersByTime(300);
      await flushPromises();

      // Now it should have been called
      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
        }),
      );
    });

    it('resets to page 1 on search', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      // Clear initial calls
      leagueService.getLeagues.mockClear();

      // Trigger search
      const searchBar = wrapper.findComponent({ name: 'LeagueSearchBar' });
      await searchBar.vm.$emit('update:modelValue', 'test');

      vi.advanceTimersByTime(300);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        }),
      );
    });

    it('fetches with search query', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      leagueService.getLeagues.mockClear();

      const searchBar = wrapper.findComponent({ name: 'LeagueSearchBar' });
      await searchBar.vm.$emit('update:modelValue', 'racing');

      vi.advanceTimersByTime(300);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'racing',
        }),
      );
    });
  });

  describe('Filter Functionality', () => {
    it('fetches when platform filter changes', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      leagueService.getLeagues.mockClear();

      const searchBar = wrapper.findComponent({ name: 'LeagueSearchBar' });
      await searchBar.vm.$emit('update:platform', 1);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 1,
        }),
      );
    });

    it('fetches when sort filter changes', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      leagueService.getLeagues.mockClear();

      const searchBar = wrapper.findComponent({ name: 'LeagueSearchBar' });
      await searchBar.vm.$emit('update:sort-by', 'recent');
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'recent',
        }),
      );
    });

    it('resets to page 1 on platform change', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      leagueService.getLeagues.mockClear();

      const searchBar = wrapper.findComponent({ name: 'LeagueSearchBar' });
      await searchBar.vm.$emit('update:platform', 2);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        }),
      );
    });

    it('resets to page 1 on sort change', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      leagueService.getLeagues.mockClear();

      const searchBar = wrapper.findComponent({ name: 'LeagueSearchBar' });
      await searchBar.vm.$emit('update:sort-by', 'name');
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        }),
      );
    });
  });

  describe('Data Fetching', () => {
    it('fetches leagues on mount', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledTimes(1);
    });

    it('fetches platforms on mount', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(leagueService.getPlatforms).toHaveBeenCalledTimes(1);
    });

    it('fetches leagues and platforms in parallel', async () => {
      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalled();
      expect(leagueService.getPlatforms).toHaveBeenCalled();
    });

    it('parses page query param on mount', async () => {
      mockRoute.query = { page: '2' };

      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );
    });

    it('parses search query param on mount', async () => {
      mockRoute.query = { search: 'racing' };

      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'racing',
        }),
      );
    });

    it('parses platform query param on mount', async () => {
      mockRoute.query = { platform: '1' };

      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 1,
        }),
      );
    });

    it('parses sort query param on mount', async () => {
      mockRoute.query = { sort: 'recent' };

      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'recent',
        }),
      );
    });

    it('ignores invalid page query param', async () => {
      mockRoute.query = { page: '-1' };

      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1, // Should use default
        }),
      );
    });

    it('ignores invalid sort query param', async () => {
      mockRoute.query = { sort: 'invalid' };

      wrapper = mount(LeaguesView);
      await flushPromises();

      expect(leagueService.getLeagues).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'popular', // Should use default
        }),
      );
    });

    it('handles platform fetch error gracefully', async () => {
      leagueService.getPlatforms.mockRejectedValue(new Error('Network error'));

      // Console.error will be called but should not throw
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      wrapper = mount(LeaguesView);
      await flushPromises();

      // Should still render successfully
      expect(wrapper.find('.leagues-view').exists()).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
