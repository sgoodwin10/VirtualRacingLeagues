<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * Output DTO representing a tiebreaker rule assigned to a season with its order.
 */
final class SeasonTiebreakerRuleData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?string $description,
        public int $order,
    ) {
    }
}
