<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\User\Events\EmailVerificationRequested;
use App\Models\User;
use App\Notifications\EmailVerificationNotification;

/**
 * Listener for sending email verification notifications.
 * Triggered when EmailVerificationRequested domain event is dispatched.
 *
 * Note: URL generation is configured globally in AppServiceProvider to ensure
 * all generated URLs include the correct domain and port from APP_URL.
 */
final class SendEmailVerification
{
    /**
     * Handle the event.
     */
    public function handle(EmailVerificationRequested $event): void
    {
        $userId = $event->user->id();

        if ($userId === null) {
            return;
        }

        // Find the Eloquent model to send notification
        // Note: PHPStan doesn't recognize Eloquent's dynamic find() method
        // @phpstan-ignore-next-line
        $eloquentUser = User::find($userId);

        if ($eloquentUser === null) {
            return;
        }

        // Send the email verification notification (even if already verified - admin can resend manually)
        $eloquentUser->notify(new EmailVerificationNotification());
    }
}
