<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\Competition;
use App\Domain\Competition\Exceptions\CompetitionNotFoundException;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\ValueObjects\CompetitionName;
use App\Domain\Competition\ValueObjects\CompetitionSlug;
use App\Domain\Competition\ValueObjects\CompetitionStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Competition as CompetitionModel;

/**
 * Eloquent implementation of CompetitionRepositoryInterface.
 * Handles mapping between domain entities and Eloquent models.
 */
final class EloquentCompetitionRepository implements CompetitionRepositoryInterface
{
    public function save(Competition $competition): void
    {
        $data = $this->mapToEloquent($competition);
        $model = CompetitionModel::create($data);

        // Set ID on entity using reflection (needed for events)
        $this->setEntityId($competition, $model->id);
    }

    public function update(Competition $competition): void
    {
        $data = $this->mapToEloquent($competition);

        CompetitionModel::where('id', $competition->id())->update($data);
    }

    public function delete(Competition $competition): void
    {
        CompetitionModel::where('id', $competition->id())->delete();
    }

    public function findById(int $id): Competition
    {
        $model = CompetitionModel::withTrashed()->find($id);

        if (!$model) {
            throw CompetitionNotFoundException::withId($id);
        }

        return $this->mapToEntity($model);
    }

    public function findBySlug(string $slug, int $leagueId): Competition
    {
        $model = CompetitionModel::where('slug', $slug)
            ->where('league_id', $leagueId)
            ->first();

        if (!$model) {
            throw CompetitionNotFoundException::withSlug($slug, $leagueId);
        }

        return $this->mapToEntity($model);
    }

    /**
     * @return array<Competition>
     */
    public function findByLeagueId(int $leagueId): array
    {
        return CompetitionModel::where('league_id', $leagueId)
            ->get()
            ->map(fn(CompetitionModel $model) => $this->mapToEntity($model))
            ->all();
    }

    public function existsBySlug(string $slug, int $leagueId, ?int $excludeId = null): bool
    {
        $query = CompetitionModel::where('slug', $slug)
            ->where('league_id', $leagueId);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    public function isSlugAvailable(string $slug, int $leagueId, ?int $excludeId = null): bool
    {
        return !$this->existsBySlug($slug, $leagueId, $excludeId);
    }

    public function countByLeagueId(int $leagueId): int
    {
        return CompetitionModel::where('league_id', $leagueId)->count();
    }

    public function countActiveByLeagueId(int $leagueId): int
    {
        return CompetitionModel::where('league_id', $leagueId)
            ->where('status', 'active')
            ->count();
    }

    /**
     * Map Eloquent model to domain entity.
     */
    private function mapToEntity(CompetitionModel $model): Competition
    {
        return Competition::reconstitute(
            id: $model->id,
            leagueId: $model->league_id,
            name: CompetitionName::from($model->name),
            slug: CompetitionSlug::from($model->slug),
            platformId: $model->platform_id,
            status: CompetitionStatus::fromString($model->status),
            createdByUserId: $model->created_by_user_id,
            description: $model->description,
            logoPath: $model->logo_path,
            createdAt: new \DateTimeImmutable($model->created_at->toDateTimeString()),
            updatedAt: new \DateTimeImmutable($model->updated_at->toDateTimeString()),
            deletedAt: $model->deleted_at
                ? new \DateTimeImmutable($model->deleted_at->toDateTimeString())
                : null,
            archivedAt: $model->archived_at
                ? new \DateTimeImmutable($model->archived_at->toDateTimeString())
                : null,
        );
    }

    /**
     * Map domain entity to Eloquent data array.
     *
     * @return array<string, mixed>
     */
    private function mapToEloquent(Competition $competition): array
    {
        return [
            'league_id' => $competition->leagueId(),
            'platform_id' => $competition->platformId(),
            'created_by_user_id' => $competition->createdByUserId(),
            'name' => $competition->name()->value(),
            'slug' => $competition->slug()->value(),
            'description' => $competition->description(),
            'logo_path' => $competition->logoPath(),
            'status' => $competition->status()->value,
            'archived_at' => $competition->archivedAt()?->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Set ID on entity using reflection.
     */
    private function setEntityId(Competition $competition, int $id): void
    {
        $competition->setId($id);
    }
}
