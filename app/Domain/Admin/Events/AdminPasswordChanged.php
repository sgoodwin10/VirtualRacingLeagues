<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

use App\Domain\Admin\Entities\Admin;

/**
 * Domain Event: Admin Password Changed.
 * Dispatched when an admin's password is changed.
 */
final readonly class AdminPasswordChanged
{
    public function __construct(
        public readonly Admin $admin,
    ) {
    }
}
