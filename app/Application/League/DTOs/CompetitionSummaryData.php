<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Domain\Competition\Entities\Competition;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object representing a competition summary.
 * Used for nested competition data in league details.
 */
final class CompetitionSummaryData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly string $status,
        public readonly int $platform_id,
        public readonly string $platform_name,
        public readonly string $platform_slug,
        public readonly int $season_count,
        public readonly string $created_at,
    ) {
    }

    /**
     * Create from domain entity with platform and season count.
     */
    public static function fromEntity(
        Competition $competition,
        string $platformName,
        string $platformSlug,
        int $seasonCount
    ): self {
        $competitionId = $competition->id();
        if ($competitionId === null) {
            throw new \LogicException('Cannot create DTO from unpersisted Competition entity');
        }

        return new self(
            id: $competitionId,
            name: $competition->name()->value(),
            slug: $competition->slug()->value(),
            status: $competition->status()->value,
            platform_id: $competition->platformId(),
            platform_name: $platformName,
            platform_slug: $platformSlug,
            season_count: $seasonCount,
            created_at: $competition->createdAt()->format('Y-m-d H:i:s'),
        );
    }
}
