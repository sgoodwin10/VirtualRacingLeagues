<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Password Reset Notification.
 * Sent when a user requests a password reset.
 */
class PasswordResetNotification extends BaseResetPassword
{
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
