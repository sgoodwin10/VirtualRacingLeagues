# Activity Logs for App Dashboard - Frontend Plan

## Overview

This document details the frontend implementation for displaying activity logs in the User/App dashboard. The activity log will be accessible as a tab within the League Settings page.

## Prerequisites

- Backend API endpoints completed (see `02-backend-plan.md`)
- Existing app dashboard structure at `resources/app/js/`
- PrimeVue component library available

---

## Phase 1: TypeScript Types

### 1.1 Create Activity Log Types

**File:** `resources/app/js/types/activityLog.ts`

```typescript
/**
 * Activity Log Types for App Dashboard
 */

/**
 * Log name - always 'league' for app dashboard activities
 */
export type LogName = 'league';

/**
 * Action types for activities
 */
export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'complete'
  | 'archive'
  | 'import'
  | 'add_driver'
  | 'remove_driver'
  | 'reorder'
  | 'enter_results';

/**
 * Entity types that can be tracked
 */
export type EntityType =
  | 'league'
  | 'driver'
  | 'competition'
  | 'season'
  | 'round'
  | 'race'
  | 'qualifier'
  | 'division'
  | 'team'
  | 'season_driver';

/**
 * Context information for the activity
 */
export interface ActivityContext {
  competition_id?: number;
  competition_name?: string;
  season_id?: number;
  season_name?: string;
  round_id?: number;
  round_name?: string;
  team_id?: number;
  team_name?: string;
  division_id?: number;
  division_name?: string;
}

/**
 * Changes recorded in the activity
 */
export interface ActivityChanges {
  old?: Record<string, unknown>;
  new?: Record<string, unknown>;
}

/**
 * Activity properties stored with each log entry
 */
export interface ActivityProperties {
  league_id: number;
  league_name: string;
  action: ActivityAction;
  entity_type: EntityType;
  entity_id: number;
  entity_name: string;
  context?: ActivityContext;
  changes?: ActivityChanges;
  ip_address?: string;
  user_agent?: string;
  [key: string]: unknown;
}

/**
 * Causer information (user who performed the action)
 */
export interface ActivityCauser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * Single activity log entry
 */
export interface Activity {
  id: number;
  log_name: LogName;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  causer_type: string | null;
  causer_id: number | null;
  causer?: ActivityCauser | null;
  properties: ActivityProperties;
  event: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * API response for activity list
 */
export interface ActivityListResponse {
  success: boolean;
  data: Activity[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message?: string;
}

/**
 * API response for single activity
 */
export interface ActivityResponse {
  success: boolean;
  data: Activity;
  message?: string;
}

/**
 * Filter parameters for fetching activities
 */
export interface ActivityFilterParams {
  limit?: number;
  page?: number;
  entity_type?: EntityType;
  action?: ActivityAction;
  from_date?: string;
  to_date?: string;
}

/**
 * Formatted activity for display
 */
export interface FormattedActivity {
  id: number;
  description: string;
  icon: string;
  iconColor: string;
  causer: string;
  entityType: EntityType;
  entityName: string;
  action: ActivityAction;
  context: string;
  timestamp: string;
  relativeTime: string;
  changes?: ActivityChanges;
}
```

---

## Phase 2: API Service

### 2.1 Create Activity Log Service

**File:** `resources/app/js/services/activityLogService.ts`

```typescript
import { apiService } from './api';
import type {
  Activity,
  ActivityListResponse,
  ActivityResponse,
  ActivityFilterParams,
} from '@app/types/activityLog';
import { handleServiceError } from '@app/utils/errorHandler';

/**
 * Activity Log Service
 * Handles API calls for league activity logs
 */
class ActivityLogService {
  /**
   * Get activities for a league
   * @param leagueId - League ID
   * @param params - Optional filter parameters
   * @param signal - Optional AbortSignal for cancellation
   */
  async getActivities(
    leagueId: number,
    params?: ActivityFilterParams,
    signal?: AbortSignal
  ): Promise<ActivityListResponse> {
    try {
      const response = await apiService.get<ActivityListResponse>(
        `/leagues/${leagueId}/activities`,
        { params, signal }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch activities');
      }

      return response;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get single activity by ID
   * @param leagueId - League ID
   * @param activityId - Activity ID
   * @param signal - Optional AbortSignal for cancellation
   */
  async getActivity(
    leagueId: number,
    activityId: number,
    signal?: AbortSignal
  ): Promise<Activity> {
    try {
      const response = await apiService.get<ActivityResponse>(
        `/leagues/${leagueId}/activities/${activityId}`,
        { signal }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch activity');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }
}

export const activityLogService = new ActivityLogService();
export default activityLogService;
```

---

## Phase 3: Composables

### 3.1 Create useActivityLog Composable

**File:** `resources/app/js/composables/useActivityLog.ts`

```typescript
import { ref, computed } from 'vue';
import { activityLogService } from '@app/services/activityLogService';
import type {
  Activity,
  ActivityFilterParams,
  FormattedActivity,
  EntityType,
  ActivityAction,
} from '@app/types/activityLog';
import { formatDistanceToNow, format } from 'date-fns';

export function useActivityLog(leagueId: number) {
  const activities = ref<Activity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const lastPage = ref(1);
  const total = ref(0);

  // Filter state
  const filters = ref<ActivityFilterParams>({
    limit: 25,
    page: 1,
  });

  // Fetch activities
  async function fetchActivities(params?: ActivityFilterParams) {
    loading.value = true;
    error.value = null;

    try {
      const response = await activityLogService.getActivities(
        leagueId,
        { ...filters.value, ...params }
      );

      activities.value = response.data;

      if (response.meta) {
        currentPage.value = response.meta.current_page;
        lastPage.value = response.meta.last_page;
        total.value = response.meta.total;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load activities';
    } finally {
      loading.value = false;
    }
  }

  // Format activity for display
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

  // Formatted activities
  const formattedActivities = computed(() =>
    activities.value.map(formatActivity)
  );

  // Update filters
  function updateFilters(newFilters: Partial<ActivityFilterParams>) {
    filters.value = { ...filters.value, ...newFilters, page: 1 };
    fetchActivities();
  }

  // Pagination
  function goToPage(page: number) {
    filters.value.page = page;
    fetchActivities();
  }

  // Refresh
  function refresh() {
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

// Helper: Get icon for entity type
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

// Helper: Get color for action
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

// Helper: Build context string
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
```

---

## Phase 4: Vue Components

### 4.1 ActivityLog Component (Main Container)

**File:** `resources/app/js/components/activity/ActivityLog.vue`

A container component that:
- Displays the activity log list
- Includes filters (entity type, action, date range)
- Handles pagination
- Shows loading and empty states

**Features:**
- Uses PrimeVue `DataTable` or custom list for activities
- Filter dropdowns using PrimeVue `Dropdown`
- Date range picker using PrimeVue `Calendar`
- Pagination using PrimeVue `Paginator`

### 4.2 ActivityItem Component

**File:** `resources/app/js/components/activity/ActivityItem.vue`

A component that displays a single activity entry:
- Icon based on entity type
- Description with highlighted entity name
- Causer (who did it)
- Relative timestamp (e.g., "2 hours ago")
- Expandable changes section (for updates)

**Props:**
```typescript
interface Props {
  activity: FormattedActivity;
  showDetails?: boolean;
}
```

### 4.3 ActivityFilters Component

**File:** `resources/app/js/components/activity/ActivityFilters.vue`

Filter controls for the activity log:
- Entity type dropdown
- Action type dropdown
- Date range picker
- Clear filters button

**Emits:**
```typescript
interface Emits {
  (e: 'filter', filters: ActivityFilterParams): void;
  (e: 'clear'): void;
}
```

### 4.4 ActivityChanges Component

**File:** `resources/app/js/components/activity/ActivityChanges.vue`

Displays the old/new values for update activities:
- Side-by-side comparison
- Highlight changed fields
- Format values appropriately

**Props:**
```typescript
interface Props {
  changes: ActivityChanges;
}
```

---

## Phase 5: League Settings Integration

### 5.1 Add Activity Tab to League Settings

**Location:** Integrate with existing League Settings view

**Option A: Add as a new tab**
If League Settings uses tabs (PrimeVue `TabView`):
```vue
<TabPanel header="Activity Log">
  <ActivityLog :league-id="leagueId" />
</TabPanel>
```

**Option B: Add as a new route**
If League Settings uses route-based navigation:
- Add route: `/leagues/:slug/settings/activity`
- Create view: `resources/app/js/views/league/settings/ActivityView.vue`

### 5.2 Navigation

Add link to Activity Log in League Settings navigation:
```vue
<router-link :to="{ name: 'league-settings-activity', params: { slug: league.slug } }">
  <i class="pi pi-history"></i>
  Activity Log
</router-link>
```

---

## Phase 6: Tests

### 6.1 Component Tests

**File:** `resources/app/js/components/activity/__tests__/ActivityLog.test.ts`

Test cases:
- Renders activity list
- Shows loading state
- Shows empty state
- Filters work correctly
- Pagination works
- Refresh works

**File:** `resources/app/js/components/activity/__tests__/ActivityItem.test.ts`

Test cases:
- Renders activity correctly
- Shows correct icon for entity type
- Shows correct color for action
- Shows causer name
- Shows relative time
- Expands to show changes

**File:** `resources/app/js/components/activity/__tests__/ActivityFilters.test.ts`

Test cases:
- Renders all filter controls
- Emits filter event on change
- Clear button resets filters

### 6.2 Service Tests

**File:** `resources/app/js/services/__tests__/activityLogService.test.ts`

Test cases:
- Fetches activities successfully
- Handles errors correctly
- Passes filter params correctly
- Fetches single activity

### 6.3 Composable Tests

**File:** `resources/app/js/composables/__tests__/useActivityLog.test.ts`

Test cases:
- Fetches activities on init
- Formats activities correctly
- Updates filters
- Handles pagination
- Handles errors

---

## Component Structure Summary

```
resources/app/js/
├── types/
│   └── activityLog.ts                    # TypeScript types
├── services/
│   ├── activityLogService.ts             # API service
│   └── __tests__/
│       └── activityLogService.test.ts
├── composables/
│   ├── useActivityLog.ts                 # Activity log composable
│   └── __tests__/
│       └── useActivityLog.test.ts
├── components/
│   └── activity/
│       ├── ActivityLog.vue               # Main container
│       ├── ActivityItem.vue              # Single activity display
│       ├── ActivityFilters.vue           # Filter controls
│       ├── ActivityChanges.vue           # Changes display
│       └── __tests__/
│           ├── ActivityLog.test.ts
│           ├── ActivityItem.test.ts
│           └── ActivityFilters.test.ts
└── views/
    └── league/
        └── settings/
            └── ActivityView.vue          # Settings tab/view (if route-based)
```

---

## UI Design Guidelines

### Activity Item Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Icon] Description                              2 hours ago │
│        Competition > Season > Round                         │
│        by John Doe                                          │
│        ▼ Show Changes (for updates)                         │
└─────────────────────────────────────────────────────────────┘
```

### Filters Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Entity Type: [Dropdown] Action: [Dropdown]                  │
│ From: [Calendar] To: [Calendar]    [Clear] [Apply]          │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme

| Action | Color | Icon Background |
|--------|-------|-----------------|
| Create | Green | `bg-green-100` |
| Update | Blue | `bg-blue-100` |
| Delete | Red | `bg-red-100` |
| Complete | Purple | `bg-purple-100` |
| Archive | Gray | `bg-gray-100` |
| Import | Cyan | `bg-cyan-100` |

### Entity Icons (PrimeIcons)

| Entity | Icon |
|--------|------|
| League | `pi-flag` |
| Driver | `pi-user` |
| Competition | `pi-trophy` |
| Season | `pi-calendar` |
| Round | `pi-circle` |
| Race | `pi-car` |
| Qualifier | `pi-clock` |
| Division | `pi-th-large` |
| Team | `pi-users` |
| Season Driver | `pi-user-plus` |

---

## Implementation Order

1. **Create Types** - `activityLog.ts`
2. **Create Service** - `activityLogService.ts` + tests
3. **Create Composable** - `useActivityLog.ts` + tests
4. **Create Components:**
   - `ActivityItem.vue` + tests
   - `ActivityChanges.vue`
   - `ActivityFilters.vue` + tests
   - `ActivityLog.vue` + tests
5. **Integrate with League Settings**
6. **Add Route (if needed)**
7. **Run all tests**
8. **Run linting and formatting**

---

## Notes

### Date Formatting

Use `date-fns` for consistent date formatting:
- Relative: `formatDistanceToNow(date, { addSuffix: true })` → "2 hours ago"
- Absolute: `format(date, 'PPpp')` → "Oct 14, 2025, 3:30 PM"

### Accessibility

- Use proper ARIA labels for filter controls
- Ensure keyboard navigation for activity items
- Provide screen reader-friendly descriptions
- Use semantic HTML elements

### Performance

- Implement virtual scrolling for large lists (if >100 items)
- Use `AbortController` to cancel requests on filter changes
- Debounce filter inputs

### Responsive Design

- Stack filters vertically on mobile
- Condense activity items on smaller screens
- Hide less important info on mobile (e.g., IP address)
