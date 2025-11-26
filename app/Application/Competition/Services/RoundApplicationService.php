<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateRoundData;
use App\Application\Competition\DTOs\UpdateRoundData;
use App\Application\Competition\DTOs\RoundData;
use App\Domain\Competition\Entities\Round;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use DateTimeImmutable;

/**
 * Application service for Round use cases.
 * Orchestrates round CRUD operations, manages transactions, dispatches events.
 */
final class RoundApplicationService
{
    public function __construct(
        private readonly RoundRepositoryInterface $roundRepository,
        private readonly RaceRepositoryInterface $raceRepository,
        private readonly RaceResultRepositoryInterface $raceResultRepository,
    ) {
    }

    /**
     * Create a new round.
     */
    public function createRound(
        CreateRoundData $data,
        int $seasonId,
        string $timezone,
        int $userId,
    ): RoundData {
        return DB::transaction(function () use ($data, $seasonId, $timezone, $userId) {
            // Generate slug
            $slug = RoundSlug::fromName($data->name, $data->round_number);
            $uniqueSlug = RoundSlug::from(
                $this->roundRepository->generateUniqueSlug($slug->value(), $seasonId)
            );

            // Create entity
            $round = Round::create(
                seasonId: $seasonId,
                roundNumber: RoundNumber::from($data->round_number),
                name: $data->name ? RoundName::from($data->name) : null,
                slug: $uniqueSlug,
                scheduledAt: $data->scheduled_at ? new DateTimeImmutable($data->scheduled_at) : null,
                timezone: $timezone,
                platformTrackId: $data->platform_track_id,
                trackLayout: $data->track_layout,
                trackConditions: $data->track_conditions,
                technicalNotes: $data->technical_notes,
                streamUrl: $data->stream_url,
                internalNotes: $data->internal_notes,
                fastestLap: $data->fastest_lap,
                fastestLapTop10: $data->fastest_lap_top_10,
                qualifyingPole: $data->qualifying_pole,
                qualifyingPoleTop10: $data->qualifying_pole_top_10,
                pointsSystem: $data->points_system ? PointsSystem::fromJson($data->points_system) : null,
                roundPoints: $data->round_points,
                createdByUserId: $userId,
            );

            // Save (sets ID)
            $this->roundRepository->save($round);

            // Record creation event (now has ID)
            $round->recordCreationEvent();

            // Dispatch events
            $this->dispatchEvents($round);

            return RoundData::fromEntity($round);
        });
    }

    /**
     * Update an existing round.
     *
     * @param array<string, mixed> $requestData Raw request data to check field presence
     */
    public function updateRound(int $roundId, UpdateRoundData $data, array $requestData = []): RoundData
    {
        return DB::transaction(function () use ($roundId, $data, $requestData) {
            $round = $this->roundRepository->findById($roundId);

            // Determine round number (use existing if not provided)
            $roundNumber = $data->round_number !== null
                ? $data->round_number
                : $round->roundNumber()->value();

            // Generate slug if name changed
            $slug = $data->name !== null
                ? RoundSlug::fromName($data->name, $roundNumber)
                : $round->slug();

            $uniqueSlug = RoundSlug::from(
                $this->roundRepository->generateUniqueSlug(
                    $slug->value(),
                    $round->seasonId(),
                    $roundId
                )
            );

            // Determine scheduled_at: if field provided in request, update it (even to null); otherwise keep existing
            $scheduledAt = $round->scheduledAt();
            if (array_key_exists('scheduled_at', $requestData)) {
                $scheduledAt = $data->scheduled_at ? new DateTimeImmutable($data->scheduled_at) : null;
            }

            // Determine fastest_lap and fastest_lap_top_10: if field provided in request, update it; otherwise keep existing
            $fastestLap = $round->fastestLap();
            if (array_key_exists('fastest_lap', $requestData)) {
                $fastestLap = $data->fastest_lap;
            }

            $fastestLapTop10 = $round->fastestLapTop10();
            if (array_key_exists('fastest_lap_top_10', $requestData)) {
                $fastestLapTop10 = $data->fastest_lap_top_10 ?? false;
            }

            // Determine qualifying_pole and qualifying_pole_top_10: if field provided in request, update it; otherwise keep existing
            $qualifyingPole = $round->qualifyingPole();
            if (array_key_exists('qualifying_pole', $requestData)) {
                $qualifyingPole = $data->qualifying_pole;
            }

            $qualifyingPoleTop10 = $round->qualifyingPoleTop10();
            if (array_key_exists('qualifying_pole_top_10', $requestData)) {
                $qualifyingPoleTop10 = $data->qualifying_pole_top_10 ?? false;
            }

            // Determine nullable string fields: if field provided in request, update it (even to null); otherwise keep existing
            $name = array_key_exists('name', $requestData)
                ? ($data->name !== null ? RoundName::from($data->name) : null)
                : $round->name();

            $trackLayout = array_key_exists('track_layout', $requestData)
                ? $data->track_layout
                : $round->trackLayout();

            $trackConditions = array_key_exists('track_conditions', $requestData)
                ? $data->track_conditions
                : $round->trackConditions();

            $technicalNotes = array_key_exists('technical_notes', $requestData)
                ? $data->technical_notes
                : $round->technicalNotes();

            $streamUrl = array_key_exists('stream_url', $requestData)
                ? $data->stream_url
                : $round->streamUrl();

            $internalNotes = array_key_exists('internal_notes', $requestData)
                ? $data->internal_notes
                : $round->internalNotes();

            // Determine points_system: if field provided in request, update it (even to null); otherwise keep existing
            $pointsSystem = $round->pointsSystem();
            if (array_key_exists('points_system', $requestData)) {
                $pointsSystem = $data->points_system ? PointsSystem::fromJson($data->points_system) : null;
            }

            // Determine round_points: if field provided in request, update it; otherwise keep existing
            $roundPoints = $round->roundPoints();
            if (array_key_exists('round_points', $requestData)) {
                $roundPoints = $data->round_points ?? false;
            }

            $round->updateDetails(
                roundNumber: $data->round_number !== null
                    ? RoundNumber::from($data->round_number)
                    : $round->roundNumber(),
                name: $name,
                slug: $uniqueSlug,
                scheduledAt: $scheduledAt,
                platformTrackId: $data->platform_track_id ?? $round->platformTrackId(),
                trackLayout: $trackLayout,
                trackConditions: $trackConditions,
                technicalNotes: $technicalNotes,
                streamUrl: $streamUrl,
                internalNotes: $internalNotes,
                fastestLap: $fastestLap,
                fastestLapTop10: $fastestLapTop10,
                qualifyingPole: $qualifyingPole,
                qualifyingPoleTop10: $qualifyingPoleTop10,
                pointsSystem: $pointsSystem,
                roundPoints: $roundPoints,
            );

            $this->roundRepository->save($round);
            $this->dispatchEvents($round);

            return RoundData::fromEntity($round);
        });
    }

    /**
     * Get a single round.
     */
    public function getRound(int $roundId): RoundData
    {
        $round = $this->roundRepository->findById($roundId);
        return RoundData::fromEntity($round);
    }

    /**
     * Get all rounds for a season.
     *
     * @return array<RoundData>
     */
    public function getRoundsBySeason(int $seasonId): array
    {
        $rounds = $this->roundRepository->findBySeasonId($seasonId);
        return array_map(
            fn(Round $round) => RoundData::fromEntity($round),
            $rounds
        );
    }

    /**
     * Delete a round (soft delete).
     */
    public function deleteRound(int $roundId): void
    {
        DB::transaction(function () use ($roundId) {
            $round = $this->roundRepository->findById($roundId);
            $round->delete();
            $this->roundRepository->delete($round);
            $this->dispatchEvents($round);
        });
    }

    /**
     * Change round status.
     */
    public function changeRoundStatus(int $roundId, string $status): RoundData
    {
        return DB::transaction(function () use ($roundId, $status) {
            $round = $this->roundRepository->findById($roundId);
            $round->changeStatus(RoundStatus::from($status));
            $this->roundRepository->save($round);
            $this->dispatchEvents($round);
            return RoundData::fromEntity($round);
        });
    }

    /**
     * Get the next round number for a season.
     */
    public function getNextRoundNumber(int $seasonId): int
    {
        return $this->roundRepository->getNextRoundNumber($seasonId);
    }

    /**
     * Mark round as completed.
     * Also marks all associated races and race results as completed/confirmed.
     */
    public function completeRound(int $roundId): RoundData
    {
        return DB::transaction(function () use ($roundId) {
            // Mark round as completed
            $round = $this->roundRepository->findById($roundId);
            $round->complete();
            $this->roundRepository->save($round);
            $this->dispatchEvents($round);

            // Cascade completion to all races (including qualifiers)
            $races = $this->raceRepository->findAllByRoundId($roundId);
            foreach ($races as $race) {
                // Mark race as completed
                $race->markAsCompleted();
                $this->raceRepository->save($race);

                // Mark all race results as confirmed
                $raceId = $race->id();
                if ($raceId !== null) {
                    $raceResults = $this->raceResultRepository->findByRaceId($raceId);
                    foreach ($raceResults as $result) {
                        if ($result->status() !== RaceResultStatus::CONFIRMED) {
                            $result->updateStatus(RaceResultStatus::CONFIRMED);
                            $this->raceResultRepository->save($result);
                        }
                    }
                }
            }

            return RoundData::fromEntity($round);
        });
    }

    /**
     * Mark round as not completed (scheduled).
     * Does NOT affect associated races or race results - only changes round status.
     */
    public function uncompleteRound(int $roundId): RoundData
    {
        return DB::transaction(function () use ($roundId) {
            $round = $this->roundRepository->findById($roundId);
            $round->uncomplete();
            $this->roundRepository->save($round);
            $this->dispatchEvents($round);
            return RoundData::fromEntity($round);
        });
    }

    /**
     * Dispatch all recorded domain events.
     */
    private function dispatchEvents(Round $round): void
    {
        foreach ($round->releaseEvents() as $event) {
            Event::dispatch($event);
        }
    }
}
