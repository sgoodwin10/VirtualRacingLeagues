<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

use App\Domain\Admin\Entities\Admin;

/**
 * Domain Event: Admin Authenticated.
 * Dispatched when an admin successfully authenticates.
 */
final readonly class AdminAuthenticated
{
    public function __construct(
        public readonly Admin $admin,
    ) {
    }
}
