<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use InvalidArgumentException;

final readonly class PointsSystem
{
    /** @var array<int, float> */
    private array $positions;

    /**
     * @param  array<int, int|float>  $positions  Position => Points mapping
     */
    private function __construct(array $positions)
    {
        // Normalize positions (int) and points (float) (may receive from JSON or database)
        $normalized = [];
        foreach ($positions as $position => $points) {
            $normalized[(int) $position] = (float) $points;
        }
        $this->positions = $normalized;
        $this->validate();
    }

    /**
     * @param  array<int, int|float>  $positions
     */
    public static function from(array $positions): self
    {
        return new self($positions);
    }

    /**
     * Create from JSON string.
     */
    public static function fromJson(string $json): self
    {
        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            throw new InvalidArgumentException('Invalid JSON for points system');
        }

        return new self($decoded);
    }

    /**
     * Create from JSON string or null.
     */
    public static function fromJsonOrNull(?string $json): ?self
    {
        if ($json === null) {
            return null;
        }

        return self::fromJson($json);
    }

    public static function f1Standard(): self
    {
        return new self([
            1 => 25,
            2 => 18,
            3 => 15,
            4 => 12,
            5 => 10,
            6 => 8,
            7 => 6,
            8 => 4,
            9 => 2,
            10 => 1,
        ]);
    }

    private function validate(): void
    {
        if (empty($this->positions)) {
            throw new InvalidArgumentException('Points system cannot be empty');
        }

        foreach ($this->positions as $position => $points) {
            if ($position < 1) {
                throw new InvalidArgumentException('Position must be positive integer');
            }
            if ($points < 0) {
                throw new InvalidArgumentException('Points must be non-negative');
            }
        }
    }

    /**
     * @return array<int, float>
     */
    public function toArray(): array
    {
        return $this->positions;
    }

    public function getPointsForPosition(int $position): float
    {
        return $this->positions[$position] ?? 0.0;
    }

    /**
     * Convert to JSON string for storage.
     */
    public function toJson(): string
    {
        return json_encode($this->positions, JSON_THROW_ON_ERROR);
    }
}
