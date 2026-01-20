<?php

declare(strict_types=1);

namespace App\Domain\Notification\ValueObjects;

enum NotificationChannel: string
{
    case Email = 'email';
    case Discord = 'discord';

    public function label(): string
    {
        return match ($this) {
            self::Email => 'Email',
            self::Discord => 'Discord',
        };
    }
}
