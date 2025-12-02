<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\Events\RaceResultCreated;
use App\Domain\Competition\Events\RaceResultUpdated;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Domain\Competition\ValueObjects\RaceTime;
use DateTimeImmutable;

final class RaceResult
{
    /**
     * @var array<object>
     */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $raceId,
        private int $driverId,
        private ?int $divisionId,
        private ?int $position,
        private RaceTime $raceTime,
        private RaceTime $raceTimeDifference,
        private RaceTime $fastestLap,
        private RaceTime $penalties,
        private bool $hasFastestLap,
        private bool $hasPole,
        private bool $dnf,
        private RaceResultStatus $status,
        private int $racePoints,
        private ?int $positionsGained,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    public static function create(
        int $raceId,
        int $driverId,
        ?int $divisionId = null,
        ?int $position = null,
        ?string $raceTime = null,
        ?string $raceTimeDifference = null,
        ?string $fastestLap = null,
        ?string $penalties = null,
        bool $hasFastestLap = false,
        bool $hasPole = false,
        bool $dnf = false,
    ): self {
        $now = new DateTimeImmutable();

        $result = new self(
            id: null,
            raceId: $raceId,
            driverId: $driverId,
            divisionId: $divisionId,
            position: $position,
            raceTime: RaceTime::fromString($raceTime),
            raceTimeDifference: RaceTime::fromString($raceTimeDifference),
            fastestLap: RaceTime::fromString($fastestLap),
            penalties: RaceTime::fromString($penalties),
            hasFastestLap: $hasFastestLap,
            hasPole: $hasPole,
            dnf: $dnf,
            status: RaceResultStatus::PENDING,
            racePoints: 0,
            positionsGained: null,
            createdAt: $now,
            updatedAt: $now,
        );

        return $result;
    }

    public static function reconstitute(
        int $id,
        int $raceId,
        int $driverId,
        ?int $divisionId,
        ?int $position,
        ?string $raceTime,
        ?string $raceTimeDifference,
        ?string $fastestLap,
        ?string $penalties,
        bool $hasFastestLap,
        bool $hasPole,
        bool $dnf,
        RaceResultStatus $status,
        int $racePoints,
        ?int $positionsGained,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            raceId: $raceId,
            driverId: $driverId,
            divisionId: $divisionId,
            position: $position,
            raceTime: RaceTime::fromString($raceTime),
            raceTimeDifference: RaceTime::fromString($raceTimeDifference),
            fastestLap: RaceTime::fromString($fastestLap),
            penalties: RaceTime::fromString($penalties),
            hasFastestLap: $hasFastestLap,
            hasPole: $hasPole,
            dnf: $dnf,
            status: $status,
            racePoints: $racePoints,
            positionsGained: $positionsGained,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );
    }

    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new RaceResultCreated(
            raceResultId: $this->id,
            raceId: $this->raceId,
            driverId: $this->driverId,
            position: $this->position,
            occurredAt: $this->createdAt->format('Y-m-d H:i:s'),
        ));
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

    public function raceId(): int
    {
        return $this->raceId;
    }

    public function driverId(): int
    {
        return $this->driverId;
    }

    public function divisionId(): ?int
    {
        return $this->divisionId;
    }

    public function position(): ?int
    {
        return $this->position;
    }

    public function raceTime(): RaceTime
    {
        return $this->raceTime;
    }

    public function raceTimeDifference(): RaceTime
    {
        return $this->raceTimeDifference;
    }

    public function fastestLap(): RaceTime
    {
        return $this->fastestLap;
    }

    public function penalties(): RaceTime
    {
        return $this->penalties;
    }

    public function hasFastestLap(): bool
    {
        return $this->hasFastestLap;
    }

    public function hasPole(): bool
    {
        return $this->hasPole;
    }

    public function dnf(): bool
    {
        return $this->dnf;
    }

    public function status(): RaceResultStatus
    {
        return $this->status;
    }

    public function racePoints(): int
    {
        return $this->racePoints;
    }

    public function positionsGained(): ?int
    {
        return $this->positionsGained;
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    // Business Logic
    public function update(
        ?int $position,
        ?string $raceTime,
        ?string $raceTimeDifference,
        ?string $fastestLap,
        ?string $penalties,
        bool $hasFastestLap,
        bool $hasPole,
        bool $dnf,
    ): void {
        $changes = [];

        if ($this->position !== $position) {
            $changes['position'] = ['old' => $this->position, 'new' => $position];
            $this->position = $position;
        }

        $newRaceTime = RaceTime::fromString($raceTime);
        if (!$this->raceTime->equals($newRaceTime)) {
            $changes['race_time'] = ['old' => $this->raceTime->value(), 'new' => $raceTime];
            $this->raceTime = $newRaceTime;
        }

        $newRaceTimeDifference = RaceTime::fromString($raceTimeDifference);
        if (!$this->raceTimeDifference->equals($newRaceTimeDifference)) {
            $changes['race_time_difference'] = [
                'old' => $this->raceTimeDifference->value(),
                'new' => $raceTimeDifference,
            ];
            $this->raceTimeDifference = $newRaceTimeDifference;
        }

        $newFastestLap = RaceTime::fromString($fastestLap);
        if (!$this->fastestLap->equals($newFastestLap)) {
            $changes['fastest_lap'] = ['old' => $this->fastestLap->value(), 'new' => $fastestLap];
            $this->fastestLap = $newFastestLap;
        }

        $newPenalties = RaceTime::fromString($penalties);
        if (!$this->penalties->equals($newPenalties)) {
            $changes['penalties'] = ['old' => $this->penalties->value(), 'new' => $penalties];
            $this->penalties = $newPenalties;
        }

        if ($this->hasFastestLap !== $hasFastestLap) {
            $changes['has_fastest_lap'] = ['old' => $this->hasFastestLap, 'new' => $hasFastestLap];
            $this->hasFastestLap = $hasFastestLap;
        }

        if ($this->hasPole !== $hasPole) {
            $changes['has_pole'] = ['old' => $this->hasPole, 'new' => $hasPole];
            $this->hasPole = $hasPole;
        }

        if ($this->dnf !== $dnf) {
            $changes['dnf'] = ['old' => $this->dnf, 'new' => $dnf];
            $this->dnf = $dnf;
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new RaceResultUpdated(
                raceResultId: $this->id ?? 0,
                raceId: $this->raceId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    public function setRacePoints(int $points): void
    {
        $this->racePoints = $points;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function setPositionsGained(?int $positions): void
    {
        $this->positionsGained = $positions;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function confirm(): void
    {
        $this->status = RaceResultStatus::CONFIRMED;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function updateStatus(RaceResultStatus $status): void
    {
        if ($this->status !== $status) {
            $this->status = $status;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    public function markAsFastestLap(): void
    {
        if (!$this->hasFastestLap) {
            $this->hasFastestLap = true;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    public function clearFastestLap(): void
    {
        if ($this->hasFastestLap) {
            $this->hasFastestLap = false;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    // Domain Events
    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }

    public function clearEvents(): void
    {
        $this->domainEvents = [];
    }
}
