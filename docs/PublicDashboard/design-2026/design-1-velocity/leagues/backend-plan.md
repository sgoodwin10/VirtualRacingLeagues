# Public Leagues - Backend Reference

## Overview

The backend for the Public Leagues feature is **already complete**. This document serves as a reference for the existing API endpoints and data structures that the frontend will consume.

## Status: No Backend Work Required

All necessary API endpoints, domain models, DTOs, and application services are already implemented and functional.

---

## Existing API Endpoints

### 1. List Public Leagues

```
GET /api/public/leagues
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Filter by league name (partial match) |
| `platform` | int | Filter by platform ID |
| `sort` | string | Sort order: `popular`, `recent`, `name` |
| `page` | int | Page number (default: 1) |
| `per_page` | int | Items per page (default: 12, max: 50) |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Red Storm Racing",
      "slug": "red-storm-racing",
      "logo": "https://example.com/logo.png",
      "banner": "https://example.com/banner.png",
      "platform": {
        "id": 1,
        "name": "Gran Turismo 7"
      },
      "driver_count": 24,
      "competition_count": 3,
      "race_count": 128,
      "visibility": "public"
    }
  ],
  "meta": {
    "total": 45,
    "per_page": 12,
    "current_page": 1,
    "last_page": 4
  }
}
```

**Location:**
- Controller: `app/Http/Controllers/PublicLeagueController.php`
- Service: `app/Application/League/Services/LeagueApplicationService.php::getPublicLeagues()`

---

### 2. Get League Detail

```
GET /api/public/leagues/{slug}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | League URL slug |

**Response:**
```json
{
  "league": {
    "id": 1,
    "name": "Red Storm Racing",
    "slug": "red-storm-racing",
    "tagline": "Racing excellence since 2020",
    "logo": "https://example.com/logo.png",
    "banner": "https://example.com/banner.png",
    "header_image": "https://example.com/header.png",
    "platform": {
      "id": 1,
      "name": "Gran Turismo 7"
    },
    "social": {
      "discord_url": "https://discord.gg/...",
      "website_url": "https://...",
      "twitter_url": null,
      "instagram_url": null,
      "youtube_url": null,
      "twitch_url": null
    }
  },
  "stats": {
    "total_drivers": 24,
    "total_competitions": 3,
    "total_races": 128,
    "active_seasons": 2
  },
  "competitions": [
    {
      "id": 1,
      "name": "GT4 Championship",
      "slug": "gt4-championship",
      "description": "Weekly GT4 racing series",
      "logo": "https://example.com/comp-logo.png",
      "competition_colour": { "r": 231, "g": 76, "b": 60 },
      "status": "active",
      "seasons": [
        {
          "id": 1,
          "name": "Winter 2026",
          "slug": "winter-2026",
          "status": "active",
          "driver_count": 18,
          "race_count": 8
        },
        {
          "id": 2,
          "name": "Fall 2025",
          "slug": "fall-2025",
          "status": "completed",
          "driver_count": 16,
          "race_count": 10
        }
      ]
    }
  ],
  "recent_activity": [...],
  "upcoming_races": [...],
  "championship_leaders": [...]
}
```

**Location:**
- Controller: `app/Http/Controllers/PublicLeagueController.php::show()`
- Service: `app/Application/League/Services/LeagueApplicationService.php::getPublicLeagueDetail()`

---

### 3. Get Season Detail with Standings

```
GET /api/public/leagues/{leagueSlug}/seasons/{seasonSlug}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `leagueSlug` | string | League URL slug |
| `seasonSlug` | string | Season URL slug |

**Response (Without Divisions):**
```json
{
  "league": {
    "name": "Red Storm Racing",
    "slug": "red-storm-racing",
    "logo": "https://example.com/logo.png"
  },
  "competition": {
    "name": "GT4 Championship",
    "slug": "gt4-championship"
  },
  "season": {
    "id": 1,
    "name": "Winter 2026",
    "slug": "winter-2026",
    "status": "active",
    "car_class": "GT4",
    "logo": "https://example.com/season-logo.png",
    "banner": "https://example.com/season-banner.png",
    "team_championship_enabled": true,
    "race_divisions_enabled": false,
    "total_drop_rounds": 2
  },
  "rounds": [
    {
      "id": 1,
      "round_number": 1,
      "name": "Round 1 - Suzuka",
      "status": "completed"
    },
    {
      "id": 2,
      "round_number": 2,
      "name": "Round 2 - Spa",
      "status": "completed"
    }
  ],
  "has_divisions": false,
  "standings": [
    {
      "position": 1,
      "season_driver_id": 101,
      "driver_name": "Max Velocity",
      "team_id": 1,
      "team_name": "Red Storm",
      "team_color": "#e74c3c",
      "total_points": 93,
      "podiums": 4,
      "poles": 2,
      "rounds": [
        { "round_id": 1, "points": 25, "position": 1 },
        { "round_id": 2, "points": 25, "position": 1 },
        { "round_id": 3, "points": 18, "position": 2 },
        { "round_id": 4, "points": 25, "position": 1 }
      ]
    }
  ],
  "team_standings": [
    {
      "position": 1,
      "team_id": 1,
      "team_name": "Red Storm",
      "team_color": "#e74c3c",
      "total_points": 133,
      "driver_count": 3
    }
  ]
}
```

**Response (With Divisions):**
```json
{
  "has_divisions": true,
  "standings": [
    {
      "id": 1,
      "name": "Division 1",
      "drivers": [
        {
          "position": 1,
          "season_driver_id": 101,
          "driver_name": "Max Velocity",
          "total_points": 93,
          "rounds": [...]
        }
      ]
    },
    {
      "id": 2,
      "name": "Division 2",
      "drivers": [...]
    }
  ]
}
```

**Location:**
- Controller: `app/Http/Controllers/PublicLeagueController.php::showSeason()`
- Service: `app/Application/League/Services/LeagueApplicationService.php::getPublicSeasonDetail()`

---

### 4. Get Platforms List

```
GET /api/public/platforms
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Gran Turismo 7",
    "slug": "gt7"
  },
  {
    "id": 2,
    "name": "iRacing",
    "slug": "iracing"
  }
]
```

**Location:**
- Controller: `app/Http/Controllers/PlatformController.php`

---

## Domain Model Reference

### League Entity
**Location:** `app/Domain/League/Entities/League.php`

Key properties:
- `name`, `slug`, `tagline`
- `logoPath`, `headerImagePath`, `bannerPath`
- `visibility` (public | unlisted)
- `platformIds[]`
- Social URLs: discord, website, twitter, instagram, youtube, twitch

### Competition Entity
**Location:** `app/Domain/Competition/Entities/Competition.php`

Key properties:
- `name`, `slug`, `description`
- `logoPath`, `competitionColour` (RGB object)
- `platformId`
- `status` (active | archived)
- Relationship to League, Seasons

### Season Entity
**Location:** `app/Domain/Competition/Entities/Season.php`

Key properties:
- `name`, `slug`, `description`, `carClass`
- `logoPath`, `bannerPath`
- `status` (setup | active | completed | archived)
- `teamChampionshipEnabled`, `teamsDriversForCalculation`, `teamsDropRounds`
- `raceDivisionsEnabled`, `raceTimesRequired`
- `dropRound`, `totalDropRounds`
- `roundTotalsTiebreakerRulesEnabled`

---

## DTO Reference

### PublicLeagueBasicData
```php
class PublicLeagueBasicData extends Data
{
    public int $id;
    public string $name;
    public string $slug;
    public ?string $logo;
    public ?string $banner;
    public ?PlatformData $platform;
    public int $driver_count;
    public int $competition_count;
    public int $race_count;
    public string $visibility;
}
```

### PublicLeagueDetailData
```php
class PublicLeagueDetailData extends Data
{
    public PublicLeagueInfoData $league;
    public LeagueStatsData $stats;
    /** @var PublicCompetitionDetailData[] */
    public array $competitions;
    public array $recent_activity;
    public array $upcoming_races;
    public array $championship_leaders;
}
```

### PublicSeasonDetailData
```php
class PublicSeasonDetailData extends Data
{
    public array $league;        // name, slug, logo
    public array $competition;   // name, slug
    public PublicSeasonData $season;
    /** @var PublicRoundData[] */
    public array $rounds;
    public bool $has_divisions;
    public array $standings;     // flat or division-grouped
    public ?array $team_standings;
}
```

---

## Route Configuration

**Location:** `routes/subdomain.php`

```php
// Public API (no authentication)
Route::domain(config('app.public_domain'))->group(function () {
    Route::prefix('api/public')->group(function () {
        Route::get('leagues', [PublicLeagueController::class, 'index']);
        Route::get('leagues/{slug}', [PublicLeagueController::class, 'show']);
        Route::get('leagues/{leagueSlug}/seasons/{seasonSlug}', [PublicLeagueController::class, 'showSeason']);
        Route::get('races/{raceId}/results', [PublicLeagueController::class, 'raceResults']);
        Route::get('drivers/{seasonDriverId}', [PublicLeagueController::class, 'driverProfile']);
        Route::get('platforms', [PlatformController::class, 'index']);
    });
});
```

---

## Potential Minor Adjustments

While the backend is complete, these are minor items that **may** need attention during frontend development:

1. **Pagination Meta Format**
   - Verify the pagination response matches frontend expectations
   - May need to adjust `meta` vs `pagination` key naming

2. **Image URL Generation**
   - Verify MediaLibrary URLs are being generated correctly
   - May need to add responsive image size variants

3. **Competition Colour Format**
   - Currently returns `{ r: 231, g: 76, b: 60 }`
   - Frontend may prefer hex string `#e74c3c`
   - Can be handled in frontend or add transformer

4. **Sort Options**
   - Verify `popular`, `recent`, `name` sort implementations
   - `popular` might need definition (by driver count? race count?)

These are all minor and can be addressed as discovered during frontend implementation.

---

## Testing Existing Endpoints

Use these curl commands to verify endpoints are working:

```bash
# List leagues
curl http://virtualracingleagues.localhost/api/public/leagues

# League detail
curl http://virtualracingleagues.localhost/api/public/leagues/red-storm-racing

# Season standings
curl http://virtualracingleagues.localhost/api/public/leagues/red-storm-racing/seasons/winter-2026

# Platforms
curl http://virtualracingleagues.localhost/api/public/platforms
```

---

## Agent Assignment

**Agent:** `dev-be` - **Reference only, minimal involvement expected**

The backend is complete. The `dev-be` agent should only be invoked if:
1. API response format doesn't match frontend needs
2. New sorting/filtering logic is required
3. Performance optimization is needed
4. Bug fixes are discovered during integration
