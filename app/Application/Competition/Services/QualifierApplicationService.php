<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateQualifierData;
use App\Application\Competition\DTOs\RaceData;
use App\Application\Competition\DTOs\UpdateQualifierData;
use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Events\QualifierDeleted;
use App\Domain\Competition\Exceptions\QualifierAlreadyExistsException;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceName;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Domain\Competition\ValueObjects\RaceStatus;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Spatie\LaravelData\Optional;

final class QualifierApplicationService
{
    public function __construct(
        private readonly RaceRepositoryInterface $raceRepository,
        private readonly RaceResultRepositoryInterface $raceResultRepository,
    ) {
    }

    public function createQualifier(CreateQualifierData $data, int $roundId): RaceData
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
                assistsRestrictions: $data->assists_restrictions,
                bonusPoints: $data->bonus_points,
                raceNotes: $data->race_notes,
            );

            $this->raceRepository->save($qualifier);
            $this->dispatchEvents($qualifier);

            return RaceData::fromEntity($qualifier);
        });
    }

    public function updateQualifier(int $qualifierId, UpdateQualifierData $data): RaceData
    {
        return DB::transaction(function () use ($qualifierId, $data) {
            $qualifier = $this->raceRepository->findQualifierById($qualifierId);

            // Track status changes for updating race results
            $statusChanged = false;
            $oldStatus = $qualifier->status();
            $newStatus = null;

            // Get current values for fields not being updated
            $name = !($data->name instanceof Optional)
                ? ($data->name !== null ? RaceName::from($data->name) : null)
                : $qualifier->name();

            $qualifyingFormat = !($data->qualifying_format instanceof Optional)
                ? (
                    $data->qualifying_format !== null
                        ? QualifyingFormat::from($data->qualifying_format)
                        : $qualifier->qualifyingFormat()
                )
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

            // Penalty fields are not editable for qualifiers - they are ignored

            $assistsRestrictions = !($data->assists_restrictions instanceof Optional)
                ? $data->assists_restrictions
                : $qualifier->assistsRestrictions();

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
                assistsRestrictions: $assistsRestrictions,
                bonusPoints: $bonusPoints,
                raceNotes: $raceNotes,
            );

            // Handle status update if provided
            if (!($data->status instanceof Optional) && $data->status !== null) {
                $newStatus = RaceStatus::from($data->status);
                if ($oldStatus !== $newStatus) {
                    $statusChanged = true;
                    if ($newStatus === RaceStatus::COMPLETED) {
                        $qualifier->markAsCompleted();
                    } elseif ($newStatus === RaceStatus::SCHEDULED) {
                        $qualifier->markAsScheduled();
                    }
                }
            }

            $this->raceRepository->save($qualifier);
            $this->dispatchEvents($qualifier);

            // Update RaceResult statuses if qualifier status changed
            if ($statusChanged && $newStatus !== null) {
                $this->updateRaceResultStatuses($qualifierId, $newStatus);
            }

            return RaceData::fromEntity($qualifier);
        });
    }

    public function getQualifier(int $qualifierId): RaceData
    {
        $qualifier = $this->raceRepository->findQualifierById($qualifierId);
        return RaceData::fromEntity($qualifier);
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

    /**
     * Update all RaceResult statuses when qualifier status changes.
     */
    private function updateRaceResultStatuses(int $qualifierId, RaceStatus $newRaceStatus): void
    {
        $raceResults = $this->raceResultRepository->findByRaceId($qualifierId);

        $targetStatus = $newRaceStatus === RaceStatus::COMPLETED
            ? RaceResultStatus::CONFIRMED
            : RaceResultStatus::PENDING;

        foreach ($raceResults as $result) {
            if ($result->status() !== $targetStatus) {
                $result->updateStatus($targetStatus);
                $this->raceResultRepository->save($result);
            }
        }
    }
}
