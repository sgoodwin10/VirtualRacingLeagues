<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

enum QualifyingFormat: string
{
    case STANDARD = 'standard';
    case TIME_TRIAL = 'time_trial';
    case NONE = 'none';
    case PREVIOUS_RACE = 'previous_race';

    public function label(): string
    {
        return match ($this) {
            self::STANDARD => 'Standard Qualifying',
            self::TIME_TRIAL => 'Time Trial',
            self::NONE => 'No Qualifying',
            self::PREVIOUS_RACE => 'Use Previous Race',
        };
    }
}
