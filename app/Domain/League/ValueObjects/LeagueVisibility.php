<?php

declare(strict_types=1);

namespace App\Domain\League\ValueObjects;

/**
 * Enum representing league visibility options.
 */
enum LeagueVisibility: string
{
    case PUBLIC = 'public';
    case PRIVATE = 'private';
    case UNLISTED = 'unlisted';

    public static function public(): self
    {
        return self::PUBLIC;
    }

    public static function private(): self
    {
        return self::PRIVATE;
    }

    public static function unlisted(): self
    {
        return self::UNLISTED;
    }

    public function equals(self $other): bool
    {
        return $this === $other;
    }

    public function isPublic(): bool
    {
        return $this === self::PUBLIC;
    }

    public function isPrivate(): bool
    {
        return $this === self::PRIVATE;
    }

    public function isUnlisted(): bool
    {
        return $this === self::UNLISTED;
    }

    public static function fromString(string $value): self
    {
        return match (strtolower($value)) {
            'public' => self::PUBLIC,
            'private' => self::PRIVATE,
            'unlisted' => self::UNLISTED,
            default => throw \App\Domain\League\Exceptions\InvalidVisibilityException::invalidValue($value),
        };
    }
}
