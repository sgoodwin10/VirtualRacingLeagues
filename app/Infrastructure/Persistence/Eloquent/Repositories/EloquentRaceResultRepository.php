<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\RaceResult as RaceResultEntity;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
use DateTimeImmutable;

final class EloquentRaceResultRepository implements RaceResultRepositoryInterface
{
    public function save(RaceResultEntity $result): void
    {
        if ($result->id() === null) {
            // Create new
            $model = new RaceResult();
        } else {
            // Update existing - throw exception if not found
            $model = RaceResult::findOrFail($result->id());
        }

        $model->race_id = $result->raceId();
        $model->driver_id = $result->driverId();
        $model->division_id = $result->divisionId();
        $model->position = $result->position();
        $model->original_race_time = $result->originalRaceTime()->value();
        $model->original_race_time_difference = $result->originalRaceTimeDifference()->value();
        $model->final_race_time_difference = $result->finalRaceTimeDifference()->value();
        $model->fastest_lap = $result->fastestLap()->value();
        $model->penalties = $result->penalties()->value();
        $model->has_fastest_lap = $result->hasFastestLap();
        $model->has_pole = $result->hasPole();
        $model->dnf = $result->dnf();
        $model->status = $result->status()->value;
        $model->race_points = $result->racePoints();
        $model->positions_gained = $result->positionsGained();
        $model->save();

        if ($result->id() === null) {
            $result->setId($model->id);
        }
    }

    /**
     * @param RaceResultEntity[] $results
     */
    public function saveMany(array $results): void
    {
        if (empty($results)) {
            return;
        }

        // Separate new and existing results
        $newResults = [];
        $existingResults = [];

        foreach ($results as $result) {
            if ($result->id() === null) {
                $newResults[] = $result;
            } else {
                $existingResults[] = $result;
            }
        }

        // Batch insert new results
        if (!empty($newResults)) {
            $insertData = [];
            foreach ($newResults as $result) {
                $insertData[] = [
                    'race_id' => $result->raceId(),
                    'driver_id' => $result->driverId(),
                    'division_id' => $result->divisionId(),
                    'position' => $result->position(),
                    'original_race_time' => $result->originalRaceTime()->value(),
                    'original_race_time_difference' => $result->originalRaceTimeDifference()->value(),
                    'final_race_time_difference' => $result->finalRaceTimeDifference()->value(),
                    'fastest_lap' => $result->fastestLap()->value(),
                    'penalties' => $result->penalties()->value(),
                    'has_fastest_lap' => $result->hasFastestLap(),
                    'has_pole' => $result->hasPole(),
                    'dnf' => $result->dnf(),
                    'status' => $result->status()->value,
                    'race_points' => $result->racePoints(),
                    'positions_gained' => $result->positionsGained(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            RaceResult::insert($insertData);

            // Set IDs on domain entities (fetch newly inserted records)
            // This is done by finding all results for the race(s) that were just inserted
            foreach ($newResults as $result) {
                $model = RaceResult::where('race_id', $result->raceId())
                    ->where('driver_id', $result->driverId())
                    ->first();
                if ($model) {
                    $result->setId($model->id);
                }
            }
        }

        // Update existing results individually
        foreach ($existingResults as $result) {
            $this->save($result);
        }
    }

    public function findById(int $id): ?RaceResultEntity
    {
        $model = RaceResult::find($id);
        return $model ? $this->toEntity($model) : null;
    }

    /**
     * @return RaceResultEntity[]
     */
    public function findByRaceId(int $raceId): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, RaceResult> $models */
        $models = RaceResult::where('race_id', $raceId)
            ->orderBy('position')
            ->get();

        $entities = [];
        foreach ($models as $model) {
            $entities[] = $this->toEntity($model);
        }

        return $entities;
    }

    /**
     * Find all race results for a round (batch fetch to avoid N+1 queries).
     *
     * @return RaceResultEntity[]
     */
    public function findByRoundId(int $roundId): array
    {
        // Use join to fetch results for a round efficiently
        /** @var \Illuminate\Database\Eloquent\Collection<int, RaceResult> $models */
        $models = RaceResult::join('races', 'race_results.race_id', '=', 'races.id')
            ->where('races.round_id', $roundId)
            ->orderBy('race_results.race_id')
            ->orderBy('race_results.position')
            ->select('race_results.*')
            ->get();

        $entities = [];
        foreach ($models as $model) {
            $entities[] = $this->toEntity($model);
        }

        return $entities;
    }

    public function findByRaceAndDriver(int $raceId, int $driverId): ?RaceResultEntity
    {
        $model = RaceResult::where('race_id', $raceId)
            ->where('driver_id', $driverId)
            ->first();

        return $model ? $this->toEntity($model) : null;
    }

    public function delete(RaceResultEntity $result): void
    {
        if ($result->id()) {
            RaceResult::destroy($result->id());
        }
    }

    public function deleteByRaceId(int $raceId): void
    {
        RaceResult::where('race_id', $raceId)->delete();
    }

    private function toEntity(RaceResult $model): RaceResultEntity
    {
        return RaceResultEntity::reconstitute(
            id: $model->id,
            raceId: $model->race_id,
            driverId: $model->driver_id,
            divisionId: $model->division_id,
            position: $model->position,
            originalRaceTime: $model->original_race_time,
            originalRaceTimeDifference: $model->original_race_time_difference,
            finalRaceTimeDifference: $model->final_race_time_difference,
            fastestLap: $model->fastest_lap,
            penalties: $model->penalties,
            hasFastestLap: $model->has_fastest_lap,
            hasPole: $model->has_pole,
            dnf: $model->dnf,
            status: RaceResultStatus::from($model->status),
            racePoints: $model->race_points,
            positionsGained: $model->positions_gained,
            createdAt: new DateTimeImmutable($model->created_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($model->updated_at->toDateTimeString()),
        );
    }
}
