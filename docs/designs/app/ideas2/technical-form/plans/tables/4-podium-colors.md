# Phase 4: Podium Color System Update

## Overview

This document details the update of the podium color system from light mode to dark mode Technical Blueprint colors.

## File to Update

**File**: `/var/www/resources/app/js/constants/podiumColors.ts`

## Current State

```typescript
/**
 * Shared podium color constants for styling table rows
 * Used across ResultDivisionTabs, CrossDivisionResultsSection, RaceEventResultsSection, and RoundStandingsSection
 */

export const PODIUM_COLORS = {
  FIRST: '!bg-amber-100', // Gold
  SECOND: '!bg-gray-200', // Silver
  THIRD: '!bg-orange-100', // Bronze
} as const;

/**
 * Get the appropriate row class based on position
 * @param position - The position/rank (1, 2, 3, etc.)
 * @returns The CSS class for the row, or empty string if not a podium position
 */
export function getPodiumRowClass(position: number | null | undefined): string {
  switch (position) {
    case 1:
      return PODIUM_COLORS.FIRST;
    case 2:
      return PODIUM_COLORS.SECOND;
    case 3:
      return PODIUM_COLORS.THIRD;
    default:
      return '';
  }
}
```

## Problems with Current Implementation

1. **Light mode colors**: Uses Tailwind light mode colors (amber-100, gray-200, orange-100)
2. **Not compatible with dark mode**: Colors designed for light backgrounds
3. **Inconsistent with Technical Blueprint**: Doesn't use design system variables
4. **Row-based approach**: Applies background to entire row (older pattern)

## New Implementation (Option A: Text-Based Colors)

This approach applies podium colors to position numbers/cells only, not entire rows.

```typescript
/**
 * Technical Blueprint podium color constants
 * Used for position indicators in standings and results tables
 *
 * Design System Reference:
 * - P1 (1st place): #d29922 (--yellow) - Gold
 * - P2 (2nd place): #6e7681 (--text-muted) - Silver
 * - P3 (3rd place): #f0883e (--orange) - Bronze
 */

export const PODIUM_COLORS = {
  /** First place - Gold */
  FIRST: '#d29922',
  /** Second place - Silver */
  SECOND: '#6e7681',
  /** Third place - Bronze */
  THIRD: '#f0883e',
} as const;

/**
 * Podium CSS classes for position cells
 */
export const PODIUM_CLASSES = {
  FIRST: 'pos p1',
  SECOND: 'pos p2',
  THIRD: 'pos p3',
} as const;

/**
 * Get the appropriate CSS class for a position cell
 * @param position - The position/rank (1, 2, 3, etc.)
 * @returns The CSS class for the position cell, or 'pos' for non-podium positions
 */
export function getPodiumClass(position: number | null | undefined): string {
  switch (position) {
    case 1:
      return PODIUM_CLASSES.FIRST;
    case 2:
      return PODIUM_CLASSES.SECOND;
    case 3:
      return PODIUM_CLASSES.THIRD;
    default:
      return 'pos';
  }
}

/**
 * Get the podium color value for a position
 * @param position - The position/rank (1, 2, 3, etc.)
 * @returns The hex color value, or null for non-podium positions
 */
export function getPodiumColor(position: number | null | undefined): string | null {
  switch (position) {
    case 1:
      return PODIUM_COLORS.FIRST;
    case 2:
      return PODIUM_COLORS.SECOND;
    case 3:
      return PODIUM_COLORS.THIRD;
    default:
      return null;
  }
}

/**
 * DEPRECATED: Use getPodiumClass instead
 * Kept for backward compatibility during migration
 * @deprecated
 */
export function getPodiumRowClass(position: number | null | undefined): string {
  console.warn('getPodiumRowClass is deprecated. Use getPodiumClass instead.');
  return getPodiumClass(position);
}
```

## New Implementation (Option B: Row Highlight - Alternative)

This approach adds subtle background tints to entire rows (matches tables.html design).

```typescript
/**
 * Technical Blueprint podium color constants
 * Used for position indicators and row highlighting in standings and results tables
 */

export const PODIUM_COLORS = {
  /** First place - Gold */
  FIRST: {
    text: '#d29922',
    background: 'rgba(210, 153, 34, 0.08)', // Gold tint
  },
  /** Second place - Silver */
  SECOND: {
    text: '#6e7681',
    background: 'rgba(110, 118, 129, 0.08)', // Silver tint
  },
  /** Third place - Bronze */
  THIRD: {
    text: '#f0883e',
    background: 'rgba(240, 136, 62, 0.08)', // Bronze tint
  },
} as const;

/**
 * Podium CSS classes for rows (includes background tint)
 */
export const PODIUM_ROW_CLASSES = {
  FIRST: 'podium-1',
  SECOND: 'podium-2',
  THIRD: 'podium-3',
} as const;

/**
 * Podium CSS classes for position cells (text color only)
 */
export const PODIUM_CELL_CLASSES = {
  FIRST: 'pos p1',
  SECOND: 'pos p2',
  THIRD: 'pos p3',
} as const;

/**
 * Get the appropriate row class for podium highlighting
 * @param position - The position/rank (1, 2, 3, etc.)
 * @returns The CSS class for the row, or empty string for non-podium positions
 */
export function getPodiumRowClass(position: number | null | undefined): string {
  switch (position) {
    case 1:
      return PODIUM_ROW_CLASSES.FIRST;
    case 2:
      return PODIUM_ROW_CLASSES.SECOND;
    case 3:
      return PODIUM_ROW_CLASSES.THIRD;
    default:
      return '';
  }
}

/**
 * Get the appropriate CSS class for a position cell
 * @param position - The position/rank (1, 2, 3, etc.)
 * @returns The CSS class for the position cell, or 'pos' for non-podium positions
 */
export function getPodiumCellClass(position: number | null | undefined): string {
  switch (position) {
    case 1:
      return PODIUM_CELL_CLASSES.FIRST;
    case 2:
      return PODIUM_CELL_CLASSES.SECOND;
    case 3:
      return PODIUM_CELL_CLASSES.THIRD;
    default:
      return 'pos';
  }
}

/**
 * Get the podium text color value for a position
 * @param position - The position/rank (1, 2, 3, etc.)
 * @returns The hex color value, or null for non-podium positions
 */
export function getPodiumTextColor(position: number | null | undefined): string | null {
  switch (position) {
    case 1:
      return PODIUM_COLORS.FIRST.text;
    case 2:
      return PODIUM_COLORS.SECOND.text;
    case 3:
      return PODIUM_COLORS.THIRD.text;
    default:
      return null;
  }
}

/**
 * Get the podium background color value for a position
 * @param position - The position/rank (1, 2, 3, etc.)
 * @returns The rgba color value, or null for non-podium positions
 */
export function getPodiumBackgroundColor(position: number | null | undefined): string | null {
  switch (position) {
    case 1:
      return PODIUM_COLORS.FIRST.background;
    case 2:
      return PODIUM_COLORS.SECOND.background;
    case 3:
      return PODIUM_COLORS.THIRD.background;
    default:
      return null;
  }
}
```

## Recommended Approach: Option B (Row Highlight)

Option B is recommended because:
1. Matches the `tables.html` design system exactly
2. Provides both row highlighting and text color control
3. More flexible for different use cases
4. Backward compatible (keeps `getPodiumRowClass` function)

## Files That Use podiumColors.ts

Based on the current implementation comments, the following files import `podiumColors.ts`:

1. **ResultDivisionTabs.vue** - `/var/www/resources/app/js/components/result/ResultDivisionTabs.vue`
2. **CrossDivisionResultsSection.vue** - `/var/www/resources/app/js/components/round/modals/CrossDivisionResultsSection.vue`
3. **RaceEventResultsSection.vue** - `/var/www/resources/app/js/components/round/modals/RaceEventResultsSection.vue`
4. **RoundStandingsSection.vue** - `/var/www/resources/app/js/components/round/modals/RoundStandingsSection.vue`

## Migration Steps for Each File

### Step 1: Update podiumColors.ts

Replace the entire file with **Option B** implementation.

### Step 2: Update Component Usage

For each component using `getPodiumRowClass`:

**Before**:
```vue
<DataTable :value="results" :row-class="(data) => getPodiumRowClass(data.position)">
```

**After (if using TechDataTable wrapper)**:
```vue
<TechDataTable
  :value="results"
  :podium-highlight="true"
  position-field="position"
>
```

**After (if using DataTable directly)**:
```vue
<DataTable :value="results" :row-class="(data) => getPodiumRowClass(data.position)">
```

The function signature remains the same, so existing usage continues to work!

### Step 3: Update Position Cells

For position columns, use the new `getPodiumCellClass` or `PositionCell` component:

**Before**:
```vue
<Column field="position" header="Pos">
  <template #body="{ data }">
    <span class="font-mono font-semibold">{{ data.position }}</span>
  </template>
</Column>
```

**After (using PositionCell component)**:
```vue
<Column field="position" header="Pos">
  <template #body="{ data }">
    <PositionCell :position="data.position" />
  </template>
</Column>
```

**After (using getPodiumCellClass directly)**:
```vue
<Column field="position" header="Pos">
  <template #body="{ data }">
    <div :class="getPodiumCellClass(data.position)">
      {{ String(data.position).padStart(2, '0') }}
    </div>
  </template>
</Column>
```

## CSS Support (Already Added in app.css)

The following CSS classes are already defined in `app.css` (from Phase 1):

```css
/* Position Column - Podium Colors (Dark Mode) */
.p-datatable-tbody > tr > td.pos,
.p-datatable-tbody > tr > td .pos {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  width: 40px;
  text-align: center;
}

.p-datatable-tbody > tr > td.pos.p1,
.p-datatable-tbody > tr > td .pos.p1 {
  color: var(--yellow); /* #d29922 - Gold */
}

.p-datatable-tbody > tr > td.pos.p2,
.p-datatable-tbody > tr > td .pos.p2 {
  color: var(--text-muted); /* #6e7681 - Silver */
}

.p-datatable-tbody > tr > td.pos.p3,
.p-datatable-tbody > tr > td .pos.p3 {
  color: var(--orange); /* #f0883e - Bronze */
}

/* Podium Row Highlighting (subtle background) */
.p-datatable-tbody > tr.podium-1 {
  background-color: rgba(210, 153, 34, 0.08); /* Gold tint */
}

.p-datatable-tbody > tr.podium-2 {
  background-color: rgba(110, 118, 129, 0.08); /* Silver tint */
}

.p-datatable-tbody > tr.podium-3 {
  background-color: rgba(240, 136, 62, 0.08); /* Bronze tint */
}
```

## Testing Checklist

After updating `podiumColors.ts` and all using components:

### Visual Tests
- [ ] Position 1 text shows gold (#d29922)
- [ ] Position 2 text shows silver (#6e7681)
- [ ] Position 3 text shows bronze (#f0883e)
- [ ] Position 1 row has gold tint background (optional)
- [ ] Position 2 row has silver tint background (optional)
- [ ] Position 3 row has bronze tint background (optional)
- [ ] Non-podium positions show default text color (--text-primary)
- [ ] Hover states still work on podium rows

### Functionality Tests
- [ ] Podium highlighting works in ResultDivisionTabs
- [ ] Podium highlighting works in CrossDivisionResultsSection
- [ ] Podium highlighting works in RaceEventResultsSection
- [ ] Podium highlighting works in RoundStandingsSection
- [ ] Position numbers display correctly (padded with 0)

### Code Quality Tests
- [ ] TypeScript checks pass
- [ ] ESLint passes
- [ ] Prettier passes
- [ ] Vitest tests pass (if any exist for these components)

## Before/After Comparison

### Before (Light Mode)
```typescript
FIRST: '!bg-amber-100'  // Light gold background
SECOND: '!bg-gray-200'  // Light gray background
THIRD: '!bg-orange-100' // Light orange background
```

### After (Dark Mode)
```typescript
FIRST: {
  text: '#d29922',      // Gold text
  background: 'rgba(210, 153, 34, 0.08)', // Dark gold tint
}
SECOND: {
  text: '#6e7681',      // Silver text
  background: 'rgba(110, 118, 129, 0.08)', // Dark silver tint
}
THIRD: {
  text: '#f0883e',      // Bronze text
  background: 'rgba(240, 136, 62, 0.08)', // Dark bronze tint
}
```

## Implementation Order

1. **Update podiumColors.ts** (implement Option B)
2. **Test in browser** - verify no TypeScript errors
3. **Update components one by one**:
   - RoundStandingsSection.vue (during table migration)
   - RaceEventResultsSection.vue (during table migration)
   - CrossDivisionResultsSection.vue (during table migration)
   - ResultDivisionTabs.vue (during table migration)
4. **Visual regression testing** - compare before/after screenshots
5. **Mark as complete** when all tests pass

## Rollback Plan

If issues arise:

1. **Git commit before changes**
   ```bash
   git add resources/app/js/constants/podiumColors.ts
   git commit -m "Backup podiumColors.ts before migration"
   ```

2. **Revert if needed**
   ```bash
   git checkout HEAD -- resources/app/js/constants/podiumColors.ts
   ```

## Completion Criteria

- [ ] podiumColors.ts updated with Option B implementation
- [ ] All 4 components using podium colors updated
- [ ] Visual tests pass (correct colors, correct tints)
- [ ] Functionality tests pass (highlighting works)
- [ ] Code quality tests pass (TypeScript, ESLint, Prettier)
- [ ] No console errors or warnings
- [ ] Dark mode colors visible throughout app

## Related Documentation

- **Design Reference**: `/var/www/docs/designs/app/ideas2/technical-form/tables.html`
- **CSS Foundation**: `./1-css-foundation.md`
- **Component Library**: `./2-custom-components.md`
- **Migration Guide**: `./3-migration-checklist.md`
