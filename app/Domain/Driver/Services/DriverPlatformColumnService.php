<?php

declare(strict_types=1);

namespace App\Domain\Driver\Services;

use App\Domain\Driver\Entities\Driver;

/**
 * Driver Platform Column Service.
 * Domain service responsible for managing platform-specific column configurations.
 */
final class DriverPlatformColumnService
{
    /**
     * Platform-to-field mappings.
     * Maps platform IDs to their associated driver fields with metadata.
     *
     * @var array<int, array<int, array{field: string, label: string, type: string}>>
     */
    private const PLATFORM_FIELD_MAPPINGS = [
        1 => [ // Gran Turismo 7
            ['field' => 'psn_id', 'label' => 'PSN ID', 'type' => 'text'],
            ['field' => 'gt7_id', 'label' => 'GT7 ID', 'type' => 'text'],
        ],
        2 => [ // iRacing
            ['field' => 'iracing_id', 'label' => 'iRacing ID', 'type' => 'text'],
            ['field' => 'iracing_customer_id', 'label' => 'iRacing Customer ID', 'type' => 'number'],
        ],
        3 => [], // Assetto Corsa Competizione - No fields yet
        4 => [], // rFactor 2 - No fields yet
        5 => [], // Automobilista 2 - No fields yet
        6 => [], // F1 24 - No fields yet
    ];

    /**
     * Get column configurations for a league's platforms.
     *
     * @param array<int> $platformIds
     * @return array<int, array{field: string, label: string, type: string}>
     */
    public function getColumnsForLeague(array $platformIds): array
    {
        $columns = [];

        foreach ($platformIds as $platformId) {
            if (isset(self::PLATFORM_FIELD_MAPPINGS[$platformId])) {
                $columns = array_merge($columns, self::PLATFORM_FIELD_MAPPINGS[$platformId]);
            }
        }

        return $columns;
    }

    /**
     * Get form field configurations for a league's platforms.
     *
     * @param array<int> $platformIds
     * @return array<int, array{field: string, label: string, type: string}>
     */
    public function getFormFieldsForLeague(array $platformIds): array
    {
        // For now, form fields are identical to columns
        // In the future, this could include additional metadata like validation rules
        return $this->getColumnsForLeague($platformIds);
    }

    /**
     * Get CSV headers for a league's platforms.
     *
     * @param array<int> $platformIds
     * @return array<int, array{field: string, label: string, type: string}>
     */
    public function getCsvHeadersForLeague(array $platformIds): array
    {
        // For now, CSV headers are identical to columns
        // In the future, this could include additional metadata like import transformations
        return $this->getColumnsForLeague($platformIds);
    }

    /**
     * Validate that a driver has at least one platform ID matching the league's platforms.
     *
     * @param Driver $driver
     * @param array<int> $platformIds
     * @return bool
     */
    public function validateDriverPlatformCompatibility(Driver $driver, array $platformIds): bool
    {
        $platformIdentifiers = $driver->platformIds();

        // Get all fields for the league's platforms
        $requiredFields = $this->getColumnsForLeague($platformIds);

        // If no fields are defined for any of the platforms, consider it compatible
        if (empty($requiredFields)) {
            return true;
        }

        // Check if driver has at least one populated field from the required platforms
        foreach ($requiredFields as $fieldConfig) {
            $field = $fieldConfig['field'];

            // Map field names to PlatformIdentifiers methods
            $value = match ($field) {
                'psn_id' => $platformIdentifiers->psnId(),
                'gt7_id' => $platformIdentifiers->gt7Id(),
                'iracing_id' => $platformIdentifiers->iracingId(),
                'iracing_customer_id' => $platformIdentifiers->iracingCustomerId(),
                default => null,
            };

            // If this field is populated, driver is compatible
            if ($value !== null) {
                // For string fields, check if not empty after trimming
                if (is_string($value) && trim($value) !== '') {
                    return true;
                }
                // For integer fields (like iracing_customer_id), just check not null
                if (is_int($value)) {
                    return true;
                }
            }
        }

        // No matching platform IDs found
        return false;
    }
}
