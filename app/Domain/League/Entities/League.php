<?php

declare(strict_types=1);

namespace App\Domain\League\Entities;

use App\Domain\League\Events\LeagueCreated;
use App\Domain\League\Events\LeagueUpdated;
use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueSlug;
use App\Domain\League\ValueObjects\LeagueVisibility;
use App\Domain\League\ValueObjects\Tagline;
use App\Domain\Shared\ValueObjects\EmailAddress;

/**
 * League Domain Entity.
 * Rich domain model containing league business logic and invariants.
 */
final class League
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private LeagueName $name,
        private LeagueSlug $slug,
        private ?string $logoPath,
        private ?string $timezone,
        private int $ownerUserId,
        private ?EmailAddress $contactEmail,
        private ?string $organizerName,
        private ?Tagline $tagline,
        private ?string $description,
        private ?string $headerImagePath,
        private ?string $bannerPath,
        /** @var array<int> */
        private array $platformIds,
        private ?string $discordUrl,
        private ?string $websiteUrl,
        private ?string $twitterHandle,
        private ?string $instagramHandle,
        private ?string $youtubeUrl,
        private ?string $twitchUrl,
        private ?string $facebookHandle,
        private LeagueVisibility $visibility,
        private string $status,
    ) {}

    /**
     * Create a new league.
     */
    public static function create(
        LeagueName $name,
        LeagueSlug $slug,
        ?string $logoPath,
        int $ownerUserId,
        ?string $timezone = null,
        ?EmailAddress $contactEmail = null,
        ?string $organizerName = null,
        ?Tagline $tagline = null,
        ?string $description = null,
        ?string $headerImagePath = null,
        ?string $bannerPath = null,
        array $platformIds = [],
        ?string $discordUrl = null,
        ?string $websiteUrl = null,
        ?string $twitterHandle = null,
        ?string $instagramHandle = null,
        ?string $youtubeUrl = null,
        ?string $twitchUrl = null,
        ?string $facebookHandle = null,
        ?LeagueVisibility $visibility = null,
    ): self {
        $league = new self(
            id: null,
            name: $name,
            slug: $slug,
            logoPath: $logoPath,
            timezone: $timezone,
            ownerUserId: $ownerUserId,
            contactEmail: $contactEmail,
            organizerName: $organizerName,
            tagline: $tagline,
            description: $description,
            headerImagePath: $headerImagePath,
            bannerPath: $bannerPath,
            platformIds: $platformIds,
            discordUrl: $discordUrl,
            websiteUrl: $websiteUrl,
            twitterHandle: $twitterHandle,
            instagramHandle: $instagramHandle,
            youtubeUrl: $youtubeUrl,
            twitchUrl: $twitchUrl,
            facebookHandle: $facebookHandle,
            visibility: $visibility ?? LeagueVisibility::public(),
            status: 'active',
        );

        // Note: LeagueCreated event will be recorded after persistence when ID is available
        // See recordCreationEvent() method below

        return $league;
    }

    /**
     * Record the LeagueCreated event after ID has been set by repository.
     * This must be called by the application service after save().
     */
    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new LeagueCreated($this));
    }

    /**
     * Reconstitute league from persistence.
     */
    public static function reconstitute(
        int $id,
        LeagueName $name,
        LeagueSlug $slug,
        ?string $logoPath,
        int $ownerUserId,
        ?string $timezone,
        ?EmailAddress $contactEmail,
        ?string $organizerName,
        ?Tagline $tagline,
        ?string $description,
        ?string $headerImagePath,
        ?string $bannerPath,
        array $platformIds,
        ?string $discordUrl,
        ?string $websiteUrl,
        ?string $twitterHandle,
        ?string $instagramHandle,
        ?string $youtubeUrl,
        ?string $twitchUrl,
        ?string $facebookHandle,
        LeagueVisibility $visibility,
        string $status,
    ): self {
        return new self(
            id: $id,
            name: $name,
            slug: $slug,
            logoPath: $logoPath,
            timezone: $timezone,
            ownerUserId: $ownerUserId,
            contactEmail: $contactEmail,
            organizerName: $organizerName,
            tagline: $tagline,
            description: $description,
            headerImagePath: $headerImagePath,
            bannerPath: $bannerPath,
            platformIds: $platformIds,
            discordUrl: $discordUrl,
            websiteUrl: $websiteUrl,
            twitterHandle: $twitterHandle,
            instagramHandle: $instagramHandle,
            youtubeUrl: $youtubeUrl,
            twitchUrl: $twitchUrl,
            facebookHandle: $facebookHandle,
            visibility: $visibility,
            status: $status,
        );
    }

    // Getters

    public function id(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function name(): LeagueName
    {
        return $this->name;
    }

    public function slug(): LeagueSlug
    {
        return $this->slug;
    }

    public function logoPath(): ?string
    {
        return $this->logoPath;
    }

    public function timezone(): ?string
    {
        return $this->timezone;
    }

    public function ownerUserId(): int
    {
        return $this->ownerUserId;
    }

    public function contactEmail(): ?EmailAddress
    {
        return $this->contactEmail;
    }

    public function organizerName(): ?string
    {
        return $this->organizerName;
    }

    public function tagline(): ?Tagline
    {
        return $this->tagline;
    }

    public function description(): ?string
    {
        return $this->description;
    }

    public function headerImagePath(): ?string
    {
        return $this->headerImagePath;
    }

    public function bannerPath(): ?string
    {
        return $this->bannerPath;
    }

    /**
     * @return array<int>
     */
    public function platformIds(): array
    {
        return $this->platformIds;
    }

    public function discordUrl(): ?string
    {
        return $this->discordUrl;
    }

    public function websiteUrl(): ?string
    {
        return $this->websiteUrl;
    }

    public function twitterHandle(): ?string
    {
        return $this->twitterHandle;
    }

    public function instagramHandle(): ?string
    {
        return $this->instagramHandle;
    }

    public function youtubeUrl(): ?string
    {
        return $this->youtubeUrl;
    }

    public function twitchUrl(): ?string
    {
        return $this->twitchUrl;
    }

    public function facebookHandle(): ?string
    {
        return $this->facebookHandle;
    }

    public function visibility(): LeagueVisibility
    {
        return $this->visibility;
    }

    public function status(): string
    {
        return $this->status;
    }

    // Business logic methods

    /**
     * Update league details.
     */
    public function updateDetails(
        LeagueName $name,
        ?Tagline $tagline,
        ?string $description
    ): void {
        $this->name = $name;
        $this->tagline = $tagline;
        $this->description = $description;

        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Change league visibility.
     */
    public function changeVisibility(LeagueVisibility $visibility): void
    {
        $this->visibility = $visibility;
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Archive the league.
     */
    public function archive(): void
    {
        $this->status = 'archived';
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Activate the league.
     */
    public function activate(): void
    {
        $this->status = 'active';
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Check if league is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if league is archived.
     */
    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    /**
     * Update contact information.
     */
    public function updateContactInfo(
        ?EmailAddress $contactEmail,
        ?string $organizerName
    ): void {
        $this->contactEmail = $contactEmail;
        $this->organizerName = $organizerName;
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Update social media links.
     */
    public function updateSocialMedia(
        ?string $discordUrl,
        ?string $websiteUrl,
        ?string $twitterHandle,
        ?string $instagramHandle,
        ?string $youtubeUrl,
        ?string $twitchUrl,
        ?string $facebookHandle
    ): void {
        $this->discordUrl = $discordUrl;
        $this->websiteUrl = $websiteUrl;
        $this->twitterHandle = $twitterHandle;
        $this->instagramHandle = $instagramHandle;
        $this->youtubeUrl = $youtubeUrl;
        $this->twitchUrl = $twitchUrl;
        $this->facebookHandle = $facebookHandle;
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Update platform associations.
     */
    public function updatePlatforms(array $platformIds): void
    {
        $this->platformIds = $platformIds;
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Update timezone.
     */
    public function updateTimezone(?string $timezone): void
    {
        $this->timezone = $timezone;
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Update logo path.
     */
    public function updateLogo(string $logoPath): void
    {
        $this->logoPath = $logoPath;
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Update header image path.
     */
    public function updateHeaderImage(?string $headerImagePath): void
    {
        $this->headerImagePath = $headerImagePath;
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Update banner path.
     */
    public function updateBanner(?string $bannerPath): void
    {
        $this->bannerPath = $bannerPath;
        $this->recordEvent(new LeagueUpdated($this));
    }

    /**
     * Update league slug.
     */
    public function updateSlug(LeagueSlug $slug): void
    {
        $this->slug = $slug;
        $this->recordEvent(new LeagueUpdated($this));
    }

    // Domain events management

    /**
     * Record a domain event.
     */
    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * Get recorded domain events.
     *
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];

        return $events;
    }

    /**
     * Check if entity has recorded events.
     */
    public function hasEvents(): bool
    {
        return ! empty($this->domainEvents);
    }
}
