<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\User\Events\EmailVerificationRequested;
use App\Notifications\UserRegisteredNotification;
use Illuminate\Support\Facades\Notification;

final class SendRegistrationDiscordNotification
{
    public function handle(EmailVerificationRequested $event): void
    {
        // Send Discord notification about new registration
        /** @phpstan-ignore-next-line */
        Notification::route('discord', null)
            ->notify(new UserRegisteredNotification($event->user));
    }
}
