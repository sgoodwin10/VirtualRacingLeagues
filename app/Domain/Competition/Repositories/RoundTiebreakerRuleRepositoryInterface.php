<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\RoundTiebreakerRule;
use App\Domain\Competition\ValueObjects\TiebreakerRuleSlug;

/**
 * Round Tiebreaker Rule Repository Interface.
 *
 * Defines contract for persisting and retrieving tiebreaker rules.
 */
interface RoundTiebreakerRuleRepositoryInterface
{
    /**
     * Find a tiebreaker rule by ID.
     *
     * @throws \App\Domain\Competition\Exceptions\TiebreakerRuleNotFoundException
     */
    public function findById(int $id): RoundTiebreakerRule;

    /**
     * Find a tiebreaker rule by slug.
     *
     * @throws \App\Domain\Competition\Exceptions\TiebreakerRuleNotFoundException
     */
    public function findBySlug(TiebreakerRuleSlug $slug): RoundTiebreakerRule;

    /**
     * Get all active tiebreaker rules ordered by default_order.
     *
     * @return array<RoundTiebreakerRule>
     */
    public function getAllActive(): array;

    /**
     * Get all tiebreaker rules (active and inactive).
     *
     * @return array<RoundTiebreakerRule>
     */
    public function getAll(): array;

    /**
     * Save a tiebreaker rule.
     */
    public function save(RoundTiebreakerRule $rule): void;

    /**
     * Delete a tiebreaker rule.
     */
    public function delete(RoundTiebreakerRule $rule): void;
}
