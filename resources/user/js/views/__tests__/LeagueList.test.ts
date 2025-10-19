import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import { createTestRouter, mountWithStubs, flushPromises } from '@user/__tests__/setup';
import LeagueList from '../LeagueList.vue';
import { useLeagueStore } from '@user/stores/leagueStore';
import type { League } from '@user/types/league';

// Mock PrimeVue services
const mockToast = {
  add: vi.fn(),
};

const mockConfirm = {
  require: vi.fn(),
};

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast,
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => mockConfirm,
}));

describe('LeagueList', () => {
  const mockLeagues: League[] = [
    {
      id: 1,
      name: 'Test League 1',
      slug: 'test-league-1',
      visibility: 'public',
      timezone: 'UTC',
      logo_url: 'https://example.com/logo1.jpg',
      header_image_url: 'https://example.com/header1.jpg',
      tagline: 'Best racing league',
      organizer_name: 'John Doe',
      platforms: [
        { id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' },
        { id: 2, name: 'iRacing', slug: 'iracing' },
      ],
    } as League,
    {
      id: 2,
      name: 'Test League 2',
      slug: 'test-league-2',
      visibility: 'private',
      timezone: 'America/New_York',
      logo_url: 'https://example.com/logo2.jpg',
      organizer_name: 'Jane Smith',
      platforms: [{ id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' }],
    } as League,
  ];

  let router: ReturnType<typeof createTestRouter>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockToast.add.mockClear();
    mockConfirm.require.mockClear();

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();

    router = createTestRouter([
      { path: '/leagues', name: 'leagues', component: { template: '<div>Leagues</div>' } },
      {
        path: '/leagues/create',
        name: 'league-create',
        component: { template: '<div>Create</div>' },
      },
      { path: '/leagues/:id', name: 'league-detail', component: { template: '<div>Detail</div>' } },
    ]);

    const leagueStore = useLeagueStore();
    leagueStore.leagues = [];
    leagueStore.fetchLeagues = vi.fn().mockResolvedValue(undefined);
  });

  it('renders page title and description', () => {
    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('My Leagues');
    expect(wrapper.text()).toContain('Manage your racing leagues');
  });

  it('renders Create League button', () => {
    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const createButton = buttons.find((btn) => btn.text() === 'Create League');
    expect(createButton).toBeDefined();
  });

  it('fetches leagues on mount', async () => {
    const leagueStore = useLeagueStore();
    const fetchSpy = vi.spyOn(leagueStore, 'fetchLeagues');

    mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('shows loading state while fetching leagues', () => {
    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    const dataView = wrapper.findComponent({ name: 'DataView' });
    expect(dataView.props('loading')).toBe(true);
  });

  it('displays empty state when no leagues exist', async () => {
    const leagueStore = useLeagueStore();
    leagueStore.leagues = [];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('No leagues yet');
    expect(wrapper.text()).toContain('Get started by creating your first racing league');
  });

  it('displays leagues when they exist', async () => {
    const leagueStore = useLeagueStore();
    leagueStore.leagues = mockLeagues;

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('Test League 1');
    expect(wrapper.text()).toContain('Test League 2');
  });

  it('displays league information correctly', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('Test League 1');
    expect(wrapper.text()).toContain('Best racing league');
    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('UTC');
  });

  it('displays platform information', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('Gran Turismo 7');
  });

  it('displays visibility tag with correct severity', async () => {
    const leagueStore = useLeagueStore();
    leagueStore.leagues = mockLeagues;

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const tags = wrapper.findAllComponents({ name: 'Tag' });
    expect(tags.length).toBeGreaterThan(0);
  });

  it('opens create drawer when Create League button is clicked', async () => {
    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();

    // Initially drawer should be closed
    let drawer = wrapper.findComponent({ name: 'LeagueWizardDrawer' });
    expect(drawer.props('visible')).toBe(false);

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const createButton = buttons.find((btn) => btn.text() === 'Create League');
    await createButton?.trigger('click');
    await nextTick();

    // After clicking, drawer should be visible
    drawer = wrapper.findComponent({ name: 'LeagueWizardDrawer' });
    expect(drawer.props('visible')).toBe(true);
  });

  it('disables Create League button when free tier limit is reached', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league]; // 1 league = at free tier limit

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const createButton = buttons.find((btn) => btn.text() === 'Create League');
    expect(createButton?.props('disabled')).toBe(true);
  });

  it('shows free tier limit notice when limit is reached', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('Free Tier Limit Reached');
    expect(wrapper.text()).toContain('Upgrade your plan to create more leagues');
  });

  it('shows warning toast when trying to create at limit', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const createButton = buttons.find((btn) => btn.text() === 'Create League');
    if (!createButton) throw new Error('Create button not found');
    await createButton.vm.$emit('click');

    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        summary: 'League Limit Reached',
      })
    );
  });

  it('navigates to league detail when View button is clicked', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];
    const routerPushSpy = vi.spyOn(router, 'push');

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const viewButton = buttons.find((btn) => btn.text() === 'View');
    await viewButton?.trigger('click');

    expect(routerPushSpy).toHaveBeenCalledWith('/leagues/1');
  });

  it('shows delete confirmation when Delete button is clicked', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const deleteButton = buttons.find((btn) => btn.text() === 'Delete');
    await deleteButton?.trigger('click');

    expect(mockConfirm.require).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Test League 1'),
        header: 'Delete League',
      })
    );
  });

  it('deletes league when confirmed', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];
    leagueStore.removeLeague = vi.fn().mockResolvedValue(undefined);

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const deleteButton = buttons.find((btn) => btn.text() === 'Delete');
    await deleteButton?.trigger('click');

    // Simulate confirmation
    const confirmCall = mockConfirm.require.mock.calls[0];
    if (!confirmCall) throw new Error('Confirm not called');
    await confirmCall[0].accept();
    await flushPromises();

    expect(leagueStore.removeLeague).toHaveBeenCalledWith(1);
    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Success',
        detail: 'League deleted successfully',
      })
    );
  });

  it('shows error toast when delete fails', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];
    leagueStore.removeLeague = vi.fn().mockRejectedValue(new Error('Network error'));

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const deleteButton = buttons.find((btn) => btn.text() === 'Delete');
    await deleteButton?.trigger('click');

    // Simulate confirmation
    const confirmCall = mockConfirm.require.mock.calls[0];
    if (!confirmCall) throw new Error('Confirm not called');
    await confirmCall[0].accept();
    await flushPromises();

    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete league',
      })
    );
  });

  it('shows error toast when loading leagues fails', async () => {
    const leagueStore = useLeagueStore();
    leagueStore.fetchLeagues = vi.fn().mockRejectedValue(new Error('Network error'));

    mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();

    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load leagues',
      })
    );
  });

  it('displays league logo', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const images = wrapper.findAll('img');
    const logoImage = images.find((img) => img.attributes('alt')?.includes('logo'));
    expect(logoImage).toBeDefined();
    expect(logoImage?.attributes('src')).toBe('https://example.com/logo1.jpg');
  });

  it('displays header image when available', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const images = wrapper.findAll('img');
    const headerImage = images.find(
      (img) => img.attributes('src') === 'https://example.com/header1.jpg'
    );
    expect(headerImage).toBeDefined();
  });

  it('shows gradient background when header image is not available', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[1]; // This league has no header_image_url
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    const html = wrapper.html();
    expect(html).toContain('bg-gradient-to-br');
  });

  it('renders ConfirmDialog component', () => {
    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' });
    expect(confirmDialog.exists()).toBe(true);
  });

  it('handles multiple platforms display', async () => {
    const baseLeague = mockLeagues[0];
    if (!baseLeague) throw new Error('Mock league not found');

    const leagueWithManyPlatforms: League = {
      ...baseLeague,
      platforms: [
        { id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' },
        { id: 2, name: 'iRacing', slug: 'iracing' },
        { id: 3, name: 'Assetto Corsa', slug: 'assetto-corsa' },
        { id: 4, name: 'F1 23', slug: 'f1-23' },
      ],
    };

    const leagueStore = useLeagueStore();
    leagueStore.leagues = [leagueWithManyPlatforms];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    // Should show first 2 platforms and "+2 more"
    expect(wrapper.text()).toContain('+2 more');
  });

  it('handles leagues without tagline', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[1]; // This league has no tagline
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('Test League 2');
    // Should still render without errors
  });

  it('uses DataView for displaying leagues', () => {
    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    const dataView = wrapper.findComponent({ name: 'DataView' });
    expect(dataView.exists()).toBe(true);
    expect(dataView.props('dataKey')).toBe('id');
  });

  it('displays league count in free tier notice', async () => {
    const leagueStore = useLeagueStore();
    const league = mockLeagues[0];
    if (!league) throw new Error('Mock league not found');
    leagueStore.leagues = [league];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('1 league');
  });

  it('opens drawer when "Create Your First League" button is clicked in empty state', async () => {
    const leagueStore = useLeagueStore();
    leagueStore.leagues = [];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    await nextTick();

    // Initially drawer should be closed
    let drawer = wrapper.findComponent({ name: 'LeagueWizardDrawer' });
    expect(drawer.props('visible')).toBe(false);

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const createButton = buttons.find((btn) => btn.text() === 'Create Your First League');
    await createButton?.trigger('click');
    await nextTick();

    // After clicking, drawer should be visible
    drawer = wrapper.findComponent({ name: 'LeagueWizardDrawer' });
    expect(drawer.props('visible')).toBe(true);
  });

  it('reloads leagues when drawer emits league-saved event', async () => {
    const leagueStore = useLeagueStore();
    const fetchSpy = vi.spyOn(leagueStore, 'fetchLeagues');
    leagueStore.leagues = [];

    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    await flushPromises();
    fetchSpy.mockClear(); // Clear the initial fetch call

    const drawer = wrapper.findComponent({ name: 'LeagueWizardDrawer' });
    await drawer.vm.$emit('league-saved');
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('renders LeagueWizardDrawer component', () => {
    const wrapper = mountWithStubs(LeagueList, {
      global: {
        plugins: [router],
      },
    });

    const drawer = wrapper.findComponent({ name: 'LeagueWizardDrawer' });
    expect(drawer.exists()).toBe(true);
  });
});
