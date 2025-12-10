# League Detail View - Implementation Plan Overview

## Feature Summary

Update the League Detail View (`LeagueDetailView.vue`) to display real data from the backend with a new design aesthetic based on the Motorsport Editorial design system.

## Current State

### What Exists
- `LeagueDetailView.vue` - Basic structure with **mock data** (hardcoded JSON)
- `PublicLeaguesView.vue` - League list that links to detail view via `/leagues/:slug`
- `PublicLeagueController` - Only has `index()` method for listing leagues
- `publicApi.ts` - Only has `fetchLeagues()` method
- Types defined: `PublicLeague`, `PublicCompetition`, `PublicSeason`

### What's Missing
- Backend API endpoint: `GET /api/public/leagues/{slug}`
- Frontend API method: `fetchLeague(slug)`
- Composable: `usePublicLeagueDetail`
- Real data integration in `LeagueDetailView.vue`
- New design implementation

## Scope

### In Scope
1. **Backend**: New public API endpoint returning league with competitions and seasons
2. **Frontend**: Redesigned League Detail View with:
   - Hero section with league info and social links
   - Stats bar (competitions, active seasons, drivers, platform)
   - Collapsible competition cards with seasons
   - Sidebar with real data:
     - Recent Activity
     - Upcoming Races
     - Championship Leaders
3. **Data**: All sections show real data from the backend

### Out of Scope
- Drivers tab (just Competitions tab for now)
- Statistics tab (just Competitions tab for now)
- Season detail view updates (separate task)

## Data Requirements

### League Detail Endpoint Response
```typescript
{
  league: {
    id: number;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    logo_url: string | null;
    header_image_url: string | null;
    platforms: Platform[];
    visibility: 'public' | 'unlisted';
    discord_url: string | null;
    website_url: string | null;
    twitter_handle: string | null;
    youtube_url: string | null;
    twitch_url: string | null;
    created_at: string;
  };
  stats: {
    competitions_count: number;
    active_seasons_count: number;
    drivers_count: number;
  };
  competitions: Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    competition_colour: string | null;
    platform: Platform;
    stats: {
      total_seasons: number;
      active_seasons: number;
      total_drivers: number;
    };
    seasons: Array<{
      id: number;
      name: string;
      slug: string;
      car_class: string | null;
      status: 'setup' | 'active' | 'completed' | 'archived';
      stats: {
        total_drivers: number;
        active_drivers: number;
        total_rounds: number;
        completed_rounds: number;
        next_race_date: string | null;
      };
    }>;
  }>;
  recent_activity: Array<{
    type: 'race_completed' | 'driver_joined' | 'season_started' | 'championship_leader';
    title: string;
    subtitle: string;
    timestamp: string;
    icon_type: 'success' | 'info' | 'warning' | 'gold' | 'purple';
  }>;
  upcoming_races: Array<{
    id: number;
    track_name: string;
    season_name: string;
    competition_name: string;
    scheduled_at: string;
    drivers_registered: number;
    is_next: boolean;
  }>;
  championship_leaders: Array<{
    position: number;
    driver_name: string;
    season_name: string;
    points: number;
  }>;
}
```

## Design Reference

Based on `.claude/guides/design/app-public/league-detail.html`:

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Navigation Header (existing)                                │
├─────────────────────────────────────────────────────────────┤
│  Hero Section                                                │
│  ┌──────┐  League Name                    [Social Links]    │
│  │ Logo │  Tagline                                          │
│  └──────┘  [Platform Badge]                                 │
├─────────────────────────────────────────────────────────────┤
│  Stats Bar: Competitions | Active Seasons | Drivers | Plat  │
├─────────────────────────────────────────────────────────────┤
│  Main Content (8 cols)         │  Sidebar (4 cols)          │
│  ┌───────────────────────────┐ │ ┌─────────────────────────┐│
│  │ Description (racing-stripe)│ │ │ Recent Activity        ││
│  └───────────────────────────┘ │ │ - Race completed        ││
│  ┌───────────────────────────┐ │ │ - Driver joined         ││
│  │ [Competitions] Tab         │ │ └─────────────────────────┘│
│  └───────────────────────────┘ │ ┌─────────────────────────┐│
│  ┌───────────────────────────┐ │ │ Upcoming Races          ││
│  │ Competition Card (collaps) │ │ │ - Spa (In 3 days)       ││
│  │ ┌─────────────────────────┐│ │ │ - Monza (Dec 18)        ││
│  │ │ Season Row (clickable)  ││ │ └─────────────────────────┘│
│  │ │ Season Row (clickable)  ││ │ ┌─────────────────────────┐│
│  │ └─────────────────────────┘│ │ │ Championship Leaders    ││
│  └───────────────────────────┘ │ │ 1. Alex Chen - 156 pts   ││
│                                │ │ 2. Marcus Weber - 142    ││
│                                │ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Design Elements
- **Hero**: Full-width with background image, gradient overlay
- **Stats Bar**: 4-column grid with gradient-border cards
- **Competition Cards**: Collapsible with colored logo backgrounds
- **Season Rows**: Status badges (Active/Completed/Scheduled), driver & race counts
- **Sidebar Cards**: Consistent card styling with headers and icons

## Implementation Approach

### Phase 1: Backend (Agent: dev-be)
1. Create DTOs for public league detail response
2. Add repository methods for fetching related data
3. Add `show()` method to `PublicLeagueController`
4. Add route: `GET /api/public/leagues/{slug}`

### Phase 2: Frontend (Agent: dev-fe-public)
1. Add `fetchLeague(slug)` to `publicApi.ts`
2. Create `usePublicLeagueDetail` composable
3. Redesign `LeagueDetailView.vue` with new design
4. Implement collapsible competition cards
5. Add sidebar components

## Success Criteria

- [ ] League detail page loads real data from API
- [ ] Hero section displays league info correctly
- [ ] Stats bar shows accurate counts
- [ ] Competitions expand/collapse to show seasons
- [ ] Seasons link to season detail view
- [ ] Sidebar shows real activity, races, and leaders
- [ ] Loading and error states work correctly
- [ ] Design matches the reference HTML mockup
- [ ] Mobile responsive layout

## File Changes Summary

### Backend (New/Modified)
| File | Action | Description |
|------|--------|-------------|
| `app/Http/Controllers/Public/PublicLeagueController.php` | Modify | Add `show()` method |
| `app/Application/League/DTOs/PublicLeagueDetailData.php` | Create | Response DTO |
| `app/Application/League/Services/LeagueApplicationService.php` | Modify | Add `getPublicLeagueDetail()` |
| `app/Domain/League/Repositories/LeagueRepositoryInterface.php` | Modify | Add interface methods |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueRepository.php` | Modify | Implement methods |
| `routes/subdomain.php` | Modify | Add route |

### Frontend (New/Modified)
| File | Action | Description |
|------|--------|-------------|
| `resources/public/js/services/publicApi.ts` | Modify | Add `fetchLeague()` |
| `resources/public/js/composables/usePublicLeagueDetail.ts` | Create | Data fetching composable |
| `resources/public/js/views/leagues/LeagueDetailView.vue` | Modify | Complete redesign |
| `resources/public/js/types/public.ts` | Modify | Add response types |

## Timeline Estimate

This plan does not include time estimates. Implementation will proceed step-by-step with the backend completed before frontend integration.
