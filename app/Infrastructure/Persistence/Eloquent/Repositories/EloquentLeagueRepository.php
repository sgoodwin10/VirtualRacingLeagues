<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\League\Entities\League;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueSlug;
use App\Domain\League\ValueObjects\LeagueVisibility;
use App\Domain\League\ValueObjects\Tagline;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Infrastructure\Persistence\Eloquent\Models\Competition as CompetitionModel;
use App\Infrastructure\Persistence\Eloquent\Models\League as LeagueEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use Illuminate\Database\Eloquent\Builder;

/**
 * Eloquent implementation of League Repository.
 * Maps between domain entities and Eloquent models.
 */
final class EloquentLeagueRepository implements LeagueRepositoryInterface
{
    public function findById(int $id): League
    {
        $eloquentLeague = LeagueEloquent::withTrashed()->find($id);

        if ($eloquentLeague === null) {
            throw LeagueNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquentLeague);
    }

    public function findByIdOrNull(int $id): ?League
    {
        $eloquentLeague = LeagueEloquent::withTrashed()->find($id);

        if ($eloquentLeague === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentLeague);
    }

    public function findBySlug(string $slug): League
    {
        $eloquentLeague = LeagueEloquent::withTrashed()->where('slug', $slug)->first();

        if ($eloquentLeague === null) {
            throw LeagueNotFoundException::withSlug($slug);
        }

        return $this->toDomainEntity($eloquentLeague);
    }

    public function findBySlugOrNull(string $slug): ?League
    {
        $eloquentLeague = LeagueEloquent::withTrashed()->where('slug', $slug)->first();

        if ($eloquentLeague === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentLeague);
    }

    public function isSlugAvailable(string $slug, ?int $excludeLeagueId = null): bool
    {
        $query = LeagueEloquent::withTrashed()->where('slug', $slug);

        if ($excludeLeagueId !== null) {
            $query->where('id', '!=', $excludeLeagueId);
        }

        return ! $query->exists();
    }

    public function findByUserId(int $userId): array
    {
        $eloquentLeagues = LeagueEloquent::where('owner_user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return $eloquentLeagues->map(fn ($eloquentLeague) => $this->toDomainEntity($eloquentLeague))->all();
    }

    public function findByIdWithCounts(int $id): array
    {
        /** @var LeagueEloquent|null $eloquentLeague */
        $eloquentLeague = LeagueEloquent::withTrashed()
            ->withCount([
                'competitions as competitions_count',
                'drivers as drivers_count',
            ])
            ->find($id);

        if ($eloquentLeague === null) {
            throw LeagueNotFoundException::withId($id);
        }

        /** @var int $competitionsCount */
        $competitionsCount = $eloquentLeague->competitions_count ?? 0;
        /** @var int $driversCount */
        $driversCount = $eloquentLeague->drivers_count ?? 0;

        // Calculate active seasons count and total races count
        $competitionIds = CompetitionModel::where('league_id', $id)->pluck('id')->toArray();

        $activeSeasonsCount = 0;
        $totalRacesCount = 0;

        if (! empty($competitionIds)) {
            // Active seasons count
            $activeSeasonsCount = SeasonEloquent::whereIn('competition_id', $competitionIds)
                ->where('status', 'active')
                ->count();

            // Total races count
            $seasonIds = SeasonEloquent::whereIn('competition_id', $competitionIds)
                ->pluck('id')
                ->toArray();

            if (! empty($seasonIds)) {
                $roundIds = Round::whereIn('season_id', $seasonIds)
                    ->pluck('id')
                    ->toArray();

                if (! empty($roundIds)) {
                    $totalRacesCount = Race::whereIn('round_id', $roundIds)->count();
                }
            }
        }

        return [
            'league' => $this->toDomainEntity($eloquentLeague),
            'competitions_count' => $competitionsCount,
            'drivers_count' => $driversCount,
            'active_seasons_count' => $activeSeasonsCount,
            'total_races_count' => $totalRacesCount,
        ];
    }

    public function findByUserIdWithCounts(int $userId): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, LeagueEloquent> $eloquentLeagues */
        $eloquentLeagues = LeagueEloquent::where('owner_user_id', $userId)
            ->withCount([
                'competitions as competitions_count',
                'drivers as drivers_count',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all league IDs to batch calculate seasons and races counts
        $leagueIds = $eloquentLeagues->pluck('id')->toArray();

        // Batch calculate active seasons and total races for all leagues
        $seasonsAndRacesCounts = $this->calculateSeasonsAndRacesCounts($leagueIds);

        return $eloquentLeagues->map(function (LeagueEloquent $eloquentLeague) use ($seasonsAndRacesCounts) {
            /** @var int $competitionsCount */
            $competitionsCount = $eloquentLeague->competitions_count ?? 0;
            /** @var int $driversCount */
            $driversCount = $eloquentLeague->drivers_count ?? 0;

            $leagueId = $eloquentLeague->id;
            $activeSeasonsCount = $seasonsAndRacesCounts[$leagueId]['active_seasons_count'] ?? 0;
            $totalRacesCount = $seasonsAndRacesCounts[$leagueId]['total_races_count'] ?? 0;

            return [
                'league' => $this->toDomainEntity($eloquentLeague),
                'competitions_count' => $competitionsCount,
                'drivers_count' => $driversCount,
                'active_seasons_count' => $activeSeasonsCount,
                'total_races_count' => $totalRacesCount,
            ];
        })->all();
    }

    public function countByUserId(int $userId): int
    {
        return LeagueEloquent::where('owner_user_id', $userId)->count();
    }

    public function all(array $filters = []): array
    {
        $query = LeagueEloquent::query();

        $this->applyFilters($query, $filters);

        $eloquentLeagues = $query->get();

        return $eloquentLeagues->map(fn ($eloquentLeague) => $this->toDomainEntity($eloquentLeague))->all();
    }

    public function save(League $league): void
    {
        if ($league->id() === null) {
            // Create new
            $eloquentLeague = new LeagueEloquent();
            $this->fillEloquentModel($eloquentLeague, $league);

            $eloquentLeague->save();

            // Set ID on domain entity
            $league->setId($eloquentLeague->id);
        } else {
            // Update existing
            $eloquentLeague = LeagueEloquent::withTrashed()->find($league->id());

            if ($eloquentLeague === null) {
                throw LeagueNotFoundException::withId($league->id());
            }

            $this->fillEloquentModel($eloquentLeague, $league);

            $eloquentLeague->save();
        }
    }

    public function update(League $league): void
    {
        if ($league->id() === null) {
            throw new \InvalidArgumentException('Cannot update a league without an ID');
        }

        $eloquentLeague = LeagueEloquent::withTrashed()->find($league->id());

        if ($eloquentLeague === null) {
            throw LeagueNotFoundException::withId($league->id());
        }

        $eloquentLeague->name = $league->name()->value();
        $eloquentLeague->slug = $league->slug()->value();
        $eloquentLeague->logo_path = $league->logoPath();
        $eloquentLeague->timezone = $league->timezone();
        $eloquentLeague->tagline = $league->tagline()?->value();
        $eloquentLeague->description = $league->description();
        $eloquentLeague->header_image_path = $league->headerImagePath();
        $eloquentLeague->banner_path = $league->bannerPath();
        $eloquentLeague->platform_ids = $league->platformIds();
        $eloquentLeague->discord_url = $league->discordUrl();
        $eloquentLeague->website_url = $league->websiteUrl();
        $eloquentLeague->twitter_handle = $league->twitterHandle();
        $eloquentLeague->instagram_handle = $league->instagramHandle();
        $eloquentLeague->youtube_url = $league->youtubeUrl();
        $eloquentLeague->twitch_url = $league->twitchUrl();
        $eloquentLeague->facebook_handle = $league->facebookHandle();
        $eloquentLeague->visibility = $league->visibility()->value;
        $eloquentLeague->status = $league->status();
        $eloquentLeague->contact_email = $league->contactEmail()?->value();
        $eloquentLeague->organizer_name = $league->organizerName();

        $eloquentLeague->save();
    }

    public function delete(League $league): void
    {
        if ($league->id() === null) {
            return;
        }

        $eloquentLeague = LeagueEloquent::find($league->id());

        if ($eloquentLeague === null) {
            throw LeagueNotFoundException::withId($league->id());
        }

        $eloquentLeague->delete();
    }

    public function restore(League $league): void
    {
        if ($league->id() === null) {
            return;
        }

        $eloquentLeague = LeagueEloquent::withTrashed()->find($league->id());

        if ($eloquentLeague === null) {
            throw LeagueNotFoundException::withId($league->id());
        }

        $eloquentLeague->restore();
    }

    public function forceDelete(League $league): void
    {
        if ($league->id() === null) {
            return;
        }

        $eloquentLeague = LeagueEloquent::withTrashed()->find($league->id());

        if ($eloquentLeague === null) {
            throw LeagueNotFoundException::withId($league->id());
        }

        $eloquentLeague->forceDelete();
    }

    public function hardDeleteLeagueWithAssociations(int $leagueId): void
    {
        // Delete in correct order to respect foreign key constraints
        // Order: race_results -> races -> qualifiers -> rounds -> divisions -> teams -> season_drivers -> seasons -> competitions -> league_drivers -> leagues

        // Get all competition IDs for this league
        $competitionIds = CompetitionModel::where('league_id', $leagueId)->pluck('id')->toArray();

        if (! empty($competitionIds)) {
            // Get all season IDs for these competitions
            $seasonIds = SeasonEloquent::whereIn('competition_id', $competitionIds)->pluck('id')->toArray();

            if (! empty($seasonIds)) {
                // Get all round IDs for these seasons
                $roundIds = Round::whereIn('season_id', $seasonIds)->pluck('id')->toArray();

                if (! empty($roundIds)) {
                    // Get all race IDs for these rounds
                    $raceIds = Race::whereIn('round_id', $roundIds)->pluck('id')->toArray();

                    if (! empty($raceIds)) {
                        // 1. Delete race results first (depends on races)
                        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::whereIn('race_id', $raceIds)->delete();
                    }

                    // 2. Delete races (depends on rounds) - includes qualifiers
                    Race::whereIn('round_id', $roundIds)->delete();

                    // 3. Delete rounds (depends on seasons)
                    Round::whereIn('id', $roundIds)->delete();
                }

                // 4. Delete divisions (depends on seasons)
                \App\Infrastructure\Persistence\Eloquent\Models\Division::whereIn('season_id', $seasonIds)->delete();

                // 5. Delete teams (depends on seasons)
                \App\Infrastructure\Persistence\Eloquent\Models\Team::whereIn('season_id', $seasonIds)->delete();

                // 6. Delete season_drivers (depends on seasons and league_drivers)
                SeasonDriverEloquent::whereIn('season_id', $seasonIds)->delete();

                // 7. Delete season_round_tiebreaker_rules (depends on seasons)
                \App\Infrastructure\Persistence\Eloquent\Models\SeasonRoundTiebreakerRuleEloquent::whereIn('season_id', $seasonIds)->delete();

                // 8. Delete seasons (depends on competitions)
                SeasonEloquent::whereIn('id', $seasonIds)->delete();
            }

            // 9. Delete competitions (depends on leagues)
            CompetitionModel::whereIn('id', $competitionIds)->delete();
        }

        // 10. Delete league_drivers (depends on leagues)
        \App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent::where('league_id', $leagueId)->delete();

        // 11. Delete league_managers (depends on leagues) - using direct DB query since model doesn't exist
        \Illuminate\Support\Facades\DB::table('league_managers')->where('league_id', $leagueId)->delete();

        // 12. Finally, delete the league itself (with trashed)
        LeagueEloquent::withTrashed()->where('id', $leagueId)->forceDelete();
    }

    /**
     * Apply filters to query.
     *
     * @param  Builder<LeagueEloquent>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters['owner_user_id'])) {
            $query->where('owner_user_id', $filters['owner_user_id']);
        }

        if (isset($filters['visibility'])) {
            $query->where('visibility', $filters['visibility']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['include_deleted']) && $filters['include_deleted']) {
            $query->withTrashed();
        }

        if (isset($filters['only_deleted']) && $filters['only_deleted']) {
            $query->onlyTrashed();
        }

        // Default ordering
        if (! isset($filters['order_by'])) {
            $query->orderBy('created_at', 'desc');
        } else {
            // Validate order_by to prevent SQL injection
            $allowedOrderFields = ['id', 'name', 'slug', 'visibility', 'status', 'created_at', 'updated_at'];
            $orderBy = $filters['order_by'];
            if (! in_array($orderBy, $allowedOrderFields, true)) {
                $orderBy = 'created_at';
            }

            // Validate order_direction to prevent SQL injection
            $direction = strtolower($filters['order_direction'] ?? 'asc');
            if (! in_array($direction, ['asc', 'desc'], true)) {
                $direction = 'asc';
            }

            $query->orderBy($orderBy, $direction);
        }
    }

    /**
     * Map Eloquent model to domain entity.
     */
    private function toDomainEntity(LeagueEloquent $eloquentLeague): League
    {
        return League::reconstitute(
            id: $eloquentLeague->id,
            name: LeagueName::from($eloquentLeague->name),
            slug: LeagueSlug::from($eloquentLeague->slug),
            logoPath: $eloquentLeague->logo_path,
            ownerUserId: $eloquentLeague->owner_user_id,
            timezone: $eloquentLeague->timezone,
            contactEmail: $eloquentLeague->contact_email ? EmailAddress::from($eloquentLeague->contact_email) : null,
            organizerName: $eloquentLeague->organizer_name,
            tagline: Tagline::fromNullable($eloquentLeague->tagline),
            description: $eloquentLeague->description,
            headerImagePath: $eloquentLeague->header_image_path,
            bannerPath: $eloquentLeague->banner_path,
            platformIds: $eloquentLeague->platform_ids ?? [],
            discordUrl: $eloquentLeague->discord_url,
            websiteUrl: $eloquentLeague->website_url,
            twitterHandle: $eloquentLeague->twitter_handle,
            instagramHandle: $eloquentLeague->instagram_handle,
            youtubeUrl: $eloquentLeague->youtube_url,
            twitchUrl: $eloquentLeague->twitch_url,
            facebookHandle: $eloquentLeague->facebook_handle,
            visibility: LeagueVisibility::from($eloquentLeague->visibility),
            status: $eloquentLeague->status,
        );
    }

    /**
     * Fill Eloquent model from domain entity.
     */
    private function fillEloquentModel(LeagueEloquent $eloquentLeague, League $league): void
    {
        $eloquentLeague->name = $league->name()->value();
        $eloquentLeague->slug = $league->slug()->value();
        $eloquentLeague->tagline = $league->tagline()?->value();
        $eloquentLeague->description = $league->description();
        $eloquentLeague->logo_path = $league->logoPath();
        $eloquentLeague->header_image_path = $league->headerImagePath();
        $eloquentLeague->banner_path = $league->bannerPath();
        $eloquentLeague->platform_ids = $league->platformIds();
        $eloquentLeague->discord_url = $league->discordUrl();
        $eloquentLeague->website_url = $league->websiteUrl();
        $eloquentLeague->twitter_handle = $league->twitterHandle();
        $eloquentLeague->instagram_handle = $league->instagramHandle();
        $eloquentLeague->youtube_url = $league->youtubeUrl();
        $eloquentLeague->twitch_url = $league->twitchUrl();
        $eloquentLeague->facebook_handle = $league->facebookHandle();
        $eloquentLeague->visibility = $league->visibility()->value;
        $eloquentLeague->timezone = $league->timezone();
        $eloquentLeague->owner_user_id = $league->ownerUserId();
        $eloquentLeague->contact_email = $league->contactEmail()?->value();
        $eloquentLeague->organizer_name = $league->organizerName();
        $eloquentLeague->status = $league->status();
    }

    public function getPlatformsByLeagueId(int $leagueId): array
    {
        $league = LeagueEloquent::find($leagueId);

        if ($league === null) {
            throw LeagueNotFoundException::withId($leagueId);
        }

        $platformIds = $league->platform_ids ?? [];

        if (empty($platformIds)) {
            return [];
        }

        $platforms = Platform::whereIn('id', $platformIds)
            ->active()
            ->ordered()
            ->get();

        return $platforms->map(function ($platform) {
            return [
                'id' => $platform->id,
                'name' => $platform->name,
                'slug' => $platform->slug,
                'description' => $platform->description,
                'logo_url' => $platform->logo_url,
            ];
        })->all();
    }

    public function getPaginatedForAdmin(int $page, int $perPage, array $filters = []): array
    {
        /** @var Builder<LeagueEloquent> $query */
        $query = LeagueEloquent::query()
            ->with('owner:id,first_name,last_name,email')
            ->withCount([
                'competitions as competitions_count',
                'drivers as drivers_count',
            ]);

        // Apply search filter (search in name and slug)
        if (isset($filters['search']) && ! empty($filters['search'])) {
            // Escape LIKE wildcards to prevent injection
            $search = str_replace(['%', '_'], ['\\%', '\\_'], trim($filters['search']));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('slug', 'LIKE', "%{$search}%");
            });
        }

        // Apply visibility filter (exact match)
        if (isset($filters['visibility']) && ! empty($filters['visibility'])) {
            $query->where('visibility', $filters['visibility']);
        }

        // Apply status filter (exact match)
        if (isset($filters['status']) && ! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Apply platform filter (whereJsonContains for any of the selected platforms)
        if (isset($filters['platform_ids']) && ! empty($filters['platform_ids'])) {
            $platformIds = $filters['platform_ids'];
            $query->where(function ($q) use ($platformIds) {
                foreach ($platformIds as $platformId) {
                    $q->orWhereJsonContains('platform_ids', $platformId);
                }
            });
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'id';
        $sortDirection = strtolower($filters['sort_direction'] ?? 'desc');

        // Validate sort_by to prevent SQL injection
        $allowedSortFields = ['id', 'name', 'visibility', 'status', 'created_at', 'updated_at'];
        if (! in_array($sortBy, $allowedSortFields, true)) {
            $sortBy = 'id';
        }

        // Validate sort_direction to prevent SQL injection
        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'desc';
        }

        $query->orderBy($sortBy, $sortDirection);

        // Get total count before pagination
        $total = (clone $query)->count();

        // Calculate pagination metadata
        $lastPage = (int) ceil($total / $perPage);

        // Apply pagination
        $offset = ($page - 1) * $perPage;

        /** @var \Illuminate\Database\Eloquent\Collection<int, LeagueEloquent> $eloquentLeagues */
        $eloquentLeagues = $query->skip($offset)->take($perPage)->get();

        // Get league IDs for batch calculation
        $leagueIds = $eloquentLeagues->pluck('id')->toArray();

        // Batch calculate active seasons and total races for all leagues
        $seasonsAndRacesCounts = $this->calculateSeasonsAndRacesCounts($leagueIds);

        // Map to domain entities with counts
        $leagues = [];
        foreach ($eloquentLeagues as $eloquentLeague) {
            /** @var int $competitionsCount */
            $competitionsCount = $eloquentLeague->competitions_count ?? 0;
            /** @var int $driversCount */
            $driversCount = $eloquentLeague->drivers_count ?? 0;

            $leagueId = $eloquentLeague->id;
            $activeSeasonsCount = $seasonsAndRacesCounts[$leagueId]['active_seasons_count'] ?? 0;
            $totalRacesCount = $seasonsAndRacesCounts[$leagueId]['total_races_count'] ?? 0;

            $leagues[] = [
                'league' => $this->toDomainEntity($eloquentLeague),
                'competitions_count' => $competitionsCount,
                'drivers_count' => $driversCount,
                'active_seasons_count' => $activeSeasonsCount,
                'total_races_count' => $totalRacesCount,
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

    public function getLeagueStatistics(int $leagueId): array
    {
        // Fetch competitions with their season counts
        $competitions = CompetitionModel::where('league_id', $leagueId)
            ->with('platform:id,name,slug')
            ->withCount('seasons')
            ->orderBy('created_at', 'desc')
            ->get();

        $competitionData = $competitions->map(function (CompetitionModel $competition) {
            /** @var \App\Infrastructure\Persistence\Eloquent\Models\Platform|null $platform */
            $platform = $competition->platform;
            /** @var int $seasonsCount */
            $seasonsCount = $competition->seasons_count ?? 0;

            return [
                'competition' => [
                    'id' => $competition->id,
                    'league_id' => $competition->league_id,
                    'platform_id' => $competition->platform_id,
                    'created_by_user_id' => $competition->created_by_user_id,
                    'name' => $competition->name,
                    'slug' => $competition->slug,
                    'description' => $competition->description,
                    'logo_path' => $competition->logo_path,
                    'competition_colour' => $competition->competition_colour,
                    'status' => $competition->status,
                    'archived_at' => $competition->archived_at,
                    'created_at' => $competition->created_at,
                    'updated_at' => $competition->updated_at,
                    'deleted_at' => null,
                    'seasons_count' => $seasonsCount,
                ],
                'platform_name' => $platform !== null ? $platform->name : 'Unknown',
                'platform_slug' => $platform !== null ? $platform->slug : 'unknown',
                'seasons_count' => $seasonsCount,
            ];
        })->all();

        // Calculate seasons summary
        $competitionIds = $competitions->pluck('id')->toArray();

        $totalSeasons = SeasonEloquent::query()
            ->whereIn('competition_id', $competitionIds)
            ->count();

        $activeSeasons = SeasonEloquent::query()
            ->whereIn('competition_id', $competitionIds)
            ->where('status', 'active')
            ->count();

        $completedSeasons = SeasonEloquent::query()
            ->whereIn('competition_id', $competitionIds)
            ->where('status', 'completed')
            ->count();

        $seasonsSummary = [
            'total' => $totalSeasons,
            'active' => $activeSeasons,
            'completed' => $completedSeasons,
        ];

        // Calculate stats
        // Total drivers across all seasons
        $totalDrivers = 0;
        if (! empty($competitionIds)) {
            $seasonIds = SeasonEloquent::query()
                ->whereIn('competition_id', $competitionIds)
                ->pluck('id')
                ->toArray();

            $totalDrivers = SeasonDriverEloquent::query()
                ->whereIn('season_id', $seasonIds)
                ->distinct('league_driver_id')
                ->count('league_driver_id');
        }

        // Total races run
        $totalRaces = 0;
        if (! empty($competitionIds)) {
            $seasonIds = SeasonEloquent::query()
                ->whereIn('competition_id', $competitionIds)
                ->pluck('id')
                ->toArray();

            if (! empty($seasonIds)) {
                $roundIds = Round::query()
                    ->whereIn('season_id', $seasonIds)
                    ->pluck('id')
                    ->toArray();

                if (! empty($roundIds)) {
                    $totalRaces = Race::query()
                        ->whereIn('round_id', $roundIds)
                        ->count();
                }
            }
        }

        return [
            'total_drivers' => $totalDrivers,
            'total_races' => $totalRaces,
            'total_competitions' => $competitions->count(),
            'seasons_summary' => $seasonsSummary,
            'competitions' => $competitionData,
        ];
    }

    public function getPaginatedPublic(int $page, int $perPage = 12, array $filters = []): array
    {
        /** @var Builder<LeagueEloquent> $query */
        $query = LeagueEloquent::query()
            ->withCount([
                'competitions as competitions_count',
                'drivers as drivers_count',
            ])
            ->where('visibility', 'public')
            ->where('status', 'active');

        // Apply search filter
        if (! empty($filters['search'])) {
            // Escape LIKE wildcards to prevent injection
            $search = str_replace(['%', '_'], ['\\%', '\\_'], trim($filters['search']));
            $query->where('name', 'like', "%{$search}%");
        }

        // Apply platform filter
        if (! empty($filters['platform_id'])) {
            $platformId = (int) $filters['platform_id'];
            $query->whereJsonContains('platform_ids', $platformId);
        }

        // Order by name alphabetically
        $query->orderBy('name', 'asc');

        // Get total count before pagination
        $total = (clone $query)->count();
        $lastPage = (int) ceil($total / $perPage);

        // Apply pagination
        $offset = ($page - 1) * $perPage;

        /** @var \Illuminate\Database\Eloquent\Collection<int, LeagueEloquent> $eloquentLeagues */
        $eloquentLeagues = $query->skip($offset)->take($perPage)->get();

        // Get league IDs for batch calculation
        $leagueIds = $eloquentLeagues->pluck('id')->toArray();

        // Batch calculate active seasons and total races for all leagues
        $seasonsAndRacesCounts = $this->calculateSeasonsAndRacesCounts($leagueIds);

        // Map to domain entities with counts
        $leagues = [];
        foreach ($eloquentLeagues as $eloquentLeague) {
            /** @var int $competitionsCount */
            $competitionsCount = $eloquentLeague->competitions_count ?? 0;
            /** @var int $driversCount */
            $driversCount = $eloquentLeague->drivers_count ?? 0;

            $leagueId = $eloquentLeague->id;
            $activeSeasonsCount = $seasonsAndRacesCounts[$leagueId]['active_seasons_count'] ?? 0;
            $totalRacesCount = $seasonsAndRacesCounts[$leagueId]['total_races_count'] ?? 0;

            $leagues[] = [
                'league' => $this->toDomainEntity($eloquentLeague),
                'competitions_count' => $competitionsCount,
                'drivers_count' => $driversCount,
                'active_seasons_count' => $activeSeasonsCount,
                'total_races_count' => $totalRacesCount,
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

    /**
     * Batch calculate active seasons count and total races count for multiple leagues.
     * Returns associative array keyed by league_id with active_seasons_count and total_races_count.
     *
     * @param  array<int>  $leagueIds
     * @return array<int, array{active_seasons_count: int, total_races_count: int}>
     */
    private function calculateSeasonsAndRacesCounts(array $leagueIds): array
    {
        if (empty($leagueIds)) {
            return [];
        }

        // Get all competition IDs for these leagues
        $competitionsData = CompetitionModel::whereIn('league_id', $leagueIds)
            ->select('id', 'league_id')
            ->get();

        $competitionIdsByLeague = [];
        foreach ($competitionsData as $competition) {
            $competitionIdsByLeague[$competition->league_id][] = $competition->id;
        }

        $allCompetitionIds = $competitionsData->pluck('id')->toArray();

        if (empty($allCompetitionIds)) {
            // No competitions, return zeros for all leagues
            $result = [];
            foreach ($leagueIds as $leagueId) {
                $result[$leagueId] = [
                    'active_seasons_count' => 0,
                    'total_races_count' => 0,
                ];
            }

            return $result;
        }

        // Get active seasons count grouped by competition_id
        /** @var \Illuminate\Support\Collection<int, int> $activeSeasonsData */
        $activeSeasonsData = SeasonEloquent::whereIn('competition_id', $allCompetitionIds)
            ->where('status', 'active')
            ->select('competition_id', \Illuminate\Support\Facades\DB::raw('COUNT(*) as count'))
            ->groupBy('competition_id')
            ->get()
            ->mapWithKeys(function ($item): array {
                /** @phpstan-ignore-next-line */
                return [(int) $item->competition_id => (int) $item->count];
            });

        // Get all season IDs for race counting
        $seasonsData = SeasonEloquent::whereIn('competition_id', $allCompetitionIds)
            ->select('id', 'competition_id')
            ->get();

        $seasonIdsByCompetition = [];
        foreach ($seasonsData as $season) {
            $seasonIdsByCompetition[$season->competition_id][] = $season->id;
        }

        $allSeasonIds = $seasonsData->pluck('id')->toArray();

        // Get races count grouped by season_id
        $racesData = [];
        if (! empty($allSeasonIds)) {
            $roundsData = Round::whereIn('season_id', $allSeasonIds)
                ->select('id', 'season_id')
                ->get();

            $roundIdsBySeason = [];
            foreach ($roundsData as $round) {
                $roundIdsBySeason[$round->season_id][] = $round->id;
            }

            $allRoundIds = $roundsData->pluck('id')->toArray();

            if (! empty($allRoundIds)) {
                /** @var \Illuminate\Support\Collection<int, int> $racesCounts */
                $racesCounts = Race::whereIn('round_id', $allRoundIds)
                    ->join('rounds', 'races.round_id', '=', 'rounds.id')
                    ->select('rounds.season_id', \Illuminate\Support\Facades\DB::raw('COUNT(*) as count'))
                    ->groupBy('rounds.season_id')
                    ->get()
                    ->mapWithKeys(function ($item): array {
                        /** @phpstan-ignore-next-line */
                        return [(int) $item->season_id => (int) $item->count];
                    });

                $racesData = $racesCounts->toArray();
            }
        }

        // Aggregate by league
        $result = [];
        foreach ($leagueIds as $leagueId) {
            $competitionIds = $competitionIdsByLeague[$leagueId] ?? [];
            $activeSeasonsCount = 0;
            $totalRacesCount = 0;

            foreach ($competitionIds as $competitionId) {
                // Add active seasons
                if (isset($activeSeasonsData[$competitionId])) {
                    $activeSeasonsCount += $activeSeasonsData[$competitionId];
                }

                // Add races from all seasons in this competition
                $seasonIds = $seasonIdsByCompetition[$competitionId] ?? [];
                foreach ($seasonIds as $seasonId) {
                    $totalRacesCount += $racesData[$seasonId] ?? 0;
                }
            }

            $result[$leagueId] = [
                'active_seasons_count' => $activeSeasonsCount,
                'total_races_count' => $totalRacesCount,
            ];
        }

        return $result;
    }
}
