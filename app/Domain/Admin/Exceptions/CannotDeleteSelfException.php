<?php

declare(strict_types=1);

namespace App\Domain\Admin\Exceptions;

use DomainException;

/**
 * Exception thrown when an admin attempts to delete themselves.
 */
final class CannotDeleteSelfException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Cannot delete your own admin account');
    }
}
