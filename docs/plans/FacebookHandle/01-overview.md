# Facebook Handle Feature - Overview

## Feature Description

Add a new `facebook_handle` field to the League entity to allow league owners to link their Facebook page or profile. This field will follow the same pattern as the existing `twitter_handle` and `instagram_handle` fields - storing just the handle/username (without the full URL prefix).

### User Story

> As a league owner, I want to add my league's Facebook handle to my league profile, so that members and visitors can easily find and follow our Facebook page.

### Field Specification

| Attribute | Value |
|-----------|-------|
| Field Name | `facebook_handle` |
| Database Column | `facebook_handle` varchar(255) nullable |
| Position | After `twitch_url` column |
| Validation | Optional, max 100 characters |
| Display URL | `https://facebook.com/{facebook_handle}` |
| Icon | Facebook icon (PhFacebookLogo from Phosphor) |
| Color Theme | `#1877F2` (Facebook blue) |

---

## Scope

### In Scope
1. **Database**: Add new column to `leagues` table
2. **Backend**: Update all DDD layers (Domain, Application, Infrastructure)
3. **App Dashboard**: Update league creation and editing forms
4. **Public Site**: Display Facebook link in league header

### Out of Scope
- URL validation (checking if Facebook profile exists)
- API integration with Facebook
- OAuth/authentication with Facebook

---

## Files Affected

### Backend (17 files)

| Layer | File | Change Type |
|-------|------|-------------|
| Migration | `database/migrations/YYYY_MM_DD_XXXXXX_add_facebook_handle_to_leagues_table.php` | New |
| Domain Entity | `app/Domain/League/Entities/League.php` | Modify |
| Eloquent Model | `app/Infrastructure/Persistence/Eloquent/Models/League.php` | Modify |
| Repository | `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueRepository.php` | Modify |
| DTOs | `app/Application/League/DTOs/LeagueData.php` | Modify |
| DTOs | `app/Application/League/DTOs/CreateLeagueData.php` | Modify |
| DTOs | `app/Application/League/DTOs/UpdateLeagueData.php` | Modify |
| Application Service | `app/Application/League/Services/LeagueApplicationService.php` | Modify |
| Factory | `database/factories/LeagueFactory.php` | Modify |
| Seeder | `database/seeders/LeagueSeeder.php` | Review/Modify if needed |

### Frontend - App Dashboard (7 files)

| File | Change Type |
|------|-------------|
| `resources/app/js/types/league.ts` | Modify |
| `resources/app/js/components/league/partials/SocialMediaFields.vue` | Modify |
| `resources/app/js/components/league/modals/partials/sections/SocialSection.vue` | Modify |
| `resources/app/js/components/league/partials/LeagueTerminalConfig.vue` | Modify |
| `resources/app/js/components/league/partials/LeagueSocialMediaPanel.vue` | Modify |

### Frontend - Public Site (2 files)

| File | Change Type |
|------|-------------|
| `resources/public/js/types/public.ts` | Modify |
| `resources/public/js/components/leagues/LeagueHeader.vue` | Modify |

---

## Implementation Order

1. **Phase 1: Backend** (Estimated: ~30 min)
   - Database migration
   - Domain entity update
   - Eloquent model update
   - Repository update
   - DTOs update
   - Application service update
   - Run migration and tests

2. **Phase 2: App Dashboard Frontend** (Estimated: ~20 min)
   - TypeScript types
   - Form components (SocialMediaFields, SocialSection)
   - Display components (LeagueTerminalConfig, LeagueSocialMediaPanel)
   - Test updates

3. **Phase 3: Public Site Frontend** (Estimated: ~10 min)
   - TypeScript types
   - LeagueHeader component
   - Test updates if any

---

## Agents to Use

| Phase | Agent | Purpose |
|-------|-------|---------|
| Phase 1 | `dev-be` | Backend Laravel/PHP development following DDD |
| Phase 2 | `dev-fe-app` | App dashboard Vue.js components |
| Phase 3 | `dev-fe-public` | Public site Vue.js components |

---

## Testing Requirements

### Backend Tests
- Unit test for domain entity with facebook_handle
- Feature test for API endpoints accepting facebook_handle

### Frontend Tests
- Update existing component tests to include facebook_handle
- Verify form validation works correctly
- Verify display in LeagueHeader and LeagueTerminalConfig

---

## Rollback Plan

If issues arise:
1. Revert migration: `php artisan migrate:rollback --step=1`
2. Revert code changes via git
3. The field is nullable, so no data loss concerns

---

## Questions/Clarifications

None at this time - the pattern is well-established with existing social media handles.
