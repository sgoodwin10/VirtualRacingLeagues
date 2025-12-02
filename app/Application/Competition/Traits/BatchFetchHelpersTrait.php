<?php

declare(strict_types=1);

namespace App\Application\Competition\Traits;

use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;

/**
 * Trait BatchFetchHelpersTrait
 *
 * Provides batch fetch helper methods to avoid N+1 queries
 * when fetching driver names and division names.
 */
trait BatchFetchHelpersTrait
{
    /**
     * Batch fetch driver names for multiple season driver IDs to avoid N+1 queries.
     *
     * @param array<int> $seasonDriverIds
     * @return array<int, string> Map of season driver ID => driver name
     */
    private function batchFetchDriverNames(array $seasonDriverIds): array
    {
        if (empty($seasonDriverIds)) {
            return [];
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, SeasonDriverEloquent> $seasonDrivers */
        $seasonDrivers = SeasonDriverEloquent::with(
            'leagueDriver.driver'
        )->whereIn('id', $seasonDriverIds)->get();

        $driverNames = [];
        foreach ($seasonDrivers as $seasonDriver) {
            // @phpstan-ignore-next-line (nullCoalesce.expr is safe due to optional chaining)
            $driverNames[$seasonDriver->id] = $seasonDriver->leagueDriver?->driver?->name ?? 'Unknown Driver';
        }

        return $driverNames;
    }

    /**
     * Batch fetch division names for multiple division IDs to avoid N+1 queries.
     *
     * @param array<int> $divisionIds
     * @return array<int, string> Map of division ID => division name
     */
    private function batchFetchDivisionNames(array $divisionIds): array
    {
        if (empty($divisionIds)) {
            return [];
        }

        // Batch fetch divisions
        // @phpstan-ignore-next-line Eloquent dynamic method
        $divisions = Division::whereIn('id', $divisionIds)->get();

        $divisionNames = [];
        /** @var Division $division */
        foreach ($divisions as $division) {
            $divisionNames[$division->id] = $division->name ?? 'Unknown Division';
        }

        return $divisionNames;
    }
}
