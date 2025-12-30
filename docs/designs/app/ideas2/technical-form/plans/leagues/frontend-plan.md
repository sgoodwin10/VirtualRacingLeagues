# League Detail Page Redesign - Frontend Plan

## Agent: `dev-fe-app`

This document outlines the frontend implementation plan for redesigning the League Detail page.

---

## Phase 1: Layout Structure

### 1.1 Create Split Panel Container

**File**: `resources/app/js/views/LeagueDetail.vue`

Restructure the main template to use a two-panel layout:

```
<div class="main-container flex min-h-screen">
  <!-- Left Panel: Identity -->
  <aside class="identity-panel w-[380px] flex-shrink-0 ...">
    <LeagueIdentityPanel :league="league" />
  </aside>

  <!-- Right Panel: Dynamic Content -->
  <main class="content-panel flex-1 min-w-0">
    <LeagueDashboardPanel :league="league" />
  </main>
</div>
```

### 1.2 Responsive Breakpoints

- **Desktop** (>1024px): Side-by-side panels
- **Tablet/Mobile** (≤1024px): Stacked panels (identity on top)

---

## Phase 2: Left Panel Components

### 2.1 Create `LeagueIdentityPanel.vue`

**Location**: `resources/app/js/components/league/partials/LeagueIdentityPanel.vue`

**Structure**:
```
<aside class="identity-panel">
  <LeagueIdentityHeader :league="league" />
  <LeagueIdentityContent :league="league" />
  <LeagueIdentityFooter :league="league" @edit="..." @settings="..." />
</aside>
```

### 2.2 Create `LeagueIdentityHeader.vue`

**Location**: `resources/app/js/components/league/partials/LeagueIdentityHeader.vue`

**Features**:
- Background image with gradient overlay
- Grid pattern overlay (CSS background-image)
- League logo with fallback (existing `ResponsiveImage` component)
- Position logo at bottom with offset

**Props**:
```typescript
interface Props {
  headerImageUrl?: string | null;
  headerImageMedia?: MediaObject | null;
  logoUrl?: string | null;
  logoMedia?: MediaObject | null;
  leagueName: string;
}
```

### 2.3 Create `LeagueIdentityContent.vue`

**Location**: `resources/app/js/components/league/partials/LeagueIdentityContent.vue`

**Sections**:
1. **League Name & Tagline**
2. **Status Tags** (reuse `LeagueVisibilityTag`, create `LeagueStatusTag`)
3. **Stats Grid** (use new `StatsGrid` component)
4. **Terminal Config Panel** (new `TerminalPanel` component)
5. **Social Links Bar** (refactor from `LeagueSocialMediaPanel`)

**Props**:
```typescript
interface Props {
  league: League;
}
```

### 2.4 Create `TerminalPanel.vue` (Common Component)

**Location**: `resources/app/js/components/common/panels/TerminalPanel.vue`

**Features**:
- Terminal-style header with dots (red, yellow, green)
- Title (e.g., "league.config")
- Body with key-value lines
- Supports links and plain text values

**Props**:
```typescript
interface Props {
  title: string;
  lines: Array<{
    label: string;
    value: string;
    isLink?: boolean;
    href?: string;
  }>;
}
```

### 2.5 Create `StatsGrid.vue` (Common Component)

**Location**: `resources/app/js/components/common/stats/StatsGrid.vue`

**Features**:
- 2x2 or configurable grid
- Each cell shows value + label
- Monospace typography for values

**Props**:
```typescript
interface Props {
  stats: Array<{
    value: number | string;
    label: string;
  }>;
  columns?: 2 | 4;
}
```

### 2.6 Create `SocialLinksBar.vue`

**Location**: `resources/app/js/components/common/social/SocialLinksBar.vue`

**Features**:
- Horizontal bar of icon buttons
- Supports: Discord, Twitter/X, YouTube, Twitch, Instagram, Website
- Uses Phosphor icons

**Props**:
```typescript
interface Props {
  links: {
    discord?: string;
    twitter?: string;
    youtube?: string;
    twitch?: string;
    instagram?: string;
    website?: string;
  };
}
```

### 2.7 Create `LeagueIdentityFooter.vue`

**Location**: `resources/app/js/components/league/partials/LeagueIdentityFooter.vue`

**Features**:
- "Manage Drivers" button (links to `/leagues/{id}/drivers` route)
- "Edit League" button (subtle/secondary variant)
- "Settings" button (opens `LeagueWizardDrawer`)

**Emits**:
```typescript
interface Emits {
  (e: 'edit'): void;
  (e: 'settings'): void;
}
```

**Note**: "Manage Drivers" button should be positioned above the terminal config panel, not in the footer.

### 2.8 Create `LeagueStatusTag.vue`

**Location**: `resources/app/js/components/league/partials/LeagueStatusTag.vue`

**Features**:
- Display "Active" or "Archived" status
- Uses status-tag styling from design

---

## Phase 3: Right Panel Components

### 3.1 Create `LeagueDashboardPanel.vue`

**Location**: `resources/app/js/components/league/dashboard/LeagueDashboardPanel.vue`

**Structure**:
```
<main class="content-panel">
  <LeagueDashboardHeader :league="league" @new-season="..." />
  <div class="content-body">
    <ActiveSeasonsSection :league-id="leagueId" />
    <CompetitionsSection :league-id="leagueId" />
    <RecentActivitySection /> <!-- Placeholder -->
  </div>
</main>
```

### 3.2 Create `LeagueDashboardHeader.vue`

**Location**: `resources/app/js/components/league/dashboard/LeagueDashboardHeader.vue`

**Features**:
- Title with "// DASHBOARD" prefix (technical style)
- "New Season" primary button

### 3.3 Create `ActiveSeasonsSection.vue`

**Location**: `resources/app/js/components/league/dashboard/ActiveSeasonsSection.vue`

**Features**:
- Section header with "Active Seasons" title and divider line
- List of seasons using `ListContainer` and `ListRow`
- Season indicator colour from season's `competition_colour`
- Status-based indicator (active/upcoming/completed)

**Uses Components**:
- `ListContainer`
- `ListRow`
- `ListRowIndicator` (customized with season colour)
- `ListRowStats`
- `Button` (ghost variant for "View" action)

### 3.4 Create `CompetitionsSection.vue`

**Location**: `resources/app/js/components/league/dashboard/CompetitionsSection.vue`

**Features**:
- Section header with "Competitions" title
- Grid of competition tiles (card style)
- Clicking tile opens info modal (basic for V1)
- "Add Competition" tile at end

**Uses**:
- Existing `CompetitionFormDrawer` for add functionality
- New `CompetitionInfoModal` for basic info display

### 3.5 Create `CompetitionInfoModal.vue`

**Location**: `resources/app/js/components/competition/CompetitionInfoModal.vue`

**Features** (V1 - Basic):
- Modal/Dialog showing competition name, description, platform
- "View Details" button to navigate to competition
- Simple layout, expandable in V2

### 3.6 Create `RecentActivitySection.vue` (Placeholder)

**Location**: `resources/app/js/components/league/dashboard/RecentActivitySection.vue`

**Features**:
- Section header with "Recent Activity" title
- Empty state message: "Activity tracking coming soon"
- Prepare structure for V3 implementation

---

## Phase 4: Styling & CSS

### 4.1 CSS Variables

Add to `resources/app/css/app.css` or component scoped styles:

```css
:root {
  /* Technical Blueprint Theme */
  --bg-dark: #0d1117;
  --bg-panel: #161b22;
  --bg-card: #1c2128;
  --bg-elevated: #21262d;
  --bg-highlight: #272d36;

  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;

  --cyan: #58a6ff;
  --cyan-dim: rgba(88, 166, 255, 0.15);
  --green: #7ee787;
  --green-dim: rgba(126, 231, 135, 0.15);
  --orange: #f0883e;
  --orange-dim: rgba(240, 136, 62, 0.15);
  --purple: #bc8cff;
  --purple-dim: rgba(188, 140, 255, 0.15);

  --border: #30363d;
  --border-muted: #21262d;
  --radius: 6px;
  --grid-color: rgba(88, 166, 255, 0.06);

  --font-mono: 'IBM Plex Mono', 'SF Mono', monospace;
  --font-sans: 'Inter', -apple-system, sans-serif;
}
```

### 4.2 Grid Pattern Background

```css
.grid-pattern {
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

### 4.3 Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-panel);
}
::-webkit-scrollbar-thumb {
  background: var(--bg-highlight);
  border-radius: 4px;
}
```

---

## Phase 4B: Driver Management Route

### 4B.1 Create `LeagueDrivers.vue` View

**Location**: `resources/app/js/views/LeagueDrivers.vue`

**Purpose**: Dedicated page for managing league drivers (moved from tab in LeagueDetail)

**Features**:
- Breadcrumbs: Home > Leagues > {League Name} > Drivers
- Page header with league name and "Back to League" link
- Reuse existing driver components:
  - `LeagueDriversTab` content
  - `DriverFormDialog`
  - `ViewDriverModal`
  - `CSVImportDialog`

**Structure**:
```vue
<template>
  <div class="max-w-7xl mx-auto p-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center mb-6">
      <h1>Manage Drivers</h1>
      <Button label="Back to League" :icon="PhArrowLeft" @click="goBack" />
    </div>

    <LeagueDriversTab
      :league-id="leagueId"
      @add-driver="handleAddDriver"
      @import-csv="handleImportCSV"
      ...
    />

    <!-- Existing modals -->
  </div>
</template>
```

### 4B.2 Add Route

**File**: `resources/app/js/router/index.ts`

```typescript
{
  path: '/leagues/:id/drivers',
  name: 'league-drivers',
  component: () => import('@app/views/LeagueDrivers.vue'),
  meta: { requiresAuth: true }
}
```

### 4B.3 Update `LeagueIdentityContent.vue`

Add "Manage Drivers" button above the terminal config panel:

```vue
<!-- Above Terminal Panel -->
<router-link
  :to="{ name: 'league-drivers', params: { id: league.id } }"
  class="btn btn--secondary btn--block mb-4"
>
  <PhUsers :size="16" />
  Manage Drivers
</router-link>

<TerminalPanel title="league.config" :lines="configLines" />
```

---

## Phase 5: Data & State Management

### 5.1 Seasons Data

**Composable**: Create `useLeagueSeasons.ts`

```typescript
// resources/app/js/composables/useLeagueSeasons.ts
export function useLeagueSeasons(leagueId: Ref<number>) {
  const seasons = ref<Season[]>([]);
  const loading = ref(false);

  async function fetchActiveSeasons() {
    // Fetch seasons across all competitions for the league
    // Filter to active/upcoming only
  }

  return { seasons, loading, fetchActiveSeasons };
}
```

### 5.2 Required API Endpoints (if not existing)

Check if endpoint exists for fetching all seasons across league competitions. If not, coordinate with backend team.

---

## Phase 6: Testing

### 6.1 Component Tests

Create tests for new components:
- `LeagueIdentityPanel.test.ts`
- `LeagueDashboardPanel.test.ts`
- `TerminalPanel.test.ts`
- `StatsGrid.test.ts`
- `SocialLinksBar.test.ts`
- `ActiveSeasonsSection.test.ts`
- `CompetitionsSection.test.ts`

### 6.2 Integration Tests

Update existing `LeagueDetail.vue` tests to verify:
- Layout renders correctly
- Navigation to seasons works
- Edit/Settings modals open correctly
- Responsive behaviour

---

## Component Hierarchy

```
LeagueDetail.vue
├── LeagueIdentityPanel.vue
│   ├── LeagueIdentityHeader.vue
│   │   └── ResponsiveImage (existing)
│   ├── LeagueIdentityContent.vue
│   │   ├── LeagueVisibilityTag (existing)
│   │   ├── LeagueStatusTag (new)
│   │   ├── StatsGrid (new common)
│   │   ├── "Manage Drivers" RouterLink → /leagues/{id}/drivers
│   │   ├── TerminalPanel (new common)
│   │   └── SocialLinksBar (new common)
│   └── LeagueIdentityFooter.vue
│       └── Button (existing) - Edit League, Settings
├── LeagueDashboardPanel.vue
│   ├── LeagueDashboardHeader.vue
│   │   └── Button (existing)
│   ├── ActiveSeasonsSection.vue
│   │   ├── ListSectionHeader (existing)
│   │   ├── ListContainer (existing)
│   │   └── ListRow (existing)
│   ├── CompetitionsSection.vue
│   │   ├── Card (existing)
│   │   ├── CompetitionFormDrawer (existing)
│   │   └── CompetitionInfoModal (new)
│   └── RecentActivitySection.vue (placeholder)
└── LeagueWizardDrawer (existing)

LeagueDrivers.vue (NEW - separate route)
├── Breadcrumbs (existing)
├── LeagueDriversTab (existing, moved from LeagueDetail)
├── DriverFormDialog (existing)
├── ViewDriverModal (existing)
└── CSVImportDialog (existing)
```

---

## Implementation Order

1. **Phase 1**: Create layout structure in `LeagueDetail.vue`
2. **Phase 2.1-2.2**: Create left panel container and header
3. **Phase 4.1**: Add CSS variables to app.css
4. **Phase 2.4-2.5**: Create common components (`TerminalPanel`, `StatsGrid`)
5. **Phase 2.3**: Create `LeagueIdentityContent`
6. **Phase 2.6-2.8**: Complete left panel components
7. **Phase 3.1-3.2**: Create right panel container and header
8. **Phase 3.3**: Create `ActiveSeasonsSection`
9. **Phase 3.4-3.5**: Create `CompetitionsSection` and modal
10. **Phase 3.6**: Create placeholder for `RecentActivitySection`
11. **Phase 4B**: Create `LeagueDrivers.vue` view and route
12. **Phase 5**: Data/state management updates
13. **Phase 6**: Testing

---

## Notes for Implementation

1. **Preserve existing modals**: `LeagueWizardDrawer`, `CompetitionFormDrawer` remain unchanged
2. **Drivers tab**: Consider keeping driver management accessible (either as a modal or separate route)
3. **Breadcrumbs**: Keep existing breadcrumb navigation
4. **Loading states**: Maintain skeleton loading for all sections
5. **Error states**: Preserve existing error handling patterns
