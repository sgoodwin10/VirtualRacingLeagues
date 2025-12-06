<?php

declare(strict_types=1);

namespace App\Domain\League\Exceptions;

use App\Domain\Shared\Exceptions\DomainNotFoundException;

class LeagueNotFoundException extends DomainNotFoundException
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
