<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\Season;
use App\Domain\Competition\Exceptions\SeasonNotFoundException;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\ValueObjects\SeasonName;
use App\Domain\Competition\ValueObjects\SeasonSlug;
use App\Domain\Competition\ValueObjects\SeasonStatus;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use DateTimeImmutable;

/**
 * Eloquent implementation of SeasonRepositoryInterface.
 * Handles mapping between Season domain entities and Eloquent models.
 */
final class EloquentSeasonRepository implements SeasonRepositoryInterface
{
    public function save(Season $season): void
    {
        $data = $this->mapToEloquent($season);

        if ($season->id() === null) {
            // Create new season
            $model = SeasonEloquent::create($data);
            $season->setId($model->id);
        } else {
            // Update existing season
            SeasonEloquent::where('id', $season->id())->update($data);
        }
    }

    public function findById(int $id): Season
    {
        $model = SeasonEloquent::find($id);

        if (!$model) {
            throw SeasonNotFoundException::withId($id);
        }

        return $this->mapToEntity($model);
    }

    public function findByIdWithTrashed(int $id): Season
    {
        $model = SeasonEloquent::withTrashed()->find($id);

        if (!$model) {
            throw SeasonNotFoundException::withId($id);
        }

        return $this->mapToEntity($model);
    }

    public function findBySlugAndCompetition(string $slug, int $competitionId): Season
    {
        $model = SeasonEloquent::where('slug', $slug)
            ->where('competition_id', $competitionId)
            ->first();

        if (!$model) {
            throw SeasonNotFoundException::withSlug($slug, $competitionId);
        }

        return $this->mapToEntity($model);
    }

    public function existsBySlugAndCompetition(string $slug, int $competitionId): bool
    {
        return SeasonEloquent::where('slug', $slug)
            ->where('competition_id', $competitionId)
            ->exists();
    }

    public function isSlugAvailable(string $slug, int $competitionId, ?int $excludeId = null): bool
    {
        return !$this->slugExistsExcluding($slug, $competitionId, $excludeId);
    }

    /**
     * @return array<Season>
     */
    public function findByCompetition(int $competitionId): array
    {
        return SeasonEloquent::where('competition_id', $competitionId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn(SeasonEloquent $model) => $this->mapToEntity($model))
            ->all();
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{data: array<Season>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function paginate(int $page, int $perPage, array $filters = []): array
    {
        $query = SeasonEloquent::query();

        // Apply filters
        if (isset($filters['competition_id'])) {
            $query->where('competition_id', $filters['competition_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('slug', 'like', '%' . $filters['search'] . '%');
            });
        }

        // Get paginated results
        $result = $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $result->items()
                ? array_map(fn($model) => $this->mapToEntity($model), $result->items())
                : [],
            'total' => $result->total(),
            'per_page' => $result->perPage(),
            'current_page' => $result->currentPage(),
            'last_page' => $result->lastPage(),
        ];
    }

    public function delete(Season $season): void
    {
        SeasonEloquent::where('id', $season->id())->delete();
    }

    public function restore(int $id): void
    {
        $model = SeasonEloquent::withTrashed()->find($id);

        if (!$model) {
            throw SeasonNotFoundException::withId($id);
        }

        $model->restore();
    }

    public function generateUniqueSlug(string $baseSlug, int $competitionId, ?int $excludeSeasonId = null): string
    {
        $slug = $baseSlug;
        $counter = 1;

        while ($this->slugExistsExcluding($slug, $competitionId, $excludeSeasonId)) {
            $slug = $baseSlug . '-' . str_pad((string)$counter, 2, '0', STR_PAD_LEFT);
            $counter++;

            // Safety limit to prevent infinite loops
            if ($counter > 999) {
                throw new \RuntimeException("Unable to generate unique slug for base: {$baseSlug}");
            }
        }

        return $slug;
    }

    /**
     * Check if slug exists, optionally excluding a specific season.
     */
    private function slugExistsExcluding(string $slug, int $competitionId, ?int $excludeSeasonId): bool
    {
        $query = SeasonEloquent::where('slug', $slug)
            ->where('competition_id', $competitionId)
            ->whereNull('deleted_at');

        if ($excludeSeasonId !== null) {
            $query->where('id', '!=', $excludeSeasonId);
        }

        return $query->exists();
    }

    /**
     * Map Eloquent model to domain entity.
     */
    private function mapToEntity(SeasonEloquent $model): Season
    {
        return Season::reconstitute(
            id: $model->id,
            competitionId: $model->competition_id,
            name: SeasonName::from($model->name),
            slug: SeasonSlug::from($model->slug),
            createdByUserId: $model->created_by_user_id,
            status: SeasonStatus::fromString($model->status),
            createdAt: new DateTimeImmutable($model->created_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($model->updated_at->toDateTimeString()),
            carClass: $model->car_class,
            description: $model->description,
            technicalSpecs: $model->technical_specs,
            logoPath: $model->logo_path,
            bannerPath: $model->banner_path,
            teamChampionshipEnabled: $model->team_championship_enabled,
            raceDivisionsEnabled: $model->race_divisions_enabled ?? false,
            deletedAt: $model->deleted_at
                ? new DateTimeImmutable($model->deleted_at->toDateTimeString())
                : null,
        );
    }

    /**
     * Map domain entity to Eloquent data array.
     *
     * @return array<string, mixed>
     */
    private function mapToEloquent(Season $season): array
    {
        return [
            'competition_id' => $season->competitionId(),
            'name' => $season->name()->value(),
            'slug' => $season->slug()->value(),
            'car_class' => $season->carClass(),
            'description' => $season->description(),
            'technical_specs' => $season->technicalSpecs(),
            'logo_path' => $season->logoPath(),
            'banner_path' => $season->bannerPath(),
            'team_championship_enabled' => $season->teamChampionshipEnabled(),
            'race_divisions_enabled' => $season->raceDivisionsEnabled(),
            'status' => $season->status()->value,
            'created_by_user_id' => $season->createdByUserId(),
        ];
    }
}
