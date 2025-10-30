<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateQualifierData;
use App\Application\Competition\DTOs\QualifierData;
use App\Application\Competition\DTOs\RaceData;
use App\Application\Competition\DTOs\UpdateQualifierData;
use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Events\QualifierDeleted;
use App\Domain\Competition\Exceptions\QualifierAlreadyExistsException;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceName;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Spatie\LaravelData\Optional;

final class QualifierApplicationService
{
    public function __construct(
        private readonly RaceRepositoryInterface $raceRepository,
    ) {
    }

    public function createQualifier(CreateQualifierData $data, int $roundId): QualifierData
    {
        return DB::transaction(function () use ($data, $roundId) {
            // Business rule: Only one qualifier per round
            if ($this->raceRepository->qualifierExistsForRound($roundId)) {
                throw QualifierAlreadyExistsException::forRound($roundId);
            }

            $qualifier = Race::createQualifier(
                roundId: $roundId,
                name: $data->name !== null ? RaceName::from($data->name) : null,
                qualifyingFormat: QualifyingFormat::from($data->qualifying_format),
                qualifyingLength: $data->qualifying_length,
                qualifyingTire: $data->qualifying_tire,
                weather: $data->weather,
                tireRestrictions: $data->tire_restrictions,
                fuelUsage: $data->fuel_usage,
                damageModel: $data->damage_model,
                trackLimitsEnforced: $data->track_limits_enforced,
                falseStartDetection: $data->false_start_detection,
                collisionPenalties: $data->collision_penalties,
                assistsRestrictions: $data->assists_restrictions,
                raceDivisions: $data->race_divisions,
                bonusPoints: $data->bonus_points,
                raceNotes: $data->race_notes,
            );

            $this->raceRepository->save($qualifier);
            $this->dispatchEvents($qualifier);

            return QualifierData::fromEntity($qualifier);
        });
    }

    public function updateQualifier(int $qualifierId, UpdateQualifierData $data): QualifierData
    {
        return DB::transaction(function () use ($qualifierId, $data) {
            $qualifier = $this->raceRepository->findQualifierById($qualifierId);

            // Get current values for fields not being updated
            $name = !($data->name instanceof Optional)
                ? ($data->name !== null ? RaceName::from($data->name) : null)
                : $qualifier->name();

            $qualifyingFormat = !($data->qualifying_format instanceof Optional)
                ? ($data->qualifying_format !== null ? QualifyingFormat::from($data->qualifying_format) : $qualifier->qualifyingFormat())
                : $qualifier->qualifyingFormat();

            $qualifyingLength = !($data->qualifying_length instanceof Optional)
                ? ($data->qualifying_length ?? $qualifier->qualifyingLength())
                : $qualifier->qualifyingLength();

            $qualifyingTire = !($data->qualifying_tire instanceof Optional)
                ? $data->qualifying_tire
                : $qualifier->qualifyingTire();

            $weather = !($data->weather instanceof Optional)
                ? $data->weather
                : $qualifier->weather();

            $tireRestrictions = !($data->tire_restrictions instanceof Optional)
                ? $data->tire_restrictions
                : $qualifier->tireRestrictions();

            $fuelUsage = !($data->fuel_usage instanceof Optional)
                ? $data->fuel_usage
                : $qualifier->fuelUsage();

            $damageModel = !($data->damage_model instanceof Optional)
                ? $data->damage_model
                : $qualifier->damageModel();

            $trackLimitsEnforced = !($data->track_limits_enforced instanceof Optional)
                ? ($data->track_limits_enforced ?? $qualifier->trackLimitsEnforced())
                : $qualifier->trackLimitsEnforced();

            $falseStartDetection = !($data->false_start_detection instanceof Optional)
                ? ($data->false_start_detection ?? $qualifier->falseStartDetection())
                : $qualifier->falseStartDetection();

            $collisionPenalties = !($data->collision_penalties instanceof Optional)
                ? ($data->collision_penalties ?? $qualifier->collisionPenalties())
                : $qualifier->collisionPenalties();

            $assistsRestrictions = !($data->assists_restrictions instanceof Optional)
                ? $data->assists_restrictions
                : $qualifier->assistsRestrictions();

            $raceDivisions = !($data->race_divisions instanceof Optional)
                ? ($data->race_divisions ?? $qualifier->raceDivisions())
                : $qualifier->raceDivisions();

            $bonusPoints = !($data->bonus_points instanceof Optional)
                ? $data->bonus_points
                : $qualifier->bonusPoints();

            $raceNotes = !($data->race_notes instanceof Optional)
                ? $data->race_notes
                : $qualifier->raceNotes();

            $qualifier->updateQualifierConfiguration(
                name: $name,
                qualifyingFormat: $qualifyingFormat,
                qualifyingLength: $qualifyingLength ?? 0,
                qualifyingTire: $qualifyingTire,
                weather: $weather,
                tireRestrictions: $tireRestrictions,
                fuelUsage: $fuelUsage,
                damageModel: $damageModel,
                trackLimitsEnforced: $trackLimitsEnforced,
                falseStartDetection: $falseStartDetection,
                collisionPenalties: $collisionPenalties,
                assistsRestrictions: $assistsRestrictions,
                raceDivisions: $raceDivisions,
                bonusPoints: $bonusPoints,
                raceNotes: $raceNotes,
            );

            $this->raceRepository->save($qualifier);
            $this->dispatchEvents($qualifier);

            return QualifierData::fromEntity($qualifier);
        });
    }

    public function getQualifier(int $qualifierId): QualifierData
    {
        $qualifier = $this->raceRepository->findQualifierById($qualifierId);
        return QualifierData::fromEntity($qualifier);
    }

    public function getQualifierByRound(int $roundId): ?RaceData
    {
        $qualifier = $this->raceRepository->findQualifierByRoundId($roundId);

        if ($qualifier === null) {
            return null;
        }

        return RaceData::fromEntity($qualifier);
    }

    public function deleteQualifier(int $qualifierId): void
    {
        DB::transaction(function () use ($qualifierId) {
            $qualifier = $this->raceRepository->findQualifierById($qualifierId);
            $roundId = $qualifier->roundId();

            $this->raceRepository->delete($qualifier);

            // Dispatch deletion event
            Event::dispatch(new QualifierDeleted(
                qualifierId: $qualifierId,
                roundId: $roundId,
                occurredAt: new DateTimeImmutable(),
            ));
        });
    }

    private function dispatchEvents(Race $qualifier): void
    {
        $events = $qualifier->releaseEvents();
        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }
}
