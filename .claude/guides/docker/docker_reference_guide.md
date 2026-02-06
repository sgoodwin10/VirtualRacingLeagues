# Docker Reference Guide

Quick reference for the Laravel Docker environment. All commands run from `/var/www`.

## Container Overview

| Service | Container | Internal | External | Image |
|---------|-----------|----------|----------|-------|
| PHP-FPM + Node.js | `${DOCKER_CONTAINER_NAME}-app` | 9000 | 5174 (Vite) | Custom (PHP 8.4-fpm Debian) |
| Nginx | `${DOCKER_CONTAINER_NAME}-nginx` | 80 | 8000 | nginx:alpine |
| MariaDB | `${DOCKER_CONTAINER_NAME}-mariadb` | 3306 | 3308 | mariadb:10.11 |
| Redis | `${DOCKER_CONTAINER_NAME}-redis` | 6379 | 6379 | redis:7-alpine |
| Elasticsearch | `${DOCKER_CONTAINER_NAME}-elasticsearch` | 9200/9300 | 9200/9300 | elasticsearch:8.11.0 (optional profile) |
| Mailpit | `${DOCKER_CONTAINER_NAME}-mailpit` | 1025/8025 | 1026/8026 | axllent/mailpit |
| Horizon | `${DOCKER_CONTAINER_NAME}-horizon` | - | - | Custom (same as app) |

## Container Management

```bash
# Start/stop
docker-compose up -d
docker-compose down
docker-compose restart <service>

# View status and logs
docker-compose ps
docker-compose logs -f <service>
```

## Development Stage (Dockerfile)

The Dockerfile uses multi-stage builds:

### Base Stage (Production)
- PHP 8.4 FPM on Debian
- PHP extensions: GD, ImageMagick, Redis, PDO MySQL, ZIP, PCOV
- Composer installed
- User `laravel` (uid 1000) with Zsh/Oh-My-Zsh

### Development Stage (extends base)
- Node.js 24.x from NodeSource
- Playwright Chromium only v1.56.0
- Playwright system dependencies for Chromium
- npm global packages: Claude Code, CCStatusline, Context7 MCP
- Playwright MCP configured
- Entrypoint script handles initialization

**Playwright-specific Docker configurations:**
- `init: true` - Prevents zombie browser processes
- `ipc: host` - Prevents Chromium memory exhaustion crashes
- `cap_add: SYS_ADMIN` - Required for Chromium sandboxing in development
- Chromium browser cache persisted to `playwright_browsers` volume

## Entrypoint Script (`docker/app/docker-entrypoint.sh`)

Runs on container start (as root, then drops to `laravel` user):

1. Waits for database health check
2. Installs Composer dependencies (if missing)
3. Installs npm dependencies (if missing)
4. Runs migrations (unless `SKIP_MIGRATIONS=true`)
5. Generates APP_KEY (if not set)
6. Clears caches
7. Configures /etc/hosts for E2E tests (nginx IP → subdomains)
8. Configures CCStatusline settings
9. Configures Context7 MCP (if `CLAUDE_CONTEXT7_MCP_API_KEY` set)
10. Drops to `laravel` user and runs PHP-FPM

## Volumes

### Delegated mounts (performance)
- `./:/var/www:delegated` - Project files

### Named volumes (cache/dependencies)
- `vendor` - Composer packages
- `node_modules` - npm packages
- `composer_cache` - Composer cache
- `npm_cache` - npm cache
- `npm_global` - npm global packages
- `playwright_browsers` - Playwright Chromium browser binary
- `mariadb_data` - Database
- `redis_data` - Redis persistence
- `elasticsearch_data` - Search indices

## Database Access

### MariaDB
```bash
# From host
mysql -h 127.0.0.1 -P 3308 -u laravel -psecret ${DB_DATABASE}

# From container
mysql -h mariadb -u laravel -psecret ${DB_DATABASE}
```

**Credentials:** laravel/secret on port 3308 (host) or mariadb:3306 (container)

### Redis
```bash
# From host
redis-cli -h 127.0.0.1 -p 6379

# From container
redis-cli
```

**No password configured.**

## Nginx Configuration (`docker/nginx/conf.d/default.conf.template`)

- Listens on port 80 (mapped to 8000 on host)
- Passes PHP requests to `app:9000`
- CORS headers for `/build/` (Vite assets)
- SPA fallback: `try_files $uri $uri/ /index.php`

## Horizon (Queue Worker)

- Runs `php artisan horizon` continuously
- Uses same base image as app container
- Depends on Redis and MariaDB
- Restart policy: unless-stopped

## PHP Configuration (`docker/php/local.ini`)

```ini
upload_max_filesize=40M
post_max_size=40M
memory_limit=512M
max_execution_time=300
```

## E2E Testing Host Resolution

Entrypoint script adds nginx container IP to `/etc/hosts` for Playwright tests inside container.

## Health Checks

- **app**: `php-fpm-healthcheck` every 30s
- **mariadb**: `healthcheck.sh --connect --innodb_initialized` every 5s
- **horizon**: `php artisan horizon:status` every 30s

## Mailpit (Email Testing)

- **Web UI:** http://localhost:8026
- **SMTP:** mailpit:1025 (internal) or localhost:1026 (host)

All Laravel emails are caught and displayed in the UI.

## Running Tests

```bash
# PHP
composer test              # PHPUnit
composer phpstan           # Static analysis
composer phpcs             # Code style

# JavaScript
npm test                   # Vitest (all apps)
npm run test:app           # App dashboard
npm run test:admin         # Admin dashboard

# Playwright E2E Tests (Browser-based)
npm run test:e2e           # Run all E2E tests (headless)
npm run test:e2e:admin     # Run admin E2E tests only
npm run test:e2e:ui        # Run with Playwright UI (interactive debugging)
npm run test:e2e:headed    # Run with visible browser (non-headless)
```

## Common Commands

```bash
# Artisan
php artisan migrate
php artisan cache:clear
php artisan queue:work

# Dependencies
composer install
npm install

# Development
npm run dev                # Vite dev server (port 5174 on host)
composer dev               # Runs all services (Laravel + queue + Vite)
```

## Elasticsearch (Optional)

- **Profile:** `elasticsearch` (start with `docker-compose --profile elasticsearch up -d`)
- **Host:** elasticsearch:9200 (container) or localhost:9200 (host)
- **Mode:** Single-node
- **Security:** Disabled (`xpack.security.enabled=false`)

```bash
curl http://localhost:9200/_cluster/health?pretty
```

## Playwright E2E Testing

### Architecture

**Same-Container Approach** (Industry Best Practice):
- Playwright runs inside the `app` container alongside Node.js and Laravel
- Tests execute against nginx container via internal Docker network
- Fast execution (no network overhead between containers)
- Simple configuration and debugging

### Configuration

**Playwright Version:** 1.56.0 (pinned to match package.json)

**Docker Settings (docker-compose.yml):**
```yaml
init: true           # Prevents zombie browser processes
ipc: host            # Prevents Chromium memory exhaustion crashes
cap_add:
  - SYS_ADMIN        # Required for Chromium sandboxing
environment:
  - PLAYWRIGHT_BROWSERS_PATH=/home/laravel/.cache/playwright
```

**Browser Binaries:**
- Chromium only installed during image build
- Cached in `playwright_browsers` named volume for performance
- Version synchronized with `@playwright/test` npm package

### Running Tests

```bash
# Inside container (recommended - tests use internal Docker network)
npm run test:e2e              # All E2E tests (headless)
npm run test:e2e:admin        # Admin tests only
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e:headed       # Visible browser

# Run specific test file
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts

# Debug mode
npx playwright test --debug
```

### Subdomain Resolution

E2E tests work with all three subdomains:
- `virtualracingleagues.localhost` (public site)
- `app.virtualracingleagues.localhost` (user dashboard)
- `admin.virtualracingleagues.localhost` (admin dashboard)

**How it works:**
1. Entrypoint script (`docker/app/docker-entrypoint.sh`) dynamically adds nginx container IP to `/etc/hosts`
2. Playwright resolves subdomains to nginx container internally

**Entrypoint snippet (lines 93-114):**
```bash
# Get nginx container IP and add to /etc/hosts for E2E testing
NGINX_IP=$(getent hosts nginx | awk '{ print $1 }')
if [ ! -z "$NGINX_IP" ]; then
    echo "$NGINX_IP virtualracingleagues.localhost" >> /etc/hosts
    echo "$NGINX_IP app.virtualracingleagues.localhost" >> /etc/hosts
    echo "$NGINX_IP admin.virtualracingleagues.localhost" >> /etc/hosts
fi
```

### Test Organization

```
tests/Browser/
├── admin/                    # Admin dashboard tests
│   ├── auth/
│   │   └── admin-login.spec.ts
│   └── helpers/              # Test utilities
│       └── admin-helpers.ts
└── playwright.config.ts      # Shared configuration
```

### Best Practices

1. **Run tests inside container** - Ensures consistent environment
2. **Use headless mode** - Faster execution for CI/CD
3. **Use UI mode for debugging** - `npm run test:e2e:ui`
4. **Leverage helpers** - Reusable test utilities in `helpers/` directories
5. **Version consistency** - Keep Dockerfile and package.json versions synced

### Troubleshooting Playwright

#### Browser crashes with "Target closed"
**Cause:** Chromium memory exhaustion
**Solution:** Ensure `ipc: host` is set in docker-compose.yml

#### "Executable doesn't exist" error
**Cause:** Playwright version mismatch
**Solution:** Rebuild container after version changes
```bash
docker-compose build --no-cache app
docker-compose up -d app
```

#### Tests can't reach subdomains
**Cause:** /etc/hosts not configured
**Solution:** Check entrypoint logs
```bash
docker-compose logs app | grep "nginx"
```

Should see:
```
Successfully configured /etc/hosts for E2E testing
  nginx container IP: 172.x.x.x
```

#### Slow test execution
**Cause:** Browser binaries downloading on each run
**Solution:** Verify `playwright_browsers` volume is mounted
```bash
docker volume ls | grep playwright
```

#### Permission errors
**Cause:** Browser cache directory owned by root
**Solution:**
```bash
docker exec -it -u root ${DOCKER_CONTAINER_NAME}-app chown -R laravel:laravel /home/laravel/.cache/playwright
```

#### Zombie processes accumulating
**Cause:** Missing init process
**Solution:** Ensure `init: true` is set in docker-compose.yml

### CI/CD Considerations

For production CI pipelines, consider:
- Using official Playwright Docker image: `mcr.microsoft.com/playwright:v1.56.0-jammy`
- Running tests in parallel across multiple containers
- Caching `playwright_browsers` volume between runs
- Using `--shard` flag for distributed execution

### Why Not Separate Container?

**Separate Playwright container is NOT recommended because:**
- Adds network latency and complexity
- Requires version synchronization between containers
- Complicates debugging and development workflow
- Goes against industry best practices for Node.js + Playwright stacks
- No clear benefit for this project's scale

**Use separate container ONLY if:**
- Running thousands of tests requiring distributed execution
- Using Kubernetes for horizontal scaling
- Separate teams managing backend vs frontend testing infrastructure

## Troubleshooting

### Container won't start
```bash
docker-compose logs <service>
docker-compose build --no-cache <service>
docker-compose up -d --force-recreate <service>
```

### Permission issues
```bash
docker exec -it -u root ${DOCKER_CONTAINER_NAME}-app chown -R laravel:laravel /var/www/storage
docker exec -it -u root ${DOCKER_CONTAINER_NAME}-app chmod -R 775 /var/www/storage
```

### Nuclear option (deletes all data)
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Environment Variables

Key variables from `.env`:

- `DOCKER_CONTAINER_NAME` - Container prefix
- `DOCKER_NETWORK_NAME` - Network name
- `APP_ROOT_DOMAIN` - Base domain (e.g., `virtualracingleagues.localhost`)
- `SESSION_DOMAIN` - Must start with `.` for subdomain sharing
- `CLAUDE_CONTEXT7_MCP_API_KEY` - Context7 API key (optional)
- `SKIP_MIGRATIONS` - Skip migrations on start (default: false)
- `FAIL_ON_MIGRATION_ERROR` - Exit on migration failure (default: true)

## URLs

- Public Site: http://${APP_ROOT_DOMAIN}:8000
- User Dashboard: http://app.${APP_ROOT_DOMAIN}:8000
- Admin Dashboard: http://admin.${APP_ROOT_DOMAIN}:8000/admin
- Mailpit: http://localhost:8026
- Elasticsearch: http://localhost:9200
- Vite HMR: http://localhost:5174
