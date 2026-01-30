<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domain\User\Entities\User;
use App\Infrastructure\Notifications\Channels\DiscordChannel;
use App\Infrastructure\Notifications\Messages\DiscordMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class UserRegisteredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 30;

    public function __construct(
        private readonly User $user
    ) {
        $this->onConnection('redis')->onQueue('discord');
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

    /**
     * Determine the time at which the job should timeout and be retried.
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [5, 15, 30]; // 5s, 15s, 30s
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
