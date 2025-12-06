<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exceptions;

use DomainException;

/**
 * Base exception for all domain "not found" exceptions.
 *
 * This marker exception allows for centralized handling of 404 responses
 * in the application exception handler (bootstrap/app.php).
 */
abstract class DomainNotFoundException extends DomainException
{
}
