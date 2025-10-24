<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\User\Events\UserImpersonated;
use Spatie\Activitylog\Models\Activity;

/**
 * Listener for UserImpersonated event.
 * Logs when an admin successfully impersonates a user (token consumed).
 */
final class LogUserImpersonated
{
    /**
     * Handle the event.
     */
    public function handle(UserImpersonated $event): void
    {
        // Log activity on the user's model
        activity()
            ->causedBy($event->adminId)
            ->performedOn(\App\Models\User::find($event->userId))
            ->withProperties([
                'admin_id' => $event->adminId,
                'admin_email' => $event->adminEmail,
                'user_id' => $event->userId,
                'user_email' => $event->userEmail,
            ])
            ->log('Admin impersonated user');
    }
}
