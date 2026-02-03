<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\Admin\Events\UserImpersonationStarted;
use App\Models\User;

/**
 * Listener for UserImpersonationStarted event.
 * Logs when an admin generates an impersonation token.
 */
final class LogUserImpersonationStarted
{
    /**
     * Handle the event.
     */
    public function handle(UserImpersonationStarted $event): void
    {
        // Log activity on the admin's model
        activity()
            ->causedBy($event->adminId)
            ->performedOn(User::find($event->userId))
            ->withProperties([
                'admin_id' => $event->adminId,
                'admin_email' => $event->adminEmail,
                'user_id' => $event->userId,
                'user_email' => $event->userEmail,
                'token' => substr($event->token, 0, 8).'...', // Log only first 8 chars for security
            ])
            ->log('Admin generated impersonation token for user');
    }
}
