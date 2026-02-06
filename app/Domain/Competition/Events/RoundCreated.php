<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * Domain event fired when a round is created.
 */
final readonly class RoundCreated
{
    public function __construct(
        public int $roundId,
        public int $seasonId,
        public int $roundNumber,
        public ?string $name,
        public string $slug,
        public ?string $scheduledAt,
        public ?int $platformTrackId,
        public ?int $createdByUserId,
        public string $occurredAt,
    ) {
    }
}
