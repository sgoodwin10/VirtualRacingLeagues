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
use App\Infrastructure\Persistence\Eloquent\Models\League as LeagueEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;

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

    public function isSlugAvailable(string $slug): bool
    {
        return !LeagueEloquent::withTrashed()->where('slug', $slug)->exists();
    }

    public function findByUserId(int $userId): array
    {
        $eloquentLeagues = LeagueEloquent::where('owner_user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return $eloquentLeagues->map(fn($eloquentLeague) => $this->toDomainEntity($eloquentLeague))->all();
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

        return $eloquentLeagues->map(fn($eloquentLeague) => $this->toDomainEntity($eloquentLeague))->all();
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
            $eloquentLeague = LeagueEloquent::withTrashed()->findOrFail($league->id());
            $this->fillEloquentModel($eloquentLeague, $league);

            $eloquentLeague->save();
        }
    }

    public function update(League $league): void
    {
        if ($league->id() === null) {
            throw new \InvalidArgumentException('Cannot update a league without an ID');
        }

        $eloquentLeague = LeagueEloquent::findOrFail($league->id());

        $eloquentLeague->name = $league->name()->value();
        $eloquentLeague->slug = $league->slug()->value();
        $eloquentLeague->logo_path = $league->logoPath();
        $eloquentLeague->timezone = $league->timezone();
        $eloquentLeague->tagline = $league->tagline()?->value();
        $eloquentLeague->description = $league->description();
        $eloquentLeague->header_image_path = $league->headerImagePath();
        $eloquentLeague->platform_ids = $league->platformIds();
        $eloquentLeague->discord_url = $league->discordUrl();
        $eloquentLeague->website_url = $league->websiteUrl();
        $eloquentLeague->twitter_handle = $league->twitterHandle();
        $eloquentLeague->instagram_handle = $league->instagramHandle();
        $eloquentLeague->youtube_url = $league->youtubeUrl();
        $eloquentLeague->twitch_url = $league->twitchUrl();
        $eloquentLeague->visibility = $league->visibility()->value;
        $eloquentLeague->status = $league->status();
        $eloquentLeague->contact_email = $league->contactEmail()->value();
        $eloquentLeague->organizer_name = $league->organizerName();

        $eloquentLeague->save();
    }

    public function delete(League $league): void
    {
        if ($league->id() === null) {
            return;
        }

        $eloquentLeague = LeagueEloquent::findOrFail($league->id());
        $eloquentLeague->delete();
    }

    public function restore(League $league): void
    {
        if ($league->id() === null) {
            return;
        }

        $eloquentLeague = LeagueEloquent::withTrashed()->findOrFail($league->id());
        $eloquentLeague->restore();
    }

    public function forceDelete(League $league): void
    {
        if ($league->id() === null) {
            return;
        }

        $eloquentLeague = LeagueEloquent::withTrashed()->findOrFail($league->id());
        $eloquentLeague->forceDelete();
    }

    /**
     * Apply filters to query.
     *
     * @param \Illuminate\Database\Eloquent\Builder<LeagueEloquent> $query
     * @param array<string, mixed> $filters
     */
    private function applyFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
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
        if (!isset($filters['order_by'])) {
            $query->orderBy('created_at', 'desc');
        } else {
            $direction = $filters['order_direction'] ?? 'asc';
            $query->orderBy($filters['order_by'], $direction);
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
            timezone: $eloquentLeague->timezone,
            ownerUserId: $eloquentLeague->owner_user_id,
            contactEmail: EmailAddress::from($eloquentLeague->contact_email),
            organizerName: $eloquentLeague->organizer_name,
            tagline: Tagline::fromNullable($eloquentLeague->tagline),
            description: $eloquentLeague->description,
            headerImagePath: $eloquentLeague->header_image_path,
            platformIds: $eloquentLeague->platform_ids ?? [],
            discordUrl: $eloquentLeague->discord_url,
            websiteUrl: $eloquentLeague->website_url,
            twitterHandle: $eloquentLeague->twitter_handle,
            instagramHandle: $eloquentLeague->instagram_handle,
            youtubeUrl: $eloquentLeague->youtube_url,
            twitchUrl: $eloquentLeague->twitch_url,
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
        $eloquentLeague->platform_ids = $league->platformIds();
        $eloquentLeague->discord_url = $league->discordUrl();
        $eloquentLeague->website_url = $league->websiteUrl();
        $eloquentLeague->twitter_handle = $league->twitterHandle();
        $eloquentLeague->instagram_handle = $league->instagramHandle();
        $eloquentLeague->youtube_url = $league->youtubeUrl();
        $eloquentLeague->twitch_url = $league->twitchUrl();
        $eloquentLeague->visibility = $league->visibility()->value;
        $eloquentLeague->timezone = $league->timezone();
        $eloquentLeague->owner_user_id = $league->ownerUserId();
        $eloquentLeague->contact_email = $league->contactEmail()->value();
        $eloquentLeague->organizer_name = $league->organizerName();
        $eloquentLeague->status = $league->status();
    }

    public function getPlatformsByLeagueId(int $leagueId): array
    {
        $league = LeagueEloquent::findOrFail($leagueId);
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
}
