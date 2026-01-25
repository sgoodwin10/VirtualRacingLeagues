<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\Round;
use App\Domain\Competition\Exceptions\RoundNotFoundException;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use App\Domain\Competition\ValueObjects\TiebreakerInformation;
use App\Infrastructure\Persistence\Eloquent\Models\Round as RoundEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use DateTimeImmutable;

/**
 * Eloquent implementation of RoundRepositoryInterface.
 * Handles entity ↔ Eloquent model mapping.
 */
final class EloquentRoundRepository implements RoundRepositoryInterface
{
    /**
     * Save a round (create or update).
     */
    public function save(Round $round): void
    {
        if ($round->id() === null) {
            // Create new
            $eloquent = new RoundEloquent();
            $this->fillEloquentModel($eloquent, $round);
            $eloquent->save();
            /** @var int $id */
            $id = $eloquent->id;
            $round->setId($id);
        } else {
            // Update existing
            /** @var RoundEloquent $eloquent */
            $eloquent = RoundEloquent::findOrFail($round->id());
            $this->fillEloquentModel($eloquent, $round);
            $eloquent->save();
        }
    }

    /**
     * Find a round by ID.
     *
     * @throws RoundNotFoundException
     */
    public function findById(int $id): Round
    {
        /** @var RoundEloquent|null $eloquent */
        $eloquent = RoundEloquent::find($id);

        if ($eloquent === null) {
            throw RoundNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquent);
    }

    /**
     * Find a round by ID with eager-loaded relationships for results display.
     *
     * @return array{round: Round, season: array<string, mixed>}
     *
     * @throws RoundNotFoundException
     */
    public function findByIdWithRelations(int $id): array
    {
        /** @var RoundEloquent|null $eloquent */
        $eloquent = RoundEloquent::with('season')->find($id);

        if ($eloquent === null) {
            throw RoundNotFoundException::withId($id);
        }

        $round = $this->toDomainEntity($eloquent);

        // Extract season data - relation is eagerly loaded
        /** @var SeasonEloquent $seasonModel */
        $seasonModel = $eloquent->season;

        $season = [
            'id' => $seasonModel->id,
            'race_divisions_enabled' => $seasonModel->race_divisions_enabled,
        ];

        return [
            'round' => $round,
            'season' => $season,
        ];
    }

    /**
     * Find all rounds for a season.
     *
     * @return array<Round>
     */
    public function findBySeasonId(int $seasonId): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, RoundEloquent> $eloquentModels */
        $eloquentModels = RoundEloquent::where('season_id', $seasonId)
            ->orderBy('round_number')
            ->get();

        return $eloquentModels->map(fn (RoundEloquent $model) => $this->toDomainEntity($model))->all();
    }

    /**
     * Delete a round (hard delete).
     * Cascades to all races and race results via database foreign key constraints.
     */
    public function delete(Round $round): void
    {
        if ($round->id() === null) {
            return;
        }

        /** @var RoundEloquent|null $eloquent */
        $eloquent = RoundEloquent::find($round->id());
        if ($eloquent !== null) {
            $eloquent->delete(); // Hard delete - cascades to races and race_results via database constraints
        }
    }

    /**
     * Generate a unique slug for the given season.
     */
    public function generateUniqueSlug(string $baseSlug, int $seasonId, ?int $excludeId = null): string
    {
        $slug = $baseSlug;
        $counter = 1;

        while ($this->slugExists($slug, $seasonId, $excludeId)) {
            $slug = $baseSlug . '-' . str_pad((string) $counter, 2, '0', STR_PAD_LEFT);
            $counter++;
        }

        return $slug;
    }

    /**
     * Get the next round number for a season.
     */
    public function getNextRoundNumber(int $seasonId): int
    {
        /** @var int|null $maxRound */
        $maxRound = RoundEloquent::where('season_id', $seasonId)->max('round_number');

        return ($maxRound ?? 0) + 1;
    }

    /**
     * Check if a round exists.
     */
    public function exists(int $id): bool
    {
        return RoundEloquent::where('id', $id)->exists();
    }

    /**
     * Check if slug exists for a season.
     */
    private function slugExists(string $slug, int $seasonId, ?int $excludeId): bool
    {
        $query = RoundEloquent::where('season_id', $seasonId)
            ->where('slug', $slug);

        if ($excludeId !== null) {
            $query = $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Fill Eloquent model from domain entity.
     */
    private function fillEloquentModel(RoundEloquent $model, Round $entity): void
    {
        $model->season_id = $entity->seasonId();
        $model->round_number = $entity->roundNumber()->value();
        $model->name = $entity->name()?->value();
        $model->slug = $entity->slug()->value();
        $model->scheduled_at = $entity->scheduledAt();
        $model->timezone = $entity->timezone();
        $model->platform_track_id = $entity->platformTrackId();
        $model->track_layout = $entity->trackLayout();
        $model->track_conditions = $entity->trackConditions();
        $model->technical_notes = $entity->technicalNotes();
        $model->stream_url = $entity->streamUrl();
        $model->internal_notes = $entity->internalNotes();
        $model->fastest_lap = $entity->fastestLap();
        $model->fastest_lap_top_10 = $entity->fastestLapTop10();
        $model->qualifying_pole = $entity->qualifyingPole();
        $model->qualifying_pole_top_10 = $entity->qualifyingPoleTop10();
        $model->points_system = $entity->pointsSystem()?->toJson();
        $model->round_points = $entity->roundPoints();
        $model->status = $entity->status()->value;
        $model->round_results = $entity->roundResults();
        $model->qualifying_results = $entity->qualifyingResults();
        $model->race_time_results = $entity->raceTimeResults();
        $model->fastest_lap_results = $entity->fastestLapResults();
        $model->team_championship_results = $entity->teamChampionshipResults();
        $model->round_totals_tiebreaker_rules_information = $entity->tiebreakerInformation()?->toArray();
        $model->created_by_user_id = $entity->createdByUserId();
    }

    /**
     * Convert Eloquent model to domain entity.
     */
    private function toDomainEntity(RoundEloquent $model): Round
    {
        /** @var array<mixed>|null $roundResults Laravel's JSON cast returns array or null */
        $roundResults = $model->getAttribute('round_results');

        /** @var array<mixed>|null $qualifyingResults Laravel's JSON cast returns array or null */
        $qualifyingResults = $model->getAttribute('qualifying_results');

        /** @var array<mixed>|null $raceTimeResults Laravel's JSON cast returns array or null */
        $raceTimeResults = $model->getAttribute('race_time_results');

        /** @var array<mixed>|null $fastestLapResults Laravel's JSON cast returns array or null */
        $fastestLapResults = $model->getAttribute('fastest_lap_results');

        /** @var array<mixed>|null $teamChampionshipResults Laravel's JSON cast returns array or null */
        $teamChampionshipResults = $model->getAttribute('team_championship_results');

        return Round::reconstitute(
            id: $model->id,
            seasonId: $model->season_id,
            roundNumber: RoundNumber::from($model->round_number),
            name: $model->name ? RoundName::from($model->name) : null,
            slug: RoundSlug::from($model->slug),
            scheduledAt: $model->scheduled_at ? new DateTimeImmutable($model->scheduled_at->toDateTimeString()) : null,
            timezone: $model->timezone,
            platformTrackId: $model->platform_track_id,
            trackLayout: $model->track_layout,
            trackConditions: $model->track_conditions,
            technicalNotes: $model->technical_notes,
            streamUrl: $model->stream_url,
            internalNotes: $model->internal_notes,
            fastestLap: $model->fastest_lap,
            fastestLapTop10: $model->fastest_lap_top_10,
            qualifyingPole: $model->qualifying_pole,
            qualifyingPoleTop10: $model->qualifying_pole_top_10,
            pointsSystem: PointsSystem::fromJsonOrNull($model->points_system),
            roundPoints: $model->round_points,
            status: RoundStatus::from($model->status),
            roundResults: $roundResults,
            qualifyingResults: $qualifyingResults,
            raceTimeResults: $raceTimeResults,
            fastestLapResults: $fastestLapResults,
            teamChampionshipResults: $teamChampionshipResults,
            tiebreakerInformation: $model->round_totals_tiebreaker_rules_information
                ? TiebreakerInformation::fromArray($model->round_totals_tiebreaker_rules_information)
                : null,
            createdByUserId: $model->created_by_user_id,
            createdAt: new DateTimeImmutable(
                is_string($model->created_at) ? $model->created_at : $model->created_at->toDateTimeString()
            ),
            updatedAt: new DateTimeImmutable(
                is_string($model->updated_at) ? $model->updated_at : $model->updated_at->toDateTimeString()
            ),
        );
    }

    /**
     * Check if a user owns the league that contains this round.
     */
    public function isOwnedByUser(int $roundId, int $userId): bool
    {
        return RoundEloquent::query()
            ->where('id', $roundId)
            ->whereHas('season.competition.league', function ($query) use ($userId) {
                $query->where('owner_user_id', $userId);
            })
            ->exists();
    }
}
