<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Domain\League\Entities\League;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object representing detailed league information.
 * Includes base league info, owner details, competitions, and statistics.
 */
final class LeagueDetailsData extends Data
{
    public function __construct(
        // Base league info
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $tagline,
        public readonly ?string $description,
        public readonly ?string $logo_url,
        public readonly ?string $header_image_url,
        /** @var array<int> */
        public readonly array $platform_ids,
        /** @var array<array{id: int, name: string, slug: string}> */
        public readonly array $platforms,
        public readonly ?string $discord_url,
        public readonly ?string $website_url,
        public readonly ?string $twitter_handle,
        public readonly ?string $instagram_handle,
        public readonly ?string $youtube_url,
        public readonly ?string $twitch_url,
        public readonly string $visibility,
        public readonly ?string $timezone,
        public readonly ?string $contact_email,
        public readonly ?string $organizer_name,
        public readonly string $status,
        public readonly bool $is_active,
        public readonly bool $is_archived,
        // Owner details
        public readonly int $owner_user_id,
        /** @var array{id: int, first_name: string, last_name: string, email: string}|null */
        public readonly ?array $owner,
        // Competitions list
        /** @var array<int, CompetitionSummaryData> */
        public readonly array $competitions,
        // Season statistics
        /** @var array{total: int, active: int, completed: int} */
        public readonly array $seasons_summary,
        // Quick stats
        /** @var array{total_drivers: int, total_races: int, total_competitions: int} */
        public readonly array $stats,
    ) {
    }

    /**
     * Create from domain entity with all related data.
     *
     * @param  array<array{id: int, name: string, slug: string}>  $platforms
     * @param  array{id: int, first_name: string, last_name: string, email: string}|null  $owner
     * @param  array<int, CompetitionSummaryData>  $competitions
     * @param  array{total: int, active: int, completed: int}  $seasonsSummary
     * @param  array{total_drivers: int, total_races: int, total_competitions: int}  $stats
     */
    public static function fromEntity(
        League $league,
        array $platforms,
        ?array $owner,
        array $competitions,
        array $seasonsSummary,
        array $stats,
        ?string $logoUrl = null,
        ?string $headerImageUrl = null
    ): self {
        $leagueId = $league->id();
        if ($leagueId === null) {
            throw new \LogicException('Cannot create DTO from unpersisted League entity');
        }

        return new self(
            id: $leagueId,
            name: $league->name()->value(),
            slug: $league->slug()->value(),
            tagline: $league->tagline()?->value(),
            description: $league->description(),
            logo_url: $logoUrl,
            header_image_url: $headerImageUrl,
            platform_ids: $league->platformIds(),
            platforms: $platforms,
            discord_url: $league->discordUrl(),
            website_url: $league->websiteUrl(),
            twitter_handle: $league->twitterHandle(),
            instagram_handle: $league->instagramHandle(),
            youtube_url: $league->youtubeUrl(),
            twitch_url: $league->twitchUrl(),
            visibility: $league->visibility()->value,
            timezone: $league->timezone(),
            contact_email: $league->contactEmail()?->value(),
            organizer_name: $league->organizerName(),
            status: $league->status(),
            is_active: $league->isActive(),
            is_archived: $league->isArchived(),
            owner_user_id: $league->ownerUserId(),
            owner: $owner,
            competitions: $competitions,
            seasons_summary: $seasonsSummary,
            stats: $stats,
        );
    }
}
