<?php

declare(strict_types=1);

namespace App\Domain\Driver\Exceptions;

use InvalidArgumentException;

final class InvalidDriverDataException extends InvalidArgumentException
{
    public static function missingNameFields(): self
    {
        return new self('At least one name field (first name, last name, or nickname) is required');
    }

    public static function missingPlatformIds(): self
    {
        return new self('At least one platform identifier is required');
    }

    /**
     * @param array<int> $leaguePlatformIds
     */
    public static function platformNotInLeague(array $leaguePlatformIds): self
    {
        $platformIdsList = implode(', ', $leaguePlatformIds);
        return new self(
            "Driver must have at least one platform identifier that matches " .
            "the league's platforms (Platform IDs: {$platformIdsList})"
        );
    }

    public static function invalidEmail(string $email): self
    {
        return new self("Invalid email address: {$email}");
    }

    public static function invalidDriverNumber(int $number): self
    {
        return new self("Invalid driver number: {$number}. Must be between 1 and 999");
    }

    public static function duplicatePlatformId(
        ?string $psnId = null,
        ?string $iracingId = null,
        ?int $iracingCustomerId = null,
        ?string $discordId = null
    ): self {
        $platformId = $psnId
            ?? $iracingId
            ?? ($iracingCustomerId !== null ? (string) $iracingCustomerId : $discordId)
            ?? 'unknown';

        return new self("A driver with platform ID '{$platformId}' already exists");
    }
}
