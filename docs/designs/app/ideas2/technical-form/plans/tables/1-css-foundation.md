# Phase 1: CSS Foundation - Global DataTable Overrides

## Overview

This document details the CSS foundation changes needed to support Technical Blueprint table styling across the entire app.

## File to Update

**File**: `/var/www/resources/app/css/app.css`

## Current State

Currently has basic PrimeVue DataTable overrides:
- Lines 844-948: Basic table header/body styling
- Uses light mode colors and inconsistent typography

## Changes Required

### 1. Update Existing DataTable Styles (Lines 935-948)

**Location**: Lines 935-948 in `app.css`

**Current Code**:
```css
/* PrimeVue DataTable Headers - Use monospace font */
.p-datatable-thead > tr > th {
  font-family: var(--font-mono);
  font-size: 0.6875rem; /* 11px */
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* PrimeVue DataTable Body - Use monospace font for data */
.p-datatable-tbody > tr > td {
  font-family: var(--font-mono);
  font-size: 0.875rem; /* 14px */
  font-weight: 600;
}
```

**Replace With**:
```css
/* ============================================
   PrimeVue DataTable - Technical Blueprint
   ============================================ */

/* Table Headers - Technical Blueprint Style */
.p-datatable-thead > tr > th {
  font-family: var(--font-mono);
  font-size: 10px; /* Exact spec from design */
  font-weight: 600;
  letter-spacing: 1px; /* Increased from 0.5px */
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 12px 16px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border);
}

/* Table Header Hover */
.p-datatable-thead > tr > th:hover {
  background-color: var(--bg-elevated);
}

/* Table Header Sorted State */
.p-datatable-thead > tr > th.p-sorted-column {
  background-color: var(--bg-elevated);
  color: var(--text-secondary);
}

/* Table Cells - Technical Blueprint Style */
.p-datatable-tbody > tr > td {
  font-size: 13px; /* Exact spec from design */
  padding: 14px 16px; /* Exact spec from design */
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-muted);
  background-color: transparent; /* No alternating stripes */
  vertical-align: middle;
}

/* Last row - No bottom border */
.p-datatable-tbody > tr:last-child > td {
  border-bottom: none;
}

/* Row Hover State */
.p-datatable-tbody > tr:hover > td {
  background-color: var(--bg-elevated);
}

/* Remove striped rows styling (override PrimeVue) */
.p-datatable-striped .p-datatable-tbody > tr:nth-child(odd) {
  background-color: transparent !important;
}
.p-datatable-striped .p-datatable-tbody > tr:nth-child(even) {
  background-color: transparent !important;
}

/* Table Container */
.p-datatable {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

/* Table wrapper */
.p-datatable-wrapper {
  background-color: var(--bg-card);
}
```

### 2. Add Position Column Styling

**Add After DataTable Styles**:
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

/* Podium Position Colors - Technical Blueprint */
.p-datatable-tbody > tr > td.pos.p1,
.p-datatable-tbody > tr > td .pos.p1,
.p-datatable-tbody > tr.podium-1 > td:first-child {
  color: var(--yellow); /* #d29922 - Gold */
}

.p-datatable-tbody > tr > td.pos.p2,
.p-datatable-tbody > tr > td .pos.p2,
.p-datatable-tbody > tr.podium-2 > td:first-child {
  color: var(--text-muted); /* #6e7681 - Silver */
}

.p-datatable-tbody > tr > td.pos.p3,
.p-datatable-tbody > tr > td .pos.p3,
.p-datatable-tbody > tr.podium-3 > td:first-child {
  color: var(--orange); /* #f0883e - Bronze */
}

/* Alternative: Podium Row Highlighting (subtle background) */
.p-datatable-tbody > tr.podium-1 {
  background-color: rgba(210, 153, 34, 0.08); /* Gold tint */
}

.p-datatable-tbody > tr.podium-2 {
  background-color: rgba(110, 118, 129, 0.08); /* Silver tint */
}

.p-datatable-tbody > tr.podium-3 {
  background-color: rgba(240, 136, 62, 0.08); /* Bronze tint */
}

/* Maintain hover on podium rows */
.p-datatable-tbody > tr.podium-1:hover > td,
.p-datatable-tbody > tr.podium-2:hover > td,
.p-datatable-tbody > tr.podium-3:hover > td {
  background-color: var(--bg-elevated);
}
```

### 3. Add Driver Cell Pattern

**Add After Position Styles**:
```css
/* Driver Cell - Avatar + Info Layout */
.driver-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.driver-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  background-color: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.driver-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.driver-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-sans); /* Use Inter for names */
}

.driver-team,
.driver-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-sans);
}
```

### 4. Add Team Indicator Pattern

**Add After Driver Cell Styles**:
```css
/* Team Indicator - Dot + Name */
.team-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: var(--bg-elevated);
  border-radius: 3px;
  font-size: 12px;
  color: var(--text-secondary);
}

.team-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

### 5. Add Numerical Data Styling

**Add After Team Indicator Styles**:
```css
/* Points/Numerical Data - Monospace Bold */
.points-cell,
.data-cell {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

/* Gap Cell - Smaller Monospace */
.gap-cell {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.gap-cell.negative {
  color: var(--red);
}

.gap-cell.positive {
  color: var(--green);
}
```

### 6. Add Status Badge Styling

**Add After Numerical Data Styles**:
```css
/* Status Badges - Technical Blueprint */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
}

.status-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.status-badge.active {
  background-color: var(--green-dim); /* rgba(126, 231, 135, 0.15) */
  color: var(--green);
}

.status-badge.pending {
  background-color: var(--orange-dim); /* rgba(240, 136, 62, 0.15) */
  color: var(--orange);
}

.status-badge.inactive,
.status-badge.scheduled {
  background-color: var(--bg-elevated);
  color: var(--text-muted);
}

.status-badge.error,
.status-badge.failed {
  background-color: var(--red-dim); /* rgba(248, 81, 73, 0.15) */
  color: var(--red);
}
```

### 7. Add Pagination Styling

**Add After Status Badge Styles**:
```css
/* DataTable Pagination - Technical Blueprint */
.p-datatable-paginator {
  background-color: var(--bg-elevated);
  border-top: 1px solid var(--border);
  padding: 12px 16px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
}

.p-datatable-paginator .p-paginator-page,
.p-datatable-paginator .p-paginator-next,
.p-datatable-paginator .p-paginator-prev,
.p-datatable-paginator .p-paginator-first,
.p-datatable-paginator .p-paginator-last {
  background-color: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  min-width: 32px;
  height: 32px;
  border-radius: var(--radius);
}

.p-datatable-paginator .p-paginator-page:hover,
.p-datatable-paginator .p-paginator-next:hover,
.p-datatable-paginator .p-paginator-prev:hover,
.p-datatable-paginator .p-paginator-first:hover,
.p-datatable-paginator .p-paginator-last:hover {
  background-color: var(--bg-highlight);
  border-color: var(--border);
}

.p-datatable-paginator .p-paginator-page.p-highlight {
  background-color: var(--cyan);
  border-color: var(--cyan);
  color: var(--bg-dark);
}
```

### 8. Add Empty State Styling

**Add After Pagination Styles**:
```css
/* DataTable Empty State */
.p-datatable-emptymessage {
  text-align: center;
  padding: 48px 16px;
  color: var(--text-muted);
  font-size: 14px;
}

.p-datatable-emptymessage .pi {
  font-size: 48px;
  color: var(--text-muted);
  opacity: 0.3;
  margin-bottom: 16px;
}
```

## Implementation Steps

1. **Backup current app.css** (recommended)
   ```bash
   cp resources/app/css/app.css resources/app/css/app.css.backup
   ```

2. **Update existing DataTable styles** (lines 935-948)
   - Replace current header/body styles with Technical Blueprint versions

3. **Add new CSS sections** in order:
   - Position column styling
   - Driver cell pattern
   - Team indicator pattern
   - Numerical data styling
   - Status badge styling
   - Pagination styling
   - Empty state styling

4. **Test CSS changes**
   ```bash
   npm run dev
   ```

5. **Verify visual changes** in browser:
   - Navigate to any table view
   - Check header styling (10px, uppercase, letter-spacing)
   - Check cell padding (14px 16px)
   - Check hover states
   - Check borders (bottom border on rows, no border on last row)

## Before/After Comparison

### Before
- Light mode colors (amber-100, gray-200, orange-100)
- Inconsistent padding and typography
- Striped rows visible
- Light border colors
- Light text colors

### After
- Dark mode colors (bg-card, bg-elevated, border-muted)
- Consistent 14px 16px padding on cells
- No striped rows (transparent backgrounds)
- Dark border colors (#30363d, #21262d)
- Dark mode text colors (text-primary, text-muted)
- Podium colors: Gold (#d29922), Silver (#6e7681), Bronze (#f0883e)

## Testing Checklist

- [ ] Headers use IBM Plex Mono, 10px, uppercase, 1px letter-spacing
- [ ] Cells have 14px 16px padding
- [ ] Row hover shows bg-elevated background
- [ ] No striped rows visible
- [ ] Last row has no bottom border
- [ ] Borders use correct dark mode colors
- [ ] Text uses correct dark mode colors
- [ ] Position cells show podium colors (if applicable)
- [ ] Status badges use correct background/text colors
- [ ] Pagination matches Technical Blueprint style

## Next Step

After completing CSS foundation, proceed to:
- **[2-custom-components.md](./2-custom-components.md)** - Build TechDataTable wrapper component
