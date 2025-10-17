<?php

declare(strict_types=1);

namespace App\Domain\Admin\Exceptions;

use DomainException;

/**
 * Exception thrown when attempting to modify an already deleted admin.
 */
final class AdminAlreadyDeletedException extends DomainException
{
    //
}
