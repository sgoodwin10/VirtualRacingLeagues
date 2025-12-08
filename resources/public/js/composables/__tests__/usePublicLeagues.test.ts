import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePublicLeagues } from '../usePublicLeagues';
import { publicApi } from '@public/services/publicApi';
import type { PublicLeague, Platform } from '@public/types/public';
import { nextTick, createApp } from 'vue';

vi.mock('@public/services/publicApi');
vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useRoute: () => ({
    query: {},
  }),
}));

const mockedPublicApi = vi.mocked(publicApi);

// Helper to mount composable in a component context
function withSetup<T>(composable: () => T): T {
  let result: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  app.mount(document.createElement('div'));
  return result!;
}

describe('usePublicLeagues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('initializes with default values', () => {
    const {
      leagues,
      platforms,
      isLoading,
      error,
      currentPage,
      perPage,
      searchQuery,
      selectedPlatformId,
    } = withSetup(() => usePublicLeagues({ syncWithUrl: false }));

    expect(leagues.value).toEqual([]);
    expect(platforms.value).toEqual([]);
    expect(isLoading.value).toBe(false);
    expect(error.value).toBe(null);
    expect(currentPage.value).toBe(1);
    expect(perPage.value).toBe(12);
    expect(searchQuery.value).toBe('');
    expect(selectedPlatformId.value).toBe(null);
  });

  it('fetches leagues successfully', async () => {
    const mockLeagues: PublicLeague[] = [
      {
        id: 1,
        name: 'Test League',
        slug: 'test-league',
        tagline: 'Test tagline',
        description: 'Test description',
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
    ];

    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: mockLeagues,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 1,
      },
    });

    const { fetchLeagues, leagues, isLoading, totalPages } = withSetup(() =>
      usePublicLeagues({
        syncWithUrl: false,
      }),
    );

    expect(isLoading.value).toBe(false);

    await fetchLeagues();

    expect(isLoading.value).toBe(false);
    expect(leagues.value).toHaveLength(1);
    expect(leagues.value[0]?.name).toBe('Test League');
    expect(totalPages.value).toBe(1);
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Failed to fetch leagues';
    mockedPublicApi.fetchLeagues.mockRejectedValue(new Error(errorMessage));

    const { fetchLeagues, error, leagues } = withSetup(() =>
      usePublicLeagues({ syncWithUrl: false }),
    );

    await fetchLeagues();

    expect(error.value).toBe(errorMessage);
    expect(leagues.value).toEqual([]);
  });

  it('fetches platforms successfully', async () => {
    const mockPlatforms: Platform[] = [
      { id: 1, name: 'GT7', slug: 'gt7' },
      { id: 2, name: 'iRacing', slug: 'iracing' },
    ];

    mockedPublicApi.fetchPlatforms.mockResolvedValue(mockPlatforms);

    const { fetchPlatforms, platforms } = withSetup(() => usePublicLeagues({ syncWithUrl: false }));

    await fetchPlatforms();

    expect(platforms.value).toHaveLength(2);
    expect(platforms.value[0]?.name).toBe('GT7');
  });

  it('handles search and resets to page 1', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
      },
    });

    const { handleSearch, currentPage, searchQuery } = withSetup(() =>
      usePublicLeagues({ syncWithUrl: false }),
    );

    currentPage.value = 3;
    handleSearch('GT7');

    expect(searchQuery.value).toBe('GT7');
    expect(currentPage.value).toBe(1);
  });

  it('handles platform change and resets to page 1', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
      },
    });

    const { handlePlatformChange, currentPage, selectedPlatformId } = withSetup(() =>
      usePublicLeagues({
        syncWithUrl: false,
      }),
    );

    currentPage.value = 3;
    handlePlatformChange(1);

    expect(selectedPlatformId.value).toBe(1);
    expect(currentPage.value).toBe(1);
  });

  it('handles platform change with "all" value', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
      },
    });

    const { handlePlatformChange, selectedPlatformId } = withSetup(() =>
      usePublicLeagues({ syncWithUrl: false }),
    );

    selectedPlatformId.value = 1;
    handlePlatformChange('all');

    expect(selectedPlatformId.value).toBe(null);
  });

  it('handles pagination', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: [],
      meta: {
        current_page: 2,
        last_page: 5,
        per_page: 12,
        total: 50,
      },
    });

    const scrollToSpy = vi.fn();
    global.window.scrollTo = scrollToSpy;

    const { handlePageChange, currentPage } = withSetup(() =>
      usePublicLeagues({ syncWithUrl: false }),
    );

    await handlePageChange(2);

    expect(currentPage.value).toBe(2);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('calculates isEmpty correctly', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
      },
    });

    const { fetchLeagues, isEmpty, isLoading } = withSetup(() =>
      usePublicLeagues({ syncWithUrl: false }),
    );

    await fetchLeagues();
    await nextTick();

    expect(isLoading.value).toBe(false);
    expect(isEmpty.value).toBe(true);
  });

  it('calculates hasResults correctly', async () => {
    const mockLeagues: PublicLeague[] = [
      {
        id: 1,
        name: 'Test League',
        slug: 'test-league',
        tagline: 'Test tagline',
        description: 'Test description',
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
    ];

    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: mockLeagues,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 1,
      },
    });

    const { fetchLeagues, hasResults } = withSetup(() => usePublicLeagues({ syncWithUrl: false }));

    await fetchLeagues();
    await nextTick();

    expect(hasResults.value).toBe(true);
  });

  it('handles per page change', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 24,
        total: 0,
      },
    });

    const { handlePerPageChange, perPage, currentPage } = withSetup(() =>
      usePublicLeagues({ syncWithUrl: false }),
    );

    currentPage.value = 3;
    await handlePerPageChange(24);

    expect(perPage.value).toBe(24);
    expect(currentPage.value).toBe(1);
  });

  it('includes search parameter when query is not empty', async () => {
    vi.useFakeTimers();

    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
      },
    });

    const { handleSearch } = withSetup(() => usePublicLeagues({ syncWithUrl: false }));

    handleSearch('GT7');

    // Advance timers past the debounce delay (300ms)
    vi.advanceTimersByTime(300);
    await nextTick();

    expect(mockedPublicApi.fetchLeagues).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'GT7',
      }),
    );

    vi.useRealTimers();
  });

  it('excludes search parameter when query is empty', async () => {
    mockedPublicApi.fetchLeagues.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
      },
    });

    const { fetchLeagues } = withSetup(() => usePublicLeagues({ syncWithUrl: false }));

    await fetchLeagues();

    expect(mockedPublicApi.fetchLeagues).toHaveBeenCalledWith(
      expect.not.objectContaining({
        search: expect.anything(),
      }),
    );
  });
});
