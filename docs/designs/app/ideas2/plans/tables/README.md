# DataTable Migration to Technical Blueprint Design System

## Overview

This plan outlines the comprehensive migration of ALL DataTable components in `resources/app` to the Technical Blueprint design system as defined in `docs/designs/app/ideas2/technical-form/tables.html`.

## Current State Analysis

### Files Using DataTable (9 components)

1. **SeasonDriversTable.vue** - Complex paginated table with filters, sorting, inline edits
2. **DriverTable.vue** - Paginated with dynamic platform columns
3. **RoundStandingsSection.vue** - Standings with podium highlighting
4. **RaceEventResultsSection.vue** - Race results with time formatting
5. **CrossDivisionResultsSection.vue** - Cross-division results
6. **AvailableDriversTable.vue** - Simple table with actions
7. **DivisionsPanel.vue** - Reorderable table
8. **TeamsPanel.vue** - Team management table
9. **SeasonStandingsPanel.vue** - Custom inline tables (uses h() function, not PrimeVue)

### Key Problems to Solve

1. **Light mode colors** - Current tables use light mode (amber-100, gray-200, orange-100)
2. **Inconsistent styling** - No unified table appearance across components
3. **Missing Technical Blueprint aesthetic** - Tables don't match dark mode design system
4. **Striped rows** - Current tables use `striped-rows` prop (needs removal)
5. **Typography inconsistencies** - Headers and cells don't use IBM Plex Mono correctly
6. **Podium colors** - Currently light mode (gold/silver/bronze)

## Design Requirements Summary

### Color Palette
- **Backgrounds**: `--bg-dark`, `--bg-panel`, `--bg-card`, `--bg-elevated`, `--bg-highlight`
- **Text**: `--text-primary`, `--text-secondary`, `--text-muted`
- **Borders**: `--border` (#30363d), `--border-muted` (#21262d)
- **Status**: Active (green-dim/green), Pending (orange-dim/orange), Inactive (bg-elevated/text-muted)
- **Podium**: P1 (#d29922 gold), P2 (#6e7681 silver), P3 (#f0883e bronze)

### Typography
- **Headers**: IBM Plex Mono, 10px, 600 weight, 1px letter-spacing, uppercase, --text-muted
- **Cells**: 13px, 14px padding, --text-primary
- **Position**: IBM Plex Mono, 14px, 600 weight
- **Points/Data**: IBM Plex Mono, 600 weight
- **Gap cells**: IBM Plex Mono, 12px

### Row Styles
- **Default**: No background, `border-bottom: 1px solid --border-muted`
- **Last row**: No bottom border
- **Hover**: `background: --bg-elevated`
- **NO striped rows** (remove all `striped-rows` props)

## Migration Strategy

### Option A: Custom Wrapper Component (RECOMMENDED)

Create `TechDataTable.vue` wrapper component that:
- Wraps PrimeVue DataTable with Technical Blueprint styling
- Provides consistent slot patterns for common cell types
- Enforces design system automatically
- Makes migration easier and future updates centralized
- Reduces code duplication across tables

**Pros:**
- Single source of truth for table styling
- Easy to update all tables at once
- Enforces consistency
- Reduces migration effort
- Better maintainability

**Cons:**
- Requires building wrapper component first
- Slight abstraction layer

### Option B: Direct Migration (Alternative)

Update each DataTable component individually with CSS overrides:
- Update global CSS in `app.css`
- Add component-specific styles where needed
- Update each component's template and classes

**Pros:**
- No new components needed
- Direct control per component

**Cons:**
- Repetitive code across components
- Harder to maintain consistency
- More migration effort
- Future updates require touching all files

### Decision: Option A (Custom Wrapper Component)

We will create a custom wrapper component system for better maintainability and consistency.

## Implementation Files

This plan is broken into 4 detailed implementation documents:

1. **[1-css-foundation.md](./1-css-foundation.md)** - CSS variables and global DataTable overrides
2. **[2-custom-components.md](./2-custom-components.md)** - TechDataTable wrapper and sub-components
3. **[3-migration-checklist.md](./3-migration-checklist.md)** - File-by-file migration guide
4. **[4-podium-colors.md](./4-podium-colors.md)** - Podium color system update

## Migration Order

### Phase 1: Foundation (Files 1-2)
1. Update global CSS (`app.css`) - Foundation file
2. Create custom wrapper components - Custom components file
3. Update `podiumColors.ts` - Podium colors file

### Phase 2: Simple Tables First (Test & Validate)
4. Migrate `AvailableDriversTable.vue` (simplest)
5. Migrate `TeamsPanel.vue`
6. Migrate `DivisionsPanel.vue`

### Phase 3: Complex Tables
7. Migrate `SeasonDriversTable.vue` (most complex)
8. Migrate `DriverTable.vue`
9. Migrate `RoundStandingsSection.vue`
10. Migrate `RaceEventResultsSection.vue`
11. Migrate `CrossDivisionResultsSection.vue`

### Phase 4: Custom Tables
12. Migrate `SeasonStandingsPanel.vue` (uses h() function, custom approach)

## Testing Strategy

### Per-Component Tests
- Visual regression testing
- Verify sorting still works
- Verify pagination still works
- Verify filters still work
- Verify row actions still work
- Test hover states
- Test podium highlighting (where applicable)

### Cross-Component Tests
- Verify consistent appearance across all tables
- Test dark mode colors throughout app
- Verify typography consistency
- Test accessibility (keyboard navigation, screen readers)

## Success Criteria

- All 9 table components updated to Technical Blueprint design
- No visual regressions
- All existing functionality preserved (sorting, pagination, filtering, actions)
- Consistent dark mode appearance
- Podium colors updated to dark mode palette
- All Vitest tests passing
- TypeScript checks passing
- Prettier/Linters passing

## Timeline Estimate

- **Phase 1**: 2-3 hours (CSS + wrapper components)
- **Phase 2**: 2-3 hours (3 simple tables)
- **Phase 3**: 4-6 hours (6 complex tables)
- **Phase 4**: 1-2 hours (custom table)
- **Total**: 9-14 hours

## Next Steps

1. Read `1-css-foundation.md` - Implement CSS foundation
2. Read `2-custom-components.md` - Build wrapper components
3. Read `3-migration-checklist.md` - Follow migration checklist
4. Read `4-podium-colors.md` - Update podium color system
5. Test thoroughly after each migration
6. Run all quality checks before marking as complete
