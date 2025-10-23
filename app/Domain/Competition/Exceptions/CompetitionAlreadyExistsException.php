<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

/**
 * Exception thrown when a competition already exists.
 */
class CompetitionAlreadyExistsException extends \DomainException
{
    public static function withName(string $name, int $leagueId): self
    {
        return new self("Competition with name '{$name}' already exists in league {$leagueId}");
    }

    public static function withSlug(string $slug, int $leagueId): self
    {
        return new self("Competition with slug '{$slug}' already exists in league {$leagueId}");
    }
}
