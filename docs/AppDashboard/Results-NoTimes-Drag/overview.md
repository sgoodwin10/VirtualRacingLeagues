# Race Results Without Times - Feature Overview

## Summary

This feature adds a new `race_times_required` field to the `seasons` table that controls how race results are entered and displayed. When disabled, race times are not required, and results are entered using a drag-and-drop interface where position is determined by row order.

## Business Requirements

### Core Behavior

| Aspect | `race_times_required = TRUE` (Default) | `race_times_required = FALSE` |
|--------|----------------------------------------|-------------------------------|
| **Result Entry** | Enter race times, system calculates positions | Drag-and-drop ordering, row order = position |
| **Qualifying** | Enter lap times, sorted by fastest | Drag-and-drop + pole position checkbox |
| **Fastest Lap (Race)** | Auto-calculated from lap times | Manual checkbox (one per division) |
| **Round Results View** | Shows times, fastest lap, qualifier times | Shows positions and points only |
| **Time Columns** | race_time, race_time_difference, fastest_lap visible | Time columns hidden |

### Key Rules

1. **Position Determination (No Times Mode)**
   - Row order directly determines finishing position
   - Row 1 = P1, Row 2 = P2, etc.
   - Positions are assigned on save based on visual order

2. **DNF Handling (No Times Mode)**
   - DNF drivers are always positioned at the bottom
   - They can be reordered among themselves but not above finishers
   - Visual separation from finishers

3. **Qualifying - Pole Position (No Times Mode)**
   - Checkbox to indicate pole position
   - Checking pole automatically moves driver to position 1
   - Uses existing `has_pole` field

4. **Race - Fastest Lap (No Times Mode)**
   - Checkbox to indicate fastest lap
   - Only one driver per division can have fastest lap checked
   - Checking one auto-unchecks others in the same division
   - No validation required (save allowed with zero or multiple)

5. **Division Handling**
   - Separate drag-and-drop list per division (tabbed interface maintained)
   - Fastest lap is exclusive within each division
   - Each division's order determines positions independently

## Configuration

### Setting Location
- **Dashboard**: User dashboard (app.virtualracingleagues.localhost)
- **Form Section**: Grouped with existing feature flags (`team_championship_enabled`, `race_divisions_enabled`)
- **Label**: "Require Race Times" or similar

### Mutability
- **Default Value**: `TRUE` for existing and new seasons
- **Always Editable**: Can be changed at any time, regardless of season status or existing results
- **Existing Results**: Keep their format when setting is changed (no migration of result data)

## Affected Areas

### Database
- `seasons` table: Add `race_times_required` boolean column

### Backend (Laravel)
1. **Migration**: Add column to seasons table
2. **Domain Layer**: Update Season entity and value objects
3. **Application Layer**: Update Season DTOs and services
4. **API Responses**: Include `race_times_required` in season data

### Frontend (User Dashboard - app)

1. **Season Form**
   - Add toggle/checkbox for `race_times_required`
   - Group with other feature flags

2. **ResultEntryTable.vue**
   - Add drag-and-drop capability (when times not required)
   - Conditionally show/hide time columns
   - Add pole position checkbox for qualifying (no times mode)
   - Add fastest lap checkbox for race (no times mode)
   - Implement mutual exclusivity for fastest lap within division

3. **RaceResultModal.vue**
   - Pass `raceTimesRequired` prop to child components
   - Adjust save logic to use row order for positions

4. **Round Results Views**
   - Conditionally hide time columns when times not required
   - Show positions and points only

5. **ResultDivisionTabs.vue**
   - Maintain tabbed interface for divisions
   - Each tab has its own drag-and-drop list

## User Workflow Examples

### Example 1: Entering Race Results (No Times Mode)

1. User opens race result modal
2. Adds drivers using "Add Driver" button (appear at bottom)
3. Drags drivers to correct finishing order
4. Checks DNF for any non-finishers (automatically move to bottom)
5. Checks "Fastest Lap" for one driver per division
6. Clicks Save - positions assigned based on visual order

### Example 2: Entering Qualifying Results (No Times Mode)

1. User opens qualifying result modal
2. Adds drivers and drags to qualifying order
3. Checks "Pole" for the pole-sitter (auto-moves to P1)
4. Clicks Save - grid positions assigned based on order

### Example 3: Viewing Round Results (No Times Mode)

1. User navigates to round results
2. Sees driver positions and points only
3. No time columns visible
4. Clear, simple standings display

## Technical Considerations

### Drag-and-Drop Implementation
- Use Vue-compatible library (e.g., VueDraggable, @dnd-kit/vue)
- Maintain performance with larger driver lists
- Visual feedback during drag operations
- Handle keyboard accessibility

### State Management
- Track order changes in component state
- Compute positions from array indices on save
- Handle division-specific ordering

### Backward Compatibility
- Existing results with times remain unchanged
- Toggling setting doesn't modify existing result data
- Both modes can coexist in different seasons

## Out of Scope

- Migrating existing result data between modes
- Admin dashboard changes (only user dashboard affected)
- Changes to point calculation logic
- Changes to CSV import functionality

## Dependencies

- Season must be accessible via user dashboard
- Division tabs component (if divisions enabled)
- Existing result entry infrastructure

## Success Criteria

1. Users can configure `race_times_required` for seasons
2. When disabled, time columns are hidden in result entry
3. Drag-and-drop works smoothly for reordering drivers
4. DNF drivers stay at bottom of list
5. Pole checkbox auto-moves driver to P1 in qualifying
6. Fastest lap checkbox is mutually exclusive per division
7. Round results show positions/points only when times disabled
8. All existing functionality works when times are required (default)
