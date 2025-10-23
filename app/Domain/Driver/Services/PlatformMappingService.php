<?php

declare(strict_types=1);

namespace App\Domain\Driver\Services;

/**
 * Maps between platform IDs and driver platform identifier fields.
 * This service knows which driver fields correspond to which platform IDs.
 */
final class PlatformMappingService
{
    /**
     * Platform ID to field name mapping.
     * Based on database seeder: 1=GT7, 2=iRacing, etc.
     *
     * PSN ID (PlayStation Network) is used for Gran Turismo 7 and other PlayStation games.
     *
     * @var array<int, array<string>>
     */
    private const PLATFORM_FIELD_MAP = [
        1 => ['psn_id'], // Gran Turismo 7 (uses PSN ID for PlayStation Network)
        2 => ['iracing_id', 'iracing_customer_id'], // iRacing
        3 => [], // Assetto Corsa Competizione - no specific field yet
        4 => [], // rFactor 2 - no specific field yet
        5 => [], // Automobilista 2 - no specific field yet
        6 => [], // F1 24 - no specific field yet
    ];

    /**
     * Get driver field names for a platform ID.
     *
     * @param int $platformId
     * @return array<string>
     */
    public static function getFieldsForPlatform(int $platformId): array
    {
        return self::PLATFORM_FIELD_MAP[$platformId] ?? [];
    }

    /**
     * Get all possible driver platform field names.
     *
     * @return array<string>
     */
    public static function getAllPlatformFields(): array
    {
        $fields = [];
        foreach (self::PLATFORM_FIELD_MAP as $platformFields) {
            $fields = array_merge($fields, $platformFields);
        }
        return array_unique($fields);
    }

    /**
     * Check if driver data has at least one platform ID for the given league platforms.
     *
     * @param array<int> $leaguePlatformIds Platform IDs associated with the league
     * @param array<string, mixed> $driverData Driver data with platform fields
     * @return bool True if driver has at least one platform ID for the league
     */
    public static function hasValidPlatformForLeague(array $leaguePlatformIds, array $driverData): bool
    {
        foreach ($leaguePlatformIds as $platformId) {
            $fields = self::getFieldsForPlatform($platformId);

            foreach ($fields as $field) {
                if (
                    isset($driverData[$field])
                    && $driverData[$field] !== null
                    && trim((string)$driverData[$field]) !== ''
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get a list of platform names that the driver has IDs for.
     *
     * @param array<string, mixed> $driverData Driver data with platform fields
     * @return array<string> Platform field names that are populated
     */
    public static function getProvidedPlatformFields(array $driverData): array
    {
        $providedFields = [];

        foreach (self::getAllPlatformFields() as $field) {
            if (
                isset($driverData[$field])
                && $driverData[$field] !== null
                && trim((string)$driverData[$field]) !== ''
            ) {
                $providedFields[] = $field;
            }
        }

        return $providedFields;
    }
}
