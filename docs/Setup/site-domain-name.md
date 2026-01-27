# Changing the Site Domain Name

This guide explains all the locations where the domain name is configured and the steps required to change it across the entire application.

## Overview

The application uses a multi-subdomain architecture with three separate SPAs:
- **Public Site**: `<domain>` (e.g., `mysite.localhost`)
- **User Dashboard**: `app.<domain>` (e.g., `app.mysite.localhost`)
- **Admin Dashboard**: `admin.<domain>` (e.g., `admin.mysite.localhost`)

Session cookies are shared across all subdomains via the `SESSION_DOMAIN` setting.

---

## Quick Start (Development)

The system is designed so that **most configuration cascades from `APP_ROOT_DOMAIN`**. Only a few files need manual updates.

### Step 1: Update `.env` File

Edit `.env` and update these variables:

```env
# PRIMARY - Everything cascades from this
APP_ROOT_DOMAIN=yournewdomain.localhost

# These should match your new domain
VITE_APP_DOMAIN=app.yournewdomain.localhost
VITE_ADMIN_DOMAIN=admin.yournewdomain.localhost
VITE_PUBLIC_DOMAIN=yournewdomain.localhost
TEST_DOMAIN=yournewdomain.localhost

# Optional - for organization
APP_NAME="Your New App Name"
DOCKER_CONTAINER_NAME=yournewdomain
DOCKER_NETWORK_NAME=yournewdomain
DB_DATABASE=yournewdomain
MAIL_FROM_ADDRESS="hello@yournewdomain.com"
```

### Step 2: Update Host Machine `/etc/hosts`

Add entries to your host machine's `/etc/hosts` file:

```
127.0.0.1 yournewdomain.localhost
127.0.0.1 app.yournewdomain.localhost
127.0.0.1 admin.yournewdomain.localhost
```

### Step 3: Restart Docker and Clear Caches

```bash
docker-compose down
docker-compose up -d
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## What Auto-Updates from `APP_ROOT_DOMAIN`

These configurations automatically use `APP_ROOT_DOMAIN` and require **no manual changes**:

| File | Configuration |
|------|---------------|
| `.env` | `APP_URL`, `ADMIN_URL`, `USER_URL`, `SESSION_DOMAIN` |
| `config/app.php` | `domain` setting |
| `config/session.php` | `domain` setting (with leading dot) |
| `config/sanctum.php` | Fallback stateful domains |
| `config/cors.php` | `allowed_origins` array |
| `docker/nginx/conf.d/default.conf.template` | `server_name` directive |
| `routes/subdomain.php` | Base domain for routing |
| `playwright.config.ts` | Test domain and host resolver rules |
| `docker-compose.yml` | Container and network names |

---

## Files Requiring Manual Updates

Only these files need manual changes when switching domains:

### 1. `.env` - Environment Variables

| Variable | Description |
|----------|-------------|
| `APP_ROOT_DOMAIN` | **Primary** - cascades to most config |
| `VITE_APP_DOMAIN` | Frontend app subdomain |
| `VITE_ADMIN_DOMAIN` | Frontend admin subdomain |
| `VITE_PUBLIC_DOMAIN` | Frontend public domain |
| `TEST_DOMAIN` | Playwright test domain |
| `MAIL_FROM_ADDRESS` | Email sender address |

### 2. Host Machine `/etc/hosts`

```
127.0.0.1 yournewdomain.localhost
127.0.0.1 app.yournewdomain.localhost
127.0.0.1 admin.yournewdomain.localhost
```

---

## Complete Environment Variable Reference

### Variables That Cascade (Auto-Update)

These use `${APP_ROOT_DOMAIN}` syntax and update automatically:

```env
APP_URL=http://${APP_ROOT_DOMAIN}:8000
ADMIN_URL=http://admin.${APP_ROOT_DOMAIN}:8000
USER_URL=http://app.${APP_ROOT_DOMAIN}:8000
SESSION_DOMAIN=.${APP_ROOT_DOMAIN}
```

### Variables Requiring Manual Update

These must be explicitly set:

```env
VITE_APP_DOMAIN=app.yournewdomain.localhost
VITE_ADMIN_DOMAIN=admin.yournewdomain.localhost
VITE_PUBLIC_DOMAIN=yournewdomain.localhost
SANCTUM_STATEFUL_DOMAINS=yournewdomain.localhost,app.yournewdomain.localhost,admin.yournewdomain.localhost,localhost:5173
TEST_DOMAIN=yournewdomain.localhost
MAIL_FROM_ADDRESS=hello@yournewdomain.com
```

> **Note**: `SANCTUM_STATEFUL_DOMAINS` is optional - if not set, it falls back to using `APP_ROOT_DOMAIN`.

---

## Production Deployment Checklist

When deploying to production with a real domain (e.g., `mysite.com`):

### 1. Environment Variables

```env
APP_ROOT_DOMAIN=mysite.com
APP_URL=https://mysite.com
ADMIN_URL=https://admin.mysite.com
USER_URL=https://app.mysite.com

SESSION_DOMAIN=.mysite.com
SESSION_SECURE_COOKIE=true

VITE_APP_DOMAIN=app.mysite.com
VITE_ADMIN_DOMAIN=admin.mysite.com
VITE_PUBLIC_DOMAIN=mysite.com

MAIL_FROM_ADDRESS=hello@mysite.com
```

### 2. SSL/TLS Configuration

Ensure your web server has SSL certificates for:
- `mysite.com`
- `app.mysite.com`
- `admin.mysite.com`

Consider using a wildcard certificate for `*.mysite.com`.

### 3. DNS Configuration

Create DNS A or CNAME records:
- `mysite.com` -> Your server IP
- `app.mysite.com` -> Your server IP
- `admin.mysite.com` -> Your server IP

### 4. Nginx Server Block

```nginx
server {
    listen 443 ssl;
    server_name *.mysite.com mysite.com;
    # ... SSL and other configuration
}
```

---

## Troubleshooting

### Session Not Shared Across Subdomains

**Symptom**: User logs in on public site but is not authenticated on app subdomain.

**Solution**: Ensure `SESSION_DOMAIN` has a leading dot:
```env
SESSION_DOMAIN=.mysite.com  # Correct
SESSION_DOMAIN=mysite.com   # Wrong
```

### CORS Errors

**Symptom**: API requests fail with CORS errors in browser console.

**Solution**:
1. Verify `APP_ROOT_DOMAIN` is set correctly
2. Run `php artisan config:clear` to reload config
3. Check browser network tab for the actual origin being blocked

### Vite HMR Not Working

**Symptom**: Hot module replacement doesn't work during development.

**Solution**: Ensure `VITE_*_DOMAIN` variables match your actual domain and restart the Vite dev server.

### Playwright Tests Failing

**Symptom**: E2E tests can't connect to the application.

**Solution**:
1. Verify `TEST_DOMAIN` is set in `.env`
2. Update `NGINX_CONTAINER_IP` if your Docker network uses different IPs
3. Ensure `/etc/hosts` entries exist in the container

---

## Summary

**Minimum changes for domain switch**:
1. `.env` - Update `APP_ROOT_DOMAIN` and `VITE_*_DOMAIN` variables
2. `/etc/hosts` on host machine - Add domain entries

**Files that auto-update from `APP_ROOT_DOMAIN`**:
- `config/app.php`
- `config/session.php`
- `config/sanctum.php`
- `config/cors.php`
- `docker/nginx/conf.d/default.conf.template` (via envsubst)
- `routes/subdomain.php`
- `playwright.config.ts`
- `docker-compose.yml`
