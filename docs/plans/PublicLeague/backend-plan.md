# Public League Detail Enhancement - Backend Plan

## Agent: `dev-be`

Backend changes follow DDD architecture patterns as documented in `.claude/guides/backend/ddd-overview.md`.

---

## Current State Analysis

### What Already Exists

The backend **already provides all required social media data**. The following fields are:

1. **In League Entity** (`app/Domain/League/Entities/League.php`):
   - `discordUrl`, `websiteUrl`, `twitterHandle`, `instagramHandle`, `youtubeUrl`, `twitchUrl`
   - `contactEmail`, `organizerName`

2. **In Eloquent Model** (`app/Infrastructure/Persistence/Eloquent/Models/League.php`):
   - All fields mapped from database

3. **In PublicLeagueBasicData DTO** (`app/Application/League/DTOs/PublicLeagueBasicData.php`):
   - `discord_url`, `website_url`, `twitter_handle`, `youtube_url`, `twitch_url`
   - **MISSING**: `instagram_handle` (exists in domain but not exposed in public DTO)
   - **MISSING**: `contact_email`, `organizer_name` (may want to expose for public modal)

4. **In Frontend Types** (`resources/public/js/types/public.ts`):
   - `PublicLeagueInfo` has `instagram_handle` but `PublicLeagueBasicData` DTO doesn't include it

---

## Required Changes

### Task 1: Add Missing Fields to PublicLeagueBasicData DTO

### File: `app/Application/League/DTOs/PublicLeagueBasicData.php`

**Action**: Add `instagram_handle` field (currently missing from the DTO)

**Before**:
```php
public readonly ?string $twitter_handle,
public readonly ?string $youtube_url,
public readonly ?string $twitch_url,
public readonly string $created_at,
```

**After**:
```php
public readonly ?string $twitter_handle,
public readonly ?string $instagram_handle,  // ADD THIS
public readonly ?string $youtube_url,
public readonly ?string $twitch_url,
public readonly string $created_at,
```

---

### Task 2: Update DTO Factory Method (if exists)

### File: `app/Application/League/Services/LeagueApplicationService.php`

**Action**: Locate where `PublicLeagueBasicData` is constructed and ensure `instagram_handle` is included.

Search for where `PublicLeagueBasicData` is instantiated and add the `instagram_handle` field from the League entity.

**Example pattern**:
```php
new PublicLeagueBasicData(
    id: $league->id(),
    name: $league->name()->value(),
    // ... existing fields
    twitter_handle: $league->twitterHandle(),
    instagram_handle: $league->instagramHandle(),  // ADD THIS
    youtube_url: $league->youtubeUrl(),
    // ...
);
```

---

## Optional Changes (Discuss with Stakeholder)

### Task 3 (Optional): Expose Contact Information

If the league organizer wants to display contact information publicly, add these fields to `PublicLeagueBasicData`:

**File**: `app/Application/League/DTOs/PublicLeagueBasicData.php`

```php
// Add to constructor parameters
public readonly ?string $contact_email,
public readonly ?string $organizer_name,
```

**Considerations**:
- **Privacy**: Contact email may contain personal information
- **Alternative**: Could add a flag like `show_contact_publicly` to League entity
- **Recommendation**: Start without this, add later if users request it

---

## Testing

### Unit Test Updates

### File: `tests/Unit/Application/League/DTOs/PublicLeagueBasicDataTest.php` (if exists, otherwise create)

Test cases:
- DTO includes instagram_handle field
- DTO correctly maps all social media fields
- Null values handled correctly

### Feature Test Updates

### File: `tests/Feature/Api/Public/PublicLeagueControllerTest.php`

Add/verify test cases:
- Response includes instagram_handle in league object
- All social media fields returned correctly
- Null fields handled (not included or null value)

---

## Implementation Checklist

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Add instagram_handle to PublicLeagueBasicData | `app/Application/League/DTOs/PublicLeagueBasicData.php` | Required |
| 2 | Update DTO construction in service | `app/Application/League/Services/LeagueApplicationService.php` | Required |
| 3 | Add contact_email/organizer_name (optional) | `app/Application/League/DTOs/PublicLeagueBasicData.php` | Optional |
| 4 | Update/add unit tests | `tests/Unit/Application/League/DTOs/` | Required |
| 5 | Update feature tests | `tests/Feature/Api/Public/PublicLeagueControllerTest.php` | Required |

---

## Verification Steps

After implementation, verify:

1. **API Response Check**:
   ```bash
   curl http://virtualracingleagues.localhost/api/leagues/{slug} | jq '.data.league'
   ```
   Should include `instagram_handle` in the response.

2. **Run Tests**:
   ```bash
   composer test -- --filter=PublicLeague
   ```

3. **PHPStan Check**:
   ```bash
   composer phpstan
   ```

4. **Code Style**:
   ```bash
   composer phpcs
   ```

---

## Notes

### Why This Is Minimal

The backend already has excellent coverage for this feature. The only missing piece is the `instagram_handle` field not being exposed in the public DTO. This is a simple addition that:

1. Does not require database changes
2. Does not require new API endpoints
3. Does not require new domain logic
4. Only requires DTO field addition and mapping

### No New API Endpoints Needed

The existing endpoint `GET /api/leagues/{slug}` already returns all league data through `PublicLeagueController::show()` which uses `LeagueApplicationService::getPublicLeagueDetail()`. The data structure supports all needed fields.

### DDD Layer Summary

| Layer | Changes Needed |
|-------|---------------|
| Domain | None - all fields already exist in League entity |
| Application | Add field to PublicLeagueBasicData DTO, update mapping |
| Infrastructure | None - Eloquent model already has all fields |
| Interface | None - Controller already returns all DTO data |

---

## Decision Point

Before implementation, confirm with stakeholder:

1. **Instagram Handle**: Should `instagram_handle` be exposed publicly? (Recommended: Yes)
2. **Contact Information**: Should `contact_email` and `organizer_name` be exposed publicly? (Recommended: Discuss privacy implications first)
