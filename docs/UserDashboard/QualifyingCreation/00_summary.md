# Qualifying Session Support - Implementation Plan Summary

**Feature**: Add qualifying session support to rounds in the racing league management system

**Date**: 2025-10-25

**Status**: 📋 Planning Complete - Ready for Implementation

---

## 📚 Documentation Index

1. **[00_summary.md](./00_summary.md)** (this document) - High-level overview and architectural decisions
2. **[backend-plan.md](./backend-plan.md)** - Complete backend implementation guide (DDD architecture)
3. **[frontend-plan.md](./frontend-plan.md)** - Complete frontend implementation guide (Vue 3 + PrimeVue)

---

## 🎯 Feature Overview

### What We're Building

Add the ability for league administrators to create **qualifying sessions** for rounds, separate from races. Each round can have one optional qualifier that determines the starting grid for subsequent races.

### Current State

- ✅ Rounds can contain multiple races
- ✅ Races have comprehensive configuration (qualifying format, grid source, points, bonuses, etc.)
- ✅ UI shows rounds in accordion with races listed inside

### Target State

- ✅ Rounds can have ONE optional qualifier
- ✅ Qualifiers appear above races with distinct styling
- ✅ Qualifiers have qualifying-specific configuration (pole bonus only, no race length, etc.)
- ✅ Races can reference qualifier results for grid determination
- ✅ Clear visual distinction between qualifiers and races

---

## 🏗️ Architectural Decisions

### Backend Architecture: Single Table Inheritance

**Decision**: Use the existing `races` table with an `is_qualifier` boolean discriminator

**Rationale**:
- 80% field overlap between races and qualifiers (platform settings, penalties, divisions)
- Maintains foreign key integrity for grid_source references
- Simpler queries for retrieving all sessions for a round
- Avoids data duplication and migration complexity

**Trade-off**: Some race-specific fields will be NULL for qualifiers (acceptable)

### Frontend Architecture: Component Reuse

**Decision**: Reuse `RaceFormDrawer.vue` with a `raceType` prop instead of creating separate component

**Rationale**:
- 90% code overlap in form sections
- Easier maintenance (single source of truth)
- Consistent UI/UX patterns
- Conditional rendering is simpler than component duplication

**Trade-off**: Slightly more complex props and conditional logic (acceptable)

### API Design: Separate Endpoints

**Decision**: Create dedicated qualifier endpoints separate from race endpoints

**Rationale**:
- Clear API semantics: `/rounds/{id}/qualifier` vs `/rounds/{id}/races`
- Different DTOs and validation rules
- Better API documentation and discoverability
- Prevents accidental race/qualifier mixups

**Trade-off**: More controller code (acceptable for clarity)

---

## 🔑 Key Differentiators: Qualifier vs Race

| Aspect | Qualifier | Race |
|--------|-----------|------|
| **Purpose** | Determine starting grid | Award championship points |
| **Per Round** | Maximum 1 | Multiple (1, 2, 3...) |
| **Numbering** | Always 0 or NULL | 1, 2, 3... |
| **Qualifying** | Has qualifying session | References grid source |
| **Grid Source** | N/A (qualifiers create grids) | Required (qualifying/previous race/manual) |
| **Race Length** | N/A (no race) | Required (laps or time) |
| **Points System** | None | Full position-based system |
| **Pole Bonus** | ✅ **Yes** (primary bonus) | ❌ No (would double-count) |
| **Fastest Lap Bonus** | ❌ No (no race laps) | ✅ **Yes** |
| **DNF/DNS Points** | ❌ No | ✅ Yes |
| **Race Type** | N/A | Sprint/Feature/Endurance |
| **Platform Settings** | ✅ Yes | ✅ Yes |
| **Penalties** | ✅ Yes | ✅ Yes |
| **Divisions** | ✅ Yes | ✅ Yes |

---

## 📊 Database Schema Changes

### Migration: Add `is_qualifier` Column

```sql
ALTER TABLE races ADD COLUMN is_qualifier BOOLEAN DEFAULT FALSE AFTER race_type;
ALTER TABLE races MODIFY COLUMN race_number INTEGER UNSIGNED NULL;
CREATE INDEX idx_races_round_qualifier ON races(round_id, is_qualifier);
```

### Constraint: One Qualifier Per Round

```sql
-- Unique constraint: only one qualifier allowed per round
CREATE UNIQUE INDEX idx_races_round_qualifier_unique
ON races(round_id, is_qualifier)
WHERE is_qualifier = TRUE;
```

**Note**: This is a PostgreSQL/MySQL 8.0+ partial unique index. For older MySQL versions, enforce in application layer.

---

## 🎨 User Experience

### Qualifier Display (Blue Theme)

```
┌─────────────────────────────────────────────────┐
│ 🏁 Qualifying Session                           │
│ Standard Qualifying • 15 minutes                │
│ [Edit] [Delete]                                 │
└─────────────────────────────────────────────────┘
```

### Race Display (Gray Theme)

```
┌─────────────────────────────────────────────────┐
│ 🏎️ Race 1 - Sprint Race                        │
│ 20 laps • Grid: Qualifying                     │
│ [Edit] [Delete]                                 │
└─────────────────────────────────────────────────┘
```

### User Flow

1. **Create Qualifier**: Click "Add Qualifier" button → Form opens with qualifier-specific fields
2. **Edit Qualifier**: Click edit icon on qualifier card → Form pre-populated
3. **Delete Qualifier**: Click delete icon → Confirmation dialog → Deletion
4. **Create Race**: Click "Add Race" button → Form opens (pole bonus hidden)
5. **Grid Source**: When creating race, "Qualifying" option references the qualifier

---

## 🔐 Business Rules Enforced

### Domain Layer (Entity Validation)

1. ✅ **One qualifier per round** - Cannot create if one exists
2. ✅ **Pole bonus only** - Fastest lap bonus rejected for qualifiers
3. ✅ **Qualifying length required** - Must be positive integer
4. ✅ **No race type** - Race type must be NULL
5. ✅ **No grid source** - Grid source must be NULL
6. ✅ **No mandatory pit stops** - Pit stops not applicable
7. ✅ **No race length** - Length type/value must be NULL

### Application Layer (Service Validation)

1. ✅ **Round exists** - Validate round_id exists before creation
2. ✅ **Platform exists** - Validate platform_id for settings
3. ✅ **Transaction integrity** - Create/update/delete in transactions
4. ✅ **Event dispatching** - Dispatch domain events for auditing

### Interface Layer (Request Validation)

1. ✅ **Authentication** - User must be authenticated
2. ✅ **Authorization** - User must own the league/season
3. ✅ **DTO validation** - Type checking, range validation
4. ✅ **Error responses** - Clear 422 validation error messages

---

## 🧪 Testing Strategy

### Backend Testing

**Unit Tests** (Domain Layer - No Database)
- ✅ Qualifier entity creation with valid data
- ✅ Qualifier entity rejects invalid configurations
- ✅ Bonus points validation (pole only)
- ✅ Domain events are recorded

**Feature Tests** (API Endpoints - With Database)
- ✅ POST `/api/rounds/{id}/qualifier` creates qualifier
- ✅ GET `/api/rounds/{id}/qualifier` retrieves qualifier
- ✅ PUT `/api/qualifiers/{id}` updates qualifier
- ✅ DELETE `/api/qualifiers/{id}` removes qualifier
- ✅ One-per-round constraint enforced
- ✅ 404 when qualifier not found
- ✅ 422 on validation errors
- ✅ 401 on unauthenticated requests

### Frontend Testing

**Component Tests** (Vitest + Vue Test Utils)
- ✅ QualifierListItem renders correctly
- ✅ RaceFormDrawer shows pole bonus for qualifiers
- ✅ RaceFormDrawer hides pole bonus for races
- ✅ RoundsPanel displays qualifier above races
- ✅ Add Qualifier button appears when no qualifier exists
- ✅ Add Qualifier button hidden when qualifier exists

**Integration Tests** (E2E with Playwright)
- ✅ Complete qualifier creation flow
- ✅ Edit qualifier and verify changes persist
- ✅ Delete qualifier confirmation and removal
- ✅ Create race after qualifier and use qualifying grid
- ✅ Validation errors display correctly

---

## 📅 Implementation Timeline

### **Phase 1: Backend Foundation** (3-4 hours)

1. Create migration for `is_qualifier` column
2. Update Eloquent `Race` model with scopes
3. Enhance `Race` entity with qualifier factory methods
4. Create domain events and exceptions
5. Write unit tests for domain layer

### **Phase 2: Backend Services** (2-3 hours)

6. Create `CreateQualifierData`, `UpdateQualifierData`, `QualifierData` DTOs
7. Create `QualifierApplicationService` with CRUD methods
8. Update `EloquentRaceRepository` with qualifier methods
9. Write repository tests

### **Phase 3: Backend API** (2 hours)

10. Create `QualifierController` with thin controllers
11. Add API routes in `routes/subdomain.php`
12. Write feature tests for all endpoints
13. Test with Postman/Insomnia

### **Phase 4: Frontend Types** (1 hour)

14. Update `/var/www/resources/app/js/types/race.ts`
15. Add `is_qualifier` field to interfaces
16. Create helper functions for type guards

### **Phase 5: Frontend Components** (4-5 hours)

17. Create `QualifierListItem.vue` component
18. Modify `RaceFormDrawer.vue` with `raceType` prop
19. Update `RoundsPanel.vue` with qualifier section
20. Modify `useRaceValidation.ts` composable
21. Write component tests

### **Phase 6: Integration Testing** (2 hours)

22. Test end-to-end qualifier creation flow
23. Test race creation with qualifying grid source
24. Test validation and error handling
25. Test on different screen sizes

### **Phase 7: Polish & Documentation** (1 hour)

26. Code review and refactoring
27. Update user documentation
28. Add code comments where necessary
29. Update CHANGELOG

---

## ✅ Success Criteria

### Functionality

- [ ] Users can create one qualifier per round
- [ ] Qualifier form shows pole bonus only (not fastest lap)
- [ ] Race form shows fastest lap bonus only (not pole)
- [ ] Qualifier appears above races with blue styling
- [ ] Editing and deleting qualifiers works correctly
- [ ] One-per-round constraint enforced (backend + UI)
- [ ] Grid source "Qualifying" references the qualifier

### Quality

- [ ] All backend unit tests pass (PHPStan level 8)
- [ ] All backend feature tests pass (100% endpoint coverage)
- [ ] All frontend component tests pass
- [ ] TypeScript type checking passes (strict mode)
- [ ] No console errors or warnings
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility: keyboard navigation, screen readers

### Performance

- [ ] Qualifier queries use proper indexes
- [ ] Form loads in <100ms
- [ ] Save operations complete in <500ms
- [ ] No N+1 query issues

---

## 🚀 Prerequisites

### Backend

- [ ] Laravel 12 installed and configured
- [ ] Database migrations up to date
- [ ] PHPUnit installed
- [ ] PHPStan configured (level 8)

### Frontend

- [ ] Node.js 22.x installed
- [ ] npm packages installed (`npm install`)
- [ ] Vite dev server running (`npm run dev`)
- [ ] Vitest configured

### Knowledge

- [ ] Familiarity with Domain-Driven Design (DDD)
- [ ] Understanding of Value Objects and Entities
- [ ] Experience with Vue 3 Composition API
- [ ] Understanding of PrimeVue component library

---

## 📁 Files to Create

### Backend (8 files)

```
database/migrations/2025_10_25_XXXXXX_add_is_qualifier_to_races_table.php
app/Application/Competition/DTOs/CreateQualifierData.php
app/Application/Competition/DTOs/UpdateQualifierData.php
app/Application/Competition/DTOs/QualifierData.php
app/Application/Competition/Services/QualifierApplicationService.php
app/Domain/Competition/Events/QualifierCreated.php
app/Domain/Competition/Events/QualifierUpdated.php
app/Domain/Competition/Events/QualifierDeleted.php
app/Domain/Competition/Exceptions/QualifierNotFoundException.php
app/Domain/Competition/Exceptions/QualifierAlreadyExistsException.php
app/Domain/Competition/Exceptions/InvalidQualifierConfigurationException.php
app/Http/Controllers/User/QualifierController.php
tests/Unit/Domain/Competition/Entities/QualifierTest.php
tests/Feature/User/QualifierControllerTest.php
```

### Frontend (3 files)

```
resources/app/js/components/round/QualifierListItem.vue
resources/app/js/components/round/__tests__/QualifierListItem.test.ts
resources/app/js/services/qualifierService.ts (optional - can reuse raceService)
```

---

## 📁 Files to Modify

### Backend (5 files)

```
app/Infrastructure/Persistence/Eloquent/Models/Race.php
app/Domain/Competition/Entities/Race.php
app/Domain/Competition/Repositories/RaceRepositoryInterface.php
app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceRepository.php
routes/subdomain.php
```

### Frontend (5 files)

```
resources/app/js/types/race.ts
resources/app/js/components/round/modals/RaceFormDrawer.vue
resources/app/js/components/round/RoundsPanel.vue
resources/app/js/composables/useRaceValidation.ts
resources/app/js/stores/raceStore.ts (optional)
```

---

## 🔗 Related Documentation

- [Backend Implementation Plan](./backend-plan.md) - Complete DDD architecture guide
- [Frontend Implementation Plan](./frontend-plan.md) - Complete Vue 3 component guide
- [DDD Architecture Overview](../../.claude/guides/backend/ddd-overview.md)
- [Admin Dashboard Development Guide](../../.claude/guides/frontend/admin-dashboard-development-guide.md)

---

## 🤝 Team Coordination

### Backend Developer Responsibilities

1. Implement database migration
2. Create domain layer (entities, events, exceptions)
3. Create application layer (DTOs, service)
4. Update infrastructure layer (repository)
5. Create interface layer (controller, routes)
6. Write comprehensive tests
7. Provide API documentation for frontend team

### Frontend Developer Responsibilities

1. Update TypeScript types
2. Create QualifierListItem component
3. Modify RaceFormDrawer with raceType prop
4. Update RoundsPanel with qualifier section
5. Update validation composable
6. Write component tests
7. Integrate with backend API

### Communication Points

- **API Contract**: Ensure DTO structures match frontend expectations
- **Field Names**: Use snake_case in API, camelCase in frontend
- **Error Handling**: Backend provides clear 422 validation messages
- **Testing**: Both teams test integration points together

---

## ⚠️ Risks & Mitigations

### Risk: One-per-round constraint not enforced

**Mitigation**:
- Database-level unique index (best)
- Repository-level check before insert
- UI disables button when qualifier exists
- API returns 422 if duplicate attempted

### Risk: Qualifier deletion affects races

**Mitigation**:
- Show warning if races reference qualifier grid
- Consider soft deletes for audit trail
- Update races to use "manual" grid source if qualifier deleted

### Risk: Bonus points confusion

**Mitigation**:
- Clear UI labels: "Pole Position Bonus (awarded in qualifying)"
- Conditional rendering: pole for qualifiers only, fastest lap for races only
- Backend validation: reject fastest lap bonus for qualifiers

### Risk: Field mapping inconsistency

**Mitigation**:
- Clear field mapping table in documentation
- DTO validation enforces NULL for race-specific fields
- Frontend sends correct fields based on `is_qualifier`

---

## 🎓 Learning Resources

### Domain-Driven Design

- [DDD Reference by Eric Evans](https://www.domainlanguage.com/ddd/reference/)
- [Implementing DDD by Vaughn Vernon](https://vaughnvernon.co/)

### Laravel DDD Patterns

- [Spatie Laravel Data Docs](https://spatie.be/docs/laravel-data)
- [Laravel Events & Listeners](https://laravel.com/docs/12.x/events)

### Vue 3 Composition API

- [Vue 3 Composition API Docs](https://vuejs.org/guide/extras/composition-api-faq.html)
- [PrimeVue 4 Documentation](https://primevue.org/introduction/)

---

## 📞 Support & Questions

### Backend Questions

- Review [backend-plan.md](./backend-plan.md)
- Check existing `Race` entity implementation
- Consult DDD architecture guide

### Frontend Questions

- Review [frontend-plan.md](./frontend-plan.md)
- Check existing `RaceFormDrawer.vue` component
- Consult admin dashboard development guide

### Integration Questions

- Review API contract in backend plan
- Check DTO → TypeScript type mapping
- Test with Postman before frontend integration

---

## 🎉 Next Steps

1. **Read this summary** to understand the big picture
2. **Review backend-plan.md** if implementing backend
3. **Review frontend-plan.md** if implementing frontend
4. **Set up development environment** with prerequisites
5. **Start with Phase 1** (backend foundation)
6. **Coordinate with team** at integration points
7. **Test thoroughly** at each phase
8. **Celebrate** when all success criteria are met! 🎊

---

**Last Updated**: 2025-10-25
**Reviewed By**: dev-be agent, dev-fe-user agent
**Status**: ✅ Planning Complete - Ready for Implementation
