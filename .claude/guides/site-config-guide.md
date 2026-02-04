# Site Configuration System Guide

## Overview

The site configuration system provides a centralized way to manage and share site-wide configuration values across all applications (public, user dashboard, admin dashboard). Configuration values are passed from Laravel to Blade templates and made accessible to Vue.js applications via `window.__SITE_CONFIG__`.

## Architecture

### Backend (Laravel)

```
config/site.php                              # Site configuration values
app/Http/View/Composers/SiteConfigComposer  # View composer that shares config
app/Providers/ViewServiceProvider            # Registers the view composer
resources/views/partials/site-config.blade.php  # Blade partial that outputs config
```

### Frontend (Vue)

```
resources/public/js/types/site-config.ts   # TypeScript interface for public app
resources/app/js/types/site-config.ts      # TypeScript interface for user app
resources/admin/js/types/site-config.ts    # TypeScript interface for admin app
```

## Configuration Values

### Available Configuration

The following configuration values are available:

| Key | Environment Variable | Default | Description |
|-----|---------------------|---------|-------------|
| `name` | `APP_NAME` | `VRL` | Site name |
| `timezone` | `APP_TIMEZONE` | `UTC` | Site timezone |
| `discord.url` | `DISCORD_URL` | `null` | Discord server URL |
| `discord.inviteCode` | `DISCORD_INVITE_CODE` | `null` | Discord invite code |
| `maintenance.enabled` | `APP_MAINTENANCE_MODE` | `false` | Maintenance mode enabled |
| `maintenance.message` | `APP_MAINTENANCE_MESSAGE` | Default message | Maintenance mode message |
| `registration.enabled` | `REGISTRATION_ENABLED` | `true` | User registration enabled |
| `google.analyticsId` | `GOOGLE_ANALYTICS_ID` | `null` | Google Analytics tracking ID |
| `google.tagManagerId` | `GOOGLE_TAG_MANAGER` | `null` | Google Tag Manager ID |

### Environment Variables

Add these to your `.env` file:

```env
# Site Configuration
APP_NAME=Your Site Name
APP_TIMEZONE=UTC

# Social Media
DISCORD_URL=https://discord.gg/your-invite
DISCORD_INVITE_CODE=your-invite-code

# Maintenance Mode
APP_MAINTENANCE_MODE=false
APP_MAINTENANCE_MESSAGE="The site is currently undergoing maintenance. Please check back soon."

# Registration Settings
REGISTRATION_ENABLED=true

# Google Tag Manager & Analytics
GOOGLE_TAG_MANAGER=GTM-XXXXX
GOOGLE_ANALYTICS_ID=G-XXXXX
```

## Backend Usage

### Accessing Config in PHP

```php
// Get site name
$siteName = config('site.name');

// Get Discord URL
$discordUrl = config('site.discord.url');

// Check if maintenance mode is enabled
$isMaintenanceMode = config('site.maintenance.enabled');

// Get Google Tag Manager ID
$gtmId = config('site.google.tag_manager_id');
```

### Accessing in Blade Templates

All Blade templates automatically receive the `$siteConfig` variable:

```blade
<!-- Access site name -->
<h1>{{ $siteConfig['name'] }}</h1>

<!-- Check if Discord is configured -->
@if($siteConfig['discord']['url'])
    <a href="{{ $siteConfig['discord']['url'] }}">Join our Discord</a>
@endif

<!-- Check if registration is enabled -->
@if($siteConfig['registration']['enabled'])
    <a href="/register">Register</a>
@endif

<!-- Check if Google Tag Manager is configured -->
@if($siteConfig['google']['tagManagerId'])
    <!-- GTM script will be rendered -->
@endif
```

### Google Tag Manager Integration

Google Tag Manager snippets are automatically included in all Blade templates when `GOOGLE_TAG_MANAGER` is set:

```blade
<!-- In <head> -->
@if($siteConfig['google']['tagManagerId'])
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer',@json($siteConfig['google']['tagManagerId']));</script>
<!-- End Google Tag Manager -->
@endif

<!-- In <body> -->
@if($siteConfig['google']['tagManagerId'])
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ $siteConfig['google']['tagManagerId'] }}"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
@endif
```

## Frontend Usage

### Accessing Config in Vue/TypeScript

Import the type-safe helper:

```typescript
import { getSiteConfig } from '@public/types/site-config'; // or @app or @admin

// Get the full config
const config = getSiteConfig();

// Access specific values
const siteName = config.name;
const timezone = config.timezone;
const discordUrl = config.discord.url;
const isMaintenanceMode = config.maintenance.enabled;
const registrationEnabled = config.registration.enabled;
const gtmId = config.google.tagManagerId;
```

### Example Usage in Vue Component

```vue
<script setup lang="ts">
import { getSiteConfig } from '@public/types/site-config';

const config = getSiteConfig();

// Show Discord link if configured
const showDiscordLink = computed(() => !!config.discord.url);

// Show registration button if enabled
const canRegister = computed(() => config.registration.enabled);
</script>

<template>
  <div>
    <h1>Welcome to {{ config.name }}</h1>

    <a v-if="showDiscordLink" :href="config.discord.url">
      Join our Discord
    </a>

    <router-link v-if="canRegister" to="/register">
      Register
    </router-link>
  </div>
</template>
```

### Direct Window Access

You can also access the config directly from the window object:

```typescript
// Type-safe access
const config: SiteConfig = window.__SITE_CONFIG__;

// Or access individual values
const siteName = window.__SITE_CONFIG__.name;
```

## Adding New Configuration Values

### Step 1: Update `config/site.php`

```php
return [
    // ... existing config ...

    'new_feature' => [
        'enabled' => (bool) env('NEW_FEATURE_ENABLED', false),
        'api_key' => env('NEW_FEATURE_API_KEY'),
    ],
];
```

### Step 2: Update `.env.example`

```env
# New Feature Configuration
NEW_FEATURE_ENABLED=false
NEW_FEATURE_API_KEY=
```

### Step 3: Update `SiteConfigComposer.php`

```php
private function getSiteConfig(): array
{
    return [
        // ... existing config ...

        'newFeature' => [
            'enabled' => config('site.new_feature.enabled'),
            'apiKey' => config('site.new_feature.api_key'),
        ],
    ];
}
```

### Step 4: Update TypeScript Interface

Update all three type files:
- `resources/public/js/types/site-config.ts`
- `resources/app/js/types/site-config.ts`
- `resources/admin/js/types/site-config.ts`

```typescript
export interface SiteConfig {
  // ... existing properties ...
  newFeature: {
    enabled: boolean;
    apiKey: string | null;
  };
}
```

### Step 5: Write Tests

```php
public function test_new_feature_config_is_available(): void
{
    // Arrange
    config(['site.new_feature.enabled' => true]);

    // Act
    $response = $this->get('/');

    // Assert
    $response->assertStatus(200);
    $response->assertSee('"newFeature"', false);
    $response->assertSee('"enabled":true', false);
}
```

## Testing

### Unit Tests

Test the `SiteConfigComposer` directly:

```bash
./vendor/bin/phpunit tests/Unit/Http/View/Composers/SiteConfigComposerTest.php
```

### Feature Tests

Test that config is passed to views correctly:

```bash
./vendor/bin/phpunit tests/Feature/Http/View/SiteConfigViewTest.php
```

### Run All Tests

```bash
composer test
```

## Best Practices

1. **Use Environment Variables**: Always use `.env` variables for configuration values that may change between environments.

2. **Provide Defaults**: Always provide sensible defaults in `config/site.php` using the second parameter of `env()`.

3. **Type Safety**: Always update the TypeScript interfaces when adding new config values.

4. **Sensitive Data**: Never expose sensitive data (API keys, secrets) to the frontend. Only include values that are safe to be publicly visible.

5. **Conditional Rendering**: Use null checks for optional values:
   ```blade
   @if($siteConfig['discord']['url'])
       <!-- Discord link -->
   @endif
   ```

6. **Cache Consideration**: Remember to clear config cache after changes:
   ```bash
   php artisan config:clear
   ```

## Troubleshooting

### Config Not Available in Vue

**Problem**: `window.__SITE_CONFIG__` is undefined.

**Solution**: Ensure the Blade template includes the site-config partial:
```blade
@include('partials.site-config')
```

### Config Values Not Updating

**Problem**: Changes to `.env` not reflected.

**Solution**: Clear config cache:
```bash
php artisan config:clear
```

### TypeScript Errors

**Problem**: TypeScript complains about missing properties.

**Solution**: Ensure all three `site-config.ts` files are updated with the same interface.

### Google Tag Manager Not Loading

**Problem**: GTM snippet not appearing in HTML.

**Solution**:
1. Check that `GOOGLE_TAG_MANAGER` is set in `.env`
2. Verify the value is not empty
3. Clear config cache: `php artisan config:clear`

## Security Considerations

1. **XSS Prevention**: The config is JSON-encoded with `JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT` flags to prevent XSS attacks.

2. **Sensitive Data**: Never include sensitive information (passwords, private API keys, etc.) in the site config as it's exposed to the frontend.

3. **Validation**: Validate all config values before using them in the application logic.

4. **CORS**: Site config is same-origin only; it's not exposed via API endpoints.

## Related Files

- `/var/www/config/site.php` - Site configuration
- `/var/www/app/Http/View/Composers/SiteConfigComposer.php` - View composer
- `/var/www/app/Providers/ViewServiceProvider.php` - Service provider
- `/var/www/resources/views/partials/site-config.blade.php` - Blade partial
- `/var/www/resources/*/js/types/site-config.ts` - TypeScript interfaces
- `/var/www/tests/Unit/Http/View/Composers/SiteConfigComposerTest.php` - Unit tests
- `/var/www/tests/Feature/Http/View/SiteConfigViewTest.php` - Feature tests
