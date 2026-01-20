<?php

declare(strict_types=1);

namespace App\Infrastructure\Notifications\Channels;

use App\Infrastructure\Notifications\Messages\DiscordMessage;
use Exception;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;

final class DiscordChannel
{
    /**
     * Send the notification via Discord webhook.
     *
     * @param object $notifiable
     * @param Notification $notification
     * @throws Exception
     */
    public function send(object $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toDiscord')) {
            return;
        }

        /** @var DiscordMessage|null $message */
        $message = $notification->toDiscord($notifiable);

        if (!$message || !$message->webhookUrl) {
            return;
        }

        $payload = $message->toArray();

        if (empty($payload)) {
            return;
        }

        $response = Http::timeout(10)->post($message->webhookUrl, $payload);

        if ($response->failed()) {
            throw new Exception(
                "Discord webhook failed: " . $response->body()
            );
        }
    }
}
