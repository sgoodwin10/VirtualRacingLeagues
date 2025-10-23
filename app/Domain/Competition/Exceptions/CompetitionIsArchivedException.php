<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

/**
 * Exception thrown when attempting to update an archived competition.
 */
class CompetitionIsArchivedException extends \DomainException
{
    public function __construct()
    {
        parent::__construct('Cannot update archived competition. Archive status must be changed first.');
    }
}
