# Backend Implementation Plan: Laravel Horizon & Queues

## Phase 1: Install and Configure Horizon

### Step 1.1: Install Laravel Horizon

```bash
composer require laravel/horizon

# Publish assets and configuration
php artisan horizon:install

# Run migrations (for failed_jobs if needed)
php artisan migrate
```

### Step 1.2: Update Queue Configuration

**File: `.env`**

```env
# Change from database to redis
QUEUE_CONNECTION=redis

# Horizon Configuration
HORIZON_DOMAIN=admin.virtualracingleagues.localhost
HORIZON_PATH=admin/horizon
HORIZON_PREFIX=vrl_horizon:
```

**File: `config/queue.php`**

Verify Redis connection is properly configured:

```php
'redis' => [
    'driver' => 'redis',
    'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
    'queue' => env('REDIS_QUEUE', 'default'),
    'retry_after' => (int) env('REDIS_QUEUE_RETRY_AFTER', 90),
    'block_for' => null,
    'after_commit' => false,
],
```

### Step 1.3: Configure Horizon

**File: `config/horizon.php`**

```php
<?php

use Illuminate\Support\Str;

return [
    /*
    |--------------------------------------------------------------------------
    | Horizon Domain
    |--------------------------------------------------------------------------
    |
    | This is the subdomain where Horizon will be accessible from.
    |
    */
    'domain' => env('HORIZON_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Path
    |--------------------------------------------------------------------------
    |
    | This is the URI path where Horizon will be accessible from.
    |
    */
    'path' => env('HORIZON_PATH', 'horizon'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Connection
    |--------------------------------------------------------------------------
    */
    'use' => 'default',

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Prefix
    |--------------------------------------------------------------------------
    */
    'prefix' => env('HORIZON_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_horizon:'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Route Middleware
    |--------------------------------------------------------------------------
    */
    'middleware' => ['web', 'auth:admin'],

    /*
    |--------------------------------------------------------------------------
    | Queue Wait Time Thresholds
    |--------------------------------------------------------------------------
    |
    | Alert if jobs wait longer than these thresholds (seconds).
    |
    */
    'waits' => [
        'redis:default' => 60,
        'redis:mail' => 30,
        'redis:discord' => 45,
    ],

    /*
    |--------------------------------------------------------------------------
    | Job Trimming Times (minutes)
    |--------------------------------------------------------------------------
    */
    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080, // 7 days
        'failed' => 10080,        // 7 days
        'monitored' => 10080,     // 7 days
    ],

    /*
    |--------------------------------------------------------------------------
    | Silenced Jobs
    |--------------------------------------------------------------------------
    |
    | Jobs that should not appear in the dashboard.
    |
    */
    'silenced' => [
        // App\Jobs\ExampleJob::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Metrics
    |--------------------------------------------------------------------------
    */
    'metrics' => [
        'trim_snapshots' => [
            'job' => 24,
            'queue' => 24,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fast Termination
    |--------------------------------------------------------------------------
    */
    'fast_termination' => false,

    /*
    |--------------------------------------------------------------------------
    | Memory Limit (MB)
    |--------------------------------------------------------------------------
    */
    'memory_limit' => 64,

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Configuration
    |--------------------------------------------------------------------------
    */
    'defaults' => [
        'supervisor-default' => [
            'connection' => 'redis',
            'queue' => ['default'],
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
        'supervisor-notifications' => [
            'connection' => 'redis',
            'queue' => ['mail', 'discord'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 5,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => 128,
            'tries' => 5,
            'timeout' => 120,
            'nice' => 0,
        ],
    ],

    'environments' => [
        'production' => [
            'supervisor-default' => [
                'maxProcesses' => 5,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
            ],
            'supervisor-notifications' => [
                'maxProcesses' => 8,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
            ],
        ],

        'local' => [
            'supervisor-default' => [
                'maxProcesses' => 2,
            ],
            'supervisor-notifications' => [
                'maxProcesses' => 3,
            ],
        ],
    ],
];
```

---

## Phase 2: Update Notification Classes

### Step 2.1: Update ContactSubmittedNotification

**File: `app/Notifications/ContactSubmittedNotification.php`**

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
// ... other imports

class ContactSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the notification may be attempted.
     */
    public int $tries = 5;

    /**
     * The number of seconds the notification can run before timing out.
     */
    public int $timeout = 120;

    /**
     * The maximum number of unhandled exceptions to allow before failing.
     */
    public int $maxExceptions = 3;

    public function __construct(/* existing params */)
    {
        // Set queue based on channel
        $this->onConnection('redis');
    }

    /**
     * Determine which queues should be used for each notification channel.
     *
     * @return array<string, string>
     */
    public function viaQueues(): array
    {
        return [
            'mail' => 'mail',
            DiscordChannel::class => 'discord',
        ];
    }

    /**
     * Calculate the number of seconds to wait before retrying the notification.
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60, 300]; // 10s, 1min, 5min
    }

    // ... rest of existing implementation
}
```

### Step 2.2: Update EmailVerificationNotification

**File: `app/Notifications/EmailVerificationNotification.php`**

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class EmailVerificationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;
    public int $timeout = 120;

    public function __construct(/* existing params */)
    {
        $this->onConnection('redis')
             ->onQueue('mail');
    }

    public function backoff(): array
    {
        return [10, 60, 300];
    }

    // ... rest of existing implementation
}
```

### Step 2.3: Update PasswordResetNotification

**File: `app/Notifications/PasswordResetNotification.php`**

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;
    public int $timeout = 120;

    public function __construct(/* existing params */)
    {
        $this->onConnection('redis')
             ->onQueue('mail');
    }

    public function backoff(): array
    {
        return [10, 60, 300];
    }

    // ... rest of existing implementation
}
```

### Step 2.4: Update UserRegisteredNotification

**File: `app/Notifications/UserRegisteredNotification.php`**

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class UserRegisteredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 30;

    public function __construct(/* existing params */)
    {
        $this->onConnection('redis')
             ->onQueue('discord');
    }

    public function backoff(): array
    {
        return [5, 15, 30];
    }

    // ... rest of existing implementation
}
```

### Step 2.5: Update ContactCopyNotification

**File: `app/Notifications/ContactCopyNotification.php`**

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ContactCopyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;
    public int $timeout = 120;

    public function __construct(/* existing params */)
    {
        $this->onConnection('redis')
             ->onQueue('mail');
    }

    public function backoff(): array
    {
        return [10, 60, 300];
    }

    // ... rest of existing implementation
}
```

---

## Phase 3: Configure Horizon Service Provider

### Step 3.1: Update HorizonServiceProvider

**File: `app/Providers/HorizonServiceProvider.php`**

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();

        // Configure notification routing for long wait times
        if (config('notifications.discord.enabled') && config('notifications.discord.webhooks.system')) {
            Horizon::routeSlackNotificationsTo(
                config('notifications.discord.webhooks.system'),
                '#operations'
            );
        }

        // Route email notifications (optional)
        if (config('notifications.email.enabled') && config('notifications.admin_email')) {
            Horizon::routeMailNotificationsTo(config('notifications.admin_email'));
        }

        // Dark mode preference (optional)
        // Horizon::night();
    }

    /**
     * Register the Horizon gate.
     *
     * This gate determines who can access Horizon in non-local environments.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user) {
            // Only allow authenticated admins
            // This works because middleware already checks auth:admin
            return true;
        });
    }
}
```

---

## Phase 4: Update Event Listeners

### Step 4.1: Make Listeners Queueable

Update listeners to implement `ShouldQueue` for better performance:

**File: `app/Listeners/SendContactNotification.php`**

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendContactNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The name of the connection the job should be sent to.
     */
    public string $connection = 'redis';

    /**
     * The name of the queue the job should be sent to.
     */
    public string $queue = 'default';

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    // ... rest of existing implementation
}
```

**File: `app/Listeners/SendRegistrationDiscordNotification.php`**

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendRegistrationDiscordNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $connection = 'redis';
    public string $queue = 'default';
    public int $tries = 3;

    // ... rest of existing implementation
}
```

**File: `app/Listeners/SendEmailVerification.php`**

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendEmailVerification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $connection = 'redis';
    public string $queue = 'default';
    public int $tries = 3;

    // ... rest of existing implementation
}
```

---

## Phase 5: Add Scheduled Tasks

### Step 5.1: Update Console Schedule

**File: `routes/console.php`**

```php
<?php

use Illuminate\Support\Facades\Schedule;

// Existing schedules...
Schedule::command('app:import-gt7-cars')->monthlyOn(1, '03:00');
Schedule::command('notifications:cleanup')->dailyAt('02:00');

// Horizon maintenance tasks
Schedule::command('horizon:snapshot')->everyFiveMinutes();

// Clean up old failed jobs (keep 7 days)
Schedule::command('queue:prune-failed --hours=168')->daily();

// Clean up old batches (keep 7 days)
Schedule::command('queue:prune-batches --hours=168')->daily();
```

---

## Phase 6: Add Failed Job Handling

### Step 6.1: Create Failed Job Notification Command (Optional)

**File: `app/Console/Commands/NotifyFailedJobs.php`**

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\FailedJobsNotification;

class NotifyFailedJobs extends Command
{
    protected $signature = 'queue:notify-failed {--hours=1 : Check failures in the last N hours}';
    protected $description = 'Send notification if there are recent failed jobs';

    public function handle(): int
    {
        $hours = $this->option('hours');
        $since = now()->subHours($hours);

        $failedCount = DB::table('failed_jobs')
            ->where('failed_at', '>=', $since)
            ->count();

        if ($failedCount > 0) {
            $this->warn("Found {$failedCount} failed jobs in the last {$hours} hour(s)");

            // Send notification to admin
            // You can implement FailedJobsNotification class
            // Notification::route('mail', config('notifications.admin_email'))
            //     ->notify(new FailedJobsNotification($failedCount, $hours));
        } else {
            $this->info('No failed jobs found.');
        }

        return self::SUCCESS;
    }
}
```

---

## Phase 7: Docker Configuration

### Step 7.1: Add Horizon Worker Service

**File: `docker-compose.yml`** (add this service)

```yaml
services:
  # ... existing services ...

  horizon:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: vrl_horizon
    restart: unless-stopped
    working_dir: /var/www
    command: php artisan horizon
    volumes:
      - ./:/var/www
      - ./docker/php/local.ini:/usr/local/etc/php/conf.d/local.ini
    depends_on:
      - redis
      - mariadb
    networks:
      - vrl_network
    environment:
      - APP_ENV=${APP_ENV:-local}
    healthcheck:
      test: ["CMD", "php", "artisan", "horizon:status"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Step 7.2: Update composer.json dev script

**File: `composer.json`** (update dev script)

```json
{
  "scripts": {
    "dev": [
      "Composer\\Config::disableProcessTimeout",
      "npx concurrently -k -c \"cyan,yellow,green,magenta\" --names=\"server,queue,logs,vite\" \"php artisan serve --host=0.0.0.0 --port=80\" \"php artisan horizon\" \"tail -f storage/logs/laravel.log 2>/dev/null || true\" \"npm run dev\""
    ]
  }
}
```

---

## Phase 8: Supervisor Configuration (Production)

### Step 8.1: Create Supervisor Config

**File: `docker/supervisor/horizon.conf`**

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
```

---

## Phase 9: Testing

### Step 9.1: Update Test Configuration

**File: `phpunit.xml`** (ensure queue is sync for tests)

```xml
<php>
    <env name="QUEUE_CONNECTION" value="sync"/>
</php>
```

### Step 9.2: Create Queue Test Helpers

**File: `tests/Feature/QueueTest.php`**

```php
<?php

namespace Tests\Feature;

use App\Notifications\ContactSubmittedNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class QueueTest extends TestCase
{
    public function test_notifications_are_queued(): void
    {
        Queue::fake();

        // Trigger an action that sends a notification
        // ...

        Queue::assertPushedOn('mail', /* notification job */);
    }

    public function test_contact_notification_uses_correct_queues(): void
    {
        $notification = new ContactSubmittedNotification(/* params */);

        $queues = $notification->viaQueues();

        $this->assertEquals('mail', $queues['mail']);
        $this->assertArrayHasKey('App\Infrastructure\Notifications\Channels\DiscordChannel', $queues);
    }
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Install `laravel/horizon` via Composer
- [ ] Run `php artisan horizon:install`
- [ ] Update `.env` with `QUEUE_CONNECTION=redis`
- [ ] Configure `config/horizon.php`
- [ ] Verify Redis connection in `config/queue.php`

### Phase 2: Notifications
- [ ] Update `ContactSubmittedNotification` with queue config
- [ ] Update `EmailVerificationNotification` with queue config
- [ ] Update `PasswordResetNotification` with queue config
- [ ] Update `UserRegisteredNotification` with queue config
- [ ] Update `ContactCopyNotification` with queue config

### Phase 3: Listeners
- [ ] Make `SendContactNotification` queueable
- [ ] Make `SendRegistrationDiscordNotification` queueable
- [ ] Make `SendEmailVerification` queueable

### Phase 4: Service Provider
- [ ] Update `HorizonServiceProvider` with gate and notifications

### Phase 5: Scheduled Tasks
- [ ] Add `horizon:snapshot` to scheduler
- [ ] Add `queue:prune-failed` to scheduler
- [ ] Add `queue:prune-batches` to scheduler

### Phase 6: Docker
- [ ] Add Horizon service to `docker-compose.yml`
- [ ] Update dev script in `composer.json`
- [ ] Create Supervisor config for production

### Phase 7: Testing
- [ ] Ensure `QUEUE_CONNECTION=sync` in phpunit.xml
- [ ] Create queue-related feature tests
- [ ] Test notifications are queued correctly

### Phase 8: Documentation
- [ ] Update `.env.example` with new variables
- [ ] Document Horizon commands for operators
- [ ] Add troubleshooting guide

---

## Artisan Commands Reference

```bash
# Start Horizon (development)
php artisan horizon

# Check Horizon status
php artisan horizon:status

# Pause all queue processing
php artisan horizon:pause

# Resume queue processing
php artisan horizon:continue

# Gracefully terminate Horizon
php artisan horizon:terminate

# Clear all pending jobs
php artisan horizon:clear

# Clear specific queue
php artisan horizon:clear --queue=mail

# View failed jobs
php artisan queue:failed

# Retry specific failed job
php artisan queue:retry {job-id}

# Retry all failed jobs
php artisan queue:retry all

# Delete failed job
php artisan queue:forget {job-id}

# Flush all failed jobs
php artisan queue:flush
```
