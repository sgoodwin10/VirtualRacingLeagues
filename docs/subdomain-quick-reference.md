# Subdomain Routing - Quick Reference

## Subdomain URLs

| Subdomain | URL | Purpose | Auth Required |
|-----------|-----|---------|---------------|
| **Main** | `http://virtualracingleagues.localhost:8000` | Public site, authentication | No |
| **App** | `http://app.virtualracingleagues.localhost:8000` | User dashboard | Yes (web guard) |
| **Admin** | `http://admin.virtualracingleagues.localhost:8000` | Admin dashboard | Yes (admin guard) |

## API Endpoints by Subdomain

### Main Domain (virtualracingleagues.localhost:8000)

**Public Routes** (No Auth):
- `GET /api/csrf-cookie` - Get CSRF token
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password

**Authenticated Routes** (web guard):
- `POST /api/logout` - Logout user
- `GET /api/me` - Get current user
- `POST /api/email/resend` - Resend verification email
- `PUT /api/profile` - Update profile

**Special Routes**:
- `GET /email/verify/{id}/{hash}` - Email verification (signed)

### App Subdomain (app.virtualracingleagues.localhost:8000)

**Public Routes**:
- `GET /api/csrf-cookie` - Get CSRF token
- `GET /api/me` - Get current user (checks auth)

**Authenticated Routes** (web guard + user.authenticate):
- `POST /api/logout` - Logout user
- `POST /api/email/resend` - Resend verification email
- `PUT /api/profile` - Update profile

**Special Routes**:
- `GET /email/verify/{id}/{hash}` - Email verification (signed)

### Admin Subdomain (admin.virtualracingleagues.localhost:8000)

**Public Routes**:
- `GET /admin/api/csrf-cookie` - Get CSRF token
- `POST /admin/api/login` - Admin login (throttled 5/min)
- `GET /admin/api/auth/check` - Check admin auth
- `GET /admin/api/auth/me` - Get current admin

**Authenticated Routes** (admin guard + admin.authenticate):
- `POST /admin/api/logout` - Logout admin
- `GET /admin/api/profile` - Get admin profile
- `PUT /admin/api/profile` - Update admin profile
- `GET /admin/api/admins` - List admins
- `POST /admin/api/admins` - Create admin
- `GET /admin/api/admins/{id}` - Show admin
- `PUT /admin/api/admins/{id}` - Update admin
- `DELETE /admin/api/admins/{id}` - Delete admin
- `POST /admin/api/admins/{id}/restore` - Restore admin
- `GET /admin/api/activities` - List activities
- `GET /admin/api/activities/{id}` - Show activity
- `GET /admin/api/users` - List users
- `POST /admin/api/users` - Create user
- `GET /admin/api/users/{user}` - Show user
- `PUT /admin/api/users/{user}` - Update user
- `DELETE /admin/api/users/{user}` - Delete user
- `POST /admin/api/users/{user}/restore` - Restore user
- `GET /admin/api/site-config` - Get site config (Super Admin)
- `PUT /admin/api/site-config` - Update site config (Super Admin)

## Frontend Usage

### Axios Configuration

**Main Domain** (`resources/public/js/services/api.ts`):
```typescript
const api = axios.create({
  baseURL: '/api', // Relative to virtualracingleagues.localhost:8000
  withCredentials: true, // Send cookies
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Get CSRF token before making requests
await axios.get('/api/csrf-cookie');
```

**App Subdomain** (`resources/user/js/services/api.ts`):
```typescript
const api = axios.create({
  baseURL: '/api', // Relative to app.virtualracingleagues.localhost:8000
  withCredentials: true, // Send cookies
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Get CSRF token before making requests
await axios.get('/api/csrf-cookie');
```

**Admin Subdomain** (`resources/admin/js/services/api.ts`):
```typescript
const api = axios.create({
  baseURL: '/admin/api', // Relative to admin.virtualracingleagues.localhost:8000
  withCredentials: true, // Send cookies
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Get CSRF token before making requests
await axios.get('/admin/api/csrf-cookie');
```

### Authentication Flow

**User Login Flow**:
```typescript
// 1. User on main domain (virtualracingleagues.localhost:8000)
// 2. Get CSRF token
await axios.get('/api/csrf-cookie');

// 3. Login
const response = await axios.post('/api/login', {
  email: 'user@example.com',
  password: 'password'
});

// 4. Redirect to app subdomain
window.location.href = 'http://app.virtualracingleagues.localhost:8000';
```

**Admin Login Flow**:
```typescript
// 1. Admin on admin subdomain (admin.virtualracingleagues.localhost:8000/admin)
// 2. Get CSRF token
await axios.get('/admin/api/csrf-cookie');

// 3. Login
const response = await axios.post('/admin/api/login', {
  email: 'admin@example.com',
  password: 'password'
});

// 4. Redirect to admin dashboard (same subdomain)
router.push('/admin/dashboard');
```

### Authentication Checks

**App Subdomain** (check on mount):
```typescript
// Check if user is authenticated
try {
  const { data } = await axios.get('/api/me');
  // User is authenticated, proceed
} catch (error) {
  // User not authenticated, redirect to main domain
  window.location.href = 'http://virtualracingleagues.localhost:8000/login';
}
```

**Admin Subdomain** (check on mount):
```typescript
// Check if admin is authenticated
try {
  const { data } = await axios.get('/admin/api/auth/me');
  // Admin is authenticated, proceed
} catch (error) {
  // Admin not authenticated, redirect to login
  router.push('/admin/login');
}
```

## Environment Variables

**Required in `.env`**:
```env
APP_URL=http://virtualracingleagues.localhost:8000
SESSION_DOMAIN=.virtualracingleagues.localhost
SANCTUM_STATEFUL_DOMAINS=virtualracingleagues.localhost:8000,app.virtualracingleagues.localhost:8000,admin.virtualracingleagues.localhost:8000,localhost:5173
```

## Common Commands

```bash
# Clear caches after configuration changes
php artisan config:clear && php artisan cache:clear && php artisan route:clear

# List all routes
php artisan route:list

# Count routes by subdomain
php artisan route:list | grep "admin.virtualracingleagues" | wc -l
php artisan route:list | grep "app.virtualracingleagues" | wc -l
php artisan route:list | grep "virtualracingleagues.localhost" | grep -v "admin\|app" | wc -l

# Check session configuration
php artisan config:show session | grep -E "(driver|domain|same_site|cookie)"
```

## Troubleshooting Checklist

**Session not shared?**
- [ ] `.env` has `SESSION_DOMAIN=.virtualracingleagues.localhost` (with leading dot)
- [ ] Run `php artisan config:clear`
- [ ] Check browser cookie domain is `.virtualracingleagues.localhost`

**CSRF token mismatch?**
- [ ] Frontend calls `/api/csrf-cookie` before authenticated requests
- [ ] `withCredentials: true` in axios config
- [ ] CORS configured with `supports_credentials: true`
- [ ] Sanctum stateful domains include your subdomain

**401 Unauthorized?**
- [ ] User is authenticated (check `/api/me`)
- [ ] Session cookie exists and has correct domain
- [ ] Frontend sends cookies (`withCredentials: true`)
- [ ] Middleware is properly configured

**Routes not found?**
- [ ] Run `php artisan route:clear`
- [ ] Check subdomain spelling (exact match required)
- [ ] Verify `/etc/hosts` has subdomain entries
- [ ] Verify `routes/subdomain.php` is loaded first

## Route Files

| File | Purpose | Status |
|------|---------|--------|
| `routes/subdomain.php` | **PRIMARY** - All subdomain routes | Active |
| `routes/web.php` | Fallback only | Minimal |
| `routes/api.php` | Deprecated | Empty |

**Rule**: Always add new routes to `routes/subdomain.php`

## Middleware

| Alias | Class | Purpose |
|-------|-------|---------|
| `admin.authenticate` | `AdminAuthenticate` | Verify admin is authenticated |
| `admin.role` | `AdminRole` | Check admin role/permissions |
| `user.authenticate` | `UserAuthenticate` | Verify user is authenticated |

**Usage**:
```php
// Require user authentication
Route::middleware(['auth:web', 'user.authenticate'])->group(function () {
    // Routes here
});

// Require admin authentication
Route::middleware(['auth:admin', 'admin.authenticate'])->group(function () {
    // Routes here
});
```

## Production Checklist

- [ ] Update `.env` with production domains
- [ ] Update `routes/subdomain.php` domain names
- [ ] Update `config/cors.php` allowed origins
- [ ] Set `SESSION_SECURE_COOKIE=true`
- [ ] Configure SSL/TLS certificates for all subdomains
- [ ] Update frontend API base URLs
- [ ] Test CORS and authentication on production domains
- [ ] Verify email links work on production domains
