<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Race;
use InvalidArgumentException;
use Spatie\LaravelData\Data;

final class QualifierData extends Data
{
    public function __construct(
        public int $id,
        public int $round_id,
        public ?string $name,

        // Qualifying Configuration
        public string $qualifying_format,
        public int $qualifying_length,
        public ?string $qualifying_tire,

        // Platform Settings
        public ?string $weather,
        public ?string $tire_restrictions,
        public ?string $fuel_usage,
        public ?string $damage_model,

        // Penalties & Rules
        public bool $track_limits_enforced,
        public bool $false_start_detection,
        public bool $collision_penalties,
        public ?string $assists_restrictions,

        // Division Support
        public bool $race_divisions,

        // Bonus Points
        public ?array $bonus_points,

        // Notes
        public ?string $race_notes,

        // Timestamps
        public string $created_at,
        public string $updated_at,
    ) {
    }

    public static function fromEntity(Race $qualifier): self
    {
        if (!$qualifier->isQualifier()) {
            throw new InvalidArgumentException('Entity must be a qualifier');
        }

        return new self(
            id: $qualifier->id() ?? 0,
            round_id: $qualifier->roundId(),
            name: $qualifier->name()?->value(),
            qualifying_format: $qualifier->qualifyingFormat()->value,
            qualifying_length: $qualifier->qualifyingLength() ?? 0,
            qualifying_tire: $qualifier->qualifyingTire(),
            weather: $qualifier->weather(),
            tire_restrictions: $qualifier->tireRestrictions(),
            fuel_usage: $qualifier->fuelUsage(),
            damage_model: $qualifier->damageModel(),
            track_limits_enforced: $qualifier->trackLimitsEnforced(),
            false_start_detection: $qualifier->falseStartDetection(),
            collision_penalties: $qualifier->collisionPenalties(),
            assists_restrictions: $qualifier->assistsRestrictions(),
            race_divisions: $qualifier->raceDivisions(),
            bonus_points: $qualifier->bonusPoints(),
            race_notes: $qualifier->raceNotes(),
            created_at: $qualifier->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $qualifier->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
