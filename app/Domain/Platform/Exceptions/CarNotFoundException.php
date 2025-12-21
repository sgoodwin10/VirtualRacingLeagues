<?php

declare(strict_types=1);

namespace App\Domain\Platform\Exceptions;

/**
 * Exception thrown when a car cannot be found.
 */
final class CarNotFoundException extends \Exception
{
    public static function withId(int $id): self
    {
        return new self("Car with ID {$id} not found");
    }

    public static function withExternalId(string $externalId, int $platformId): self
    {
        return new self("Car with external ID {$externalId} not found for platform {$platformId}");
    }
}
