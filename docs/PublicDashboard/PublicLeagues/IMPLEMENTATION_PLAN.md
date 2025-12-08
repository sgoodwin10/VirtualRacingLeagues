# Public Leagues Page - Implementation Plan

## Overview

This document outlines the implementation plan for connecting the `PublicLeaguesView.vue` page with real data from a backend API. The implementation follows DDD architecture on the backend and Vue 3 Composition API patterns on the frontend.

### Goals
- Create public API endpoints for fetching leagues and platforms
- Replace mock data with real API calls
- Use existing common components (VrlSearchBar, VrlFilterChips, VrlLeagueCard, VrlPagination)
- Support search, platform filtering, and pagination
- Maintain URL query parameter synchronization

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vue 3)                            │
├─────────────────────────────────────────────────────────────────────┤
│  PublicLeaguesView.vue                                              │
│       ↓                                                             │
│  usePublicLeagues composable                                        │
│       ↓                                                             │
│  publicApi service                                                  │
│       ↓                                                             │
│  HTTP Request (axios)                                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ API Call
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Laravel)                           │
├─────────────────────────────────────────────────────────────────────┤
│  Routes (routes/subdomain.php)                                      │
│       ↓                                                             │
│  PublicLeagueController (Interface Layer)                           │
│       ↓                                                             │
│  LeagueApplicationService (Application Layer)                       │
│       ↓                                                             │
│  EloquentLeagueRepository (Infrastructure Layer)                    │
│       ↓                                                             │
│  League Entity (Domain Layer)                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Backend Implementation

### 1.1 Repository Interface Update

**File: `app/Domain/League/Repositories/LeagueRepositoryInterface.php`**

Add method for fetching paginated public leagues:

```php
/**
 * Get paginated public leagues (visibility = public, status = active)
 *
 * @param int $page Current page number
 * @param int $perPage Number of items per page
 * @param array<string, mixed> $filters Search and filter criteria
 * @return array{data: array<int, array{league: League, competitions_count: int, drivers_count: int}>, total: int, per_page: int, current_page: int, last_page: int}
 */
public function getPaginatedPublic(int $page, int $perPage = 12, array $filters = []): array;
```

### 1.2 Eloquent Repository Implementation

**File: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueRepository.php`**

```php
public function getPaginatedPublic(int $page, int $perPage = 12, array $filters = []): array
{
    $query = LeagueEloquent::query()
        ->withCount([
            'competitions as competitions_count',
            'drivers as drivers_count',
        ])
        ->where('visibility', 'public')
        ->where('status', 'active');

    // Apply search filter
    if (!empty($filters['search'])) {
        $search = trim($filters['search']);
        $query->where('name', 'like', "%{$search}%");
    }

    // Apply platform filter
    if (!empty($filters['platform_id'])) {
        $platformId = (int) $filters['platform_id'];
        $query->whereJsonContains('platform_ids', $platformId);
    }

    // Order by name alphabetically
    $query->orderBy('name', 'asc');

    // Get total count before pagination
    $total = $query->count();
    $lastPage = (int) ceil($total / $perPage);

    // Apply pagination
    $offset = ($page - 1) * $perPage;
    $eloquentLeagues = $query->skip($offset)->take($perPage)->get();

    // Map to domain entities with counts
    $leagues = [];
    foreach ($eloquentLeagues as $eloquentLeague) {
        $leagues[] = [
            'league' => $this->toDomainEntity($eloquentLeague),
            'competitions_count' => $eloquentLeague->competitions_count ?? 0,
            'drivers_count' => $eloquentLeague->drivers_count ?? 0,
        ];
    }

    return [
        'data' => $leagues,
        'total' => $total,
        'per_page' => $perPage,
        'current_page' => $page,
        'last_page' => $lastPage,
    ];
}
```

### 1.3 Public League DTO

**File: `app/Application/League/DTOs/PublicLeagueData.php`**

```php
<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Domain\League\Entities\League;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Data;

/**
 * Public League DTO - excludes sensitive fields like owner info
 */
final class PublicLeagueData extends Data
{
    /**
     * @param array<int, array{id: int, name: string, slug: string}> $platforms
     */
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?string $tagline,
        public ?string $description,
        public ?string $logo_url,
        public ?string $header_image_url,
        public array $platforms,
        public ?string $discord_url,
        public ?string $website_url,
        public ?string $twitter_handle,
        public ?string $instagram_handle,
        public ?string $youtube_url,
        public ?string $twitch_url,
        public int $competitions_count,
        public int $drivers_count,
    ) {}

    /**
     * Create from domain entity with platform data and counts
     *
     * @param League $league
     * @param array<int, array{id: int, name: string, slug: string}> $platforms
     * @param int $competitionsCount
     * @param int $driversCount
     * @return self
     */
    public static function fromEntity(
        League $league,
        array $platforms,
        int $competitionsCount,
        int $driversCount
    ): self {
        $logoUrl = $league->logoPath()
            ? Storage::disk('public')->url($league->logoPath())
            : null;

        $headerImageUrl = $league->headerImagePath()
            ? Storage::disk('public')->url($league->headerImagePath())
            : null;

        return new self(
            id: $league->id(),
            name: $league->name()->value(),
            slug: $league->slug()->value(),
            tagline: $league->tagline()?->value(),
            description: $league->description(),
            logo_url: $logoUrl,
            header_image_url: $headerImageUrl,
            platforms: $platforms,
            discord_url: $league->discordUrl(),
            website_url: $league->websiteUrl(),
            twitter_handle: $league->twitterHandle(),
            instagram_handle: $league->instagramHandle(),
            youtube_url: $league->youtubeUrl(),
            twitch_url: $league->twitchUrl(),
            competitions_count: $competitionsCount,
            drivers_count: $driversCount,
        );
    }
}
```

### 1.4 Application Service Method

**File: `app/Application/League/Services/LeagueApplicationService.php`**

Add method:

```php
/**
 * Get paginated public leagues (no authentication required)
 *
 * @param int $page Current page number
 * @param int $perPage Number of items per page
 * @param array<string, mixed> $filters Search and filter criteria
 * @return array{data: array<int, mixed>, meta: array<string, int>, links: array<string, string|null>}
 */
public function getPublicLeagues(int $page, int $perPage = 12, array $filters = []): array
{
    $result = $this->leagueRepository->getPaginatedPublic($page, $perPage, $filters);

    // Convert to public DTOs with platform data
    $leagueDTOs = array_map(
        function (array $item) {
            $league = $item['league'];
            $platforms = $this->fetchPlatformData($league->platformIds());

            return PublicLeagueData::fromEntity(
                $league,
                $platforms,
                $item['competitions_count'],
                $item['drivers_count']
            );
        },
        $result['data']
    );

    return [
        'data' => array_map(fn($dto) => $dto->toArray(), $leagueDTOs),
        'meta' => [
            'total' => $result['total'],
            'per_page' => $result['per_page'],
            'current_page' => $result['current_page'],
            'last_page' => $result['last_page'],
        ],
    ];
}
```

### 1.5 Form Request Validation

**File: `app/Http/Requests/Public/IndexPublicLeaguesRequest.php`**

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

final class IndexPublicLeaguesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // No authentication required
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'platform_id' => ['nullable', 'integer', 'exists:platforms,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getFilters(): array
    {
        return array_filter([
            'search' => $this->input('search'),
            'platform_id' => $this->input('platform_id'),
        ]);
    }

    public function getPerPage(): int
    {
        return (int) $this->input('per_page', 12);
    }

    public function getPage(): int
    {
        return (int) $this->input('page', 1);
    }
}
```

### 1.6 Public Controllers

**File: `app/Http/Controllers/Public/PublicLeagueController.php`**

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Application\League\Services\LeagueApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\IndexPublicLeaguesRequest;
use Illuminate\Http\JsonResponse;

final class PublicLeagueController extends Controller
{
    public function __construct(
        private readonly LeagueApplicationService $leagueService
    ) {}

    public function index(IndexPublicLeaguesRequest $request): JsonResponse
    {
        $result = $this->leagueService->getPublicLeagues(
            $request->getPage(),
            $request->getPerPage(),
            $request->getFilters()
        );

        return ApiResponse::success($result);
    }
}
```

**File: `app/Http/Controllers/Public/PublicPlatformController.php`**

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use Illuminate\Http\JsonResponse;

final class PublicPlatformController extends Controller
{
    public function index(): JsonResponse
    {
        $platforms = Platform::query()
            ->active()
            ->ordered()
            ->get(['id', 'name', 'slug']);

        return ApiResponse::success($platforms->toArray());
    }
}
```

### 1.7 Routes

**File: `routes/subdomain.php`**

Add under the public domain section:

```php
use App\Http\Controllers\Public\PublicLeagueController;
use App\Http\Controllers\Public\PublicPlatformController;

// Inside Route::domain($baseDomain)->middleware('web')->group(function () {

    // Public API routes (no authentication required)
    Route::prefix('api/public')->name('public.api.')->group(function () {
        Route::get('/leagues', [PublicLeagueController::class, 'index'])->name('leagues.index');
        Route::get('/platforms', [PublicPlatformController::class, 'index'])->name('platforms.index');
    });

    // Existing routes...
```

---

## Part 2: Frontend Implementation

### 2.1 API Service

**File: `resources/public/js/services/publicApi.ts`**

```typescript
import axios, { type AxiosInstance } from 'axios';
import type { PublicLeague, Platform } from '@public/types/public';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface FetchLeaguesParams {
  page?: number;
  per_page?: number;
  search?: string;
  platform_id?: number;
}

class PublicApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/public',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  async fetchLeagues(params: FetchLeaguesParams = {}): Promise<PaginatedResponse<PublicLeague>> {
    const response = await this.client.get<PaginatedResponse<PublicLeague>>('/leagues', {
      params: {
        page: params.page ?? 1,
        per_page: params.per_page ?? 12,
        search: params.search || undefined,
        platform_id: params.platform_id || undefined,
      },
    });
    return response.data;
  }

  async fetchPlatforms(): Promise<Platform[]> {
    const response = await this.client.get<Platform[]>('/platforms');
    return response.data;
  }
}

export const publicApi = new PublicApiService();
```

### 2.2 Composable

**File: `resources/public/js/composables/usePublicLeagues.ts`**

```typescript
import { ref, computed, type Ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  publicApi,
  type FetchLeaguesParams,
  type PaginationMeta,
} from '@public/services/publicApi';
import type { PublicLeague, Platform } from '@public/types/public';

export interface UsePublicLeaguesOptions {
  syncWithUrl?: boolean;
}

export function usePublicLeagues(options: UsePublicLeaguesOptions = {}) {
  const router = useRouter();
  const route = useRoute();
  const { syncWithUrl = true } = options;

  // Data refs
  const leagues = ref<PublicLeague[]>([]);
  const platforms = ref<Platform[]>([]);
  const paginationMeta = ref<PaginationMeta | null>(null);

  // State refs
  const isLoading = ref(false);
  const isLoadingPlatforms = ref(false);
  const error = ref<string | null>(null);

  // Filter refs
  const currentPage = ref(1);
  const perPage = ref(12);
  const searchQuery = ref('');
  const selectedPlatformId = ref<number | null>(null);

  // Computed values
  const totalPages = computed(() => paginationMeta.value?.last_page ?? 0);
  const totalRecords = computed(() => paginationMeta.value?.total ?? 0);
  const isEmpty = computed(() => !isLoading.value && leagues.value.length === 0);
  const hasResults = computed(() => leagues.value.length > 0);

  function initializeFromUrl(): void {
    if (!syncWithUrl) return;
    const page = Number(route.query.page);
    const search = route.query.search as string;
    const platformId = Number(route.query.platform);

    if (page && page > 0) currentPage.value = page;
    if (search) searchQuery.value = search;
    if (platformId && platformId > 0) selectedPlatformId.value = platformId;
  }

  function updateUrl(): void {
    if (!syncWithUrl) return;
    const query: Record<string, string> = {};

    if (currentPage.value > 1) query.page = String(currentPage.value);
    if (searchQuery.value) query.search = searchQuery.value;
    if (selectedPlatformId.value) query.platform = String(selectedPlatformId.value);

    router.replace({ query });
  }

  async function fetchLeagues(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const params: FetchLeaguesParams = {
        page: currentPage.value,
        per_page: perPage.value,
      };

      if (searchQuery.value.trim()) {
        params.search = searchQuery.value.trim();
      }

      if (selectedPlatformId.value) {
        params.platform_id = selectedPlatformId.value;
      }

      const response = await publicApi.fetchLeagues(params);
      leagues.value = response.data;
      paginationMeta.value = response.meta;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch leagues';
      leagues.value = [];
      paginationMeta.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchPlatforms(): Promise<void> {
    isLoadingPlatforms.value = true;
    try {
      platforms.value = await publicApi.fetchPlatforms();
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
      platforms.value = [];
    } finally {
      isLoadingPlatforms.value = false;
    }
  }

  function handleSearch(query: string): void {
    searchQuery.value = query;
    currentPage.value = 1;
    updateUrl();
    fetchLeagues();
  }

  function handlePlatformChange(platformId: number | null): void {
    selectedPlatformId.value = platformId;
    currentPage.value = 1;
    updateUrl();
    fetchLeagues();
  }

  function handlePageChange(page: number): void {
    currentPage.value = page;
    updateUrl();
    fetchLeagues();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePerPageChange(value: number): void {
    perPage.value = value;
    currentPage.value = 1;
    updateUrl();
    fetchLeagues();
  }

  // Initialize from URL
  initializeFromUrl();

  return {
    leagues,
    platforms,
    isLoading,
    isLoadingPlatforms,
    error,
    currentPage,
    perPage,
    totalPages,
    totalRecords,
    searchQuery,
    selectedPlatformId,
    isEmpty,
    hasResults,
    fetchLeagues,
    fetchPlatforms,
    handleSearch,
    handlePlatformChange,
    handlePageChange,
    handlePerPageChange,
  };
}
```

### 2.3 View Refactoring

**File: `resources/public/js/views/leagues/PublicLeaguesView.vue`**

The view should be updated to:
1. Remove all mock data
2. Import and use the `usePublicLeagues` composable
3. Replace custom search/filter/pagination with common components:
   - `VrlSearchBar` from `@public/components/common/forms/VrlSearchBar.vue`
   - `VrlFilterChips` from `@public/components/common/forms/VrlFilterChips.vue`
   - `VrlLeagueCard` from `@public/components/common/cards/VrlLeagueCard.vue`
   - `VrlPagination` from `@public/components/common/data-display/VrlPagination.vue`
4. Add proper loading, error, and empty states
5. Use `useDebounceFn` from VueUse for search debouncing

---

## Part 3: Testing Requirements

### Backend Tests

**File: `tests/Feature/Api/Public/PublicLeagueControllerTest.php`**

Test cases:
- `test_index_returns_only_public_active_leagues`
- `test_index_excludes_private_leagues`
- `test_index_excludes_inactive_leagues`
- `test_index_supports_search_filter`
- `test_index_supports_platform_filter`
- `test_index_supports_pagination`
- `test_index_validates_request_parameters`
- `test_index_does_not_expose_sensitive_fields`

**File: `tests/Feature/Api/Public/PublicPlatformControllerTest.php`**

Test cases:
- `test_index_returns_active_platforms_only`
- `test_index_returns_platforms_ordered_by_name`

### Frontend Tests

**File: `resources/public/js/services/__tests__/publicApi.test.ts`**

Test cases:
- Fetch leagues with default parameters
- Fetch leagues with search parameter
- Fetch leagues with platform filter
- Handle API errors gracefully
- Fetch all platforms

**File: `resources/public/js/composables/__tests__/usePublicLeagues.test.ts`**

Test cases:
- Initialize with default values
- Fetch leagues successfully
- Handle fetch errors
- Handle search and reset to page 1
- Handle platform change and reset to page 1
- Handle pagination
- Calculate isEmpty and hasResults correctly

**File: `resources/public/js/views/leagues/__tests__/PublicLeaguesView.test.ts`**

Test cases:
- Render hero section
- Fetch platforms and leagues on mount
- Render league cards when data loaded
- Show loading state initially
- Show empty state when no leagues
- Show error state when fetch fails
- Handle search input with debounce
- Handle platform filter change
- Handle pagination change

---

## Part 4: Implementation Checklist

### Backend Tasks
- [ ] Add `getPaginatedPublic()` to `LeagueRepositoryInterface.php`
- [ ] Implement `getPaginatedPublic()` in `EloquentLeagueRepository.php`
- [ ] Create `PublicLeagueData.php` DTO
- [ ] Add `getPublicLeagues()` to `LeagueApplicationService.php`
- [ ] Create `IndexPublicLeaguesRequest.php` form request
- [ ] Create `PublicLeagueController.php`
- [ ] Create `PublicPlatformController.php`
- [ ] Add routes to `routes/subdomain.php`
- [ ] Write feature tests
- [ ] Run `composer test` - all tests pass
- [ ] Run `composer phpstan` - no errors
- [ ] Run `composer phpcs` - no errors

### Frontend Tasks
- [ ] Create `resources/public/js/services/publicApi.ts`
- [ ] Create `resources/public/js/composables/usePublicLeagues.ts`
- [ ] Refactor `PublicLeaguesView.vue` to use composable and common components
- [ ] Write unit tests for API service
- [ ] Write unit tests for composable
- [ ] Write component tests for view
- [ ] Run `npm run test` - all tests pass
- [ ] Run `npm run type-check` - no errors
- [ ] Run `npm run lint` - no errors

### Integration Testing
- [ ] Test search functionality end-to-end
- [ ] Test platform filtering end-to-end
- [ ] Test pagination end-to-end
- [ ] Test URL query parameter sync
- [ ] Test loading/error/empty states
- [ ] Test on mobile responsive

---

## API Reference

### GET /api/public/leagues

Fetch paginated public leagues.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Current page number |
| per_page | integer | No | 12 | Items per page (max 100) |
| search | string | No | - | Search by league name |
| platform_id | integer | No | - | Filter by platform ID |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "GT7 Racing League",
      "slug": "gt7-racing-league",
      "tagline": "Competitive GT7 racing",
      "description": "Weekly races every Sunday",
      "logo_url": "https://example.com/storage/leagues/logos/abc123.png",
      "header_image_url": "https://example.com/storage/leagues/headers/def456.jpg",
      "platforms": [
        {"id": 1, "name": "GT7", "slug": "gt7"}
      ],
      "discord_url": "https://discord.gg/example",
      "website_url": "https://example.com",
      "twitter_handle": "gt7league",
      "instagram_handle": null,
      "youtube_url": null,
      "twitch_url": null,
      "competitions_count": 3,
      "drivers_count": 24
    }
  ],
  "meta": {
    "total": 50,
    "per_page": 12,
    "current_page": 1,
    "last_page": 5
  }
}
```

### GET /api/public/platforms

Fetch all active platforms.

**Response:**
```json
[
  {"id": 1, "name": "GT7", "slug": "gt7"},
  {"id": 2, "name": "iRacing", "slug": "iracing"},
  {"id": 3, "name": "ACC", "slug": "acc"}
]
```

---

## Security Considerations

1. **Data Exposure**: Only public leagues (visibility='public', status='active') are returned
2. **No Sensitive Fields**: Owner ID, internal settings, and status are excluded from response
3. **Input Validation**: All query parameters are validated with strict rules
4. **Rate Limiting**: Consider adding throttle middleware for production
5. **Database Indexes**: Ensure proper indexing on visibility, status, name, and platform_ids columns
