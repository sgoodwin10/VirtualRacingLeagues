<?php

declare(strict_types=1);

namespace App\Domain\Division\Events;

/**
 * Event fired when a division is deleted.
 */
final readonly class DivisionDeleted
{
    public function __construct(
        public int $divisionId,
        public int $seasonId,
    ) {
    }
}
