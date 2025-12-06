<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\Race as RaceEntity;
use App\Domain\Competition\Exceptions\QualifierNotFoundException;
use App\Domain\Competition\Exceptions\RaceNotFoundException;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\ValueObjects\GridSource;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceLengthType;
use App\Domain\Competition\ValueObjects\RaceName;
use App\Domain\Competition\ValueObjects\RaceStatus;
use App\Domain\Competition\ValueObjects\RaceType;
use App\Infrastructure\Persistence\Eloquent\Models\Race as RaceEloquent;
use DateTimeImmutable;

final class EloquentRaceRepository implements RaceRepositoryInterface
{
    public function save(RaceEntity $race): void
    {
        $eloquentModel = $race->id() !== null
            ? RaceEloquent::findOrFail($race->id())
            : new RaceEloquent();

        $this->fillEloquentModel($eloquentModel, $race);
        $eloquentModel->save();

        if ($race->id() === null) {
            $race->setId($eloquentModel->id);
        }
    }

    public function findById(int $id): RaceEntity
    {
        $eloquentModel = RaceEloquent::find($id);

        if ($eloquentModel === null) {
            throw RaceNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquentModel);
    }

    /**
     * @return array<RaceEntity>
     */
    public function findByRoundId(int $roundId): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, RaceEloquent> $eloquentModels */
        $eloquentModels = RaceEloquent::where('round_id', $roundId)
            ->where('is_qualifier', false)
            ->orderBy('race_number')
            ->get();

        return $eloquentModels->map(fn(RaceEloquent $model) => $this->toDomainEntity($model))
            ->all();
    }

    /**
     * @return array<RaceEntity>
     */
    public function findAllByRoundId(int $roundId): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, RaceEloquent> $eloquentModels */
        $eloquentModels = RaceEloquent::where('round_id', $roundId)
            ->orderBy('is_qualifier', 'desc') // Qualifier first
            ->orderBy('race_number')
            ->get();

        return $eloquentModels->map(fn(RaceEloquent $model) => $this->toDomainEntity($model))
            ->all();
    }

    public function delete(RaceEntity $race): void
    {
        if ($race->id() === null) {
            return;
        }

        RaceEloquent::where('id', $race->id())->delete();
    }

    public function getNextRaceNumber(int $roundId): int
    {
        $maxRaceNumber = RaceEloquent::where('round_id', $roundId)
            ->where('race_number', '>', 0) // Exclude qualifiers (race_number = 0)
            ->max('race_number');

        return $maxRaceNumber !== null ? ((int) $maxRaceNumber) + 1 : 1;
    }

    public function exists(int $id): bool
    {
        return RaceEloquent::where('id', $id)->exists();
    }

    public function isOwnedByUser(int $raceId, int $userId): bool
    {
        return RaceEloquent::where('races.id', $raceId)
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
            ->join('competitions', 'seasons.competition_id', '=', 'competitions.id')
            ->join('leagues', 'competitions.league_id', '=', 'leagues.id')
            ->where('leagues.owner_user_id', $userId)
            ->exists();
    }

    private function fillEloquentModel(RaceEloquent $model, RaceEntity $race): void
    {
        $model->round_id = $race->roundId();
        $model->is_qualifier = $race->isQualifier();
        $model->race_number = $race->raceNumber();
        $model->name = $race->name()?->value();
        $model->race_type = $race->type()?->value;

        // Qualifying
        $model->qualifying_format = $race->qualifyingFormat()->value;
        $model->qualifying_length = $race->qualifyingLength();
        $model->qualifying_tire = $race->qualifyingTire();

        // Grid
        $model->grid_source = $race->gridSource()->value;
        $model->grid_source_race_id = $race->gridSourceRaceId();

        // Length
        $model->length_type = $race->lengthType()->value;
        $model->length_value = $race->lengthValue();
        $model->extra_lap_after_time = $race->extraLapAfterTime();

        // Platform settings
        $model->weather = $race->weather();
        $model->tire_restrictions = $race->tireRestrictions();
        $model->fuel_usage = $race->fuelUsage();
        $model->damage_model = $race->damageModel();

        // Penalties & Rules
        $model->track_limits_enforced = $race->trackLimitsEnforced();
        $model->false_start_detection = $race->falseStartDetection();
        $model->collision_penalties = $race->collisionPenalties();
        $model->mandatory_pit_stop = $race->mandatoryPitStop();
        $model->minimum_pit_time = $race->minimumPitTime();
        $model->assists_restrictions = $race->assistsRestrictions();

        // Bonus Points
        $model->fastest_lap = $race->fastestLap();
        $model->fastest_lap_top_10 = $race->fastestLapTop10();
        $model->qualifying_pole = $race->qualifyingPole();
        $model->qualifying_pole_top_10 = $race->qualifyingPoleTop10();

        // Points - Convert to JSON
        $model->points_system = $race->pointsSystem()->toArray();
        $model->dnf_points = $race->dnfPoints();
        $model->dns_points = $race->dnsPoints();
        $model->race_points = $race->racePoints();

        // Notes
        $model->race_notes = $race->raceNotes();

        // Status
        $model->status = $race->status()->value;
    }

    private function toDomainEntity(RaceEloquent $model): RaceEntity
    {
        // Handle points_system - should always be array due to cast, but defensive check for edge cases
        /** @var array<int, int>|string $pointsSystemRaw */
        $pointsSystemRaw = $model->points_system;
        $pointsSystem = [];

        if (is_string($pointsSystemRaw)) {
            $decoded = json_decode($pointsSystemRaw, true);
            $pointsSystem = is_array($decoded) ? $decoded : [];
        } elseif (is_array($pointsSystemRaw)) {
            $pointsSystem = $pointsSystemRaw;
        }

        return RaceEntity::reconstitute(
            id: $model->id,
            roundId: $model->round_id,
            isQualifier: $model->is_qualifier,
            raceNumber: $model->race_number,
            name: $model->name !== null ? RaceName::from($model->name) : null,
            type: $model->race_type !== null ? RaceType::from($model->race_type) : null,
            qualifyingFormat: QualifyingFormat::from($model->qualifying_format),
            qualifyingLength: $model->qualifying_length,
            qualifyingTire: $model->qualifying_tire,
            gridSource: GridSource::from($model->grid_source),
            gridSourceRaceId: $model->grid_source_race_id,
            lengthType: RaceLengthType::from($model->length_type),
            lengthValue: $model->length_value,
            extraLapAfterTime: $model->extra_lap_after_time,
            weather: $model->weather,
            tireRestrictions: $model->tire_restrictions,
            fuelUsage: $model->fuel_usage,
            damageModel: $model->damage_model,
            trackLimitsEnforced: $model->track_limits_enforced,
            falseStartDetection: $model->false_start_detection,
            collisionPenalties: $model->collision_penalties,
            mandatoryPitStop: $model->mandatory_pit_stop,
            minimumPitTime: $model->minimum_pit_time,
            assistsRestrictions: $model->assists_restrictions,
            fastestLap: $model->fastest_lap,
            fastestLapTop10: $model->fastest_lap_top_10,
            qualifyingPole: $model->qualifying_pole,
            qualifyingPoleTop10: $model->qualifying_pole_top_10,
            pointsSystem: PointsSystem::from($pointsSystem),
            dnfPoints: $model->dnf_points,
            dnsPoints: $model->dns_points,
            racePoints: $model->race_points,
            raceNotes: $model->race_notes,
            status: RaceStatus::from($model->status),
            /** @phpstan-ignore-next-line */
            createdAt: DateTimeImmutable::createFromMutable($model->created_at),
            /** @phpstan-ignore-next-line */
            updatedAt: DateTimeImmutable::createFromMutable($model->updated_at),
        );
    }

    public function findQualifierById(int $id): RaceEntity
    {
        $eloquentModel = RaceEloquent::where('id', $id)
            ->where('is_qualifier', true)
            ->first();

        if ($eloquentModel === null) {
            throw QualifierNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquentModel);
    }

    public function findQualifierByRoundId(int $roundId): ?RaceEntity
    {
        $eloquentModel = RaceEloquent::where('round_id', $roundId)
            ->where('is_qualifier', true)
            ->first();

        if ($eloquentModel === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentModel);
    }

    public function qualifierExistsForRound(int $roundId): bool
    {
        return RaceEloquent::where('round_id', $roundId)
            ->where('is_qualifier', true)
            ->exists();
    }
}
