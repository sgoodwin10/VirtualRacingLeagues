/**
 * Test helpers for driver-related tests
 */

import type { LeagueDriver, Driver } from '@user/types/driver';

/**
 * Create a mock Driver object for testing
 */
export function createMockDriver(overrides?: Partial<Driver>): Driver {
  return {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    nickname: 'JDoe',
    discord_id: null,
    display_name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    psn_id: 'JohnDoe123',
    iracing_id: null,
    iracing_customer_id: null,
    primary_platform_id: 'PSN: JohnDoe123',
    created_at: '2025-10-18T10:00:00Z',
    updated_at: '2025-10-18T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock LeagueDriver object for testing
 */
export function createMockLeagueDriver(overrides?: Partial<LeagueDriver>): LeagueDriver {
  const driver = createMockDriver(overrides?.driver);

  return {
    id: 1,
    league_id: 1,
    driver_id: driver.id,
    driver_number: 5,
    status: 'active',
    league_notes: null,
    added_to_league_at: '2025-10-18T10:00:00Z',
    driver,
    ...overrides,
  };
}
