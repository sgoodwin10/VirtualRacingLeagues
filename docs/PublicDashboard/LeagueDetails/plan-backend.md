# League Detail View - Backend Implementation Plan

**Agent**: `dev-be`

## Overview

Create a public API endpoint that returns detailed league information including competitions, seasons, recent activity, upcoming races, and championship leaders.

## Architecture

Following the existing DDD architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  Interface Layer                                             │
│  PublicLeagueController::show(slug)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Application Layer                                           │
│  LeagueApplicationService::getPublicLeagueDetail(slug)      │
│  Returns: PublicLeagueDetailData (DTO)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure Layer                                        │
│  EloquentLeagueRepository                                   │
│  EloquentCompetitionRepository                              │
│  EloquentSeasonRepository                                   │
│  EloquentRoundRepository (for upcoming races)               │
│  EloquentActivityLogRepository (for recent activity)        │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Implementation

### Step 1: Create DTOs

#### 1.1 Create `PublicLeagueDetailData` DTO

**File**: `app/Application/League/DTOs/PublicLeagueDetailData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class PublicLeagueDetailData extends Data
{
    public function __construct(
        public readonly PublicLeagueInfoData $league,
        public readonly PublicLeagueStatsData $stats,
        /** @var array<PublicCompetitionDetailData> */
        public readonly array $competitions,
        /** @var array<PublicActivityData> */
        public readonly array $recent_activity,
        /** @var array<PublicUpcomingRaceData> */
        public readonly array $upcoming_races,
        /** @var array<PublicChampionshipLeaderData> */
        public readonly array $championship_leaders,
    ) {
    }
}
```

#### 1.2 Create `PublicLeagueInfoData` DTO

**File**: `app/Application/League/DTOs/PublicLeagueInfoData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class PublicLeagueInfoData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $tagline,
        public readonly ?string $description,
        public readonly ?string $logo_url,
        public readonly ?string $header_image_url,
        /** @var array<array{id: int, name: string, slug: string}> */
        public readonly array $platforms,
        public readonly string $visibility,
        public readonly ?string $discord_url,
        public readonly ?string $website_url,
        public readonly ?string $twitter_handle,
        public readonly ?string $youtube_url,
        public readonly ?string $twitch_url,
        public readonly string $created_at,
    ) {
    }
}
```

#### 1.3 Create `PublicLeagueStatsData` DTO

**File**: `app/Application/League/DTOs/PublicLeagueStatsData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class PublicLeagueStatsData extends Data
{
    public function __construct(
        public readonly int $competitions_count,
        public readonly int $active_seasons_count,
        public readonly int $drivers_count,
    ) {
    }
}
```

#### 1.4 Create `PublicCompetitionDetailData` DTO

**File**: `app/Application/League/DTOs/PublicCompetitionDetailData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class PublicCompetitionDetailData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly ?string $logo_url,
        public readonly ?string $competition_colour,
        public readonly array $platform, // {id, name, slug}
        public readonly array $stats, // {total_seasons, active_seasons, total_drivers}
        /** @var array<PublicSeasonSummaryData> */
        public readonly array $seasons,
    ) {
    }
}
```

#### 1.5 Create `PublicSeasonSummaryData` DTO

**File**: `app/Application/League/DTOs/PublicSeasonSummaryData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class PublicSeasonSummaryData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $car_class,
        public readonly string $status, // setup, active, completed, archived
        public readonly array $stats, // {total_drivers, active_drivers, total_rounds, completed_rounds, next_race_date}
    ) {
    }
}
```

#### 1.6 Create `PublicActivityData` DTO

**File**: `app/Application/League/DTOs/PublicActivityData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class PublicActivityData extends Data
{
    public function __construct(
        public readonly string $type, // race_completed, driver_joined, season_started, championship_leader
        public readonly string $title,
        public readonly string $subtitle,
        public readonly string $timestamp,
        public readonly string $icon_type, // success, info, warning, gold, purple
    ) {
    }
}
```

#### 1.7 Create `PublicUpcomingRaceData` DTO

**File**: `app/Application/League/DTOs/PublicUpcomingRaceData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class PublicUpcomingRaceData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $track_name,
        public readonly string $season_name,
        public readonly string $competition_name,
        public readonly string $scheduled_at,
        public readonly int $drivers_registered,
        public readonly bool $is_next,
    ) {
    }
}
```

#### 1.8 Create `PublicChampionshipLeaderData` DTO

**File**: `app/Application/League/DTOs/PublicChampionshipLeaderData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class PublicChampionshipLeaderData extends Data
{
    public function __construct(
        public readonly int $position,
        public readonly string $driver_name,
        public readonly string $season_name,
        public readonly int $points,
    ) {
    }
}
```

---

### Step 2: Update Repository Interface

**File**: `app/Domain/League/Repositories/LeagueRepositoryInterface.php`

Add new method:

```php
/**
 * Find a public league by slug with full details for display.
 *
 * @param string $slug
 * @return array{
 *   league: League,
 *   platforms: array,
 *   competitions_count: int,
 *   active_seasons_count: int,
 *   drivers_count: int
 * }|null
 */
public function findPublicBySlug(string $slug): ?array;
```

---

### Step 3: Implement Repository Method

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueRepository.php`

Add implementation:

```php
public function findPublicBySlug(string $slug): ?array
{
    $model = LeagueModel::query()
        ->where('slug', $slug)
        ->where('status', 'active')
        ->where('visibility', 'public')
        ->with(['platforms:id,name,slug'])
        ->first();

    if (!$model) {
        return null;
    }

    $league = $this->toDomainEntity($model);

    // Get competition count
    $competitionsCount = CompetitionModel::query()
        ->where('league_id', $model->id)
        ->whereNull('deleted_at')
        ->where('status', '!=', 'archived')
        ->count();

    // Get active seasons count across all competitions
    $activeSeasonsCount = SeasonModel::query()
        ->whereHas('competition', function ($q) use ($model) {
            $q->where('league_id', $model->id)
              ->whereNull('deleted_at');
        })
        ->where('status', 'active')
        ->whereNull('deleted_at')
        ->count();

    // Get total unique drivers count
    $driversCount = LeagueDriverModel::query()
        ->where('league_id', $model->id)
        ->whereNull('deleted_at')
        ->count();

    return [
        'league' => $league,
        'platforms' => $model->platforms->map(fn ($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'slug' => $p->slug,
        ])->toArray(),
        'competitions_count' => $competitionsCount,
        'active_seasons_count' => $activeSeasonsCount,
        'drivers_count' => $driversCount,
    ];
}
```

---

### Step 4: Add Competition Repository Methods

**File**: `app/Domain/Competition/Repositories/CompetitionRepositoryInterface.php`

Add:

```php
/**
 * Get all active competitions for a league with their seasons.
 *
 * @param int $leagueId
 * @return array<array{
 *   competition: Competition,
 *   platform: array{id: int, name: string, slug: string},
 *   stats: array{total_seasons: int, active_seasons: int, total_drivers: int},
 *   seasons: array
 * }>
 */
public function getPublicCompetitionsWithSeasons(int $leagueId): array;
```

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentCompetitionRepository.php`

Implement the method to fetch competitions with their seasons, including stats for each.

---

### Step 5: Add Methods for Sidebar Data

#### 5.1 Recent Activity

Query the `activity_log` table (from spatie/laravel-activitylog) for recent events:
- Race completed
- Driver joined season
- Season started
- Championship standings changes

**Add to LeagueApplicationService**:

```php
private function getRecentActivity(int $leagueId, int $limit = 5): array
{
    // Query activity_log for events related to this league
    // Filter by event types: race.completed, season_driver.created, season.activated
    // Return formatted PublicActivityData array
}
```

#### 5.2 Upcoming Races

Query rounds table for scheduled races:

```php
private function getUpcomingRaces(int $leagueId, int $limit = 3): array
{
    // Query rounds where:
    // - season belongs to competition in this league
    // - scheduled_at > now()
    // - status in ['scheduled', 'pre_race']
    // Order by scheduled_at ASC
    // Return formatted PublicUpcomingRaceData array
}
```

#### 5.3 Championship Leaders

Query standings for top drivers in active seasons:

```php
private function getChampionshipLeaders(int $leagueId, int $limit = 3): array
{
    // Query season standings where:
    // - season is active and belongs to this league
    // - Get top driver by points for each active season
    // Return formatted PublicChampionshipLeaderData array
}
```

---

### Step 6: Update Application Service

**File**: `app/Application/League/Services/LeagueApplicationService.php`

Add new method:

```php
/**
 * Get public league detail by slug.
 *
 * @param string $slug
 * @return PublicLeagueDetailData
 * @throws LeagueNotFoundException
 */
public function getPublicLeagueDetail(string $slug): PublicLeagueDetailData
{
    $result = $this->leagueRepository->findPublicBySlug($slug);

    if (!$result) {
        throw new LeagueNotFoundException("League not found: {$slug}");
    }

    $league = $result['league'];
    $leagueId = $league->id();

    // Get competitions with seasons
    $competitions = $this->competitionRepository->getPublicCompetitionsWithSeasons($leagueId);

    // Get sidebar data
    $recentActivity = $this->getRecentActivity($leagueId);
    $upcomingRaces = $this->getUpcomingRaces($leagueId);
    $championshipLeaders = $this->getChampionshipLeaders($leagueId);

    return new PublicLeagueDetailData(
        league: new PublicLeagueInfoData(
            id: $league->id(),
            name: $league->name()->value(),
            slug: $league->slug()->value(),
            tagline: $league->tagline()?->value(),
            description: $league->description(),
            logo_url: $league->logoPath()
                ? Storage::disk('public')->url($league->logoPath())
                : null,
            header_image_url: $league->headerImagePath()
                ? Storage::disk('public')->url($league->headerImagePath())
                : null,
            platforms: $result['platforms'],
            visibility: $league->visibility()->value(),
            discord_url: $league->discordUrl(),
            website_url: $league->websiteUrl(),
            twitter_handle: $league->twitterHandle(),
            youtube_url: $league->youtubeUrl(),
            twitch_url: $league->twitchUrl(),
            created_at: $league->createdAt()?->format('Y-m-d') ?? '',
        ),
        stats: new PublicLeagueStatsData(
            competitions_count: $result['competitions_count'],
            active_seasons_count: $result['active_seasons_count'],
            drivers_count: $result['drivers_count'],
        ),
        competitions: $this->mapCompetitionsToDto($competitions),
        recent_activity: $recentActivity,
        upcoming_races: $upcomingRaces,
        championship_leaders: $championshipLeaders,
    );
}
```

---

### Step 7: Update Controller

**File**: `app/Http/Controllers/Public/PublicLeagueController.php`

Add `show()` method:

```php
/**
 * Get public league detail by slug.
 */
public function show(string $slug): JsonResponse
{
    try {
        $leagueDetail = $this->leagueService->getPublicLeagueDetail($slug);
        return ApiResponse::success($leagueDetail->toArray());
    } catch (LeagueNotFoundException $e) {
        return ApiResponse::error($e->getMessage(), null, 404);
    }
}
```

---

### Step 8: Add Route

**File**: `routes/subdomain.php`

In the public routes section (around line 322-325), add:

```php
Route::prefix('public')->name('public.')->group(function () {
    Route::get('/leagues', [PublicLeagueController::class, 'index'])->name('leagues.index');
    Route::get('/leagues/{slug}', [PublicLeagueController::class, 'show'])->name('leagues.show'); // NEW
    Route::get('/platforms', [PublicPlatformController::class, 'index'])->name('platforms.index');
});
```

---

### Step 9: Create Exception (if not exists)

**File**: `app/Domain/League/Exceptions/LeagueNotFoundException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\League\Exceptions;

use Exception;

final class LeagueNotFoundException extends Exception
{
}
```

---

## API Response Example

**Request**: `GET /api/public/leagues/gt-masters-cup`

**Response**:

```json
{
  "success": true,
  "data": {
    "league": {
      "id": 1,
      "name": "GT Masters Cup",
      "slug": "gt-masters-cup",
      "tagline": "Elite GT racing series for the most dedicated sim racers",
      "description": "Welcome to GT Masters Cup! We host competitive GT racing...",
      "logo_url": "https://example.com/storage/leagues/1/logo.png",
      "header_image_url": "https://example.com/storage/leagues/1/header.jpg",
      "platforms": [
        {"id": 1, "name": "Gran Turismo 7", "slug": "gt7"}
      ],
      "visibility": "public",
      "discord_url": "https://discord.gg/example",
      "website_url": null,
      "twitter_handle": "gtmasterscup",
      "youtube_url": "https://youtube.com/@gtmasterscup",
      "twitch_url": null,
      "created_at": "2024-12-01"
    },
    "stats": {
      "competitions_count": 6,
      "active_seasons_count": 4,
      "drivers_count": 78
    },
    "competitions": [
      {
        "id": 1,
        "name": "Formula 1",
        "slug": "formula-1",
        "description": "Premier open-wheel racing championship",
        "logo_url": null,
        "competition_colour": "{\"r\":239,\"g\":68,\"b\":68}",
        "platform": {"id": 1, "name": "Gran Turismo 7", "slug": "gt7"},
        "stats": {
          "total_seasons": 3,
          "active_seasons": 1,
          "total_drivers": 32
        },
        "seasons": [
          {
            "id": 1,
            "name": "Season 5 - 2025",
            "slug": "season-5-2025",
            "car_class": "F1",
            "status": "active",
            "stats": {
              "total_drivers": 32,
              "active_drivers": 30,
              "total_rounds": 22,
              "completed_rounds": 7,
              "next_race_date": "2024-12-15T19:00:00Z"
            }
          },
          {
            "id": 2,
            "name": "Season 4 - 2024",
            "slug": "season-4-2024",
            "car_class": "F1",
            "status": "completed",
            "stats": {
              "total_drivers": 32,
              "active_drivers": 32,
              "total_rounds": 22,
              "completed_rounds": 22,
              "next_race_date": null
            }
          }
        ]
      }
    ],
    "recent_activity": [
      {
        "type": "race_completed",
        "title": "Race completed",
        "subtitle": "F1 Season 5 • Round 7",
        "timestamp": "2024-12-10T21:30:00Z",
        "icon_type": "success"
      },
      {
        "type": "driver_joined",
        "title": "New driver joined",
        "subtitle": "Marcus Weber • GT3 Sprint",
        "timestamp": "2024-12-10T16:00:00Z",
        "icon_type": "info"
      }
    ],
    "upcoming_races": [
      {
        "id": 15,
        "track_name": "Spa-Francorchamps",
        "season_name": "Season 5 - 2025",
        "competition_name": "Formula 1",
        "scheduled_at": "2024-12-15T19:00:00Z",
        "drivers_registered": 32,
        "is_next": true
      },
      {
        "id": 22,
        "track_name": "Monza",
        "season_name": "Season 2 - 2025",
        "competition_name": "GT3 Sprint Series",
        "scheduled_at": "2024-12-18T20:00:00Z",
        "drivers_registered": 24,
        "is_next": false
      }
    ],
    "championship_leaders": [
      {
        "position": 1,
        "driver_name": "Alex Chen",
        "season_name": "F1 Season 5",
        "points": 156
      },
      {
        "position": 2,
        "driver_name": "Marcus Weber",
        "season_name": "F1 Season 5",
        "points": 142
      }
    ]
  }
}
```

---

## Testing

### Unit Tests

1. **LeagueApplicationServiceTest**
   - `test_get_public_league_detail_returns_data_for_valid_slug()`
   - `test_get_public_league_detail_throws_exception_for_invalid_slug()`
   - `test_get_public_league_detail_excludes_private_leagues()`
   - `test_get_public_league_detail_excludes_archived_leagues()`

2. **EloquentLeagueRepositoryTest**
   - `test_find_public_by_slug_returns_league_with_stats()`
   - `test_find_public_by_slug_returns_null_for_private_league()`

### Feature Tests

1. **PublicLeagueControllerTest**
   - `test_show_returns_league_detail_for_valid_slug()`
   - `test_show_returns_404_for_invalid_slug()`
   - `test_show_returns_404_for_private_league()`
   - `test_show_returns_correct_stats()`
   - `test_show_returns_competitions_with_seasons()`

---

## Files Summary

| File | Action |
|------|--------|
| `app/Application/League/DTOs/PublicLeagueDetailData.php` | Create |
| `app/Application/League/DTOs/PublicLeagueInfoData.php` | Create |
| `app/Application/League/DTOs/PublicLeagueStatsData.php` | Create |
| `app/Application/League/DTOs/PublicCompetitionDetailData.php` | Create |
| `app/Application/League/DTOs/PublicSeasonSummaryData.php` | Create |
| `app/Application/League/DTOs/PublicActivityData.php` | Create |
| `app/Application/League/DTOs/PublicUpcomingRaceData.php` | Create |
| `app/Application/League/DTOs/PublicChampionshipLeaderData.php` | Create |
| `app/Domain/League/Repositories/LeagueRepositoryInterface.php` | Modify |
| `app/Domain/League/Exceptions/LeagueNotFoundException.php` | Create |
| `app/Domain/Competition/Repositories/CompetitionRepositoryInterface.php` | Modify |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueRepository.php` | Modify |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentCompetitionRepository.php` | Modify |
| `app/Application/League/Services/LeagueApplicationService.php` | Modify |
| `app/Http/Controllers/Public/PublicLeagueController.php` | Modify |
| `routes/subdomain.php` | Modify |
| `tests/Unit/Application/League/LeagueApplicationServiceTest.php` | Modify |
| `tests/Feature/Http/Controllers/Public/PublicLeagueControllerTest.php` | Create |
