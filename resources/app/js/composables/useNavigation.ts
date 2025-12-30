import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationStore } from '@app/stores/navigationStore';

/**
 * Navigation Composable
 *
 * Provides navigation context detection and management
 * Automatically updates navigation store based on route changes
 *
 * @returns Navigation context values and state
 */
export function useNavigation() {
  const route = useRoute();
  const navigationStore = useNavigationStore();

  // Detect if we're in a competition/season context
  const isInCompetitionContext = computed(() => {
    return !!(route.params.competitionId && route.params.seasonId);
  });

  // Extract IDs from route parameters
  const leagueId = computed(() => {
    const id = route.params.leagueId;
    if (!id) return null;
    const stringId = Array.isArray(id) ? id[0] : id;
    return stringId ? parseInt(stringId, 10) : null;
  });

  const competitionId = computed(() => {
    const id = route.params.competitionId;
    if (!id) return null;
    const stringId = Array.isArray(id) ? id[0] : id;
    return stringId ? parseInt(stringId, 10) : null;
  });

  const seasonId = computed(() => {
    const id = route.params.seasonId;
    if (!id) return null;
    const stringId = Array.isArray(id) ? id[0] : id;
    return stringId ? parseInt(stringId, 10) : null;
  });

  // Watch route changes and update navigation store
  watch(
    [isInCompetitionContext, leagueId, competitionId, seasonId],
    ([inContext, league, competition, season]) => {
      if (inContext && league && competition && season) {
        navigationStore.setCompetitionContext(league, competition, season);
      } else {
        navigationStore.clearCompetitionContext();
      }
    },
    { immediate: true },
  );

  return {
    isInCompetitionContext,
    leagueId,
    competitionId,
    seasonId,
  };
}
