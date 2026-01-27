# White Label SeasonDetailView Implementation Plan

**Version:** 1.0
**Created:** 2026-01-27
**Status:** Planning Phase

---

## Table of Contents
1. [Overview](#overview)
2. [Requirements Summary](#requirements-summary)
3. [Architecture Decisions](#architecture-decisions)
4. [File Structure](#file-structure)
5. [Router Implementation](#router-implementation)
6. [Component Structure](#component-structure)
7. [Data Flow](#data-flow)
8. [Styling Approach](#styling-approach)
9. [Implementation Steps](#implementation-steps)
10. [Testing Strategy](#testing-strategy)
11. [Edge Cases and Considerations](#edge-cases-and-considerations)

---

## Overview

The white label version of the SeasonDetailView provides a stripped-down, print-friendly version of the season standings and rounds information. It is designed to be embedded in third-party websites via an iframe or displayed in a minimal standalone view.

The white label view is accessed by appending `?whitelabel=true` to the existing season detail URL:
```
/leagues/:leagueSlug/:competitionSlug/:seasonSlug?whitelabel=true
```

---

## Requirements Summary

### Functional Requirements
- **Access Control**: Triggered by `?whitelabel=true` query parameter
- **Data**: Uses the same API endpoint as the regular SeasonDetailView (`leagueService.getSeasonDetail()`)
- **Content**: Displays standings and rounds information (same data as regular view)

### Design Requirements
- **Light Mode**: Light background, dark text (opposite of main site)
- **Minimal Styling**: Simple, clean design
- **No Navigation**: No header, footer, or site navigation
- **Simple Typography**: Use `font-body` throughout, standard font sizes
- **Print-Friendly**: Optimized for printing or PDF generation
- **Custom UI Components**: Build custom accordions instead of using `VrlAccordion`

### Technical Requirements
- **Separate Component**: Completely independent from existing `SeasonDetailView.vue`
- **No Modifications**: Do NOT modify existing components
- **Reuse API**: Same `leagueService.getSeasonDetail()` call
- **Responsive**: Should work on various screen sizes (though primarily for desktop/printing)

---

## Architecture Decisions

### Decision 1: Single-File Component vs. Multiple Components
**Decision**: Start with a single-file component, extract sub-components if needed during implementation.

**Rationale**:
- Simpler to maintain for a focused use case
- Easier to ensure consistent light-mode styling
- Can extract reusable parts later if needed
- Reduces file count and complexity

### Decision 2: Route Handling
**Decision**: Use a route guard in the existing `season-detail` route to detect `?whitelabel=true` and dynamically swap components.

**Rationale**:
- Maintains the same URL structure
- No changes to backend routing
- Easy to implement with Vue Router's component resolution
- SEO-friendly (same URLs)

**Alternative Considered**: Create a separate route (e.g., `/leagues/:leagueSlug/:competitionSlug/:seasonSlug/whitelabel`)
- Rejected: More complex, requires backend routing changes, different URLs

### Decision 3: Styling Approach
**Decision**: Use scoped Tailwind classes with a light-mode color palette defined in the component.

**Rationale**:
- No CSS variables needed (self-contained)
- Easy to override dark-mode defaults
- Scoped to component, won't affect other views
- Print-friendly with standard colors

### Decision 4: Accordion Implementation
**Decision**: Build a simple custom accordion using native Vue reactivity (v-show with boolean toggle).

**Rationale**:
- VrlAccordion is designed for dark mode and complex styling
- Custom accordion is simpler, lighter, and easier to style for light mode
- Full control over markup and behavior
- No dependencies on existing styled components

---

## File Structure

```
resources/public/js/
├── views/
│   └── leagues/
│       ├── SeasonDetailView.vue              # Existing (unchanged)
│       └── SeasonDetailWhiteLabelView.vue    # NEW - White label version
├── components/
│   └── leagues/
│       └── whitelabel/                        # NEW - White label components (if needed)
│           ├── WhiteLabelStandings.vue       # OPTIONAL - Extracted standings
│           └── WhiteLabelRounds.vue          # OPTIONAL - Extracted rounds
├── router/
│   └── index.ts                              # MODIFIED - Add component resolution logic
└── types/
    └── public.ts                              # Existing (unchanged)
```

**Initial Implementation**: Only create `SeasonDetailWhiteLabelView.vue`, extract sub-components if the main component exceeds ~400 lines.

---

## Router Implementation

### Modified Route Definition

```typescript
// resources/public/js/router/index.ts

{
  path: '/leagues/:leagueSlug/:competitionSlug/:seasonSlug',
  name: 'season-detail',
  component: () => {
    // Check if whitelabel mode is active
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('whitelabel') === 'true') {
      return import('@public/views/leagues/SeasonDetailWhiteLabelView.vue');
    }
    return import('@public/views/leagues/SeasonDetailView.vue');
  },
  meta: {
    title: 'Season Standings',
  },
}
```

**Alternative Approach (Cleaner)**: Use a navigation guard to handle component resolution:

```typescript
{
  path: '/leagues/:leagueSlug/:competitionSlug/:seasonSlug',
  name: 'season-detail',
  component: () => import('@public/views/leagues/SeasonDetailView.vue'),
  meta: {
    title: 'Season Standings',
  },
  beforeEnter: (to, from, next) => {
    if (to.query.whitelabel === 'true') {
      // Dynamically set the component
      to.matched[0].components.default = () =>
        import('@public/views/leagues/SeasonDetailWhiteLabelView.vue');
    }
    next();
  },
}
```

**Recommended Approach**: Use a wrapper component that conditionally renders based on query param:

```typescript
// SeasonDetailWrapper.vue (NEW)
<template>
  <SeasonDetailWhiteLabelView v-if="isWhiteLabel" />
  <SeasonDetailView v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SeasonDetailView from './SeasonDetailView.vue';
import SeasonDetailWhiteLabelView from './SeasonDetailWhiteLabelView.vue';

const route = useRoute();
const isWhiteLabel = computed(() => route.query.whitelabel === 'true');
</script>
```

Update route:
```typescript
{
  path: '/leagues/:leagueSlug/:competitionSlug/:seasonSlug',
  name: 'season-detail',
  component: () => import('@public/views/leagues/SeasonDetailWrapper.vue'),
  meta: {
    title: 'Season Standings',
  },
}
```

**RECOMMENDED**: Use the wrapper component approach for cleanest implementation.

---

## Component Structure

### SeasonDetailWhiteLabelView.vue

#### Template Structure

```vue
<template>
  <div class="whitelabel-season-view">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="seasonData" class="content">
      <!-- Page Header -->
      <header class="page-header">
        <div v-if="leagueLogoUrl" class="league-logo">
          <img :src="leagueLogoUrl" :alt="seasonData.league.name" />
        </div>
        <div class="header-text">
          <h1>{{ seasonData.league.name }}</h1>
          <h2>{{ seasonData.competition.name }} - {{ seasonData.season.name }}</h2>
        </div>
      </header>

      <!-- Standings Section -->
      <section class="standings-section">
        <h3>Championship Standings</h3>

        <!-- Tabs for Divisions / Teams (if applicable) -->
        <div v-if="showTabs" class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Standings Table -->
        <WhiteLabelStandingsTable
          :season-data="seasonData"
          :active-tab="activeTab"
        />
      </section>

      <!-- Rounds Section -->
      <section class="rounds-section">
        <h3>Race Rounds</h3>

        <!-- Round Accordions -->
        <div
          v-for="round in seasonData.rounds"
          :key="round.id"
          class="round-accordion"
        >
          <!-- Round Header (clickable) -->
          <button
            class="round-header"
            @click="toggleRound(round.id)"
          >
            <div class="round-info">
              <span class="round-number">Round {{ round.round_number }}</span>
              <span class="round-name">{{ round.name || round.circuit_name }}</span>
              <span class="round-circuit">{{ circuitInfo(round) }}</span>
            </div>
            <span class="chevron" :class="{ open: isRoundOpen(round.id) }">
              ▼
            </span>
          </button>

          <!-- Round Content (expandable) -->
          <div v-show="isRoundOpen(round.id)" class="round-content">
            <!-- Round details will be loaded here -->
            <WhiteLabelRoundContent
              :round="round"
              :has-divisions="seasonData.has_divisions"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
```

#### Script Structure

```typescript
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { leagueService } from '@public/services/leagueService';
import type { PublicSeasonDetailResponse, PublicRound } from '@public/types/public';

const route = useRoute();

// Route params
const leagueSlug = route.params.leagueSlug as string;
const seasonSlug = route.params.seasonSlug as string;

// State
const seasonData = ref<PublicSeasonDetailResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const activeTab = ref<string>('drivers');
const openRounds = ref<Set<number>>(new Set());

// Computed properties
const leagueLogoUrl = computed(() => {
  if (!seasonData.value) return null;
  return seasonData.value.league.logo?.original || seasonData.value.league.logo_url || null;
});

const showTabs = computed(() => {
  if (!seasonData.value) return false;
  return seasonData.value.has_divisions || seasonData.value.team_championship_enabled;
});

const tabs = computed(() => {
  const tabsList = [];

  if (seasonData.value?.has_divisions) {
    // Add division tabs
    const divisions = /* extract divisions from standings */;
    divisions.forEach(div => {
      tabsList.push({ id: `division-${div.division_id}`, label: div.division_name });
    });
  } else if (seasonData.value?.team_championship_enabled) {
    tabsList.push({ id: 'drivers', label: 'Drivers' });
  }

  if (seasonData.value?.team_championship_enabled) {
    tabsList.push({ id: 'teams', label: 'Teams' });
  }

  return tabsList;
});

// Methods
function toggleRound(roundId: number) {
  if (openRounds.value.has(roundId)) {
    openRounds.value.delete(roundId);
  } else {
    openRounds.value.add(roundId);
  }
}

function isRoundOpen(roundId: number): boolean {
  return openRounds.value.has(roundId);
}

function circuitInfo(round: PublicRound): string {
  const parts = [];
  if (round.track_name) parts.push(round.track_name);
  if (round.track_layout) parts.push(round.track_layout);
  if (round.circuit_country) parts.push(round.circuit_country);
  return parts.join(' • ');
}

async function fetchSeasonDetail() {
  loading.value = true;
  error.value = null;

  try {
    seasonData.value = await leagueService.getSeasonDetail(leagueSlug, seasonSlug);
  } catch (err) {
    console.error('Failed to fetch season detail:', err);
    error.value = 'Failed to load season details. Please try again.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchSeasonDetail();
});
</script>
```

#### Styling Structure

```vue
<style scoped>
/* ===================================
   White Label Season View - Light Mode
   =================================== */

/* Base Container */
.whitelabel-season-view {
  background-color: #ffffff;
  color: #1a1a1a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2rem;
  min-height: 100vh;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 1.5rem;
  color: #991b1b;
  margin: 2rem 0;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.league-logo {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.league-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.header-text h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.header-text h2 {
  font-size: 1.25rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
}

/* Sections */
.standings-section,
.rounds-section {
  margin-bottom: 3rem;
}

.standings-section h3,
.rounds-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.tabs button {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.tabs button:hover {
  color: #111827;
}

.tabs button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* Round Accordion */
.round-accordion {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.round-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: #f9fafb;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.round-header:hover {
  background-color: #f3f4f6;
}

.round-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
}

.round-number {
  font-size: 0.875rem;
  font-weight: 700;
  color: #2563eb;
}

.round-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.round-circuit {
  font-size: 0.875rem;
  color: #6b7280;
}

.chevron {
  font-size: 0.75rem;
  color: #9ca3af;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

.round-content {
  padding: 1.5rem;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
}

/* Print Styles */
@media print {
  .whitelabel-season-view {
    padding: 0;
  }

  .round-accordion {
    page-break-inside: avoid;
  }

  .tabs button {
    pointer-events: none;
  }
}
</style>
```

---

## Data Flow

### 1. Initial Load
```
User navigates to: /leagues/my-league/gt3/season-1?whitelabel=true
                   ↓
          Router detects whitelabel=true
                   ↓
      Loads SeasonDetailWhiteLabelView.vue
                   ↓
         Component calls onMounted()
                   ↓
    fetchSeasonDetail() → leagueService.getSeasonDetail(leagueSlug, seasonSlug)
                   ↓
         API returns PublicSeasonDetailResponse
                   ↓
         seasonData.value = response
                   ↓
          Component renders with data
```

### 2. User Interactions

#### Toggling Tabs
```
User clicks "Division 2" tab
         ↓
activeTab.value = 'division-2'
         ↓
Computed property filters standings
         ↓
Table re-renders with Division 2 data
```

#### Expanding Rounds
```
User clicks Round 3 header
         ↓
toggleRound(3) called
         ↓
openRounds.value.add(3)
         ↓
v-show="isRoundOpen(3)" becomes true
         ↓
Round content slides open
```

### 3. Data Structures

The same data structures from the existing `SeasonDetailView` apply:

- **seasonData**: `PublicSeasonDetailResponse`
  - `league`: League info with logo
  - `competition`: Competition info
  - `season`: Season info
  - `standings`: Either `SeasonStandingDriver[]` or `SeasonStandingDivision[]`
  - `rounds`: `PublicRound[]`
  - `has_divisions`: boolean
  - `team_championship_enabled`: boolean
  - `team_championship_results`: `TeamChampionshipStanding[]`
  - `drop_round_enabled`: boolean

---

## Styling Approach

### Color Palette (Light Mode)

```css
/* Primary Colors */
--wl-bg-primary: #ffffff;
--wl-bg-secondary: #f9fafb;
--wl-bg-tertiary: #f3f4f6;

/* Text Colors */
--wl-text-primary: #111827;
--wl-text-secondary: #6b7280;
--wl-text-muted: #9ca3af;

/* Border Colors */
--wl-border: #e5e7eb;
--wl-border-light: #f3f4f6;

/* Accent Colors */
--wl-accent-primary: #2563eb; /* Blue for active states */
--wl-accent-success: #10b981; /* Green */
--wl-accent-warning: #f59e0b; /* Orange */
--wl-accent-error: #ef4444;   /* Red */

/* Podium Colors (Light Mode) */
--wl-gold: #d4af37;
--wl-silver: #94a3b8;
--wl-bronze: #cd7f32;
```

### Typography

```css
/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Font Sizes */
--wl-text-xs: 0.75rem;    /* 12px */
--wl-text-sm: 0.875rem;   /* 14px */
--wl-text-base: 1rem;     /* 16px */
--wl-text-lg: 1.125rem;   /* 18px */
--wl-text-xl: 1.25rem;    /* 20px */
--wl-text-2xl: 1.5rem;    /* 24px */
--wl-text-3xl: 2rem;      /* 32px */

/* Font Weights */
--wl-font-normal: 400;
--wl-font-medium: 500;
--wl-font-semibold: 600;
--wl-font-bold: 700;
```

### Spacing

Use standard Tailwind spacing scale:
- `0.5rem` (8px) - tight spacing
- `1rem` (16px) - standard spacing
- `1.5rem` (24px) - section spacing
- `2rem` (32px) - large spacing

### Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Print-Friendly Styles

```css
@media print {
  /* Remove unnecessary spacing */
  .whitelabel-season-view {
    padding: 0;
  }

  /* Prevent page breaks inside important sections */
  .round-accordion,
  .standings-table tbody tr {
    page-break-inside: avoid;
  }

  /* Hide interactive elements */
  .tabs button:not(.active),
  .chevron {
    display: none;
  }

  /* Expand all accordions */
  .round-content {
    display: block !important;
  }

  /* Use print-friendly colors */
  * {
    color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
```

---

## Implementation Steps

### Phase 1: Router and Basic Structure (30 min)

1. **Create wrapper component**
   - File: `resources/public/js/views/leagues/SeasonDetailWrapper.vue`
   - Implement conditional rendering based on `route.query.whitelabel`
   - Add tests for query param detection

2. **Update router**
   - Modify `resources/public/js/router/index.ts`
   - Change `season-detail` route to use wrapper component
   - Test URL navigation with and without `?whitelabel=true`

3. **Create white label view skeleton**
   - File: `resources/public/js/views/leagues/SeasonDetailWhiteLabelView.vue`
   - Set up basic template structure (header, loading, error states)
   - Add light-mode base styling
   - Implement data fetching (same as regular view)

### Phase 2: Standings Section (1 hour)

4. **Build standings table component**
   - **Option A**: Inline in `SeasonDetailWhiteLabelView.vue`
   - **Option B**: Extract to `resources/public/js/components/leagues/whitelabel/WhiteLabelStandingsTable.vue`

5. **Implement standings logic**
   - Handle divisions vs. flat standings
   - Build tab system for divisions/teams
   - Render driver standings table
   - Render team championship table (if enabled)
   - Add drop rounds column (if enabled)

6. **Style standings table**
   - Light-mode colors
   - Clean borders and spacing
   - Responsive layout
   - Print-friendly styles
   - Podium row highlighting (gold/silver/bronze)

### Phase 3: Rounds Section (1.5 hours)

7. **Build custom accordion**
   - Track open/closed state with `Set<number>`
   - Implement toggle function
   - Create round header with circuit info
   - Add chevron indicator with rotation

8. **Create round content component**
   - **Option A**: Inline round details
   - **Option B**: Extract to `WhiteLabelRoundContent.vue`
   - Display round standings
   - Display race results
   - Handle divisions

9. **Style rounds section**
   - Accordion header styling
   - Smooth expand/collapse transitions
   - Round content padding and layout
   - Print-friendly (expand all on print)

### Phase 4: Polish and Testing (1 hour)

10. **Responsive design**
    - Test on mobile, tablet, desktop
    - Adjust table layouts for small screens
    - Consider horizontal scrolling for wide tables

11. **Print optimization**
    - Test print preview
    - Adjust page breaks
    - Ensure colors print correctly
    - Remove interactive elements in print view

12. **Accessibility**
    - Add ARIA labels to accordions
    - Ensure keyboard navigation works
    - Test with screen readers
    - Check color contrast ratios

13. **Browser testing**
    - Chrome, Firefox, Safari, Edge
    - Test query param handling
    - Test data loading and error states

### Phase 5: Documentation and Vitest (30 min)

14. **Write tests**
    - File: `SeasonDetailWhiteLabelView.test.ts`
    - Test query param detection
    - Test data fetching
    - Test accordion toggle
    - Test tab switching
    - Test error states

15. **Update documentation**
    - Add usage examples to README
    - Document embedding in iframe
    - Document print instructions

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// SeasonDetailWhiteLabelView.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import SeasonDetailWhiteLabelView from './SeasonDetailWhiteLabelView.vue';
import * as leagueService from '@public/services/leagueService';

describe('SeasonDetailWhiteLabelView', () => {
  let router;

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/leagues/:leagueSlug/:competitionSlug/:seasonSlug',
          component: SeasonDetailWhiteLabelView,
        },
      ],
    });
  });

  it('renders loading state initially', () => {
    const wrapper = mount(SeasonDetailWhiteLabelView, {
      global: { plugins: [router] },
    });

    expect(wrapper.find('.loading-state').exists()).toBe(true);
  });

  it('fetches season data on mount', async () => {
    const mockData = { /* mock PublicSeasonDetailResponse */ };
    vi.spyOn(leagueService, 'getSeasonDetail').mockResolvedValue(mockData);

    const wrapper = mount(SeasonDetailWhiteLabelView, {
      global: { plugins: [router] },
    });

    await wrapper.vm.$nextTick();

    expect(leagueService.getSeasonDetail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String)
    );
  });

  it('displays error state on fetch failure', async () => {
    vi.spyOn(leagueService, 'getSeasonDetail').mockRejectedValue(new Error('API Error'));

    const wrapper = mount(SeasonDetailWhiteLabelView, {
      global: { plugins: [router] },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find('.error-state').exists()).toBe(true);
  });

  it('toggles round accordion on click', async () => {
    const mockData = {
      rounds: [{ id: 1, round_number: 1, name: 'Round 1' }],
    };
    vi.spyOn(leagueService, 'getSeasonDetail').mockResolvedValue(mockData);

    const wrapper = mount(SeasonDetailWhiteLabelView, {
      global: { plugins: [router] },
    });

    await wrapper.vm.$nextTick();

    const roundHeader = wrapper.find('.round-header');
    expect(wrapper.find('.round-content').isVisible()).toBe(false);

    await roundHeader.trigger('click');
    expect(wrapper.find('.round-content').isVisible()).toBe(true);

    await roundHeader.trigger('click');
    expect(wrapper.find('.round-content').isVisible()).toBe(false);
  });

  it('switches tabs correctly', async () => {
    const mockData = {
      has_divisions: true,
      standings: [
        { division_id: 1, division_name: 'Division 1', drivers: [] },
        { division_id: 2, division_name: 'Division 2', drivers: [] },
      ],
    };
    vi.spyOn(leagueService, 'getSeasonDetail').mockResolvedValue(mockData);

    const wrapper = mount(SeasonDetailWhiteLabelView, {
      global: { plugins: [router] },
    });

    await wrapper.vm.$nextTick();

    const tabs = wrapper.findAll('.tabs button');
    expect(tabs).toHaveLength(2);

    await tabs[1].trigger('click');
    expect(tabs[1].classes()).toContain('active');
  });
});
```

### Manual Testing Checklist

- [ ] Navigate to season page with `?whitelabel=true`
- [ ] Verify light mode styling is applied
- [ ] Check league logo displays
- [ ] Verify standings table renders correctly
- [ ] Test division tabs (if applicable)
- [ ] Test team championship tab (if applicable)
- [ ] Expand/collapse round accordions
- [ ] Check round details display correctly
- [ ] Test print preview
- [ ] Test on mobile devices
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Verify no errors in console
- [ ] Test error states (invalid league slug, network error)
- [ ] Test empty states (no standings, no rounds)

---

## Edge Cases and Considerations

### 1. No Standings Data
**Scenario**: Season has no standings yet (brand new season).

**Handling**:
```vue
<div v-if="!seasonData.standings || seasonData.standings.length === 0" class="empty-state">
  <p>No standings available yet.</p>
</div>
```

### 2. No Rounds Data
**Scenario**: Season has no rounds scheduled.

**Handling**:
```vue
<div v-if="!seasonData.rounds || seasonData.rounds.length === 0" class="empty-state">
  <p>No rounds scheduled yet.</p>
</div>
```

### 3. Mixed Divisions and Teams
**Scenario**: Season has both divisions and team championship enabled.

**Handling**:
- Show division tabs first, then team championship tab
- Ensure tab switching works correctly
- Test with actual data structure

### 4. Very Wide Standings Tables
**Scenario**: Season with many rounds (15+) creates very wide table.

**Handling**:
- Add horizontal scroll on table container
- Consider sticky first column (position + driver name)
- Optimize for print (landscape mode)

```css
.standings-table-container {
  overflow-x: auto;
  max-width: 100%;
}

.standings-table th:first-child,
.standings-table td:first-child {
  position: sticky;
  left: 0;
  background-color: #ffffff;
  z-index: 10;
}
```

### 5. Missing Logos
**Scenario**: League or season has no logo uploaded.

**Handling**:
- Show league initials (like existing view)
- OR hide logo section entirely (simpler for white label)

```vue
<div v-if="leagueLogoUrl" class="league-logo">
  <img :src="leagueLogoUrl" :alt="seasonData.league.name" />
</div>
<div v-else class="league-initials">
  {{ leagueInitials }}
</div>
```

### 6. Long League/Season Names
**Scenario**: League name is very long and breaks layout.

**Handling**:
```css
.header-text h1 {
  overflow-wrap: break-word;
  word-break: break-word;
}
```

### 7. Iframe Embedding
**Scenario**: White label view embedded in third-party website.

**Considerations**:
- Remove all absolute positioning that might break in iframe
- Ensure no `target="_blank"` links (unless desired)
- Consider adding `allow-same-origin` for API calls
- Test in various iframe sizes
- Consider adding height auto-resize script

```html
<!-- Parent page -->
<iframe
  src="https://example.com/leagues/my-league/gt3/season-1?whitelabel=true"
  width="100%"
  height="800"
  frameborder="0"
  scrolling="auto"
></iframe>
```

### 8. Performance with Large Datasets
**Scenario**: Season with 50+ drivers and 20+ rounds.

**Optimization**:
- Use `v-show` instead of `v-if` for round content (faster toggling)
- Consider virtual scrolling for very long tables
- Lazy-load round details (fetch on accordion open)

### 9. Network Errors
**Scenario**: API call fails (network timeout, 500 error, etc.).

**Handling**:
```typescript
try {
  seasonData.value = await leagueService.getSeasonDetail(leagueSlug, seasonSlug);
} catch (err) {
  if (err.response?.status === 404) {
    error.value = 'Season not found.';
  } else if (err.response?.status === 500) {
    error.value = 'Server error. Please try again later.';
  } else {
    error.value = 'Failed to load season details. Please check your connection.';
  }
}
```

### 10. Browser Compatibility
**Scenario**: Older browsers don't support modern CSS features.

**Handling**:
- Avoid CSS Grid if supporting IE11
- Use Flexbox for layouts
- Provide CSS fallbacks for custom properties
- Test in target browsers

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Customizable Branding**
   - Accept color scheme via query params: `?whitelabel=true&primaryColor=0066cc`
   - Allow custom logo URL: `?logoUrl=https://example.com/logo.png`
   - Support custom fonts

2. **Export Options**
   - "Export to PDF" button
   - "Export to CSV" button (standings data)
   - Share link generator

3. **Round Details Lazy Loading**
   - Only fetch round results when accordion is opened
   - Improves initial load time for seasons with many rounds

4. **Filtering Options**
   - Show/hide specific divisions
   - Show only top 10 drivers
   - Filter by driver name

5. **Responsive Enhancements**
   - Card layout for mobile devices
   - Swipeable tabs on touch devices
   - Collapsible table columns

6. **Analytics**
   - Track white label view usage
   - Track which divisions/rounds are viewed most
   - Provide analytics to league admins

---

## Success Criteria

### Definition of Done

- [ ] White label view accessible via `?whitelabel=true` query param
- [ ] Light mode styling applied (white background, dark text)
- [ ] No navigation header/footer displayed
- [ ] Same data as regular view displayed correctly
- [ ] Standings table renders with divisions/teams support
- [ ] Rounds section with custom accordion implementation
- [ ] Print-friendly layout (A4 page)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] All unit tests passing (>80% coverage)
- [ ] Manual testing completed on all major browsers
- [ ] Accessibility requirements met (WCAG AA)
- [ ] Documentation updated with usage instructions
- [ ] No performance regressions (Lighthouse score >90)

### Performance Targets

- **Initial Load**: < 2 seconds (on 3G connection)
- **Time to Interactive**: < 3 seconds
- **Lighthouse Performance Score**: > 90
- **Lighthouse Accessibility Score**: > 95

### Code Quality Targets

- **TypeScript**: Strict mode, no `any` types
- **Test Coverage**: > 80%
- **ESLint**: 0 errors, 0 warnings
- **File Size**: < 500 lines per component (extract if larger)

---

## Appendix A: Data Type Reference

### PublicSeasonDetailResponse

```typescript
interface PublicSeasonDetailResponse {
  league: PublicLeague;
  competition: PublicCompetition;
  season: PublicSeason;
  standings: SeasonStandingDriver[] | SeasonStandingDivision[];
  rounds: PublicRound[];
  has_divisions: boolean;
  drop_round_enabled: boolean;
  team_championship_enabled: boolean;
  teams_drop_rounds_enabled: boolean;
  team_championship_results?: TeamChampionshipStanding[];
}
```

### SeasonStandingDriver

```typescript
interface SeasonStandingDriver {
  position: number;
  driver_id: number;
  driver_name: string;
  total_points: number;
  drop_total: number;
  podiums: number;
  poles: number;
  rounds: RoundPoints[];
  team_id?: number | null;
  team_name?: string | null;
  team_logo?: string | null;
}
```

### SeasonStandingDivision

```typescript
interface SeasonStandingDivision {
  division_id: number;
  division_name: string;
  order: number;
  drivers: SeasonStandingDriver[];
}
```

### PublicRound

```typescript
interface PublicRound {
  id: number;
  round_number: number;
  name: string | null;
  slug: string;
  scheduled_at: string | null;
  circuit_name: string | null;
  circuit_country: string | null;
  track_name: string | null;
  track_layout: string | null;
  status: 'scheduled' | 'pre_race' | 'in_progress' | 'completed' | 'cancelled';
  status_label: string;
  races: PublicRace[];
}
```

---

## Appendix B: File Paths Reference

All file paths are absolute from the repository root:

### New Files to Create

1. `/var/www/resources/public/js/views/leagues/SeasonDetailWrapper.vue`
2. `/var/www/resources/public/js/views/leagues/SeasonDetailWhiteLabelView.vue`
3. `/var/www/resources/public/js/views/leagues/SeasonDetailWhiteLabelView.test.ts`

### Optional Extracted Components

4. `/var/www/resources/public/js/components/leagues/whitelabel/WhiteLabelStandingsTable.vue`
5. `/var/www/resources/public/js/components/leagues/whitelabel/WhiteLabelStandingsTable.test.ts`
6. `/var/www/resources/public/js/components/leagues/whitelabel/WhiteLabelRoundContent.vue`
7. `/var/www/resources/public/js/components/leagues/whitelabel/WhiteLabelRoundContent.test.ts`

### Files to Modify

8. `/var/www/resources/public/js/router/index.ts` (update `season-detail` route)

---

## Appendix C: Useful Commands

```bash
# Run dev server
npm run dev

# Run tests
npm run test:public

# Run tests with UI
npm run test:ui

# Type check
npm run type-check

# Lint and format
npm run lint:fix
npm run format

# Build for production
npm run build
```

---

**End of Implementation Plan**
