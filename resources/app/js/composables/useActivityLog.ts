/**
 * useActivityLog Composable
 * Provides state management and formatting for activity logs
 */

import { ref, computed } from 'vue';
import { activityLogService } from '@app/services/activityLogService';
import type {
  Activity,
  ActivityFilterParams,
  FormattedActivity,
  EntityType,
  ActivityAction,
  ActivityContext,
} from '@app/types/activityLog';
import { formatDistanceToNow, format } from 'date-fns';

export function useActivityLog(leagueId: number, initialLimit: number = 25) {
  const activities = ref<Activity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const lastPage = ref(1);
  const total = ref(0);

  // AbortController for cancelling previous requests
  const abortController = ref<AbortController | null>(null);

  // Filter state
  const filters = ref<ActivityFilterParams>({
    limit: initialLimit,
    page: 1,
  });

  /**
   * Fetch activities from the API
   */
  async function fetchActivities(params?: ActivityFilterParams): Promise<void> {
    // Cancel any previous request
    if (abortController.value) {
      abortController.value.abort();
    }

    // Create new AbortController for this request
    abortController.value = new AbortController();

    loading.value = true;
    error.value = null;

    try {
      const response = await activityLogService.getActivities(
        leagueId,
        {
          ...filters.value,
          ...params,
        },
        abortController.value.signal,
      );

      activities.value = response.data;

      if (response.meta) {
        currentPage.value = response.meta.current_page;
        lastPage.value = response.meta.last_page;
        total.value = response.meta.total;
      }
    } catch (e) {
      // Ignore abort errors
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      error.value = e instanceof Error ? e.message : 'Failed to load activities';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Format a single activity for display
   */
  function formatActivity(activity: Activity): FormattedActivity {
    const { properties } = activity;

    return {
      id: activity.id,
      description: activity.description,
      icon: getIconForEntity(properties.entity_type),
      iconColor: getColorForAction(properties.action),
      causer: activity.causer
        ? `${activity.causer.first_name} ${activity.causer.last_name}`
        : 'System',
      entityType: properties.entity_type,
      entityName: properties.entity_name,
      action: properties.action,
      context: buildContextString(properties.context),
      timestamp: format(new Date(activity.created_at), 'PPpp'),
      relativeTime: formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }),
      changes: properties.changes,
    };
  }

  /**
   * Formatted activities computed property
   */
  const formattedActivities = computed(() => activities.value.map(formatActivity));

  /**
   * Update filters and fetch
   */
  function updateFilters(newFilters: Partial<ActivityFilterParams>): void {
    filters.value = { ...filters.value, ...newFilters, page: 1 };
    fetchActivities();
  }

  /**
   * Navigate to specific page
   */
  function goToPage(page: number): void {
    filters.value.page = page;
    fetchActivities();
  }

  /**
   * Refresh current view
   */
  function refresh(): void {
    fetchActivities();
  }

  return {
    activities,
    formattedActivities,
    loading,
    error,
    currentPage,
    lastPage,
    total,
    filters,
    fetchActivities,
    updateFilters,
    goToPage,
    refresh,
  };
}

/**
 * Get icon for entity type (PrimeIcons)
 */
function getIconForEntity(entityType: EntityType): string {
  const iconMap: Record<EntityType, string> = {
    league: 'pi-flag',
    driver: 'pi-user',
    competition: 'pi-trophy',
    season: 'pi-calendar',
    round: 'pi-circle',
    race: 'pi-car',
    qualifier: 'pi-clock',
    division: 'pi-th-large',
    team: 'pi-users',
    season_driver: 'pi-user-plus',
  };
  return iconMap[entityType] || 'pi-circle';
}

/**
 * Get Tailwind color class for action
 */
function getColorForAction(action: ActivityAction): string {
  const colorMap: Record<ActivityAction, string> = {
    create: 'text-green-500',
    update: 'text-blue-500',
    delete: 'text-red-500',
    complete: 'text-purple-500',
    archive: 'text-gray-500',
    import: 'text-cyan-500',
    add_driver: 'text-green-500',
    remove_driver: 'text-red-500',
    reorder: 'text-yellow-500',
    enter_results: 'text-blue-500',
  };
  return colorMap[action] || 'text-gray-500';
}

/**
 * Build context breadcrumb string
 */
function buildContextString(context?: ActivityContext): string {
  if (!context) return '';

  const parts: string[] = [];

  if (context.competition_name) {
    parts.push(context.competition_name);
  }
  if (context.season_name) {
    parts.push(context.season_name);
  }
  if (context.round_name) {
    parts.push(context.round_name);
  }

  return parts.join(' > ');
}
