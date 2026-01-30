<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\User\Events\EmailVerificationRequested;
use App\Models\User;
use App\Notifications\EmailVerificationNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Listener for sending email verification notifications.
 * Triggered when EmailVerificationRequested domain event is dispatched.
 *
 * Note: URL generation is configured globally in AppServiceProvider to ensure
 * all generated URLs include the correct domain and port from APP_URL.
 */
final class SendEmailVerification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The name of the connection the job should be sent to.
     */
    public string $connection = 'redis';

    /**
     * The name of the queue the job should be sent to.
     */
    public string $queue = 'default';

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;
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
        $eloquentUser = User::find($userId);

        if ($eloquentUser === null) {
            return;
        }

        // Send the email verification notification (even if already verified - admin can resend manually)
        $eloquentUser->notify(new EmailVerificationNotification());
    }
}
