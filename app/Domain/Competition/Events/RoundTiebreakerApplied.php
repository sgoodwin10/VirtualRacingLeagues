<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * RoundTiebreakerApplied Domain Event.
 *
 * Fired when tiebreaker rules are applied to a round.
 */
final readonly class RoundTiebreakerApplied
{
    public function __construct(
        public int $roundId,
        public int $seasonId,
        public int $resolutionsCount,
        public bool $hadUnresolvedTies,
        public string $occurredAt,
    ) {
    }
}
