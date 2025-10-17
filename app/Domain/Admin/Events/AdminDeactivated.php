<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

use App\Domain\Admin\Entities\Admin;

/**
 * Domain Event: Admin Deactivated.
 * Dispatched when an admin is deactivated.
 */
final readonly class AdminDeactivated
{
    public function __construct(
        public readonly Admin $admin,
    ) {
    }
}
