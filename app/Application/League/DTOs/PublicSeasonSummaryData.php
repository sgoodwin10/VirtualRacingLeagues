<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

/**
 * Public Season Summary DTO.
 * Used for displaying season information in competition cards.
 */
final class PublicSeasonSummaryData extends Data
{
    /**
     * @param  array{total_drivers: int, active_drivers: int, total_rounds: int, completed_rounds: int}  $stats
     */
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $car_class,
        public readonly string $status,
        public readonly array $stats,
    ) {
    }
}
