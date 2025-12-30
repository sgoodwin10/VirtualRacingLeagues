# League Detail Page Redesign - Overview

## Feature Summary

Redesign the `LeagueDetail.vue` page to implement a new **split-panel layout** based on the design specification in `variation-3-split-panel.html`. This is a UI/UX enhancement that transforms the existing tabbed layout into a more information-dense, terminal/console-inspired design.

## Current State

The existing `LeagueDetail.vue` (`resources/app/js/views/LeagueDetail.vue`) uses:
- A single-column layout with a header card
- Tabbed navigation (Competitions, Drivers)
- Existing components: `LeagueHeader`, `LeagueStatsBar`, `LeagueAboutPanel`, `LeagueContactPanel`, `LeagueSocialMediaPanel`, `LeagueDriversTab`, `CompetitionList`

## Target State

A **two-panel split layout**:

### Left Panel - League Identity (Fixed Width: ~380px)
A sticky sidebar containing:
1. **Header Area**: Background image with gradient overlay and grid pattern
2. **League Logo**: Positioned at bottom of header with fallback
3. **League Name & Tagline**: Monospace typography
4. **Status Tags**: Visibility (Public/Private/Unlisted) and Status (Active/Archived)
5. **Stats Grid**: 2x2 grid showing Competitions, Drivers, Seasons, Platforms counts
6. **Terminal-Style Config Panel** ("league.config"):
   - Organizer name
   - Contact email
   - Slug
   - Platforms
   - Description
   - All social URLs
7. **Social Links Bar**: Icon buttons for Discord, Twitter, YouTube, Twitch, Instagram
8. **Footer Actions**: Edit League button (subtle), Settings button (opens `LeagueWizardDrawer`)

### Right Panel - Dynamic Content (Flexible Width)
Main content area with:
1. **Dashboard Header**: Title with "// DASHBOARD" prefix, "New Season" button
2. **Active Seasons Section**: List of seasons using `ListRow` components
   - Status indicator with season's selected colour
   - Season name, competition name, round progress
   - Stats (drivers, races)
   - View action button
3. **Competitions Section** (replaces "Quick Actions"):
   - Grid of competition cards (styled like current quick actions tiles)
   - Clicking opens a small modal with basic information
   - "Add Competition" button at end (opens `CompetitionFormDrawer`)
4. **Recent Activity Section**: Empty placeholder for Version 3

## Key Changes Summary

| Current | New |
|---------|-----|
| Single column + tabs | Split panel layout |
| PrimeVue Card with header image | Custom identity panel |
| Tabs for Competitions/Drivers | Dedicated sections on right panel |
| Quick Actions section | Replaced with Competitions section |
| Standard table for seasons | List rows with colour indicators |

## Design System

The design follows the "Technical Blueprint" aesthetic:
- **Colors**: Dark theme with cyan, green, orange, purple accents
- **Typography**: IBM Plex Mono (monospace) + Inter (sans)
- **Components**: Uses existing common components (`ListContainer`, `ListRow`, `Card`, etc.)
- **CSS Variables**: Defined for consistency (see design HTML)

## Out of Scope (Future Versions)

- **Version 2**: Competition info modal details
- **Version 3**: Recent Activity section implementation

## Driver Management

Driver management will be **moved to a dedicated route** (`/leagues/{id}/drivers`) instead of being a tab on the League Detail page. A "Manage Drivers" button will be added above the terminal config panel in the left identity panel, linking to this new page.

## Dependencies

### Existing Components to Reuse
- `resources/app/js/components/common/lists/*` - List components
- `resources/app/js/components/common/cards/*` - Card components
- `resources/app/js/components/league/modals/LeagueWizardDrawer.vue` - Settings modal
- `resources/app/js/components/competition/CompetitionFormDrawer.vue` - Add competition modal

### Data Already Available
- League entity with all required fields (name, tagline, status, visibility, social URLs, etc.)
- Seasons via competition store
- Competitions via competition store
- Platforms via league store

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Keep existing modals/dialogs unchanged, only restructure layout |
| Responsive design complexity | Implement mobile-first with clear breakpoints (tablet stacks panels) |
| Performance with large season lists | Seasons are already paginated/limited per competition |
| CSS variable conflicts | Use scoped styles or component-specific prefixes |

## Success Criteria

1. Layout matches design specification exactly
2. All existing functionality preserved (edit league, add competition, view seasons)
3. Responsive design works on tablet/mobile
4. Existing tests pass
5. New layout uses existing common components where possible
