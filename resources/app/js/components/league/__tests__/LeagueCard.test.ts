import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import LeagueCard from '../LeagueCard.vue';
import type { League } from '@app/types/league';
import { useUserStore } from '@app/stores/userStore';

// Mock PrimeVue components
vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template:
      '<div><slot name="header"></slot><slot name="title"></slot><slot name="content"></slot><slot name="footer"></slot></div>',
  },
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span>{{ value }}</span>',
    props: ['value', 'severity'],
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button @click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
    props: ['label', 'icon', 'severity', 'text', 'variant', 'class'],
  },
}));

vi.mock('primevue/buttongroup', () => ({
  default: {
    name: 'ButtonGroup',
    template: '<div class="button-group"><slot></slot></div>',
  },
}));

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
        plugins: [router],
      },
    });
  };

  it('should render league information correctly', () => {
    wrapper = mountComponent(mockLeague, 2);

    expect(wrapper.text()).toContain('Test League');
    expect(wrapper.text()).toContain('A test league');
    // Platform names should be displayed
    expect(wrapper.text()).toContain('Gran Turismo 7, iRacing');
    // Timezone should be displayed
    expect(wrapper.text()).toContain('UTC');
    // Competitions count should be displayed
    expect(wrapper.text()).toContain('5 Competitions');
    // Drivers count should be displayed
    expect(wrapper.text()).toContain('42 Drivers');
  });

  it('should show edit button for league owner', () => {
    wrapper = mountComponent(mockLeague, 1); // User ID matches owner_user_id

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const editButton = buttons.find((btn) => btn.props('icon') === 'pi pi-pencil');

    expect(editButton).toBeDefined();
    expect(editButton?.exists()).toBe(true);
  });

  it('should hide edit button for non-owner', () => {
    wrapper = mountComponent(mockLeague, 2); // User ID does not match owner_user_id

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const editButton = buttons.find((btn) => btn.props('icon') === 'pi pi-pencil');

    expect(editButton).toBeUndefined();
  });

  it('should hide edit button when user is not logged in', () => {
    wrapper = mountComponent(mockLeague, null);

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const editButton = buttons.find((btn) => btn.props('icon') === 'pi pi-pencil');

    expect(editButton).toBeUndefined();
  });

  it('should emit edit event when edit button is clicked', async () => {
    wrapper = mountComponent(mockLeague, 1);

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const editButton = buttons.find((btn) => btn.props('icon') === 'pi pi-pencil');

    expect(editButton).toBeDefined();

    if (editButton) {
      await editButton.trigger('click');

      // Verify the edit event was emitted with the correct league ID
      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([1]);
    }
  });

  it('should show delete button for league owner', () => {
    wrapper = mountComponent(mockLeague, 1);

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const deleteButton = buttons.find((btn) => btn.props('icon') === 'pi pi-trash');

    expect(deleteButton).toBeDefined();
    expect(deleteButton?.exists()).toBe(true);
  });

  it('should hide delete button for non-owner', () => {
    wrapper = mountComponent(mockLeague, 2);

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const deleteButton = buttons.find((btn) => btn.props('icon') === 'pi pi-trash');

    expect(deleteButton).toBeUndefined();
  });

  it('should always show view button', () => {
    wrapper = mountComponent(mockLeague, 2);

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const viewButton = buttons.find((btn) => btn.props('label') === 'View');

    expect(viewButton).toBeDefined();
    expect(viewButton?.exists()).toBe(true);
  });

  it('should emit view event when view button is clicked', async () => {
    wrapper = mountComponent(mockLeague, 2);

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const viewButton = buttons.find((btn) => btn.props('label') === 'View');

    expect(viewButton).toBeDefined();

    if (viewButton) {
      await viewButton.trigger('click');

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([1]);
    }
  });

  it('should display competitions count with correct pluralization', () => {
    wrapper = mountComponent(mockLeague, 2);
    expect(wrapper.text()).toContain('5 Competitions');

    // Test singular
    const singleCompetitionLeague = { ...mockLeague, competitions_count: 1 };
    wrapper = mountComponent(singleCompetitionLeague, 2);
    expect(wrapper.text()).toContain('1 Competition');
  });

  it('should display drivers count with correct pluralization', () => {
    wrapper = mountComponent(mockLeague, 2);
    expect(wrapper.text()).toContain('42 Drivers');

    // Test singular
    const singleDriverLeague = { ...mockLeague, drivers_count: 1 };
    wrapper = mountComponent(singleDriverLeague, 2);
    expect(wrapper.text()).toContain('1 Driver');
  });

  it('should display zero counts correctly', () => {
    const emptyLeague = { ...mockLeague, competitions_count: 0, drivers_count: 0 };
    wrapper = mountComponent(emptyLeague, 2);

    expect(wrapper.text()).toContain('0 Competitions');
    expect(wrapper.text()).toContain('0 Drivers');
  });
});
