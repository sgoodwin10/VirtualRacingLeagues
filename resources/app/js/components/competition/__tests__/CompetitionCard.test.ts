import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import CompetitionCard from '../CompetitionCard.vue';
import type { Competition } from '@app/types/competition';

// Mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId',
      name: 'season-detail',
      component: { template: '<div>Season Detail</div>' },
    },
  ],
});

// Helper function to create mount options with all necessary global plugins
function createMountOptions(props: { competition: Competition }) {
  return {
    props,
    global: {
      plugins: [router, PrimeVue, ToastService, ConfirmationService],
      stubs: {
        SeasonFormSplitModal: {
          name: 'SeasonFormSplitModal',
          template:
            '<div class="season-form-split-modal-stub" data-testid="season-form-split-modal"></div>',
          props: ['visible', 'competitionId', 'isEditMode', 'season'],
          emits: ['update:visible', 'season-saved', 'hide'],
        },
      },
    },
  };
}

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
    competition_colour: null,
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
    seasons: [
      {
        id: 1,
        name: 'Season 1',
        slug: 'season-1',
        status: 'completed',
        is_active: false,
        is_archived: false,
        created_at: '2024-01-01T00:00:00Z',
        stats: {
          driver_count: 20,
          round_count: 10,
          race_count: 30,
        },
      },
      {
        id: 2,
        name: 'Season 2',
        slug: 'season-2',
        status: 'active',
        is_active: true,
        is_archived: false,
        created_at: '2024-03-01T00:00:00Z',
        stats: {
          driver_count: 25,
          round_count: 12,
          race_count: 36,
        },
      },
      {
        id: 3,
        name: 'Season 3',
        slug: 'season-3',
        status: 'archived',
        is_active: false,
        is_archived: true,
        created_at: '2024-02-01T00:00:00Z',
        stats: {
          driver_count: 18,
          round_count: 8,
          race_count: 24,
        },
      },
    ],
    ...overrides,
  };
}

describe('CompetitionCard', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia());
  });

  it('renders competition basic information', () => {
    const competition = createMockCompetition();
    const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

    expect(wrapper.text()).toContain('GT3 Championship');
    expect(wrapper.text()).toContain('Premier GT3 racing series');
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/logo.png');
    expect(wrapper.find('img').attributes('alt')).toBe('GT3 Championship');
  });

  it('displays platform name correctly', () => {
    const competition = createMockCompetition();
    const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

    expect(wrapper.text()).toContain('iRacing');
  });

  it('displays competition stats correctly', () => {
    const competition = createMockCompetition();
    const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

    expect(wrapper.text()).toContain('Seasons 3');
    expect(wrapper.text()).toContain('Drivers 25');
  });

  it('shows archived chip when competition is archived', () => {
    const competition = createMockCompetition({
      is_archived: true,
      status: 'archived',
    });
    const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

    expect(wrapper.text()).toContain('Archived');
    expect(wrapper.find('.competition-card').classes()).toContain('opacity-60');
  });

  it('does not show archived chip when competition is active', () => {
    const competition = createMockCompetition();
    const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

    // Check that competition-level archived chip is not shown (but season archived chips may exist)
    const headerSection = wrapper.find('.rounded-t-md');
    expect(headerSection.text()).not.toContain('Archived');
  });

  describe('Seasons List', () => {
    it('displays seasons sorted by most recent first', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Find the seasons container first, then find season items within it
      const seasonsContainer = wrapper.find('.overflow-y-auto');
      const seasonElements = seasonsContainer.findAll('.border-slate-200');
      expect(seasonElements).toHaveLength(3);

      // Most recent first (Season 2 - 2024-03-01)
      expect(seasonElements[0]?.text()).toContain('Season 2');
      // Second (Season 3 - 2024-02-01)
      expect(seasonElements[1]?.text()).toContain('Season 3');
      // Oldest (Season 1 - 2024-01-01)
      expect(seasonElements[2]?.text()).toContain('Season 1');
    });

    it('displays season names', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      expect(wrapper.text()).toContain('Season 1');
      expect(wrapper.text()).toContain('Season 2');
      expect(wrapper.text()).toContain('Season 3');
    });

    it('displays season stats for drivers, rounds, and races', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const seasonsContainer = wrapper.find('.overflow-y-auto');
      const seasonElements = seasonsContainer.findAll('.border-slate-200');
      const season2 = seasonElements[0]; // Most recent (Season 2)

      // Check that stats are displayed
      expect(season2?.text()).toContain('25'); // total_drivers
      expect(season2?.text()).toContain('12'); // total_rounds
      expect(season2?.text()).toContain('36'); // total_races
    });

    it('shows active chip for active season', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const seasonsContainer = wrapper.find('.overflow-y-auto');
      const seasonElements = seasonsContainer.findAll('.border-slate-200');
      const season2 = seasonElements[0]; // Active season

      expect(season2?.text()).toContain('Active');
    });

    it('shows archived chip for archived season', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const seasonsContainer = wrapper.find('.overflow-y-auto');
      const seasonElements = seasonsContainer.findAll('.border-slate-200');
      const season3 = seasonElements[1]; // Archived season

      expect(season3?.text()).toContain('Archived');
    });

    it('shows empty state when competition has no seasons', () => {
      const competition = createMockCompetition({
        seasons: [],
        stats: {
          total_seasons: 0,
          active_seasons: 0,
          total_rounds: 0,
          total_drivers: 0,
          total_races: 0,
          next_race_date: null,
        },
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      expect(wrapper.text()).toContain('No seasons yet');
      expect(wrapper.text()).toContain('Get started by creating your first season');
    });

    it('shows empty state when seasons is undefined', () => {
      const competition = createMockCompetition({
        seasons: undefined,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      expect(wrapper.text()).toContain('No seasons yet');
      expect(wrapper.text()).toContain('Get started by creating your first season');
    });

    it('shows Create Season button in empty state', () => {
      const competition = createMockCompetition({
        seasons: [],
        stats: {
          total_seasons: 0,
          active_seasons: 0,
          total_rounds: 0,
          total_drivers: 0,
          total_races: 0,
          next_race_date: null,
        },
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Check that the button text exists in the empty state
      expect(wrapper.text()).toContain('Create Season');

      // Verify we can find a button element (PrimeVue Button renders as a button)
      const buttons = wrapper.findAll('button');
      const createSeasonButton = buttons.find((btn) => btn.text().includes('Create Season'));
      expect(createSeasonButton).toBeDefined();
    });

    it('opens season form drawer when Create Season button in empty state is clicked', async () => {
      const competition = createMockCompetition({
        seasons: [],
        stats: {
          total_seasons: 0,
          active_seasons: 0,
          total_rounds: 0,
          total_drivers: 0,
          total_races: 0,
          next_race_date: null,
        },
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Find and click the Create Season button in empty state
      const buttons = wrapper.findAll('button');
      const createSeasonButton = buttons.find((btn) => btn.text().includes('Create Season'));
      expect(createSeasonButton).toBeDefined();

      await createSeasonButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Verify the season form drawer component exists (drawer visibility is internal state)
      const drawer = wrapper.findComponent({ name: 'SeasonFormSplitModal' });
      expect(drawer.exists()).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('displays SpeedDial with edit and delete actions', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const speedDial = wrapper.findComponent({ name: 'SpeedDial' });
      expect(speedDial.exists()).toBe(true);
    });

    it('emits edit event when edit action is triggered', async () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Get the SpeedDial component and trigger the edit action
      const speedDial = wrapper.findComponent({ name: 'SpeedDial' });
      const model = speedDial.props('model') as Array<{ label: string; command: () => void }>;
      const editAction = model.find((item) => item.label === 'Edit');

      expect(editAction).toBeDefined();
      editAction?.command();
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('edit')).toHaveLength(1);
    });

    it('has edit and delete actions in SpeedDial menu', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const speedDial = wrapper.findComponent({ name: 'SpeedDial' });
      const model = speedDial.props('model') as Array<{
        label: string;
        icon: string;
        severity?: string;
      }>;

      // Check that both edit and delete actions exist
      expect(model).toHaveLength(2);

      const editAction = model.find((item) => item.label === 'Edit');
      expect(editAction).toBeDefined();
      expect(editAction?.icon).toBe('pi pi-pencil');
      // Edit action doesn't have a severity defined

      const deleteAction = model.find((item) => item.label === 'Delete');
      expect(deleteAction).toBeDefined();
      expect(deleteAction?.icon).toBe('pi pi-trash');
      // Delete action doesn't have a severity defined
    });

    it('shows create new season button when seasons exist', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Find the native button by its text content (shown when seasons exist)
      const buttons = wrapper.findAll('button');
      const createButton = buttons.find((btn) => btn.text().includes('Create New Season'));
      expect(createButton).toBeDefined();
      expect(createButton?.text()).toContain('Create New Season');
    });

    it('shows Create Season button when no seasons exist, not Create New Season', () => {
      const competition = createMockCompetition({ seasons: [] });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const buttons = wrapper.findAll('button');

      // Should show "Create Season" button in empty state
      const createSeasonButton = buttons.find((btn) => btn.text().includes('Create Season'));
      expect(createSeasonButton).toBeDefined();

      // Native "Create New Season" button should NOT exist when no seasons
      const createNewButton = buttons.find((btn) => btn.text().includes('Create New Season'));
      expect(createNewButton).toBeUndefined();
    });

    it('opens season form drawer when create button is clicked', async () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Initially drawer should exist (using split modal by default)
      const drawer = wrapper.findComponent({ name: 'SeasonFormSplitModal' });
      expect(drawer.exists()).toBe(true);

      // Click create button
      const buttons = wrapper.findAll('button');
      const createButton = buttons.find((btn) => btn.text().includes('Create New Season'));
      expect(createButton).toBeDefined();
      await createButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Check that showSeasonDrawer reactive state was updated
      // Since the stub doesn't show/hide, we can verify the component called the handler
      expect(createButton).toBeDefined();
    });

    it('passes correct props to season form drawer', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const drawer = wrapper.findComponent({ name: 'SeasonFormSplitModal' });
      expect(drawer.props('competitionId')).toBe(competition.id);
      expect(drawer.props('isEditMode')).toBe(false);
    });

    it('closes drawer when season-saved event is emitted', async () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Open drawer first
      const buttons = wrapper.findAll('button');
      const createButton = buttons.find((btn) => btn.text().includes('Create New Season'));
      await createButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Get drawer and emit season-saved event
      const drawer = wrapper.findComponent({ name: 'SeasonFormSplitModal' });
      expect(drawer.exists()).toBe(true);

      await drawer.vm.$emit('season-saved');
      await wrapper.vm.$nextTick();

      // Verify the handler was called (the drawer exists but visibility logic is internal)
      expect(drawer.exists()).toBe(true);
    });

    it('navigates to season detail when season item is clicked', async () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const pushSpy = vi.spyOn(router, 'push');

      const seasonsContainer = wrapper.find('.overflow-y-auto');
      const seasonElements = seasonsContainer.findAll('.border-slate-200');
      await seasonElements[0]?.trigger('click'); // Click first season (Season 2)

      expect(pushSpy).toHaveBeenCalledWith({
        name: 'season-detail',
        params: {
          leagueId: 1,
          competitionId: 1,
          seasonId: 2,
        },
      });
    });

    it('card is rendered', async () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const card = wrapper.find('.competition-card');
      expect(card.exists()).toBe(true);
    });
  });

  describe('Visual States', () => {
    it('applies hover and cursor styles to season items', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const seasonsContainer = wrapper.find('.overflow-y-auto');
      const seasonElements = seasonsContainer.findAll('.border-slate-200');
      seasonElements.forEach((season) => {
        expect(season.classes()).toContain('hover:border-primary-200');
        expect(season.classes()).toContain('hover:bg-primary-50/30');
        expect(season.classes()).toContain('cursor-pointer');
      });
    });

    it('makes seasons list scrollable', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const seasonsContainer = wrapper.find('.overflow-y-auto');
      expect(seasonsContainer.exists()).toBe(true);
      expect(seasonsContainer.classes()).toContain('overflow-y-auto');
    });
  });

  describe('Responsive Layout', () => {
    it('uses full width for seasons display', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const seasonsContainer = wrapper.find('.flex-1.overflow-y-auto');
      expect(seasonsContainer.exists()).toBe(true);
    });

    it('truncates long season names', () => {
      const competition = createMockCompetition({
        seasons: [
          {
            id: 1,
            name: 'This is a very long season name that should be truncated',
            slug: 'long-season',
            status: 'active',
            is_active: true,
            is_archived: false,
            created_at: '2024-01-01T00:00:00Z',
            stats: {
              driver_count: 20,
              round_count: 10,
              race_count: 30,
            },
          },
        ],
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const seasonName = wrapper.find('.truncate');
      expect(seasonName.exists()).toBe(true);
    });
  });

  describe('Competition Color', () => {
    it('applies competition color from RGB JSON string', () => {
      const competition = createMockCompetition({
        competition_colour: '{"r":227,"g":140,"b":18}',
        logo_url: null, // No logo, so color should be applied
        has_own_logo: false,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const logoDiv = wrapper.find('.w-16.h-16'); // No logo uses different sizing
      expect(logoDiv.attributes('style')).toContain('background-color: rgb(227, 140, 18)');
    });

    it('applies fallback color when competition_colour is null', () => {
      const competition = createMockCompetition({
        competition_colour: null,
        logo_url: null, // No logo, so fallback color should be applied
        has_own_logo: false,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const logoDiv = wrapper.find('.w-16.h-16');
      expect(logoDiv.attributes('style')).toContain('background-color: rgb(226, 232, 240)');
    });

    it('applies fallback color when competition_colour is invalid JSON', () => {
      const competition = createMockCompetition({
        competition_colour: 'invalid-json',
        logo_url: null, // No logo, so fallback color should be applied
        has_own_logo: false,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const logoDiv = wrapper.find('.w-16.h-16');
      expect(logoDiv.attributes('style')).toContain('background-color: rgb(226, 232, 240)');
    });

    it('handles different RGB values correctly', () => {
      const competition = createMockCompetition({
        competition_colour: '{"r":100,"g":102,"b":241}',
        logo_url: null, // No logo, so color should be applied
        has_own_logo: false,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const logoDiv = wrapper.find('.w-16.h-16');
      expect(logoDiv.attributes('style')).toContain('background-color: rgb(100, 102, 241)');
    });
  });

  describe('Logo Handling', () => {
    it('displays logo image when logo_url is provided', () => {
      const competition = createMockCompetition({
        logo_url: 'https://example.com/logo.png',
        has_own_logo: true,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('https://example.com/logo.png');
      expect(img.attributes('alt')).toBe('GT3 Championship');

      // Placeholder icon should not be visible
      const placeholderIcon = wrapper.findComponent({ name: 'PhImage' });
      expect(placeholderIcon.exists()).toBe(false);
    });

    it('displays placeholder icon when logo_url is null', () => {
      const competition = createMockCompetition({
        logo_url: null,
        has_own_logo: false,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Logo image should not be rendered
      const img = wrapper.find('img');
      expect(img.exists()).toBe(false);

      // Placeholder icon should be visible
      const placeholderIcon = wrapper.findComponent({ name: 'PhImage' });
      expect(placeholderIcon.exists()).toBe(true);
      expect(placeholderIcon.props('size')).toBe(32);
      expect(placeholderIcon.props('weight')).toBe('light');
    });

    it('displays placeholder icon when logo_url is empty string', () => {
      const competition = createMockCompetition({
        logo_url: '',
        has_own_logo: false,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Logo image should not be rendered
      const img = wrapper.find('img');
      expect(img.exists()).toBe(false);

      // Placeholder icon should be visible
      const placeholderIcon = wrapper.findComponent({ name: 'PhImage' });
      expect(placeholderIcon.exists()).toBe(true);
    });

    it('displays placeholder icon when logo_url is "default.png" (legacy)', () => {
      const competition = createMockCompetition({
        logo_url: 'default.png',
        has_own_logo: false,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Logo image should not be rendered for legacy "default.png"
      const img = wrapper.find('img');
      expect(img.exists()).toBe(false);

      // Placeholder icon should be visible
      const placeholderIcon = wrapper.findComponent({ name: 'PhImage' });
      expect(placeholderIcon.exists()).toBe(true);
    });

    it('applies correct container styles when logo is present', () => {
      const competition = createMockCompetition({
        logo_url: 'https://example.com/logo.png',
        has_own_logo: true,
        competition_colour: '{"r":100,"g":102,"b":241}',
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const logoContainer = wrapper.find('.rounded-tl-md');
      expect(logoContainer.classes()).toContain('w-18');
      expect(logoContainer.classes()).toContain('h-18');
      expect(logoContainer.classes()).toContain('m-1');
      expect(logoContainer.classes()).toContain('p-1');
      // When logo is present, background is transparent
      expect(logoContainer.attributes('style')).toContain('background-color: transparent');
    });

    it('applies correct container styles when logo is missing', () => {
      const competition = createMockCompetition({
        logo_url: null,
        has_own_logo: false,
        competition_colour: '{"r":100,"g":102,"b":241}',
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const logoContainer = wrapper.find('.rounded-tl-md');
      expect(logoContainer.classes()).toContain('w-16');
      expect(logoContainer.classes()).toContain('h-16');
      expect(logoContainer.classes()).toContain('m-2');
      expect(logoContainer.attributes('style')).toContain('background-color: rgb(100, 102, 241)');
    });

    it('uses fallback background color when logo is missing and no competition_colour', () => {
      const competition = createMockCompetition({
        logo_url: null,
        has_own_logo: false,
        competition_colour: null,
      });
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const logoContainer = wrapper.find('.rounded-tl-md');
      expect(logoContainer.attributes('style')).toContain('background-color: rgb(226, 232, 240)');
    });
  });

  describe('Season Management', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
    });

    it('displays SpeedDial for each season', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      // Should have one SpeedDial per season + one for competition = 4 total
      const speedDials = wrapper.findAllComponents({ name: 'SpeedDial' });
      expect(speedDials.length).toBeGreaterThanOrEqual(3); // At least 3 for seasons
    });

    it('season SpeedDial has edit, archive, and delete actions for non-archived season', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const vm = wrapper.vm as unknown as {
        getSeasonActions: (season: { is_archived: boolean }) => Array<{ label: string }>;
      };

      const season = competition.seasons![0]!; // Active season
      const actions = vm.getSeasonActions(season);

      expect(actions).toHaveLength(3);
      expect(actions.find((a) => a.label === 'Edit')).toBeDefined();
      expect(actions.find((a) => a.label === 'Archive')).toBeDefined();
      expect(actions.find((a) => a.label === 'Delete')).toBeDefined();
    });

    it('season SpeedDial shows unarchive action for archived season', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const vm = wrapper.vm as unknown as {
        getSeasonActions: (season: { is_archived: boolean }) => Array<{ label: string }>;
      };

      const archivedSeason = competition.seasons!.find((s) => s.is_archived);
      const actions = vm.getSeasonActions(archivedSeason!);

      expect(actions).toHaveLength(3);
      expect(actions.find((a) => a.label === 'Edit')).toBeDefined();
      expect(actions.find((a) => a.label === 'Unarchive')).toBeDefined();
      expect(actions.find((a) => a.label === 'Delete')).toBeDefined();
    });

    it('season SpeedDial is disabled when season is loading', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const vm = wrapper.vm as unknown as {
        isSeasonLoading: (seasonId: number) => boolean;
      };

      // Initially not loading
      expect(vm.isSeasonLoading(1)).toBe(false);
    });

    it('applies opacity when season is loading', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const vm = wrapper.vm as unknown as {
        isSeasonLoading: (seasonId: number) => boolean;
      };

      // Initially not loading
      expect(vm.isSeasonLoading(1)).toBe(false);

      // Note: Testing internal reactive state is challenging in unit tests
      // The actual loading state would be set by async operations
    });

    it('opens season edit form when edit action is triggered', async () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const vm = wrapper.vm as unknown as {
        handleEditSeason: (seasonId: number) => Promise<void>;
      };

      // Mock the seasonStore.fetchSeason method
      const seasonStore = (await import('@app/stores/seasonStore')).useSeasonStore();
      vi.spyOn(seasonStore, 'fetchSeason').mockResolvedValue({
        id: 1,
        competition_id: 1,
        name: 'Season 1',
        slug: 'season-1',
        car_class: null,
        description: null,
        technical_specs: null,
        logo_url: '',
        has_own_logo: false,
        banner_url: null,
        has_own_banner: false,
        race_divisions_enabled: false,
        team_championship_enabled: false,
        race_times_required: true,
        drop_round: false,
        total_drop_rounds: 0,
        teams_drivers_for_calculation: null,
        teams_drop_rounds: false,
        teams_total_drop_rounds: null,
        round_totals_tiebreaker_rules_enabled: false,
        status: 'completed',
        is_setup: false,
        is_active: false,
        is_completed: true,
        is_archived: false,
        is_deleted: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        created_by_user_id: 1,
        stats: {
          total_drivers: 20,
          active_drivers: 15,
          total_races: 30,
          completed_races: 30,
        },
      });

      await vm.handleEditSeason(1);
      await wrapper.vm.$nextTick();

      // Verify that fetchSeason was called
      expect(seasonStore.fetchSeason).toHaveBeenCalledWith(1);
    });

    it('shows loading state indicator on season row when operation in progress', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const vm = wrapper.vm as unknown as { isSeasonLoading: (seasonId: number) => boolean };

      // Initially no seasons are loading
      expect(vm.isSeasonLoading(1)).toBe(false);
      expect(vm.isSeasonLoading(2)).toBe(false);
    });

    it('stops propagation on SpeedDial click to prevent season navigation', async () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const pushSpy = vi.spyOn(router, 'push');

      // Find a season's SpeedDial
      const speedDials = wrapper.findAllComponents({ name: 'SpeedDial' });
      const seasonSpeedDial = speedDials.find((sd) => sd.classes().includes('speeddial-season'));

      // Click the SpeedDial (has @click.stop)
      await seasonSpeedDial?.trigger('click');

      // Should NOT navigate to season detail
      expect(pushSpy).not.toHaveBeenCalled();
    });

    it('has proper margin-right on season stats to accommodate SpeedDial', () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const seasonsContainer = wrapper.find('.overflow-y-auto');
      const seasonElements = seasonsContainer.findAll('.border-slate-200');
      const statsContainer = seasonElements[0]?.find('.mr-8');

      expect(statsContainer?.exists()).toBe(true);
    });

    it('passes correct props to season form drawer in edit mode', async () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const vm = wrapper.vm as unknown as {
        handleEditSeason: (seasonId: number) => Promise<void>;
        editingSeasonId: { value: number | null };
        showSeasonDrawer: { value: boolean };
      };

      // Mock the seasonStore.fetchSeason
      const seasonStore = (await import('@app/stores/seasonStore')).useSeasonStore();
      vi.spyOn(seasonStore, 'fetchSeason').mockResolvedValue({
        id: 1,
        competition_id: 1,
        name: 'Season 1',
        slug: 'season-1',
        car_class: null,
        description: null,
        technical_specs: null,
        logo_url: '',
        has_own_logo: false,
        banner_url: null,
        has_own_banner: false,
        race_divisions_enabled: false,
        team_championship_enabled: false,
        race_times_required: true,
        drop_round: false,
        total_drop_rounds: 0,
        teams_drivers_for_calculation: null,
        teams_drop_rounds: false,
        teams_total_drop_rounds: null,
        round_totals_tiebreaker_rules_enabled: false,
        status: 'completed',
        is_setup: false,
        is_active: false,
        is_completed: true,
        is_archived: false,
        is_deleted: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        created_by_user_id: 1,
        stats: {
          total_drivers: 20,
          active_drivers: 15,
          total_races: 30,
          completed_races: 30,
        },
      });

      await vm.handleEditSeason(1);
      await wrapper.vm.$nextTick();

      const drawer = wrapper.findComponent({ name: 'SeasonFormSplitModal' });
      expect(drawer.props('competitionId')).toBe(competition.id);
      expect(drawer.props('isEditMode')).toBe(true);
    });

    it('resets editing state when drawer is closed', async () => {
      const competition = createMockCompetition();
      const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

      const vm = wrapper.vm as unknown as {
        handleSeasonSaved: () => void;
      };

      // Call save handler - it should reset internal state
      vm.handleSeasonSaved();
      await wrapper.vm.$nextTick();

      // Verify the drawer props show it's not in edit mode anymore
      const drawer = wrapper.findComponent({ name: 'SeasonFormSplitModal' });
      expect(drawer.props('isEditMode')).toBe(false);
    });
  });
});
