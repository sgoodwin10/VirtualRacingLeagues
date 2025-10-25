<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

enum RaceLengthType: string
{
    case LAPS = 'laps';
    case TIME = 'time';

    public function label(): string
    {
        return match ($this) {
            self::LAPS => 'Number of Laps',
            self::TIME => 'Time Duration',
        };
    }
}
