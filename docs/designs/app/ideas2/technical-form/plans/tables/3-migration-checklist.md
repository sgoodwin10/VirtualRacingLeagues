# Phase 3: Migration Checklist - File-by-File Guide

## Overview

This document provides a detailed migration checklist for each DataTable component in `resources/app`. Follow the order specified for best results (simple → complex).

---

## Phase 2: Simple Tables (Test & Validate)

### 1. AvailableDriversTable.vue

**File**: `/var/www/resources/app/js/components/season/AvailableDriversTable.vue`

**Complexity**: Low (simple table with actions)

#### Current State
- Basic DataTable with driver name, Discord, platform IDs
- Checkbox selection column
- No pagination (all rows visible)
- No sorting or filtering
- Simple action column with "Add" button

#### Migration Steps

1. **Import TechDataTable**
   ```typescript
   import { TechDataTable, DriverCell } from '@app/components/common/tables';
   ```

2. **Replace DataTable with TechDataTable**
   ```vue
   <!-- Before -->
   <DataTable :value="drivers" :loading="loading" striped-rows>

   <!-- After -->
   <TechDataTable :value="drivers" :loading="loading">
   ```

3. **Update driver name column to use DriverCell**
   ```vue
   <Column field="driver_name" header="Driver">
     <template #body="{ data }">
       <DriverCell
         :name="getDriverDisplayName(data)"
         :subtitle="`${data.discord_id || 'No Discord'}`"
         :show-avatar="false"
       />
     </template>
   </Column>
   ```

4. **Remove striped-rows prop** (no longer needed)

5. **Test**:
   - [ ] Table renders correctly
   - [ ] No striped rows visible
   - [ ] Hover states work
   - [ ] Selection still works
   - [ ] Actions still work

---

### 2. TeamsPanel.vue

**File**: `/var/www/resources/app/js/components/season/teams/TeamsPanel.vue`

**Complexity**: Low-Medium (team management with inline editing)

#### Current State
- DataTable with team name, logo, members count
- Inline editing of team names
- Delete action
- No pagination

#### Migration Steps

1. **Import TechDataTable and TeamCell**
   ```typescript
   import { TechDataTable, TeamCell } from '@app/components/common/tables';
   ```

2. **Replace DataTable**
   ```vue
   <TechDataTable :value="teams" :loading="loading">
   ```

3. **Update team column to use TeamCell**
   ```vue
   <Column field="name" header="Team">
     <template #body="{ data }">
       <TeamCell
         :name="data.name"
         :logo="data.logo_url"
         :color="data.color"
       />
     </template>
   </Column>
   ```

4. **Remove striped-rows prop**

5. **Test**:
   - [ ] Teams display correctly
   - [ ] Team logos/colors show correctly
   - [ ] Inline editing still works
   - [ ] Delete actions work
   - [ ] Hover states work

---

### 3. DivisionsPanel.vue

**File**: `/var/www/resources/app/js/components/season/divisions/DivisionsPanel.vue**

**Complexity**: Medium (reorderable table)

#### Current State
- DataTable with division name, logo, drivers count
- Reorderable rows (drag and drop)
- Delete action
- No pagination

#### Migration Steps

1. **Import TechDataTable**
   ```typescript
   import { TechDataTable } from '@app/components/common/tables';
   ```

2. **Replace DataTable** (keep reorderable props)
   ```vue
   <TechDataTable
     :value="divisions"
     :loading="loading"
     :reorderable-rows="true"
     @row-reorder="onRowReorder"
   >
   ```

3. **Update division column** (add icon/logo if available)
   ```vue
   <Column field="name" header="Division">
     <template #body="{ data }">
       <div class="flex items-center gap-3">
         <img
           v-if="data.logo_url"
           :src="data.logo_url"
           :alt="data.name"
           class="w-8 h-8 rounded object-cover"
         />
         <span class="font-medium">{{ data.name }}</span>
       </div>
     </template>
   </Column>
   ```

4. **Remove striped-rows prop**

5. **Test**:
   - [ ] Divisions display correctly
   - [ ] Drag and drop reordering works
   - [ ] Delete actions work
   - [ ] Hover states work
   - [ ] Order persists after reorder

---

## Phase 3: Complex Tables

### 4. SeasonDriversTable.vue ⚠️ MOST COMPLEX

**File**: `/var/www/resources/app/js/components/season/SeasonDriversTable.vue`

**Complexity**: Very High (pagination, filtering, sorting, inline edits)

#### Current State
- Paginated DataTable with server-side pagination
- Search functionality with debounced input
- Division and team filters
- Sortable columns
- Inline team/division dropdowns
- View and delete actions
- Dynamic platform columns (PSN, iRacing)
- Custom paginator template

#### Migration Steps

1. **Import TechDataTable and DriverCell**
   ```typescript
   import { TechDataTable, DriverCell } from '@app/components/common/tables';
   ```

2. **Replace DataTable**
   ```vue
   <TechDataTable
     :value="drivers"
     :loading="loading || loadingDriver"
     :lazy="true"
     :paginator="true"
     :rows="perPage"
     :total-records="totalRecords"
     :first="(currentPage - 1) * perPage"
     @page="onPage"
     @sort="onSort"
   >
   ```

3. **Update driver name column**
   ```vue
   <Column field="driver_name" header="Driver" sortable>
     <template #body="{ data }">
       <DriverCell
         :name="getDriverDisplayName(data)"
         :subtitle="data.discord_id || undefined"
       />
     </template>
   </Column>
   ```

4. **Update number column** (if showNumberColumn)
   ```vue
   <Column v-if="showNumberColumn" field="driver_number" header="#" sortable>
     <template #body="{ data }">
       <div class="font-mono font-semibold text-sm">
         {{ data.driver_number || '—' }}
       </div>
     </template>
   </Column>
   ```

5. **Keep custom paginator template** (already styled correctly)

6. **Remove striped-rows prop**

7. **Test**:
   - [ ] Pagination works
   - [ ] Search works
   - [ ] Filters work (division, team)
   - [ ] Sorting works
   - [ ] Inline team/division dropdowns work
   - [ ] View driver modal opens
   - [ ] Delete driver works
   - [ ] Refresh button works
   - [ ] No striped rows visible
   - [ ] Hover states work

---

### 5. DriverTable.vue

**File**: `/var/www/resources/app/js/components/driver/DriverTable.vue`

**Complexity**: High (paginated with dynamic columns)

#### Current State
- Paginated DataTable
- Dynamic platform ID columns based on league platform
- Driver name, Discord, PSN/iRacing columns
- View and delete actions

#### Migration Steps

1. **Import TechDataTable and DriverCell**
   ```typescript
   import { TechDataTable, DriverCell } from '@app/components/common/tables';
   ```

2. **Replace DataTable**
   ```vue
   <TechDataTable
     :value="drivers"
     :loading="loading"
     :paginator="true"
     :rows="perPage"
     :total-records="totalRecords"
     :first="(currentPage - 1) * perPage"
     @page="onPage"
     @sort="onSort"
   >
   ```

3. **Update driver name column**
   ```vue
   <Column field="driver_name" header="Driver" sortable>
     <template #body="{ data }">
       <DriverCell
         :name="getDriverDisplayName(data)"
         :subtitle="data.discord_id || undefined"
       />
     </template>
   </Column>
   ```

4. **Remove striped-rows prop**

5. **Test**:
   - [ ] Pagination works
   - [ ] Dynamic columns show based on platform
   - [ ] Sorting works
   - [ ] View driver works
   - [ ] Delete driver works
   - [ ] Hover states work

---

### 6. RoundStandingsSection.vue

**File**: `/var/www/resources/app/js/components/round/modals/RoundStandingsSection.vue`

**Complexity**: Medium-High (standings with podium highlighting)

#### Current State
- DataTable showing round standings
- Podium highlighting (1st, 2nd, 3rd)
- Position, driver, team, points, gap columns
- Currently uses light mode podium colors

#### Migration Steps

1. **Import components**
   ```typescript
   import { TechDataTable, PositionCell, DriverCell, TeamCell, PointsCell, GapCell } from '@app/components/common/tables';
   ```

2. **Replace DataTable** with podium highlighting
   ```vue
   <TechDataTable
     :value="standings"
     :loading="loading"
     :podium-highlight="true"
     position-field="position"
   >
   ```

3. **Update position column**
   ```vue
   <Column field="position" header="Pos" style="width: 60px">
     <template #body="{ data }">
       <PositionCell :position="data.position" />
     </template>
   </Column>
   ```

4. **Update driver column**
   ```vue
   <Column field="driver_name" header="Driver">
     <template #body="{ data }">
       <DriverCell
         :name="data.driver_name"
         :subtitle="`#${data.driver_number || '—'}`"
       />
     </template>
   </Column>
   ```

5. **Update team column** (if team championship enabled)
   ```vue
   <Column v-if="hasTeams" field="team_name" header="Team">
     <template #body="{ data }">
       <TeamCell
         :name="data.team_name || 'Privateer'"
         :color="data.team_color"
       />
     </template>
   </Column>
   ```

6. **Update points column**
   ```vue
   <Column field="points" header="Points">
     <template #body="{ data }">
       <PointsCell :value="data.points" />
     </template>
   </Column>
   ```

7. **Update gap column**
   ```vue
   <Column field="gap" header="Gap">
     <template #body="{ data }">
       <GapCell :value="data.gap" />
     </template>
   </Column>
   ```

8. **Remove podiumColors import and getPodiumRowClass usage**

9. **Test**:
   - [ ] Standings display correctly
   - [ ] Podium rows highlighted (gold/silver/bronze)
   - [ ] Position numbers show podium colors
   - [ ] Team indicators work
   - [ ] Points display correctly
   - [ ] Gap calculations correct
   - [ ] Hover states work

---

### 7. RaceEventResultsSection.vue

**File**: `/var/www/resources/app/js/components/round/modals/RaceEventResultsSection.vue`

**Complexity**: Medium-High (race results with time formatting)

#### Current State
- DataTable showing race results
- Position, driver, team, finish time, gap, points
- Podium highlighting
- Time formatting (MM:SS.mmm)

#### Migration Steps

1. **Import components**
   ```typescript
   import { TechDataTable, PositionCell, DriverCell, TeamCell, PointsCell, GapCell } from '@app/components/common/tables';
   ```

2. **Replace DataTable** with podium highlighting
   ```vue
   <TechDataTable
     :value="results"
     :loading="loading"
     :podium-highlight="true"
     position-field="position"
   >
   ```

3. **Update columns** (similar to RoundStandingsSection)

4. **Add time column** (keep existing formatting logic)
   ```vue
   <Column field="finish_time" header="Time">
     <template #body="{ data }">
       <div class="font-mono text-sm text-text-secondary">
         {{ formatTime(data.finish_time) }}
       </div>
     </template>
   </Column>
   ```

5. **Remove podiumColors import**

6. **Test**:
   - [ ] Results display correctly
   - [ ] Times format correctly
   - [ ] Podium highlighting works
   - [ ] Gap calculations correct
   - [ ] Hover states work

---

### 8. CrossDivisionResultsSection.vue

**File**: `/var/www/resources/app/js/components/round/modals/CrossDivisionResultsSection.vue`

**Complexity**: Medium (cross-division results)

#### Current State
- DataTable showing cross-division results
- Position, driver, division, points
- Podium highlighting

#### Migration Steps

1. **Import components**
   ```typescript
   import { TechDataTable, PositionCell, DriverCell, PointsCell } from '@app/components/common/tables';
   ```

2. **Replace DataTable** with podium highlighting
   ```vue
   <TechDataTable
     :value="results"
     :loading="loading"
     :podium-highlight="true"
     position-field="position"
   >
   ```

3. **Update columns** (position, driver, division, points)

4. **Add division column**
   ```vue
   <Column field="division_name" header="Division">
     <template #body="{ data }">
       <div class="flex items-center gap-2">
         <img
           v-if="data.division_logo"
           :src="data.division_logo"
           :alt="data.division_name"
           class="w-6 h-6 rounded"
         />
         <span class="text-sm">{{ data.division_name }}</span>
       </div>
     </template>
   </Column>
   ```

5. **Remove podiumColors import**

6. **Test**:
   - [ ] Results display correctly
   - [ ] Divisions display correctly
   - [ ] Podium highlighting works
   - [ ] Hover states work

---

## Phase 4: Custom Tables (Special Cases)

### 9. SeasonStandingsPanel.vue ⚠️ SPECIAL CASE

**File**: `/var/www/resources/app/js/components/season/panels/SeasonStandingsPanel.vue`

**Complexity**: High (uses custom inline tables with h() function)

#### Current State
- Uses `StandingsTable` and `TeamsStandingsTable` components
- Tables built using Vue's `h()` render function
- Complex structure with rounds as columns
- Drop rounds support
- Podium highlighting

#### Migration Strategy

**Option 1**: Update `StandingsTable` and `TeamsStandingsTable` components to use Technical Blueprint styling internally (recommended)

**Option 2**: Rebuild tables using TechDataTable wrapper

#### Migration Steps (Option 1)

1. **Find StandingsTable component**
   ```bash
   # Search for the component
   find resources/app/js -name "*StandingsTable*"
   ```

2. **Update StandingsTable component**
   - Apply Technical Blueprint CSS classes
   - Use podium colors from design system
   - Update typography to IBM Plex Mono

3. **Update TeamsStandingsTable component** (similar approach)

4. **Remove light mode podium colors**

5. **Test**:
   - [ ] Standings display correctly
   - [ ] Round columns display correctly
   - [ ] Drop rounds work correctly
   - [ ] Podium highlighting works
   - [ ] Team standings work correctly
   - [ ] Tab switching works
   - [ ] Hover states work

---

## Global Testing Checklist

After completing all migrations, test the following across ALL tables:

### Visual Tests
- [ ] All headers use IBM Plex Mono, 10px, uppercase, 1px letter-spacing
- [ ] All cells have 14px 16px padding
- [ ] No striped rows visible (all backgrounds transparent)
- [ ] Row hover shows bg-elevated background (#21262d)
- [ ] Last row has no bottom border
- [ ] Borders use correct colors (border: #30363d, border-muted: #21262d)
- [ ] Text uses correct colors (text-primary, text-secondary, text-muted)

### Podium Colors
- [ ] Position 1 shows gold (#d29922)
- [ ] Position 2 shows silver (#6e7681)
- [ ] Position 3 shows bronze (#f0883e)
- [ ] Podium rows have subtle background tint (optional)

### Functionality Tests
- [ ] Pagination works on all paginated tables
- [ ] Sorting works on all sortable columns
- [ ] Filtering works (where applicable)
- [ ] Search works (where applicable)
- [ ] Row actions work (view, edit, delete)
- [ ] Inline editing works (where applicable)
- [ ] Selection works (where applicable)
- [ ] Drag and drop reordering works (DivisionsPanel)

### Quality Checks
- [ ] All Vitest tests pass
- [ ] TypeScript checks pass (`npm run type-check`)
- [ ] Prettier passes (`npm run format`)
- [ ] ESLint passes (`npm run lint`)
- [ ] No console errors
- [ ] No console warnings

## Rollback Plan

If issues arise during migration:

1. **Git branches**: Create a branch for each phase
   ```bash
   git checkout -b feature/tables-migration-phase-1
   git checkout -b feature/tables-migration-phase-2
   git checkout -b feature/tables-migration-phase-3
   ```

2. **Component-level rollback**: Keep original DataTable usage alongside TechDataTable temporarily
   ```vue
   <!-- Commented out old implementation -->
   <!-- <DataTable :value="data" striped-rows> -->

   <!-- New implementation -->
   <TechDataTable :value="data">
   ```

3. **CSS rollback**: Keep backup of app.css
   ```bash
   cp resources/app/css/app.css resources/app/css/app.css.backup
   ```

## Next Step

After completing all migrations, proceed to:
- **[4-podium-colors.md](./4-podium-colors.md)** - Update podium color constants
