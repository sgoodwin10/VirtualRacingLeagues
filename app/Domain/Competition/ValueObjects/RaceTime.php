<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidRaceTimeException;

final readonly class RaceTime
{
    private function __construct(
        private ?string $value
    ) {
    }

    public static function fromString(?string $value): self
    {
        if ($value === null || $value === '') {
            return new self(null);
        }

        // Validate format: hh:mm:ss.ms (ms can be 1-3 digits)
        // Also allow +hh:mm:ss.ms for differences
        $pattern = '/^[+]?(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/';

        if (!preg_match($pattern, $value)) {
            throw InvalidRaceTimeException::invalidFormat($value);
        }

        return new self($value);
    }

    public function value(): ?string
    {
        return $this->value;
    }

    public function isNull(): bool
    {
        return $this->value === null;
    }

    /**
     * Convert to milliseconds for calculations.
     */
    public function toMilliseconds(): ?int
    {
        if ($this->value === null) {
            return null;
        }

        $isPositive = str_starts_with($this->value, '+');
        $timeStr = ltrim($this->value, '+');

        preg_match('/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/', $timeStr, $matches);

        $hours = (int) $matches[1];
        $minutes = (int) $matches[2];
        $seconds = (int) $matches[3];
        $ms = str_pad($matches[4], 3, '0', STR_PAD_RIGHT); // Normalize to 3 digits
        $milliseconds = (int) $ms;

        $total = ($hours * 3600000) + ($minutes * 60000) + ($seconds * 1000) + $milliseconds;

        return $total;
    }

    /**
     * Create from milliseconds.
     */
    public static function fromMilliseconds(int $ms): self
    {
        $hours = intdiv($ms, 3600000);
        $ms -= $hours * 3600000;

        $minutes = intdiv($ms, 60000);
        $ms -= $minutes * 60000;

        $seconds = intdiv($ms, 1000);
        $milliseconds = $ms - ($seconds * 1000);

        $value = sprintf('%02d:%02d:%02d.%03d', $hours, $minutes, $seconds, $milliseconds);

        return new self($value);
    }

    /**
     * Add another RaceTime (for calculating race_time from difference).
     */
    public function add(RaceTime $other): self
    {
        if ($this->value === null || $other->value === null) {
            return new self(null);
        }

        $thisMs = $this->toMilliseconds();
        $otherMs = $other->toMilliseconds();

        if ($thisMs === null || $otherMs === null) {
            return new self(null);
        }

        $totalMs = $thisMs + $otherMs;

        return self::fromMilliseconds($totalMs);
    }

    public function equals(RaceTime $other): bool
    {
        return $this->value === $other->value;
    }
}
