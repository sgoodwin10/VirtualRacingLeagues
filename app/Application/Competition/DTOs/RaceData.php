<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Race;
use Spatie\LaravelData\Data;

final class RaceData extends Data
{
    public function __construct(
        public int $id,
        public int $round_id,
        public bool $is_qualifier,
        public int $race_number,
        public ?string $name,
        public string $race_type,
        // Qualifying
        public string $qualifying_format,
        public ?int $qualifying_length,
        public ?string $qualifying_tire,
        // Grid
        public string $grid_source,
        public ?int $grid_source_race_id,
        // Length
        public string $length_type,
        public int $length_value,
        public bool $extra_lap_after_time,
        // Platform settings
        public ?string $weather,
        public ?string $tire_restrictions,
        public ?string $fuel_usage,
        public ?string $damage_model,
        // Penalties & Rules
        public bool $track_limits_enforced,
        public bool $false_start_detection,
        public bool $collision_penalties,
        public bool $mandatory_pit_stop,
        public ?int $minimum_pit_time,
        public ?string $assists_restrictions,
        // Points
        public array $points_system,
        public ?array $bonus_points,
        public int $dnf_points,
        public int $dns_points,
        public bool $race_points,
        // Notes
        public ?string $race_notes,
        // Status
        public string $status,
        // Timestamps
        public string $created_at,
        public string $updated_at,
    ) {
    }

    public static function fromEntity(Race $race): self
    {
        $isQualifier = $race->isQualifier();

        return new self(
            id: $race->id() ?? 0,
            round_id: $race->roundId(),
            is_qualifier: $isQualifier,
            race_number: $isQualifier ? 0 : ($race->raceNumber() ?? 0),
            name: $race->name()?->value(),
            race_type: $isQualifier ? 'qualifying' : ($race->type()->value ?? 'feature'),
            qualifying_format: $race->qualifyingFormat()->value,
            qualifying_length: $race->qualifyingLength(),
            qualifying_tire: $race->qualifyingTire(),
            grid_source: $race->gridSource()->value,
            grid_source_race_id: $race->gridSourceRaceId(),
            length_type: $race->lengthType()->value,
            length_value: $race->lengthValue(),
            extra_lap_after_time: $race->extraLapAfterTime(),
            weather: $race->weather(),
            tire_restrictions: $race->tireRestrictions(),
            fuel_usage: $race->fuelUsage(),
            damage_model: $race->damageModel(),
            track_limits_enforced: $race->trackLimitsEnforced(),
            false_start_detection: $race->falseStartDetection(),
            collision_penalties: $race->collisionPenalties(),
            mandatory_pit_stop: $race->mandatoryPitStop(),
            minimum_pit_time: $race->minimumPitTime(),
            assists_restrictions: $race->assistsRestrictions(),
            points_system: $race->pointsSystem()->toArray(),
            bonus_points: $race->bonusPoints(),
            dnf_points: $race->dnfPoints(),
            dns_points: $race->dnsPoints(),
            race_points: $race->racePoints(),
            race_notes: $race->raceNotes(),
            status: $race->status()->value,
            created_at: $race->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $race->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
