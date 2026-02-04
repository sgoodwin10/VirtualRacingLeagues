<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Activity\Services\LeagueActivityLogService;
use App\Application\Competition\DTOs\CreateQualifierData;
use App\Application\Competition\DTOs\RaceData;
use App\Application\Competition\DTOs\UpdateQualifierData;
use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Events\QualifierDeleted;
use App\Domain\Competition\Exceptions\QualifierAlreadyExistsException;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceName;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Domain\Competition\ValueObjects\RaceStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Race as RaceModel;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Spatie\LaravelData\Optional;

final class QualifierApplicationService
{
    public function __construct(
        private readonly RaceRepositoryInterface $raceRepository,
        private readonly RaceResultRepositoryInterface $raceResultRepository,
        private readonly RoundRepositoryInterface $roundRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly LeagueActivityLogService $activityLogService,
    ) {
    }

    public function createQualifier(CreateQualifierData $data, int $roundId, int $userId): RaceData
    {
        return DB::transaction(function () use ($data, $roundId, $userId) {
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
                qualifyingPole: $data->qualifying_pole,
                qualifyingPoleTop10: $data->qualifying_pole_top_10 ?? false,
                raceNotes: $data->race_notes,
            );

            $this->raceRepository->save($qualifier);
            $this->dispatchEvents($qualifier);

            // Log activity
            $this->logQualifierCreated($qualifier->id() ?? 0, $userId);

            return RaceData::fromEntity($qualifier);
        });
    }

    public function updateQualifier(int $qualifierId, UpdateQualifierData $data, int $userId): RaceData
    {
        return DB::transaction(function () use ($qualifierId, $data, $userId) {
            $qualifier = $this->raceRepository->findQualifierById($qualifierId);

            // Capture original data for change tracking
            $originalData = [
                'name' => $qualifier->name()?->value(),
                'qualifying_length' => $qualifier->qualifyingLength(),
            ];

            // Track status changes for updating race results
            $statusChanged = false;
            $oldStatus = $qualifier->status();
            $newStatus = null;

            // Get current values for fields not being updated
            $name = ! ($data->name instanceof Optional)
                ? ($data->name !== null ? RaceName::from($data->name) : null)
                : $qualifier->name();

            $qualifyingFormat = ! ($data->qualifying_format instanceof Optional)
                ? (
                    $data->qualifying_format !== null
                        ? QualifyingFormat::from($data->qualifying_format)
                        : $qualifier->qualifyingFormat()
                )
                : $qualifier->qualifyingFormat();

            $qualifyingLength = ! ($data->qualifying_length instanceof Optional)
                ? ($data->qualifying_length ?? $qualifier->qualifyingLength())
                : $qualifier->qualifyingLength();

            $qualifyingTire = ! ($data->qualifying_tire instanceof Optional)
                ? $data->qualifying_tire
                : $qualifier->qualifyingTire();

            $weather = ! ($data->weather instanceof Optional)
                ? $data->weather
                : $qualifier->weather();

            $tireRestrictions = ! ($data->tire_restrictions instanceof Optional)
                ? $data->tire_restrictions
                : $qualifier->tireRestrictions();

            $fuelUsage = ! ($data->fuel_usage instanceof Optional)
                ? $data->fuel_usage
                : $qualifier->fuelUsage();

            $damageModel = ! ($data->damage_model instanceof Optional)
                ? $data->damage_model
                : $qualifier->damageModel();

            // Penalty fields are not editable for qualifiers - they are ignored

            $assistsRestrictions = ! ($data->assists_restrictions instanceof Optional)
                ? $data->assists_restrictions
                : $qualifier->assistsRestrictions();

            $qualifyingPole = ! ($data->qualifying_pole instanceof Optional)
                ? $data->qualifying_pole
                : $qualifier->qualifyingPole();

            $qualifyingPoleTop10 = ! ($data->qualifying_pole_top_10 instanceof Optional)
                ? ($data->qualifying_pole_top_10 ?? $qualifier->qualifyingPoleTop10())
                : $qualifier->qualifyingPoleTop10();

            $raceNotes = ! ($data->race_notes instanceof Optional)
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
                qualifyingPole: $qualifyingPole,
                qualifyingPoleTop10: $qualifyingPoleTop10,
                raceNotes: $raceNotes,
            );

            // Handle status update if provided
            if (! ($data->status instanceof Optional) && $data->status !== null) {
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

            // Log activity with changes
            $newData = [
                'name' => $qualifier->name()?->value(),
                'qualifying_length' => $qualifier->qualifyingLength(),
            ];
            $this->logQualifierUpdated($qualifierId, $userId, $originalData, $newData);

            return RaceData::fromEntity($qualifier);
        });
    }

    public function getQualifier(int $qualifierId): RaceData
    {
        $qualifier = $this->raceRepository->findQualifierById($qualifierId);

        // Check for orphaned results if qualifier is completed and season has divisions enabled
        $hasOrphanedResults = false;
        if ($qualifier->status()->value === 'completed' && $qualifier->id() !== null) {
            $round = $this->roundRepository->findById($qualifier->roundId());
            $season = $this->seasonRepository->findById($round->seasonId());

            if ($season->raceDivisionsEnabled()) {
                $hasOrphanedResults = $this->raceResultRepository->hasOrphanedResultsForRace($qualifier->id());
            }
        }

        return RaceData::fromEntity($qualifier, $hasOrphanedResults);
    }

    public function getQualifierByRound(int $roundId): ?RaceData
    {
        $qualifier = $this->raceRepository->findQualifierByRoundId($roundId);

        if ($qualifier === null) {
            return null;
        }

        // Check for orphaned results if qualifier is completed and season has divisions enabled
        $hasOrphanedResults = false;
        if ($qualifier->status()->value === 'completed' && $qualifier->id() !== null) {
            $round = $this->roundRepository->findById($roundId);
            $season = $this->seasonRepository->findById($round->seasonId());

            if ($season->raceDivisionsEnabled()) {
                $hasOrphanedResults = $this->raceResultRepository->hasOrphanedResultsForRace($qualifier->id());
            }
        }

        return RaceData::fromEntity($qualifier, $hasOrphanedResults);
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

        // Calculate pole position points when qualifier is completed
        if ($newRaceStatus === RaceStatus::COMPLETED) {
            $this->calculatePolePositionPoints($qualifierId);
        }
    }

    /**
     * Calculate pole position points for qualifier.
     * Determines positions based on fastest_lap times (ascending - fastest wins).
     * Awards pole position bonus points if configured.
     * Handles divisions if enabled - each division gets its own pole position.
     */
    private function calculatePolePositionPoints(int $qualifierId): void
    {
        $qualifier = $this->raceRepository->findQualifierById($qualifierId);
        $raceResults = $this->raceResultRepository->findByRaceId($qualifierId);

        if (empty($raceResults)) {
            return;
        }

        // Get round and season to check if divisions are enabled
        $round = $this->roundRepository->findById($qualifier->roundId());
        $season = $this->seasonRepository->findById($round->seasonId());
        $divisionsEnabled = $season->raceDivisionsEnabled();

        if ($divisionsEnabled) {
            // Group results by division and calculate pole position for each division
            $resultsByDivision = [];
            foreach ($raceResults as $result) {
                $divisionId = $result->divisionId() ?? 0; // Use 0 for null division
                if (! isset($resultsByDivision[$divisionId])) {
                    $resultsByDivision[$divisionId] = [];
                }
                $resultsByDivision[$divisionId][] = $result;
            }

            // Calculate pole position for each division independently
            foreach ($resultsByDivision as $divisionResults) {
                $this->calculatePolePositionForResultSet($qualifier, $divisionResults);
            }
        } else {
            // Calculate pole position for all results together
            $this->calculatePolePositionForResultSet($qualifier, $raceResults);
        }
    }

    /**
     * Calculate pole position for a set of qualifier results.
     * This method is called per division when divisions are enabled.
     *
     * @param  array<\App\Domain\Competition\Entities\RaceResult>  $results
     */
    private function calculatePolePositionForResultSet(Race $qualifier, array $results): void
    {
        // Check if ALL results have no fastest_lap data (fallback to submission order)
        $allResultsHaveNoTime = true;
        foreach ($results as $result) {
            if (! $result->fastestLap()->isNull() && ! $result->dnf()) {
                $allResultsHaveNoTime = false;
                break;
            }
        }

        // If all results have no time, use submission order (database order by ID)
        if ($allResultsHaveNoTime) {
            $this->calculatePolePositionBySubmissionOrder($qualifier, $results);

            return;
        }

        // Separate results into two groups: valid times and DNF/no time
        $validResults = [];
        $invalidResults = [];

        foreach ($results as $result) {
            if ($result->dnf() || $result->fastestLap()->isNull()) {
                $invalidResults[] = $result;
            } else {
                $validResults[] = $result;
            }
        }

        // Sort valid results by fastest_lap ascending (fastest time wins)
        usort($validResults, function ($a, $b) {
            $timeA = $a->fastestLap()->toMilliseconds();
            $timeB = $b->fastestLap()->toMilliseconds();

            if ($timeA === null && $timeB === null) {
                return 0;
            }
            if ($timeA === null) {
                return 1;
            }
            if ($timeB === null) {
                return -1;
            }

            return $timeA <=> $timeB;
        });

        // Get pole position bonus points configuration
        $polePoints = $qualifier->qualifyingPole() ?? 0;
        $poleTop10Only = $qualifier->qualifyingPoleTop10();

        // Update positions and points for valid results
        $position = 1;
        foreach ($validResults as $result) {
            $hasPole = ($position === 1);

            // Award pole points conditionally:
            // - Pole position holder gets hasPole flag set
            // - If qualifying_pole_top_10 is true, points are NOT awarded here
            //   (they will be awarded when the race completes if driver finishes top 10)
            // - If qualifying_pole_top_10 is false, award points immediately
            $points = 0;
            if ($hasPole && $polePoints > 0 && ! $poleTop10Only) {
                $points = $polePoints;
            }

            // Update position, hasPole flag
            $result->update(
                position: $position,
                originalRaceTime: $result->originalRaceTime()->value(),
                originalRaceTimeDifference: $result->originalRaceTimeDifference()->value(),
                fastestLap: $result->fastestLap()->value(),
                penalties: $result->penalties()->value(),
                hasFastestLap: $result->hasFastestLap(),
                hasPole: $hasPole,
                dnf: $result->dnf(),
            );

            // Set race points
            $result->setRacePoints($points);

            $this->raceResultRepository->save($result);
            $position++;
        }

        // Update DNF/no time results - place at the end
        foreach ($invalidResults as $result) {
            $result->update(
                position: $position,
                originalRaceTime: $result->originalRaceTime()->value(),
                originalRaceTimeDifference: $result->originalRaceTimeDifference()->value(),
                fastestLap: $result->fastestLap()->value(),
                penalties: $result->penalties()->value(),
                hasFastestLap: false,
                hasPole: false,
                dnf: $result->dnf(),
            );

            // DNF/no time gets 0 points
            $result->setRacePoints(0);

            $this->raceResultRepository->save($result);
            $position++;
        }
    }

    /**
     * Calculate pole position based on submission order when all results have no fastest_lap data.
     * This is a fallback mechanism - the first driver submitted gets P1 (pole position).
     *
     * @param  array<\App\Domain\Competition\Entities\RaceResult>  $results
     */
    private function calculatePolePositionBySubmissionOrder(Race $qualifier, array $results): void
    {
        // Sort by ID (which reflects submission order from the form)
        usort($results, function ($a, $b) {
            return $a->id() <=> $b->id();
        });

        // Get pole position bonus points configuration
        $polePoints = $qualifier->qualifyingPole() ?? 0;
        $poleTop10Only = $qualifier->qualifyingPoleTop10();

        // Assign positions based on submission order
        $position = 1;
        foreach ($results as $result) {
            $hasPole = ($position === 1);

            // Award pole points conditionally:
            // - Pole position holder gets hasPole flag set
            // - If qualifying_pole_top_10 is true, points are NOT awarded here
            //   (they will be awarded when the race completes if driver finishes top 10)
            // - If qualifying_pole_top_10 is false, award points immediately
            $points = 0;
            if ($hasPole && $polePoints > 0 && ! $poleTop10Only) {
                $points = $polePoints;
            }

            // Update position and hasPole flag
            $result->update(
                position: $position,
                originalRaceTime: $result->originalRaceTime()->value(),
                originalRaceTimeDifference: $result->originalRaceTimeDifference()->value(),
                fastestLap: $result->fastestLap()->value(),
                penalties: $result->penalties()->value(),
                hasFastestLap: false,
                hasPole: $hasPole,
                dnf: $result->dnf(),
            );

            // Set race points
            $result->setRacePoints($points);

            $this->raceResultRepository->save($result);
            $position++;
        }
    }

    /**
     * Log qualifier creation activity.
     */
    private function logQualifierCreated(int $qualifierId, int $userId): void
    {
        try {
            /** @var UserEloquent|null $user */
            $user = UserEloquent::find($userId);
            if ($user === null) {
                return;
            }

            /** @var RaceModel $qualifier */
            $qualifier = RaceModel::findOrFail($qualifierId);
            $this->activityLogService->logRaceCreated($user, $qualifier);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to log qualifier creation activity', [
                'error' => $e->getMessage(),
                'qualifier_id' => $qualifierId,
            ]);
        }
    }

    /**
     * Log qualifier update activity.
     *
     * @param  array<string, mixed>  $originalData
     * @param  array<string, mixed>  $newData
     */
    private function logQualifierUpdated(int $qualifierId, int $userId, array $originalData, array $newData): void
    {
        try {
            /** @var UserEloquent|null $user */
            $user = UserEloquent::find($userId);
            if ($user === null) {
                return;
            }

            /** @var RaceModel $qualifier */
            $qualifier = RaceModel::findOrFail($qualifierId);
            $this->activityLogService->logRaceUpdated($user, $qualifier, [
                'old' => $originalData,
                'new' => $newData,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to log qualifier update activity', [
                'error' => $e->getMessage(),
                'qualifier_id' => $qualifierId,
            ]);
        }
    }
}
