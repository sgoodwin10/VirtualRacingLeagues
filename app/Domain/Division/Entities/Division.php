<?php

declare(strict_types=1);

namespace App\Domain\Division\Entities;

use App\Domain\Division\Events\DivisionCreated;
use App\Domain\Division\Events\DivisionDeleted;
use App\Domain\Division\Events\DivisionUpdated;
use App\Domain\Division\ValueObjects\DivisionDescription;
use App\Domain\Division\ValueObjects\DivisionName;
use DateTimeImmutable;

/**
 * Division Domain Entity.
 * Represents a division within a season for driver categorization.
 */
final class Division
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $seasonId,
        private DivisionName $name,
        private DivisionDescription $description,
        private ?string $logoUrl,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    /**
     * Create a new division.
     */
    public static function create(
        int $seasonId,
        DivisionName $name,
        DivisionDescription $description,
        ?string $logoUrl = null,
    ): self {
        return new self(
            id: null,
            seasonId: $seasonId,
            name: $name,
            description: $description,
            logoUrl: $logoUrl,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );
    }

    /**
     * Record the DivisionCreated event after ID has been set by repository.
     * This must be called by the application service after save().
     */
    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new DivisionCreated(
            divisionId: $this->id,
            seasonId: $this->seasonId,
            name: $this->name->value(),
            description: $this->description->value(),
            logoUrl: $this->logoUrl,
        ));
    }

    /**
     * Reconstitute division from persistence.
     */
    public static function reconstitute(
        int $id,
        int $seasonId,
        DivisionName $name,
        DivisionDescription $description,
        ?string $logoUrl,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            seasonId: $seasonId,
            name: $name,
            description: $description,
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

    public function name(): DivisionName
    {
        return $this->name;
    }

    public function description(): DivisionDescription
    {
        return $this->description;
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
     * Update division details.
     */
    public function updateDetails(
        DivisionName $name,
        DivisionDescription $description,
        ?string $logoUrl
    ): void {
        $changes = [];

        if (!$name->equals($this->name)) {
            $this->name = $name;
            $changes['name'] = $name->value();
        }

        if (!$description->equals($this->description)) {
            $this->description = $description;
            $changes['description'] = $description->value();
        }

        if ($logoUrl !== $this->logoUrl) {
            $this->logoUrl = $logoUrl;
            $changes['logo_url'] = $logoUrl;
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new DivisionUpdated(
                divisionId: $this->id ?? 0,
                changes: $changes,
            ));
        }
    }

    /**
     * Update division name.
     */
    public function updateName(DivisionName $name): void
    {
        if ($name->equals($this->name)) {
            return;
        }

        $this->name = $name;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new DivisionUpdated(
            divisionId: $this->id ?? 0,
            changes: ['name' => $name->value()],
        ));
    }

    /**
     * Update division description.
     */
    public function updateDescription(DivisionDescription $description): void
    {
        if ($description->equals($this->description)) {
            return;
        }

        $this->description = $description;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new DivisionUpdated(
            divisionId: $this->id ?? 0,
            changes: ['description' => $description->value()],
        ));
    }

    /**
     * Update division logo.
     */
    public function updateLogo(?string $logoUrl): void
    {
        if ($logoUrl === $this->logoUrl) {
            return;
        }

        $this->logoUrl = $logoUrl;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new DivisionUpdated(
            divisionId: $this->id ?? 0,
            changes: ['logo_url' => $logoUrl],
        ));
    }

    /**
     * Mark division for deletion.
     * This will trigger cascade behavior to set all season_drivers.division_id to NULL.
     */
    public function delete(): void
    {
        $this->recordEvent(new DivisionDeleted(
            divisionId: $this->id ?? 0,
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
        return !empty($this->domainEvents);
    }
}
