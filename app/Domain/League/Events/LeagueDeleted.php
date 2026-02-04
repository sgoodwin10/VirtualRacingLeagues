<?php

declare(strict_types=1);

namespace App\Domain\League\Events;

use App\Domain\League\Entities\League;

/**
 * Domain event: League was permanently deleted.
 * This event is triggered when a league and all its associated data is hard deleted.
 */
final readonly class LeagueDeleted
{
    public function __construct(
        public int $leagueId,
        public string $leagueName,
        public string $leagueSlug,
        public int $ownerUserId,
    ) {
    }

    public static function fromLeague(League $league): self
    {
        if ($league->id() === null) {
            throw new \LogicException('Cannot create LeagueDeleted event for league without an ID');
        }

        return new self(
            leagueId: $league->id(),
            leagueName: $league->name()->value(),
            leagueSlug: $league->slug()->value(),
            ownerUserId: $league->ownerUserId(),
        );
    }
}
