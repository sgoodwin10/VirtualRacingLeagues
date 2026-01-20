<?php

declare(strict_types=1);

namespace App\Domain\Contact\ValueObjects;

enum ContactStatus: string
{
    case New = 'new';
    case Read = 'read';
    case Responded = 'responded';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::New => 'New',
            self::Read => 'Read',
            self::Responded => 'Responded',
            self::Archived => 'Archived',
        };
    }
}
