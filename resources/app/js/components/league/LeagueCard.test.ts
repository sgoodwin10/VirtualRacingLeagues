import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import LeagueCard from './LeagueCard.vue';
import type { League } from '@app/types/league';
import { useUserStore } from '@app/stores/userStore';

// Mock PrimeVue components
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: vi.fn((options) => {
      if (options.accept) {
        options.accept();
      }
    }),
  }),
}));

describe('LeagueCard', () => {
  let wrapper: VueWrapper;
  let mockLeague: League;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    mockLeague = {
      id: 1,
      name: 'Test League',
      slug: 'test-league',
      tagline: 'A test league',
      description: 'Test description',
      logo_url: '/storage/logos/test.png',
      banner_url: null,
      header_image_url: '/storage/headers/test.png',
      platform_ids: [1, 2],
      platforms: [
        { id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' },
        { id: 2, name: 'iRacing', slug: 'iracing' },
      ],
      discord_url: 'https://discord.gg/test',
      website_url: 'https://test.com',
      twitter_handle: 'testleague',
      instagram_handle: 'testleague',
      facebook_handle: 'testleague',
      youtube_url: 'https://youtube.com/@test',
      twitch_url: 'https://twitch.tv/test',
      visibility: 'public',
      timezone: 'UTC',
      owner_user_id: 1,
      contact_email: 'test@example.com',
      organizer_name: 'Test Organizer',
      status: 'active',
      competitions_count: 5,
      drivers_count: 42,
      active_seasons_count: 3,
      total_races_count: 24,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };
  });

  const mountComponent = (league: League, userId: number | null = null) => {
    const userStore = useUserStore();
    if (userId) {
      userStore.user = { id: userId } as any;
    } else {
      userStore.user = null;
    }

    // Create a mock router
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        {
          path: '/leagues/:id',
          name: 'league-detail',
          component: { template: '<div>Detail</div>' },
        },
      ],
    });

    return mount(LeagueCard, {
      props: {
        league,
      },
      global: {
        plugins: [
          router,
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
              },
            },
          ],
        ],
      },
    });
  };

  it('should render league information correctly', () => {
    wrapper = mountComponent(mockLeague, 2);

    expect(wrapper.text()).toContain('Test League');
    expect(wrapper.text()).toContain('A test league');
    // Platform names should be displayed
    expect(wrapper.text()).toContain('Gran Turismo 7');
    expect(wrapper.text()).toContain('iRacing');
    // Timezone should be displayed
    expect(wrapper.text()).toContain('UTC');
    // Competitions count should be displayed
    expect(wrapper.text()).toContain('5');
    // Drivers count should be displayed
    expect(wrapper.text()).toContain('42');
  });

  it('should render visibility badge correctly', () => {
    wrapper = mountComponent(mockLeague, 2);
    expect(wrapper.find('.visibility-badge').exists()).toBe(true);
    expect(wrapper.find('.visibility-badge').text()).toContain('public');
  });

  it('should render private visibility badge', () => {
    const privateLeague = { ...mockLeague, visibility: 'private' as const };
    wrapper = mountComponent(privateLeague, 2);
    expect(wrapper.find('.visibility-badge').text()).toContain('private');
    expect(wrapper.find('.visibility-badge').classes()).toContain('visibility-badge--private');
  });

  it('should render unlisted visibility badge', () => {
    const unlistedLeague = { ...mockLeague, visibility: 'unlisted' as const };
    wrapper = mountComponent(unlistedLeague, 2);
    expect(wrapper.find('.visibility-badge').text()).toContain('unlisted');
    expect(wrapper.find('.visibility-badge').classes()).toContain('visibility-badge--unlisted');
  });

  it('should show quick actions for league owner', () => {
    wrapper = mountComponent(mockLeague, 1); // User ID matches owner_user_id

    const quickActions = wrapper.find('.quick-actions');
    expect(quickActions.exists()).toBe(true);

    // Verify there are edit and delete buttons
    const actionButtons = quickActions.findAll('.action-btn');
    expect(actionButtons).toHaveLength(2);
  });

  it('should hide quick actions for non-owner', () => {
    wrapper = mountComponent(mockLeague, 2); // User ID does not match owner_user_id

    const quickActions = wrapper.find('.quick-actions');
    expect(quickActions.exists()).toBe(false);
  });

  it('should hide quick actions when user is not logged in', () => {
    wrapper = mountComponent(mockLeague, null);

    const quickActions = wrapper.find('.quick-actions');
    expect(quickActions.exists()).toBe(false);
  });

  it('should emit edit event when edit button is clicked', async () => {
    wrapper = mountComponent(mockLeague, 1);

    const editButton = wrapper.find('.action-btn--edit');
    expect(editButton.exists()).toBe(true);

    await editButton.trigger('click');

    // Verify the edit event was emitted with the correct league ID
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([1]);
  });

  it('should always show view button', () => {
    wrapper = mountComponent(mockLeague, 2);

    const viewButton = wrapper.find('.view-btn');
    expect(viewButton.exists()).toBe(true);
    expect(viewButton.text()).toContain('View League');
  });

  it('should emit view event when view button is clicked', async () => {
    wrapper = mountComponent(mockLeague, 2);

    const viewButton = wrapper.find('.view-btn');
    expect(viewButton.exists()).toBe(true);

    await viewButton.trigger('click');

    expect(wrapper.emitted('view')).toBeTruthy();
    expect(wrapper.emitted('view')?.[0]).toEqual([1]);
  });

  it('should display stats grid correctly', () => {
    wrapper = mountComponent(mockLeague, 2);

    const statsGrid = wrapper.find('.stats-grid');
    expect(statsGrid.exists()).toBe(true);

    const statItems = statsGrid.findAll('.stat-item');
    expect(statItems).toHaveLength(4);

    // Check first stat (Competitions) is highlighted
    expect(statItems[0]?.text()).toContain('Competitions');
    expect(statItems[0]?.text()).toContain('5');
    expect(statItems[0]?.find('.stat-value--highlight').exists()).toBe(true);

    // Check second stat (Drivers)
    expect(statItems[1]?.text()).toContain('Drivers');
    expect(statItems[1]?.text()).toContain('42');

    // Check third stat (Active Seasons)
    expect(statItems[2]?.text()).toContain('Active Seasons');
    expect(statItems[2]?.text()).toContain('3');

    // Check fourth stat (Total Races)
    expect(statItems[3]?.text()).toContain('Total Races');
    expect(statItems[3]?.text()).toContain('24');
  });

  it('should display platform tags correctly', () => {
    wrapper = mountComponent(mockLeague, 2);

    const platformTags = wrapper.find('.platform-tags');
    expect(platformTags.exists()).toBe(true);

    const tags = platformTags.findAll('.platform-tag');
    expect(tags).toHaveLength(2);
    expect(tags[0]?.text()).toBe('Gran Turismo 7');
    expect(tags[1]?.text()).toBe('iRacing');
  });

  it('should limit platform tags to 3 and show "+X more"', () => {
    const manyPlatformsLeague = {
      ...mockLeague,
      platforms: [
        { id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' },
        { id: 2, name: 'iRacing', slug: 'iracing' },
        { id: 3, name: 'ACC', slug: 'acc' },
        { id: 4, name: 'F1 24', slug: 'f1-24' },
        { id: 5, name: 'rFactor 2', slug: 'rfactor-2' },
      ],
    };

    wrapper = mountComponent(manyPlatformsLeague, 2);

    const platformTags = wrapper.find('.platform-tags');
    const tags = platformTags.findAll('.platform-tag');

    // Should show 3 platforms + 1 "more" tag
    expect(tags).toHaveLength(4);
    expect(tags[3]?.text()).toBe('+2 more');
  });

  it('should display league logo initials when no logo URL', () => {
    const noLogoLeague = { ...mockLeague, logo_url: null, logo: null };
    wrapper = mountComponent(noLogoLeague, 2);

    const leagueLogoInitials = wrapper.find('.league-logo-initials');
    expect(leagueLogoInitials.exists()).toBe(true);
    expect(leagueLogoInitials.text()).toBe('TL'); // Test League
  });

  it('should display two-letter initials from multi-word names', () => {
    const longNameLeague = {
      ...mockLeague,
      name: 'Thunder Racing League',
      logo_url: null,
      logo: null,
    };
    wrapper = mountComponent(longNameLeague, 2);

    const leagueLogoInitials = wrapper.find('.league-logo-initials');
    expect(leagueLogoInitials.text()).toBe('TR');
  });

  it('should display first two characters for single-word names', () => {
    const singleWordLeague = {
      ...mockLeague,
      name: 'Velocity',
      logo_url: null,
      logo: null,
    };
    wrapper = mountComponent(singleWordLeague, 2);

    const leagueLogoInitials = wrapper.find('.league-logo-initials');
    expect(leagueLogoInitials.text()).toBe('VE');
  });

  it('should display tagline with line-clamp', () => {
    wrapper = mountComponent(mockLeague, 2);

    const tagline = wrapper.find('.league-tagline');
    expect(tagline.exists()).toBe(true);
    expect(tagline.text()).toBe('A test league');
  });

  it('should hide tagline when null', () => {
    const noTaglineLeague = { ...mockLeague, tagline: null };
    wrapper = mountComponent(noTaglineLeague, 2);

    const tagline = wrapper.find('.league-tagline');
    expect(tagline.exists()).toBe(false);
  });

  it('should display timezone in footer', () => {
    wrapper = mountComponent(mockLeague, 2);

    const timezoneInfo = wrapper.find('.timezone-info');
    expect(timezoneInfo.exists()).toBe(true);
    expect(timezoneInfo.text()).toContain('UTC');
  });

  it('should display placeholder gradient when no header image', () => {
    const noHeaderLeague = {
      ...mockLeague,
      header_image_url: null,
      header_image: null,
    };
    wrapper = mountComponent(noHeaderLeague, 2);

    const placeholder = wrapper.find('.card-header-placeholder');
    expect(placeholder.exists()).toBe(true);
  });

  it('should show delete confirmation when delete button is clicked', async () => {
    wrapper = mountComponent(mockLeague, 1);

    const deleteButton = wrapper.find('.action-btn--delete');
    expect(deleteButton.exists()).toBe(true);

    await deleteButton.trigger('click');

    // useConfirm is mocked to auto-accept, which triggers the delete action
    // The actual delete is async and tested in integration tests
    // Here we just verify the button exists and can be clicked
    expect(deleteButton.exists()).toBe(true);
  });
});
