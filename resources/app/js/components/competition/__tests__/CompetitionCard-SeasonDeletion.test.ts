/**
 * Tests for Season Deletion Reactivity in CompetitionCard
 *
 * This test suite verifies that when a season is deleted, the CompetitionCard
 * automatically updates its UI without requiring a manual page refresh.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import CompetitionCard from '../CompetitionCard.vue';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useSeasonStore } from '@app/stores/seasonStore';
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

// Helper function to create mount options
function createMountOptions(props: { competition: Competition }) {
  return {
    props,
    global: {
      plugins: [router, PrimeVue, ToastService, ConfirmationService],
      stubs: {
        SeasonFormSplitModal: {
          name: 'SeasonFormSplitModal',
          template: '<div class="season-form-split-modal-stub"></div>',
          props: ['visible', 'competitionId', 'isEditMode', 'season'],
          emits: ['update:visible', 'season-saved', 'hide'],
        },
      },
    },
  };
}

// Helper function to create a mock competition with seasons
function createMockCompetition(): Competition {
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
        status: 'setup',
        is_active: false,
        is_archived: false,
        created_at: '2024-02-01T00:00:00Z',
        stats: {
          driver_count: 18,
          round_count: 8,
          race_count: 24,
        },
      },
    ],
  };
}

describe('CompetitionCard - Season Deletion Reactivity', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should automatically update the seasons list when a season is deleted via store', async () => {
    const competitionStore = useCompetitionStore();
    const competition = createMockCompetition();

    // Add competition to store
    competitionStore.competitions.push(competition);

    // Mount component with competition from store
    const wrapper = mount(
      CompetitionCard,
      createMountOptions({ competition: competitionStore.competitions[0]! }),
    );

    // Verify initial state - should show 3 seasons
    // Find season items (they have the cursor-pointer class, unlike the create button)
    const seasonsContainer = wrapper.find('.overflow-y-auto');
    const initialSeasonElements = seasonsContainer.findAll('.cursor-pointer.border-slate-200');
    expect(initialSeasonElements).toHaveLength(3);
    expect(wrapper.text()).toContain('Season 1');
    expect(wrapper.text()).toContain('Season 2');
    expect(wrapper.text()).toContain('Season 3');

    // Simulate season deletion by calling the competition store method directly
    // This mimics what the season store does when deleteExistingSeason is called
    competitionStore.removeSeasonFromCompetition(1, 2); // Remove Season 2

    // Wait for Vue to update the DOM
    await wrapper.vm.$nextTick();

    // Verify the season list updated automatically - should now show 2 seasons
    const updatedSeasonElements = seasonsContainer.findAll('.cursor-pointer.border-slate-200');
    expect(updatedSeasonElements).toHaveLength(2);
    expect(wrapper.text()).toContain('Season 1');
    expect(wrapper.text()).not.toContain('Season 2'); // Season 2 should be gone
    expect(wrapper.text()).toContain('Season 3');
  });

  it('should update stats when a season is deleted', async () => {
    const competitionStore = useCompetitionStore();
    const competition = createMockCompetition();

    competitionStore.competitions.push(competition);

    const wrapper = mount(
      CompetitionCard,
      createMountOptions({ competition: competitionStore.competitions[0]! }),
    );

    // Verify initial stats
    expect(wrapper.text()).toContain('Seasons 3');

    // Delete a season
    competitionStore.removeSeasonFromCompetition(1, 2);
    await wrapper.vm.$nextTick();

    // Verify stats updated
    expect(wrapper.text()).toContain('Seasons 2');
  });

  it('should show empty state when the last season is deleted', async () => {
    const competitionStore = useCompetitionStore();
    const competition = createMockCompetition();

    competitionStore.competitions.push(competition);

    const wrapper = mount(
      CompetitionCard,
      createMountOptions({ competition: competitionStore.competitions[0]! }),
    );

    // Delete all seasons one by one
    competitionStore.removeSeasonFromCompetition(1, 1);
    await wrapper.vm.$nextTick();
    competitionStore.removeSeasonFromCompetition(1, 2);
    await wrapper.vm.$nextTick();
    competitionStore.removeSeasonFromCompetition(1, 3);
    await wrapper.vm.$nextTick();

    // Should show empty state
    expect(wrapper.text()).toContain('No seasons yet');
    expect(wrapper.text()).toContain('Get started by creating your first season');
  });

  it('should maintain reactivity when deleting multiple seasons in sequence', async () => {
    const competitionStore = useCompetitionStore();
    const competition = createMockCompetition();

    competitionStore.competitions.push(competition);

    const wrapper = mount(
      CompetitionCard,
      createMountOptions({ competition: competitionStore.competitions[0]! }),
    );

    // Initial: 3 seasons
    const seasonsContainer = wrapper.find('.overflow-y-auto');
    expect(seasonsContainer.findAll('.cursor-pointer.border-slate-200')).toHaveLength(3);

    // Delete Season 1
    competitionStore.removeSeasonFromCompetition(1, 1);
    await wrapper.vm.$nextTick();
    expect(seasonsContainer.findAll('.cursor-pointer.border-slate-200')).toHaveLength(2);
    expect(wrapper.text()).not.toContain('Season 1');

    // Delete Season 3
    competitionStore.removeSeasonFromCompetition(1, 3);
    await wrapper.vm.$nextTick();
    expect(seasonsContainer.findAll('.cursor-pointer.border-slate-200')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('Season 3');

    // Only Season 2 should remain
    expect(wrapper.text()).toContain('Season 2');
  });

  it('should call seasonStore.deleteExistingSeason when delete action is confirmed', async () => {
    const seasonStore = useSeasonStore();
    const competition = createMockCompetition();

    // Mock the delete method
    const deleteSeasonSpy = vi.spyOn(seasonStore, 'deleteExistingSeason').mockResolvedValue();

    const wrapper = mount(CompetitionCard, createMountOptions({ competition }));

    // Access the component's internal deleteSeason method
    const vm = wrapper.vm as unknown as {
      deleteSeason: (seasonId: number) => Promise<void>;
    };

    // Call the delete method directly
    await vm.deleteSeason(2);

    // Verify the season store method was called with seasonId and competitionId
    expect(deleteSeasonSpy).toHaveBeenCalledWith(2, competition.id);
  });

  it('should reactively update when season is added after deletion', async () => {
    const competitionStore = useCompetitionStore();
    const competition = createMockCompetition();

    competitionStore.competitions.push(competition);

    const wrapper = mount(
      CompetitionCard,
      createMountOptions({ competition: competitionStore.competitions[0]! }),
    );

    // Initial: 3 seasons
    const seasonsContainer = wrapper.find('.overflow-y-auto');
    expect(seasonsContainer.findAll('.cursor-pointer.border-slate-200')).toHaveLength(3);

    // Delete Season 2
    competitionStore.removeSeasonFromCompetition(1, 2);
    await wrapper.vm.$nextTick();
    expect(seasonsContainer.findAll('.cursor-pointer.border-slate-200')).toHaveLength(2);

    // Add a new season
    competitionStore.addSeasonToCompetition(1, {
      id: 4,
      name: 'Season 4',
      slug: 'season-4',
      status: 'setup',
      is_active: false,
      is_archived: false,
      created_at: '2024-04-01T00:00:00Z',
      stats: {
        driver_count: 0,
        round_count: 0,
        race_count: 0,
      },
    });
    await wrapper.vm.$nextTick();

    // Should now have 3 seasons again
    expect(seasonsContainer.findAll('.cursor-pointer.border-slate-200')).toHaveLength(3);
    expect(wrapper.text()).toContain('Season 4');
  });

  it('should maintain correct sorting after season deletion', async () => {
    const competitionStore = useCompetitionStore();
    const competition = createMockCompetition();

    competitionStore.competitions.push(competition);

    const wrapper = mount(
      CompetitionCard,
      createMountOptions({ competition: competitionStore.competitions[0]! }),
    );

    const seasonsContainer = wrapper.find('.overflow-y-auto');
    const initialSeasonElements = seasonsContainer.findAll('.cursor-pointer.border-slate-200');
    // Initial order: Season 2 (most recent), Season 3, Season 1 (oldest)
    expect(initialSeasonElements[0]?.text()).toContain('Season 2');
    expect(initialSeasonElements[1]?.text()).toContain('Season 3');
    expect(initialSeasonElements[2]?.text()).toContain('Season 1');

    // Delete the most recent season (Season 2)
    competitionStore.removeSeasonFromCompetition(1, 2);
    await wrapper.vm.$nextTick();

    const updatedSeasonElements = seasonsContainer.findAll('.cursor-pointer.border-slate-200');
    // New order: Season 3 (most recent), Season 1 (oldest)
    expect(updatedSeasonElements).toHaveLength(2);
    expect(updatedSeasonElements[0]?.text()).toContain('Season 3');
    expect(updatedSeasonElements[1]?.text()).toContain('Season 1');
  });
});
