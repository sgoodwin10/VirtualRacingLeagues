<?php

declare(strict_types=1);

namespace App\Domain\Competition\Services;

use App\Domain\Competition\ValueObjects\TiebreakerRuleConfiguration;
use App\Domain\Competition\ValueObjects\TiebreakerRuleSlug;
use App\Domain\Competition\ValueObjects\TiebreakerResolution;
use App\Domain\Competition\ValueObjects\TiebreakerInformation;

/**
 * Round Tiebreaker Domain Service.
 *
 * Contains the core business logic for resolving ties in round totals.
 * This is a stateless domain service - no Laravel dependencies.
 *
 * Key Business Rules:
 * 1. Rules are applied sequentially in order
 * 2. Qualifying races are EXCLUDED from "Best Result from All Races" rule
 * 3. Ties are only resolved when enabled in season configuration
 * 4. If no rule breaks a tie, drivers share position (Mode 1 behavior)
 */
final class RoundTiebreakerDomainService
{
    /**
     * Resolve ties in standings using tiebreaker rules.
     *
     * @param array<mixed> $standings Current standings with tied drivers
     * @param TiebreakerRuleConfiguration $ruleConfig Ordered tiebreaker rules
     * @param array<array{race: object, result: object}> $allRaceResults All race results for context
     * @return array{standings: array<mixed>, tiebreakerInfo: TiebreakerInformation}
     */
    public function resolveTies(
        array $standings,
        TiebreakerRuleConfiguration $ruleConfig,
        array $allRaceResults
    ): array {
        if ($ruleConfig->isEmpty()) {
            return [
                'standings' => $standings,
                'tiebreakerInfo' => TiebreakerInformation::empty(),
            ];
        }

        $resolutions = [];
        $appliedRules = [];
        $hadUnresolvedTies = false;

        // Group drivers by total points to find ties
        $pointsGroups = $this->groupDriversByPoints($standings);

        // Process each group of tied drivers
        foreach ($pointsGroups as $points => $group) {
            if (count($group) === 1) {
                continue; // No tie, skip
            }

            // Try to resolve this tie using rules in order
            $resolution = $this->resolveSingleTie($group, $ruleConfig, $allRaceResults);

            if ($resolution !== null) {
                $resolutions[] = $resolution;

                $ruleSlug = $resolution->ruleSlug();
                if (!in_array($ruleSlug, $appliedRules, true)) {
                    $appliedRules[] = $ruleSlug;
                }

                if (!$resolution->wasResolved()) {
                    $hadUnresolvedTies = true;
                }
            }
        }

        // Apply resolutions to standings (update positions)
        $standings = $this->applyResolutionsToStandings($standings, $resolutions);

        $tiebreakerInfo = new TiebreakerInformation(
            resolutions: $resolutions,
            appliedRules: $appliedRules,
            hadUnresolvedTies: $hadUnresolvedTies,
        );

        return [
            'standings' => $standings,
            'tiebreakerInfo' => $tiebreakerInfo,
        ];
    }

    /**
     * Group drivers by their total points.
     *
     * @param array<mixed> $standings
     * @return array<int, array<mixed>>
     */
    private function groupDriversByPoints(array $standings): array
    {
        $groups = [];

        foreach ($standings as $standing) {
            $points = $standing['total_points'] ?? 0;
            if (!isset($groups[$points])) {
                $groups[$points] = [];
            }
            $groups[$points][] = $standing;
        }

        return $groups;
    }

    /**
     * Attempt to resolve a single tie using rules in order.
     *
     * @param array<mixed> $tiedDrivers
     * @param TiebreakerRuleConfiguration $ruleConfig
     * @param array<array{race: object, result: object}> $allRaceResults
     * @return TiebreakerResolution|null
     */
    private function resolveSingleTie(
        array $tiedDrivers,
        TiebreakerRuleConfiguration $ruleConfig,
        array $allRaceResults
    ): ?TiebreakerResolution {
        $driverIds = array_column($tiedDrivers, 'driver_id');

        // Try each rule in order
        foreach ($ruleConfig->rules() as $ruleRef) {
            $ruleSlug = $ruleRef->slug();

            $winner = null;
            $explanation = '';

            if ($ruleSlug->isHighestQualifyingPosition()) {
                $result = $this->applyHighestQualifyingRule($driverIds, $allRaceResults);
                $winner = $result['winner'];
                $explanation = $result['explanation'];
            } elseif ($ruleSlug->isRace1BestResult()) {
                $result = $this->applyRace1BestResultRule($driverIds, $allRaceResults);
                $winner = $result['winner'];
                $explanation = $result['explanation'];
            } elseif ($ruleSlug->isBestResultAllRaces()) {
                $result = $this->applyBestResultAllRacesRule($driverIds, $allRaceResults);
                $winner = $result['winner'];
                $explanation = $result['explanation'];
            }

            // If a winner was found, return resolution
            if ($winner !== null) {
                return new TiebreakerResolution(
                    driverIds: $driverIds,
                    ruleSlug: $ruleSlug->value(),
                    winnerId: $winner,
                    explanation: $explanation,
                );
            }
        }

        // No rule could break the tie
        return new TiebreakerResolution(
            driverIds: $driverIds,
            ruleSlug: 'unresolved',
            winnerId: null,
            explanation: 'No tiebreaker rule could resolve this tie',
        );
    }

    /**
     * Apply highest qualifying position rule.
     * Driver with the best (lowest) qualifying position wins.
     *
     * @param array<int> $driverIds
     * @param array<array{race: object, result: object}> $allRaceResults
     * @return array{winner: int|null, explanation: string}
     */
    private function applyHighestQualifyingRule(array $driverIds, array $allRaceResults): array
    {
        $qualifyingPositions = [];

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];

            // Only consider qualifying races
            if (!$race->isQualifier()) {
                continue;
            }

            $driverId = $result->driverId();
            if (!in_array($driverId, $driverIds, true)) {
                continue;
            }

            $position = $result->position();
            if ($position !== null) {
                if (!isset($qualifyingPositions[$driverId]) || $position < $qualifyingPositions[$driverId]) {
                    $qualifyingPositions[$driverId] = $position;
                }
            }
        }

        if (empty($qualifyingPositions)) {
            return [
                'winner' => null,
                'explanation' => 'No qualifying positions available',
            ];
        }

        // Find driver with lowest (best) position
        $bestPosition = min($qualifyingPositions);
        $winners = array_keys($qualifyingPositions, $bestPosition, true);

        if (count($winners) > 1) {
            return [
                'winner' => null,
                'explanation' => 'Multiple drivers tied with qualifying position ' . $bestPosition,
            ];
        }

        return [
            'winner' => $winners[0],
            'explanation' => 'Driver won with qualifying position ' . $bestPosition,
        ];
    }

    /**
     * Apply Race 1 best result rule.
     * Driver with the best finish in Race 1 wins.
     *
     * @param array<int> $driverIds
     * @param array<array{race: object, result: object}> $allRaceResults
     * @return array{winner: int|null, explanation: string}
     */
    private function applyRace1BestResultRule(array $driverIds, array $allRaceResults): array
    {
        $race1Results = [];

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];

            // Only consider Race 1 (non-qualifier with race_number = 1)
            if ($race->isQualifier() || $race->raceNumber() !== 1) {
                continue;
            }

            $driverId = $result->driverId();
            if (!in_array($driverId, $driverIds, true)) {
                continue;
            }

            $position = $result->position();
            if ($position !== null) {
                $race1Results[$driverId] = $position;
            }
        }

        if (empty($race1Results)) {
            return [
                'winner' => null,
                'explanation' => 'No Race 1 results available',
            ];
        }

        // Find driver with lowest (best) position
        $bestPosition = min($race1Results);
        $winners = array_keys($race1Results, $bestPosition, true);

        if (count($winners) > 1) {
            return [
                'winner' => null,
                'explanation' => 'Multiple drivers tied with Race 1 position ' . $bestPosition,
            ];
        }

        return [
            'winner' => $winners[0],
            'explanation' => 'Driver won with Race 1 position ' . $bestPosition,
        ];
    }

    /**
     * Apply best result from all races rule (countback).
     * Compare best finish, then second-best, etc. across all NON-QUALIFIER races.
     * IMPORTANT: Qualifying races are EXCLUDED from this rule.
     *
     * @param array<int> $driverIds
     * @param array<array{race: object, result: object}> $allRaceResults
     * @return array{winner: int|null, explanation: string}
     */
    private function applyBestResultAllRacesRule(array $driverIds, array $allRaceResults): array
    {
        $driverResults = [];

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];

            // CRITICAL: Exclude qualifying races from countback
            if ($race->isQualifier()) {
                continue;
            }

            $driverId = $result->driverId();
            if (!in_array($driverId, $driverIds, true)) {
                continue;
            }

            $position = $result->position();
            if ($position !== null) {
                if (!isset($driverResults[$driverId])) {
                    $driverResults[$driverId] = [];
                }
                $driverResults[$driverId][] = $position;
            }
        }

        if (empty($driverResults)) {
            return [
                'winner' => null,
                'explanation' => 'No race results available for countback',
            ];
        }

        // Sort each driver's results (best first)
        foreach ($driverResults as &$results) {
            sort($results);
        }
        unset($results);

        // Perform countback comparison
        $maxResults = max(array_map('count', $driverResults));

        for ($i = 0; $i < $maxResults; $i++) {
            $compareResults = [];
            foreach ($driverIds as $driverId) {
                if (isset($driverResults[$driverId][$i])) {
                    $compareResults[$driverId] = $driverResults[$driverId][$i];
                }
            }

            if (empty($compareResults)) {
                break;
            }

            // Find best position at this index
            $bestPosition = min($compareResults);
            $winners = array_keys($compareResults, $bestPosition, true);

            if (count($winners) === 1) {
                $place = $i + 1;
                $ordinal = $this->getOrdinalSuffix($place);
                return [
                    'winner' => $winners[0],
                    'explanation' => "Driver won on {$place}{$ordinal} best result (P{$bestPosition})",
                ];
            }

            // If still tied, continue to next comparison
            $driverIds = $winners; // Narrow down for next iteration
        }

        return [
            'winner' => null,
            'explanation' => 'Drivers remain tied after countback through all results',
        ];
    }

    /**
     * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.).
     */
    private function getOrdinalSuffix(int $number): string
    {
        if ($number % 100 >= 11 && $number % 100 <= 13) {
            return 'th';
        }

        return match ($number % 10) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            default => 'th',
        };
    }

    /**
     * Apply resolutions to standings (update positions).
     * When ties are broken, positions are updated accordingly.
     *
     * @param array<mixed> $standings
     * @param array<TiebreakerResolution> $resolutions
     * @return array<mixed>
     */
    private function applyResolutionsToStandings(array $standings, array $resolutions): array
    {
        // Build a map of driver ID => resolution winner ID
        $resolutionMap = [];
        foreach ($resolutions as $resolution) {
            if ($resolution->wasResolved()) {
                foreach ($resolution->driverIds() as $driverId) {
                    $resolutionMap[$driverId] = $resolution->winnerId();
                }
            }
        }

        // Sort standings by points (desc), then by tiebreaker winner status
        usort($standings, function ($a, $b) use ($resolutionMap) {
            $pointsA = $a['total_points'] ?? 0;
            $pointsB = $b['total_points'] ?? 0;

            // Primary sort: by points
            if ($pointsA !== $pointsB) {
                return $pointsB <=> $pointsA;
            }

            // Secondary sort: if tied, winner comes first
            $driverIdA = $a['driver_id'];
            $driverIdB = $b['driver_id'];

            $isAWinner = isset($resolutionMap[$driverIdA]) && $resolutionMap[$driverIdA] === $driverIdA;
            $isBWinner = isset($resolutionMap[$driverIdB]) && $resolutionMap[$driverIdB] === $driverIdB;

            if ($isAWinner && !$isBWinner) {
                return -1;
            }
            if (!$isAWinner && $isBWinner) {
                return 1;
            }

            return 0; // Still tied
        });

        // Re-assign positions
        $position = 1;
        foreach ($standings as &$standing) {
            $standing['position'] = $position++;
        }
        unset($standing);

        return $standings;
    }
}
