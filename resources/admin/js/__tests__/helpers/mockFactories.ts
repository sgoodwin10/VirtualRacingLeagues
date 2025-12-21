/**
 * Mock data factories for testing
 * Provides properly typed test data generators
 */

import { faker } from '@faker-js/faker';
import type { Admin } from '@admin/types/admin';
import type { User } from '@admin/types/user';
import type { SiteConfig } from '@admin/types/siteConfig';
import type { Activity } from '@admin/types/activityLog';
import type {
  League,
  LeagueVisibility,
  LeagueStatus,
  CompetitionSummary,
  CompetitionStatus,
  Season,
  SeasonStatus,
} from '@admin/types/league';
import type { Driver, DriverStatus } from '@admin/types/driver';
import type { MediaObject } from '@admin/types/media';
import type { PlatformCarImportSummary } from '@admin/types/platformCar';

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

/**
 * Create a mock MediaObject with responsive conversions
 */
export function createMockMedia(overrides?: Partial<MediaObject>): MediaObject {
  const id = faker.number.int({ min: 1, max: 10000 });
  const baseUrl = '/storage/media/' + id;

  return {
    id,
    original: `${baseUrl}/image.png`,
    conversions: {
      thumb: `${baseUrl}/conversions/image-thumb.webp`,
      small: `${baseUrl}/conversions/image-small.webp`,
      medium: `${baseUrl}/conversions/image-medium.webp`,
      large: `${baseUrl}/conversions/image-large.webp`,
      og: `${baseUrl}/conversions/image-og.webp`,
    },
    srcset: `${baseUrl}/conversions/image-thumb.webp 150w, ${baseUrl}/conversions/image-small.webp 320w, ${baseUrl}/conversions/image-medium.webp 640w, ${baseUrl}/conversions/image-large.webp 1280w`,
    ...overrides,
  };
}

/**
 * Create a mock League with all required fields
 */
export function createMockLeague(overrides?: Partial<League>): League {
  const name = faker.company.name();
  const slug = faker.helpers.slugify(name).toLowerCase();
  const visibility: LeagueVisibility = faker.helpers.arrayElement([
    'public',
    'private',
    'unlisted',
  ]);
  const status: LeagueStatus = faker.helpers.arrayElement(['active', 'archived']);

  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name,
    slug,
    tagline: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    // OLD - deprecated but kept for backward compatibility
    logo_url: faker.image.url(),
    header_image_url: faker.image.url(),
    banner_url: faker.image.url(),
    // NEW - responsive media objects
    logo: createMockMedia(),
    header_image: createMockMedia(),
    banner: createMockMedia(),
    platform_ids: [1, 2],
    platforms: [
      { id: 1, name: 'PlayStation', slug: 'playstation' },
      { id: 2, name: 'iRacing', slug: 'iracing' },
    ],
    discord_url: faker.internet.url(),
    website_url: faker.internet.url(),
    twitter_handle: faker.internet.username(),
    instagram_handle: faker.internet.username(),
    youtube_url: faker.internet.url(),
    twitch_url: faker.internet.url(),
    visibility,
    timezone: 'UTC',
    owner_user_id: faker.number.int({ min: 1, max: 1000 }),
    owner: {
      id: faker.number.int({ min: 1, max: 1000 }),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
    },
    contact_email: faker.internet.email(),
    organizer_name: faker.person.fullName(),
    status,
    is_active: status === 'active',
    is_archived: status === 'archived',
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

/**
 * Create a mock Driver with all required fields
 */
export function createMockDriver(overrides?: Partial<Driver>): Driver {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const nickname = faker.internet.username();
  const status: DriverStatus = faker.helpers.arrayElement(['active', 'inactive', 'banned']);

  return {
    id: faker.number.int({ min: 1, max: 10000 }),
    first_name: firstName,
    last_name: lastName,
    nickname,
    slug: faker.helpers.slugify(`${firstName}-${lastName}`).toLowerCase(),
    display_name: `${firstName} ${lastName}`,
    email: faker.internet.email(),
    phone: faker.phone.number(),
    psn_id: faker.string.alphanumeric(12),
    iracing_id: faker.string.numeric(6),
    iracing_customer_id: faker.number.int({ min: 100000, max: 999999 }),
    discord_id: faker.string.alphanumeric(18),
    primary_platform_id: faker.helpers.arrayElement(['psn', 'iracing', 'discord']),
    status,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

/**
 * Create a mock Competition with all required fields
 */
export function createMockCompetition(overrides?: Partial<CompetitionSummary>): CompetitionSummary {
  const name = faker.word.words(2);
  const slug = faker.helpers.slugify(name).toLowerCase();
  const status: CompetitionStatus = faker.helpers.arrayElement(['active', 'archived']);

  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name,
    slug,
    status,
    platform_id: faker.number.int({ min: 1, max: 10 }),
    platform_name: faker.helpers.arrayElement(['PlayStation', 'iRacing', 'Xbox', 'PC']),
    platform_slug: faker.helpers.slugify(name).toLowerCase(),
    season_count: faker.number.int({ min: 0, max: 20 }),
    // OLD - deprecated but kept for backward compatibility
    logo_url: faker.image.url(),
    banner_url: faker.image.url(),
    // NEW - responsive media objects
    logo: createMockMedia(),
    banner: createMockMedia(),
    created_at: faker.date.past().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock Season with all required fields
 */
export function createMockSeason(overrides?: Partial<Season>): Season {
  const name = `Season ${faker.number.int({ min: 1, max: 10 })}`;
  const slug = faker.helpers.slugify(name).toLowerCase();
  const status: SeasonStatus = faker.helpers.arrayElement([
    'pending',
    'active',
    'completed',
    'cancelled',
  ]);

  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name,
    slug,
    competition_id: faker.number.int({ min: 1, max: 100 }),
    competition_name: faker.word.words(2),
    status,
    division_name:
      faker.helpers.maybe(() => `Division ${faker.string.alpha(1).toUpperCase()}`, {
        probability: 0.5,
      }) ?? null,
    team_name: faker.helpers.maybe(() => faker.company.name(), { probability: 0.5 }) ?? null,
    // OLD - deprecated but kept for backward compatibility
    logo_url: faker.image.url(),
    banner_url: faker.image.url(),
    // NEW - responsive media objects
    logo: createMockMedia(),
    banner: createMockMedia(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock PlatformCarImportSummary with all required fields
 */
export function createMockPlatformCarImportSummary(
  overrides?: Partial<PlatformCarImportSummary>,
): PlatformCarImportSummary {
  return {
    carsCreated: faker.number.int({ min: 50, max: 200 }),
    carsUpdated: faker.number.int({ min: 0, max: 50 }),
    carsDeactivated: faker.number.int({ min: 0, max: 10 }),
    brandsCreated: faker.number.int({ min: 10, max: 30 }),
    brandsUpdated: faker.number.int({ min: 0, max: 10 }),
    errors: [],
    ...overrides,
  };
}
