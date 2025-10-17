<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

use App\Domain\Admin\Entities\Admin;

/**
 * Domain Event: Admin Activated.
 * Dispatched when an admin is activated.
 */
final readonly class AdminActivated
{
    public function __construct(
        public readonly Admin $admin,
    ) {
    }
}
