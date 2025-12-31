# League List Design Variations

Three design variations for the League List page, all following the **Technical Blueprint** design system.

## Design System Reference

- **Dark Theme**: `#0d1117` (dark), `#161b22` (panel), `#1c2128` (card), `#21262d` (elevated)
- **Typography**: IBM Plex Mono (headings/labels), Inter (body)
- **Accents**: Cyan `#58a6ff`, Green `#7ee787`, Orange `#f0883e`, Red `#f85149`, Purple `#bc8cff`
- **Grid Pattern**: 20px grid overlay with subtle cyan lines

---

## Variation 1: Card Grid (`variation-1-card-grid.html`)

**Approach**: Enhanced card grid with rich visual hierarchy

### Key Features:
- Full-width header images with gradient overlays
- Logo positioned at bottom of header (overlapping card body)
- Visibility badges (Public/Private) with colored dot indicators
- Quick action buttons (Edit/Delete) appear on hover
- 2x2 stats grid showing Competitions, Drivers, Active Seasons, Races
- Platform tags displayed as chips
- View button with arrow animation on hover
- Staggered fade-in animation on page load

### Best For:
- Visual-first browsing experience
- Leagues with header images/branding
- Users who want quick stats overview

---

## Variation 2: List Rows (`variation-2-list-rows.html`)

**Approach**: Compact list-based layout inspired by LeagueDetail's active seasons

### Key Features:
- Horizontal row layout with indicator bars (colored left border)
- Indicator states: Active (green glow), Idle (cyan), New (purple glow)
- Inline stats displayed in columns (Comps, Drivers, Races)
- Platform chips shown inline with meta info
- Hover effect shifts row right with cyan accent shadow
- Filter tabs: All / Active / Public / Private
- Stats summary cards at top (Total Leagues, Active Seasons, Total Drivers, Competitions)
- Edit/View action buttons appear on hover

### Best For:
- Data-dense scanning
- Users managing many leagues
- Quick comparison between leagues

---

## Variation 3: Split Panel (`variation-3-split-panel.html`)

**Approach**: Master-detail layout with persistent sidebar

### Key Features:
- Fixed left sidebar (320px) with:
  - Search box
  - Quick stats overview (4 metrics)
  - Status filters (All/Active/Public/Private) with counts
  - Platform filter chips
- Main content area with grid/list view toggle
- Compact cards with indicator bars
- Cards show logo, name, visibility, timezone, tagline, stats, platforms
- Sidebar collapses on mobile (off-canvas drawer pattern)

### Best For:
- Power users who filter frequently
- Larger league collections
- Desktop-first experience with responsive mobile fallback

---

## Common Elements

All variations include:

1. **Breadcrumbs**: Home / Leagues navigation
2. **Page Header**: Title with "// SECTION" styling, Create League button
3. **Empty State**: Illustration, message, and CTA button
4. **Loading Skeletons**: Shimmer animation placeholders
5. **Responsive Design**: Mobile-friendly layouts
6. **Hover Interactions**: Visual feedback on interactive elements
7. **Sample Data**: 4 leagues with realistic data

---

## Usage

Open any HTML file directly in a browser to preview:

```bash
# From project root
open docs/designs/app/league-list/variation-1-card-grid.html
open docs/designs/app/league-list/variation-2-list-rows.html
open docs/designs/app/league-list/variation-3-split-panel.html
```

---

## Implementation Notes

When implementing in Vue:
- Replace static HTML with Vue components
- Use PrimeVue DataView for list rendering
- Implement filters with Pinia store
- Use VueUse for responsive breakpoints
- Add Phosphor Icons for consistent iconography
