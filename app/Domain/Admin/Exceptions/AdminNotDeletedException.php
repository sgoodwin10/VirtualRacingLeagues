<?php

declare(strict_types=1);

namespace App\Domain\Admin\Exceptions;

use DomainException;

/**
 * Exception thrown when attempting to restore an admin that is not deleted.
 */
final class AdminNotDeletedException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("Admin with ID {$id} is not deleted and cannot be restored");
    }
}
