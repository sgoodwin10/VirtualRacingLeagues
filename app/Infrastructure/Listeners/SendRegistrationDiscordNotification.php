<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\User\Events\EmailVerificationRequested;
use App\Notifications\UserRegisteredNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification;

final class SendRegistrationDiscordNotification implements ShouldQueue
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

    public function handle(EmailVerificationRequested $event): void
    {
        // Send Discord notification about new registration
        /** @phpstan-ignore-next-line */
        Notification::route('discord', null)
            ->notify(new UserRegisteredNotification($event->user));
    }
}
