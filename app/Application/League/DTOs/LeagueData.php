<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Domain\League\Entities\League;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object representing a league.
 */
final class LeagueData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $tagline,
        public readonly ?string $description,
        public readonly string $logo_url,
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
        public readonly int $owner_user_id,
        public readonly ?string $contact_email,
        public readonly ?string $organizer_name,
        public readonly string $status,
        public readonly bool $is_active,
        public readonly bool $is_archived,
    ) {
    }

    /**
     * Create from domain entity with platform data.
     *
     * @param array<array{id: int, name: string, slug: string}> $platforms
     */
    public static function fromEntity(League $league, array $platforms = []): self
    {
        return new self(
            id: $league->id(),
            name: $league->name()->value(),
            slug: $league->slug()->value(),
            tagline: $league->tagline()?->value(),
            description: $league->description(),
            // @phpstan-ignore-next-line (url() method exists on LocalFilesystemAdapter)
            logo_url: Storage::disk('public')->url($league->logoPath()),
            // @phpstan-ignore-next-line (url() method exists on LocalFilesystemAdapter)
            header_image_url: $league->headerImagePath()
                ? Storage::disk('public')->url($league->headerImagePath())
                : null,
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
            owner_user_id: $league->ownerUserId(),
            contact_email: $league->contactEmail()?->value(),
            organizer_name: $league->organizerName(),
            status: $league->status(),
            is_active: $league->isActive(),
            is_archived: $league->isArchived(),
        );
    }
}
