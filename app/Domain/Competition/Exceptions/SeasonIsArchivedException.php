<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use RuntimeException;

/**
 * Exception thrown when trying to modify an archived season.
 */
final class SeasonIsArchivedException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Cannot modify archived season. Restore to completed status first.');
    }

    public static function withId(int $id): self
    {
        $exception = new self();
        $exception->message = "Cannot modify archived season with ID {$id}. Restore to completed status first.";

        return $exception;
    }
}
