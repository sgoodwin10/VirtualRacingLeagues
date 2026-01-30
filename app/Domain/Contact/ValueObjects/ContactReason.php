<?php

declare(strict_types=1);

namespace App\Domain\Contact\ValueObjects;

enum ContactReason: string
{
    case Error = 'error';
    case Question = 'question';
    case Help = 'help';
    case Other = 'other';
    case Hello = 'hello';

    public function label(): string
    {
        return match ($this) {
            self::Error => 'I found an error',
            self::Question => 'I have a question',
            self::Help => 'I need help',
            self::Other => 'Other',
            self::Hello => 'I just want to say hello!',
        };
    }
}
