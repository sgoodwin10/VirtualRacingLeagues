<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\RoundTiebreakerRule;
use Spatie\LaravelData\Data;

/**
 * Output DTO representing a tiebreaker rule.
 */
final class TiebreakerRuleData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?string $description,
        public bool $is_active,
        public int $default_order,
        public string $created_at,
        public string $updated_at,
    ) {
    }

    /**
     * Create from domain entity.
     */
    public static function fromEntity(RoundTiebreakerRule $rule): self
    {
        return new self(
            id: $rule->id() ?? 0,
            name: $rule->name(),
            slug: $rule->slug()->value(),
            description: $rule->description(),
            is_active: $rule->isActive(),
            default_order: $rule->defaultOrder(),
            created_at: $rule->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $rule->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
