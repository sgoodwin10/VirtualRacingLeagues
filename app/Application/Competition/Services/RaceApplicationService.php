<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateRaceData;
use App\Application\Competition\DTOs\RaceData;
use App\Application\Competition\DTOs\UpdateRaceData;
use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Exceptions\RaceNotFoundException;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\ValueObjects\GridSource;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceLengthType;
use App\Domain\Competition\ValueObjects\RaceName;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Domain\Competition\ValueObjects\RaceStatus;
use App\Domain\Competition\ValueObjects\RaceType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Spatie\LaravelData\Optional;

final class RaceApplicationService
{
    public function __construct(
        private readonly RaceRepositoryInterface $raceRepository,
        private readonly RaceResultRepositoryInterface $raceResultRepository,
        private readonly RoundRepositoryInterface $roundRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
    ) {
    }

    public function createRace(CreateRaceData $data, int $roundId): RaceData
    {
        return DB::transaction(function () use ($data, $roundId) {
            // Auto-increment race_number if not provided (excluding qualifiers with race_number = 0)
            $raceNumber = $data->race_number ?? $this->raceRepository->getNextRaceNumber($roundId);

            // Detect if this is a qualifier (race_number === 0)
            $isQualifier = $raceNumber === 0;

            // Apply defaults
            $qualifyingFormat = $data->qualifying_format ?? 'none';
            $gridSource = $data->grid_source ?? 'manual';
            $lengthType = $data->length_type ?? 'laps';
            $lengthValue = $data->length_value ?? 20;
            $extraLapAfterTime = $data->extra_lap_after_time ?? false;
            $trackLimitsEnforced = $data->track_limits_enforced ?? false;
            $falseStartDetection = $data->false_start_detection ?? false;
            $collisionPenalties = $data->collision_penalties ?? false;
            $mandatoryPitStop = $data->mandatory_pit_stop ?? false;
            $pointsSystem = $data->points_system ?? [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
            $dnfPoints = $data->dnf_points ?? 0;
            $dnsPoints = $data->dns_points ?? 0;
            $racePoints = $data->race_points ?? false;
            $fastestLap = $data->fastest_lap ?? null;
            $fastestLapTop10 = $data->fastest_lap_top_10 ?? false;
            $qualifyingPole = $data->qualifying_pole ?? null;
            $qualifyingPoleTop10 = $data->qualifying_pole_top_10 ?? false;

            if ($isQualifier) {
                // Validate qualifying_format is not 'none' for qualifiers
                if ($qualifyingFormat === 'none') {
                    throw new \InvalidArgumentException('Qualifiers must have a qualifying format (cannot be "none")');
                }

                // Validate qualifying_length is required for qualifiers
                if ($data->qualifying_length === null || $data->qualifying_length < 1) {
                    throw new \InvalidArgumentException('Qualifiers must have a valid qualifying length');
                }

                // Create qualifier using the dedicated factory method
                // Note: Penalty fields are NOT passed from user input for qualifiers - they get safe defaults
                $race = Race::createQualifier(
                    roundId: $roundId,
                    name: $data->name !== null ? RaceName::from($data->name) : null,
                    qualifyingFormat: QualifyingFormat::from($qualifyingFormat),
                    qualifyingLength: $data->qualifying_length,
                    qualifyingTire: $data->qualifying_tire,
                    weather: $data->weather,
                    tireRestrictions: $data->tire_restrictions,
                    fuelUsage: $data->fuel_usage,
                    damageModel: $data->damage_model,
                    assistsRestrictions: $data->assists_restrictions,
                    qualifyingPole: $qualifyingPole,
                    qualifyingPoleTop10: $qualifyingPoleTop10,
                    raceNotes: $data->race_notes,
                );
            } else {
                // Create regular race
                $race = Race::create(
                    roundId: $roundId,
                    raceNumber: $raceNumber,
                    name: $data->name !== null ? RaceName::from($data->name) : null,
                    type: $data->race_type !== null ? RaceType::from($data->race_type) : null,
                    qualifyingFormat: QualifyingFormat::from($qualifyingFormat),
                    qualifyingLength: $data->qualifying_length,
                    qualifyingTire: $data->qualifying_tire,
                    gridSource: GridSource::from($gridSource),
                    gridSourceRaceId: $data->grid_source_race_id,
                    lengthType: RaceLengthType::from($lengthType),
                    lengthValue: $lengthValue,
                    extraLapAfterTime: $extraLapAfterTime,
                    weather: $data->weather,
                    tireRestrictions: $data->tire_restrictions,
                    fuelUsage: $data->fuel_usage,
                    damageModel: $data->damage_model,
                    trackLimitsEnforced: $trackLimitsEnforced,
                    falseStartDetection: $falseStartDetection,
                    collisionPenalties: $collisionPenalties,
                    mandatoryPitStop: $mandatoryPitStop,
                    minimumPitTime: $data->minimum_pit_time,
                    assistsRestrictions: $data->assists_restrictions,
                    fastestLap: $fastestLap,
                    fastestLapTop10: $fastestLapTop10,
                    qualifyingPole: $qualifyingPole,
                    qualifyingPoleTop10: $qualifyingPoleTop10,
                    pointsSystem: PointsSystem::from($pointsSystem),
                    dnfPoints: $dnfPoints,
                    dnsPoints: $dnsPoints,
                    racePoints: $racePoints,
                    raceNotes: $data->race_notes,
                );
            }

            $this->raceRepository->save($race);
            $this->dispatchEvents($race);

            return RaceData::fromEntity($race);
        });
    }

    public function updateRace(int $raceId, UpdateRaceData $data): RaceData
    {
        return DB::transaction(function () use ($raceId, $data) {
            $race = $this->raceRepository->findById($raceId);

            // Handle status change if provided
            $statusChanged = false;
            $oldStatus = $race->status();
            $newStatus = null;

            if (!($data->status instanceof Optional) && $data->status !== null) {
                $newStatus = RaceStatus::from($data->status);
                if ($oldStatus !== $newStatus) {
                    $statusChanged = true;
                    if ($newStatus === RaceStatus::COMPLETED) {
                        $race->markAsCompleted();
                    } elseif ($newStatus === RaceStatus::SCHEDULED) {
                        $race->markAsScheduled();
                    }
                }
            }

            // Check if this is a qualifier
            if ($race->isQualifier()) {
                // Use qualifier-specific update method
                $name = !($data->name instanceof Optional)
                    ? ($data->name !== null ? RaceName::from($data->name) : null)
                    : $race->name();

                $qualifyingFormat = !($data->qualifying_format instanceof Optional)
                    ? ($data->qualifying_format !== null
                        ? QualifyingFormat::from($data->qualifying_format)
                        : $race->qualifyingFormat())
                    : $race->qualifyingFormat();

                $qualifyingLength = !($data->qualifying_length instanceof Optional)
                    ? ($data->qualifying_length ?? $race->qualifyingLength())
                    : $race->qualifyingLength();

                // Validate qualifying_length for qualifiers
                if ($qualifyingLength === null || $qualifyingLength < 1) {
                    throw new \InvalidArgumentException('Qualifiers must have a valid qualifying length');
                }

                $qualifyingTire = !($data->qualifying_tire instanceof Optional)
                    ? $data->qualifying_tire
                    : $race->qualifyingTire();

                $weather = !($data->weather instanceof Optional)
                    ? $data->weather
                    : $race->weather();

                $tireRestrictions = !($data->tire_restrictions instanceof Optional)
                    ? $data->tire_restrictions
                    : $race->tireRestrictions();

                $fuelUsage = !($data->fuel_usage instanceof Optional)
                    ? $data->fuel_usage
                    : $race->fuelUsage();

                $damageModel = !($data->damage_model instanceof Optional)
                    ? $data->damage_model
                    : $race->damageModel();

                // Penalty fields are not editable for qualifiers - they are ignored

                $assistsRestrictions = !($data->assists_restrictions instanceof Optional)
                    ? $data->assists_restrictions
                    : $race->assistsRestrictions();

                $qualifyingPole = !($data->qualifying_pole instanceof Optional)
                    ? $data->qualifying_pole
                    : $race->qualifyingPole();

                $qualifyingPoleTop10 = !($data->qualifying_pole_top_10 instanceof Optional)
                    ? ($data->qualifying_pole_top_10 ?? $race->qualifyingPoleTop10())
                    : $race->qualifyingPoleTop10();

                $raceNotes = !($data->race_notes instanceof Optional)
                    ? $data->race_notes
                    : $race->raceNotes();

                $race->updateQualifierConfiguration(
                    name: $name,
                    qualifyingFormat: $qualifyingFormat,
                    qualifyingLength: $qualifyingLength,
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
            } else {
                // Use regular race update method
                $name = !($data->name instanceof Optional)
                    ? ($data->name !== null ? RaceName::from($data->name) : null)
                    : $race->name();

                $type = !($data->race_type instanceof Optional)
                    ? ($data->race_type !== null ? RaceType::from($data->race_type) : null)
                    : $race->type();

                $qualifyingFormat = !($data->qualifying_format instanceof Optional)
                    ? ($data->qualifying_format !== null
                        ? QualifyingFormat::from($data->qualifying_format)
                        : $race->qualifyingFormat())
                    : $race->qualifyingFormat();

                $qualifyingLength = !($data->qualifying_length instanceof Optional)
                    ? $data->qualifying_length
                    : $race->qualifyingLength();

                $qualifyingTire = !($data->qualifying_tire instanceof Optional)
                    ? $data->qualifying_tire
                    : $race->qualifyingTire();

                $gridSource = !($data->grid_source instanceof Optional)
                    ? ($data->grid_source !== null ? GridSource::from($data->grid_source) : $race->gridSource())
                    : $race->gridSource();

                $gridSourceRaceId = !($data->grid_source_race_id instanceof Optional)
                    ? $data->grid_source_race_id
                    : $race->gridSourceRaceId();

                $lengthType = !($data->length_type instanceof Optional)
                    ? ($data->length_type !== null ? RaceLengthType::from($data->length_type) : $race->lengthType())
                    : $race->lengthType();

                $lengthValue = !($data->length_value instanceof Optional)
                    ? ($data->length_value ?? $race->lengthValue())
                    : $race->lengthValue();

                $extraLapAfterTime = !($data->extra_lap_after_time instanceof Optional)
                    ? ($data->extra_lap_after_time ?? $race->extraLapAfterTime())
                    : $race->extraLapAfterTime();

                $weather = !($data->weather instanceof Optional)
                    ? $data->weather
                    : $race->weather();

                $tireRestrictions = !($data->tire_restrictions instanceof Optional)
                    ? $data->tire_restrictions
                    : $race->tireRestrictions();

                $fuelUsage = !($data->fuel_usage instanceof Optional)
                    ? $data->fuel_usage
                    : $race->fuelUsage();

                $damageModel = !($data->damage_model instanceof Optional)
                    ? $data->damage_model
                    : $race->damageModel();

                $trackLimitsEnforced = !($data->track_limits_enforced instanceof Optional)
                    ? ($data->track_limits_enforced ?? $race->trackLimitsEnforced())
                    : $race->trackLimitsEnforced();

                $falseStartDetection = !($data->false_start_detection instanceof Optional)
                    ? ($data->false_start_detection ?? $race->falseStartDetection())
                    : $race->falseStartDetection();

                $collisionPenalties = !($data->collision_penalties instanceof Optional)
                    ? ($data->collision_penalties ?? $race->collisionPenalties())
                    : $race->collisionPenalties();

                $mandatoryPitStop = !($data->mandatory_pit_stop instanceof Optional)
                    ? ($data->mandatory_pit_stop ?? $race->mandatoryPitStop())
                    : $race->mandatoryPitStop();

                $minimumPitTime = !($data->minimum_pit_time instanceof Optional)
                    ? $data->minimum_pit_time
                    : $race->minimumPitTime();

                $assistsRestrictions = !($data->assists_restrictions instanceof Optional)
                    ? $data->assists_restrictions
                    : $race->assistsRestrictions();

                $fastestLap = !($data->fastest_lap instanceof Optional)
                    ? $data->fastest_lap
                    : $race->fastestLap();

                $fastestLapTop10 = !($data->fastest_lap_top_10 instanceof Optional)
                    ? ($data->fastest_lap_top_10 ?? $race->fastestLapTop10())
                    : $race->fastestLapTop10();

                $qualifyingPole = !($data->qualifying_pole instanceof Optional)
                    ? $data->qualifying_pole
                    : $race->qualifyingPole();

                $qualifyingPoleTop10 = !($data->qualifying_pole_top_10 instanceof Optional)
                    ? ($data->qualifying_pole_top_10 ?? $race->qualifyingPoleTop10())
                    : $race->qualifyingPoleTop10();

                $pointsSystem = !($data->points_system instanceof Optional)
                    ? ($data->points_system !== null ? PointsSystem::from($data->points_system) : $race->pointsSystem())
                    : $race->pointsSystem();

                $dnfPoints = !($data->dnf_points instanceof Optional)
                    ? ($data->dnf_points ?? $race->dnfPoints())
                    : $race->dnfPoints();

                $dnsPoints = !($data->dns_points instanceof Optional)
                    ? ($data->dns_points ?? $race->dnsPoints())
                    : $race->dnsPoints();

                $racePoints = !($data->race_points instanceof Optional)
                    ? ($data->race_points ?? $race->racePoints())
                    : $race->racePoints();

                $raceNotes = !($data->race_notes instanceof Optional)
                    ? $data->race_notes
                    : $race->raceNotes();

                $race->updateConfiguration(
                    name: $name,
                    type: $type,
                    qualifyingFormat: $qualifyingFormat,
                    qualifyingLength: $qualifyingLength,
                    qualifyingTire: $qualifyingTire,
                    gridSource: $gridSource,
                    gridSourceRaceId: $gridSourceRaceId,
                    lengthType: $lengthType,
                    lengthValue: $lengthValue,
                    extraLapAfterTime: $extraLapAfterTime,
                    weather: $weather,
                    tireRestrictions: $tireRestrictions,
                    fuelUsage: $fuelUsage,
                    damageModel: $damageModel,
                    trackLimitsEnforced: $trackLimitsEnforced,
                    falseStartDetection: $falseStartDetection,
                    collisionPenalties: $collisionPenalties,
                    mandatoryPitStop: $mandatoryPitStop,
                    minimumPitTime: $minimumPitTime,
                    assistsRestrictions: $assistsRestrictions,
                    fastestLap: $fastestLap,
                    fastestLapTop10: $fastestLapTop10,
                    qualifyingPole: $qualifyingPole,
                    qualifyingPoleTop10: $qualifyingPoleTop10,
                    pointsSystem: $pointsSystem,
                    dnfPoints: $dnfPoints,
                    dnsPoints: $dnsPoints,
                    racePoints: $racePoints,
                    raceNotes: $raceNotes,
                );
            }

            $this->raceRepository->save($race);
            $this->dispatchEvents($race);

            // Update RaceResult statuses if race status changed
            if ($statusChanged && $newStatus !== null) {
                $this->updateRaceResultStatuses($raceId, $newStatus);
            }

            return RaceData::fromEntity($race);
        });
    }

    public function getRace(int $raceId): RaceData
    {
        $race = $this->raceRepository->findById($raceId);
        return RaceData::fromEntity($race);
    }

    /**
     * @return array<RaceData>
     */
    public function getRacesByRound(int $roundId): array
    {
        $races = $this->raceRepository->findByRoundId($roundId);
        return array_map(
            fn(Race $race) => RaceData::fromEntity($race),
            $races
        );
    }

    public function deleteRace(int $raceId): void
    {
        DB::transaction(function () use ($raceId) {
            $race = $this->raceRepository->findById($raceId);
            $this->raceRepository->delete($race);
        });
    }

    public function getNextRaceNumber(int $roundId): int
    {
        return $this->raceRepository->getNextRaceNumber($roundId);
    }

    private function dispatchEvents(Race $race): void
    {
        $events = $race->releaseEvents();
        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }

    /**
     * Update all RaceResult statuses when race status changes.
     */
    private function updateRaceResultStatuses(int $raceId, RaceStatus $newRaceStatus): void
    {
        $raceResults = $this->raceResultRepository->findByRaceId($raceId);

        $targetStatus = $newRaceStatus === RaceStatus::COMPLETED
            ? RaceResultStatus::CONFIRMED
            : RaceResultStatus::PENDING;

        foreach ($raceResults as $result) {
            if ($result->status() !== $targetStatus) {
                $result->updateStatus($targetStatus);
                $this->raceResultRepository->save($result);
            }
        }

        // Calculate race points when race is marked as completed
        if ($newRaceStatus === RaceStatus::COMPLETED) {
            $this->calculateRacePoints($raceId);
        }
    }

    /**
     * Calculate and assign race points to all drivers based on their finishing positions.
     * Handles position recalculation, points assignment, DNF/DNS cases, fastest lap bonus, and positions_gained.
     * Even if race_points is disabled, positions and positions_gained are still calculated.
     */
    public function calculateRacePoints(int $raceId): void
    {
        $race = $this->raceRepository->findById($raceId);

        // Get round and season to check if divisions are enabled
        $round = $this->roundRepository->findById($race->roundId());
        $season = $this->seasonRepository->findById($round->seasonId());
        $divisionsEnabled = $season->raceDivisionsEnabled();

        // Get all race results
        $raceResults = $this->raceResultRepository->findByRaceId($raceId);

        // Always calculate positions and positions_gained, regardless of race_points setting
        if ($divisionsEnabled) {
            // Group results by division
            $resultsByDivision = [];
            foreach ($raceResults as $result) {
                $divisionId = $result->divisionId() ?? 0; // Use 0 for null division
                if (!isset($resultsByDivision[$divisionId])) {
                    $resultsByDivision[$divisionId] = [];
                }
                $resultsByDivision[$divisionId][] = $result;
            }

            // Calculate positions and points for each division independently
            foreach ($resultsByDivision as $divisionResults) {
                $this->calculatePointsForResultSet($race, $divisionResults);
            }
        } else {
            // Calculate positions and points for all results together
            $this->calculatePointsForResultSet($race, $raceResults);
        }
    }

    /**
     * Calculate and assign points for a set of race results.
     *
     * @param array<\App\Domain\Competition\Entities\RaceResult> $results
     */
    private function calculatePointsForResultSet(Race $race, array $results): void
    {
        // Get grid source information for positions_gained calculation
        $gridSource = $race->gridSource();
        $gridSourceRaceId = $race->gridSourceRaceId();

        // Fetch grid source results if available (for positions_gained calculation)
        $gridSourceResults = [];
        if ($gridSource->value !== 'manual' && $gridSourceRaceId !== null) {
            $sourceResults = $this->raceResultRepository->findByRaceId($gridSourceRaceId);
            foreach ($sourceResults as $sourceResult) {
                if ($sourceResult->position() !== null) {
                    $gridSourceResults[$sourceResult->driverId()] = $sourceResult->position();
                }
            }
        }

        // Separate DNS, DNF, and finishers
        $finishers = [];
        $dnfDrivers = [];
        $dnsDrivers = [];

        foreach ($results as $result) {
            if ($result->dnf()) {
                $dnfDrivers[] = $result;
            } elseif ($result->originalRaceTime()->isNull()) {
                // DNS = no original_race_time AND not DNF
                $dnsDrivers[] = $result;
            } else {
                $finishers[] = $result;
            }
        }

        // Sort finishers by final race_time ascending (fastest first, including penalties)
        usort($finishers, function ($a, $b) {
            $timeA = $a->finalRaceTime()->toMilliseconds();
            $timeB = $b->finalRaceTime()->toMilliseconds();

            if ($timeA === null && $timeB === null) {
                return 0;
            }
            if ($timeA === null) {
                return 1; // null times go to the end
            }
            if ($timeB === null) {
                return -1;
            }

            return $timeA <=> $timeB;
        });

        // Assign positions and calculate points for finishers
        $position = 1;
        foreach ($finishers as $result) {
            // Only calculate points if race_points is enabled
            $points = $race->racePoints() ? $race->pointsSystem()->getPointsForPosition($position) : 0;
            $result->update(
                position: $position,
                originalRaceTime: $result->originalRaceTime()->value(),
                originalRaceTimeDifference: $result->originalRaceTimeDifference()->value(),
                fastestLap: $result->fastestLap()->value(),
                penalties: $result->penalties()->value(),
                hasFastestLap: false, // Will be updated below for fastest lap winner
                hasPole: $result->hasPole(),
                dnf: false,
            );
            $result->setRacePoints($points);
            $position++;
        }

        // Assign DNF positions and points
        foreach ($dnfDrivers as $result) {
            // Only calculate points if race_points is enabled
            $points = $race->racePoints() ? $race->dnfPoints() : 0;
            $result->update(
                position: $position,
                originalRaceTime: $result->originalRaceTime()->value(),
                originalRaceTimeDifference: $result->originalRaceTimeDifference()->value(),
                fastestLap: $result->fastestLap()->value(),
                penalties: $result->penalties()->value(),
                hasFastestLap: false,
                hasPole: $result->hasPole(),
                dnf: true,
            );
            $result->setRacePoints($points);
            $position++;
        }

        // Assign DNS positions and points
        foreach ($dnsDrivers as $result) {
            // Only calculate points if race_points is enabled
            $points = $race->racePoints() ? $race->dnsPoints() : 0;
            $result->update(
                position: $position,
                originalRaceTime: $result->originalRaceTime()->value(),
                originalRaceTimeDifference: $result->originalRaceTimeDifference()->value(),
                fastestLap: $result->fastestLap()->value(),
                penalties: $result->penalties()->value(),
                hasFastestLap: false,
                hasPole: $result->hasPole(),
                dnf: false,
            );
            $result->setRacePoints($points);
            $position++;
        }

        // Handle fastest lap bonus (only if race_points is enabled)
        if ($race->racePoints() && $race->fastestLap() !== null && $race->fastestLap() > 0) {
            $this->assignFastestLapBonus($race, $finishers);
        }

        // Handle pole position for qualifiers (per division, only if race_points is enabled)
        if ($race->racePoints() && $race->isQualifier()) {
            $this->assignPolePosition($race, $finishers);
        }

        // Calculate positions_gained for all results
        $allResults = array_merge($finishers, $dnfDrivers, $dnsDrivers);
        foreach ($allResults as $result) {
            $positionsGained = null;

            // Only calculate if we have a grid source
            if (!empty($gridSourceResults)) {
                $driverId = $result->driverId();
                $finishPosition = $result->position();
                $startingPosition = $gridSourceResults[$driverId] ?? null;

                if ($startingPosition !== null && $finishPosition !== null) {
                    // Formula: positions_gained = starting_position - finish_position
                    // Positive = gained positions, Negative = lost positions
                    $positionsGained = $startingPosition - $finishPosition;
                }
            }

            $result->setPositionsGained($positionsGained);
        }

        // Save all results
        foreach ($allResults as $result) {
            $this->raceResultRepository->save($result);
        }
    }

    /**
     * Assign fastest lap bonus to the eligible driver with the fastest lap time.
     *
     * @param array<\App\Domain\Competition\Entities\RaceResult> $finishers
     */
    private function assignFastestLapBonus(Race $race, array $finishers): void
    {
        if (empty($finishers)) {
            return;
        }

        // Filter eligible drivers
        $eligible = $finishers;
        if ($race->fastestLapTop10()) {
            // Only top 10 finishers are eligible
            $eligible = array_slice($finishers, 0, 10);
        }

        // Find driver with fastest lap time
        $fastestLapDriver = null;
        $fastestLapTime = null;

        foreach ($eligible as $result) {
            $lapTime = $result->fastestLap()->toMilliseconds();

            if ($lapTime === null) {
                continue; // Skip drivers without fastest lap time
            }

            if ($fastestLapTime === null || $lapTime < $fastestLapTime) {
                $fastestLapTime = $lapTime;
                $fastestLapDriver = $result;
            }
        }

        // Award bonus points to the winner
        if ($fastestLapDriver !== null) {
            $bonusPoints = $race->fastestLap() ?? 0;
            $currentPoints = $fastestLapDriver->racePoints();
            $fastestLapDriver->setRacePoints($currentPoints + $bonusPoints);

            // Update hasFastestLap flag
            $fastestLapDriver->update(
                position: $fastestLapDriver->position(),
                originalRaceTime: $fastestLapDriver->originalRaceTime()->value(),
                originalRaceTimeDifference: $fastestLapDriver->originalRaceTimeDifference()->value(),
                fastestLap: $fastestLapDriver->fastestLap()->value(),
                penalties: $fastestLapDriver->penalties()->value(),
                hasFastestLap: true,
                hasPole: $fastestLapDriver->hasPole(),
                dnf: $fastestLapDriver->dnf(),
            );
        }
    }

    /**
     * Assign pole position to the driver with the fastest lap time in qualifying.
     * This method is called per division when divisions are enabled, so each division
     * gets its own pole position winner.
     *
     * @param array<\App\Domain\Competition\Entities\RaceResult> $finishers
     */
    private function assignPolePosition(Race $race, array $finishers): void
    {
        if (empty($finishers)) {
            return;
        }

        // First, reset hasPole for all finishers in case of recalculation
        foreach ($finishers as $result) {
            if ($result->hasPole()) {
                $result->update(
                    position: $result->position(),
                    originalRaceTime: $result->originalRaceTime()->value(),
                    originalRaceTimeDifference: $result->originalRaceTimeDifference()->value(),
                    fastestLap: $result->fastestLap()->value(),
                    penalties: $result->penalties()->value(),
                    hasFastestLap: $result->hasFastestLap(),
                    hasPole: false,
                    dnf: $result->dnf(),
                );
            }
        }

        // Filter eligible drivers based on qualifying_pole_top_10 setting
        $eligible = $finishers;
        if ($race->qualifyingPoleTop10()) {
            // Only top 10 finishers are eligible for pole position
            $eligible = array_slice($finishers, 0, 10);
        }

        // Find driver with fastest lap time (pole position)
        $poleDriver = null;
        $fastestLapTime = null;

        foreach ($eligible as $result) {
            $lapTime = $result->fastestLap()->toMilliseconds();

            if ($lapTime === null) {
                continue; // Skip drivers without fastest lap time
            }

            if ($fastestLapTime === null || $lapTime < $fastestLapTime) {
                $fastestLapTime = $lapTime;
                $poleDriver = $result;
            }
        }

        // Award pole position to the winner
        if ($poleDriver !== null) {
            // Award pole position bonus points if configured
            $bonusPoints = $race->qualifyingPole() ?? 0;
            if ($bonusPoints > 0) {
                $currentPoints = $poleDriver->racePoints();
                $poleDriver->setRacePoints($currentPoints + $bonusPoints);
            }

            // Update hasPole flag
            $poleDriver->update(
                position: $poleDriver->position(),
                originalRaceTime: $poleDriver->originalRaceTime()->value(),
                originalRaceTimeDifference: $poleDriver->originalRaceTimeDifference()->value(),
                fastestLap: $poleDriver->fastestLap()->value(),
                penalties: $poleDriver->penalties()->value(),
                hasFastestLap: $poleDriver->hasFastestLap(),
                hasPole: true,
                dnf: $poleDriver->dnf(),
            );
        }
    }
}
