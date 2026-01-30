# Laravel Horizon Production Deployment Guide

This guide provides comprehensive instructions for deploying Laravel Horizon in a production environment.

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration](#2-environment-configuration)
3. [Supervisor Configuration](#3-supervisor-configuration)
4. [Deployment Workflow](#4-deployment-workflow)
5. [Redis Configuration for Production](#5-redis-configuration-for-production)
6. [Security Considerations](#6-security-considerations)
7. [Monitoring & Alerting](#7-monitoring--alerting)
8. [Scaling Horizon](#8-scaling-horizon)
9. [Maintenance Tasks](#9-maintenance-tasks)
10. [Troubleshooting](#10-troubleshooting)
11. [Quick Reference](#11-quick-reference)

---

## 1. Prerequisites

### Server Requirements

- **PHP**: 8.2 or higher
- **Redis**: 7.0 or higher (persistent connection required)
- **Supervisor**: 4.x or higher (process manager)
- **Laravel**: 12.x
- **Memory**: Minimum 512MB RAM per Horizon worker process

### Required PHP Extensions

Verify all required extensions are installed:

```bash
php -m | grep -E 'redis|pcntl|posix|sockets|mbstring|pdo|json|openssl'
```

Required extensions:
- `redis` - Redis PHP extension
- `pcntl` - Process control (required for queue workers)
- `posix` - POSIX functions (required for Horizon)
- `sockets` - Socket functions
- `mbstring` - Multibyte string support
- `pdo` - Database access
- `json` - JSON support
- `openssl` - SSL/TLS support

Install missing extensions (Ubuntu/Debian):

```bash
sudo apt-get install -y php8.2-redis php8.2-pcntl php8.2-posix php8.2-sockets php8.2-mbstring
```

### Redis Server Setup

Install Redis if not already present:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

---

## 2. Environment Configuration

### Production .env Settings

Add/update these settings in your production `.env` file:

```env
# Application
APP_ENV=production
APP_DEBUG=false

# Queue Configuration
QUEUE_CONNECTION=redis

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=your_secure_redis_password_here
REDIS_PORT=6379
REDIS_DB=0

# Horizon-specific Redis connections
REDIS_HORIZON_DB=1
REDIS_CACHE_DB=2

# Horizon Configuration
HORIZON_PREFIX=horizon:
HORIZON_BALANCE=auto
HORIZON_SUPERVISOR_MEMORY=128
HORIZON_SUPERVISOR_TRIES=3
HORIZON_SUPERVISOR_TIMEOUT=60
HORIZON_SUPERVISOR_MAX_PROCESSES=10
HORIZON_SUPERVISOR_MIN_PROCESSES=1

# Horizon Dashboard
HORIZON_DOMAIN=your-domain.com
HORIZON_PATH=admin/horizon
HORIZON_MIDDLEWARE=web,admin.authenticate

# Notifications (optional)
HORIZON_WEBHOOK_URL=https://your-slack-webhook-url
HORIZON_LONG_WAIT_THRESHOLD=60

# Session (if using database for sessions)
SESSION_DRIVER=database
SESSION_LIFETIME=120

# Cache
CACHE_DRIVER=redis
```

### Redis Connection Settings

Update `config/database.php` to include separate Redis connections:

```php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'default' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_DB', '0'),
        'read_timeout' => 60,
        'context' => [
            'tcp' => [
                'timeout' => 60,
            ],
        ],
    ],

    'cache' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_CACHE_DB', '2'),
        'read_timeout' => 60,
    ],

    'horizon' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_HORIZON_DB', '1'),
        'read_timeout' => 60,
    ],
],
```

### Horizon Configuration

Ensure `config/horizon.php` is properly configured:

```php
<?php

use Illuminate\Support\Str;

return [
    'domain' => env('HORIZON_DOMAIN'),
    'path' => env('HORIZON_PATH', 'horizon'),
    'use' => 'horizon',

    'prefix' => env(
        'HORIZON_PREFIX',
        Str::slug(env('APP_NAME', 'laravel'), '_').'_horizon:'
    ),

    'middleware' => explode(',', env('HORIZON_MIDDLEWARE', 'web')),

    'waits' => [
        'redis:default' => 60,
        'redis:leagues' => 60,
        'redis:drivers' => 60,
        'redis:seasons' => 60,
        'redis:races' => 60,
        'redis:notifications' => 60,
    ],

    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080,
        'failed' => 10080,
        'monitored' => 10080,
    ],

    'silenced' => [
        // Add job classes to silence here
    ],

    'fast_termination' => false,

    'memory_limit' => 64,

    'defaults' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 10,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => 128,
            'tries' => 3,
            'timeout' => 60,
            'nice' => 0,
        ],
    ],

    'environments' => [
        'production' => [
            'supervisor-default' => [
                'connection' => 'redis',
                'queue' => ['default'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 10,
                'minProcesses' => 1,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 60,
                'nice' => 0,
            ],

            'supervisor-leagues' => [
                'connection' => 'redis',
                'queue' => ['leagues'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 5,
                'minProcesses' => 1,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 120,
                'nice' => 0,
            ],

            'supervisor-drivers' => [
                'connection' => 'redis',
                'queue' => ['drivers'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 5,
                'minProcesses' => 1,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 120,
                'nice' => 0,
            ],

            'supervisor-seasons' => [
                'connection' => 'redis',
                'queue' => ['seasons'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 5,
                'minProcesses' => 1,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 120,
                'nice' => 0,
            ],

            'supervisor-races' => [
                'connection' => 'redis',
                'queue' => ['races'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 5,
                'minProcesses' => 1,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 120,
                'nice' => 0,
            ],

            'supervisor-notifications' => [
                'connection' => 'redis',
                'queue' => ['notifications'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 3,
                'minProcesses' => 1,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 60,
                'nice' => 0,
            ],
        ],

        'local' => [
            'supervisor-1' => [
                'connection' => 'redis',
                'queue' => ['default', 'leagues', 'drivers', 'seasons', 'races', 'notifications'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 3,
                'maxTime' => 0,
                'maxJobs' => 0,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 60,
                'nice' => 0,
            ],
        ],
    ],
];
```

---

## 3. Supervisor Configuration

Supervisor is a process manager that keeps Horizon running and automatically restarts it if it crashes.

### Installing Supervisor

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y supervisor

# Start and enable Supervisor
sudo systemctl start supervisor
sudo systemctl enable supervisor

# Verify Supervisor is running
sudo systemctl status supervisor
```

### Creating Supervisor Configuration

Create a new Supervisor configuration file for Horizon:

```bash
sudo nano /etc/supervisor/conf.d/horizon.conf
```

Add the following configuration (customize paths and user):

```ini
[program:horizon]
process_name=%(program_name)s
command=php /var/www/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/storage/logs/horizon.log
stopwaitsecs=3600
stopasgroup=true
killasgroup=true
numprocs=1
```

**Configuration Explanation:**

- `process_name`: Name of the process (used in supervisor commands)
- `command`: Full path to PHP and artisan command
- `autostart=true`: Start Horizon when Supervisor starts
- `autorestart=true`: Restart Horizon if it crashes
- `user=www-data`: Run as web server user (change to your user)
- `redirect_stderr=true`: Redirect errors to stdout log
- `stdout_logfile`: Path to Horizon log file
- `stopwaitsecs=3600`: Wait 1 hour before killing (allows jobs to finish)
- `stopasgroup=true`: Stop all child processes when stopping
- `killasgroup=true`: Kill all child processes when killing
- `numprocs=1`: Only run one Horizon instance

### Starting and Managing Horizon

```bash
# Reload Supervisor configuration
sudo supervisorctl reread

# Update Supervisor to apply changes
sudo supervisorctl update

# Start Horizon
sudo supervisorctl start horizon

# Check Horizon status
sudo supervisorctl status horizon

# Stop Horizon
sudo supervisorctl stop horizon

# Restart Horizon
sudo supervisorctl restart horizon

# View Horizon logs
sudo tail -f /var/www/storage/logs/horizon.log
```

### Log Rotation Configuration

Create a logrotate configuration for Horizon logs:

```bash
sudo nano /etc/logrotate.d/horizon
```

Add the following:

```
/var/www/storage/logs/horizon.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 www-data www-data
    sharedscripts
    postrotate
        sudo supervisorctl restart horizon > /dev/null 2>&1
    endscript
}
```

---

## 4. Deployment Workflow

Follow this workflow when deploying code changes that affect queues or Horizon:

### Step 1: Prepare for Deployment

```bash
# SSH into production server
ssh user@your-server.com

# Navigate to application directory
cd /var/www
```

### Step 2: Pull Latest Code

```bash
# Pull latest code from repository
git pull origin main

# Install/update dependencies
composer install --no-dev --optimize-autoloader

# Install/update Node dependencies (if needed)
npm ci --production
```

### Step 3: Run Migrations

```bash
# Run database migrations
php artisan migrate --force
```

### Step 4: Clear Caches

```bash
# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Rebuild config cache
php artisan config:cache

# Rebuild route cache
php artisan route:cache

# Rebuild view cache
php artisan view:cache
```

### Step 5: Publish Horizon Assets

```bash
# Publish Horizon assets (if updated)
php artisan horizon:publish
```

### Step 6: Gracefully Terminate Horizon

**IMPORTANT**: Always terminate Horizon gracefully during deployments to avoid job interruption.

```bash
# Terminate Horizon (allows current jobs to finish)
php artisan horizon:terminate

# Wait for Horizon to finish current jobs (check status)
sudo supervisorctl status horizon
```

Supervisor will automatically restart Horizon after termination.

### Step 7: Verify Deployment

```bash
# Check Horizon status
sudo supervisorctl status horizon

# Verify Horizon is processing jobs
php artisan horizon:status

# Check for failed jobs
php artisan queue:failed

# View Horizon dashboard
# Navigate to: https://your-domain.com/admin/horizon
```

### Zero-Downtime Deployment Considerations

For zero-downtime deployments using tools like Deployer or Envoyer:

1. **Use separate release directories**: Deploy to a new directory, then symlink
2. **Reload services after symlink**: Restart Horizon after switching symlink
3. **Keep old releases**: Maintain previous releases for quick rollback

Example Deployer task:

```php
// deploy.php
task('horizon:terminate', function () {
    run('cd {{release_path}} && php artisan horizon:terminate');
});

task('supervisor:restart', function () {
    run('sudo supervisorctl restart horizon');
});

after('deploy:symlink', 'horizon:terminate');
after('horizon:terminate', 'supervisor:restart');
```

---

## 5. Redis Configuration for Production

### Securing Redis

Edit Redis configuration:

```bash
sudo nano /etc/redis/redis.conf
```

Apply these security settings:

```conf
# Bind to localhost only (if Redis is on same server)
bind 127.0.0.1 ::1

# Set a strong password
requirepass your_secure_redis_password_here

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command SHUTDOWN ""
rename-command DEL ""

# Enable protected mode
protected-mode yes

# Disable TCP backlog
tcp-backlog 511

# Set timeout for idle clients (0 = disabled)
timeout 300

# Enable TCP keepalive
tcp-keepalive 300
```

### Memory Configuration

```conf
# Maximum memory (adjust based on available RAM)
maxmemory 256mb

# Eviction policy (don't evict by default for queues)
maxmemory-policy noeviction

# Disable saving to disk (if using Redis only for queues/cache)
# WARNING: This means data loss on restart - only use if acceptable
save ""

# OR configure RDB snapshots for persistence
save 900 1
save 300 10
save 60 10000

# Directory for RDB files
dir /var/lib/redis

# RDB filename
dbfilename dump.rdb

# Enable RDB compression
rdbcompression yes

# Enable RDB checksum
rdbchecksum yes
```

### Performance Tuning

```conf
# Disable slow log (or set to high threshold)
slowlog-log-slower-than 10000
slowlog-max-len 128

# Increase client output buffer for pub/sub
client-output-buffer-limit pubsub 32mb 8mb 60

# Enable lazy freeing
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
```

### Apply Redis Configuration

```bash
# Test configuration
sudo redis-server /etc/redis/redis.conf --test-memory 1024

# Restart Redis to apply changes
sudo systemctl restart redis-server

# Verify Redis is running
redis-cli -a your_secure_redis_password_here ping

# Check Redis info
redis-cli -a your_secure_redis_password_here info
```

### Redis Monitoring Commands

```bash
# Connect to Redis CLI
redis-cli -a your_secure_redis_password_here

# Monitor commands in real-time
MONITOR

# View Redis info
INFO

# Check memory usage
INFO memory

# Check connected clients
CLIENT LIST

# View slow log
SLOWLOG GET 10

# Check keyspace
INFO keyspace

# View specific database keys
SELECT 1
KEYS *
```

---

## 6. Security Considerations

### Securing the Horizon Dashboard

**Option 1: IP Whitelist (Recommended)**

Add IP whitelist middleware in `app/Http/Middleware/HorizonAuthorize.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HorizonAuthorize
{
    protected array $allowedIps = [
        '192.168.1.100',    // Office IP
        '10.0.0.5',         // VPN IP
        // Add more IPs
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (!in_array($request->ip(), $this->allowedIps)) {
            abort(403, 'Access denied');
        }

        return $next($request);
    }
}
```

Register middleware in `config/horizon.php`:

```php
'middleware' => ['web', 'admin.authenticate', HorizonAuthorize::class],
```

**Option 2: VPN-Only Access**

Configure firewall to only allow Horizon dashboard access from VPN:

```bash
# Allow only from VPN subnet
sudo ufw allow from 10.8.0.0/24 to any port 443

# Deny all other access to Horizon path
# (handled by Nginx configuration)
```

**Option 3: Basic Authentication (Nginx)**

Add basic auth to Horizon location in Nginx:

```nginx
location /admin/horizon {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ /index.php?$query_string;
}
```

Create password file:

```bash
# Install htpasswd utility
sudo apt-get install apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Restart Nginx
sudo systemctl restart nginx
```

### Redis Authentication

Always use Redis password authentication (see Redis Configuration section above).

Update `.env`:

```env
REDIS_PASSWORD=your_secure_redis_password_here
```

### Environment Variable Security

```bash
# Set proper permissions on .env
chmod 600 /var/www/.env
chown www-data:www-data /var/www/.env

# Never commit .env to version control
# Ensure .env is in .gitignore
```

### Firewall Rules

Configure UFW firewall:

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block Redis from external access (only localhost)
sudo ufw deny 6379/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### SSL/TLS Configuration

Always use HTTPS for Horizon dashboard. Configure Nginx with Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured by default
sudo certbot renew --dry-run
```

---

## 7. Monitoring & Alerting

### Configuring Long Wait Notifications

Update `config/horizon.php`:

```php
'waits' => [
    'redis:default' => 60,        // Alert if jobs wait more than 60 seconds
    'redis:leagues' => 60,
    'redis:drivers' => 60,
    'redis:seasons' => 60,
    'redis:races' => 60,
    'redis:notifications' => 30,  // Notifications should be faster
],
```

### Setting Up Slack Notifications

1. Create a Slack webhook URL in your Slack workspace
2. Add webhook URL to `.env`:

```env
HORIZON_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

3. Configure notifications in `app/Providers/HorizonServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    public function boot(): void
    {
        parent::boot();

        // Send notifications for long wait times
        Horizon::routeMailNotificationsTo('alerts@your-domain.com');
        Horizon::routeSlackNotificationsTo(
            config('services.slack.horizon_webhook'),
            '#horizon-alerts'
        );
    }

    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user) {
            return in_array($user->email, [
                'admin@your-domain.com',
            ]);
        });
    }
}
```

4. Update `config/services.php`:

```php
'slack' => [
    'horizon_webhook' => env('HORIZON_WEBHOOK_URL'),
],
```

### Health Check Endpoint

Create a health check endpoint for monitoring tools:

```php
// routes/web.php
Route::get('/health/horizon', function () {
    try {
        $masters = \Laravel\Horizon\Contracts\MasterSupervisorRepository::class;
        $masters = app($masters)->all();

        if (empty($masters)) {
            return response()->json(['status' => 'error', 'message' => 'No supervisors running'], 503);
        }

        return response()->json([
            'status' => 'ok',
            'supervisors' => count($masters),
        ]);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 503);
    }
});
```

### Integration with Monitoring Tools

**Option 1: Prometheus + Grafana**

Export Horizon metrics to Prometheus:

```bash
composer require superbalist/php-prometheus-client
```

Create custom exporter in `app/Http/Controllers/MetricsController.php`:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Redis;
use Laravel\Horizon\Contracts\JobRepository;
use Laravel\Horizon\Contracts\MetricsRepository;

class MetricsController extends Controller
{
    public function horizon()
    {
        $metrics = app(MetricsRepository::class);
        $jobs = app(JobRepository::class);

        $data = [
            'jobs_pending' => $jobs->countPending(),
            'jobs_completed' => $jobs->countCompleted(),
            'jobs_failed' => $jobs->countFailed(),
            'jobs_recent' => $jobs->countRecent(),
            // Add more metrics as needed
        ];

        // Format as Prometheus metrics
        $output = '';
        foreach ($data as $metric => $value) {
            $output .= "horizon_{$metric} {$value}\n";
        }

        return response($output, 200)
            ->header('Content-Type', 'text/plain');
    }
}
```

**Option 2: Sentry Integration**

Track failed jobs in Sentry:

```bash
composer require sentry/sentry-laravel
```

Configure in `config/logging.php`:

```php
'channels' => [
    'sentry' => [
        'driver' => 'sentry',
    ],
],
```

Update `app/Exceptions/Handler.php`:

```php
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        if (app()->bound('sentry')) {
            app('sentry')->captureException($e);
        }
    });
}
```

**Option 3: Custom Monitoring Script**

Create a monitoring script:

```bash
#!/bin/bash
# /usr/local/bin/check-horizon.sh

# Check if Horizon is running
if ! supervisorctl status horizon | grep -q RUNNING; then
    echo "CRITICAL: Horizon is not running"
    # Send alert (email, Slack, PagerDuty, etc.)
    exit 2
fi

# Check queue wait times
WAIT_TIME=$(php /var/www/artisan horizon:status | grep "Wait Time" | awk '{print $3}')
if [ "$WAIT_TIME" -gt 60 ]; then
    echo "WARNING: Queue wait time is ${WAIT_TIME}s"
    # Send alert
    exit 1
fi

echo "OK: Horizon is running normally"
exit 0
```

Schedule with cron:

```bash
# Run every 5 minutes
*/5 * * * * /usr/local/bin/check-horizon.sh
```

---

## 8. Scaling Horizon

### Adjusting Worker Processes

Edit `config/horizon.php` to adjust `maxProcesses` and `minProcesses`:

```php
'supervisor-leagues' => [
    'connection' => 'redis',
    'queue' => ['leagues'],
    'balance' => 'auto',
    'autoScalingStrategy' => 'time',
    'maxProcesses' => 10,      // Increase for more concurrent jobs
    'minProcesses' => 2,       // Keep at least 2 workers running
    'maxTime' => 0,
    'maxJobs' => 0,
    'memory' => 128,
    'tries' => 3,
    'timeout' => 120,
    'nice' => 0,
],
```

**Auto-scaling strategies:**

- `time`: Scale based on job processing time
- `size`: Scale based on queue size

**Balancing strategies:**

- `auto`: Automatic balancing (recommended)
- `simple`: Round-robin distribution
- `false`: No balancing (single queue)

### Memory Considerations

Calculate memory requirements:

```
Total Memory = (maxProcesses × memory) + Overhead
Example: (10 × 128MB) + 200MB = 1480MB (~1.5GB)
```

Monitor memory usage:

```bash
# Check Horizon memory usage
ps aux | grep horizon

# Check Redis memory usage
redis-cli -a your_password info memory
```

### Multiple Supervisor Configurations

For high-traffic applications, run multiple Horizon instances:

```ini
# /etc/supervisor/conf.d/horizon-1.conf
[program:horizon-1]
process_name=%(program_name)s
command=php /var/www/artisan horizon --environment=production-1
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/storage/logs/horizon-1.log
stopwaitsecs=3600

# /etc/supervisor/conf.d/horizon-2.conf
[program:horizon-2]
process_name=%(program_name)s
command=php /var/www/artisan horizon --environment=production-2
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/storage/logs/horizon-2.log
stopwaitsecs=3600
```

Create separate environments in `config/horizon.php`:

```php
'environments' => [
    'production-1' => [
        'supervisor-default' => [
            'queue' => ['default', 'leagues', 'drivers'],
            // ... config
        ],
    ],

    'production-2' => [
        'supervisor-seasons' => [
            'queue' => ['seasons', 'races', 'notifications'],
            // ... config
        ],
    ],
],
```

### Horizontal Scaling (Multiple Servers)

To scale across multiple servers:

1. **Centralized Redis**: Use a dedicated Redis server
2. **Shared Storage**: Ensure all servers access the same codebase
3. **Load Balancer**: Distribute web traffic (Horizon can run on any server)

Example setup:

```
                     ┌─────────────┐
                     │  Redis      │
                     │  (Central)  │
                     └─────────────┘
                            ↑
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐
    │  Server 1 │    │  Server 2 │    │  Server 3 │
    │  Horizon  │    │  Horizon  │    │  Horizon  │
    └───────────┘    └───────────┘    └───────────┘
```

Configure Redis connection on all servers:

```env
REDIS_HOST=redis-server.internal
REDIS_PASSWORD=secure_password
REDIS_PORT=6379
```

### Queue Priority Tuning

Prioritize critical queues:

```php
'supervisor-critical' => [
    'connection' => 'redis',
    'queue' => ['notifications', 'emails'],
    'balance' => 'auto',
    'maxProcesses' => 10,
    'minProcesses' => 3,      // Keep 3 workers always ready
    'timeout' => 30,          // Fast timeout
    'nice' => -10,            // Higher priority (lower nice value)
],

'supervisor-background' => [
    'connection' => 'redis',
    'queue' => ['reports', 'cleanup'],
    'balance' => 'auto',
    'maxProcesses' => 3,
    'minProcesses' => 1,
    'timeout' => 300,         // Longer timeout
    'nice' => 10,             // Lower priority (higher nice value)
],
```

---

## 9. Maintenance Tasks

### Scheduled Commands

Add these to `app/Console/Kernel.php`:

```php
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Snapshot Horizon metrics every 5 minutes
        $schedule->command('horizon:snapshot')
            ->everyFiveMinutes()
            ->runInBackground();

        // Prune old failed jobs (keep 7 days)
        $schedule->command('queue:prune-failed --hours=168')
            ->daily()
            ->at('03:00');

        // Clear old Horizon monitoring data (keep 7 days)
        $schedule->command('horizon:clear --hours=168')
            ->daily()
            ->at('03:30');

        // Monitor queue wait times
        $schedule->command('horizon:status')
            ->everyFiveMinutes()
            ->runInBackground();

        // Restart Horizon daily (optional, for memory cleanup)
        $schedule->command('horizon:terminate')
            ->daily()
            ->at('04:00');
    }
}
```

Ensure the scheduler is running:

```bash
# Add to crontab
crontab -e

# Add this line:
* * * * * cd /var/www && php artisan schedule:run >> /dev/null 2>&1
```

### Log Rotation

Configure Laravel log rotation in `config/logging.php`:

```php
'daily' => [
    'driver' => 'daily',
    'path' => storage_path('logs/laravel.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'days' => 14,  // Keep 14 days of logs
],
```

### Redis Maintenance

**Monitor Redis memory:**

```bash
# Check memory usage
redis-cli -a your_password info memory

# Check keyspace
redis-cli -a your_password info keyspace

# If memory is growing, check largest keys
redis-cli -a your_password --bigkeys
```

**Clean up old keys (if using TTL):**

```bash
# Check expired keys
redis-cli -a your_password info stats | grep expired

# Manually trigger eviction (if needed)
redis-cli -a your_password MEMORY PURGE
```

**Backup Redis data (if persistence enabled):**

```bash
# Trigger RDB snapshot
redis-cli -a your_password BGSAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb

# Compress backup
gzip /backup/redis-$(date +%Y%m%d).rdb
```

### Database Maintenance

**Prune old monitoring data:**

```bash
# Prune Horizon monitoring tables
php artisan horizon:clear --hours=168

# Prune failed jobs
php artisan queue:prune-failed --hours=168

# Prune telescope entries (if using Telescope)
php artisan telescope:prune --hours=168
```

**Optimize tables:**

```bash
# Optimize MySQL tables
php artisan db:optimize

# Or manually:
mysql -u laravel -p laravel -e "OPTIMIZE TABLE failed_jobs, jobs;"
```

### Regular Maintenance Checklist

**Daily:**
- ✅ Check Horizon dashboard for failed jobs
- ✅ Review error logs: `tail -f storage/logs/laravel.log`
- ✅ Monitor Redis memory: `redis-cli info memory`

**Weekly:**
- ✅ Review failed job patterns
- ✅ Check queue wait times
- ✅ Review supervisor logs: `tail -f storage/logs/horizon.log`
- ✅ Verify backups are running

**Monthly:**
- ✅ Review and optimize slow jobs
- ✅ Check Redis persistence (if enabled)
- ✅ Review auto-scaling configuration
- ✅ Update dependencies: `composer update` (on staging first)
- ✅ Rotate logs older than 30 days

---

## 10. Troubleshooting

### Common Issues and Solutions

#### Issue: Horizon Not Starting

**Symptoms:**
- `supervisorctl status horizon` shows `FATAL` or `BACKOFF`
- Horizon dashboard is unreachable

**Solutions:**

1. Check Horizon log:
```bash
tail -f /var/www/storage/logs/horizon.log
```

2. Check for PHP errors:
```bash
tail -f /var/www/storage/logs/laravel.log
```

3. Verify Redis connection:
```bash
redis-cli -a your_password ping
php artisan tinker
>>> Redis::connection('horizon')->ping();
```

4. Check PHP extensions:
```bash
php -m | grep -E 'redis|pcntl|posix'
```

5. Verify supervisor configuration:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart horizon
```

#### Issue: Jobs Not Processing

**Symptoms:**
- Jobs stay in "pending" status
- Dashboard shows 0 workers

**Solutions:**

1. Check if Horizon is running:
```bash
php artisan horizon:status
```

2. Check queue connection:
```bash
php artisan queue:work --once
```

3. Verify jobs are in Redis:
```bash
redis-cli -a your_password
SELECT 1
KEYS *
```

4. Check for syntax errors in jobs:
```bash
php artisan queue:failed
php artisan queue:retry all
```

5. Restart Horizon:
```bash
php artisan horizon:terminate
sudo supervisorctl restart horizon
```

#### Issue: High Memory Usage

**Symptoms:**
- Horizon process using excessive memory
- Server running out of RAM

**Solutions:**

1. Check memory limit in `config/horizon.php`:
```php
'memory' => 128,  // Reduce if too high
```

2. Reduce max processes:
```php
'maxProcesses' => 5,  // Reduce from 10
```

3. Check for memory leaks in jobs:
```bash
# Enable memory profiling
php artisan horizon:pause
php artisan queue:work --once --memory=128
```

4. Restart Horizon regularly:
```php
// In Kernel.php
$schedule->command('horizon:terminate')->daily()->at('04:00');
```

5. Monitor with `htop` or `ps`:
```bash
watch -n 1 'ps aux | grep horizon | grep -v grep'
```

#### Issue: Failed Jobs Not Retrying

**Symptoms:**
- Jobs fail but don't retry
- Max tries not respected

**Solutions:**

1. Check `tries` configuration:
```php
'tries' => 3,  // Ensure tries is set
```

2. Verify job class has `$tries` property:
```php
class ProcessLeague implements ShouldQueue
{
    public int $tries = 3;
    public int $timeout = 120;
}
```

3. Check if job is marked as non-retryable:
```php
// Remove this if present:
public $tries = 1;  // This prevents retries
```

4. Manually retry failed jobs:
```bash
php artisan queue:retry all
```

#### Issue: Jobs Timing Out

**Symptoms:**
- Jobs marked as failed with "timeout exceeded" error
- Long-running jobs not completing

**Solutions:**

1. Increase timeout in `config/horizon.php`:
```php
'timeout' => 300,  // Increase from 60 to 300 seconds
```

2. Increase timeout in job class:
```php
public int $timeout = 300;
```

3. Increase `stopwaitsecs` in supervisor config:
```ini
stopwaitsecs=3600  # Allow 1 hour for graceful shutdown
```

4. Break long jobs into smaller chunks:
```php
// Instead of processing 10,000 records:
ProcessAllRecords::dispatch($records);

// Chunk into batches:
foreach ($records->chunk(100) as $chunk) {
    ProcessRecordChunk::dispatch($chunk);
}
```

#### Issue: Supervisor Won't Restart Horizon

**Symptoms:**
- `supervisorctl restart horizon` hangs
- Horizon processes remain after stop

**Solutions:**

1. Kill Horizon processes manually:
```bash
ps aux | grep horizon | grep -v grep | awk '{print $2}' | xargs kill -9
```

2. Restart supervisor:
```bash
sudo systemctl restart supervisor
```

3. Check supervisor logs:
```bash
sudo tail -f /var/log/supervisor/supervisord.log
```

4. Verify supervisor socket:
```bash
ls -la /var/run/supervisor.sock
```

#### Issue: Redis Connection Errors

**Symptoms:**
- "Connection refused" errors
- "Authentication failed" errors

**Solutions:**

1. Check Redis is running:
```bash
sudo systemctl status redis-server
```

2. Test Redis connection:
```bash
redis-cli -a your_password ping
```

3. Verify Redis password in `.env`:
```env
REDIS_PASSWORD=your_secure_redis_password_here
```

4. Check Redis configuration:
```bash
sudo nano /etc/redis/redis.conf
# Verify: requirepass, bind
```

5. Restart Redis:
```bash
sudo systemctl restart redis-server
```

### Checking Horizon Status

```bash
# Check if Horizon is running
php artisan horizon:status

# View Horizon metrics
php artisan horizon:snapshot

# Check supervisor status
sudo supervisorctl status horizon

# Check Redis queue status
redis-cli -a your_password
SELECT 1
KEYS *
```

### Viewing Failed Jobs

```bash
# List all failed jobs
php artisan queue:failed

# View specific failed job
php artisan queue:failed:show <job-id>

# Retry specific failed job
php artisan queue:retry <job-id>

# Retry all failed jobs
php artisan queue:retry all

# Flush all failed jobs
php artisan queue:flush
```

### Restarting Workers

```bash
# Graceful restart (allows jobs to finish)
php artisan horizon:terminate

# Force restart via supervisor
sudo supervisorctl restart horizon

# Pause Horizon
php artisan horizon:pause

# Continue Horizon
php artisan horizon:continue
```

### Debug Logging

Enable debug logging in `.env`:

```env
LOG_LEVEL=debug
HORIZON_LOG_LEVEL=debug
```

View logs in real-time:

```bash
# Laravel log
tail -f /var/www/storage/logs/laravel.log

# Horizon log
tail -f /var/www/storage/logs/horizon.log

# Supervisor log
sudo tail -f /var/log/supervisor/supervisord.log
```

### Performance Profiling

Profile queue job performance:

```bash
# Install Telescope for profiling
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate

# Access Telescope dashboard
# Navigate to: https://your-domain.com/telescope
```

Monitor Redis performance:

```bash
redis-cli -a your_password --latency
redis-cli -a your_password --latency-history
redis-cli -a your_password SLOWLOG GET 10
```

---

## 11. Quick Reference

### Common Artisan Commands

```bash
# Horizon Management
php artisan horizon                      # Start Horizon
php artisan horizon:pause                # Pause all workers
php artisan horizon:continue             # Continue all workers
php artisan horizon:terminate            # Gracefully terminate Horizon
php artisan horizon:status               # Check Horizon status
php artisan horizon:snapshot             # Snapshot metrics
php artisan horizon:clear --hours=168    # Clear old monitoring data

# Queue Management
php artisan queue:work                   # Start queue worker
php artisan queue:listen                 # Start queue listener
php artisan queue:restart                # Restart all queue workers
php artisan queue:failed                 # List failed jobs
php artisan queue:retry all              # Retry all failed jobs
php artisan queue:retry <job-id>         # Retry specific failed job
php artisan queue:forget <job-id>        # Delete failed job
php artisan queue:flush                  # Flush all failed jobs
php artisan queue:prune-failed --hours=168  # Prune old failed jobs

# Monitoring
php artisan horizon:status               # Check status
php artisan queue:monitor redis:default  # Monitor queue

# Publishing
php artisan horizon:install              # Install Horizon
php artisan horizon:publish              # Publish Horizon assets

# Cache Management
php artisan config:clear                 # Clear config cache
php artisan cache:clear                  # Clear application cache
php artisan route:clear                  # Clear route cache
php artisan view:clear                   # Clear view cache
```

### Supervisor Commands

```bash
# Status and Control
sudo supervisorctl status                # Check all programs
sudo supervisorctl status horizon        # Check Horizon status
sudo supervisorctl start horizon         # Start Horizon
sudo supervisorctl stop horizon          # Stop Horizon
sudo supervisorctl restart horizon       # Restart Horizon

# Configuration
sudo supervisorctl reread                # Reload config files
sudo supervisorctl update                # Apply config changes
sudo supervisorctl reload                # Restart supervisord

# Logs
sudo supervisorctl tail horizon          # Tail Horizon log
sudo supervisorctl tail -f horizon       # Follow Horizon log
sudo supervisorctl clear horizon         # Clear Horizon log

# Supervisor Service
sudo systemctl start supervisor          # Start supervisor
sudo systemctl stop supervisor           # Stop supervisor
sudo systemctl restart supervisor        # Restart supervisor
sudo systemctl status supervisor         # Check supervisor status
```

### Redis CLI Commands

```bash
# Connection
redis-cli -a your_password               # Connect to Redis
redis-cli -h host -p port -a password    # Connect to remote Redis

# Information
INFO                                     # Show all Redis info
INFO memory                              # Show memory usage
INFO keyspace                            # Show keyspace info
INFO stats                               # Show statistics
CLIENT LIST                              # List connected clients

# Keys
KEYS *                                   # List all keys (don't use in production!)
SCAN 0 MATCH pattern* COUNT 100          # Safely scan keys
EXISTS key                               # Check if key exists
TYPE key                                 # Get key type
TTL key                                  # Get key TTL
DEL key                                  # Delete key

# Database
SELECT 0                                 # Select database 0
SELECT 1                                 # Select database 1 (Horizon)
DBSIZE                                   # Get number of keys
FLUSHDB                                  # Clear current database (careful!)

# Monitoring
MONITOR                                  # Monitor all commands
SLOWLOG GET 10                           # Get slow queries
CONFIG GET slowlog-log-slower-than       # Get slow log threshold

# Performance
PING                                     # Test connection
BENCHMARK                                # Run benchmark
LATENCY DOCTOR                           # Check latency issues
```

### Useful Shell Scripts

**Check Horizon Health:**

```bash
#!/bin/bash
# check-horizon.sh

if php artisan horizon:status | grep -q "running"; then
    echo "✓ Horizon is running"
    exit 0
else
    echo "✗ Horizon is not running"
    exit 1
fi
```

**Restart Horizon:**

```bash
#!/bin/bash
# restart-horizon.sh

echo "Terminating Horizon gracefully..."
php artisan horizon:terminate

echo "Waiting for jobs to finish..."
sleep 10

echo "Restarting via Supervisor..."
sudo supervisorctl restart horizon

echo "Checking status..."
sleep 2
sudo supervisorctl status horizon
```

**Monitor Queue Wait Times:**

```bash
#!/bin/bash
# monitor-queues.sh

while true; do
    clear
    echo "=== Horizon Status ==="
    php artisan horizon:status
    echo ""
    echo "=== Redis Queue Lengths ==="
    redis-cli -a your_password <<EOF
SELECT 1
LLEN queues:default
LLEN queues:leagues
LLEN queues:drivers
LLEN queues:seasons
LLEN queues:races
LLEN queues:notifications
EOF
    sleep 5
done
```

### Configuration File Paths

```
/etc/supervisor/conf.d/horizon.conf      # Supervisor config
/etc/redis/redis.conf                    # Redis config
/etc/nginx/sites-available/default       # Nginx config
/var/www/.env                            # Laravel environment
/var/www/config/horizon.php              # Horizon config
/var/www/storage/logs/horizon.log        # Horizon log
/var/www/storage/logs/laravel.log        # Laravel log
/var/log/supervisor/supervisord.log      # Supervisor log
```

### Important URLs

```
https://your-domain.com/admin/horizon    # Horizon dashboard
https://your-domain.com/telescope        # Telescope dashboard (if installed)
http://localhost:8025                    # Mailpit (local dev)
```

### Environment Variables Quick Reference

```env
# Queue
QUEUE_CONNECTION=redis

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=secure_password
REDIS_PORT=6379
REDIS_DB=0
REDIS_HORIZON_DB=1

# Horizon
HORIZON_PREFIX=horizon:
HORIZON_BALANCE=auto
HORIZON_SUPERVISOR_MEMORY=128
HORIZON_SUPERVISOR_TRIES=3
HORIZON_SUPERVISOR_TIMEOUT=60
HORIZON_DOMAIN=your-domain.com
HORIZON_PATH=admin/horizon
```

---

## Conclusion

This guide provides a complete reference for deploying and managing Laravel Horizon in production. Key takeaways:

1. **Always use Supervisor** to keep Horizon running
2. **Secure Redis** with password authentication
3. **Secure Horizon dashboard** with IP whitelist or authentication
4. **Monitor queues** regularly for performance issues
5. **Use `horizon:terminate`** during deployments (never kill -9)
6. **Schedule maintenance tasks** (snapshots, pruning)
7. **Scale horizontally** by adjusting worker processes
8. **Keep logs rotated** to prevent disk space issues

For additional help, consult:
- Laravel Horizon Documentation: https://laravel.com/docs/12.x/horizon
- Redis Documentation: https://redis.io/docs/
- Supervisor Documentation: http://supervisord.org/

**Need assistance?** Check the troubleshooting section or review application logs for detailed error messages.
