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
     * @var array<int, array{name: string, fields: array<int, array{field: string, label: string, type: string}>}>
     */
    private const PLATFORM_FIELD_MAPPINGS = [
        1 => [ // Gran Turismo 7
            'name' => 'Gran Turismo 7',
            'fields' => [
                ['field' => 'PsnId', 'label' => 'PSN ID', 'type' => 'text'],
            ],
        ],
        2 => [ // iRacing
            'name' => 'iRacing',
            'fields' => [
                ['field' => 'IracingId', 'label' => 'iRacing ID', 'type' => 'text'],
                ['field' => 'IracingCustomerId', 'label' => 'iRacing Customer ID', 'type' => 'number'],
            ],
        ],
        3 => [ // Assetto Corsa Competizione
            'name' => 'Assetto Corsa Competizione',
            'fields' => [],
        ],
        4 => [ // rFactor 2
            'name' => 'rFactor 2',
            'fields' => [],
        ],
        5 => [ // Automobilista 2
            'name' => 'Automobilista 2',
            'fields' => [],
        ],
        6 => [ // F1 24
            'name' => 'F1 24',
            'fields' => [],
        ],
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
                $columns = array_merge($columns, self::PLATFORM_FIELD_MAPPINGS[$platformId]['fields']);
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
     * Returns headers grouped by platform with platform information included.
     *
     * @param array<int> $platformIds
     * @return array<int, array{platform_id: int, platform_name: string, field: string, label: string, type: string}>
     */
    public function getCsvHeadersForLeague(array $platformIds): array
    {
        $headers = [];

        foreach ($platformIds as $platformId) {
            if (isset(self::PLATFORM_FIELD_MAPPINGS[$platformId])) {
                $platformMapping = self::PLATFORM_FIELD_MAPPINGS[$platformId];

                // Add platform information to each field
                foreach ($platformMapping['fields'] as $field) {
                    $headers[] = [
                        'platform_id' => $platformId,
                        'platform_name' => $platformMapping['name'],
                        'field' => $field['field'],
                        'label' => $field['label'],
                        'type' => $field['type'],
                    ];
                }
            }
        }

        return $headers;
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
                'PsnId' => $platformIdentifiers->psnId(),
                'IracingId' => $platformIdentifiers->iracingId(),
                'IracingCustomerId' => $platformIdentifiers->iracingCustomerId(),
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
