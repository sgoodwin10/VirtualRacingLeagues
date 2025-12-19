import { ref, computed, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { publicApi } from '@public/services/publicApi';
import type {
  PublicLeagueDetailResponse,
  PublicLeagueInfo,
  PublicCompetitionDetail,
  RecentActivity,
  UpcomingRace,
  ChampionshipLeader,
  LeagueStats,
} from '@public/types/public';

/**
 * Composable for managing public league detail data fetching and state
 *
 * Handles fetching comprehensive league details from the public API, including
 * league information, statistics, competitions, seasons, recent activity,
 * upcoming races, and championship leaders. Provides reactive state for
 * loading, errors, and all fetched data along with computed properties
 * for convenient data access.
 *
 * @param slug - The unique slug identifier for the league
 * @returns Object containing reactive state, computed properties, and methods:
 *   - isLoading: Reactive boolean indicating fetch operation in progress
 *   - error: Reactive string containing error message if fetch fails, null otherwise
 *   - league: Reactive league information object (name, description, social links, etc.)
 *   - stats: Reactive league statistics (member count, race count, etc.)
 *   - competitions: Reactive array of competition details with nested seasons
 *   - recentActivity: Reactive array of recent activity items
 *   - upcomingRaces: Reactive array of upcoming race events
 *   - championshipLeaders: Reactive array of current championship leaders
 *   - hasSocialLinks: Computed boolean indicating if league has any social media links
 *   - totalSeasons: Computed number of total seasons across all competitions
 *   - platformsList: Computed array of gaming platforms the league supports
 *   - fetchLeague: Async function to fetch or refresh league data from the API
 *
 * @example
 * ```ts
 * const {
 *   isLoading,
 *   error,
 *   league,
 *   stats,
 *   competitions,
 *   hasSocialLinks,
 *   fetchLeague
 * } = usePublicLeagueDetail('my-racing-league');
 *
 * onMounted(async () => {
 *   await fetchLeague();
 *   if (error.value) {
 *     console.error('Failed to load league:', error.value);
 *   } else {
 *     console.log('League loaded:', league.value?.name);
 *   }
 * });
 * ```
 */
export function usePublicLeagueDetail(slug: string) {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const league = ref<PublicLeagueInfo | null>(null);
  const stats = ref<LeagueStats | null>(null);
  const competitions = ref<PublicCompetitionDetail[]>([]);
  const recentActivity = ref<RecentActivity[]>([]);
  const upcomingRaces = ref<UpcomingRace[]>([]);
  const championshipLeaders = ref<ChampionshipLeader[]>([]);
  const abortController = ref<AbortController | null>(null);

  // Computed properties
  const hasSocialLinks = computed(() => {
    if (!league.value) return false;
    return !!(
      league.value.discord_url ||
      league.value.twitter_handle ||
      league.value.youtube_url ||
      league.value.twitch_url ||
      league.value.website_url
    );
  });

  const totalSeasons = computed(() => {
    return competitions.value.reduce((sum, comp) => sum + comp.seasons.length, 0);
  });

  const platformsList = computed(() => {
    const platforms = league.value?.platforms;
    return Array.isArray(platforms) ? platforms : [];
  });

  // Fetch league data
  const fetchLeague = async () => {
    // Cancel any pending request
    if (abortController.value) {
      abortController.value.abort();
    }

    // Create new abort controller for this request
    abortController.value = new AbortController();

    isLoading.value = true;
    error.value = null;

    try {
      const response: PublicLeagueDetailResponse = await publicApi.fetchLeague(
        slug,
        abortController.value.signal,
      );

      league.value = response.league;
      stats.value = response.stats;
      competitions.value = response.competitions;
      recentActivity.value = response.recent_activity;
      upcomingRaces.value = response.upcoming_races;
      championshipLeaders.value = response.championship_leaders;
    } catch (err) {
      // Don't set error if request was aborted
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'AbortError')) {
        return;
      }

      error.value = err instanceof Error ? err.message : 'Failed to fetch league details';
      console.error('Error fetching league:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Cleanup on unmount
  onBeforeUnmount(() => {
    if (abortController.value) {
      abortController.value.abort();
    }
  });

  return {
    // State
    isLoading,
    error,
    league,
    stats,
    competitions,
    recentActivity,
    upcomingRaces,
    championshipLeaders,

    // Computed
    hasSocialLinks,
    totalSeasons,
    platformsList,

    // Methods
    fetchLeague,
  };
}
