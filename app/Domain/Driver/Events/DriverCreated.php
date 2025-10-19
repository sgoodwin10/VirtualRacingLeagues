<?php

declare(strict_types=1);

namespace App\Domain\Driver\Events;

final readonly class DriverCreated
{
    public function __construct(
        public int $driverId,
        public string $displayName,
        public string $primaryPlatformId
    ) {
    }
}
