/**
 * Platform ID constants
 *
 * These IDs correspond to the platforms table in the database.
 * The order matches the PlatformSeeder sort_order.
 *
 * @see database/seeders/PlatformSeeder.php
 */

/**
 * Gran Turismo 7 platform ID
 * - Uses PSN ID for driver identification
 */
export const PLATFORM_GRAN_TURISMO_7 = 1;

/**
 * iRacing platform ID
 * - Uses iRacing ID and iRacing Customer ID for driver identification
 */
export const PLATFORM_IRACING = 2;

/**
 * Assetto Corsa Competizione platform ID
 */
export const PLATFORM_ASSETTO_CORSA_COMPETIZIONE = 3;

/**
 * rFactor 2 platform ID
 */
export const PLATFORM_RFACTOR_2 = 4;

/**
 * Automobilista 2 platform ID
 */
export const PLATFORM_AUTOMOBILISTA_2 = 5;

/**
 * F1 24 platform ID
 */
export const PLATFORM_F1_24 = 6;

/**
 * Legacy aliases for backward compatibility
 * @deprecated Use PLATFORM_GRAN_TURISMO_7 instead
 */
export const PLATFORM_PSN = PLATFORM_GRAN_TURISMO_7;

/**
 * Check if a platform uses PSN ID
 */
export function usesPsnId(platformId: number | undefined): boolean {
  if (platformId === undefined) return true; // Show all columns when platform is not specified
  return platformId === PLATFORM_GRAN_TURISMO_7;
}

/**
 * Check if a platform uses iRacing ID
 */
export function usesIracingId(platformId: number | undefined): boolean {
  if (platformId === undefined) return true; // Show all columns when platform is not specified
  return platformId === PLATFORM_IRACING;
}

/**
 * Get platform name by ID (for debugging/logging)
 */
export function getPlatformName(platformId: number): string {
  const platformNames: Record<number, string> = {
    [PLATFORM_GRAN_TURISMO_7]: 'Gran Turismo 7',
    [PLATFORM_IRACING]: 'iRacing',
    [PLATFORM_ASSETTO_CORSA_COMPETIZIONE]: 'Assetto Corsa Competizione',
    [PLATFORM_RFACTOR_2]: 'rFactor 2',
    [PLATFORM_AUTOMOBILISTA_2]: 'Automobilista 2',
    [PLATFORM_F1_24]: 'F1 24',
  };

  return platformNames[platformId] || 'Unknown Platform';
}
