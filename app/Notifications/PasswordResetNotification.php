<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Password Reset Notification.
 * Sent when a user requests a password reset.
 */
class PasswordResetNotification extends BaseResetPassword implements ShouldQueue
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
     * Create a notification instance.
     *
     * @param  string  $token
     * @return void
     */
    public function __construct(string $token)
    {
        parent::__construct($token);
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
        $baseUrl = config('app.url');
        $resetUrl = $baseUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->email);
        $expireMinutes = config('auth.passwords.users.expire', 60);
        $appName = config('app.name');

        return (new MailMessage())
            ->subject("Reset Your {$appName} Password")
            ->greeting('Password Reset Request')
            ->line('We received a request to reset the password for your account.')
            ->line('Click the button below to choose a new password:')
            ->action('Reset Password', $resetUrl)
            ->line("This link will expire in {$expireMinutes} minutes for security reasons.")
            ->line("If you didn't request this reset, no action is needed - your password will remain unchanged.")
            ->salutation("Stay safe!\n\nThe {$appName} Team");
    }
}
