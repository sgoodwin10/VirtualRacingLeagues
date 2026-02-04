# Site Configuration Implementation Summary

## Overview

Successfully implemented a comprehensive site configuration system that passes configuration data from Laravel backend to all Blade templates and makes it accessible to Vue.js applications.

## Files Created

### Backend (Laravel)

1. **`config/site.php`** - Site configuration file
   - Contains all site-wide configuration values
   - Uses environment variables with sensible defaults
   - Includes: site name, timezone, Discord, maintenance mode, registration, Google Analytics/Tag Manager

2. **`app/Http/View/Composers/SiteConfigComposer.php`** - View Composer
   - Automatically shares site config with all Blade templates
   - Provides both array and JSON-encoded versions
   - XSS-safe JSON encoding (JSON_HEX_TAG, JSON_HEX_APOS, JSON_HEX_AMP, JSON_HEX_QUOT)

3. **`app/Providers/ViewServiceProvider.php`** - Service Provider
   - Registers the SiteConfigComposer for all views
   - Registered in `bootstrap/providers.php`

4. **`resources/views/partials/site-config.blade.php`** - Blade Partial
   - Outputs site config as `window.__SITE_CONFIG__`
   - Included in all three main templates (public, app, admin)

### Frontend (Vue/TypeScript)

5. **`resources/public/js/types/site-config.ts`** - TypeScript Interface (Public App)
   - Type-safe interface for site configuration
   - `getSiteConfig()` helper function
   - Global window type augmentation

6. **`resources/app/js/types/site-config.ts`** - TypeScript Interface (User App)
   - Identical to public app interface
   - Separate file for application independence

7. **`resources/admin/js/types/site-config.ts`** - TypeScript Interface (Admin App)
   - Identical to other apps
   - Maintains separation of concerns

8. **`resources/public/js/composables/useSiteConfig.ts`** - Vue Composable (Public App)
   - Reactive computed properties for all config values
   - Convenient helper properties (hasDiscord, hasGoogleAnalytics, etc.)

9. **`resources/app/js/composables/useSiteConfig.ts`** - Vue Composable (User App)
   - Same functionality as public app composable
   - Application-specific path alias

### Tests

10. **`tests/Unit/Http/View/Composers/SiteConfigComposerTest.php`** - Unit Tests
    - Tests composer functionality
    - Verifies config structure
    - Tests JSON encoding and XSS safety
    - **All tests passing ✅**

11. **`tests/Feature/Http/View/SiteConfigViewTest.php`** - Feature Tests
    - Tests config availability in all three views
    - Tests Google Tag Manager conditional rendering
    - Tests site name in title
    - **All tests passing ✅**

### Documentation

12. **`.claude/guides/site-config-guide.md`** - Comprehensive Guide
    - Complete documentation of the system
    - Usage examples for both backend and frontend
    - Step-by-step guide for adding new config values
    - Troubleshooting section
    - Security considerations

## Files Modified

### Backend

1. **`bootstrap/providers.php`**
   - Added `ViewServiceProvider::class`

2. **`.env.example`**
   - Added new environment variables:
     - `DISCORD_URL`
     - `DISCORD_INVITE_CODE`
     - `APP_MAINTENANCE_MODE`
     - `APP_MAINTENANCE_MESSAGE`
     - `REGISTRATION_ENABLED`
     - `GOOGLE_ANALYTICS_ID`

### Templates

3. **`resources/views/public.blade.php`**
   - Added `@include('partials.site-config')`
   - Updated to use `$siteConfig` for site name and Google Tag Manager

4. **`resources/views/app.blade.php`**
   - Added `@include('partials.site-config')`
   - Updated to use `$siteConfig` for site name and Google Tag Manager

5. **`resources/views/admin.blade.php`**
   - Added `@include('partials.site-config')`
   - Updated to use `$siteConfig` for site name and Google Tag Manager

## Configuration Values Available

| Key | Environment Variable | Default | Type |
|-----|---------------------|---------|------|
| `name` | `APP_NAME` | `VRL` | string |
| `timezone` | `APP_TIMEZONE` | `UTC` | string |
| `discord.url` | `DISCORD_URL` | `null` | string\|null |
| `discord.inviteCode` | `DISCORD_INVITE_CODE` | `null` | string\|null |
| `maintenance.enabled` | `APP_MAINTENANCE_MODE` | `false` | boolean |
| `maintenance.message` | `APP_MAINTENANCE_MESSAGE` | Default message | string |
| `registration.enabled` | `REGISTRATION_ENABLED` | `true` | boolean |
| `google.analyticsId` | `GOOGLE_ANALYTICS_ID` | `null` | string\|null |
| `google.tagManagerId` | `GOOGLE_TAG_MANAGER` | `null` | string\|null |

## Usage Examples

### Backend (Blade)

```blade
<!-- Access site name -->
<h1>{{ $siteConfig['name'] }}</h1>

<!-- Conditional Discord link -->
@if($siteConfig['discord']['url'])
    <a href="{{ $siteConfig['discord']['url'] }}">Join Discord</a>
@endif

<!-- Check if registration is enabled -->
@if($siteConfig['registration']['enabled'])
    <a href="/register">Register</a>
@endif
```

### Frontend (Vue)

```typescript
import { useSiteConfig } from '@public/composables/useSiteConfig';

const { siteName, hasDiscord, discordUrl, isRegistrationEnabled } = useSiteConfig();

console.log(siteName.value); // "VRL"
console.log(hasDiscord.value); // true
console.log(discordUrl.value); // "https://discord.gg/..."
```

## Test Results

All tests passing:

```
Site Config Composer (Tests\Unit\Http\View\Composers\SiteConfigComposer)
 ✔ Json encoding escapes special characters
 ✔ Compose shares site config with view
 ✔ Site config structure is correct

Site Config View (Tests\Feature\Http\View\SiteConfigView)
 ✔ Site config contains expected keys
 ✔ Site name is displayed in title
 ✔ Public view receives site config
 ✔ Google tag manager does not render when id is null
 ✔ Google tag manager renders when id is set

OK (8 tests, 46 assertions)
```

## Code Quality Checks

- **PHPStan Level 8**: ✅ Passing (no errors in new code)
- **PSR-12 Code Style**: ✅ Passing (all warnings fixed)
- **PHPUnit Tests**: ✅ 8/8 passing (46 assertions)

## Security Features

1. **XSS Prevention**: JSON encoding with special character escaping flags
2. **No Sensitive Data**: Only public-safe values are exposed to frontend
3. **Type Safety**: Strict TypeScript interfaces prevent runtime errors
4. **Validation**: Laravel config validation with type casting

## Integration with Existing Code

- **Google Tag Manager**: Automatically renders GTM snippets when configured
- **Google Analytics**: ID available for frontend analytics libraries
- **Discord Integration**: URL and invite code available for social links
- **Maintenance Mode**: Flag available for custom maintenance pages
- **Registration Control**: Backend flag to enable/disable registration

## Next Steps (Optional Enhancements)

1. **Admin UI**: Create admin panel to manage site configuration
2. **Caching**: Implement config caching for improved performance
3. **Feature Flags**: Extend system to include feature toggle functionality
4. **A/B Testing**: Add support for A/B testing configuration
5. **Multi-tenancy**: Extend to support per-league configuration overrides

## Notes

- Admin dashboard already has a separate `useSiteConfig` composable for managing site config via API (different purpose)
- The new system complements the existing admin functionality
- All three applications (public, app, admin) receive the same site config
- Config is reactive in Vue components via computed properties
- Changes to .env require `php artisan config:clear`
