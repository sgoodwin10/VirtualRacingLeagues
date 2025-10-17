<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

use App\Domain\Admin\Entities\Admin;

/**
 * Domain Event: Admin Restored.
 * Dispatched when a soft deleted admin is restored.
 */
final readonly class AdminRestored
{
    public function __construct(
        public readonly Admin $admin,
    ) {
    }
}
