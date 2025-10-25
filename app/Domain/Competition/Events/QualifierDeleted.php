<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

use DateTimeImmutable;

final readonly class QualifierDeleted
{
    public function __construct(
        public int $qualifierId,
        public int $roundId,
        public DateTimeImmutable $occurredAt,
    ) {
    }
}
