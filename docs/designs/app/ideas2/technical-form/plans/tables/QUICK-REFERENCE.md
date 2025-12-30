# Quick Reference Guide - DataTable Migration

## File Locations

### Documentation
- `/var/www/docs/designs/app/ideas2/technical-form/tables.html` - Design system reference
- `/var/www/docs/designs/app/ideas2/technical-form/plans/tables/` - Implementation plans

### Source Files
- `/var/www/resources/app/css/app.css` - Global CSS
- `/var/www/resources/app/js/constants/podiumColors.ts` - Podium color system
- `/var/www/resources/app/js/components/common/tables/` - Custom table components

### Components to Migrate (9 total)
```
resources/app/js/components/
├── season/
│   ├── SeasonDriversTable.vue          (Very High complexity)
│   ├── AvailableDriversTable.vue       (Low complexity)
│   └── panels/SeasonStandingsPanel.vue (High complexity - custom)
├── driver/
│   └── DriverTable.vue                 (High complexity)
├── round/modals/
│   ├── RoundStandingsSection.vue       (Medium-High complexity)
│   ├── RaceEventResultsSection.vue     (Medium-High complexity)
│   └── CrossDivisionResultsSection.vue (Medium complexity)
└── season/
    ├── divisions/DivisionsPanel.vue    (Medium complexity)
    └── teams/TeamsPanel.vue            (Low-Medium complexity)
```

---

## Essential Commands

### Development
```bash
npm run dev                    # Start Vite dev server
npm run type-check             # TypeScript checks
npm run lint                   # ESLint
npm run format                 # Prettier
npm test                       # Run all tests
npm run test:app               # App-only tests
```

### Testing Specific Files
```bash
npm test -- SeasonDriversTable.test.ts
npm test -- --ui               # Test with UI
npm test -- --coverage         # Coverage report
```

---

## Color Reference

### Technical Blueprint Colors

```css
/* Backgrounds */
--bg-dark: #0d1117          /* Main background */
--bg-panel: #161b22         /* Panel backgrounds */
--bg-card: #1c2128          /* Card/table background */
--bg-elevated: #21262d      /* Hover states */
--bg-highlight: #272d36     /* Highlighted elements */

/* Text */
--text-primary: #e6edf3     /* Primary text */
--text-secondary: #8b949e   /* Secondary text */
--text-muted: #6e7681       /* Muted text */

/* Borders */
--border: #30363d           /* Default borders */
--border-muted: #21262d     /* Muted borders */

/* Semantic */
--cyan: #58a6ff             /* Primary/links */
--green: #7ee787            /* Success */
--orange: #f0883e           /* Warning */
--red: #f85149              /* Error */
--purple: #bc8cff           /* Special */
--yellow: #d29922           /* Highlight/1st place */

/* Podium Colors (Dark Mode) */
P1 (1st): #d29922           /* Gold */
P2 (2nd): #6e7681           /* Silver */
P3 (3rd): #f0883e           /* Bronze */
```

### Status Badge Colors

```css
/* Active/Completed */
background: rgba(126, 231, 135, 0.15)  /* --green-dim */
color: #7ee787                          /* --green */

/* Pending */
background: rgba(240, 136, 62, 0.15)   /* --orange-dim */
color: #f0883e                          /* --orange */

/* Inactive/Scheduled */
background: #21262d                     /* --bg-elevated */
color: #6e7681                          /* --text-muted */

/* Error/Failed */
background: rgba(248, 81, 73, 0.15)    /* --red-dim */
color: #f85149                          /* --red */
```

---

## Typography Reference

### Table Headers
```css
font-family: IBM Plex Mono
font-size: 10px
font-weight: 600
letter-spacing: 1px
text-transform: uppercase
color: var(--text-muted)
padding: 12px 16px
```

### Table Cells
```css
font-size: 13px
padding: 14px 16px
color: var(--text-primary)
vertical-align: middle
```

### Position Numbers
```css
font-family: IBM Plex Mono
font-size: 14px
font-weight: 600
```

### Points/Data
```css
font-family: IBM Plex Mono
font-weight: 600
font-size: 14px
```

### Gap Cells
```css
font-family: IBM Plex Mono
font-size: 12px
```

### Driver Names
```css
font-family: Inter (--font-sans)
font-size: 13px
font-weight: 500
```

### Driver Subtitles
```css
font-family: Inter (--font-sans)
font-size: 11px
color: var(--text-muted)
```

---

## Import Statements

### Basic Table
```typescript
import { TechDataTable } from '@app/components/common/tables';
import Column from 'primevue/column';
```

### With Cell Components
```typescript
import {
  TechDataTable,
  PositionCell,
  DriverCell,
  TeamCell,
  PointsCell,
  GapCell,
  StatusCell,
} from '@app/components/common/tables';
import Column from 'primevue/column';
```

### Pagination Types
```typescript
import type {
  DataTablePageEvent,
  DataTableSortEvent,
  DataTableFilterEvent,
} from 'primevue/datatable';
```

---

## Component Prop Reference

### TechDataTable Props

```typescript
interface TechDataTableProps {
  value: T[];                    // Required: table data
  loading?: boolean;             // Show loading spinner
  paginator?: boolean;           // Enable pagination
  rows?: number;                 // Rows per page (default: 10)
  totalRecords?: number;         // Total records for lazy loading
  first?: number;                // First row index (default: 0)
  lazy?: boolean;                // Enable lazy loading
  rowHover?: boolean;            // Enable row hover (default: true)
  emptyMessage?: string;         // Empty state message
  responsiveLayout?: 'scroll' | 'stack'; // Default: 'scroll'
  tableClass?: string;           // Custom CSS classes
  podiumHighlight?: boolean;     // Apply podium highlighting (default: false)
  positionField?: keyof T;       // Position field name (default: 'position')
}
```

### Cell Component Props

#### PositionCell
```typescript
interface PositionCellProps {
  position: number | null | undefined;
  padded?: boolean;              // Zero-pad (default: true)
  width?: string;                // Custom width (default: '40px')
}
```

#### DriverCell
```typescript
interface DriverCellProps {
  name: string;                  // Required
  subtitle?: string;             // e.g., "#1 | NED"
  avatar?: string;               // URL or initials
  teamColor?: string;            // Border color
  showAvatar?: boolean;          // Default: true
}
```

#### TeamCell
```typescript
interface TeamCellProps {
  name: string;                  // Required
  color?: string;                // Dot color
  logo?: string;                 // Team logo URL
}
```

#### PointsCell
```typescript
interface PointsCellProps {
  value: number | null | undefined;
  decimals?: number;             // Default: 0
  placeholder?: string;          // Default: '—'
}
```

#### GapCell
```typescript
interface GapCellProps {
  value: number | null | undefined;
  decimals?: number;             // Default: 0
  showPlus?: boolean;            // Show + for positive (default: false)
  leaderPlaceholder?: string;    // Default: '—'
}
```

#### StatusCell
```typescript
type StatusType = 'active' | 'pending' | 'inactive' | 'scheduled' | 'error' | 'failed' | 'completed';

interface StatusCellProps {
  status: StatusType;            // Required
  label?: string;                // Override default label
  showDot?: boolean;             // Default: true
}
```

---

## Common Patterns

### Basic Standings Table
```vue
<TechDataTable :value="drivers" :podium-highlight="true" position-field="position">
  <Column field="position" header="Pos" style="width: 60px">
    <template #body="{ data }">
      <PositionCell :position="data.position" />
    </template>
  </Column>

  <Column field="name" header="Driver">
    <template #body="{ data }">
      <DriverCell :name="data.name" />
    </template>
  </Column>

  <Column field="points" header="Points">
    <template #body="{ data }">
      <PointsCell :value="data.points" />
    </template>
  </Column>
</TechDataTable>
```

### Paginated Table
```vue
<TechDataTable
  :value="drivers"
  :loading="loading"
  :paginator="true"
  :lazy="true"
  :rows="perPage"
  :total-records="totalRecords"
  :first="(currentPage - 1) * perPage"
  @page="onPage"
  @sort="onSort"
>
  <!-- Columns here -->
</TechDataTable>
```

### Driver Cell with Avatar
```vue
<Column field="driver" header="Driver">
  <template #body="{ data }">
    <DriverCell
      :name="data.name"
      :subtitle="data.discord_id"
      :avatar="data.avatar_url"
      :team-color="data.team_color"
    />
  </template>
</Column>
```

### Team with Logo
```vue
<Column field="team" header="Team">
  <template #body="{ data }">
    <TeamCell
      :name="data.team_name"
      :logo="data.team_logo"
    />
  </template>
</Column>
```

### Team with Color Dot
```vue
<Column field="team" header="Team">
  <template #body="{ data }">
    <TeamCell
      :name="data.team_name"
      :color="data.team_color"
    />
  </template>
</Column>
```

### Gap Column
```vue
<Column field="gap" header="Gap">
  <template #body="{ data }">
    <GapCell :value="data.gap" />
  </template>
</Column>
```

### Status Badge
```vue
<Column field="status" header="Status">
  <template #body="{ data }">
    <StatusCell :status="data.status" />
  </template>
</Column>
```

---

## Migration Checklist (Per Component)

```markdown
- [ ] Read current component implementation
- [ ] Import TechDataTable and cell components
- [ ] Replace <DataTable> with <TechDataTable>
- [ ] Remove striped-rows prop
- [ ] Add :podium-highlight="true" if applicable
- [ ] Update position column with PositionCell
- [ ] Update driver column with DriverCell
- [ ] Update team column with TeamCell
- [ ] Update points column with PointsCell
- [ ] Update gap column with GapCell
- [ ] Update status column with StatusCell
- [ ] Remove podiumColors import (if applicable)
- [ ] Test in browser
- [ ] Verify sorting works
- [ ] Verify pagination works
- [ ] Verify filters work
- [ ] Verify actions work
- [ ] Check podium highlighting
- [ ] Check hover states
- [ ] Run npm run type-check
- [ ] Run npm run lint
- [ ] Run npm run format
- [ ] Run npm test
- [ ] Commit changes
```

---

## Testing Checklist (Per Component)

### Visual Tests
```markdown
- [ ] Headers: 10px, IBM Plex Mono, uppercase, 1px letter-spacing
- [ ] Cells: 14px 16px padding
- [ ] No striped rows
- [ ] Hover shows bg-elevated (#21262d)
- [ ] Last row has no bottom border
- [ ] Borders: #30363d (headers), #21262d (cells)
- [ ] Text colors: text-primary, text-secondary, text-muted
- [ ] Podium colors: Gold (#d29922), Silver (#6e7681), Bronze (#f0883e)
```

### Functionality Tests
```markdown
- [ ] Table renders correctly
- [ ] Data displays correctly
- [ ] Pagination works (if applicable)
- [ ] Sorting works (if applicable)
- [ ] Filtering works (if applicable)
- [ ] Search works (if applicable)
- [ ] Row actions work (view, edit, delete)
- [ ] Inline editing works (if applicable)
- [ ] Selection works (if applicable)
- [ ] Empty state displays correctly
- [ ] Loading state displays correctly
```

### Code Quality Tests
```markdown
- [ ] TypeScript checks pass
- [ ] ESLint passes
- [ ] Prettier passes
- [ ] Vitest tests pass
- [ ] No console errors
- [ ] No console warnings
```

---

## Troubleshooting

### Issue: Striped rows still visible
**Solution**: Ensure `striped-rows` prop is removed from TechDataTable

### Issue: Podium colors not showing
**Solution**:
1. Check `:podium-highlight="true"` is set
2. Verify `position-field` matches your data structure
3. Check position values are numbers (1, 2, 3)

### Issue: Headers not using IBM Plex Mono
**Solution**: Check CSS foundation is applied (app.css updated)

### Issue: Wrong padding on cells
**Solution**: Global CSS should override PrimeVue defaults - check app.css

### Issue: TypeScript errors with cell components
**Solution**:
1. Check imports from `@app/components/common/tables`
2. Verify props match interface definitions
3. Check value types (number vs number | null)

### Issue: Hover states not working
**Solution**:
1. Verify `:row-hover="true"` (default)
2. Check CSS for `.p-datatable-tbody > tr:hover`
3. Ensure no conflicting scoped styles

---

## Performance Tips

1. **Use lazy loading** for large datasets (`:lazy="true"`)
2. **Paginate** tables with >50 rows
3. **Avoid inline functions** in `:row-class` (use podiumHighlight prop instead)
4. **Memoize computed values** in parent components
5. **Use virtual scrolling** for very large datasets (PrimeVue VirtualScroller)

---

## Accessibility Checklist

```markdown
- [ ] Column headers have proper semantic markup
- [ ] Sortable columns have aria-sort attributes
- [ ] Empty/loading states have aria-live regions
- [ ] Row actions have aria-labels
- [ ] Keyboard navigation works (Tab, Enter, Arrow keys)
- [ ] Screen reader announces table structure
- [ ] Color is not the only indicator (podium has position numbers)
```

---

## Documentation Links

- **README**: `./README.md` - Overview and strategy
- **Phase 1**: `./1-css-foundation.md` - CSS updates
- **Phase 2**: `./2-custom-components.md` - Component creation
- **Phase 3**: `./3-migration-checklist.md` - File-by-file migration
- **Phase 4**: `./4-podium-colors.md` - Podium color system
- **Examples**: `./EXAMPLE-IMPLEMENTATION.md` - Before/after examples
- **Design System**: `../tables.html` - Visual reference

---

## Need Help?

1. **Visual reference**: Open `docs/designs/app/ideas2/technical-form/tables.html` in browser
2. **Before/after examples**: See `EXAMPLE-IMPLEMENTATION.md`
3. **Step-by-step guide**: Follow `README.md` → Phase 1 → Phase 2 → Phase 3 → Phase 4
4. **CSS reference**: Check `1-css-foundation.md` for all CSS classes
5. **Component API**: See `2-custom-components.md` for prop interfaces
