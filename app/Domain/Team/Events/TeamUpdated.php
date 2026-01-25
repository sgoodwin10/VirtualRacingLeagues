<?php

declare(strict_types=1);

namespace App\Domain\Team\Events;

/**
 * Domain event triggered when a team is updated.
 */
final readonly class TeamUpdated
{
    /**
     * @param  array<string, mixed>  $changes
     */
    public function __construct(
        public int $teamId,
        public array $changes,
    ) {
    }
}
