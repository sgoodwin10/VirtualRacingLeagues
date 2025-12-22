<?php

declare(strict_types=1);

namespace App\Domain\Platform\Exceptions;

use App\Domain\Shared\Exceptions\DomainNotFoundException;

class PlatformNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self("Platform with ID {$id} not found");
    }

    public static function withName(string $name): self
    {
        return new self("Platform with name '{$name}' not found");
    }
}
