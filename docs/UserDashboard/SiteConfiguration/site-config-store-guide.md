# Site Configuration Store - User Dashboard

## Overview

The Site Configuration Store provides centralized access to site-wide configuration settings throughout the user dashboard application. It fetches configuration data from the backend API on application startup and makes it available to all components via a Pinia store.

## Architecture

### File Structure

```
resources/user/js/
├── types/
│   └── siteConfig.ts                        # TypeScript interfaces
├── services/
│   ├── siteConfigService.ts                 # API service layer
│   └── __tests__/
│       └── siteConfigService.test.ts        # Service tests
├── stores/
│   ├── siteConfigStore.ts                   # Pinia store
│   └── __tests__/
│       └── siteConfigStore.test.ts          # Store tests
├── app.ts                                   # Store initialization
└── examples/
    └── UsingSiteConfigStore.vue             # Usage example
```

## Implementation Details

### 1. Type Definitions (`types/siteConfig.ts`)

Defines the complete shape of site configuration data:

```typescript
export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportEmail?: string;
  contactEmail?: string;
  registrationsEnabled?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  custom?: Record<string, unknown>;
}
```

**Key Features:**
- Required fields: `siteName`, `siteDescription`
- Optional analytics integrations
- Optional branding assets (logo, favicon)
- Feature flags (registrations, maintenance mode)
- Flexible `custom` object for additional configuration

### 2. API Service (`services/siteConfigService.ts`)

Handles HTTP communication with the backend:

```typescript
export async function getSiteConfig(): Promise<SiteConfig> {
  const response = await apiClient.get('/api/site-config');
  return response.data.data;
}
```

**API Endpoint:** `GET /api/site-config`

**Expected Response:**
```json
{
  "data": {
    "siteName": "Virtual Racing Leagues",
    "siteDescription": "Manage your racing leagues",
    "googleAnalyticsId": "GA-XXXXX",
    "registrationsEnabled": true,
    "maintenanceMode": false,
    "custom": {
      "maxLeagues": 5,
      "theme": "dark"
    }
  }
}
```

### 3. Pinia Store (`stores/siteConfigStore.ts`)

The Pinia store provides reactive state management with the following features:

#### State

```typescript
const config = ref<SiteConfig | null>(null);      // Configuration data
const loading = ref(false);                        // Loading state
const error = ref<string | null>(null);           // Error message
const initialized = ref(false);                    // Initialization flag
```

#### Computed Getters

All configuration values are exposed as computed properties with sensible defaults:

```typescript
const siteName = computed(() => config.value?.siteName ?? 'Virtual Racing Leagues');
const siteDescription = computed(() => config.value?.siteDescription ?? 'Manage your racing leagues');
const googleAnalyticsId = computed(() => config.value?.googleAnalyticsId);
const registrationsEnabled = computed(() => config.value?.registrationsEnabled ?? true);
const maintenanceMode = computed(() => config.value?.maintenanceMode ?? false);
const isReady = computed(() => initialized.value && !loading.value && error.value === null);
```

**Benefits:**
- Always returns a value (never undefined)
- Provides sensible defaults when config is not loaded
- Type-safe access to all properties
- Reactive updates when config changes

#### Actions

**`fetchConfig(force?: boolean): Promise<void>`**
- Fetches configuration from the API
- Only fetches once unless `force = true`
- Errors are caught and logged (doesn't throw)
- App continues with defaults if fetch fails

**`refreshConfig(): Promise<void>`**
- Alias for `fetchConfig(true)`
- Forces a refresh of the configuration

**`getCustomConfig<T>(key: string, defaultValue?: T): T | undefined`**
- Type-safe access to custom configuration values
- Supports generic type parameter for type inference
- Returns default value if key doesn't exist

**`clearError(): void`**
- Clears the error message

**`reset(): void`**
- Resets store to initial state

### 4. Application Integration (`app.ts`)

The store is initialized before the Vue app mounts:

```typescript
import { useSiteConfigStore } from '@user/stores/siteConfigStore';

// ... app setup ...

// Initialize site configuration before mounting
const siteConfigStore = useSiteConfigStore();
siteConfigStore.fetchConfig().finally(() => {
  // Mount app regardless of config load success (will use defaults)
  app.mount('#user-app');
});
```

**Key Design Decisions:**
1. **Non-blocking:** App mounts even if config fails to load
2. **Graceful degradation:** Defaults are used when config is unavailable
3. **Early initialization:** Config is available before any component renders

## Usage Examples

### Basic Usage in Components

```vue
<script setup lang="ts">
import { useSiteConfigStore } from '@user/stores/siteConfigStore';

const siteConfig = useSiteConfigStore();
</script>

<template>
  <div>
    <h1>{{ siteConfig.siteName }}</h1>
    <p>{{ siteConfig.siteDescription }}</p>
  </div>
</template>
```

### Using Custom Configuration

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useSiteConfigStore } from '@user/stores/siteConfigStore';

const siteConfig = useSiteConfigStore();

// Type-safe custom config access
const maxLeagues = computed(() =>
  siteConfig.getCustomConfig<number>('maxLeagues', 1)
);

const featureFlags = computed(() =>
  siteConfig.getCustomConfig<string[]>('enabledFeatures', [])
);
</script>

<template>
  <div>
    <p>Max Leagues: {{ maxLeagues }}</p>
    <p>Features: {{ featureFlags.join(', ') }}</p>
  </div>
</template>
```

### Handling Loading and Error States

```vue
<script setup lang="ts">
import { useSiteConfigStore } from '@user/stores/siteConfigStore';

const siteConfig = useSiteConfigStore();

async function handleRefresh() {
  await siteConfig.refreshConfig();
}
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="siteConfig.loading">
      Loading configuration...
    </div>

    <!-- Error state -->
    <div v-else-if="siteConfig.error" class="error">
      {{ siteConfig.error }}
      <button @click="handleRefresh">Retry</button>
    </div>

    <!-- Success state -->
    <div v-else-if="siteConfig.isReady">
      <h1>{{ siteConfig.siteName }}</h1>
    </div>

    <!-- Not initialized (shouldn't happen with app.ts setup) -->
    <div v-else>
      Initializing...
    </div>
  </div>
</template>
```

### Using in Composables

```typescript
// composables/useFeatureFlags.ts
import { computed } from 'vue';
import { useSiteConfigStore } from '@user/stores/siteConfigStore';

export function useFeatureFlags() {
  const siteConfig = useSiteConfigStore();

  const isAnalyticsEnabled = computed(() =>
    !!siteConfig.googleAnalyticsId
  );

  const isRegistrationEnabled = computed(() =>
    siteConfig.registrationsEnabled
  );

  const isMaintenanceMode = computed(() =>
    siteConfig.maintenanceMode
  );

  return {
    isAnalyticsEnabled,
    isRegistrationEnabled,
    isMaintenanceMode,
  };
}
```

### Document Title Updates

```typescript
// composables/useDocumentTitle.ts
import { watch, onMounted } from 'vue';
import { useSiteConfigStore } from '@user/stores/siteConfigStore';

export function useDocumentTitle(pageTitle?: string) {
  const siteConfig = useSiteConfigStore();

  function updateTitle() {
    const base = siteConfig.siteName;
    document.title = pageTitle ? `${pageTitle} - ${base}` : base;
  }

  onMounted(() => {
    updateTitle();
  });

  watch(() => [siteConfig.siteName, pageTitle], updateTitle);
}
```

## Testing

The implementation includes comprehensive tests:

### Store Tests (`stores/__tests__/siteConfigStore.test.ts`)

- 23 tests covering:
  - Initial state validation
  - Computed getter behavior
  - Custom config access
  - Fetch operations (success, error, caching)
  - Refresh operations
  - Error handling
  - State reset
  - Integration scenarios

### Service Tests (`services/__tests__/siteConfigService.test.ts`)

- 6 tests covering:
  - Successful API calls
  - Minimal configuration responses
  - Custom properties handling
  - Error propagation
  - HTTP error codes (404, 500)

**Run tests:**
```bash
npm run test:user -- siteConfig
```

## Backend Requirements

The backend must implement the following API endpoint:

**Endpoint:** `GET /api/site-config`

**Authentication:** Required (user must be authenticated)

**Response Format:**
```json
{
  "data": {
    "siteName": "string (required)",
    "siteDescription": "string (required)",
    "googleAnalyticsId": "string (optional)",
    "facebookPixelId": "string (optional)",
    "logoUrl": "string (optional)",
    "faviconUrl": "string (optional)",
    "supportEmail": "string (optional)",
    "contactEmail": "string (optional)",
    "registrationsEnabled": "boolean (optional)",
    "maintenanceMode": "boolean (optional)",
    "maintenanceMessage": "string (optional)",
    "custom": "object (optional)"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Server error

## Design Principles

1. **Fail-Safe:** The application continues to function even if config loading fails
2. **Default Values:** All getters provide sensible defaults
3. **Type Safety:** Full TypeScript support throughout
4. **Single Source of Truth:** One store for all site configuration
5. **Performance:** Configuration is cached and only fetched once
6. **Testability:** Fully tested with mocked dependencies
7. **Extensibility:** Custom configuration object allows for future expansion

## Future Enhancements

Potential improvements for the future:

1. **Polling:** Periodic refresh of configuration for long-running sessions
2. **Cache Strategy:** localStorage caching for faster initial loads
3. **Admin Integration:** Real-time updates when admin changes site config
4. **Feature Flags:** More sophisticated feature flag system
5. **Environment-Specific Config:** Different configs per environment
6. **Validation:** Runtime validation of configuration schema

## Related Files

- `/var/www/resources/user/js/types/siteConfig.ts`
- `/var/www/resources/user/js/services/siteConfigService.ts`
- `/var/www/resources/user/js/stores/siteConfigStore.ts`
- `/var/www/resources/user/js/app.ts`
- `/var/www/resources/user/js/examples/UsingSiteConfigStore.vue`
- `/var/www/resources/user/js/stores/__tests__/siteConfigStore.test.ts`
- `/var/www/resources/user/js/services/__tests__/siteConfigService.test.ts`

## Support

For questions or issues, please refer to:
- Main documentation: `/var/www/CLAUDE.md`
- User dashboard guide: `/var/www/.claude/guides/backend/user-backend-guide.md`
- Admin dashboard guide: `/var/www/.claude/guides/frontend/admin-dashboard-development-guide.md`
