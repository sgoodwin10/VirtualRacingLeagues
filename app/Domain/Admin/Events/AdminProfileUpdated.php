<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

use App\Domain\Admin\Entities\Admin;

/**
 * Domain Event: Admin Profile Updated.
 * Dispatched when an admin's profile information is updated (name, email).
 */
final readonly class AdminProfileUpdated
{
    /**
     * @param array<string, array{old: mixed, new: mixed}> $changedAttributes
     */
    public function __construct(
        public readonly Admin $admin,
        public readonly array $changedAttributes,
    ) {
    }
}
