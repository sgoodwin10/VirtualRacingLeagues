<?php

declare(strict_types=1);

namespace Tests\Feature\Notifications;

use App\Notifications\PasswordResetNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for PasswordResetNotification.
 * Verifies that the notification generates correct reset URLs using the APP_URL configuration.
 */
class PasswordResetNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_generates_correct_reset_url_with_app_url(): void
    {
        // Get the configured app URL
        $appUrl = config('app.url');

        // Create notification with test token
        $token = 'test-token-123';
        $notification = new PasswordResetNotification($token);

        // Create a mock notifiable object
        $notifiable = new class {
            public string $email = 'test@example.com';
        };

        // Get the mail message
        $mailMessage = $notification->toMail($notifiable);

        // Extract the action URL from the mail message
        $reflection = new \ReflectionClass($mailMessage);
        $actionProperty = $reflection->getProperty('actionUrl');
        $actionProperty->setAccessible(true);
        $actualUrl = $actionProperty->getValue($mailMessage);

        // Assert the URL starts with the configured APP_URL
        $this->assertStringStartsWith($appUrl, $actualUrl);

        // Assert the URL contains the correct path and parameters
        $this->assertStringContainsString('/reset-password', $actualUrl);
        $this->assertStringContainsString('token=test-token-123', $actualUrl);
        $this->assertStringContainsString('email=test%40example.com', $actualUrl);

        // Assert the complete expected URL
        $expectedUrl = $appUrl . '/reset-password?token=test-token-123&email=test%40example.com';
        $this->assertEquals($expectedUrl, $actualUrl);
    }

    public function test_notification_properly_encodes_email_in_url(): void
    {
        $appUrl = config('app.url');
        $notification = new PasswordResetNotification('token123');

        // Test with an email that needs URL encoding
        $notifiable = new class {
            public string $email = 'user+test@example.com';
        };

        $mailMessage = $notification->toMail($notifiable);

        // Extract the action URL
        $reflection = new \ReflectionClass($mailMessage);
        $actionProperty = $reflection->getProperty('actionUrl');
        $actionProperty->setAccessible(true);
        $actualUrl = $actionProperty->getValue($mailMessage);

        // Assert email is properly URL encoded
        $this->assertStringContainsString('email=user%2Btest%40example.com', $actualUrl);

        // Assert the full URL is correctly formed
        $expectedUrl = $appUrl . '/reset-password?token=token123&email=user%2Btest%40example.com';
        $this->assertEquals($expectedUrl, $actualUrl);
    }

    public function test_notification_does_not_use_localhost_3000(): void
    {
        $notification = new PasswordResetNotification('any-token');

        $notifiable = new class {
            public string $email = 'test@example.com';
        };

        $mailMessage = $notification->toMail($notifiable);

        // Extract the action URL
        $reflection = new \ReflectionClass($mailMessage);
        $actionProperty = $reflection->getProperty('actionUrl');
        $actionProperty->setAccessible(true);
        $actualUrl = $actionProperty->getValue($mailMessage);

        // Assert the URL does NOT contain localhost:3000
        $this->assertStringNotContainsString('localhost:3000', $actualUrl);

        // Assert it uses the configured APP_URL instead
        $appUrl = config('app.url');
        $this->assertStringStartsWith($appUrl, $actualUrl);
    }

    public function test_notification_contains_expiration_message(): void
    {
        $notification = new PasswordResetNotification('test-token');

        $notifiable = new class {
            public string $email = 'test@example.com';
        };

        $mailMessage = $notification->toMail($notifiable);

        // Get the mail content
        $reflection = new \ReflectionClass($mailMessage);
        $introLinesProperty = $reflection->getProperty('introLines');
        $introLinesProperty->setAccessible(true);
        $introLines = $introLinesProperty->getValue($mailMessage);

        $outroLinesProperty = $reflection->getProperty('outroLines');
        $outroLinesProperty->setAccessible(true);
        $outroLines = $outroLinesProperty->getValue($mailMessage);

        $allLines = array_merge($introLines, $outroLines);
        $content = implode(' ', $allLines);

        // Assert the notification contains appropriate messaging
        $this->assertStringContainsString('password reset request', $content);
        $this->assertStringContainsString('expire', $content);
        $this->assertStringContainsString('If you did not request', $content);
    }
}
