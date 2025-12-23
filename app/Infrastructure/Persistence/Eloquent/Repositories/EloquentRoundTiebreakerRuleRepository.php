<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\RoundTiebreakerRule;
use App\Domain\Competition\Exceptions\TiebreakerRuleNotFoundException;
use App\Domain\Competition\Repositories\RoundTiebreakerRuleRepositoryInterface;
use App\Domain\Competition\ValueObjects\TiebreakerRuleSlug;
use App\Infrastructure\Persistence\Eloquent\Models\RoundTiebreakerRuleEloquent;
use DateTimeImmutable;

/**
 * Eloquent Round Tiebreaker Rule Repository.
 *
 * Handles persistence of tiebreaker rules using Eloquent ORM.
 */
final class EloquentRoundTiebreakerRuleRepository implements RoundTiebreakerRuleRepositoryInterface
{
    public function findById(int $id): RoundTiebreakerRule
    {
        $model = RoundTiebreakerRuleEloquent::find($id);

        if ($model === null) {
            throw TiebreakerRuleNotFoundException::withId($id);
        }

        return $this->toDomainEntity($model);
    }

    public function findBySlug(TiebreakerRuleSlug $slug): RoundTiebreakerRule
    {
        $model = RoundTiebreakerRuleEloquent::where('slug', $slug->value())->first();

        if ($model === null) {
            throw TiebreakerRuleNotFoundException::withSlug($slug->value());
        }

        return $this->toDomainEntity($model);
    }

    public function getAllActive(): array
    {
        $models = RoundTiebreakerRuleEloquent::where('is_active', true)
            ->orderBy('default_order')
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->all();
    }

    public function getAll(): array
    {
        $models = RoundTiebreakerRuleEloquent::orderBy('default_order')->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->all();
    }

    public function save(RoundTiebreakerRule $rule): void
    {
        if ($rule->id() === null) {
            // Create new
            $model = new RoundTiebreakerRuleEloquent();
            $model->name = $rule->name();
            $model->slug = $rule->slug()->value();
            $model->description = $rule->description();
            $model->is_active = $rule->isActive();
            $model->default_order = $rule->defaultOrder();
            $model->save();

            // Set ID back on entity
            $rule->setId($model->id);
        } else {
            // Update existing
            $model = RoundTiebreakerRuleEloquent::findOrFail($rule->id());
            $model->name = $rule->name();
            $model->slug = $rule->slug()->value();
            $model->description = $rule->description();
            $model->is_active = $rule->isActive();
            $model->default_order = $rule->defaultOrder();
            $model->save();
        }
    }

    public function delete(RoundTiebreakerRule $rule): void
    {
        if ($rule->id() !== null) {
            RoundTiebreakerRuleEloquent::destroy($rule->id());
        }
    }

    /**
     * Convert Eloquent model to domain entity.
     */
    private function toDomainEntity(RoundTiebreakerRuleEloquent $model): RoundTiebreakerRule
    {
        return RoundTiebreakerRule::reconstitute(
            id: $model->id,
            name: $model->name,
            slug: TiebreakerRuleSlug::from($model->slug),
            description: $model->description,
            isActive: $model->is_active,
            defaultOrder: $model->default_order,
            createdAt: new DateTimeImmutable($model->created_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($model->updated_at->toDateTimeString()),
        );
    }
}
