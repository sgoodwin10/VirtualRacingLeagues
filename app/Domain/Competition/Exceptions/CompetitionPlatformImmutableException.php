<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

/**
 * Exception thrown when attempting to change competition platform after creation.
 */
class CompetitionPlatformImmutableException extends \DomainException
{
    public function __construct()
    {
        parent::__construct('Competition platform cannot be changed after creation');
    }
}
