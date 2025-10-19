<?php

declare(strict_types=1);

namespace App\Domain\League\Exceptions;

use DomainException;

class LeagueLimitReachedException extends DomainException
{
    public static function forFreeTier(int $limit): self
    {
        return new self("You have reached the maximum number of leagues ({$limit}) for the free tier. Please upgrade your account to create more leagues.");
    }
}
