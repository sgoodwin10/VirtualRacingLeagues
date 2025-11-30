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
        $competitionId = $competition->id();

        // Cascade soft delete: First delete all seasons, which will cascade to rounds
        $seasons = \App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent::query()
            ->where('competition_id', $competitionId)
            ->get();

        foreach ($seasons as $season) {
            // Soft delete all rounds for this season
            \App\Infrastructure\Persistence\Eloquent\Models\Round::query()
                ->where('season_id', $season->id)
                ->delete();

            // Soft delete the season
            $season->delete();
        }

        // Finally, soft delete the competition itself
        CompetitionModel::where('id', $competitionId)->delete();
    }

    public function findById(int $id): Competition
    {
        /** @var CompetitionModel|null $model */
        $model = CompetitionModel::withTrashed()
            ->with('platform')
            ->withCount([
                'seasons as total_seasons',
                'seasons as active_seasons' => function ($query): void {
                    $query->where('status', 'active');
                },
                'seasonDrivers as total_drivers',
            ])
            ->find($id);

        if (!$model) {
            throw CompetitionNotFoundException::withId($id);
        }

        return $this->mapToEntity($model);
    }

    public function findBySlug(string $slug, int $leagueId): Competition
    {
        $model = CompetitionModel::where('slug', $slug)
            ->where('league_id', $leagueId)
            ->with('platform')
            ->withCount([
                'seasons as total_seasons',
                'seasons as active_seasons' => function ($query): void {
                    $query->where('status', 'active');
                },
                'seasonDrivers as total_drivers',
            ])
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
            ->with('platform')
            ->withCount([
                'seasons as total_seasons',
                'seasons as active_seasons' => function ($query): void {
                    $query->where('status', 'active');
                },
                'seasonDrivers as total_drivers',
            ])
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
                    $query->where('status', 'active');
                },
                'seasonDrivers as total_drivers',
            ])
            ->find($competitionId);

        if (!$model) {
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
            ->whereNull('rounds.deleted_at')
            ->whereNull('seasons.deleted_at')
            ->count();

        // Count races through seasons -> rounds -> races
        // Note: races table does not have soft deletes or deleted_at column
        $totalRaces = \App\Infrastructure\Persistence\Eloquent\Models\Race::query()
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
            ->where('seasons.competition_id', $competitionId)
            ->whereNull('rounds.deleted_at')
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
     * @param array<Competition> $competitions
     * @return array<int, array<string, int|string|null>> Keyed by competition ID
     */
    public function getStatsForEntities(array $competitions): array
    {
        $competitionIds = array_filter(
            array_map(fn(Competition $c) => $c->id(), $competitions),
            fn($id) => $id !== null
        );

        if (empty($competitionIds)) {
            return [];
        }

        $models = CompetitionModel::whereIn('id', $competitionIds)
            ->withCount([
                'seasons as total_seasons',
                'seasons as active_seasons' => function ($query): void {
                    $query->where('status', 'active');
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
            ->whereNull('rounds.deleted_at')
            ->whereNull('seasons.deleted_at')
            ->groupBy('seasons.competition_id')
            ->pluck('total', 'competition_id')
            ->toArray();

        // Count races for all competitions
        // Note: races table does not have soft deletes or deleted_at column
        $raceCounts = \App\Infrastructure\Persistence\Eloquent\Models\Race::query()
            ->select('seasons.competition_id', \Illuminate\Support\Facades\DB::raw('COUNT(*) as total'))
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
            ->whereIn('seasons.competition_id', $competitionIds)
            ->whereNull('rounds.deleted_at')
            ->whereNull('seasons.deleted_at')
            ->groupBy('seasons.competition_id')
            ->pluck('total', 'competition_id')
            ->toArray();

        $stats = [];
        foreach ($competitionIds as $id) {
            $model = $models->get($id);
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
            'competition_colour' => $competition->competitionColour(),
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
