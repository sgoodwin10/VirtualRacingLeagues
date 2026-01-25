<?php

declare(strict_types=1);

namespace App\Domain\Team\Entities;

use App\Domain\Team\Events\TeamCreated;
use App\Domain\Team\Events\TeamDeleted;
use App\Domain\Team\Events\TeamUpdated;
use App\Domain\Team\ValueObjects\TeamName;
use DateTimeImmutable;

/**
 * Team Domain Entity.
 * Represents a team within a season for team championship tracking.
 */
final class Team
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $seasonId,
        private TeamName $name,
        private ?string $logoUrl,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    /**
     * Create a new team.
     */
    public static function create(
        int $seasonId,
        TeamName $name,
        ?string $logoUrl = null,
    ): self {
        return new self(
            id: null,
            seasonId: $seasonId,
            name: $name,
            logoUrl: $logoUrl,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );
    }

    /**
     * Record the TeamCreated event after ID has been set by repository.
     * This must be called by the application service after save().
     */
    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new TeamCreated(
            teamId: $this->id,
            seasonId: $this->seasonId,
            name: $this->name->value(),
            logoUrl: $this->logoUrl,
        ));
    }

    /**
     * Reconstitute team from persistence.
     */
    public static function reconstitute(
        int $id,
        int $seasonId,
        TeamName $name,
        ?string $logoUrl,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            seasonId: $seasonId,
            name: $name,
            logoUrl: $logoUrl,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );
    }

    // Getters

    public function id(): ?int
    {
        return $this->id;
    }

    public function seasonId(): int
    {
        return $this->seasonId;
    }

    public function name(): TeamName
    {
        return $this->name;
    }

    public function logoUrl(): ?string
    {
        return $this->logoUrl;
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * Exception: needed for persistence to set ID after creation.
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    // Business logic methods

    /**
     * Update team details.
     */
    public function updateDetails(TeamName $name, ?string $logoUrl): void
    {
        $changes = [];

        if (! $name->equals($this->name)) {
            $this->name = $name;
            $changes['name'] = $name->value();
        }

        if ($logoUrl !== $this->logoUrl) {
            $this->logoUrl = $logoUrl;
            $changes['logo_url'] = $logoUrl;
        }

        if (! empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new TeamUpdated(
                teamId: $this->id ?? 0,
                changes: $changes,
            ));
        }
    }

    /**
     * Update team name.
     */
    public function updateName(TeamName $name): void
    {
        if ($name->equals($this->name)) {
            return;
        }

        $this->name = $name;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new TeamUpdated(
            teamId: $this->id ?? 0,
            changes: ['name' => $name->value()],
        ));
    }

    /**
     * Update team logo.
     */
    public function updateLogo(?string $logoUrl): void
    {
        if ($logoUrl === $this->logoUrl) {
            return;
        }

        $this->logoUrl = $logoUrl;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new TeamUpdated(
            teamId: $this->id ?? 0,
            changes: ['logo_url' => $logoUrl],
        ));
    }

    /**
     * Mark team for deletion.
     * This will trigger cascade behavior to set all season_drivers.team_id to NULL.
     */
    public function delete(): void
    {
        $this->recordEvent(new TeamDeleted(
            teamId: $this->id ?? 0,
            seasonId: $this->seasonId,
        ));
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
