<?php

declare(strict_types=1);

namespace App\Domain\Team\Events;

/**
 * Domain event triggered when a team is created.
 */
final readonly class TeamCreated
{
    public function __construct(
        public int $teamId,
        public int $seasonId,
        public string $name,
        public ?string $logoUrl,
    ) {
    }
}
