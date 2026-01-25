<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\ValueObjects\TiebreakerInformation;
use Spatie\LaravelData\Data;

/**
 * Output DTO representing how tiebreaker rules were applied to a round.
 */
final class TiebreakerInformationData extends Data
{
    /**
     * @param  array<array<string, mixed>>  $resolutions
     * @param  array<string>  $applied_rules
     */
    public function __construct(
        public array $resolutions,
        public array $applied_rules,
        public bool $had_unresolved_ties,
    ) {
    }

    /**
     * Create from domain value object.
     */
    public static function fromValueObject(TiebreakerInformation $info): self
    {
        return new self(
            resolutions: array_map(fn ($r) => $r->toArray(), $info->resolutions()),
            applied_rules: $info->appliedRules(),
            had_unresolved_ties: $info->hadUnresolvedTies(),
        );
    }
}
