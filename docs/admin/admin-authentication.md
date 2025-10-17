# Admin Authentication System

## Overview

This document provides a high-level overview of the admin authentication system implemented for the Laravel + Vue 3 application. The system uses session-based authentication with role-based access control (RBAC) for three admin roles: Super Admin, Admin, and Moderator.

## Architecture

### Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. POST /api/login
       │    {email, password, remember}
       ▼
┌─────────────────────────────────┐
│   Laravel Backend (API)         │
│  ┌──────────────────────────┐   │
│  │ AdminAuthController      │   │
│  │  - Validates credentials │   │
│  │  - Checks active status  │   │
│  │  - Creates session       │   │
│  │  - Updates last_login_at │   │
│  └──────────────────────────┘   │
└──────────┬──────────────────────┘
           │
           │ 2. Returns admin data + session cookie
           ▼
┌─────────────────────────────────┐
│   Vue Frontend (SPA)            │
│  ┌──────────────────────────┐   │
│  │ Pinia Store (adminStore) │   │
│  │  - Stores admin data     │   │
│  │  - Sets authenticated    │   │
│  │  - Saves to localStorage │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ Router Guards            │   │
│  │  - Checks auth status    │   │
│  │  - Validates roles       │   │
│  │  - Protects routes       │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Laravel 11.x with session-based authentication
- Separate `admin` guard (isolated from `web` guard)
- MySQL/MariaDB for admin user storage
- CSRF protection with Laravel Sanctum

**Frontend:**
- Vue 3 with Composition API and TypeScript
- Pinia for state management
- Vue Router with navigation guards
- PrimeVue components for UI
- Axios for API requests

## Backend Implementation

### Database Schema

**Table:** `admins`

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| first_name | varchar | Admin's first name |
| last_name | varchar | Admin's last name |
| email | varchar | Unique email address |
| password | varchar | Hashed password (bcrypt) |
| role | enum | super_admin, admin, moderator |
| status | enum | active, inactive |
| last_login_at | timestamp | Last successful login |
| remember_token | varchar | Remember me token |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Update timestamp |
| deleted_at | timestamp | Soft delete timestamp |

### Key Backend Files

#### 1. Model: `app/Models/Admin.php`
```php
- Extends Authenticatable
- Uses HasFactory, SoftDeletes
- Role checking: hasRole(), isSuperAdmin(), isAdmin(), isModerator()
- Permission checking: hasPermission()
- Status checking: isActive()
- Last login tracking: updateLastLogin()
```

#### 2. Controller: `app/Http/Controllers/Admin/AdminAuthController.php`
```php
POST /api/login
- Validates email and password
- Checks admin is active (rejects inactive admins)
- Attempts authentication with 'admin' guard
- Supports "remember me" functionality
- Updates last_login_at timestamp
- Returns admin data with role

POST /api/logout
- Logs out from admin guard
- Invalidates session
- Clears cookies

GET /api/me
- Returns current authenticated admin
- Used by frontend to check session

GET /api/check
- Returns authentication status
- Used for session validation
```

#### 3. Middleware: `app/Http/Middleware/AdminAuthenticate.php`
```php
- Checks if admin is authenticated using 'admin' guard
- Validates admin status is 'active'
- Returns 401 if not authenticated or inactive
```

#### 4. Middleware: `app/Http/Middleware/AdminRole.php`
```php
- Accepts role(s) as parameter(s)
- Checks if admin has required role
- Returns 403 if insufficient permissions
- Example: ->middleware('admin.role:super_admin,admin')
```

#### 5. Configuration: `config/auth.php`
```php
'guards' => [
    'admin' => [
        'driver' => 'session',
        'provider' => 'admins',
    ],
]

'providers' => [
    'admins' => [
        'driver' => 'eloquent',
        'model' => App\Models\Admin::class,
    ],
]
```

#### 6. Configuration: `config/admin_permissions.php`
Role-based permissions mapping:
- Super Admin: Full access to all features
- Admin: Moderate access (no user management, no settings)
- Moderator: Limited access (reports, analytics only)

### API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /api/login | No | Login with credentials |
| POST | /api/logout | Yes | Logout and clear session |
| GET | /api/me | Yes | Get current admin info |
| GET | /api/check | Yes | Check authentication status |

## Frontend Implementation

### Key Frontend Files

#### 1. Services: `resources/admin/js/services/`

**`api.ts`** - Axios instance
```typescript
- Base URL configuration
- CSRF token injection from meta tag
- withCredentials for session cookies
- Response interceptors:
  - 401: Clear auth state, redirect to login
  - 419: CSRF token mismatch, refresh page
```

**`authService.ts`** - Authentication API
```typescript
login(credentials) - POST /api/login
logout() - POST /api/logout
checkAuth() - GET /api/check
- Handles remember me with localStorage
- Comprehensive error handling
```

#### 2. Store: `resources/admin/js/stores/adminStore.ts`
```typescript
State:
- admin: Admin | null
- isAuthenticated: boolean
- isLoading: boolean

Getters:
- adminName, adminEmail, adminRole
- hasRole(role), isSuperAdmin, isAdmin

Actions:
- login(credentials) - Authenticate and store admin
- logout() - Clear session and state
- checkAuth() - Validate current session
```

#### 3. Router: `resources/admin/js/router/index.ts`

**Routes:**
- `/login` - Public login page
- `/*` - Protected admin routes

**Navigation Guard:**
```typescript
beforeEach():
1. Check if route is public
2. If protected, verify authentication
3. Check role-based permissions
4. Redirect to login if not authenticated
5. Redirect to dashboard if insufficient role
```

**Route Meta Properties:**
```typescript
{
  requiresAuth: true,           // Requires authentication
  requiredRole: 'admin',         // Minimum role required
  isPublic: true,                // Public route (no auth)
}
```

**Role Hierarchy:**
```
super_admin (level 3) > admin (level 2) > moderator (level 1)
```

If a route requires `admin` role:
- ✅ super_admin can access (level 3 >= 2)
- ✅ admin can access (level 2 >= 2)
- ❌ moderator cannot access (level 1 < 2)

#### 4. Views: `resources/admin/js/views/AdminLoginView.vue`
Professional login page featuring:
- Email and password fields with validation
- "Remember me" checkbox (30-day sessions)
- Loading states during authentication
- Error message display
- Matches admin white/grey theme
- Responsive design
- No password reset link (as per requirements)

#### 5. Layout: `resources/admin/js/components/layout/AppTopbar.vue`
Updated to display:
- Admin's full name
- Role badge with color coding:
  - Purple: Super Admin
  - Blue: Admin
  - Green: Moderator
- Logout button in user menu
- Admin initials avatar

### Type Definitions: `resources/admin/js/types/admin.ts`

```typescript
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface Admin {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'active' | 'inactive';
  last_login_at: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}
```

## Security Features

### Session-Based Authentication
- Uses Laravel's session driver (not token-based)
- HttpOnly cookies prevent XSS attacks
- Secure cookies in production (HTTPS)
- Session regeneration on login prevents fixation

### CSRF Protection
- CSRF token in meta tag: `<meta name="csrf-token" content="...">`
- Axios automatically includes token in requests
- Laravel validates token on state-changing requests
- Automatic token refresh on 419 errors

### Role-Based Access Control
- Three-tier hierarchy: super_admin > admin > moderator
- Middleware enforces role requirements on backend
- Router guards enforce role requirements on frontend
- Granular permission system in config

### Additional Security
- Password hashing with bcrypt
- Active status checking (inactive admins rejected)
- Remember token for persistent sessions
- Soft deletes for admin accounts
- Last login tracking for audit trail
- Session timeout handling

## Role Permissions

### Super Admin (Level 3)
- **Full Access:** All features and settings
- User management (create, edit, delete admins)
- System settings configuration
- All data management (leagues, races, users)
- Analytics and reports

### Admin (Level 2)
- **Moderate Access:** Most features except critical settings
- Cannot manage other admins
- Cannot modify system settings
- Can manage leagues, races, and users
- Access to analytics and reports

### Moderator (Level 1)
- **Limited Access:** Read-only and basic moderation
- Cannot manage users or admins
- Cannot modify settings
- Read-only access to leagues and races
- Can access analytics and reports
- Basic content moderation

## Setup Instructions

### 1. Database Setup
```bash
# Run migrations to create admins table
php artisan migrate

# Seed super admin user
php artisan db:seed

# Output will show:
# ============================================
# Super Admin Account Created Successfully!
# ============================================
# Email: admin@example.com
# Password: [randomly-generated-16-char-password]
# IMPORTANT: Save these credentials securely!
# ============================================
```

### 2. Frontend Build
```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev

# Or build for production
npm run build
```

### 3. Testing the System

**Login:**
1. Visit `/login`
2. Enter super admin credentials from seeder output
3. Check "Remember me" for persistent session
4. Click "Sign In"
5. Should redirect to `/` dashboard

**Role Testing:**
Create additional admins with different roles:
```php
Admin::create([
    'first_name' => 'Test',
    'last_name' => 'Admin',
    'email' => 'test@example.com',
    'password' => Hash::make('password'),
    'role' => 'admin',
    'status' => 'active',
]);
```

**Protected Routes:**
- Try accessing `/settings` as moderator (should redirect to dashboard)
- Try accessing `/settings` as admin or super_admin (should allow)

## Troubleshooting

### Login Fails with 419 Error
- **Issue:** CSRF token mismatch
- **Solution:** Ensure `<meta name="csrf-token">` exists in `resources/views/admin.blade.php`
- **Check:** Visit `/sanctum/csrf-cookie` to refresh token

### Session Not Persisting
- **Issue:** Cookies not being sent/received
- **Solution:** Check `SESSION_DRIVER=cookie` in `.env`
- **Check:** Ensure `SESSION_DOMAIN` matches your domain
- **Check:** Axios `withCredentials: true` is set

### Cannot Access Protected Routes
- **Issue:** Router guard blocking access
- **Solution:** Check browser console for auth check errors
- **Check:** Verify backend `/api/check` returns 200
- **Check:** Ensure admin status is 'active' in database

### Role-Based Access Not Working
- **Issue:** Router not checking roles correctly
- **Solution:** Verify route meta has `requiredRole` set
- **Check:** Ensure admin role in database matches role enum
- **Check:** Review `checkRoleAccess()` function in router

### Logout Not Working
- **Issue:** Session not being destroyed
- **Solution:** Check `/api/logout` endpoint
- **Check:** Verify cookies are cleared after logout
- **Check:** Ensure localStorage is cleared

## Future Enhancements

### Recommended Additions
1. **Two-Factor Authentication (2FA)**
   - Add TOTP support with Google Authenticator
   - Add backup codes

2. **Session Timeout Warnings**
   - Show modal 5 minutes before session expires
   - Allow extending session without re-login

3. **Login History**
   - Track all login attempts (successful and failed)
   - Show IP addresses and user agents
   - Email notifications for suspicious activity

4. **Password Reset (If Needed)**
   - Although not required initially, may be useful
   - Use Laravel's password reset functionality
   - Send reset emails with secure tokens

5. **Admin Activity Log**
   - Track all admin actions
   - Create audit trail for compliance
   - Log data changes with before/after values

6. **Rate Limiting**
   - Throttle login attempts
   - Prevent brute force attacks
   - Add captcha after failed attempts

## File Reference

### Backend Files Created
```
app/Models/Admin.php
app/Http/Controllers/Admin/AdminAuthController.php
app/Http/Middleware/AdminAuthenticate.php
app/Http/Middleware/AdminRole.php
config/admin_permissions.php
routes/api.php
```

### Backend Files Modified
```
config/auth.php
bootstrap/app.php
database/seeders/DatabaseSeeder.php
```

### Frontend Files Created
```
resources/admin/js/services/api.ts
resources/admin/js/services/authService.ts
resources/admin/js/types/admin.ts
resources/admin/js/views/AdminLoginView.vue
```

### Frontend Files Modified
```
resources/admin/js/stores/adminStore.ts
resources/admin/js/router/index.ts
resources/admin/js/app.ts
resources/admin/js/components/layout/AppTopbar.vue
```

## API Testing Examples

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <csrf-token>" \
  -b cookies.txt -c cookies.txt \
  -d '{"email":"admin@example.com","password":"your-password","remember":true}'
```

**Check Auth:**
```bash
curl -X GET http://localhost:8000/api/check \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <csrf-token>" \
  -b cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:8000/api/logout \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: <csrf-token>" \
  -b cookies.txt
```

### Using Postman

1. Import the API endpoints
2. Set environment variable: `base_url = http://localhost:8000`
3. Enable "Save Cookies" in Postman settings
4. First request: GET `/sanctum/csrf-cookie` to get CSRF token
5. Subsequent requests: Include `X-XSRF-TOKEN` header

## Conclusion

This admin authentication system provides a secure, scalable, and maintainable solution for managing administrative access to the application. The session-based approach with role-based access control ensures proper security while maintaining a smooth user experience.

The system is production-ready and follows Laravel and Vue.js best practices. All code is fully typed with TypeScript and includes comprehensive error handling.

For questions or issues, refer to the troubleshooting section or review the implementation details in the referenced files.
