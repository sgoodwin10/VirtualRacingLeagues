<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateRaceData;
use App\Application\Competition\DTOs\RaceData;
use App\Application\Competition\DTOs\UpdateRaceData;
use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Exceptions\RaceNotFoundException;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\ValueObjects\GridSource;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceLengthType;
use App\Domain\Competition\ValueObjects\RaceName;
use App\Domain\Competition\ValueObjects\RaceType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Spatie\LaravelData\Optional;

final class RaceApplicationService
{
    public function __construct(
        private readonly RaceRepositoryInterface $raceRepository,
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
            $raceDivisions = $data->race_divisions ?? false;
            $pointsSystem = $data->points_system ?? [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
            $dnfPoints = $data->dnf_points ?? 0;
            $dnsPoints = $data->dns_points ?? 0;

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
                    raceDivisions: $raceDivisions,
                    bonusPoints: $data->bonus_points,
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
                    raceDivisions: $raceDivisions,
                    pointsSystem: PointsSystem::from($pointsSystem),
                    bonusPoints: $data->bonus_points,
                    dnfPoints: $dnfPoints,
                    dnsPoints: $dnsPoints,
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

                $raceDivisions = !($data->race_divisions instanceof Optional)
                    ? ($data->race_divisions ?? $race->raceDivisions())
                    : $race->raceDivisions();

                $bonusPoints = !($data->bonus_points instanceof Optional)
                    ? $data->bonus_points
                    : $race->bonusPoints();

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
                    raceDivisions: $raceDivisions,
                    bonusPoints: $bonusPoints,
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

                $raceDivisions = !($data->race_divisions instanceof Optional)
                    ? ($data->race_divisions ?? $race->raceDivisions())
                    : $race->raceDivisions();

                $pointsSystem = !($data->points_system instanceof Optional)
                    ? ($data->points_system !== null ? PointsSystem::from($data->points_system) : $race->pointsSystem())
                    : $race->pointsSystem();

                $bonusPoints = !($data->bonus_points instanceof Optional)
                    ? $data->bonus_points
                    : $race->bonusPoints();

                $dnfPoints = !($data->dnf_points instanceof Optional)
                    ? ($data->dnf_points ?? $race->dnfPoints())
                    : $race->dnfPoints();

                $dnsPoints = !($data->dns_points instanceof Optional)
                    ? ($data->dns_points ?? $race->dnsPoints())
                    : $race->dnsPoints();

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
                    raceDivisions: $raceDivisions,
                    pointsSystem: $pointsSystem,
                    bonusPoints: $bonusPoints,
                    dnfPoints: $dnfPoints,
                    dnsPoints: $dnsPoints,
                    raceNotes: $raceNotes,
                );
            }

            $this->raceRepository->save($race);
            $this->dispatchEvents($race);

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
}
