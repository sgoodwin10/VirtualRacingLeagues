import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { useCompetitionStore } from '@app/stores/competitionStore';
import CompetitionList from '../CompetitionList.vue';
import type { Competition } from '@app/types/competition';

// Mock the useToast composable
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

// Create a test router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: { template: '<div>Home</div>' },
    },
  ],
});

// Helper function to create a mock competition
function createMockCompetition(overrides: Partial<Competition> = {}): Competition {
  return {
    id: 1,
    league_id: 1,
    name: 'GT3 Championship',
    slug: 'gt3-championship',
    description: 'Premier GT3 racing series',
    platform_id: 1,
    platform_name: 'iRacing',
    platform_slug: 'iracing',
    platform: {
      id: 1,
      name: 'iRacing',
      slug: 'iracing',
    },
    league: {
      id: 1,
      name: 'Pro Racing League',
      slug: 'pro-racing-league',
    },
    logo_url: 'https://example.com/logo.png',
    has_own_logo: true,
    status: 'active',
    is_active: true,
    is_archived: false,
    is_deleted: false,
    archived_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
    created_by_user_id: 1,
    stats: {
      total_seasons: 3,
      active_seasons: 1,
      total_rounds: 12,
      total_drivers: 25,
      total_races: 36,
      next_race_date: null,
    },
    seasons: [],
    ...overrides,
  };
}

describe('CompetitionList', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  // Helper to mount component with proper stubs and plugins
  const mountComponent = (props: { leagueId: number }) => {
    const competitionStore = useCompetitionStore();
    vi.spyOn(competitionStore, 'fetchCompetitions').mockResolvedValue(undefined);

    return mount(CompetitionList, {
      props,
      global: {
        plugins: [pinia, router],
        stubs: {
          CompetitionCard: true,
          CompetitionFormDrawer: true,
          CompetitionDeleteDialog: true,
        },
      },
    });
  };

  describe('Loading State', () => {
    it('displays skeleton loaders when loading', () => {
      const competitionStore = useCompetitionStore();
      competitionStore.loading = true;

      const wrapper = mountComponent({ leagueId: 1 });

      const skeletons = wrapper.findAllComponents({ name: 'Skeleton' });
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no competitions exist', () => {
      const competitionStore = useCompetitionStore();
      competitionStore.loading = false;
      competitionStore.competitions = [];

      const wrapper = mountComponent({ leagueId: 1 });

      expect(wrapper.text()).toContain('No Competitions Yet');
      expect(wrapper.text()).toContain('Create your first competition to start organizing races.');
    });

    it('shows create button in empty state', () => {
      const competitionStore = useCompetitionStore();
      competitionStore.loading = false;
      competitionStore.competitions = [];

      const wrapper = mountComponent({ leagueId: 1 });

      const createButton = wrapper.findComponent({ name: 'Button' });
      expect(createButton.exists()).toBe(true);
      expect(createButton.text()).toContain('Create Your First Competition');
    });
  });

  describe('Competition Cards Display', () => {
    it('displays competition cards in a grid', () => {
      const competitionStore = useCompetitionStore();
      competitionStore.loading = false;
      competitionStore.competitions = [
        createMockCompetition({ id: 1, name: 'GT3 Championship' }),
        createMockCompetition({ id: 2, name: 'GT4 Series' }),
      ];

      const wrapper = mountComponent({ leagueId: 1 });

      const competitionCards = wrapper.findAllComponents({ name: 'CompetitionCard' });
      expect(competitionCards).toHaveLength(2);
    });

    it('displays create competition card after all competition cards', () => {
      const competitionStore = useCompetitionStore();
      competitionStore.loading = false;
      competitionStore.competitions = [
        createMockCompetition({ id: 1, name: 'GT3 Championship' }),
        createMockCompetition({ id: 2, name: 'GT4 Series' }),
      ];

      const wrapper = mountComponent({ leagueId: 1 });

      // Find the create competition card
      const createCard = wrapper.find('.border-dashed.border-blue-200');
      expect(createCard.exists()).toBe(true);
      expect(createCard.text()).toContain('Create Competition');
      expect(createCard.text()).toContain('Start organising a new competition');
    });

    it('uses 2-column grid on medium screens and above', () => {
      const competitionStore = useCompetitionStore();
      competitionStore.loading = false;
      competitionStore.competitions = [createMockCompetition()];

      const wrapper = mountComponent({ leagueId: 1 });

      const grid = wrapper.find('.grid');
      expect(grid.classes()).toContain('md:grid-cols-2');
    });
  });

  describe('Create Competition Card', () => {
    it('displays create competition card with proper styling', () => {
      const competitionStore = useCompetitionStore();
      competitionStore.loading = false;
      competitionStore.competitions = [createMockCompetition()];

      const wrapper = mountComponent({ leagueId: 1 });

      const createCard = wrapper.find('.border-dashed.border-blue-200');
      expect(createCard.exists()).toBe(true);

      // Check blue gradient background
      expect(createCard.classes()).toContain('bg-gradient-to-br');
      expect(createCard.classes()).toContain('from-white');
      expect(createCard.classes()).toContain('to-blue-50');

      // Check hover states
      expect(createCard.classes()).toContain('hover:from-blue-50');
      expect(createCard.classes()).toContain('hover:to-blue-100');
      expect(createCard.classes()).toContain('hover:border-blue-200');

      // Check cursor pointer
      expect(createCard.classes()).toContain('cursor-pointer');
    });

    it('has same height as competition cards (h-32)', () => {
      const competitionStore = useCompetitionStore();
      competitionStore.loading = false;
      competitionStore.competitions = [createMockCompetition()];

      const wrapper = mountComponent({ leagueId: 1 });

      const createCard = wrapper.find('.border-dashed.border-blue-200');
      expect(createCard.classes()).toContain('h-32');
    });

    it('displays plus icon and text', () => {
      const competitionStore = useCompetitionStore();
      competitionStore.loading = false;
      competitionStore.competitions = [createMockCompetition()];

      const wrapper = mountComponent({ leagueId: 1 });

      const createCard = wrapper.find('.border-dashed.border-blue-200');

      // Check PhPlus icon exists
      const icon = createCard.findComponent({ name: 'PhPlus' });
      expect(icon.exists()).toBe(true);
      expect(icon.props('size')).toBe(24);
      expect(icon.props('weight')).toBe('bold');

      // Check text content
      expect(createCard.text()).toContain('Create Competition');
      expect(createCard.text()).toContain('Start organising a new competition');
    });
  });

  describe('Component Lifecycle', () => {
    it('fetches competitions on mount', () => {
      const competitionStore = useCompetitionStore();
      const fetchSpy = vi.spyOn(competitionStore, 'fetchCompetitions').mockResolvedValue(undefined);

      mount(CompetitionList, {
        props: { leagueId: 1 },
        global: {
          plugins: [pinia, router],
          stubs: {
            CompetitionCard: true,
            CompetitionFormDrawer: true,
            CompetitionDeleteDialog: true,
          },
        },
      });

      expect(fetchSpy).toHaveBeenCalledWith(1);
    });
  });
});
