<?php

declare(strict_types=1);

namespace App\Application\Platform\DTOs;

use Spatie\LaravelData\Data;

/**
 * Import Result Data Transfer Object.
 */
final class ImportResultData extends Data
{
    /**
     * @param array<string> $errors
     */
    public function __construct(
        public int $brandsCreated,
        public int $carsCreated,
        public int $carsUpdated,
        public int $carsDeactivated,
        public int $totalProcessed,
        public array $errors,
        public string $completedAt,
    ) {
    }
}
