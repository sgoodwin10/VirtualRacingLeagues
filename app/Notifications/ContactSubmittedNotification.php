<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domain\Contact\Entities\Contact;
use App\Infrastructure\Notifications\Channels\DiscordChannel;
use App\Infrastructure\Notifications\Messages\DiscordMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ContactSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 5;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 120;

    /**
     * The maximum number of unhandled exceptions to allow before failing.
     */
    public int $maxExceptions = 3;

    public function __construct(
        private readonly Contact $contact
    ) {
        $this->onConnection('redis');
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = [];

        if (config('notifications.email_enabled', true)) {
            $channels[] = 'mail';
        }

        if (config('notifications.discord_enabled', true)) {
            $channels[] = DiscordChannel::class;
        }

        return $channels;
    }

    /**
     * Determine which queues should be used for each notification channel.
     *
     * @return array<string, string>
     */
    public function viaQueues(): array
    {
        return [
            'mail' => 'mail',
            DiscordChannel::class => 'discord',
        ];
    }

    /**
     * Determine the time at which the job should timeout and be retried.
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60, 300]; // 10s, 1m, 5m
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appName = config('app.name');

        return (new MailMessage())
            ->subject("[{$appName}] New Contact: {$this->contact->reason()->label()}")
            ->greeting('New Contact Form Submission')
            ->line("You have received a new message from the {$this->contact->source()->label()}.")
            ->line('---')
            ->line("**From:** {$this->contact->name()}")
            ->line("**Email:** {$this->contact->email()->value()}")
            ->line("**Reason:** {$this->contact->reason()->label()}")
            ->line('---')
            ->line('**Message:**')
            ->line($this->contact->message())
            ->line('---')
            ->line('Please respond to this enquiry promptly.')
            ->salutation("The {$appName} System");
    }

    public function toDiscord(object $notifiable): ?DiscordMessage
    {
        $webhookUrl = config('notifications.discord.contacts_webhook');

        if (! $webhookUrl) {
            return null;
        }

        $message = new DiscordMessage();
        $message->webhookUrl($webhookUrl);
        $message->username(config('app.name') . ' - Contact Form');

        $color = match ($this->contact->reason()->value) {
            'error' => 0xE74C3C,    // Red
            'help' => 0xF39C12,     // Orange
            'question' => 0x3498DB, // Blue
            default => 0x95A5A6,    // Gray
        };

        $message->title("New Contact: {$this->contact->reason()->label()}")
            ->color($color)
            ->field('From', $this->contact->name(), true)
            ->field('Email', $this->contact->email()->value(), true)
            ->field('Source', $this->contact->source()->label(), true)
            ->field('Message', substr($this->contact->message(), 0, 1000), false)
            ->timestamp(now()->toIso8601String());

        return $message;
    }
}
