# Public Leagues Feature - Overview Plan

## Feature Summary

This feature adds a **public-facing Leagues browsing experience** to the Virtual Racing Leagues public site (`virtualracingleagues.localhost`). It allows anyone (authenticated or not) to:

1. **Browse Leagues** - Search and filter public leagues with a card grid layout
2. **View League Details** - See a league's competitions, seasons, and driver counts
3. **View Season Standings** - See full driver and team standings for any season

## Pages to Build

### 1. Leagues List Page (`/leagues`)
- Page title: "Leagues" (not "Public Leagues" as per requirements)
- Search bar with text input
- Filter dropdowns: Platform, Sort By
- Responsive card grid displaying public leagues
- Each card shows: logo, name, platform, driver count, competition count, race count
- Pagination controls
- Public footer included

### 2. View League Page (`/leagues/:leagueSlug`)
- League header with banner, logo, name, platform, stats
- Competitions section listing all competitions
- Each competition shows:
  - Competition name and status (Active/Completed)
  - Season chips with current season highlighted
  - Clicking season navigates to View Season page
- Public footer included

### 3. View Season Page (`/leagues/:leagueSlug/:competitionSlug/:seasonSlug`)
- Breadcrumb navigation
- Season header with name and metadata
- Driver standings table with:
  - Position (with podium highlighting)
  - Driver name and avatar
  - Team (with color indicator)
  - Round-by-round points
  - Total points
- Division tabs (if season has divisions enabled)
- Team standings section (if team championship enabled)
- Public footer included

## URL Structure

| Page | URL Pattern | Example |
|------|-------------|---------|
| Leagues List | `/leagues` | `/leagues` |
| League Detail | `/leagues/:leagueSlug` | `/leagues/red-storm-racing` |
| Season Detail | `/leagues/:leagueSlug/:competitionSlug/:seasonSlug` | `/leagues/red-storm-racing/gt4-championship/winter-2026` |

## Existing Assets

### Backend (Ready to Use)
- **API Endpoints**: All public API endpoints exist and are functional
  - `GET /api/public/leagues` - List with pagination & filters
  - `GET /api/public/leagues/{slug}` - League detail with competitions
  - `GET /api/public/leagues/{leagueSlug}/seasons/{seasonSlug}` - Season standings
  - `GET /api/public/platforms` - Platform list for filter
- **Domain Models**: League, Competition, Season entities are complete
- **DTOs**: PublicLeagueData, PublicLeagueDetailData, PublicSeasonDetailData exist
- **Application Services**: LeagueApplicationService has all required methods

### Frontend (Ready to Use)
- **Component Library**: VrlCard, VrlDataTable, VrlBadge, VrlTabs, VrlBreadcrumbs
- **Layout**: PublicFooter, PublicHeader components
- **Types**: All TypeScript interfaces defined in `types/public.ts`
- **API Service**: Axios-based API client configured
- **Styling**: CSS variables and design system established

## What Needs to Be Built

### Frontend Only
The backend is complete. All work is frontend implementation:

1. **New Views** (3 files):
   - `LeaguesView.vue` - Leagues list page
   - `LeagueDetailView.vue` - Single league page
   - `SeasonDetailView.vue` - Season standings page

2. **New Components** (~8-10 components):
   - `LeagueCard.vue` - Card for league in grid
   - `LeagueHeader.vue` - League detail header
   - `CompetitionCard.vue` - Competition with seasons
   - `SeasonChip.vue` - Clickable season tag
   - `StandingsTable.vue` - Driver standings display
   - `TeamStandingsTable.vue` - Team standings display
   - `LeagueSearchBar.vue` - Search and filter bar
   - `DivisionTabs.vue` - Division selector tabs

3. **New Services** (1 file):
   - `leagueService.ts` - API calls for leagues

4. **Route Configuration**:
   - Add routes to public router

5. **Integration**:
   - Add "Leagues" link to navigation

## Design Compliance

Must match the static HTML design (`leagues.html`) exactly:
- Dark theme with CSS variables
- Orbitron font for display text
- Inter font for body text
- Cyan accent color (#58a6ff)
- Card hover effects with transform and border color change
- Podium row highlighting (gold, silver, bronze)
- Responsive grid layout
- Use Tailwind CSS (no custom CSS)

## Related Plans

- [Frontend Implementation Plan](./frontend-plan.md) - Detailed Vue.js implementation
- [Backend Notes](./backend-plan.md) - Backend context and API reference

## Agents for Implementation

| Agent | Purpose |
|-------|---------|
| `dev-fe-public` | Primary - All frontend implementation for public site |
| `dev-be` | Reference only - Backend already complete, may need minor tweaks |

## Success Criteria

1. Users can browse all public leagues from the public site
2. Users can search leagues by name
3. Users can filter leagues by platform
4. Users can view a league's competitions and seasons
5. Users can view full season standings with driver/team tables
6. All pages include the public footer
7. Design matches the static HTML exactly
8. Mobile responsive design works correctly
9. No authentication required for any page
