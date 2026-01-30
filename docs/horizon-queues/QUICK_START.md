# Laravel Horizon Quick Start Guide

## Starting Horizon

### Development (Local)

**Option 1: Composer Script (Recommended)**
```bash
composer dev
```
This starts Laravel server, Horizon, logs, and Vite dev server all together.

**Option 2: Manual**
```bash
php artisan horizon
```

**Option 3: Docker Container**
```bash
docker-compose up -d horizon
```

## Accessing Horizon Dashboard

**URL**: http://admin.virtualracingleagues.localhost:8000/admin/horizon

**Requirements**:
- Must be logged in as an admin user
- Uses `auth:admin` middleware
- Only accessible on admin subdomain

## Queue Configuration

### Queues Available
- `default` - General application jobs
- `mail` - Email notifications (30s wait threshold)
- `discord` - Discord notifications (45s wait threshold)
- `media-conversions` - Media processing

### Dispatching Jobs to Specific Queues

```php
// Dispatch to default queue
SomeJob::dispatch($data);

// Dispatch to specific queue
SomeJob::dispatch($data)->onQueue('mail');

// Dispatch notification to mail queue
$user->notify((new SomeNotification())->onQueue('mail'));
```

## Common Commands

### Status and Control
```bash
# Check if Horizon is running
php artisan horizon:status

# Pause all queue processing
php artisan horizon:pause

# Resume queue processing
php artisan horizon:continue

# Gracefully terminate Horizon
php artisan horizon:terminate
```

### Queue Management
```bash
# Clear all pending jobs
php artisan horizon:clear

# Clear specific queue
php artisan horizon:clear --queue=mail

# View failed jobs
php artisan queue:failed

# Retry all failed jobs
php artisan queue:retry all

# Retry specific failed job
php artisan queue:retry {job-id}

# Delete failed job
php artisan queue:forget {job-id}

# Delete all failed jobs
php artisan queue:flush
```

### Monitoring
```bash
# Watch live logs
php artisan pail

# Watch logs with filter
php artisan pail --filter="queue"
```

## Supervisors Configuration

### supervisor-default
- **Queues**: `default`
- **Max Processes**: 2 (local), 5 (production)
- **Timeout**: 60 seconds
- **Tries**: 3

### supervisor-notifications
- **Queues**: `mail`, `discord`
- **Max Processes**: 3 (local), 8 (production)
- **Timeout**: 120 seconds
- **Tries**: 5

## Troubleshooting

### Horizon Not Starting
```bash
# Clear config cache
php artisan config:clear

# Check Redis connection
redis-cli ping

# Check queue connection
php artisan queue:work --once
```

### Jobs Not Processing
```bash
# Check Horizon status
php artisan horizon:status

# Check if Redis is running
docker-compose ps redis

# Restart Horizon
php artisan horizon:terminate
php artisan horizon
```

### Dashboard 404 Error
Verify you're accessing the correct URL:
- ✅ http://admin.virtualracingleagues.localhost:8000/admin/horizon
- ❌ http://virtualracingleagues.localhost:8000/admin/horizon (wrong subdomain)
- ❌ http://admin.virtualracingleagues.localhost:8000/horizon (missing /admin prefix)

### Authentication Required
Ensure you're logged in as an admin:
1. Visit http://admin.virtualracingleagues.localhost:8000/admin/login
2. Login with admin credentials
3. Then access the Horizon dashboard

## Environment Variables

Add these to your `.env` file:

```env
QUEUE_CONNECTION=redis

# Horizon Configuration
HORIZON_DOMAIN=admin.virtualracingleagues.localhost
HORIZON_PATH=admin/horizon
HORIZON_PREFIX=vrl_horizon:
```

## Docker Service

The `horizon` service is defined in `docker-compose.yml`:

```bash
# Start Horizon container
docker-compose up -d horizon

# View Horizon logs
docker-compose logs -f horizon

# Restart Horizon container
docker-compose restart horizon

# Stop Horizon container
docker-compose stop horizon
```

## Health Check

Horizon includes a health check that runs every 30 seconds:

```bash
# Check manually
php artisan horizon:status

# View health status in Docker
docker-compose ps horizon
```

## Production Deployment

1. Update `.env` with production settings
2. Clear and cache config:
   ```bash
   php artisan config:cache
   ```
3. Ensure Horizon runs on startup (use systemd or supervisor)
4. Monitor dashboard regularly
5. Set up alerting for long wait times (configured in HorizonServiceProvider)

## Next Steps

After starting Horizon:

1. Visit the dashboard to verify it's working
2. Dispatch a test job to verify queue processing
3. Check failed jobs section for any errors
4. Monitor wait times for each queue
5. Proceed to Phase 2 of implementation (update notifications)

## Important Notes

- Horizon requires Redis connection (not database queues)
- Always use `composer dev` for local development (includes Horizon)
- Dashboard is admin-only (protected by middleware)
- Failed jobs are kept for 7 days
- Metrics snapshots retained for 24 hours
