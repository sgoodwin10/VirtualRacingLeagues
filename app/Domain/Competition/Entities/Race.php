<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\Events\QualifierCreated;
use App\Domain\Competition\Events\QualifierUpdated;
use App\Domain\Competition\Events\RaceCreated;
use App\Domain\Competition\Events\RaceUpdated;
use App\Domain\Competition\Exceptions\InvalidQualifierConfigurationException;
use App\Domain\Competition\ValueObjects\GridSource;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceLengthType;
use App\Domain\Competition\ValueObjects\RaceName;
use App\Domain\Competition\ValueObjects\RaceStatus;
use App\Domain\Competition\ValueObjects\RaceType;
use DateTimeImmutable;

final class Race
{
    /**
     * @var array<object>
     */
    private array $events = [];

    private function __construct(
        private ?int $id,
        private int $roundId,
        private bool $isQualifier,
        private ?int $raceNumber,
        private ?RaceName $name,
        private ?RaceType $type,
        // Qualifying
        private QualifyingFormat $qualifyingFormat,
        private ?int $qualifyingLength,
        private ?string $qualifyingTire,
        // Grid
        private GridSource $gridSource,
        private ?int $gridSourceRaceId,
        // Length
        private RaceLengthType $lengthType,
        private ?int $lengthValue,
        private bool $extraLapAfterTime,
        // Platform settings (stored as strings)
        private ?string $weather,
        private ?string $tireRestrictions,
        private ?string $fuelUsage,
        private ?string $damageModel,
        // Penalties & Rules
        private bool $trackLimitsEnforced,
        private bool $falseStartDetection,
        private bool $collisionPenalties,
        private bool $mandatoryPitStop,
        private ?int $minimumPitTime,
        private ?string $assistsRestrictions,
        // Bonus Points
        private ?float $fastestLap,
        private bool $fastestLapTop10,
        private ?float $qualifyingPole,
        private bool $qualifyingPoleTop10,
        // Points
        private PointsSystem $pointsSystem,
        private float $dnfPoints,
        private float $dnsPoints,
        private bool $racePoints,
        // Notes
        private ?string $raceNotes,
        // Status
        private RaceStatus $status,
        // Timestamps
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    public static function create(
        int $roundId,
        int $raceNumber,
        ?RaceName $name,
        ?RaceType $type,
        QualifyingFormat $qualifyingFormat,
        ?int $qualifyingLength,
        ?string $qualifyingTire,
        GridSource $gridSource,
        ?int $gridSourceRaceId,
        RaceLengthType $lengthType,
        ?int $lengthValue,
        bool $extraLapAfterTime,
        ?string $weather,
        ?string $tireRestrictions,
        ?string $fuelUsage,
        ?string $damageModel,
        bool $trackLimitsEnforced,
        bool $falseStartDetection,
        bool $collisionPenalties,
        bool $mandatoryPitStop,
        ?int $minimumPitTime,
        ?string $assistsRestrictions,
        ?float $fastestLap,
        bool $fastestLapTop10,
        ?float $qualifyingPole,
        bool $qualifyingPoleTop10,
        PointsSystem $pointsSystem,
        float $dnfPoints,
        float $dnsPoints,
        bool $racePoints,
        ?string $raceNotes,
    ): self {
        $now = new DateTimeImmutable();

        $race = new self(
            id: null,
            roundId: $roundId,
            isQualifier: false,
            raceNumber: $raceNumber,
            name: $name,
            type: $type,
            qualifyingFormat: $qualifyingFormat,
            qualifyingLength: $qualifyingLength,
            qualifyingTire: $qualifyingTire,
            gridSource: $gridSource,
            gridSourceRaceId: $gridSourceRaceId,
            lengthType: $lengthType,
            lengthValue: $lengthValue,
            extraLapAfterTime: $extraLapAfterTime,
            weather: $weather,
            tireRestrictions: $tireRestrictions,
            fuelUsage: $fuelUsage,
            damageModel: $damageModel,
            trackLimitsEnforced: $trackLimitsEnforced,
            falseStartDetection: $falseStartDetection,
            collisionPenalties: $collisionPenalties,
            mandatoryPitStop: $mandatoryPitStop,
            minimumPitTime: $minimumPitTime,
            assistsRestrictions: $assistsRestrictions,
            fastestLap: $fastestLap,
            fastestLapTop10: $fastestLapTop10,
            qualifyingPole: $qualifyingPole,
            qualifyingPoleTop10: $qualifyingPoleTop10,
            pointsSystem: $pointsSystem,
            dnfPoints: $dnfPoints,
            dnsPoints: $dnsPoints,
            racePoints: $racePoints,
            raceNotes: $raceNotes,
            status: RaceStatus::SCHEDULED,
            createdAt: $now,
            updatedAt: $now,
        );

        $race->events[] = new RaceCreated(
            raceId: 0, // Will be set after persistence
            roundId: $roundId,
            raceNumber: $raceNumber,
            name: $name?->value(),
            type: $type?->value,
            occurredAt: $now,
        );

        return $race;
    }

    public static function reconstitute(
        int $id,
        int $roundId,
        bool $isQualifier,
        ?int $raceNumber,
        ?RaceName $name,
        ?RaceType $type,
        QualifyingFormat $qualifyingFormat,
        ?int $qualifyingLength,
        ?string $qualifyingTire,
        GridSource $gridSource,
        ?int $gridSourceRaceId,
        RaceLengthType $lengthType,
        int $lengthValue,
        bool $extraLapAfterTime,
        ?string $weather,
        ?string $tireRestrictions,
        ?string $fuelUsage,
        ?string $damageModel,
        bool $trackLimitsEnforced,
        bool $falseStartDetection,
        bool $collisionPenalties,
        bool $mandatoryPitStop,
        ?int $minimumPitTime,
        ?string $assistsRestrictions,
        ?float $fastestLap,
        bool $fastestLapTop10,
        ?float $qualifyingPole,
        bool $qualifyingPoleTop10,
        PointsSystem $pointsSystem,
        float $dnfPoints,
        float $dnsPoints,
        bool $racePoints,
        ?string $raceNotes,
        RaceStatus $status,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            roundId: $roundId,
            isQualifier: $isQualifier,
            raceNumber: $raceNumber,
            name: $name,
            type: $type,
            qualifyingFormat: $qualifyingFormat,
            qualifyingLength: $qualifyingLength,
            qualifyingTire: $qualifyingTire,
            gridSource: $gridSource,
            gridSourceRaceId: $gridSourceRaceId,
            lengthType: $lengthType,
            lengthValue: $lengthValue,
            extraLapAfterTime: $extraLapAfterTime,
            weather: $weather,
            tireRestrictions: $tireRestrictions,
            fuelUsage: $fuelUsage,
            damageModel: $damageModel,
            trackLimitsEnforced: $trackLimitsEnforced,
            falseStartDetection: $falseStartDetection,
            collisionPenalties: $collisionPenalties,
            mandatoryPitStop: $mandatoryPitStop,
            minimumPitTime: $minimumPitTime,
            assistsRestrictions: $assistsRestrictions,
            fastestLap: $fastestLap,
            fastestLapTop10: $fastestLapTop10,
            qualifyingPole: $qualifyingPole,
            qualifyingPoleTop10: $qualifyingPoleTop10,
            pointsSystem: $pointsSystem,
            dnfPoints: $dnfPoints,
            dnsPoints: $dnsPoints,
            racePoints: $racePoints,
            raceNotes: $raceNotes,
            status: $status,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );
    }

    public function updateConfiguration(
        ?RaceName $name,
        ?RaceType $type,
        QualifyingFormat $qualifyingFormat,
        ?int $qualifyingLength,
        ?string $qualifyingTire,
        GridSource $gridSource,
        ?int $gridSourceRaceId,
        RaceLengthType $lengthType,
        ?int $lengthValue,
        bool $extraLapAfterTime,
        ?string $weather,
        ?string $tireRestrictions,
        ?string $fuelUsage,
        ?string $damageModel,
        bool $trackLimitsEnforced,
        bool $falseStartDetection,
        bool $collisionPenalties,
        bool $mandatoryPitStop,
        ?int $minimumPitTime,
        ?string $assistsRestrictions,
        ?float $fastestLap,
        bool $fastestLapTop10,
        ?float $qualifyingPole,
        bool $qualifyingPoleTop10,
        PointsSystem $pointsSystem,
        float $dnfPoints,
        float $dnsPoints,
        bool $racePoints,
        ?string $raceNotes,
    ): void {
        $hasChanges = false;

        if ($name !== null && ! $this->name?->equals($name)) {
            $this->name = $name;
            $hasChanges = true;
        }

        if ($type !== null && $this->type !== $type) {
            $this->type = $type;
            $hasChanges = true;
        }

        if ($this->qualifyingFormat !== $qualifyingFormat) {
            $this->qualifyingFormat = $qualifyingFormat;
            $hasChanges = true;
        }

        if ($this->qualifyingLength !== $qualifyingLength) {
            $this->qualifyingLength = $qualifyingLength;
            $hasChanges = true;
        }

        if ($this->qualifyingTire !== $qualifyingTire) {
            $this->qualifyingTire = $qualifyingTire;
            $hasChanges = true;
        }

        if ($this->gridSource !== $gridSource) {
            $this->gridSource = $gridSource;
            $hasChanges = true;
        }

        if ($this->gridSourceRaceId !== $gridSourceRaceId) {
            $this->gridSourceRaceId = $gridSourceRaceId;
            $hasChanges = true;
        }

        if ($this->lengthType !== $lengthType) {
            $this->lengthType = $lengthType;
            $hasChanges = true;
        }

        if ($this->lengthValue !== $lengthValue) {
            $this->lengthValue = $lengthValue;
            $hasChanges = true;
        }

        if ($this->extraLapAfterTime !== $extraLapAfterTime) {
            $this->extraLapAfterTime = $extraLapAfterTime;
            $hasChanges = true;
        }

        if ($this->weather !== $weather) {
            $this->weather = $weather;
            $hasChanges = true;
        }

        if ($this->tireRestrictions !== $tireRestrictions) {
            $this->tireRestrictions = $tireRestrictions;
            $hasChanges = true;
        }

        if ($this->fuelUsage !== $fuelUsage) {
            $this->fuelUsage = $fuelUsage;
            $hasChanges = true;
        }

        if ($this->damageModel !== $damageModel) {
            $this->damageModel = $damageModel;
            $hasChanges = true;
        }

        if ($this->trackLimitsEnforced !== $trackLimitsEnforced) {
            $this->trackLimitsEnforced = $trackLimitsEnforced;
            $hasChanges = true;
        }

        if ($this->falseStartDetection !== $falseStartDetection) {
            $this->falseStartDetection = $falseStartDetection;
            $hasChanges = true;
        }

        if ($this->collisionPenalties !== $collisionPenalties) {
            $this->collisionPenalties = $collisionPenalties;
            $hasChanges = true;
        }

        if ($this->mandatoryPitStop !== $mandatoryPitStop) {
            $this->mandatoryPitStop = $mandatoryPitStop;
            $hasChanges = true;
        }

        if ($this->minimumPitTime !== $minimumPitTime) {
            $this->minimumPitTime = $minimumPitTime;
            $hasChanges = true;
        }

        if ($this->assistsRestrictions !== $assistsRestrictions) {
            $this->assistsRestrictions = $assistsRestrictions;
            $hasChanges = true;
        }

        if ($this->fastestLap !== $fastestLap) {
            $this->fastestLap = $fastestLap;
            $hasChanges = true;
        }

        if ($this->fastestLapTop10 !== $fastestLapTop10) {
            $this->fastestLapTop10 = $fastestLapTop10;
            $hasChanges = true;
        }

        if ($this->qualifyingPole !== $qualifyingPole) {
            $this->qualifyingPole = $qualifyingPole;
            $hasChanges = true;
        }

        if ($this->qualifyingPoleTop10 !== $qualifyingPoleTop10) {
            $this->qualifyingPoleTop10 = $qualifyingPoleTop10;
            $hasChanges = true;
        }

        if ($this->pointsSystem->toArray() !== $pointsSystem->toArray()) {
            $this->pointsSystem = $pointsSystem;
            $hasChanges = true;
        }

        if ($this->dnfPoints !== $dnfPoints) {
            $this->dnfPoints = $dnfPoints;
            $hasChanges = true;
        }

        if ($this->dnsPoints !== $dnsPoints) {
            $this->dnsPoints = $dnsPoints;
            $hasChanges = true;
        }

        if ($this->racePoints !== $racePoints) {
            $this->racePoints = $racePoints;
            $hasChanges = true;
        }

        if ($this->raceNotes !== $raceNotes) {
            $this->raceNotes = $raceNotes;
            $hasChanges = true;
        }

        if ($hasChanges) {
            $this->updatedAt = new DateTimeImmutable();
            $this->events[] = new RaceUpdated(
                raceId: $this->id ?? 0,
                roundId: $this->roundId,
                occurredAt: $this->updatedAt,
            );
        }
    }

    public static function createQualifier(
        int $roundId,
        ?RaceName $name,
        QualifyingFormat $qualifyingFormat,
        ?int $qualifyingLength,
        ?string $qualifyingTire,
        ?string $weather,
        ?string $tireRestrictions,
        ?string $fuelUsage,
        ?string $damageModel,
        ?string $assistsRestrictions,
        ?float $qualifyingPole,
        bool $qualifyingPoleTop10,
        ?string $raceNotes,
    ): self {
        // Validate qualifier-specific rules
        if ($qualifyingFormat === QualifyingFormat::NONE) {
            throw InvalidQualifierConfigurationException::noQualifyingFormat();
        }

        if ($qualifyingLength !== null && $qualifyingLength < 1) {
            throw InvalidQualifierConfigurationException::invalidLength($qualifyingLength);
        }

        $now = new DateTimeImmutable();

        $qualifier = new self(
            id: null,
            roundId: $roundId,
            isQualifier: true,
            raceNumber: null,
            name: $name,
            type: null,
            qualifyingFormat: $qualifyingFormat,
            qualifyingLength: $qualifyingLength,
            qualifyingTire: $qualifyingTire,
            gridSource: GridSource::QUALIFYING,
            gridSourceRaceId: null,
            lengthType: RaceLengthType::TIME,
            lengthValue: $qualifyingLength,
            extraLapAfterTime: false,
            weather: $weather,
            tireRestrictions: $tireRestrictions,
            fuelUsage: $fuelUsage,
            damageModel: $damageModel,
            // Penalty fields are disabled for qualifiers by default
            trackLimitsEnforced: false,
            falseStartDetection: false,
            collisionPenalties: false,
            mandatoryPitStop: false,
            minimumPitTime: null,
            assistsRestrictions: $assistsRestrictions,
            // Bonus points - qualifiers don't award fastest lap points
            fastestLap: null,
            fastestLapTop10: false,
            qualifyingPole: $qualifyingPole,
            qualifyingPoleTop10: $qualifyingPoleTop10,
            pointsSystem: PointsSystem::from([1 => 0]),
            dnfPoints: 0,
            dnsPoints: 0,
            racePoints: false,
            raceNotes: $raceNotes,
            status: RaceStatus::SCHEDULED,
            createdAt: $now,
            updatedAt: $now,
        );

        $qualifier->events[] = new QualifierCreated(
            qualifierId: 0,
            roundId: $roundId,
            name: $name?->value(),
            occurredAt: $now,
        );

        return $qualifier;
    }

    public function updateQualifierConfiguration(
        ?RaceName $name,
        QualifyingFormat $qualifyingFormat,
        ?int $qualifyingLength,
        ?string $qualifyingTire,
        ?string $weather,
        ?string $tireRestrictions,
        ?string $fuelUsage,
        ?string $damageModel,
        ?string $assistsRestrictions,
        ?float $qualifyingPole,
        bool $qualifyingPoleTop10,
        ?string $raceNotes,
    ): void {
        if (! $this->isQualifier) {
            throw new \DomainException('Cannot update race as qualifier');
        }

        // Validate qualifier-specific rules
        if ($qualifyingFormat === QualifyingFormat::NONE) {
            throw InvalidQualifierConfigurationException::noQualifyingFormat();
        }

        if ($qualifyingLength !== null && $qualifyingLength < 1) {
            throw InvalidQualifierConfigurationException::invalidLength($qualifyingLength);
        }

        $hasChanges = false;

        if ($name !== null && ! $this->name?->equals($name)) {
            $this->name = $name;
            $hasChanges = true;
        }

        if ($this->qualifyingFormat !== $qualifyingFormat) {
            $this->qualifyingFormat = $qualifyingFormat;
            $this->lengthValue = $qualifyingLength;
            $hasChanges = true;
        }

        if ($this->qualifyingLength !== $qualifyingLength) {
            $this->qualifyingLength = $qualifyingLength;
            $this->lengthValue = $qualifyingLength;
            $hasChanges = true;
        }

        if ($this->qualifyingTire !== $qualifyingTire) {
            $this->qualifyingTire = $qualifyingTire;
            $hasChanges = true;
        }

        if ($this->weather !== $weather) {
            $this->weather = $weather;
            $hasChanges = true;
        }

        if ($this->tireRestrictions !== $tireRestrictions) {
            $this->tireRestrictions = $tireRestrictions;
            $hasChanges = true;
        }

        if ($this->fuelUsage !== $fuelUsage) {
            $this->fuelUsage = $fuelUsage;
            $hasChanges = true;
        }

        if ($this->damageModel !== $damageModel) {
            $this->damageModel = $damageModel;
            $hasChanges = true;
        }

        // Penalty fields are not editable for qualifiers - they remain disabled

        if ($this->assistsRestrictions !== $assistsRestrictions) {
            $this->assistsRestrictions = $assistsRestrictions;
            $hasChanges = true;
        }

        if ($this->qualifyingPole !== $qualifyingPole) {
            $this->qualifyingPole = $qualifyingPole;
            $hasChanges = true;
        }

        if ($this->qualifyingPoleTop10 !== $qualifyingPoleTop10) {
            $this->qualifyingPoleTop10 = $qualifyingPoleTop10;
            $hasChanges = true;
        }

        if ($this->raceNotes !== $raceNotes) {
            $this->raceNotes = $raceNotes;
            $hasChanges = true;
        }

        if ($hasChanges) {
            $this->updatedAt = new DateTimeImmutable();
            $this->events[] = new QualifierUpdated(
                qualifierId: $this->id ?? 0,
                roundId: $this->roundId,
                occurredAt: $this->updatedAt,
            );
        }
    }

    // Getters
    public function id(): ?int
    {
        return $this->id;
    }

    public function roundId(): int
    {
        return $this->roundId;
    }

    public function isQualifier(): bool
    {
        return $this->isQualifier;
    }

    public function raceNumber(): ?int
    {
        return $this->raceNumber;
    }

    public function name(): ?RaceName
    {
        return $this->name;
    }

    public function type(): ?RaceType
    {
        return $this->type;
    }

    public function qualifyingFormat(): QualifyingFormat
    {
        return $this->qualifyingFormat;
    }

    public function qualifyingLength(): ?int
    {
        return $this->qualifyingLength;
    }

    public function qualifyingTire(): ?string
    {
        return $this->qualifyingTire;
    }

    public function gridSource(): GridSource
    {
        return $this->gridSource;
    }

    public function gridSourceRaceId(): ?int
    {
        return $this->gridSourceRaceId;
    }

    public function lengthType(): RaceLengthType
    {
        return $this->lengthType;
    }

    public function lengthValue(): ?int
    {
        return $this->lengthValue;
    }

    public function extraLapAfterTime(): bool
    {
        return $this->extraLapAfterTime;
    }

    public function weather(): ?string
    {
        return $this->weather;
    }

    public function tireRestrictions(): ?string
    {
        return $this->tireRestrictions;
    }

    public function fuelUsage(): ?string
    {
        return $this->fuelUsage;
    }

    public function damageModel(): ?string
    {
        return $this->damageModel;
    }

    public function trackLimitsEnforced(): bool
    {
        return $this->trackLimitsEnforced;
    }

    public function falseStartDetection(): bool
    {
        return $this->falseStartDetection;
    }

    public function collisionPenalties(): bool
    {
        return $this->collisionPenalties;
    }

    public function mandatoryPitStop(): bool
    {
        return $this->mandatoryPitStop;
    }

    public function minimumPitTime(): ?int
    {
        return $this->minimumPitTime;
    }

    public function assistsRestrictions(): ?string
    {
        return $this->assistsRestrictions;
    }

    public function pointsSystem(): PointsSystem
    {
        return $this->pointsSystem;
    }

    public function fastestLap(): ?float
    {
        return $this->fastestLap;
    }

    public function fastestLapTop10(): bool
    {
        return $this->fastestLapTop10;
    }

    public function qualifyingPole(): ?float
    {
        return $this->qualifyingPole;
    }

    public function qualifyingPoleTop10(): bool
    {
        return $this->qualifyingPoleTop10;
    }

    public function dnfPoints(): float
    {
        return $this->dnfPoints;
    }

    public function dnsPoints(): float
    {
        return $this->dnsPoints;
    }

    public function racePoints(): bool
    {
        return $this->racePoints;
    }

    public function raceNotes(): ?string
    {
        return $this->raceNotes;
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function status(): RaceStatus
    {
        return $this->status;
    }

    /**
     * Mark race as completed.
     */
    public function markAsCompleted(): void
    {
        if ($this->status !== RaceStatus::COMPLETED) {
            $this->status = RaceStatus::COMPLETED;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    /**
     * Mark race as scheduled.
     */
    public function markAsScheduled(): void
    {
        if ($this->status !== RaceStatus::SCHEDULED) {
            $this->status = RaceStatus::SCHEDULED;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    // For repository use
    public function setId(int $id): void
    {
        $this->id = $id;

        // Update event IDs if this is a new entity
        foreach ($this->events as $event) {
            if ($event instanceof RaceCreated && $event->raceId === 0) {
                $this->events = array_filter($this->events, fn ($e) => $e !== $event);
                $this->events[] = new RaceCreated(
                    raceId: $id,
                    roundId: $event->roundId,
                    raceNumber: $event->raceNumber,
                    name: $event->name,
                    type: $event->type,
                    occurredAt: $event->occurredAt,
                );
            } elseif ($event instanceof QualifierCreated && $event->qualifierId === 0) {
                $this->events = array_filter($this->events, fn ($e) => $e !== $event);
                $this->events[] = new QualifierCreated(
                    qualifierId: $id,
                    roundId: $event->roundId,
                    name: $event->name,
                    occurredAt: $event->occurredAt,
                );
            }
        }
    }

    /**
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->events;
        $this->events = [];

        return $events;
    }

    /**
     * @return array<object>
     */
    public function events(): array
    {
        return $this->events;
    }
}
