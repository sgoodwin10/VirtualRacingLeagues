<?php

declare(strict_types=1);

namespace App\Domain\Admin\Exceptions;

use DomainException;

/**
 * Exception thrown when an admin lacks sufficient permissions for an action.
 */
final class InsufficientPermissionsException extends DomainException
{
    //
}
