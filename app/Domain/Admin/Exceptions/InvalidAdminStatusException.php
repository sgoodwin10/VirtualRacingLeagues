<?php

declare(strict_types=1);

namespace App\Domain\Admin\Exceptions;

use DomainException;

/**
 * Invalid Admin Status Domain Exception.
 */
final class InvalidAdminStatusException extends DomainException
{
    public static function alreadyActive(int $adminId): self
    {
        return new self("Admin with ID {$adminId} is already active");
    }

    public static function alreadyInactive(int $adminId): self
    {
        return new self("Admin with ID {$adminId} is already inactive");
    }

    public static function cannotActivateDeletedAdmin(int $adminId): self
    {
        return new self("Cannot activate deleted admin with ID {$adminId}");
    }

    public static function cannotDeactivateDeletedAdmin(int $adminId): self
    {
        return new self("Cannot deactivate deleted admin with ID {$adminId}");
    }

    public static function adminIsInactive(int $adminId): self
    {
        return new self("Admin with ID {$adminId} is inactive");
    }
}
