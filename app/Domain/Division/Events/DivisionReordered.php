<?php

declare(strict_types=1);

namespace App\Domain\Division\Events;

/**
 * Event fired when a division is reordered.
 */
final readonly class DivisionReordered
{
    public function __construct(
        public int $divisionId,
        public int $seasonId,
        public int $oldOrder,
        public int $newOrder,
    ) {
    }
}
