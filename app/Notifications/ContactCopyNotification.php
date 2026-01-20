<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domain\Contact\Entities\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ContactCopyNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Contact $contact
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail']; // Email only for user CC
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appName = config('app.name');

        return (new MailMessage())
            ->subject("Your message to {$appName}")
            ->greeting("Hi {$this->contact->name()},")
            ->line("Thanks for getting in touch! Here's a copy of your message for your records:")
            ->line('---')
            ->line("**Reason:** {$this->contact->reason()->label()}")
            ->line('')
            ->line('**Your Message:**')
            ->line($this->contact->message())
            ->line('---')
            ->line("We've received your message and will get back to you as soon as possible.")
            ->line('If your matter is urgent, please allow up to 24 hours for a response.')
            ->salutation("Thanks for reaching out!\n\nThe {$appName} Team");
    }
}
