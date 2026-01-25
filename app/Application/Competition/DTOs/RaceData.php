<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Race;
use Spatie\LaravelData\Data;

final class RaceData extends Data
{
    /**
     * @param  array<int, float>  $points_system  Points system array (position => points)
     */
    public function __construct(
        public readonly int $id,
        public readonly int $round_id,
        public readonly bool $is_qualifier,
        public readonly ?int $race_number,
        public readonly ?string $name,
        public readonly string $race_type,
        // Qualifying
        public readonly string $qualifying_format,
        public readonly ?int $qualifying_length,
        public readonly ?string $qualifying_tire,
        // Grid
        public readonly string $grid_source,
        public readonly ?int $grid_source_race_id,
        // Length
        public readonly string $length_type,
        public readonly ?int $length_value,
        public readonly bool $extra_lap_after_time,
        // Platform settings
        public readonly ?string $weather,
        public readonly ?string $tire_restrictions,
        public readonly ?string $fuel_usage,
        public readonly ?string $damage_model,
        // Penalties & Rules
        public readonly bool $track_limits_enforced,
        public readonly bool $false_start_detection,
        public readonly bool $collision_penalties,
        public readonly bool $mandatory_pit_stop,
        public readonly ?int $minimum_pit_time,
        public readonly ?string $assists_restrictions,
        // Bonus Points
        public readonly ?float $fastest_lap,
        public readonly bool $fastest_lap_top_10,
        public readonly ?float $qualifying_pole,
        public readonly bool $qualifying_pole_top_10,
        // Points
        public readonly array $points_system,
        public readonly float $dnf_points,
        public readonly float $dns_points,
        public readonly bool $race_points,
        // Notes
        public readonly ?string $race_notes,
        // Status
        public readonly string $status,
        // Orphaned results flag
        public readonly bool $has_orphaned_results,
        // Timestamps
        public readonly string $created_at,
        public readonly string $updated_at,
    ) {
    }

    public static function fromEntity(Race $race, bool $hasOrphanedResults = false): self
    {
        $isQualifier = $race->isQualifier();
        $raceId = $race->id();

        if ($raceId === null) {
            throw new \InvalidArgumentException('Race entity must have a valid ID');
        }

        return new self(
            id: $raceId,
            round_id: $race->roundId(),
            is_qualifier: $isQualifier,
            race_number: $isQualifier ? null : $race->raceNumber(),
            name: $race->name()?->value(),
            race_type: match (true) {
                $isQualifier => 'qualifying',
                default => $race->type()->value ?? 'feature',
            },
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
            fastest_lap: $race->fastestLap(),
            fastest_lap_top_10: $race->fastestLapTop10(),
            qualifying_pole: $race->qualifyingPole(),
            qualifying_pole_top_10: $race->qualifyingPoleTop10(),
            points_system: $race->pointsSystem()->toArray(),
            dnf_points: $race->dnfPoints(),
            dns_points: $race->dnsPoints(),
            race_points: $race->racePoints(),
            race_notes: $race->raceNotes(),
            status: $race->status()->value,
            has_orphaned_results: $hasOrphanedResults,
            created_at: $race->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $race->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
