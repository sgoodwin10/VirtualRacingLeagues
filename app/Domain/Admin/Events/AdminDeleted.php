<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

use App\Domain\Admin\Entities\Admin;

/**
 * Domain Event: Admin Deleted.
 * Dispatched when an admin is soft deleted.
 */
final readonly class AdminDeleted
{
    public function __construct(
        public readonly Admin $admin,
    ) {
    }
}
