/**
 * Platform Car Import Types
 *
 * Type definitions for platform car import functionality.
 * Handles GT7 car import API responses.
 */

import type { ApiResponse } from './api';

/**
 * Platform car import summary
 * Returned after successful import operation
 */
export interface PlatformCarImportSummary {
  carsCreated: number;
  carsUpdated: number;
  carsDeactivated: number;
  brandsCreated: number;
  brandsUpdated: number;
  errors: string[];
}

/**
 * API response for platform car import
 * Uses standardized ApiResponse wrapper for consistency
 */
export type PlatformCarImportResponse = ApiResponse<PlatformCarImportSummary>;
