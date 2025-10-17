<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

use App\Domain\Admin\Entities\Admin;

/**
 * Domain Event: Admin Created.
 * Dispatched when a new admin is created.
 */
final readonly class AdminCreated
{
    public function __construct(
        public readonly Admin $admin,
    ) {
    }
}
