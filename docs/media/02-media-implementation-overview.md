# Media Management Implementation Overview

> **Document Version:** 1.0
> **Created:** December 2024
> **Status:** Implementation Plan
> **Parent Document:** [01-media-management-architecture-plan.md](./01-media-management-architecture-plan.md)

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope of Work](#2-scope-of-work)
3. [Implementation Phases](#3-implementation-phases)
4. [Agent Responsibilities](#4-agent-responsibilities)
5. [Dependencies & Order of Implementation](#5-dependencies--order-of-implementation)
6. [Testing Strategy](#6-testing-strategy)
7. [Risk Mitigation](#7-risk-mitigation)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Executive Summary

This document provides an implementation overview for the Media Management feature. The feature replaces the current inconsistent image handling with a centralized, DDD-compliant solution using Spatie Media Library v11.

### Key Deliverables

1. **Backend Foundation** - MediaServiceInterface, SpatieMediaService, MediaReference value object
2. **Entity Integration** - All 6 entities (League, Season, Competition, Team, Division, SiteConfig) migrated
3. **Frontend Updates** - Responsive image components, srcset support, lazy loading
4. **Data Migration** - Zero-downtime migration of existing images

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                          │
│  Controllers receive UploadedFile, pass to Application      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  Application Services use MediaServiceInterface             │
│  DTOs include media response structure                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  MediaReference value object (id, collection, conversions)  │
│  Pure PHP - no Laravel dependencies                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  SpatieMediaService implements MediaServiceInterface        │
│  Eloquent models implement HasMedia interface               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Scope of Work

### 2.1 Backend Scope

| Component | Location | Work Required |
|-----------|----------|---------------|
| Spatie Media Library | Package | Install and configure |
| MediaReference | `Domain/Shared/ValueObjects/` | New value object |
| MediaServiceInterface | `Application/Shared/Services/` | New interface |
| SpatieMediaService | `Infrastructure/Media/` | New implementation |
| HasMediaCollections trait | `Infrastructure/Persistence/Eloquent/Traits/` | New trait |
| LeagueEloquent | `Infrastructure/Persistence/Eloquent/Models/` | Add HasMedia |
| SeasonEloquent | Same | Add HasMedia |
| CompetitionEloquent | Same | Add HasMedia |
| TeamEloquent | Same | Add HasMedia |
| DivisionEloquent | Same | Add HasMedia |
| SiteConfigModel | Same | Add HasMedia |
| LeagueApplicationService | `Application/League/Services/` | Use MediaServiceInterface |
| SeasonApplicationService | `Application/Competition/Services/` | Use MediaServiceInterface |
| CompetitionApplicationService | Same | Use MediaServiceInterface |
| TeamApplicationService | `Application/Team/Services/` | Use MediaServiceInterface |
| All relevant DTOs | Various | Add media response structure |
| Migration command | `Console/Commands/` | Legacy data migration |

### 2.2 Frontend Scope

| Dashboard | Component | Work Required |
|-----------|-----------|---------------|
| App | ImageUpload.vue | Add srcset preview support |
| App | All image displays | Use `<picture>` or srcset |
| Admin | ImageUpload.vue | Same as App |
| Admin | All image displays | Use `<picture>` or srcset |
| Public | Image displays | Use srcset, lazy loading |
| All | New: ResponsiveImage.vue | Reusable responsive image component |

### 2.3 Out of Scope (Future Phases)

- CDN integration (CloudFlare R2)
- Video upload support
- PDF document management
- Image cropping UI
- AI-powered image tagging
- Media library browser UI

---

## 3. Implementation Phases

### Phase 1: Foundation (Backend)
**Estimated Tasks:** 8-10

1. Install Spatie Media Library package
2. Publish and configure migrations
3. Create MediaReference value object with unit tests
4. Create MediaServiceInterface
5. Create SpatieMediaService implementation
6. Create HasMediaCollections trait
7. Configure image conversions (thumb, small, medium, large, og)
8. Configure queue processing for async conversions
9. Register service binding in AppServiceProvider
10. Write integration tests for SpatieMediaService

### Phase 2: League Integration (Pilot)
**Estimated Tasks:** 6-8

1. Add HasMedia to LeagueEloquent model
2. Define league-specific media collections
3. Update LeagueApplicationService to use MediaServiceInterface
4. Update LeagueData DTO with media response structure
5. Update LeagueController (if needed)
6. Update frontend LeagueWizardDrawer for new response format
7. Update LeagueCard, LeagueHeader to use srcset
8. Write feature tests

### Phase 3: Remaining Entities (Backend + Frontend)
**Estimated Tasks:** 20-25

**Batch A (Competition + Season):**
- CompetitionEloquent - HasMedia
- SeasonEloquent - HasMedia
- CompetitionApplicationService updates
- SeasonApplicationService updates
- Frontend components for Competition/Season

**Batch B (Team + Division + SiteConfig):**
- TeamEloquent - HasMedia
- DivisionEloquent - HasMedia
- SiteConfigModel - HasMedia (replace SiteConfigFileModel approach)
- Application service updates
- Frontend components

### Phase 4: Data Migration
**Estimated Tasks:** 4-5

1. Create `media:migrate-legacy` artisan command
2. Implement dual-write during transition (feature flag)
3. Test migration in staging
4. Run production migration
5. Remove legacy file paths after validation

### Phase 5: Optimization & Polish
**Estimated Tasks:** 5-6

1. Add lazy loading to all images
2. Implement progressive loading/placeholders
3. Create shared ResponsiveImage component
4. Performance testing and benchmarking
5. Documentation updates

---

## 4. Agent Responsibilities

### 4.1 Backend Agent (`dev-be`)

**Primary Responsibilities:**
- Spatie Media Library installation and configuration
- All domain layer components (MediaReference value object)
- All application layer components (MediaServiceInterface, DTOs)
- All infrastructure layer components (SpatieMediaService, traits, model updates)
- Repository updates
- Migration commands
- Feature/unit tests

**Key Files to Create:**
```
app/
├── Domain/Shared/ValueObjects/MediaReference.php
├── Application/Shared/Services/MediaServiceInterface.php
├── Application/Shared/DTOs/MediaData.php (optional helper)
├── Infrastructure/Media/SpatieMediaService.php
└── Infrastructure/Persistence/Eloquent/Traits/HasMediaCollections.php
```

**Key Files to Modify:**
```
app/
├── Infrastructure/Persistence/Eloquent/Models/
│   ├── League.php
│   ├── SeasonEloquent.php
│   ├── Competition.php
│   ├── Team.php
│   ├── Division.php
│   └── SiteConfigModel.php
├── Application/*/Services/*ApplicationService.php
├── Application/*/DTOs/*.php
└── Providers/AppServiceProvider.php
```

### 4.2 App Dashboard Agent (`dev-fe-app`)

**Primary Responsibilities:**
- Update ImageUpload.vue component
- Create/update league components (LeagueWizardDrawer, LeagueCard, LeagueHeader)
- Update competition components
- Update season components
- Update team/division components
- Create shared ResponsiveImage component
- Type updates for new API response format

**Key Files to Create/Modify:**
```
resources/app/js/
├── components/
│   ├── common/forms/ImageUpload.vue (modify)
│   ├── common/ResponsiveImage.vue (new)
│   ├── league/modals/LeagueWizardDrawer.vue (modify)
│   ├── league/LeagueCard.vue (modify)
│   ├── league/partials/LeagueHeader.vue (modify)
│   ├── competition/*.vue (modify)
│   ├── season/*.vue (modify)
│   └── team/*.vue (modify)
├── types/
│   └── media.ts (new - shared media types)
└── services/
    └── leagueService.ts (update response handling)
```

### 4.3 Admin Dashboard Agent (`dev-fe-admin`)

**Primary Responsibilities:**
- Update admin ImageUpload.vue / FilePreview.vue
- Update SiteConfig file upload components
- Update league management views
- Update any other entity management views
- Ensure consistent image display

**Key Files to Create/Modify:**
```
resources/admin/js/
├── components/
│   ├── SiteConfig/FileUpload/*.vue (modify)
│   ├── League/LeaguesTable.vue (modify)
│   └── common/ResponsiveImage.vue (new)
└── types/
    └── media.ts (new)
```

### 4.4 Public Dashboard Agent (`dev-fe-public`)

**Primary Responsibilities:**
- Update public image displays
- Implement lazy loading
- Ensure WebP fallback for older browsers
- Update league/season display views

**Key Files to Create/Modify:**
```
resources/public/js/
├── components/
│   ├── common/ResponsiveImage.vue (new)
│   └── common/cards/VrlLeagueCard.vue (modify)
├── views/
│   └── leagues/*.vue (modify)
└── types/
    └── media.ts (new)
```

---

## 5. Dependencies & Order of Implementation

```
                    ┌─────────────────────┐
                    │  Phase 1: Backend   │
                    │     Foundation      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Phase 2: League    │
                    │  Backend + Frontend │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Competition   │  │     Season      │  │    SiteConfig   │
│   Integration   │  │   Integration   │  │   Integration   │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Phase 4: Data      │
                    │    Migration        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Phase 5: Polish    │
                    │  & Optimization     │
                    └─────────────────────┘
```

### Critical Path

1. **Backend Foundation MUST complete first** - All frontend work depends on the new API response format
2. **League is the pilot** - Learn and refine patterns before other entities
3. **Frontend can parallelize after League** - Once patterns are established, all three dashboards can work simultaneously
4. **Data migration after all integrations** - Only migrate when new system is stable

---

## 6. Testing Strategy

### 6.1 Backend Tests

| Test Type | Coverage |
|-----------|----------|
| Unit | MediaReference value object |
| Integration | SpatieMediaService (with fake storage) |
| Feature | Upload/delete/retrieve flows |
| Feature | Entity deletion cascades media |
| Feature | Migration command |

### 6.2 Frontend Tests

| Test Type | Coverage |
|-----------|----------|
| Unit (Vitest) | ResponsiveImage component |
| Unit (Vitest) | ImageUpload component |
| Component | Image display with srcset |
| E2E (Playwright) | Full upload flow |
| E2E (Playwright) | Image display verification |

---

## 7. Risk Mitigation

### 7.1 Rollback Strategy

**Feature Flag:**
```php
// config/features.php
'use_new_media_system' => env('FEATURE_NEW_MEDIA', true),
```

**Dual-Write Period:**
- New uploads write to both old path and Media Library
- Read from Media Library first, fallback to old path
- Switch feature flag to rollback

### 7.2 Zero-Downtime Migration

1. Keep original file paths in database during transition
2. Background job migrates existing images
3. Validate all images accessible before removing old paths
4. 7-day validation period before cleanup

### 7.3 Queue Processing

- Image conversions run asynchronously
- Ensure queue workers are running: `php artisan queue:work redis --queue=media-conversions`
- Monitor `failed_jobs` table for failures

---

## 8. Acceptance Criteria

### 8.1 Must Have (MVP)

- [ ] All image uploads use MediaServiceInterface
- [ ] Automatic WebP conversion for all images
- [ ] At least 3 size variants generated (thumb, medium, large)
- [ ] Local storage working with public disk
- [ ] Zero broken image links after migration
- [ ] srcset support in frontend components
- [ ] Lazy loading on all images
- [ ] All existing tests passing
- [ ] New tests for media functionality

### 8.2 Should Have

- [ ] Responsive images with `<picture>` fallback
- [ ] Image placeholders during load
- [ ] Consistent media API response across all entities
- [ ] Performance improvement of 20%+ on image-heavy pages

### 8.3 Definition of Done per Phase

**Phase 1 Done When:**
- Spatie installed and configured
- MediaServiceInterface working
- Unit/integration tests passing

**Phase 2 Done When:**
- League fully integrated
- Frontend displaying responsive images
- E2E test for league logo upload passing

**Phase 3 Done When:**
- All entities integrated
- All frontend dashboards updated
- All tests passing

**Phase 4 Done When:**
- All legacy images migrated
- No broken image links
- Old paths removable

**Phase 5 Done When:**
- Lazy loading implemented
- Performance benchmarks met
- Documentation complete

---

## Related Documents

- [01-media-management-architecture-plan.md](./01-media-management-architecture-plan.md) - Full architecture specification
- [03-media-backend-implementation.md](./03-media-backend-implementation.md) - Backend implementation details
- [04-media-frontend-implementation.md](./04-media-frontend-implementation.md) - Frontend implementation details
