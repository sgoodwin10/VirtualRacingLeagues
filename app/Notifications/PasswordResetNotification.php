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

        return (new MailMessage())
            ->subject('Reset Password Notification')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $resetUrl)
            ->line("This password reset link will expire in {$expireMinutes} minutes.")
            ->line('If you did not request a password reset, no further action is required.');
    }
}
