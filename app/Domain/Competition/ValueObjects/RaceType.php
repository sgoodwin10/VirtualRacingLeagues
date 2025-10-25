<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

enum RaceType: string
{
    case SPRINT = 'sprint';
    case FEATURE = 'feature';
    case ENDURANCE = 'endurance';
    case QUALIFYING = 'qualifying';
    case CUSTOM = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::SPRINT => 'Sprint Race',
            self::FEATURE => 'Feature Race',
            self::ENDURANCE => 'Endurance Race',
            self::QUALIFYING => 'Qualifying',
            self::CUSTOM => 'Custom',
        };
    }
}
