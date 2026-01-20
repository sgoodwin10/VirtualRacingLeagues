# Public Leagues - Frontend Implementation Plan

## Overview

This document details the frontend implementation for the Public Leagues feature on the public site (`resources/public/js/`).

## File Structure

```
resources/public/js/
├── views/
│   └── leagues/
│       ├── LeaguesView.vue          # /leagues - Browse all leagues
│       ├── LeagueDetailView.vue     # /leagues/:slug - View single league
│       └── SeasonDetailView.vue     # /leagues/:league/:comp/:season
├── components/
│   └── leagues/
│       ├── LeagueCard.vue           # Individual league card
│       ├── LeagueSearchBar.vue      # Search + filters
│       ├── LeagueHeader.vue         # League detail header
│       ├── CompetitionCard.vue      # Competition with seasons
│       ├── SeasonChip.vue           # Clickable season button
│       ├── StandingsTable.vue       # Driver standings
│       ├── TeamStandingsTable.vue   # Team standings
│       └── DivisionTabs.vue         # Division selector
├── services/
│   └── leagueService.ts             # League API calls
├── composables/
│   └── useLeagues.ts                # (Optional) Shared league state
└── types/
    └── public.ts                    # (Existing) Add any missing types
```

## Route Configuration

**File:** `resources/public/js/router/index.ts`

```typescript
// Add these routes
{
  path: '/leagues',
  name: 'leagues',
  component: () => import('@public/views/leagues/LeaguesView.vue'),
  meta: { title: 'Leagues' }
},
{
  path: '/leagues/:leagueSlug',
  name: 'league-detail',
  component: () => import('@public/views/leagues/LeagueDetailView.vue'),
  meta: { title: 'League' }
},
{
  path: '/leagues/:leagueSlug/:competitionSlug/:seasonSlug',
  name: 'season-detail',
  component: () => import('@public/views/leagues/SeasonDetailView.vue'),
  meta: { title: 'Season Standings' }
}
```

## Component Specifications

### 1. LeaguesView.vue

**Purpose:** Main leagues listing page

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Leagues]                            │
│                                                         │
│ // LEAGUES                                              │
│ Browse and explore racing leagues from around the world │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [🔍 Search leagues...]  [Platform ▼]  [Sort By ▼]   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ League 1 │ │ League 2 │ │ League 3 │                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ League 4 │ │ League 5 │ │ League 6 │                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
│                                                         │
│ [← 1 2 3 4 →] (Pagination)                              │
│                                                         │
│ [PublicFooter]                                          │
└─────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. On mount, fetch leagues from `/api/public/leagues`
2. Watch search/filter inputs, debounce API calls
3. Handle pagination state

**Props:** None (top-level view)

**State:**
```typescript
const leagues = ref<PublicLeague[]>([])
const loading = ref(false)
const searchQuery = ref('')
const platformFilter = ref<string | null>(null)
const sortBy = ref<'popular' | 'recent' | 'name'>('popular')
const pagination = ref({ page: 1, total: 0, perPage: 12 })
```

**API Calls:**
- `GET /api/public/leagues?search=&platform=&sort=&page=`
- `GET /api/public/platforms`

---

### 2. LeagueCard.vue

**Purpose:** Display a single league in the grid

**Props:**
```typescript
interface Props {
  league: PublicLeague
}
```

**Template Structure:**
```vue
<div class="league-card">
  <!-- Banner with gradient/image -->
  <div class="league-banner" :style="bannerStyle">
    <!-- Logo positioned bottom-left -->
    <div class="league-logo">
      <img v-if="league.logo" :src="league.logo" />
      <span v-else>{{ initials }}</span>
    </div>
  </div>

  <!-- Content area -->
  <div class="league-content">
    <h3>{{ league.name }}</h3>
    <span class="platform-badge">{{ platformIcon }} {{ league.platform }}</span>

    <!-- Stats row -->
    <div class="league-stats">
      <div class="stat">
        <span class="value">{{ league.driver_count }}</span>
        <span class="label">Drivers</span>
      </div>
      <div class="stat">
        <span class="value">{{ league.competition_count }}</span>
        <span class="label">Competitions</span>
      </div>
      <div class="stat">
        <span class="value">{{ league.race_count }}</span>
        <span class="label">Races</span>
      </div>
    </div>
  </div>
</div>
```

**Computed:**
- `initials`: First letters of league name
- `bannerStyle`: Background gradient or image URL
- `platformIcon`: Emoji based on platform

**Events:**
- Click navigates to `/leagues/:slug`

---

### 3. LeagueSearchBar.vue

**Purpose:** Search input and filter dropdowns

**Props:**
```typescript
interface Props {
  modelValue: string        // search query
  platform: string | null   // selected platform
  sortBy: string            // sort option
  platforms: Platform[]     // available platforms
}
```

**Emits:**
```typescript
'update:modelValue'
'update:platform'
'update:sortBy'
```

**Template:**
```vue
<div class="search-bar">
  <div class="search-input-wrapper">
    <PhMagnifyingGlass class="search-icon" />
    <input
      type="text"
      placeholder="Search leagues by name..."
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>

  <select v-model="platformValue">
    <option :value="null">All Platforms</option>
    <option v-for="p in platforms" :key="p.id" :value="p.id">
      {{ p.name }}
    </option>
  </select>

  <select v-model="sortValue">
    <option value="popular">Most Popular</option>
    <option value="recent">Recently Active</option>
    <option value="name">Name A-Z</option>
  </select>
</div>
```

---

### 4. LeagueDetailView.vue

**Purpose:** Single league page with competitions

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [← Back to Leagues]                                     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Banner Image/Gradient]                             │ │
│ │ ┌────┐                                              │ │
│ │ │Logo│ LEAGUE NAME                                  │ │
│ │ └────┘ 🎮 Platform • 24 Drivers • 3 Competitions    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ // COMPETITIONS                                         │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ GT4 Championship                        [ACTIVE]    │ │
│ │ [Winter 2026*] [Fall 2025] [Summer 2025]           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Endurance Series                        [ACTIVE]    │ │
│ │ [Season 3*] [Season 2]                              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [PublicFooter]                                          │
└─────────────────────────────────────────────────────────┘
```

**Route Params:**
```typescript
const route = useRoute()
const leagueSlug = computed(() => route.params.leagueSlug as string)
```

**Data Flow:**
1. Fetch league detail from `/api/public/leagues/:slug`
2. Response includes competitions with their seasons

**State:**
```typescript
const league = ref<PublicLeagueDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
```

---

### 5. CompetitionCard.vue

**Purpose:** Display competition with season chips

**Props:**
```typescript
interface Props {
  competition: PublicCompetition
  leagueSlug: string
}
```

**Template:**
```vue
<div class="competition-card">
  <div class="competition-header">
    <h3>{{ competition.name }}</h3>
    <VrlBadge
      :variant="competition.status === 'active' ? 'success' : 'muted'"
    >
      {{ competition.status }}
    </VrlBadge>
  </div>

  <div class="seasons-list">
    <SeasonChip
      v-for="season in competition.seasons"
      :key="season.id"
      :season="season"
      :is-current="season.status === 'active'"
      :league-slug="leagueSlug"
      :competition-slug="competition.slug"
    />
  </div>
</div>
```

---

### 6. SeasonChip.vue

**Purpose:** Clickable season button

**Props:**
```typescript
interface Props {
  season: PublicSeason
  isCurrent: boolean
  leagueSlug: string
  competitionSlug: string
}
```

**Template:**
```vue
<router-link
  :to="`/leagues/${leagueSlug}/${competitionSlug}/${season.slug}`"
  :class="['season-chip', { 'active': isCurrent }]"
>
  {{ season.name }}
</router-link>
```

**Styling:**
- Default: `bg-elevated`, `border-border`, `text-secondary`
- Active (current): `bg-cyan-dim`, `border-cyan`, `text-cyan`
- Hover: `border-cyan`, `text-cyan`

---

### 7. SeasonDetailView.vue

**Purpose:** Season standings page

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [Breadcrumb: Leagues > League Name > Competition]       │
│                                                         │
│ // GT4 CHAMPIONSHIP - WINTER 2026                       │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ GT4 Championship - Winter 2026                      │ │
│ │                        [Div 1] [Div 2] [Div 3]      │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │  #  │ Driver            │ Team    │ R1│R2│R3│ PTS  │ │
│ │ ──────────────────────────────────────────────────  │ │
│ │  1  │ Max Velocity      │ Red S.  │25│25│18│  93   │ │
│ │  2  │ Speed Ace         │ Blue L. │18│18│25│  79   │ │
│ │  3  │ Track Fury        │ Green M.│15│15│15│  60   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ (If team championship enabled)                          │
│ // TEAM STANDINGS                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  #  │ Team              │ Points                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [PublicFooter]                                          │
└─────────────────────────────────────────────────────────┘
```

**Route Params:**
```typescript
const leagueSlug = computed(() => route.params.leagueSlug)
const competitionSlug = computed(() => route.params.competitionSlug)
const seasonSlug = computed(() => route.params.seasonSlug)
```

**API Call:**
- `GET /api/public/leagues/:leagueSlug/seasons/:seasonSlug`
- Note: The API uses leagueSlug + seasonSlug, competition is for URL clarity

**State:**
```typescript
const seasonData = ref<PublicSeasonDetailResponse | null>(null)
const selectedDivision = ref<number | null>(null)
const loading = ref(true)
```

**Computed:**
```typescript
// Get standings for selected division (or flat standings)
const currentStandings = computed(() => {
  if (!seasonData.value) return []
  if (seasonData.value.has_divisions && selectedDivision.value !== null) {
    return seasonData.value.standings.find(d => d.id === selectedDivision.value)?.drivers ?? []
  }
  return seasonData.value.standings
})
```

---

### 8. StandingsTable.vue

**Purpose:** Driver standings table

**Props:**
```typescript
interface Props {
  standings: SeasonStandingDriver[]
  rounds: PublicRound[]
  showTeams?: boolean
}
```

**Template:**
```vue
<div class="standings-section">
  <table class="standings-table">
    <thead>
      <tr>
        <th class="center">#</th>
        <th>Driver</th>
        <th v-if="showTeams">Team</th>
        <th v-for="round in rounds" :key="round.id" class="center">
          R{{ round.round_number }}
        </th>
        <th class="center">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="driver in standings"
        :key="driver.season_driver_id"
        :class="podiumClass(driver.position)"
      >
        <td :class="['position-cell', positionClass(driver.position)]">
          {{ driver.position }}
        </td>
        <td>
          <div class="driver-cell">
            <span class="driver-avatar">{{ getInitials(driver.driver_name) }}</span>
            <div>
              <div class="driver-name">{{ driver.driver_name }}</div>
              <div v-if="driver.team_name" class="driver-team">{{ driver.team_name }}</div>
            </div>
          </div>
        </td>
        <td v-if="showTeams">
          <div class="team-cell">
            <span class="team-color" :style="{ background: driver.team_color }"></span>
            {{ driver.team_name }}
          </div>
        </td>
        <td v-for="round in rounds" :key="round.id" class="round-cell">
          {{ getRoundPoints(driver, round.id) }}
        </td>
        <td class="points-cell">{{ driver.total_points }}</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Helper Functions:**
```typescript
const podiumClass = (pos: number) => {
  if (pos === 1) return 'podium-1'
  if (pos === 2) return 'podium-2'
  if (pos === 3) return 'podium-3'
  return ''
}

const positionClass = (pos: number) => {
  if (pos === 1) return 'p1'
  if (pos === 2) return 'p2'
  if (pos === 3) return 'p3'
  return ''
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getRoundPoints = (driver: SeasonStandingDriver, roundId: number) => {
  const roundData = driver.rounds?.find(r => r.round_id === roundId)
  return roundData?.points ?? '-'
}
```

---

### 9. DivisionTabs.vue

**Purpose:** Tab selector for divisions

**Props:**
```typescript
interface Props {
  divisions: SeasonStandingDivision[]
  modelValue: number | null
}
```

**Emits:**
```typescript
'update:modelValue'
```

**Template:**
```vue
<div class="standings-tabs">
  <button
    v-for="div in divisions"
    :key="div.id"
    :class="['standings-tab', { 'active': modelValue === div.id }]"
    @click="$emit('update:modelValue', div.id)"
  >
    {{ div.name }}
  </button>
</div>
```

---

## Service Layer

### leagueService.ts

```typescript
import api from '@public/services/api'
import { API_ENDPOINTS } from '@public/constants/apiEndpoints'
import type {
  PublicLeague,
  PublicLeagueDetailResponse,
  PublicSeasonDetailResponse,
  Platform
} from '@public/types/public'

interface LeagueListParams {
  search?: string
  platform?: string | number | null
  sort?: 'popular' | 'recent' | 'name'
  page?: number
  perPage?: number
}

interface LeagueListResponse {
  data: PublicLeague[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export const leagueService = {
  async getLeagues(params: LeagueListParams = {}): Promise<LeagueListResponse> {
    const response = await api.get(API_ENDPOINTS.PUBLIC.LEAGUES, { params })
    return response.data
  },

  async getLeagueDetail(slug: string): Promise<PublicLeagueDetailResponse> {
    const response = await api.get(`${API_ENDPOINTS.PUBLIC.LEAGUES}/${slug}`)
    return response.data
  },

  async getSeasonDetail(
    leagueSlug: string,
    seasonSlug: string
  ): Promise<PublicSeasonDetailResponse> {
    const response = await api.get(
      `${API_ENDPOINTS.PUBLIC.LEAGUES}/${leagueSlug}/seasons/${seasonSlug}`
    )
    return response.data
  },

  async getPlatforms(): Promise<Platform[]> {
    const response = await api.get(API_ENDPOINTS.PUBLIC.PLATFORMS)
    return response.data
  }
}
```

---

## Styling Guidelines

### Use Tailwind Classes Mapped to CSS Variables

```vue
<!-- Background colors -->
<div class="bg-[var(--bg-card)]">
<div class="bg-[var(--bg-elevated)]">

<!-- Text colors -->
<span class="text-[var(--text-primary)]">
<span class="text-[var(--text-secondary)]">
<span class="text-[var(--text-muted)]">

<!-- Accent colors -->
<span class="text-[var(--cyan)]">
<div class="bg-[var(--cyan-dim)]">

<!-- Borders -->
<div class="border border-[var(--border)]">

<!-- Border radius -->
<div class="rounded-[var(--radius)]">
<div class="rounded-[var(--radius-lg)]">
```

### Key Design Tokens

| Element | Classes |
|---------|---------|
| Card | `bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px]` |
| Card hover | `hover:border-[var(--cyan)] hover:-translate-y-1 transition-all` |
| Input | `bg-[var(--bg-dark)] border border-[var(--border)] rounded-[var(--radius)]` |
| Input focus | `focus:border-[var(--cyan)] focus:ring-[var(--cyan-dim)]` |
| Primary button | `bg-[var(--cyan)] text-[var(--bg-dark)] font-display` |
| Badge active | `bg-[var(--green-dim)] text-[var(--green)]` |
| Badge muted | `bg-[var(--bg-elevated)] text-[var(--text-muted)]` |
| Position 1 | `text-[var(--yellow)]` |
| Position 2 | `text-[var(--text-muted)]` |
| Position 3 | `text-[var(--orange)]` |
| Podium 1 row | `bg-[rgba(210,153,34,0.08)]` |
| Podium 2 row | `bg-[rgba(110,118,129,0.08)]` |
| Podium 3 row | `bg-[rgba(240,136,62,0.08)]` |

### Typography

| Element | Classes |
|---------|---------|
| Page title | `font-display text-[2.5rem] font-bold tracking-[2px]` |
| Section title | `font-display text-[1.25rem] font-semibold tracking-[1px]` |
| Card title | `font-display text-[1.1rem] font-semibold tracking-[0.5px]` |
| Body text | `font-body text-base` |
| Small text | `font-body text-sm` |
| Muted label | `text-xs uppercase tracking-[0.5px] text-[var(--text-muted)]` |

---

## Testing Plan

### Unit Tests (Vitest)

1. **LeagueCard.vue**
   - Renders league name and platform
   - Displays correct stats
   - Shows initials when no logo
   - Emits click/navigation

2. **LeagueSearchBar.vue**
   - Emits search query on input
   - Emits platform filter on select
   - Emits sort option on select

3. **StandingsTable.vue**
   - Renders all drivers
   - Applies podium highlighting
   - Shows round points correctly
   - Handles missing round data

4. **SeasonChip.vue**
   - Applies active class correctly
   - Generates correct route link

### Integration Tests

1. **LeaguesView.vue**
   - Fetches leagues on mount
   - Filters update API calls
   - Pagination works
   - Cards link to detail page

2. **LeagueDetailView.vue**
   - Fetches league on mount
   - Displays competitions
   - Season chips link correctly

3. **SeasonDetailView.vue**
   - Fetches season data
   - Division tabs work
   - Standings display correctly

---

## Implementation Order

1. **Phase 1: Service & Types**
   - Create `leagueService.ts`
   - Verify/update types in `public.ts`

2. **Phase 2: Core Components**
   - `LeagueCard.vue`
   - `LeagueSearchBar.vue`
   - `SeasonChip.vue`

3. **Phase 3: Leagues List**
   - `LeaguesView.vue`
   - Add route
   - Add nav link

4. **Phase 4: League Detail**
   - `LeagueHeader.vue`
   - `CompetitionCard.vue`
   - `LeagueDetailView.vue`
   - Add route

5. **Phase 5: Season Standings**
   - `StandingsTable.vue`
   - `DivisionTabs.vue`
   - `TeamStandingsTable.vue` (if needed)
   - `SeasonDetailView.vue`
   - Add route

6. **Phase 6: Polish**
   - Loading states
   - Error handling
   - Empty states
   - Mobile responsive testing

---

## Navigation Integration

Update `LandingNav.vue` or `PublicHeader.vue` to add "Leagues" link:

```vue
<nav-links>
  <router-link to="/#features">Features</router-link>
  <router-link to="/#how-it-works">How It Works</router-link>
  <router-link to="/#pricing">Pricing</router-link>
  <router-link to="/leagues" class="active">Leagues</router-link>
</nav-links>
```

---

## Agent Assignment

**Primary Agent:** `dev-fe-public`

This is exclusively frontend work on the public site. The `dev-fe-public` agent should handle all implementation.
