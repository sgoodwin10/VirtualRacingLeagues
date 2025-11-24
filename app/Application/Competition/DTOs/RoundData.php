<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Round;
use Spatie\LaravelData\Data;

/**
 * Response DTO for round data.
 */
final class RoundData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $season_id,
        public readonly int $round_number,
        public readonly ?string $name,
        public readonly string $slug,
        public readonly ?string $scheduled_at,
        public readonly string $timezone,
        public readonly ?int $platform_track_id,
        public readonly ?string $track_layout,
        public readonly ?string $track_conditions,
        public readonly ?string $technical_notes,
        public readonly ?string $stream_url,
        public readonly ?string $internal_notes,
        public readonly ?int $fastest_lap,
        public readonly bool $fastest_lap_top_10,
        public readonly ?string $points_system,
        public readonly bool $round_points,
        public readonly string $status,
        public readonly string $status_label,
        public readonly int $created_by_user_id,
        public readonly string $created_at,
        public readonly string $updated_at,
        public readonly ?string $deleted_at,
    ) {
    }

    /**
     * Create from domain entity.
     */
    public static function fromEntity(Round $round): self
    {
        return new self(
            id: $round->id() ?? 0,
            season_id: $round->seasonId(),
            round_number: $round->roundNumber()->value(),
            name: $round->name()?->value(),
            slug: $round->slug()->value(),
            scheduled_at: $round->scheduledAt()?->format('Y-m-d H:i:s'),
            timezone: $round->timezone(),
            platform_track_id: $round->platformTrackId(),
            track_layout: $round->trackLayout(),
            track_conditions: $round->trackConditions(),
            technical_notes: $round->technicalNotes(),
            stream_url: $round->streamUrl(),
            internal_notes: $round->internalNotes(),
            fastest_lap: $round->fastestLap(),
            fastest_lap_top_10: $round->fastestLapTop10(),
            points_system: $round->pointsSystem()?->toJson(),
            round_points: $round->roundPoints(),
            status: $round->status()->value,
            status_label: $round->status()->label(),
            created_by_user_id: $round->createdByUserId(),
            created_at: $round->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $round->updatedAt()->format('Y-m-d H:i:s'),
            deleted_at: $round->deletedAt()?->format('Y-m-d H:i:s'),
        );
    }
}
