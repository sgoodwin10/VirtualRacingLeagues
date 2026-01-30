<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

/**
 * Email Verification Notification.
 * Sent when a user registers or changes their email address.
 *
 * Note: The AppServiceProvider sets URL::forceRootUrl() globally to ensure
 * all generated URLs include the correct domain and port from APP_URL.
 */
class EmailVerificationNotification extends BaseVerifyEmail implements ShouldQueue
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

    public function __construct()
    {
        $this->onConnection('redis')->onQueue('mail');
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

    /**
     * Build the mail representation of the notification.
     */
    public function toMail(mixed $notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        $appName = config('app.name');

        return (new MailMessage())
            ->subject("Welcome to {$appName} - Verify Your Email")
            ->greeting('Welcome!')
            ->line("Thanks for signing up to {$appName}! We're excited to have you on board.")
            ->line('Please click the button below to verify your email address and get started.')
            ->action('Verify Email Address', $verificationUrl)
            ->line('This verification link will expire in 60 minutes.')
            ->line('If you did not create an account, you can safely ignore this email.')
            ->salutation("See you on the track!\n\nThe {$appName} Team");
    }

    /**
     * Get the verification URL for the given notifiable.
     * Uses Laravel's standard signed URL generation.
     */
    protected function verificationUrl(mixed $notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
            absolute: true
        );
    }
}
