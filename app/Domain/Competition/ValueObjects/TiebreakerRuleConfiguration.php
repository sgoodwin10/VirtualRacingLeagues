<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\DuplicateTiebreakerRuleException;
use App\Domain\Competition\Exceptions\InvalidTiebreakerConfigurationException;

/**
 * Tiebreaker Rule Configuration Value Object.
 *
 * Represents an immutable ordered collection of tiebreaker rules for a season.
 * Enforces that rules are unique and properly ordered.
 */
final readonly class TiebreakerRuleConfiguration
{
    /**
     * @param  array<TiebreakerRuleReference>  $rules
     */
    private function __construct(private array $rules)
    {
        $this->validate();
    }

    /**
     * Create from array of rule references.
     *
     * @param  array<TiebreakerRuleReference>  $rules
     */
    public static function from(array $rules): self
    {
        // Sort by order
        usort($rules, fn ($a, $b) => $a->order() <=> $b->order());

        return new self($rules);
    }

    /**
     * Create empty configuration (no rules).
     */
    public static function empty(): self
    {
        return new self([]);
    }

    /**
     * @return array<TiebreakerRuleReference>
     */
    public function rules(): array
    {
        return $this->rules;
    }

    public function isEmpty(): bool
    {
        return empty($this->rules);
    }

    public function count(): int
    {
        return count($this->rules);
    }

    /**
     * Get rule at specific order position.
     */
    public function getRuleAtOrder(int $order): ?TiebreakerRuleReference
    {
        foreach ($this->rules as $rule) {
            if ($rule->order() === $order) {
                return $rule;
            }
        }

        return null;
    }

    /**
     * Check if configuration contains a specific rule slug.
     */
    public function hasRule(TiebreakerRuleSlug $slug): bool
    {
        foreach ($this->rules as $rule) {
            if ($rule->slug()->equals($slug)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all rule slugs in order.
     *
     * @return array<string>
     */
    public function getSlugsInOrder(): array
    {
        return array_map(fn ($rule) => $rule->slug()->value(), $this->rules);
    }

    /**
     * Convert to array for storage.
     *
     * @return array<array<string, mixed>>
     */
    public function toArray(): array
    {
        return array_map(fn ($rule) => $rule->toArray(), $this->rules);
    }

    /**
     * Validate the configuration.
     *
     * @throws DuplicateTiebreakerRuleException
     * @throws InvalidTiebreakerConfigurationException
     */
    private function validate(): void
    {
        // Check for duplicate rule IDs
        $ruleIds = array_map(fn ($rule) => $rule->id(), $this->rules);
        if (count($ruleIds) !== count(array_unique($ruleIds))) {
            throw DuplicateTiebreakerRuleException::duplicateRule();
        }

        // Check for duplicate rule slugs
        $ruleSlugs = array_map(fn ($rule) => $rule->slug()->value(), $this->rules);
        if (count($ruleSlugs) !== count(array_unique($ruleSlugs))) {
            throw DuplicateTiebreakerRuleException::duplicateRule();
        }

        // Check that orders are sequential starting from 1
        if (! empty($this->rules)) {
            $orders = array_map(fn ($rule) => $rule->order(), $this->rules);
            $expectedOrders = range(1, count($this->rules));
            if ($orders !== $expectedOrders) {
                throw InvalidTiebreakerConfigurationException::invalidOrdering();
            }
        }
    }
}
