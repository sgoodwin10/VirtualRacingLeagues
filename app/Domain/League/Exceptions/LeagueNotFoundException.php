<?php

declare(strict_types=1);

namespace App\Domain\League\Exceptions;

use DomainException;

class LeagueNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("League with ID {$id} not found");
    }

    public static function withSlug(string $slug): self
    {
        return new self("League with slug '{$slug}' not found");
    }
}
