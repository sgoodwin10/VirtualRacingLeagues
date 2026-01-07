import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { BreadcrumbItem } from '@app/components/common/Breadcrumbs.vue';
import { useNavigationStore } from '@app/stores/navigationStore';

/**
 * Composable for generating breadcrumbs from the current route
 *
 * This composable generates breadcrumb items based on:
 * - Current route path and meta information
 * - Navigation store context (league, competition, season names)
 *
 * @returns Computed breadcrumb items for the current route
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useBreadcrumbs } from '@app/composables/useBreadcrumbs';
 *
 * const breadcrumbs = useBreadcrumbs();
 * </script>
 *
 * <template>
 *   <HeaderBar :breadcrumbs="breadcrumbs" />
 * </template>
 * ```
 */
export function useBreadcrumbs() {
  const route = useRoute();
  const navigationStore = useNavigationStore();

  /**
   * Generate breadcrumb items based on current route
   */
  const breadcrumbs = computed((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // Home breadcrumb
    items.push({
      label: 'Home',
      to: { name: 'home' },
    });

    // Route-specific breadcrumbs
    switch (route.name) {
      case 'home':
        // Home page - just show "Home" as current
        items[0].to = undefined; // Make home non-clickable when on home
        break;

      case 'league-detail': {
        // League detail page
        const leagueId = parseInt(route.params.id as string);
        const league = navigationStore.leagues.find((l) => l.id === leagueId);
        items.push({
          label: league?.name ?? 'League',
        });
        break;
      }

      case 'season-detail':
      case 'season-rounds':
      case 'season-standings':
      case 'season-drivers':
      case 'season-divisions-teams':
      case 'season-status': {
        // Season-related pages
        const leagueId = parseInt(route.params.leagueId as string);
        const league = navigationStore.leagues.find((l) => l.id === leagueId);

        // Add league breadcrumb
        items.push({
          label: league?.name ?? 'League',
          to: { name: 'league-detail', params: { id: leagueId.toString() } },
        });

        // Add competition/season breadcrumb
        const competitionName = navigationStore.currentCompetition?.name ?? 'Competition';
        const seasonName = navigationStore.currentSeason?.name ?? 'Season';
        items.push({
          label: `${competitionName} / ${seasonName}`,
          to: {
            name: 'season-rounds',
            params: {
              leagueId: route.params.leagueId,
              competitionId: route.params.competitionId,
              seasonId: route.params.seasonId,
            },
          },
        });

        // Add section breadcrumb for child routes
        if (route.name !== 'season-rounds' && route.name !== 'season-detail') {
          const sectionLabels: Record<string, string> = {
            'season-standings': 'Standings',
            'season-drivers': 'Drivers',
            'season-divisions-teams': 'Divisions & Teams',
            'season-status': 'Season Status',
          };

          items.push({
            label: sectionLabels[route.name as string] ?? (route.meta.title as string) ?? 'Section',
          });
        }
        break;
      }

      default:
        // Fallback for unknown routes
        if (route.meta.title) {
          items.push({
            label: route.meta.title as string,
          });
        }
        break;
    }

    return items;
  });

  return breadcrumbs;
}
