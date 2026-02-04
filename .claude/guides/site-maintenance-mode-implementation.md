# Maintenance Mode Backend Implementation

This guide documents the maintenance mode backend implementation for the Virtual Racing Leagues application.

## Overview

The maintenance mode feature allows administrators to put the site into maintenance mode, which can be used to display a maintenance message to users while allowing administrators to bypass the maintenance mode and continue working.

## Implementation Details

### 1. Configuration

The maintenance mode configuration is already defined in `/var/www/config/site.php`:

```php
'maintenance' => [
    'enabled' => (bool) env('APP_MAINTENANCE_MODE', false),
    'message' => env(
        'APP_MAINTENANCE_MESSAGE',
        'The site is currently undergoing maintenance. Please check back soon.'
    ),
],
```

Environment variables in `.env`:
- `APP_MAINTENANCE_MODE` - Boolean flag to enable/disable maintenance mode (default: `false`)
- `APP_MAINTENANCE_MESSAGE` - Custom message to display during maintenance (optional)

### 2. Database

The maintenance mode is stored in the `site_configs` table with the `maintenance_mode` boolean column. This is managed through the `SiteConfig` domain entity.

### 3. API Endpoints

All site configuration endpoints now return maintenance mode status:

#### Public API Endpoint
**Route**: `GET /api/site-config` (Public - no authentication required)

**Response**:
```json
{
  "success": true,
  "data": {
    "user_registration_enabled": true,
    "discord_url": "https://discord.gg/example",
    "maintenance_mode": false,
    "is_admin": false
  }
}
```

#### User Dashboard API Endpoint
**Route**: `GET /api/site-config` (User Dashboard - requires `auth:web`)

**Response**:
```json
{
  "success": true,
  "data": {
    "user_registration_enabled": true,
    "discord_url": "https://discord.gg/example",
    "maintenance_mode": false,
    "is_admin": false
  }
}
```

#### Admin Dashboard API Endpoint
**Route**: `GET /admin/api/site-config` (Admin Dashboard - requires `auth:admin`)

**Response** (via `SiteConfigData` DTO):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "site_name": "VRL",
    "maintenance_mode": true,
    "user_registration_enabled": true,
    // ... other configuration fields
  }
}
```

### 4. Admin Detection

The `is_admin` field is included in all responses to allow the frontend to determine if the current user should bypass maintenance mode:

- Returns `true` when the request is authenticated with the `admin` guard
- Returns `false` for unauthenticated requests or requests authenticated with the `web` guard (regular users)

This allows:
- Admins to bypass maintenance mode and continue working
- Regular users to see the maintenance message
- Unauthenticated users to see the maintenance message

### 5. Implementation Files

The following files were modified:

#### Controllers
- `/var/www/app/Http/Controllers/Public/SiteConfigController.php`
  - Added `maintenance_mode` to response
  - Added `is_admin` flag to response

- `/var/www/app/Http/Controllers/User/SiteConfigController.php`
  - Refactored to use `SiteConfigApplicationService`
  - Added `maintenance_mode` to response
  - Added `is_admin` flag to response

#### Tests
- `/var/www/tests/Feature/Api/Public/PublicSiteConfigControllerTest.php`
  - Updated all existing tests to include maintenance mode
  - Added test for maintenance mode enabled state
  - Added test for admin authentication detection
  - Added test for regular user authentication (is_admin = false)

- `/var/www/tests/Feature/Http/Controllers/User/SiteConfigControllerTest.php`
  - Updated all tests to use `SiteConfigModel` factory
  - Refactored tests to match new response structure
  - Added test for maintenance mode
  - Added test for admin detection

### 6. Domain Layer

The maintenance mode functionality already existed in the domain layer:

- **Entity**: `App\Domain\SiteConfig\Entities\SiteConfig`
  - `isMaintenanceMode(): bool` - Getter for maintenance mode status
  - `enableMaintenanceMode(): void` - Enable maintenance mode
  - `disableMaintenanceMode(): void` - Disable maintenance mode
  - `updateApplicationSettings()` - Update all application settings including maintenance mode

- **Application Service**: `App\Application\Admin\Services\SiteConfigApplicationService`
  - `getConfiguration(): SiteConfig` - Get active site configuration (cached)
  - `updateConfiguration(array $data): SiteConfig` - Update configuration including maintenance mode

- **DTO**: `App\Application\Admin\DTOs\SiteConfigData`
  - Includes `maintenance_mode` boolean field

## Frontend Integration

The frontend should:

1. Call the appropriate `/api/site-config` endpoint on app initialization
2. Check the `maintenance_mode` field to determine if maintenance mode is enabled
3. Check the `is_admin` field to determine if the current user should bypass maintenance mode
4. Display a maintenance message if `maintenance_mode: true` AND `is_admin: false`
5. Allow access if `maintenance_mode: false` OR `is_admin: true`

## Testing

All tests pass successfully:
- 9 tests for Public SiteConfigController
- 5 tests for User SiteConfigController
- 15 tests for Admin SiteConfigController
- All tests verify maintenance mode and admin detection functionality

## Code Quality

- PHPStan Level 8: ✓ Passed
- PHPCS (PSR-12): ✓ Passed
- All tests: ✓ 29 passed (147 assertions)
