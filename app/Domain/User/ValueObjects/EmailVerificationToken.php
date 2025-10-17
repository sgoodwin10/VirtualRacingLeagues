<?php

declare(strict_types=1);

namespace App\Domain\User\ValueObjects;

use InvalidArgumentException;

/**
 * Value Object representing an email verification token.
 * Immutable and self-validating.
 */
final readonly class EmailVerificationToken
{
    private function __construct(
        private string $token
    ) {
        $this->validate();
    }

    public static function generate(): self
    {
        return new self(bin2hex(random_bytes(32)));
    }

    public static function fromString(string $token): self
    {
        return new self($token);
    }

    private function validate(): void
    {
        if (strlen($this->token) !== 64) {
            throw new InvalidArgumentException('Email verification token must be exactly 64 characters');
        }

        if (!ctype_xdigit($this->token)) {
            throw new InvalidArgumentException('Email verification token must contain only hexadecimal characters');
        }
    }

    public function value(): string
    {
        return $this->token;
    }

    public function equals(self $other): bool
    {
        return $this->token === $other->token;
    }

    public function toString(): string
    {
        return $this->token;
    }

    public function __toString(): string
    {
        return $this->token;
    }
}
