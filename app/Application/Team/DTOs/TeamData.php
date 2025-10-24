<?php

declare(strict_types=1);

namespace App\Application\Team\DTOs;

use App\Domain\Team\Entities\Team;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object representing a team.
 */
final class TeamData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $season_id,
        public readonly string $name,
        public readonly ?string $logo_url,
        public readonly string $created_at,
        public readonly string $updated_at,
    ) {
    }

    /**
     * Create from domain entity.
     */
    public static function fromEntity(Team $team): self
    {
        return new self(
            id: $team->id() ?? 0,
            season_id: $team->seasonId(),
            name: $team->name()->value(),
            logo_url: $team->logoUrl()
                ? Storage::disk('public')->url($team->logoUrl())
                : null,
            created_at: $team->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $team->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
