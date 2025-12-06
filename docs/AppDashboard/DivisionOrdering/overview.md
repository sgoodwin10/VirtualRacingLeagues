# Division Ordering Feature - Overview

## Feature Summary

Add the ability to order divisions within a season, with drag-and-drop reordering in the UI. Division order will be respected everywhere divisions are displayed (tabs, tables, dropdowns, etc.).

## User Requirements

1. **Auto-assign order on creation** - When a new division is created, it automatically gets the next available order number
2. **Renumber on delete** - When a division is deleted, remaining divisions are renumbered to close gaps (e.g., 1,2,4 becomes 1,2,3)
3. **Drag-and-drop reordering** - Users can drag divisions to reorder them in the DivisionsPanel
4. **Optimistic UI updates** - UI updates immediately on drag, with rollback on API error
5. **Consistent ordering** - All components displaying divisions must respect the order

## Technical Overview

### Database Changes
- Add `order` column to `divisions` table (UNSIGNED INT, NOT NULL, DEFAULT 0)
- Add composite index on (season_id, order) for efficient ordered queries

### API Changes
- **GET /api/seasons/{season}/divisions** - Returns divisions ordered by `order` ASC
- **POST /api/seasons/{season}/divisions** - Auto-assigns next order number
- **DELETE /api/seasons/{season}/divisions/{division}** - Renumbers remaining divisions
- **PUT /api/seasons/{season}/divisions/reorder** - Bulk update division order

### Component Changes
- **DivisionsPanel** - Add drag-and-drop reordering with PrimeVue DataTable
- **Division Store** - Add `sortedDivisions` computed getter and `reorderDivisions` action
- **All division consumers** - Use sorted divisions from store

## Implementation Order

### Phase 1: Backend Foundation
1. Create migration for `order` column
2. Update Division entity with order property
3. Update repository to return ordered divisions
4. Update application service for auto-assign and renumber logic

### Phase 2: Backend API
5. Update DTOs to include order
6. Create ReorderDivisionsData DTO
7. Add reorder endpoint to controller
8. Add route

### Phase 3: Backend Tests
9. Unit tests for domain
10. Feature tests for API endpoints

### Phase 4: Frontend Foundation
11. Update Division type with order field
12. Add reorderDivisions service function
13. Update store with sortedDivisions getter and reorderDivisions action

### Phase 5: Frontend UI
14. Update DivisionsPanel with drag-and-drop
15. Verify other components use sorted divisions

### Phase 6: Frontend Tests
16. Store unit tests
17. Component tests

## Detailed Plans

- **[Backend Implementation Plan](./backend.md)** - Full Laravel/DDD implementation details
- **[Frontend Implementation Plan](./frontend.md)** - Full Vue.js/PrimeVue implementation details

## Affected Files

### Backend
| File | Change Type |
|------|-------------|
| `database/migrations/xxxx_add_order_to_divisions_table.php` | New |
| `app/Domain/Division/Entities/Division.php` | Modify |
| `app/Domain/Division/Events/DivisionReordered.php` | New |
| `app/Domain/Division/Repositories/DivisionRepositoryInterface.php` | Modify |
| `app/Infrastructure/Persistence/Eloquent/Models/Division.php` | Modify |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDivisionRepository.php` | Modify |
| `app/Application/Division/DTOs/DivisionData.php` | Modify |
| `app/Application/Division/DTOs/ReorderDivisionsData.php` | New |
| `app/Application/Division/Services/DivisionApplicationService.php` | Modify |
| `app/Http/Controllers/User/DivisionController.php` | Modify |
| `routes/subdomain.php` | Modify |
| `tests/Unit/Domain/Division/Entities/DivisionTest.php` | Modify |
| `tests/Feature/User/DivisionTest.php` | Modify |

### Frontend
| File | Change Type |
|------|-------------|
| `resources/app/js/types/division.ts` | Modify |
| `resources/app/js/services/divisionService.ts` | Modify |
| `resources/app/js/stores/divisionStore.ts` | Modify |
| `resources/app/js/components/season/divisions/DivisionsPanel.vue` | Modify |
| `resources/app/js/stores/__tests__/divisionStore.test.ts` | Modify |
| `resources/app/js/components/season/divisions/__tests__/DivisionsPanel.test.ts` | Modify |

## Dependencies

- No new npm packages required (PrimeVue DataTable supports row reorder natively)
- No new composer packages required

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Concurrent reorder requests | Backend uses database transaction with row locking |
| Lost order on API failure | Optimistic update with rollback pattern in store |
| Performance with many divisions | Bulk update in single query, indexed column |

## Acceptance Criteria

1. [ ] New divisions are automatically assigned the next order number
2. [ ] Divisions are displayed in order everywhere in the app
3. [ ] Users can drag and drop to reorder divisions
4. [ ] UI updates immediately during drag (optimistic update)
5. [ ] Error toast shown and order reverted if API fails
6. [ ] Deleting a division renumbers remaining divisions
7. [ ] All existing division functionality continues to work
8. [ ] Unit and feature tests pass
