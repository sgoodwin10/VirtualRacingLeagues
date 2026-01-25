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
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Eloquent implementation of CompetitionRepositoryInterface.
 * Handles mapping between domain entities and Eloquent models.
 */
final class EloquentCompetitionRepository implements CompetitionRepositoryInterface
{
    public function save(Competition $competition): void
    {
        DB::transaction(function () use ($competition): void {
            $data = $this->mapToEloquent($competition);

            // If entity has an ID, update existing record
            if ($competition->id() !== null) {
                CompetitionModel::where('id', $competition->id())->update($data);
            } else {
                // If no ID, create new record and set ID on entity
                $model = CompetitionModel::create($data);
                $this->setEntityId($competition, $model->id);
            }
        });
    }

    public function update(Competition $competition): void
    {
        DB::transaction(function () use ($competition): void {
            $competitionId = $competition->id();

            if ($competitionId === null) {
                throw new \InvalidArgumentException('Cannot update competition without an ID');
            }

            $data = $this->mapToEloquent($competition);

            CompetitionModel::where('id', $competitionId)->update($data);
        });
    }

    public function delete(Competition $competition): void
    {
        DB::transaction(function () use ($competition): void {
            $competitionId = $competition->id();

            // Step 1: Get all season IDs for this competition
            $seasonIds = SeasonEloquent::query()
                ->where('competition_id', $competitionId)
                ->pluck('id');

            if ($seasonIds->isNotEmpty()) {
                // Step 2: Get all round IDs for these seasons
                $roundIds = Round::query()
                    ->whereIn('season_id', $seasonIds)
                    ->pluck('id');

                if ($roundIds->isNotEmpty()) {
                    // Step 3: Get all race IDs for these rounds
                    $raceIds = \App\Infrastructure\Persistence\Eloquent\Models\Race::query()
                        ->whereIn('round_id', $roundIds)
                        ->pluck('id');

                    if ($raceIds->isNotEmpty()) {
                        // Step 4: Delete all race results for these races (hard delete)
                        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::query()
                            ->whereIn('race_id', $raceIds)
                            ->delete();
                    }

                    // Step 5: Delete all races for these rounds (hard delete)
                    \App\Infrastructure\Persistence\Eloquent\Models\Race::query()
                        ->whereIn('round_id', $roundIds)
                        ->delete();
                }

                // Step 6: Delete all season drivers for these seasons (hard delete)
                \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::query()
                    ->whereIn('season_id', $seasonIds)
                    ->delete();

                // Step 7: Delete all season round tiebreaker rules for these seasons (if table exists)
                if (DB::getSchemaBuilder()->hasTable('season_round_tiebreaker_rules')) {
                    DB::table('season_round_tiebreaker_rules')
                        ->whereIn('season_id', $seasonIds)
                        ->delete();
                }

                // Step 8: Bulk delete rounds for all seasons (force delete to bypass soft deletes)
                /** @var \Illuminate\Database\Eloquent\Builder<Round> $roundsQuery */
                $roundsQuery = Round::query()->whereIn('season_id', $seasonIds);
                $roundsQuery->forceDelete();
            }

            // Step 9: Bulk delete seasons (force delete to bypass soft deletes)
            /** @var \Illuminate\Database\Eloquent\Builder<SeasonEloquent> $seasonsQuery */
            $seasonsQuery = SeasonEloquent::query()->where('competition_id', $competitionId);
            $seasonsQuery->forceDelete();

            // Step 10: Delete media files associated with the competition
            $competitionModel = CompetitionModel::find($competitionId);
            if ($competitionModel) {
                $competitionModel->clearMediaCollection('logo');
            }

            // Step 11: Delete the competition itself (regular delete as it doesn't use SoftDeletes)
            CompetitionModel::where('id', $competitionId)->delete();
        });
    }

    public function findById(int $id): Competition
    {
        /** @var Builder<CompetitionModel> $query */
        $query = CompetitionModel::query();
        /** @var CompetitionModel|null $model */
        $model = $this->applyDefaultIncludes($query)->find($id);

        if (! $model) {
            throw CompetitionNotFoundException::withId($id);
        }

        return $this->mapToEntity($model);
    }

    public function findBySlug(string $slug, int $leagueId): Competition
    {
        $model = $this->applyDefaultIncludes(
            CompetitionModel::where('slug', $slug)
                ->where('league_id', $leagueId)
        )->first();

        if (! $model) {
            throw CompetitionNotFoundException::withSlug($slug, $leagueId);
        }

        return $this->mapToEntity($model);
    }

    /**
     * @return array<Competition>
     */
    public function findByLeagueId(int $leagueId): array
    {
        return $this->applyDefaultIncludes(
            CompetitionModel::where('league_id', $leagueId)
        )
            ->get()
            ->map(fn (CompetitionModel $model) => $this->mapToEntity($model))
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
        return ! $this->existsBySlug($slug, $leagueId, $excludeId);
    }

    public function countByLeagueId(int $leagueId): int
    {
        return CompetitionModel::where('league_id', $leagueId)->count();
    }

    public function countActiveByLeagueId(int $leagueId): int
    {
        return CompetitionModel::where('league_id', $leagueId)
            ->where('status', CompetitionStatus::ACTIVE->value)
            ->count();
    }

    /**
     * Get stats for a competition entity.
     *
     * @return array<string, int|string|null>
     */
    public function getStatsForEntity(Competition $competition): array
    {
        $competitionId = $competition->id();
        if ($competitionId === null) {
            return [
                'total_seasons' => 0,
                'active_seasons' => 0,
                'total_drivers' => 0,
                'total_rounds' => 0,
                'total_races' => 0,
                'next_race_date' => null,
            ];
        }

        $model = CompetitionModel::query()
            ->withCount([
                'seasons as total_seasons',
                'seasons as active_seasons' => function ($query): void {
                    $query->where('status', CompetitionStatus::ACTIVE->value);
                },
                'seasonDrivers as total_drivers',
            ])
            ->find($competitionId);

        if (! $model) {
            return [
                'total_seasons' => 0,
                'active_seasons' => 0,
                'total_drivers' => 0,
                'total_rounds' => 0,
                'total_races' => 0,
                'next_race_date' => null,
            ];
        }

        // Count rounds through seasons -> rounds
        $totalRounds = \App\Infrastructure\Persistence\Eloquent\Models\Round::query()
            ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
            ->where('seasons.competition_id', $competitionId)
            ->whereNull('seasons.deleted_at')
            ->count();

        // Count races through seasons -> rounds -> races
        $totalRaces = \App\Infrastructure\Persistence\Eloquent\Models\Race::query()
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
            ->where('seasons.competition_id', $competitionId)
            ->whereNull('seasons.deleted_at')
            ->count();

        return [
            'total_seasons' => (int) ($model->total_seasons ?? 0),
            'active_seasons' => (int) ($model->active_seasons ?? 0),
            'total_drivers' => (int) ($model->total_drivers ?? 0),
            'total_rounds' => $totalRounds,
            'total_races' => $totalRaces,
            'next_race_date' => null, // TODO: Implement next race date calculation
        ];
    }

    /**
     * Get stats for multiple competition entities.
     *
     * @param  array<Competition>  $competitions
     * @return array<int, array<string, int|string|null>> Keyed by competition ID
     */
    public function getStatsForEntities(array $competitions): array
    {
        $competitionIds = array_filter(
            array_map(fn (Competition $c) => $c->id(), $competitions),
            fn ($id) => $id !== null
        );

        if (empty($competitionIds)) {
            return [];
        }

        $models = CompetitionModel::whereIn('id', $competitionIds)
            ->withCount([
                'seasons as total_seasons',
                'seasons as active_seasons' => function ($query): void {
                    $query->where('status', CompetitionStatus::ACTIVE->value);
                },
                'seasonDrivers as total_drivers',
            ])
            ->get()
            ->keyBy('id');

        // Count rounds for all competitions
        $roundCounts = \App\Infrastructure\Persistence\Eloquent\Models\Round::query()
            ->select('seasons.competition_id', \Illuminate\Support\Facades\DB::raw('COUNT(*) as total'))
            ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
            ->whereIn('seasons.competition_id', $competitionIds)
            ->whereNull('seasons.deleted_at')
            ->groupBy('seasons.competition_id')
            ->pluck('total', 'competition_id')
            ->toArray();

        // Count races for all competitions
        $raceCounts = \App\Infrastructure\Persistence\Eloquent\Models\Race::query()
            ->select('seasons.competition_id', \Illuminate\Support\Facades\DB::raw('COUNT(*) as total'))
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
            ->whereIn('seasons.competition_id', $competitionIds)
            ->whereNull('seasons.deleted_at')
            ->groupBy('seasons.competition_id')
            ->pluck('total', 'competition_id')
            ->toArray();

        $stats = [];
        foreach ($competitionIds as $id) {
            $model = $models->get($id);

            // Skip if model doesn't exist (shouldn't happen, but add null safety)
            if ($model === null) {
                continue;
            }

            $stats[$id] = [
                'total_seasons' => (int) ($model->total_seasons ?? 0),
                'active_seasons' => (int) ($model->active_seasons ?? 0),
                'total_drivers' => (int) ($model->total_drivers ?? 0),
                'total_rounds' => (int) ($roundCounts[$id] ?? 0),
                'total_races' => (int) ($raceCounts[$id] ?? 0),
                'next_race_date' => null, // TODO: Implement next race date calculation
            ];
        }

        return $stats;
    }

    /**
     * Apply default includes (eager loading and counts) to a query builder.
     *
     * @param  Builder<CompetitionModel>  $query
     * @return Builder<CompetitionModel>
     */
    private function applyDefaultIncludes(Builder $query): Builder
    {
        // Note: Platform relation is not eager loaded as it's not used in entity mapping
        // Platform data is fetched separately via PlatformRepository when needed
        return $query->withCount([
            'seasons as total_seasons',
            'seasons as active_seasons' => function ($query): void {
                $query->where('status', CompetitionStatus::ACTIVE->value);
            },
            'seasonDrivers as total_drivers',
        ]);
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
            competitionColour: $model->competition_colour,
            createdAt: $model->created_at
                ? \DateTimeImmutable::createFromInterface($model->created_at)
                : new \DateTimeImmutable(),
            updatedAt: $model->updated_at
                ? \DateTimeImmutable::createFromInterface($model->updated_at)
                : new \DateTimeImmutable(),
            archivedAt: $model->archived_at
                ? \DateTimeImmutable::createFromInterface($model->archived_at)
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
        $data = [
            'league_id' => $competition->leagueId(),
            'platform_id' => $competition->platformId(),
            'created_by_user_id' => $competition->createdByUserId(),
            'name' => $competition->name()->value(),
            'slug' => $competition->slug()->value(),
            'description' => $competition->description(),
            'logo_path' => $competition->logoPath(),
            'competition_colour' => $competition->competitionColour(),
            'status' => $competition->status()->value,
            'archived_at' => $competition->archivedAt()?->format('Y-m-d H:i:s'),
        ];

        // Only include created_at for new records (when entity has no ID)
        // For updates, let Laravel's automatic timestamp management handle updated_at
        if ($competition->id() === null) {
            $data['created_at'] = $competition->createdAt()->format('Y-m-d H:i:s');
        }

        return $data;
    }

    /**
     * Set ID on entity using reflection.
     * This avoids exposing a public setter on the entity.
     */
    private function setEntityId(Competition $competition, int $id): void
    {
        $reflection = new \ReflectionClass($competition);
        $property = $reflection->getProperty('id');
        $property->setAccessible(true);
        $property->setValue($competition, $id);
    }

    /**
     * Get the Eloquent model for a competition by ID.
     * Used for media operations that require the Eloquent model.
     *
     * @throws CompetitionNotFoundException
     */
    public function getEloquentModel(int $id): CompetitionModel
    {
        $model = CompetitionModel::with('media')->find($id);

        if (! $model) {
            throw CompetitionNotFoundException::withId($id);
        }

        return $model;
    }
}
