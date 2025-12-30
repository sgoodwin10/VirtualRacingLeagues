import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Season, SeasonCompetition } from '@app/types/season';
import type { League } from '@app/types/league';
import { getUserLeagues } from '@app/services/leagueService';

/**
 * Navigation Store
 *
 * Manages navigation state for the three-column layout:
 * - Icon rail active state
 * - Sidebar visibility
 * - Competition/season context
 * - Profile modal state
 * - User's leagues list
 */
export const useNavigationStore = defineStore('navigation', () => {
  // State
  const showSidebar = ref(false);
  const showProfileModal = ref(false);
  const activeRailItem = ref<string>('home');

  // Competition context state
  const leagueId = ref<number | null>(null);
  const competitionId = ref<number | null>(null);
  const seasonId = ref<number | null>(null);
  const currentCompetition = ref<SeasonCompetition | null>(null);
  const currentSeason = ref<Season | null>(null);

  // Leagues state
  const leagues = ref<League[]>([]);
  const leaguesLoading = ref(false);
  const leaguesError = ref<string | null>(null);

  // Getters
  const isInCompetitionContext = computed(() => {
    return !!(competitionId.value && seasonId.value);
  });

  // Actions
  function setShowSidebar(value: boolean): void {
    showSidebar.value = value;
  }

  function setProfileModal(value: boolean): void {
    showProfileModal.value = value;
  }

  function setActiveRailItem(item: string): void {
    activeRailItem.value = item;
  }

  function setCompetitionContext(league: number, competition: number, season: number): void {
    leagueId.value = league;
    competitionId.value = competition;
    seasonId.value = season;
    showSidebar.value = true;
  }

  function clearCompetitionContext(): void {
    leagueId.value = null;
    competitionId.value = null;
    seasonId.value = null;
    currentCompetition.value = null;
    currentSeason.value = null;
    showSidebar.value = false;
  }

  function setCompetitionData(competition: SeasonCompetition, season: Season): void {
    currentCompetition.value = competition;
    currentSeason.value = season;
  }

  async function fetchLeagues(): Promise<void> {
    leaguesLoading.value = true;
    leaguesError.value = null;

    try {
      leagues.value = await getUserLeagues();
    } catch (error) {
      leaguesError.value = error instanceof Error ? error.message : 'Failed to fetch leagues';
      leagues.value = [];
    } finally {
      leaguesLoading.value = false;
    }
  }

  return {
    // State
    showSidebar,
    showProfileModal,
    activeRailItem,
    leagueId,
    competitionId,
    seasonId,
    currentCompetition,
    currentSeason,
    leagues,
    leaguesLoading,
    leaguesError,

    // Getters
    isInCompetitionContext,

    // Actions
    setShowSidebar,
    setProfileModal,
    setActiveRailItem,
    setCompetitionContext,
    clearCompetitionContext,
    setCompetitionData,
    fetchLeagues,
  };
});
