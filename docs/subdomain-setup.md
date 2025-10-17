# Subdomain Architecture Setup

This document outlines the subdomain architecture implementation and required environment variables.

## Architecture Overview

The application uses a subdomain-based architecture with three distinct areas:

- **`generictemplate.localhost`** - Public marketing/landing pages and authentication flows
- **`admin.generictemplate.localhost`** - Admin dashboard (separate session)
- **`app.generictemplate.localhost`** - Authenticated user area (separate session)

## Required Environment Variables

Add these environment variables to your `.env` file:

```env
# Application Domain Configuration
APP_DOMAIN=generictemplate.localhost
ADMIN_SUBDOMAIN=admin
APP_SUBDOMAIN=app

# Session Configuration
SESSION_DOMAIN=.generictemplate.localhost
SESSION_COOKIE=generictemplate-user-session
ADMIN_SESSION_COOKIE=generictemplate-admin-session

# Application URLs
APP_URL=http://generictemplate.localhost:8000
ADMIN_URL=http://admin.generictemplate.localhost:8000
APP_SUBDOMAIN_URL=http://app.generictemplate.localhost:8000

# CORS Configuration
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1,generictemplate.localhost,admin.generictemplate.localhost,app.generictemplate.localhost

# Vite Configuration
VITE_APP_NAME="Your App Name"
VITE_API_BASE_URL=http://generictemplate.localhost:8000
```

## Development Setup

### 1. Hosts File Configuration

Add these entries to your `/etc/hosts` file (or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```
127.0.0.1 generictemplate.localhost
127.0.0.1 admin.generictemplate.localhost
127.0.0.1 app.generictemplate.localhost
```

### 2. Docker Configuration

The nginx configuration has been updated to handle wildcard subdomains:

```nginx
server {
    listen 80;
    server_name *.generictemplate.localhost generictemplate.localhost;
    # ... rest of configuration
}
```

### 3. Session Management

- **User sessions**: Use `generictemplate-user-session` cookie
- **Admin sessions**: Use `generictemplate-admin-session` cookie
- Both sessions share the `.generictemplate.localhost` domain for cross-subdomain access

### 4. Frontend Applications

#### Public Site (`resources/public/`)
- Landing page and marketing content
- Authentication forms (login, register, forgot password)
- Redirects to `app.generictemplate.localhost` after successful login

#### User App (`resources/user/`)
- Authenticated user dashboard
- Runs on `app.generictemplate.localhost`
- API endpoints: `/api/*`

#### Admin App (`resources/admin/`)
- Admin dashboard
- Runs on `admin.generictemplate.localhost`
- API endpoints: `/admin/api/*`

## Authentication Flow

### User Authentication
1. User visits `generictemplate.localhost`
2. Clicks login/register
3. After successful authentication, redirects to `app.generictemplate.localhost`
4. User session is maintained across subdomains

### Admin Authentication
1. Admin visits `admin.generictemplate.localhost`
2. Admin login form
3. Admin session is separate from user session
4. Admin can potentially "login as user" (future feature)

## API Endpoints

### Public Domain (`generictemplate.localhost`)
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/forgot-password` - Password reset request
- `POST /api/reset-password` - Password reset

### App Subdomain (`app.generictemplate.localhost`)
- `GET /api/me` - Get current user
- `POST /api/logout` - User logout
- `PUT /api/profile` - Update user profile
- `POST /api/email/resend` - Resend email verification

### Admin Subdomain (`admin.generictemplate.localhost`)
- `POST /admin/api/login` - Admin login
- `GET /admin/api/me` - Get current admin
- `POST /admin/api/logout` - Admin logout
- `GET /admin/api/users` - List users
- `GET /admin/api/admins` - List admins
- `GET /admin/api/activities` - Activity logs
- `GET /admin/api/site-config` - Site configuration

## Development Commands

```bash
# Start the development environment
docker-compose up -d

# Install dependencies
composer install
npm install

# Build assets
npm run build

# Run in development mode
npm run dev

# Run tests
composer test
npm run test
```

## Testing the Setup

1. **Public Site**: Visit `http://generictemplate.localhost:8000`
2. **User App**: Visit `http://app.generictemplate.localhost:8000`
3. **Admin App**: Visit `http://admin.generictemplate.localhost:8000`

## Troubleshooting

### Common Issues

1. **Subdomain not resolving**: Check your hosts file configuration
2. **Session not persisting**: Verify `SESSION_DOMAIN` is set to `.generictemplate.localhost`
3. **CORS errors**: Check `SANCTUM_STATEFUL_DOMAINS` includes all subdomains
4. **Vite HMR not working**: Ensure `VITE_APP_NAME` and `VITE_API_BASE_URL` are set

### Debug Commands

```bash
# Check if subdomains resolve
ping admin.generictemplate.localhost
ping app.generictemplate.localhost

# Check Docker containers
docker-compose ps

# Check nginx configuration
docker-compose exec nginx nginx -t

# Check Laravel routes
php artisan route:list
```

## Future Enhancements

- Admin "login as user" functionality
- Cross-subdomain session sharing for admin impersonation
- Enhanced security logging for subdomain access
- SSL/TLS configuration for production

