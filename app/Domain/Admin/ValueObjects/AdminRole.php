<?php

declare(strict_types=1);

namespace App\Domain\Admin\ValueObjects;

enum AdminRole: string
{
    case SUPER_ADMIN = 'super_admin';
    case ADMIN = 'admin';
    case MODERATOR = 'moderator';

    public function equals(self $other): bool
    {
        return $this === $other;
    }

    public function isSuperAdmin(): bool
    {
        return $this === self::SUPER_ADMIN;
    }

    public function isAdmin(): bool
    {
        return $this === self::ADMIN;
    }

    public function isModerator(): bool
    {
        return $this === self::MODERATOR;
    }

    /**
     * Get role hierarchy level (higher number = more permissions)
     */
    public function hierarchyLevel(): int
    {
        return match ($this) {
            self::SUPER_ADMIN => 3,
            self::ADMIN => 2,
            self::MODERATOR => 1,
        };
    }

    public function isHigherThan(self $other): bool
    {
        return $this->hierarchyLevel() > $other->hierarchyLevel();
    }
}
