<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Application\Platform\DTOs\PlatformData;
use Spatie\LaravelData\Data;

/**
 * Public Competition Detail DTO.
 * Used for displaying competition information with nested seasons in league details.
 */
final class PublicCompetitionDetailData extends Data
{
    /**
     * @param  array{total_seasons: int, active_seasons: int, total_drivers: int}  $stats
     * @param  array<int, PublicSeasonSummaryData>  $seasons
     */
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly ?string $logo_url,
        public readonly ?string $competition_colour,
        public readonly PlatformData $platform,
        public readonly array $stats,
        public readonly array $seasons,
    ) {
    }
}
