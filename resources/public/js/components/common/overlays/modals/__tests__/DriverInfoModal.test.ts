import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import DriverInfoModal from '../DriverInfoModal.vue';
import { publicApi } from '@public/services/publicApi';
import type { PublicDriverProfile } from '@public/types/public';

// Mock the publicApi service
vi.mock('@public/services/publicApi', () => ({
  publicApi: {
    fetchDriverProfile: vi.fn(),
  },
}));

// Create a mock router for testing
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/leagues/:leagueSlug/seasons/:seasonSlug',
        name: 'season-view',
        component: { template: '<div>Season View</div>' },
      },
    ],
  });
};

describe('DriverInfoModal', () => {
  const mockDriverProfile: PublicDriverProfile = {
    nickname: 'TestDriver',
    driver_number: 44,
    platform_accounts: {
      psn_id: 'test_psn',
      discord_id: 'test_discord#1234',
      iracing_id: 'test_iracing',
    },
    career_stats: {
      total_poles: 5,
      total_podiums: 12,
    },
    competitions: [
      {
        league_name: 'Test League',
        league_slug: 'test-league',
        season_name: 'Season 1',
        season_slug: 'season-1',
        status: 'active',
      },
      {
        league_name: 'Another League',
        league_slug: 'another-league',
        season_name: 'Season 2',
        season_slug: 'season-2',
        status: 'reserve',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when fetching data', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('.driver-info-loading').exists()).toBe(true);
    expect(wrapper.find('.driver-info-loading-text').text()).toBe('Loading driver profile...');
  });

  it('renders error state when fetch fails', async () => {
    const errorMessage = 'Failed to fetch driver profile';
    vi.mocked(publicApi.fetchDriverProfile).mockRejectedValue(new Error(errorMessage));

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('.driver-info-error').exists()).toBe(true);
    expect(wrapper.find('.driver-info-error-text').text()).toBe(errorMessage);
  });

  it('renders driver profile when data is loaded', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('.driver-info-content').exists()).toBe(true);
    expect(wrapper.find('.driver-info-name').text()).toBe('TestDriver');
    expect(wrapper.find('.driver-info-number').text()).toBe('44');
  });

  it('renders career stats correctly', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    const statCards = wrapper.findAll('.driver-info-stat-card');
    expect(statCards).toHaveLength(2);

    const statValues = wrapper.findAll('.driver-info-stat-value');
    expect(statValues[0]?.text()).toBe('5'); // Poles
    expect(statValues[1]?.text()).toBe('12'); // Podiums
  });

  it('renders platform accounts when available', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    const platforms = wrapper.findAll('.driver-info-platform');
    expect(platforms).toHaveLength(3); // Discord, PSN, iRacing

    const platformValues = wrapper.findAll('.driver-info-platform-value');
    expect(platformValues[0]?.text()).toBe('test_discord#1234');
    expect(platformValues[1]?.text()).toBe('test_psn');
    expect(platformValues[2]?.text()).toBe('test_iracing');
  });

  it('hides platform accounts section when none are available', async () => {
    const driverWithoutAccounts: PublicDriverProfile = {
      ...mockDriverProfile,
      platform_accounts: {},
    };
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(driverWithoutAccounts);

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    const platforms = wrapper.findAll('.driver-info-platform');
    expect(platforms).toHaveLength(0);
  });

  it('renders competitions list', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    const competitions = wrapper.findAll('.driver-info-competition');
    expect(competitions).toHaveLength(2);

    const leagueNames = wrapper.findAll('.driver-info-competition-league');
    expect(leagueNames[0]?.text()).toBe('Test League');
    expect(leagueNames[1]?.text()).toBe('Another League');

    const seasonNames = wrapper.findAll('.driver-info-competition-season');
    expect(seasonNames[0]?.text()).toBe('Season 1');
    expect(seasonNames[1]?.text()).toBe('Season 2');
  });

  it('navigates to season when competition is clicked', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    const pushSpy = vi.spyOn(router, 'push');

    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    const firstCompetition = wrapper.find('.driver-info-competition');
    await firstCompetition.trigger('click');

    expect(pushSpy).toHaveBeenCalledWith({
      name: 'season-view',
      params: {
        leagueSlug: 'test-league',
        seasonSlug: 'season-1',
      },
    });
  });

  it('emits update:modelValue when closed', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    // Find VrlModal and trigger its close event
    const modal = wrapper.findComponent({ name: 'VrlModal' });
    await modal.vm.$emit('update:modelValue', false);

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('fetches driver data when modal opens', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: false,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(publicApi.fetchDriverProfile).not.toHaveBeenCalled();

    await wrapper.setProps({ modelValue: true });
    await flushPromises();

    expect(publicApi.fetchDriverProfile).toHaveBeenCalledWith(123, expect.any(AbortSignal));
  });

  it('handles driver without number', async () => {
    const driverWithoutNumber: PublicDriverProfile = {
      ...mockDriverProfile,
      driver_number: null,
    };
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(driverWithoutNumber);

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('.driver-info-number').exists()).toBe(false);
  });

  it('renders correct status badge variants', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    const wrapper = mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    const badges = wrapper.findAllComponents({ name: 'VrlBadge' });
    expect(badges).toHaveLength(2);

    // First competition is 'active' - should use 'active' variant
    expect(badges[0]?.props('variant')).toBe('active');
    expect(badges[0]?.props('label')).toBe('active');

    // Second competition is 'reserve' - should use 'upcoming' variant
    expect(badges[1]?.props('variant')).toBe('upcoming');
    expect(badges[1]?.props('label')).toBe('reserve');
  });

  it('does not fetch when seasonDriverId is null', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    mount(DriverInfoModal, {
      props: {
        modelValue: true,
        seasonDriverId: null,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await flushPromises();

    expect(publicApi.fetchDriverProfile).not.toHaveBeenCalled();
  });
});
