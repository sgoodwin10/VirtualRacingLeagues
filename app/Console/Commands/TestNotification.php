<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Infrastructure\Notifications\Channels\DiscordChannel;
use App\Infrastructure\Notifications\Messages\DiscordMessage;
use Illuminate\Console\Command;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification as NotificationFacade;

class TestNotification extends Command
{
    protected $signature = 'notifications:test
                            {channel : The channel to test (discord, email)}
                            {--type=contact : The notification type (contact, registration, system)}
                            {--email= : Email address for email tests}';

    protected $description = 'Send a test notification to verify configuration';

    public function handle(): int
    {
        $channel = $this->argument('channel');
        $type = $this->option('type');

        return match ($channel) {
            'discord' => $this->testDiscord($type),
            'email' => $this->testEmail($type),
            default => $this->invalidChannel($channel),
        };
    }

    private function testDiscord(string $type): int
    {
        $webhookUrl = match ($type) {
            'contact' => config('notifications.discord.contacts_webhook'),
            'registration' => config('notifications.discord.registrations_webhook'),
            'system' => config('notifications.discord.system_webhook'),
            default => null,
        };

        if (!$webhookUrl) {
            $this->error("No webhook URL configured for type: {$type}");
            $this->line('');
            $this->info('Add the following to your .env file:');
            $this->line(match ($type) {
                'contact' => 'DISCORD_WEBHOOK_CONTACTS=https://discord.com/api/webhooks/...',
                'registration' => 'DISCORD_WEBHOOK_REGISTRATIONS=https://discord.com/api/webhooks/...',
                'system' => 'DISCORD_WEBHOOK_SYSTEM=https://discord.com/api/webhooks/...',
                default => 'DISCORD_WEBHOOK_<TYPE>=https://discord.com/api/webhooks/...',
            });
            return self::FAILURE;
        }

        $this->info("Sending test {$type} notification to Discord...");
        $this->line("Webhook URL: " . substr($webhookUrl, 0, 50) . '...');

        $message = $this->buildDiscordMessage($type);

        try {
            $response = Http::post($webhookUrl, [
                'content' => $message['content'] ?? null,
                'embeds' => $message['embeds'] ?? [],
                'username' => config('app.name') . ' Test',
            ]);

            if ($response->successful()) {
                $this->info('✓ Discord notification sent successfully!');
                $this->line('Check your Discord channel for the test message.');
                return self::SUCCESS;
            }

            $this->error('✗ Discord API returned an error:');
            $this->line($response->body());
            return self::FAILURE;
        } catch (\Exception $e) {
            $this->error('✗ Failed to send Discord notification:');
            $this->line($e->getMessage());
            return self::FAILURE;
        }
    }

    private function testEmail(string $type): int
    {
        $email = $this->option('email') ?? config('notifications.admin_email');

        if (!$email) {
            $this->error('No email address provided.');
            $this->line('Use --email=your@email.com or set ADMIN_EMAIL in .env');
            return self::FAILURE;
        }

        $this->info("Sending test {$type} email to: {$email}");

        try {
            Mail::raw($this->buildEmailContent($type), function ($message) use ($email, $type) {
                $message->to($email)
                    ->subject('[TEST] ' . ucfirst($type) . ' Notification - ' . config('app.name'));
            });

            $this->info('✓ Test email sent successfully!');
            $this->line('Check your inbox (or Mailpit at http://localhost:8025)');
            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('✗ Failed to send email:');
            $this->line($e->getMessage());
            return self::FAILURE;
        }
    }

    private function buildDiscordMessage(string $type): array
    {
        $timestamp = now()->toIso8601String();

        return match ($type) {
            'contact' => [
                'embeds' => [[
                    'title' => '🧪 Test Contact Notification',
                    'description' => 'This is a test notification to verify your Discord webhook is configured correctly.',
                    'color' => 0x3498db, // Blue
                    'fields' => [
                        ['name' => 'From', 'value' => 'Test User', 'inline' => true],
                        ['name' => 'Email', 'value' => 'test@example.com', 'inline' => true],
                        ['name' => 'Source', 'value' => 'Test Command', 'inline' => true],
                        ['name' => 'Reason', 'value' => 'Testing', 'inline' => true],
                        ['name' => 'Message', 'value' => 'If you can see this message, your contact notifications webhook is working correctly! 🎉'],
                    ],
                    'footer' => ['text' => 'Test notification from ' . config('app.name')],
                    'timestamp' => $timestamp,
                ]],
            ],
            'registration' => [
                'embeds' => [[
                    'title' => '🧪 Test Registration Notification',
                    'description' => 'This is a test notification to verify your Discord webhook is configured correctly.',
                    'color' => 0x2ecc71, // Green
                    'fields' => [
                        ['name' => 'Name', 'value' => 'Test User', 'inline' => true],
                        ['name' => 'Email', 'value' => 'test@example.com', 'inline' => true],
                    ],
                    'footer' => ['text' => 'Test notification from ' . config('app.name')],
                    'timestamp' => $timestamp,
                ]],
            ],
            'system' => [
                'embeds' => [[
                    'title' => '🧪 Test System Notification',
                    'description' => 'This is a test notification to verify your Discord webhook is configured correctly.',
                    'color' => 0xe74c3c, // Red
                    'fields' => [
                        ['name' => 'Type', 'value' => 'System Alert', 'inline' => true],
                        ['name' => 'Status', 'value' => 'Test', 'inline' => true],
                        ['name' => 'Details', 'value' => 'If you can see this message, your system notifications webhook is working correctly! 🎉'],
                    ],
                    'footer' => ['text' => 'Test notification from ' . config('app.name')],
                    'timestamp' => $timestamp,
                ]],
            ],
            default => [
                'content' => '🧪 Test notification from ' . config('app.name'),
            ],
        };
    }

    private function buildEmailContent(string $type): string
    {
        $appName = config('app.name');

        return match ($type) {
            'contact' => <<<EMAIL
                This is a TEST contact notification from {$appName}.

                If you received this email, your email notification system is working correctly!

                Test Details:
                - From: Test User
                - Email: test@example.com
                - Reason: Testing
                - Message: This is a test message.

                --
                {$appName} Notification System
                EMAIL,
            'registration' => <<<EMAIL
                This is a TEST registration notification from {$appName}.

                If you received this email, your email notification system is working correctly!

                Test Details:
                - Name: Test User
                - Email: test@example.com

                --
                {$appName} Notification System
                EMAIL,
            default => <<<EMAIL
                This is a TEST notification from {$appName}.

                If you received this email, your email notification system is working correctly!

                --
                {$appName} Notification System
                EMAIL,
        };
    }

    private function invalidChannel(string $channel): int
    {
        $this->error("Invalid channel: {$channel}");
        $this->line('Available channels: discord, email');
        return self::FAILURE;
    }
}
