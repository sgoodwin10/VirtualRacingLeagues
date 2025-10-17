<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\ValueObjects\AdminRole;

/**
 * Domain Event: Admin Role Changed.
 * Dispatched when an admin's role is changed.
 */
final readonly class AdminRoleChanged
{
    public function __construct(
        public readonly Admin $admin,
        public readonly AdminRole $oldRole,
        public readonly AdminRole $newRole,
    ) {
    }
}
