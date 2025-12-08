import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import PublicLeaguesView from '../PublicLeaguesView.vue';
import { publicApi } from '@public/services/publicApi';
import type { PublicLeague, Platform } from '@public/types/public';

vi.mock('@public/services/publicApi');
const mockedPublicApi = vi.mocked(publicApi);

// Mock router
const mockReplace = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useRoute: () => ({
    query: {},
  }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to'],
  },
}));

describe('PublicLeaguesView', () => {
  const mockPlatforms: Platform[] = [
    { id: 1, name: 'GT7', slug: 'gt7' },
    { id: 2, name: 'iRacing', slug: 'iracing' },
  ];

  const mockLeagues: PublicLeague[] = [
    {
      id: 1,
      name: 'Test League 1',
      slug: 'test-league-1',
      tagline: 'Test tagline 1',
      description: 'Test description 1',
      logo_url: null,
      header_image_url: null,
      platforms: [{ id: 1, name: 'GT7', slug: 'gt7' }],
      discord_url: null,
      website_url: null,
      twitter_handle: null,
      instagram_handle: null,
      youtube_url: null,
      twitch_url: null,
      visibility: 'public',
      competitions_count: 3,
      drivers_count: 24,
    },
    {
      id: 2,
      name: 'Test League 2',
      slug: 'test-league-2',
      tagline: 'Test tagline 2',
      description: 'Test description 2',
      logo_url: null,
      header_image_url: null,
      platforms: [{ id: 2, name: 'iRacing', slug: 'iracing' }],
      discord_url: null,
      website_url: null,
      twitter_handle: null,
      instagram_handle: null,
      youtube_url: null,
      twitch_url: null,
      visibility: 'public',
      competitions_count: 5,
      drivers_count: 48,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockedPublicApi.fetchPlatforms.mockResolvedValue(mockPlatforms);
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: mockLeagues,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 2,
      },
    });
  });

  it('renders the page header', () => {
    const wrapper = mount(PublicLeaguesView);

    const pageHeader = wrapper.findComponent({ name: 'PageHeader' });
    expect(pageHeader.exists()).toBe(true);
    expect(pageHeader.props('title')).toBe('Public Leagues');
    expect(pageHeader.props('label')).toBe('Directory');
    expect(pageHeader.props('description')).toContain('Discover sim racing leagues');
  });

  it('fetches platforms and leagues on mount', async () => {
    mount(PublicLeaguesView);

    await nextTick();
    await nextTick();

    expect(mockedPublicApi.fetchPlatforms).toHaveBeenCalled();
    expect(mockedPublicApi.fetchLeagues).toHaveBeenCalled();
  });

  it('renders league cards when data is loaded', async () => {
    const wrapper = mount(PublicLeaguesView);

    await flushPromises();
    await nextTick();

    const cards = wrapper.findAll('.leagues-grid > *');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows loading state initially', async () => {
    let resolveFn: ((value: any) => void) | undefined;
    mockedPublicApi.fetchPlatforms.mockResolvedValue(mockPlatforms);
    mockedPublicApi.fetchLeagues.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve as (value: any) => void;
        }),
    );

    const wrapper = mount(PublicLeaguesView);

    // Wait for platforms to load first
    await flushPromises();
    await nextTick();

    expect(wrapper.find('.loading-grid').exists()).toBe(true);

    // Cleanup - resolve the promise
    if (resolveFn !== undefined) {
      resolveFn({
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 },
      });
    }
    await flushPromises();
  });

  it('shows empty state when no leagues', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
      },
    });

    const wrapper = mount(PublicLeaguesView);

    await flushPromises();
    await nextTick();

    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-title').text()).toBe('No Leagues Found');
  });

  it('shows error state when fetch fails', async () => {
    mockedPublicApi.fetchLeagues.mockRejectedValue(new Error('Network error'));

    const wrapper = mount(PublicLeaguesView);

    await flushPromises();
    await nextTick();

    expect(wrapper.find('.error-state').exists()).toBe(true);
    expect(wrapper.find('.error-title').text()).toBe('Failed to Load Leagues');
  });

  it('renders VrlSearchBar component', () => {
    const wrapper = mount(PublicLeaguesView);

    const searchBar = wrapper.findComponent({ name: 'VrlSearchBar' });
    expect(searchBar.exists()).toBe(true);
  });

  it('renders VrlFilterChips component', async () => {
    const wrapper = mount(PublicLeaguesView);

    await nextTick();
    await nextTick();

    const filterChips = wrapper.findComponent({ name: 'VrlFilterChips' });
    expect(filterChips.exists()).toBe(true);
  });

  it('renders VrlPagination when totalPages > 1', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: mockLeagues,
      meta: {
        current_page: 1,
        last_page: 3,
        per_page: 12,
        total: 30,
      },
    });

    const wrapper = mount(PublicLeaguesView);

    await flushPromises();
    await nextTick();

    const pagination = wrapper.findComponent({ name: 'VrlPagination' });
    expect(pagination.exists()).toBe(true);
  });

  it('does not render VrlPagination when totalPages <= 1', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: mockLeagues,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 2,
      },
    });

    const wrapper = mount(PublicLeaguesView);

    await flushPromises();
    await nextTick();

    const pagination = wrapper.findComponent({ name: 'VrlPagination' });
    expect(pagination.exists()).toBe(false);
  });

  it('includes "All Platforms" option in filter chips', async () => {
    const wrapper = mount(PublicLeaguesView);

    await flushPromises();
    await nextTick();

    const filterChips = wrapper.findComponent({ name: 'VrlFilterChips' });
    const options = filterChips.props('options');

    expect(options[0]).toEqual({ label: 'All Platforms', value: 'all' });
  });

  it('creates platform filter options from fetched platforms', async () => {
    const wrapper = mount(PublicLeaguesView);

    await flushPromises();
    await nextTick();

    const filterChips = wrapper.findComponent({ name: 'VrlFilterChips' });
    const options = filterChips.props('options');

    expect(options).toHaveLength(3); // All + 2 platforms
    expect(options[1]).toEqual({ label: 'GT7', value: 1 });
    expect(options[2]).toEqual({ label: 'iRacing', value: 2 });
  });
});
