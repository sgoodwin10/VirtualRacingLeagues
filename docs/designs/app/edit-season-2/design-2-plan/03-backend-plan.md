# Backend Implementation Plan

## Agent: `dev-be`

This document covers the backend requirements for the Season Form Split Modal feature.

---

## Executive Summary

**No backend changes are required** for this feature.

The new `SeasonFormSplitModal.vue` component is a **frontend-only UI refactor** that:
- Uses the exact same API endpoints as the existing `SeasonFormDrawer.vue`
- Sends identical request payloads
- Expects identical response formats
- **Coexists** alongside `SeasonFormDrawer.vue` (not a replacement)

---

## Design Decisions Impact

| Decision | Backend Impact |
|----------|----------------|
| Coexistence with SeasonFormDrawer | None - same API used by both |
| Simplified upload with remove | Already supported - send `null` to remove |
| Mobile tab bar | None - UI only |
| Vue Transitions | None - UI only |

---

## Existing API Endpoints (No Changes)

### Season CRUD

| Method | Endpoint | Controller Method | Purpose |
|--------|----------|-------------------|---------|
| GET | `/api/competitions/{id}/seasons` | `SeasonController@index` | List seasons |
| POST | `/api/competitions/{id}/seasons` | `SeasonController@store` | Create season |
| GET | `/api/seasons/{id}` | `SeasonController@show` | Get season |
| PUT | `/api/seasons/{id}` | `SeasonController@update` | Update season |
| DELETE | `/api/seasons/{id}` | `SeasonController@destroy` | Delete season |

### Season Actions

| Method | Endpoint | Controller Method | Purpose |
|--------|----------|-------------------|---------|
| POST | `/api/seasons/{id}/archive` | `SeasonController@archive` | Archive season |
| POST | `/api/seasons/{id}/unarchive` | `SeasonController@unarchive` | Unarchive season |
| POST | `/api/seasons/{id}/activate` | `SeasonController@activate` | Activate season |
| POST | `/api/seasons/{id}/complete` | `SeasonController@complete` | Complete season |
| POST | `/api/seasons/{id}/restore` | `SeasonController@restore` | Restore deleted |

### Utilities

| Method | Endpoint | Controller Method | Purpose |
|--------|----------|-------------------|---------|
| POST | `/api/competitions/{id}/seasons/check-slug` | `SeasonController@checkSlug` | Check slug availability |
| GET | `/api/tiebreaker-rules` | `TiebreakerRulesController@index` | List tiebreaker rules |
| GET | `/api/seasons/{id}/tiebreaker-rules` | `TiebreakerRulesController@forSeason` | Get season rules |
| PUT | `/api/seasons/{id}/tiebreaker-rules` | `TiebreakerRulesController@updateOrder` | Update rule order |

---

## Image Removal Support (Already Implemented)

The simplified upload component needs to support removing existing images. This is **already supported** by the existing API:

### How to Remove an Existing Image

When updating a season, send `null` or omit the field to keep it, or send an empty value to clear it:

```typescript
// Frontend: buildUpdateSeasonFormData in seasonService.ts
// Already handles this via appendIfDefined and appendFileIfProvided utilities

// To remove logo: Don't send logo field, but signal removal via separate flag
// OR: Backend already supports sending logo=null to clear
```

### Current Backend Behavior (UpdateSeasonData)

From `app/Application/Competition/DTOs/UpdateSeasonData.php`:

```php
/**
 * Update season request (update/partial type)
 *
 * Nullability patterns:
 * - Fields that can be omitted: Not provided means "don't change this field"
 * - Fields that support null: Explicitly passing null means "clear this field"
 *   - logo: Pass null to remove custom logo (reverts to competition logo)
 *   - banner: Pass null to remove banner
 */
```

**No changes needed** - the backend already supports:
1. Omitting a field = keep current value
2. Sending `null` = clear/remove the field
3. Sending a File = replace with new file

---

## Request/Response Formats (Unchanged)

### Create Season Request
```json
// POST /api/competitions/{id}/seasons
// Content-Type: multipart/form-data

{
  "name": "Season 1",
  "car_class": "GT3",
  "description": "Description text...",
  "technical_specs": "Technical specs...",
  "logo": <File>,
  "banner": <File>,
  "race_divisions_enabled": true,
  "team_championship_enabled": false,
  "race_times_required": true,
  "drop_round": true,
  "total_drop_rounds": 2,
  "teams_drivers_for_calculation": null,
  "teams_drop_rounds": false,
  "teams_total_drop_rounds": null,
  "round_totals_tiebreaker_rules_enabled": true
}
```

### Update Season Request
```json
// PUT /api/seasons/{id}
// Content-Type: multipart/form-data (with _method=PUT spoofing)

{
  "_method": "PUT",
  "name": "Updated Season Name",
  // To remove logo, don't include logo field or send logo=null
  // ... other fields as needed
}
```

### Season Response
```json
{
  "success": true,
  "message": "Season created successfully",
  "data": {
    "id": 1,
    "competition_id": 1,
    "name": "Season 1",
    "slug": "season-1",
    "car_class": "GT3",
    "description": "...",
    "technical_specs": "...",
    "logo_url": "https://...",
    "has_own_logo": true,
    "banner_url": "https://...",
    "has_own_banner": true,
    "logo": { "thumb": "...", "small": "...", "medium": "...", "original": "..." },
    "banner": { "thumb": "...", "small": "...", "medium": "...", "original": "..." },
    "race_divisions_enabled": true,
    "team_championship_enabled": false,
    "race_times_required": true,
    "drop_round": true,
    "total_drop_rounds": 2,
    "teams_drivers_for_calculation": null,
    "teams_drop_rounds": false,
    "teams_total_drop_rounds": null,
    "round_totals_tiebreaker_rules_enabled": true,
    "status": "setup",
    "is_setup": true,
    "is_active": false,
    "is_completed": false,
    "is_archived": false,
    "is_deleted": false,
    "stats": {
      "total_drivers": 0,
      "active_drivers": 0,
      "total_races": 0,
      "completed_races": 0
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## Existing Backend Files (Reference Only)

### Controllers
- `app/Http/Controllers/User/SeasonController.php` - Season CRUD

### Application Services
- `app/Application/Competition/Services/SeasonApplicationService.php` - Business logic

### DTOs
- `app/Application/Competition/DTOs/CreateSeasonData.php` - Create request validation
- `app/Application/Competition/DTOs/UpdateSeasonData.php` - Update request validation
- `app/Application/Competition/DTOs/SeasonData.php` - Response DTO

### Domain
- `app/Domain/Competition/Entities/Season.php` - Season entity
- `app/Domain/Competition/Repositories/SeasonRepositoryInterface.php` - Repository interface

### Infrastructure
- `app/Infrastructure/Persistence/Eloquent/Models/SeasonEloquent.php` - Eloquent model
- `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonRepository.php` - Repository implementation

---

## Validation Rules (Existing - No Changes)

From `CreateSeasonData::rules()`:
```php
return [
    'name' => ['required', 'string', 'min:3', 'max:100'],
    'car_class' => ['nullable', 'string', 'max:150'],
    'description' => ['nullable', 'string', 'max:2000'],
    'technical_specs' => ['nullable', 'string', 'max:2000'],
    'logo' => ['nullable', 'image', 'max:2048', 'mimes:jpeg,png,jpg'],
    'banner' => ['nullable', 'image', 'max:5120', 'mimes:jpeg,png,jpg'],
    'race_divisions_enabled' => ['boolean'],
    'team_championship_enabled' => ['boolean'],
    'race_times_required' => ['boolean'],
    'drop_round' => ['boolean'],
    'total_drop_rounds' => ['integer', 'min:0', 'max:10'],
    'teams_drivers_for_calculation' => ['nullable', 'integer', 'min:1', 'max:16'],
    'teams_drop_rounds' => ['boolean'],
    'teams_total_drop_rounds' => ['nullable', 'integer', 'min:0', 'max:10'],
    'round_totals_tiebreaker_rules_enabled' => ['boolean'],
];
```

---

## Coexistence Note

Both `SeasonFormDrawer.vue` and the new `SeasonFormSplitModal.vue` will:
- Use the same API endpoints
- Send the same request formats
- Expect the same response formats
- Use the same validation rules

The parent component decides which modal to display. This is purely a frontend concern with no backend impact.

---

## Potential Future Enhancements

While not required for this feature, the following backend enhancements could be considered for future iterations:

### 1. Explicit Image Removal Flag
If the current null-sending approach proves problematic, add explicit removal flags:

```php
// New fields in UpdateSeasonData
'remove_logo' => ['boolean'],
'remove_banner' => ['boolean'],
```

**Note**: This is NOT needed currently. The existing implementation already handles image removal correctly.

### 2. Form Draft/Auto-Save
Save draft form state to allow users to continue editing later.

```php
// New endpoint
POST /api/seasons/drafts
GET /api/seasons/drafts/{draftId}
DELETE /api/seasons/drafts/{draftId}
```

### 3. Section Completion Tracking
Track which form sections have been completed for progress indication.

```php
// Add to Season model
protected $casts = [
    'form_sections_completed' => 'array', // ['basic', 'driver', 'team', 'branding']
];
```

---

## Conclusion

This feature is a **pure frontend implementation**. The backend team (`dev-be`) should be aware of this feature for reference but **no development work is required**.

The existing Season API provides all functionality needed:
- CRUD operations
- Slug checking
- Tiebreaker rules management
- Image uploads (logo/banner)
- Image removal (via null values)

All validation, business logic, and data persistence remain unchanged.

Both the new `SeasonFormSplitModal.vue` and existing `SeasonFormDrawer.vue` will continue to work with the same backend API.
