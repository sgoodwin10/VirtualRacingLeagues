# Competition Creation - Implementation Plan v2

**Version**: 2.0
**Date**: January 2025
**Status**: Ready for Implementation
**Estimated Timeline**: 4 days backend + 2.5 weeks frontend = **3 weeks total**

---

## 📋 Executive Summary

This document outlines the streamlined implementation plan for the Competition Creation feature. This version balances comprehensive functionality with practical development timelines, incorporating lessons learned from the v1 planning phase.

### What Changed from v1

**Kept (High Value)**:
- ✅ `useLeaguePlatforms` composable (will be reused across features)
- ✅ Name change confirmation dialog (protects users from breaking URLs)
- ✅ 2-step delete with archive suggestion (encourages data preservation)
- ✅ Slug preview/checking (better UX)

**Simplified (Lower ROI)**:
- ❌ Fancy success modal → Simple toast notification
- ❌ Character counters → Backend validation only
- ❌ Archive restore flow → Archive only (restore in v3)
- ❌ Complex empty states → Simple Card-based empty states

**Result**: ~30% reduction in complexity while maintaining core value.

---

## 🎯 Core Features

### Must Have (MVP)

1. **Competition CRUD**
   - Create competition (name, platform, description, logo)
   - Edit competition (name, description, logo - platform locked)
   - Delete competition (2-step: suggest archive → confirm delete)
   - Archive competition (soft delete, preserve data)

2. **Platform Management**
   - Filter platforms to league's enabled platforms
   - Lock platform after creation (immutable)
   - Reusable `useLeaguePlatforms` composable

3. **Slug Management**
   - Auto-generate from name
   - Check availability in real-time
   - Show preview during creation
   - Warn on name change (breaks URLs)

4. **Authorization**
   - League owner only (v1)
   - Backend enforcement + frontend UI hiding

5. **Display & Navigation**
   - List view (grid of cards)
   - Detail view (header + tabs structure)
   - Empty states (simple)

### Deferred to v3

- Archive restore functionality
- Competition templates
- Competition cloning
- Advanced filtering/search
- Bulk operations
- Manager role support

---

## 🗺️ Architecture Decisions

### Backend (DDD Architecture)

**Domain Layer** (Pure PHP):
```
app/Domain/Competition/
├── Entities/Competition.php
├── ValueObjects/
│   ├── CompetitionName.php
│   ├── CompetitionSlug.php
│   └── CompetitionStatus.php (active|archived)
├── Events/
│   ├── CompetitionCreated.php
│   ├── CompetitionUpdated.php
│   ├── CompetitionArchived.php
│   └── CompetitionDeleted.php
├── Exceptions/ (6 exceptions)
└── Repositories/CompetitionRepositoryInterface.php
```

**Application Layer** (Use Cases):
```
app/Application/Competition/
├── Services/CompetitionApplicationService.php
└── DTOs/
    ├── CreateCompetitionData.php
    ├── UpdateCompetitionData.php
    ├── CompetitionData.php (output)
    └── CompetitionListData.php (lightweight)
```

**Infrastructure Layer** (Persistence):
```
app/Infrastructure/Persistence/Eloquent/
├── Models/Competition.php (anemic)
└── Repositories/EloquentCompetitionRepository.php
```

**Interface Layer** (HTTP):
```
app/Http/
├── Controllers/User/CompetitionController.php (thin)
└── Requests/User/
    ├── CreateCompetitionRequest.php
    └── UpdateCompetitionRequest.php
```

### Frontend (Vue 3 + TypeScript)

**Core Architecture**:
```
resources/user/js/
├── types/competition.ts
├── services/competitionService.ts
├── stores/competitionStore.ts
├── composables/
│   ├── useLeaguePlatforms.ts (REUSABLE)
│   └── useCompetitionValidation.ts
├── components/competition/
│   ├── CompetitionFormDrawer.vue
│   ├── CompetitionCard.vue
│   ├── CompetitionList.vue
│   ├── CompetitionDeleteDialog.vue (2-step)
│   ├── CompetitionHeader.vue
│   ├── CompetitionSettings.vue
│   └── __tests__/
└── views/
    └── CompetitionDetail.vue
```

**Component Count**: 8 components (down from 15+ in v1)

---

## 🔑 Key Design Decisions

### 1. Platform Filtering - Composable Pattern

**Decision**: Create reusable `useLeaguePlatforms` composable

**Why**: Will be used in:
- Competition creation
- Driver management (existing - refactor)
- Season creation (future)
- Race setup (future)

**Implementation**:
```typescript
// Extract league's enabled platforms
const { platformOptions } = useLeaguePlatforms(leagueId);
```

### 2. Slug Management - Preview & Check

**Decision**: Show slug preview during creation, check availability on blur

**Why**:
- Helps users understand URL structure
- Prevents slug conflicts before submission
- Better UX than post-submit error

**Implementation**:
- Input name → Debounced check (500ms)
- Display: `URL: /leagues/my-league/competitions/[slug-preview]`
- Status: ✓ Available | ⚠️ Taken (will use: slug-02)

### 3. Name Change Warning - Confirmation Dialog

**Decision**: Show confirmation dialog when name changes in edit mode

**Why**:
- Changing name breaks existing URLs/bookmarks
- Backend regenerates slug automatically
- Users need explicit warning before proceeding

**Implementation**:
```
⚠️ Update Competition Name?

Changing the name will update the public URL:
  Old: /leagues/my-league/competitions/old-name
  New: /leagues/my-league/competitions/new-name

Existing bookmarks and shared links will break.

[ Cancel ]  [ Continue ]
```

### 4. Delete Flow - 2-Step Process

**Decision**: Two-step delete with archive suggestion

**Step 1 - Suggest Archive**:
```
Consider Archiving Instead

Archiving preserves your data and can be reviewed later.

🗄️ Archive              🗑️ Delete
✓ Keeps all data       ✗ Permanent removal
✓ Hidden from lists    ✗ Cannot undo
✓ Can export later     ✗ All data lost

[ Archive Competition ]  [ Continue to Delete → ]
```

**Step 2 - Confirm Delete** (if user clicks "Continue to Delete"):
```
⚠️ PERMANENT DELETION

Type "DELETE" to confirm:
[________________]

[ Cancel ]  [ Delete Competition ]
```

**Why**:
- Encourages data preservation
- Reduces accidental deletions
- Aligns with subscription model (future: unlimited archived)

### 5. Success Notification - Simple Toast

**Decision**: Show toast notification instead of modal

**Why**:
- Non-intrusive
- Consistent with other operations
- Faster workflow (no modal dismiss needed)

**Implementation**:
```typescript
toast.add({
  severity: 'success',
  summary: 'Competition Created!',
  detail: 'You can now create seasons for this competition.',
  life: 5000
});
```

### 6. Archive - No Restore in v2

**Decision**: Support archiving but not restoring (yet)

**Why**:
- Archive is critical (data preservation)
- Restore is nice-to-have (rare use case)
- Reduces scope by ~2 days

**Implementation**:
- Archive button functional
- "This competition is archived" banner
- Restore button grayed out with tooltip: "Restore coming in next update"
- Backend restore endpoint still implemented (just not exposed in UI)

### 7. Empty States - Simple

**Decision**: Basic Card with icon + text + button

**Why**:
- Faster to implement
- Still effective
- Consistent with existing patterns

**Implementation**:
```vue
<Card>
  <template #content>
    <div class="text-center py-8">
      <i class="pi pi-flag text-6xl text-gray-400 mb-4"></i>
      <h3 class="text-xl font-semibold mb-2">No Competitions Yet</h3>
      <p class="text-gray-600 mb-4">
        Create your first competition to start organizing races.
      </p>
      <Button label="Create Competition" @click="create" />
    </div>
  </template>
</Card>
```

---

## 📊 Database Schema

### `competitions` Table

```sql
CREATE TABLE competitions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    -- Foreign Keys
    league_id BIGINT UNSIGNED NOT NULL,
    platform_id BIGINT UNSIGNED NOT NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,

    -- Core Fields
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT NULL,
    logo_path VARCHAR(255) NULL,

    -- Status
    status ENUM('active', 'archived') DEFAULT 'active',
    archived_at TIMESTAMP NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    -- Constraints
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Indexes
    UNIQUE KEY unique_league_slug (league_id, slug),
    KEY idx_league_id (league_id),
    KEY idx_platform_id (platform_id),
    KEY idx_status (status),
    KEY idx_created_by (created_by_user_id)
);
```

**Key Points**:
- Slug unique per league (not global)
- CASCADE on league delete
- RESTRICT on platform delete
- Soft deletes support

---

## 🔌 API Endpoints

### Base URL
```
http://app.virtualracingleagues.localhost/api
```

### Endpoints (8 total)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/leagues/{leagueId}/competitions` | List competitions |
| POST | `/leagues/{leagueId}/competitions` | Create competition |
| POST | `/leagues/{leagueId}/competitions/check-slug` | Check slug availability |
| GET | `/competitions/{id}` | Show competition |
| PUT | `/competitions/{id}` | Update competition |
| POST | `/competitions/{id}/archive` | Archive competition |
| DELETE | `/competitions/{id}` | Delete competition |
| GET | `/competitions/{id}/stats` | Get statistics (future) |

**Authentication**: All endpoints require `auth:web` + `user.authenticate` middleware

**Authorization**: League owner only (checked in application service)

---

## 📅 Implementation Timeline

### Backend (4 Days)

**Day 1: Domain Layer**
- Value Objects (Name, Slug, Status)
- Exceptions (6 types)
- Events (4 types)
- Competition Entity
- Repository Interface
- ✅ Checkpoint: 100% domain tests pass

**Day 2: Application Layer**
- DTOs (Create, Update, Output, List)
- Application Service (8 methods)
- Logo fallback logic
- Slug generation helper
- ✅ Checkpoint: Service compiles, PHPStan passes

**Day 3: Infrastructure Layer**
- Migration
- Eloquent Model
- Repository Implementation
- Factory
- Service Provider binding
- ✅ Checkpoint: Integration tests pass

**Day 4: Interface Layer + QA**
- Controller (8 methods, thin)
- Form Requests
- Routes
- Feature Tests
- ✅ Checkpoint: All endpoints work via Postman

### Frontend (2.5 Weeks)

**Week 1: Foundation (Days 1-3)**
- Day 1: Types + Service Layer
- Day 2: Store + Composables (useLeaguePlatforms, useCompetitionValidation)
- Day 3: CompetitionFormDrawer (create/edit)
- ✅ Checkpoint: Can create/edit via drawer

**Week 1-2: Core Components (Days 4-7)**
- Day 4: CompetitionCard + CompetitionList
- Day 5: CompetitionDeleteDialog (2-step)
- Day 6: Update LeagueDetail.vue (add Competitions tab)
- Day 7: Integration + testing
- ✅ Checkpoint: Full CRUD working from league page

**Week 2-3: Detail View (Days 8-12)**
- Day 8: CompetitionDetail view structure
- Day 9: CompetitionHeader
- Day 10: CompetitionSettings (archive/delete)
- Day 11: Empty states + polish
- Day 12: E2E testing + bug fixes
- ✅ Checkpoint: Complete flow working

**Buffer**: 0.5 week for unforeseen issues

---

## ✅ Success Criteria

### Backend Complete When:
- ✅ All 8 API endpoints functional
- ✅ PHPStan Level 8 passes
- ✅ PSR-12 compliant
- ✅ 100% domain layer test coverage
- ✅ All feature tests pass
- ✅ Slug generation works correctly
- ✅ Platform validation enforced
- ✅ Logo fallback logic working

### Frontend Complete When:
- ✅ Can create competition (with slug preview)
- ✅ Can edit competition (with name change warning)
- ✅ Can delete competition (2-step process)
- ✅ Can archive competition
- ✅ List view displays correctly
- ✅ Detail view displays correctly
- ✅ Platform locked after creation
- ✅ All TypeScript errors resolved
- ✅ 80%+ test coverage
- ✅ Manual testing complete

---

## 🧪 Testing Strategy

### Backend Tests

**Unit Tests** (Domain Layer):
- `CompetitionTest.php` (entity logic)
- `CompetitionNameTest.php` (3-100 chars)
- `CompetitionSlugTest.php` (generation)
- `CompetitionStatusTest.php` (enum)
- Target: 100% coverage

**Integration Tests** (Repository):
- `EloquentCompetitionRepositoryTest.php`
- Test all CRUD operations
- Test slug uniqueness per league
- Test cascade deletion

**Feature Tests** (HTTP):
- `CompetitionControllerTest.php`
- Test all 8 endpoints
- Test authorization (owner only)
- Test validation rules
- Test error responses

### Frontend Tests

**Unit Tests** (Stores/Services):
- `competitionStore.test.ts`
- `competitionService.test.ts`
- `useLeaguePlatforms.test.ts`
- `useCompetitionValidation.test.ts`

**Component Tests**:
- `CompetitionFormDrawer.test.ts`
- `CompetitionCard.test.ts`
- `CompetitionList.test.ts`
- `CompetitionDeleteDialog.test.ts`

**E2E Tests** (Playwright):
- Create competition flow
- Edit competition flow
- Delete competition flow
- Archive competition flow

---

## 🚨 Risk Mitigation

### High Risk Items

**1. Platform Composable Refactoring**
- **Risk**: Breaking existing Driver management
- **Mitigation**: Create composable first, test thoroughly, then refactor Driver table

**2. Slug Generation Edge Cases**
- **Risk**: Slug conflicts, special characters
- **Mitigation**: Extensive unit tests, copy logic from League implementation

**3. Name Change Flow**
- **Risk**: Users confused about URL changes
- **Mitigation**: Clear warnings, confirmation dialog, helpful messaging

**4. Image Upload**
- **Risk**: File size limits, format issues
- **Mitigation**: Reuse existing ImageUpload component, backend validation

### Medium Risk Items

**5. Delete vs Archive UX**
- **Risk**: Users delete when they should archive
- **Mitigation**: 2-step process with clear recommendation

**6. Backend Authorization**
- **Risk**: Non-owners accessing endpoints
- **Mitigation**: Check in application service, feature tests verify

---

## 📦 Dependencies

### External
- Laravel 12
- Vue 3
- PrimeVue 4
- Pinia
- TypeScript
- Vitest

### Internal (Already Exist)
- League management ✅
- Platform table ✅
- User authentication ✅
- Driver management (will refactor for composable)
- ImageUpload component ✅
- Form components ✅

---

## 🔄 v3 Roadmap (Future)

Features deferred from v2:

1. **Archive Restore** (1 day)
   - UI button + confirmation
   - Update store action

2. **Competition Templates** (2 days)
   - Pre-configured settings
   - GT3, Sprint, Endurance templates

3. **Manager Role Support** (3 days)
   - Authorization extension
   - Permission checks

4. **Advanced Filtering** (2 days)
   - Filter by platform
   - Filter by status
   - Search by name

5. **Competition Cloning** (2 days)
   - Duplicate structure
   - Reset statistics

6. **Subscription Limits** (1 day)
   - Check active competition count
   - Enforce tier limits
   - Upgrade prompts

---

## 📝 Notes for Developers

### Backend
- Follow existing DDD patterns from League/Driver
- Keep controllers thin (3-5 lines per method)
- Entity business logic, NOT in controllers
- Use transactions for mutations
- Return DTOs, never entities

### Frontend
- Match DriverFormDialog and LeagueWizardDrawer patterns
- Use Composition API (`<script setup lang="ts">`)
- Reuse existing form components
- Keep components focused (single responsibility)
- Test with mock data first

### Common Pitfalls
- ❌ Don't allow platform changes after creation
- ❌ Don't forget slug uniqueness is per-league
- ❌ Don't skip name change warnings
- ❌ Don't allow editing archived competitions
- ❌ Don't forget logo fallback logic

---

## 📞 Questions During Implementation

If you encounter:
- **Architecture questions** → See 01_BACKEND_TASKS.md or 02_FRONTEND_TASKS.md
- **Business rules** → See original 03_DECISIONS.md
- **Component patterns** → Reference DriverFormDialog.vue or LeagueWizardDrawer.vue
- **Blocked/unclear** → Document in implementation notes, proceed with reasonable assumption

---

## Document Index

- `00_SUMMARY.md` ← You are here
- `01_BACKEND_TASKS.md` - Detailed backend implementation steps
- `02_FRONTEND_TASKS.md` - Detailed frontend implementation steps

---

**Status**: ✅ Ready for Implementation
**Next Step**: Begin backend Day 1 (Domain Layer)
**Estimated Completion**: 3 weeks from start date
