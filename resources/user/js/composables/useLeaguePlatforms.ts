/**
 * League Platform Filtering Composable
 * Filters platforms to only those enabled for a specific league
 * REUSABLE: Competition creation, Driver management, Season creation (future)
 */

import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useLeagueStore } from '@user/stores/leagueStore';
import type { Platform } from '@user/types/league';

export interface PlatformOption {
  id: number;
  name: string;
  slug: string;
}

export function useLeaguePlatforms(leagueId: MaybeRefOrGetter<number>) {
  const leagueStore = useLeagueStore();

  /**
   * Get league's enabled platforms
   */
  const leaguePlatforms = computed((): Platform[] => {
    const id = toValue(leagueId);

    // First check currentLeague (used in detail views)
    // Then fall back to searching leagues array (used in list views)
    let league = leagueStore.currentLeague?.id === id ? leagueStore.currentLeague : null;

    if (!league) {
      league = leagueStore.leagues.find((l) => l.id === id) || null;
    }

    if (!league || !league.platform_ids) {
      return [];
    }

    // Filter platforms to only those in league's platform_ids
    return leagueStore.platforms.filter((p) => league.platform_ids.includes(p.id));
  });

  /**
   * Formatted for PrimeVue Select
   */
  const platformOptions = computed((): PlatformOption[] => {
    return leaguePlatforms.value.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
    }));
  });

  /**
   * Check if a platform is available for the league
   */
  function isPlatformAvailable(platformId: number): boolean {
    return leaguePlatforms.value.some((p) => p.id === platformId);
  }

  /**
   * Get platform by ID (within league's platforms)
   */
  function getPlatformById(platformId: number): Platform | undefined {
    return leaguePlatforms.value.find((p) => p.id === platformId);
  }

  return {
    leaguePlatforms,
    platformOptions,
    isPlatformAvailable,
    getPlatformById,
  };
}
