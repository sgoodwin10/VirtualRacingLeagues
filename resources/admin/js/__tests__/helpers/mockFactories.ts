/**
 * Mock data factories for testing
 * Provides properly typed test data generators
 */

import { faker } from '@faker-js/faker';
import type { Admin } from '@admin/types/admin';
import type { User } from '@admin/types/user';
import type { SiteConfig } from '@admin/types/siteConfig';
import type { Activity } from '@admin/types/activityLog';

/**
 * Create a mock Admin user with all required fields
 */
export function createMockAdmin(overrides?: Partial<Admin>): Admin {
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.person.fullName(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    role: 'admin',
    status: 'active',
    last_login_at: faker.date.recent().toISOString(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock User with all required fields
 */
export function createMockUser(overrides?: Partial<User>): User {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.uuid(),
    first_name: firstName,
    last_name: lastName,
    name: `${firstName} ${lastName}`,
    email: faker.internet.email(),
    email_verified_at: faker.date.past().toISOString(),
    alias: faker.internet.username(),
    uuid: faker.string.uuid(),
    status: 'active',
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

/**
 * Create a mock Site Config with all required fields
 */
export function createMockSiteConfig(overrides?: Partial<SiteConfig>): SiteConfig {
  return {
    id: 1,
    site_name: faker.company.name(),
    maintenance_mode: false,
    timezone: 'UTC',
    user_registration_enabled: true,
    google_tag_manager_id: null,
    google_analytics_id: null,
    google_search_console_code: null,
    discord_link: null,
    support_email: faker.internet.email(),
    contact_email: faker.internet.email(),
    admin_email: faker.internet.email(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    files: {
      logo: null,
      favicon: null,
      og_image: null,
    },
    ...overrides,
  };
}

/**
 * Create a mock Activity with all required fields
 */
export function createMockActivity(overrides?: Partial<Activity>): Activity {
  return {
    id: faker.number.int({ min: 1, max: 10000 }),
    log_name: 'admin',
    description: 'user.created',
    subject_type: 'User',
    subject_id: faker.number.int({ min: 1, max: 1000 }),
    causer_type: 'Admin',
    causer_id: faker.number.int({ min: 1, max: 100 }),
    properties: {},
    event: 'created',
    batch_uuid: null,
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}
