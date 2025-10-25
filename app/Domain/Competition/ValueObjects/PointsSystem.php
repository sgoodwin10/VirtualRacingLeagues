<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use InvalidArgumentException;

final readonly class PointsSystem
{
    /**
     * @param array<int, int> $positions Position => Points mapping
     */
    private function __construct(private array $positions)
    {
        $this->validate();
    }

    /**
     * @param array<int, int> $positions
     */
    public static function from(array $positions): self
    {
        return new self($positions);
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
                throw new InvalidArgumentException('Points must be non-negative integer');
            }
        }
    }

    /**
     * @return array<int, int>
     */
    public function toArray(): array
    {
        return $this->positions;
    }

    public function getPointsForPosition(int $position): int
    {
        return $this->positions[$position] ?? 0;
    }
}
