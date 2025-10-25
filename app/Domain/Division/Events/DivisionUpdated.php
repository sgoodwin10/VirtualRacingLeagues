<?php

declare(strict_types=1);

namespace App\Domain\Division\Events;

/**
 * Event fired when a division is updated.
 */
final readonly class DivisionUpdated
{
    /**
     * @param int $divisionId
     * @param array<string, mixed> $changes
     */
    public function __construct(
        public int $divisionId,
        public array $changes,
    ) {
    }
}
