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
        private RaceTime $originalRaceTime,
        private RaceTime $originalRaceTimeDifference,
        private RaceTime $finalRaceTimeDifference,
        private RaceTime $fastestLap,
        private RaceTime $penalties,
        private bool $hasFastestLap,
        private bool $hasPole,
        private bool $dnf,
        private RaceResultStatus $status,
        private float $racePoints,
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
        ?string $originalRaceTime = null,
        ?string $originalRaceTimeDifference = null,
        ?string $finalRaceTimeDifference = null,
        ?string $fastestLap = null,
        ?string $penalties = null,
        bool $hasFastestLap = false,
        bool $hasPole = false,
        bool $dnf = false,
    ): self {
        // Domain invariant validation
        if ($raceId <= 0) {
            throw new \InvalidArgumentException('Race ID must be greater than 0');
        }

        if ($driverId <= 0) {
            throw new \InvalidArgumentException('Driver ID must be greater than 0');
        }

        if ($position !== null && $position <= 0) {
            throw new \InvalidArgumentException('Position must be greater than 0 when provided');
        }

        $now = new DateTimeImmutable();

        $result = new self(
            id: null,
            raceId: $raceId,
            driverId: $driverId,
            divisionId: $divisionId,
            position: $position,
            originalRaceTime: RaceTime::fromString($originalRaceTime),
            originalRaceTimeDifference: RaceTime::fromString($originalRaceTimeDifference),
            finalRaceTimeDifference: RaceTime::fromString($finalRaceTimeDifference),
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
        ?string $originalRaceTime,
        ?string $originalRaceTimeDifference,
        ?string $finalRaceTimeDifference,
        ?string $fastestLap,
        ?string $penalties,
        bool $hasFastestLap,
        bool $hasPole,
        bool $dnf,
        RaceResultStatus $status,
        float $racePoints,
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
            originalRaceTime: RaceTime::fromString($originalRaceTime),
            originalRaceTimeDifference: RaceTime::fromString($originalRaceTimeDifference),
            finalRaceTimeDifference: RaceTime::fromString($finalRaceTimeDifference),
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

    public function originalRaceTime(): RaceTime
    {
        return $this->originalRaceTime;
    }

    public function finalRaceTime(): RaceTime
    {
        // If original race time is null, final is also null
        if ($this->originalRaceTime->isNull()) {
            return $this->originalRaceTime;
        }

        // If penalties are null or zero, final equals original
        if ($this->penalties->isNull()) {
            return $this->originalRaceTime;
        }

        // Calculate: original_race_time + penalties
        return $this->originalRaceTime->add($this->penalties);
    }

    public function originalRaceTimeDifference(): RaceTime
    {
        return $this->originalRaceTimeDifference;
    }

    public function finalRaceTimeDifference(): RaceTime
    {
        return $this->finalRaceTimeDifference;
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

    public function racePoints(): float
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
        ?string $originalRaceTime,
        ?string $originalRaceTimeDifference,
        ?string $fastestLap,
        ?string $penalties,
        bool $hasFastestLap,
        bool $hasPole,
        bool $dnf,
    ): void {
        // Prevent updates before ID is set
        if ($this->id === null) {
            throw new \LogicException('Cannot update race result before it has been persisted');
        }

        if ($position !== null && $position <= 0) {
            throw new \InvalidArgumentException('Position must be greater than 0 when provided');
        }

        $changes = [];
        $needsRecalculation = false;

        // Handle DNF state change
        if ($this->dnf !== $dnf) {
            $changes['dnf'] = ['old' => $this->dnf, 'new' => $dnf];
            $this->dnf = $dnf;

            // If marking as DNF, clear hasFastestLap (DNF drivers don't get fastest lap bonuses)
            if ($dnf && $this->hasFastestLap) {
                $changes['has_fastest_lap'] = ['old' => $this->hasFastestLap, 'new' => false];
                $this->hasFastestLap = false;
            }
        }

        if ($this->position !== $position) {
            $changes['position'] = ['old' => $this->position, 'new' => $position];
            $this->position = $position;
        }

        $newOriginalRaceTime = RaceTime::fromString($originalRaceTime);
        if (!$this->originalRaceTime->equals($newOriginalRaceTime)) {
            $changes['original_race_time'] = ['old' => $this->originalRaceTime->value(), 'new' => $originalRaceTime];
            $this->originalRaceTime = $newOriginalRaceTime;
        }

        $newOriginalRaceTimeDifference = RaceTime::fromString($originalRaceTimeDifference);
        if (!$this->originalRaceTimeDifference->equals($newOriginalRaceTimeDifference)) {
            $changes['original_race_time_difference'] = [
                'old' => $this->originalRaceTimeDifference->value(),
                'new' => $originalRaceTimeDifference,
            ];
            $this->originalRaceTimeDifference = $newOriginalRaceTimeDifference;
            $needsRecalculation = true;
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
            $needsRecalculation = true;
        }

        if ($this->hasFastestLap !== $hasFastestLap) {
            $changes['has_fastest_lap'] = ['old' => $this->hasFastestLap, 'new' => $hasFastestLap];
            $this->hasFastestLap = $hasFastestLap;
        }

        if ($this->hasPole !== $hasPole) {
            $changes['has_pole'] = ['old' => $this->hasPole, 'new' => $hasPole];
            $this->hasPole = $hasPole;
        }

        // Recalculate final race time difference if penalties or original time difference changed
        if ($needsRecalculation) {
            $oldFinalTimeDiff = $this->finalRaceTimeDifference->value();
            $this->recalculateFinalRaceTimeDifference();
            $changes['final_race_time_difference'] = [
                'old' => $oldFinalTimeDiff,
                'new' => $this->finalRaceTimeDifference->value(),
            ];
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

    public function setRacePoints(float $points): void
    {
        if ($points < 0) {
            throw new \InvalidArgumentException('Race points cannot be negative');
        }

        $this->racePoints = $points;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function setPositionsGained(?int $positions): void
    {
        if ($positions !== null && ($positions < -99 || $positions > 99)) {
            throw new \InvalidArgumentException('Positions gained must be between -99 and 99');
        }

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

    /**
     * Recalculates the final race time difference by adding penalties to the original race time difference.
     */
    private function recalculateFinalRaceTimeDifference(): void
    {
        // If original race time difference is null, final is also null
        if ($this->originalRaceTimeDifference->isNull()) {
            $this->finalRaceTimeDifference = $this->originalRaceTimeDifference;
            return;
        }

        // If penalties are null or zero, final equals original
        if ($this->penalties->isNull()) {
            $this->finalRaceTimeDifference = $this->originalRaceTimeDifference;
            return;
        }

        // Calculate: original_race_time_difference + penalties
        $this->finalRaceTimeDifference = $this->originalRaceTimeDifference->add($this->penalties);
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
