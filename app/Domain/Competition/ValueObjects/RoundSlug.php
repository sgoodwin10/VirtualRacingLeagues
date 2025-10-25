<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Round Slug Value Object.
 * Auto-generates slug from name, validates lowercase/numbers/hyphens only.
 */
final readonly class RoundSlug
{
    private function __construct(private string $value)
    {
        $this->validate();
    }

    public static function from(string $value): self
    {
        return new self(Str::slug($value));
    }

    public static function fromName(?string $name, int $roundNumber): self
    {
        if ($name !== null && trim($name) !== '') {
            return self::from($name);
        }

        return self::from("round-{$roundNumber}");
    }

    private function validate(): void
    {
        if (empty($this->value)) {
            throw new InvalidArgumentException('Slug cannot be empty');
        }

        if (!preg_match('/^[a-z0-9-]+$/', $this->value)) {
            throw new InvalidArgumentException('Slug must contain only lowercase letters, numbers, and hyphens');
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
