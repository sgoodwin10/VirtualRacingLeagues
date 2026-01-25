# Delete Driver Feature - Overview

## Feature Summary

This feature changes how driver deletion works in the application. Currently, when a driver is "removed" from a league in the user dashboard, it **deletes the `league_drivers` relationship record**, which removes the driver from all historical data (race results, standings, etc.).

The new behavior will:
1. **Soft-delete the driver** (set `deleted_at` timestamp in `drivers` table)
2. **Preserve the `league_drivers` relationship** so the driver still appears in historical data
3. Allow filtering between "active" and "deleted" drivers in the UI

## Current Behavior

### User Dashboard (LeagueDrivers.vue)
- When user clicks "Remove Driver" → `removeDriverFromLeague()` is called
- This **deletes** the `league_drivers` pivot table record
- The driver record itself remains in `drivers` table
- **Problem**: Driver disappears from race results, standings, etc.

### Admin Dashboard (DriverDataTable.vue)
- Admin can view all drivers globally
- Admin can "Delete" a driver (soft-delete via `deleted_at`)
- **Already has correct behavior**: Soft-deletes the driver, preserves relationships

### Database Structure

```
drivers table
├── id
├── first_name, last_name, nickname
├── platform IDs (psn_id, iracing_id, etc.)
├── deleted_at (soft delete) ← EXISTS, used for global deletion
└── timestamps

league_drivers table (pivot)
├── league_id
├── driver_id
├── driver_number, status, league_notes
└── timestamps

season_drivers table (pivot)
├── season_id
├── league_driver_id (references league_drivers)
├── team_id, division_id
└── status, timestamps
```

## Goal Behavior

### When deleting a driver from a league:
1. Set `deleted_at` on the `drivers` record (soft delete)
2. **Keep** the `league_drivers` relationship intact
3. **Keep** the `season_drivers` records intact
4. Driver name continues to appear everywhere (race results, standings, etc.)
5. Driver will be marked as "deleted" in driver lists

### When restoring a deleted driver:
1. Clear `deleted_at` on the `drivers` record (set to NULL)
2. Driver returns to "active" status
3. All existing relationships (league_drivers, season_drivers) remain intact
4. Driver appears in active driver lists again

### Driver Status Filter in UI:
- **Active**: Drivers where `deleted_at IS NULL`
- **Deleted**: Drivers where `deleted_at IS NOT NULL`
- Default view shows "Active" drivers only
- User can toggle to see "Deleted" drivers
- **Restore action** available when viewing deleted drivers

## Affected Areas

| Area | Current Query Behavior | Required Change |
|------|----------------------|-----------------|
| League Drivers List | Filters out `deleted_at` | Add toggle filter for status |
| Season Drivers | Filters out `deleted_at` | Should show all (incl. deleted) for historical |
| Race Results | Unknown | Must include deleted drivers |
| Standings | Unknown | Must include deleted drivers |
| Driver Search | Includes deleted (`withTrashed`) | May need adjustment |
| Public Views | Unknown | Must show deleted drivers in results |
| Admin Views | Shows both with badge | Already correct |

## Implementation Approach

### Phase 1: Backend Changes
1. Modify `removeDriverFromLeague()` to soft-delete instead of removing relationship
2. Update queries to include deleted drivers where needed (results, standings)
3. Add new endpoint/parameter to filter by deleted status
4. Ensure `league_drivers` records are preserved
5. **Add restore endpoint** to clear `deleted_at` and restore driver

### Phase 2: Frontend Changes
1. Add driver status filter (Active/Deleted) to LeagueDrivers.vue and DriversView.vue
2. Update driver table to show deletion status
3. Ensure deleted drivers display correctly in all historical views
4. Update confirmation dialogs and messages
5. **Add restore button** visible when viewing deleted drivers
6. **Add restore confirmation dialog** and success feedback

### Phase 3: Verification
1. Verify race results still show deleted drivers
2. Verify standings still show deleted drivers
3. Verify public site displays correctly
4. Verify admin dashboard handles correctly
5. **Verify restore functionality works correctly**
6. Run existing unit/feature tests and add new ones

## Key Files to Modify

### Backend
- `app/Application/Driver/Services/DriverApplicationService.php` - Change deletion logic
- `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDriverRepository.php` - Query changes
- `app/Http/Controllers/User/DriverController.php` - May need status filter param
- Various queries fetching results/standings data

### Frontend - App Dashboard
- `resources/app/js/views/LeagueDrivers.vue` - Add status filter
- `resources/app/js/views/season/DriversView.vue` - Add status filter (per plan)
- `resources/app/js/composables/useLeagueDrivers.ts` - Handle status filter
- `resources/app/js/stores/driverStore.ts` - Status filter state
- `resources/app/js/services/driverService.ts` - API parameter

### Frontend - Public Site
- Verify standings components show deleted drivers
- Verify race result components show deleted drivers

### Frontend - Admin
- May already be correct, but verify

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Historical data disappears | Thorough testing of all views showing drivers |
| Performance impact of `withTrashed` | Use indexes, test query performance |
| Confusion about "deleted" vs "removed" | Clear UI labels and documentation |
| Existing tests may fail | Update tests alongside code changes |

## Questions to Resolve

1. ✅ Should the driver status filter default to "Active" or "All"? → **Active**
2. ✅ What label to use: "Deleted" vs "Inactive" vs "Removed"? → **Deleted** (per plan)
3. ✅ Should users be able to "restore" a deleted driver? → **Yes, in scope**
4. ✅ What happens if a deleted driver needs to be re-added? → Use "Restore" action to clear `deleted_at`

## Agents to Use

| Agent | Purpose |
|-------|---------|
| `dev-be` | Backend changes (repositories, services, controllers, routes) - delete + restore |
| `dev-fe-app` | App dashboard frontend (driver views, stores, services) - delete + restore UI |
| `dev-fe-public` | Public site verification (standings, results display) |
| `dev-fe-admin` | Admin dashboard verification |
