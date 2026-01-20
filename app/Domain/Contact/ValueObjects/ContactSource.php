<?php

declare(strict_types=1);

namespace App\Domain\Contact\ValueObjects;

enum ContactSource: string
{
    case App = 'app';
    case Public = 'public';

    public function label(): string
    {
        return match ($this) {
            self::App => 'App Dashboard',
            self::Public => 'Public Site',
        };
    }
}
