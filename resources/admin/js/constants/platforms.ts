/**
 * Platform option type
 */
export interface PlatformOption {
  label: string;
  value: number;
}

/**
 * Available racing platforms
 *
 * These options are used for filtering and displaying league platforms
 * across the admin dashboard.
 *
 * @example
 * ```typescript
 * import { PLATFORM_OPTIONS } from '@admin/constants/platforms';
 *
 * <MultiSelect
 *   :options="PLATFORM_OPTIONS"
 *   option-label="label"
 *   option-value="value"
 * />
 * ```
 */
export const PLATFORM_OPTIONS: PlatformOption[] = [
  { label: 'iRacing', value: 1 },
  { label: 'Assetto Corsa Competizione', value: 2 },
  { label: 'rFactor 2', value: 3 },
  { label: 'F1 Series', value: 4 },
  { label: 'Gran Turismo', value: 5 },
  { label: 'Project CARS', value: 6 },
];
