<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

enum GridSource: string
{
    case QUALIFYING = 'qualifying';
    case PREVIOUS_RACE = 'previous_race';
    case REVERSE_PREVIOUS = 'reverse_previous';
    case CHAMPIONSHIP = 'championship';
    case REVERSE_CHAMPIONSHIP = 'reverse_championship';
    case MANUAL = 'manual';

    public function label(): string
    {
        return match ($this) {
            self::QUALIFYING => 'Qualifying Results',
            self::PREVIOUS_RACE => 'Previous Race Results',
            self::REVERSE_PREVIOUS => 'Reverse Previous Race',
            self::CHAMPIONSHIP => 'Championship Standings',
            self::REVERSE_CHAMPIONSHIP => 'Reverse Championship',
            self::MANUAL => 'Manual Grid Entry',
        };
    }
}
