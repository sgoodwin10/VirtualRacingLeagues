<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domain\User\Entities\User;
use App\Infrastructure\Notifications\Channels\DiscordChannel;
use App\Infrastructure\Notifications\Messages\DiscordMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

final class UserRegisteredNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly User $user
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = [];

        if (config('notifications.discord_enabled', true)) {
            $channels[] = DiscordChannel::class;
        }

        return $channels;
    }

    public function toDiscord(object $notifiable): ?DiscordMessage
    {
        $webhookUrl = config('notifications.discord.registrations_webhook');

        if (! $webhookUrl) {
            return null;
        }

        $message = new DiscordMessage();
        $message->webhookUrl($webhookUrl);
        $message->username(config('app.name') . ' - Registrations');

        $message->title('New User Registration')
            ->color(0x2ECC71) // Green
            ->field('Name', $this->user->fullName()->full(), true)
            ->field('Email', $this->user->email()->value(), true)
            ->timestamp(now()->toIso8601String());

        return $message;
    }
}
