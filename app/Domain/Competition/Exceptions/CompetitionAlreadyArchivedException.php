<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

/**
 * Exception thrown when attempting to archive an already archived competition.
 */
class CompetitionAlreadyArchivedException extends \DomainException
{
    public function __construct()
    {
        parent::__construct('Competition is already archived');
    }
}
