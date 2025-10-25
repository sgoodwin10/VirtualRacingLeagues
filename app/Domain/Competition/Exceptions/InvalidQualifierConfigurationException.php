<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class InvalidQualifierConfigurationException extends DomainException
{
    public static function noQualifyingFormat(): self
    {
        return new self('Qualifier must have a qualifying format');
    }

    public static function invalidLength(int $length): self
    {
        return new self("Qualifier length must be at least 1 minute, got {$length}");
    }

    public static function invalidBonusPoints(array $bonusPoints): self
    {
        $keys = implode(', ', array_keys($bonusPoints));
        return new self("Qualifiers can only have pole position bonus. Got: {$keys}");
    }
}
