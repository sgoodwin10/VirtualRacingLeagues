# League Detail Page Redesign - Backend Plan

## Agent: `dev-be`

This document outlines any backend changes required to support the League Detail page redesign.

---

## Assessment

After reviewing the requirements and existing codebase, the **backend changes required are minimal**. Most data needed for the new layout is already available through existing endpoints.

---

## Existing Endpoints & Data (Sufficient)

### 1. League Data
**Endpoint**: `GET /api/leagues/{id}`

Already provides all required fields:
- `name`, `slug`, `tagline`, `description`
- `logo`, `logo_url`, `header_image`, `header_image_url`
- `visibility`, `status`
- `contact_email`, `organizer_name`
- `timezone`
- `platforms` (array), `platform_ids`
- `discord_url`, `website_url`, `twitter_handle`, `instagram_handle`, `youtube_url`, `twitch_url`
- `competitions_count`, `drivers_count`

### 2. Competitions Data
**Endpoint**: `GET /api/leagues/{leagueId}/competitions`

Already provides:
- Competition list with `id`, `name`, `slug`, `description`, `platform_id`, `logo_url`, `competition_colour`

### 3. Seasons Data (Per Competition)
**Endpoint**: `GET /api/leagues/{leagueId}/competitions/{competitionId}/seasons`

Already provides:
- Season list with `id`, `name`, `slug`, `status`, `stats` (total_drivers, completed_races)
- Competition reference with `competition_colour`

---

## New Endpoint Required

### League Seasons Overview

**Purpose**: Fetch all active/upcoming seasons across all competitions for a league in a single request.

**Current Limitation**: Frontend must make N requests (one per competition) to get all seasons.

**Proposed Endpoint**:

```
GET /api/leagues/{leagueId}/seasons?status=active,upcoming
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "F1 2024 Championship",
      "slug": "f1-2024-championship",
      "status": "active",
      "competition": {
        "id": 1,
        "name": "GT World Series",
        "slug": "gt-world-series",
        "competition_colour": "{\"r\":100,\"g\":200,\"b\":255}"
      },
      "stats": {
        "total_drivers": 46,
        "total_races": 12,
        "completed_races": 8
      },
      "current_round": 8,
      "total_rounds": 12
    }
  ],
  "meta": {
    "total": 3
  }
}
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string (comma-separated) | Filter by status: `setup`, `active`, `completed`, `archived` |
| `limit` | integer | Max results (default: 10) |

---

## Implementation Steps (if new endpoint needed)

### Step 1: Domain Layer

No changes needed - Season entity already exists with all required data.

### Step 2: Application Layer

**File**: `app/Application/League/Services/LeagueApplicationService.php`

Add method:
```php
public function getLeagueSeasons(
    int $leagueId,
    array $statuses = ['active', 'upcoming'],
    int $limit = 10
): Collection {
    // Fetch all seasons for the league across competitions
    // Filter by status
    // Include competition relationship
}
```

**DTO**: Create `LeagueSeasonSummaryData` if needed for the response format.

### Step 3: Infrastructure Layer

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonRepository.php`

Add method to repository interface and implementation:
```php
public function findByLeagueWithStatuses(int $leagueId, array $statuses, int $limit): Collection;
```

### Step 4: Interface Layer

**File**: `app/Http/Controllers/User/LeagueSeasonController.php` (new)

```php
class LeagueSeasonController extends Controller
{
    public function index(int $leagueId, Request $request): JsonResponse
    {
        $statuses = $request->input('status', 'active,upcoming');
        $limit = $request->input('limit', 10);

        $seasons = $this->leagueService->getLeagueSeasons(
            $leagueId,
            explode(',', $statuses),
            $limit
        );

        return ApiResponse::success($seasons);
    }
}
```

**Route**: `routes/subdomain.php`
```php
Route::get('/leagues/{leagueId}/seasons', [LeagueSeasonController::class, 'index']);
```

---

## Optional Enhancements

### 1. Seasons Count in League Response

Add `seasons_count` to the League DTO:

**File**: `app/Application/League/DTOs/LeagueData.php`

```php
public readonly int $seasons_count,
```

**Implementation**: Count via query or computed from competitions.

### 2. Platforms Count in League Response

Add `platforms_count` to the League DTO (currently only `platform_ids` array is returned):

```php
public readonly int $platforms_count, // Simply count(platform_ids)
```

This is trivial as frontend can compute it, but including it maintains consistency.

---

## Priority Assessment

| Task | Priority | Reason |
|------|----------|--------|
| League Seasons Endpoint | Medium | Required for unified seasons display; workaround is multiple API calls |
| Seasons Count in League | Low | Can be computed frontend from competitions |
| Platforms Count in League | Low | Already have `platform_ids` array |

---

## No Backend Changes Needed For

- League visibility/status display (already in response)
- Social media links (already in response)
- Stats grid data (competitions_count, drivers_count already exist)
- Competition tiles (existing endpoint sufficient)
- Terminal panel config data (all fields exist)

---

## Testing

### Unit Tests

If new endpoint implemented:
- `LeagueApplicationServiceTest::test_get_league_seasons_filters_by_status()`
- `LeagueApplicationServiceTest::test_get_league_seasons_respects_limit()`

### Feature Tests

- `LeagueSeasonControllerTest::test_index_returns_active_seasons()`
- `LeagueSeasonControllerTest::test_index_filters_by_status_parameter()`
- `LeagueSeasonControllerTest::test_index_requires_authentication()`

---

## Summary

The League Detail page redesign is primarily a **frontend effort**. Backend support is largely complete with existing endpoints. The only recommended addition is a consolidated seasons endpoint to improve performance by reducing API calls.

If the frontend can tolerate fetching seasons per-competition (current approach), **no backend changes are strictly required** for the initial implementation.
