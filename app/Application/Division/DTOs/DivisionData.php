<?php

declare(strict_types=1);

namespace App\Application\Division\DTOs;

use App\Domain\Division\Entities\Division;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object representing a division.
 */
final class DivisionData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $season_id,
        public readonly string $name,
        public readonly ?string $description,
        public readonly ?string $logo_url,
        public readonly int $order,
        public readonly string $created_at,
        public readonly string $updated_at,
    ) {
    }

    /**
     * Create from domain entity.
     *
     * @throws \LogicException if entity has no ID (not yet persisted)
     */
    public static function fromEntity(Division $division): self
    {
        $divisionId = $division->id();
        if ($divisionId === null) {
            throw new \LogicException('Cannot create DivisionData from unpersisted entity without ID');
        }

        return new self(
            id: $divisionId,
            season_id: $division->seasonId(),
            name: $division->name()->value(),
            description: $division->description()->value(),
            logo_url: $division->logoUrl()
                ? Storage::disk('public')->url($division->logoUrl())
                : null,
            order: $division->order(),
            created_at: $division->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $division->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
