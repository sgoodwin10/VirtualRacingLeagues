# Laravel Subdomain Routing - Configuration Summary

## Overview

The application now uses **subdomain-based routing** with three distinct subdomains:

1. **virtualracingleagues.localhost:8000** - Public site (authentication, registration)
2. **app.virtualracingleagues.localhost:8000** - User dashboard (authenticated users only)
3. **admin.virtualracingleagues.localhost:8000** - Admin dashboard (authenticated admins only)

## Changes Made

### 1. Route File Reorganization

#### `/var/www/routes/subdomain.php` (PRIMARY ROUTING FILE)
- **Purpose**: Main routing file that handles all subdomain-specific routes
- **Status**: Active and fully configured
- **Load Order**: First (loaded before web.php and api.php)

**Structure**:
```php
// Admin subdomain (admin.virtualracingleagues.localhost)
Route::domain('admin.virtualracingleagues.localhost')->group(function () {
    // Admin API routes: /admin/api/*
    // Admin SPA: /admin/{any?}
});

// App subdomain (app.virtualracingleagues.localhost)
// AUTHENTICATED USERS ONLY
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    // User API routes: /api/*
    // User SPA: /{any?}
});

// Main domain (virtualracingleagues.localhost)
// PUBLIC ACCESS - Authentication routes
Route::domain('virtualracingleagues.localhost')->group(function () {
    // Public API routes: /api/* (register, login, forgot-password, etc.)
    // Public SPA: /{any?}
});
```

#### `/var/www/routes/web.php` (FALLBACK ONLY)
- **Purpose**: Fallback routes for non-matching requests
- **Status**: Minimal - only contains fallback route
- **Load Order**: Last

**Contains**:
```php
Route::fallback(function () {
    return response()->json([
        'error' => 'Route not found. Please ensure you are accessing the correct subdomain.',
        'domains' => [...]
    ], 404);
});
```

#### `/var/www/routes/api.php` (DEPRECATED)
- **Purpose**: Previously held API routes
- **Status**: Deprecated - cleared of all routes
- **Load Order**: Second (after subdomain.php, before web.php)
- **Note**: Kept for potential future use but all routing now happens in subdomain.php

### 2. Route Loading Configuration

#### `/var/www/bootstrap/app.php`
Updated to load routes in correct order:

```php
->withRouting(
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
    then: function () {
        // Load subdomain routes FIRST (primary routing)
        require __DIR__.'/../routes/subdomain.php';

        // Load API routes (deprecated, kept for reference)
        require __DIR__.'/../routes/api.php';

        // Load web routes LAST (fallback only)
        require __DIR__.'/../routes/web.php';
    },
)
```

**Middleware Registration**:
Added `user.authenticate` middleware alias:

```php
$middleware->alias([
    'admin.authenticate' => \App\Http\Middleware\AdminAuthenticate::class,
    'admin.role' => \App\Http\Middleware\AdminRole::class,
    'user.authenticate' => \App\Http\Middleware\UserAuthenticate::class,
]);
```

### 3. Session Configuration

#### `/var/www/.env`
**Critical Change**: Set `SESSION_DOMAIN` with leading dot for cross-subdomain session sharing:

```env
SESSION_DOMAIN=.virtualracingleagues.localhost
```

The **leading dot** is crucial - it allows the session cookie to be shared across all subdomains:
- `virtualracingleagues.localhost` (main)
- `app.virtualracingleagues.localhost` (user app)
- `admin.virtualracingleagues.localhost` (admin)

**Also Updated**:
```env
SANCTUM_STATEFUL_DOMAINS=virtualracingleagues.localhost:8000,app.virtualracingleagues.localhost:8000,admin.virtualracingleagues.localhost:8000,localhost:5173
```

#### `/var/www/config/session.php`
Already correctly configured with:

```php
'domain' => env('SESSION_DOMAIN', '.virtualracingleagues.localhost'),
'same_site' => env('SESSION_SAME_SITE', 'lax'),
```

### 4. CORS Configuration

#### `/var/www/config/cors.php`
Updated to handle all subdomain API paths:

```php
'paths' => ['api/*', 'admin/api/*', 'sanctum/csrf-cookie'],

'allowed_origins' => [
    'http://localhost:5173',
    'http://virtualracingleagues.localhost:8000',
    'http://admin.virtualracingleagues.localhost:8000',
    'http://app.virtualracingleagues.localhost:8000',
    'http://localhost:8000',
],

'supports_credentials' => true, // Critical for cookie-based auth
```

### 5. Sanctum Configuration

#### `/var/www/config/sanctum.php`
Already correctly configured with all subdomains:

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1,virtualracingleagues.localhost,admin.virtualracingleagues.localhost,app.virtualracingleagues.localhost',
    Sanctum::currentApplicationUrlWithPort(),
))),

'guard' => ['web', 'admin'], // Multiple guards for user and admin auth
```

### 6. Middleware Configuration

#### `/var/www/app/Http/Middleware/UserAuthenticate.php`
**Status**: Already exists and properly implemented

**Key Features**:
- Checks `auth:web` guard for user authentication
- Returns 401 JSON for API requests
- Redirects unauthenticated web requests to main domain login
- Checks if user account is active
- Logs out and redirects inactive users

**Usage**: Applied to app subdomain API routes that require authentication

## Routing Architecture

### Public Domain (virtualracingleagues.localhost:8000)

**Purpose**: Public-facing site with authentication

**Routes**:
- `GET /api/csrf-cookie` - Get CSRF token
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password
- `GET /email/verify/{id}/{hash}` - Email verification (signed route)
- `GET /{any?}` - Public SPA (Vue Router handles frontend routes)

**Authentication**: NO authentication required (public access)

**After Login**: Users should be redirected to `app.virtualracingleagues.localhost:8000`

### App Subdomain (app.virtualracingleagues.localhost:8000)

**Purpose**: User dashboard for authenticated users

**Routes**:
- `GET /api/csrf-cookie` - Get CSRF token (public)
- `GET /api/me` - Get current user (checks auth without requiring it)
- `POST /api/logout` - Logout (requires auth)
- `POST /api/email/resend` - Resend verification email (requires auth)
- `PUT /api/profile` - Update profile (requires auth)
- `GET /email/verify/{id}/{hash}` - Email verification (signed route)
- `GET /{any?}` - User SPA (Vue Router handles frontend routes)

**Authentication**: Most API routes require `auth:web` + `user.authenticate` middleware

**Session Handling**:
- Session shared with main domain via `.virtualracingleagues.localhost` cookie domain
- Frontend should check authentication and redirect to main domain if not authenticated

### Admin Subdomain (admin.virtualracingleagues.localhost:8000)

**Purpose**: Admin dashboard for authenticated administrators

**Routes**:
- `GET /admin/api/csrf-cookie` - Get CSRF token
- `POST /admin/api/login` - Admin login (throttled 5 requests/minute)
- `GET /admin/api/auth/check` - Check admin authentication
- `GET /admin/api/auth/me` - Get current admin
- Protected routes (require `auth:admin` + `admin.authenticate`):
  - `POST /admin/api/logout`
  - `GET|PUT /admin/api/profile`
  - `/admin/api/admins/*` - Admin user management
  - `/admin/api/activities/*` - Activity log management
  - `/admin/api/users/*` - User management
  - `/admin/api/site-config` - Site configuration (Super Admin only)
- `GET /admin/{any?}` - Admin SPA (Vue Router handles frontend routes)

**Authentication**: All API routes (except login and check) require `auth:admin` + `admin.authenticate` middleware

**Session Handling**: Uses `AdminSessionMiddleware` for admin-specific session management

## Authentication Flow

### User Authentication Flow

1. **User visits app subdomain**: `app.virtualracingleagues.localhost:8000`
2. **Frontend checks authentication**: Calls `GET /api/me`
3. **If not authenticated**:
   - Frontend redirects to `virtualracingleagues.localhost:8000/login`
4. **User logs in on main domain**: `POST virtualracingleagues.localhost:8000/api/login`
5. **Session cookie set**: Cookie domain is `.virtualracingleagues.localhost` (shared across subdomains)
6. **Redirect to app subdomain**: `app.virtualracingleagues.localhost:8000`
7. **User now authenticated**: Can access all app subdomain routes

### Admin Authentication Flow

1. **Admin visits admin subdomain**: `admin.virtualracingleagues.localhost:8000/admin`
2. **Frontend checks authentication**: Calls `GET /admin/api/auth/check`
3. **If not authenticated**:
   - Frontend shows admin login form
4. **Admin logs in**: `POST admin.virtualracingleagues.localhost:8000/admin/api/login`
5. **Session cookie set**: Admin guard session
6. **Admin now authenticated**: Can access all protected admin routes

## Session Sharing Between Subdomains

### How It Works

**Session Cookie Configuration**:
```php
// config/session.php
'domain' => '.virtualracingleagues.localhost', // Leading dot is crucial!
'same_site' => 'lax',                      // Allows cross-subdomain requests
```

**Key Points**:
1. **Leading dot** (`.virtualracingleagues.localhost`) makes the cookie available to:
   - `virtualracingleagues.localhost`
   - `app.virtualracingleagues.localhost`
   - `admin.virtualracingleagues.localhost`
   - Any other `*.virtualracingleagues.localhost` subdomain

2. **Without leading dot** (`virtualracingleagues.localhost`), cookie would only be available to the exact domain

3. **SameSite=lax** allows cookies to be sent with cross-subdomain navigation while providing CSRF protection

### Authentication Guards

The application uses **two separate authentication guards**:

1. **`web` guard**: For regular users
   - Session cookie: `virtualracingleagues-user-session`
   - Shared between `virtualracingleagues.localhost` and `app.virtualracingleagues.localhost`
   - Model: `App\Models\User`

2. **`admin` guard**: For administrators
   - Session managed by `AdminSessionMiddleware`
   - Used on `admin.virtualracingleagues.localhost`
   - Model: `App\Infrastructure\Persistence\Eloquent\Models\Admin`

**Important**: These are **separate sessions**. A user authenticated on the `web` guard is NOT automatically authenticated on the `admin` guard, and vice versa.

## CSRF Protection

### How CSRF Works with Subdomains

1. **CSRF Cookie Route**: Each subdomain has a `/api/csrf-cookie` or `/admin/api/csrf-cookie` route
2. **Frontend must call this first**: Before any POST/PUT/DELETE requests
3. **Sanctum sets XSRF-TOKEN cookie**: This cookie is also set with domain `.virtualracingleagues.localhost`
4. **Frontend reads and sends**: Sanctum's middleware automatically validates

**Example Frontend Flow**:
```typescript
// 1. Get CSRF cookie (call once on app load)
await axios.get('/api/csrf-cookie');

// 2. Make authenticated request (CSRF token automatically sent)
await axios.post('/api/profile', { name: 'John Doe' });
```

### CSRF Exclusions

From `bootstrap/app.php`:
```php
$middleware->validateCsrfTokens(except: [
    'api/*',        // Handled by Sanctum
    'admin/api/*',  // Handled by Sanctum
]);
```

## Email Verification

### Email Verification Links

**Important**: Email verification links work on **both main domain and app subdomain**:

```php
// Main domain
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed'])
    ->name('verification.verify');

// App subdomain (same route)
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed'])
    ->name('verification.verify');
```

**Why both?**
- Users may register on the main domain (`virtualracingleagues.localhost`)
- Email links should work regardless of which subdomain the user is on
- After verification, redirect to appropriate subdomain (app or main)

## Testing the Configuration

### 1. Test Route Resolution

```bash
php artisan route:list | grep "virtualracingleagues"
```

Should show routes grouped by subdomain:
- `admin.virtualracingleagues.localhost/admin/api/*`
- `app.virtualracingleagues.localhost/api/*`
- `virtualracingleagues.localhost/api/*`

### 2. Test Session Cookie

```bash
# Start Laravel server
php artisan serve --host=0.0.0.0 --port=8000

# In browser DevTools:
# 1. Visit http://virtualracingleagues.localhost:8000
# 2. Check Application > Cookies
# 3. Cookie domain should be ".virtualracingleagues.localhost"
```

### 3. Test CSRF Cookie

```bash
curl -X GET http://virtualracingleagues.localhost:8000/api/csrf-cookie \
  -H "Accept: application/json" \
  -v
```

Should return:
```json
{"message":"CSRF cookie set"}
```

And set `XSRF-TOKEN` cookie with domain `.virtualracingleagues.localhost`

### 4. Test Cross-Subdomain Authentication

1. **Login on main domain**:
```bash
curl -X POST http://virtualracingleagues.localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt
```

2. **Check authentication on app subdomain**:
```bash
curl -X GET http://app.virtualracingleagues.localhost:8000/api/me \
  -H "Accept: application/json" \
  -b cookies.txt
```

Should return user data (session shared across subdomains)

## Important Notes

### 1. Session Cookie Domain

**Critical**: The `.env` file **MUST** have:
```env
SESSION_DOMAIN=.virtualracingleagues.localhost
```

**Leading dot is required** for cross-subdomain session sharing.

### 2. Sanctum Stateful Domains

**Critical**: The `.env` file **MUST** include all subdomains:
```env
SANCTUM_STATEFUL_DOMAINS=virtualracingleagues.localhost:8000,app.virtualracingleagues.localhost:8000,admin.virtualracingleagues.localhost:8000,localhost:5173
```

### 3. CORS Configuration

**Critical**: `config/cors.php` must include all subdomains in `allowed_origins` and have `supports_credentials => true`

### 4. Route Priority

Routes are matched in this order:
1. **Subdomain routes** (`routes/subdomain.php`)
2. **API routes** (`routes/api.php` - deprecated)
3. **Web fallback** (`routes/web.php`)

**Implication**: Subdomain routes take precedence over everything else

### 5. SPA Routing

Each subdomain has a catch-all route that renders the appropriate Vue SPA:
- `admin.virtualracingleagues.localhost/admin/{any?}` → `resources/views/admin.blade.php`
- `app.virtualracingleagues.localhost/{any?}` → `resources/views/app.blade.php`
- `virtualracingleagues.localhost/{any?}` → `resources/views/public.blade.php`

**Frontend Vue Router** handles all client-side routing within each SPA

### 6. Email Configuration

For email verification links to work correctly:
- `APP_URL` should be set to the **main domain**: `http://virtualracingleagues.localhost:8000`
- Laravel will generate signed URLs using this domain
- Both main and app subdomains have the verification route, so links work on either

### 7. Production Configuration

When deploying to production, update these values:

```env
# .env (production)
APP_URL=https://yourdomain.com
SESSION_DOMAIN=.yourdomain.com
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,app.yourdomain.com,admin.yourdomain.com
```

And update:
- `config/cors.php` → `allowed_origins`
- `config/sanctum.php` → `stateful` (fallback)
- `routes/subdomain.php` → domain names

## Troubleshooting

### Issue: Session not shared between subdomains

**Check**:
1. `.env` has `SESSION_DOMAIN=.virtualracingleagues.localhost` (with leading dot)
2. Browser DevTools shows cookie domain as `.virtualracingleagues.localhost`
3. Clear cache: `php artisan config:clear && php artisan cache:clear`

### Issue: CSRF token mismatch

**Check**:
1. Frontend is calling `/api/csrf-cookie` before authenticated requests
2. `XSRF-TOKEN` cookie is set with correct domain
3. Sanctum stateful domains include the subdomain you're testing
4. CORS is configured correctly with `supports_credentials: true`

### Issue: 401 Unauthorized on app subdomain

**Check**:
1. User is authenticated on main domain first (session cookie exists)
2. Session cookie domain is `.virtualracingleagues.localhost` (shared)
3. Frontend is sending cookies with requests (`withCredentials: true` in axios)
4. `UserAuthenticate` middleware is properly registered in `bootstrap/app.php`

### Issue: Routes not found

**Check**:
1. Clear route cache: `php artisan route:clear`
2. Verify subdomain in browser matches exactly (e.g., `app.virtualracingleagues.localhost:8000`)
3. Check `/etc/hosts` or DNS for subdomain resolution
4. Verify `routes/subdomain.php` is loaded first in `bootstrap/app.php`

## Next Steps

### Frontend Integration

1. **Update API Service URLs**:
   - Public site: `/api/*`
   - User app: `/api/*` (on app subdomain)
   - Admin: `/admin/api/*` (on admin subdomain)

2. **Add Authentication Checks**:
   - Public site: Check if user is authenticated, redirect to app subdomain
   - User app: Check authentication on mount, redirect to main domain if not authenticated
   - Admin: Check admin authentication on mount, show login if not authenticated

3. **Update Redirect Logic**:
   - After login on main domain → redirect to `http://app.virtualracingleagues.localhost:8000`
   - After logout on app subdomain → redirect to `http://virtualracingleagues.localhost:8000`

### Backend Enhancements

1. **Add User API Endpoints**: Create additional user-facing API endpoints in the app subdomain group
2. **Add Role-Based Permissions**: Extend middleware to check user roles/permissions
3. **Add Rate Limiting**: Configure throttle middleware per subdomain/route group
4. **Add API Logging**: Log API requests per subdomain for monitoring

## Summary

The Laravel backend now has a **clean, subdomain-based routing architecture** with:

- Clear separation between public, user, and admin routes
- Proper session sharing across subdomains
- Secure authentication with Sanctum
- CSRF protection for all state-changing requests
- Email verification support on multiple domains
- Fallback handling for invalid routes

All configuration files have been updated and are production-ready. The only remaining task is to update the frontend applications to use the correct subdomain URLs and handle authentication redirects.
