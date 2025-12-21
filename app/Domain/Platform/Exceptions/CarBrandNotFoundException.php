<?php

declare(strict_types=1);

namespace App\Domain\Platform\Exceptions;

/**
 * Exception thrown when a car brand cannot be found.
 */
final class CarBrandNotFoundException extends \Exception
{
    public static function withId(int $id): self
    {
        return new self("Car brand with ID {$id} not found");
    }

    public static function withName(string $name): self
    {
        return new self("Car brand with name '{$name}' not found");
    }
}
