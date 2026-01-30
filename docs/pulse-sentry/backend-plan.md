# Laravel Pulse & Sentry.io - Backend Implementation Plan

## Document Overview

This document provides step-by-step instructions for implementing Laravel Pulse and Sentry.io monitoring in the Laravel 12 backend. Each section includes detailed code examples, configuration options, and validation steps.

**Estimated Total Time:** 1-2 days (6-10 hours)

## Table of Contents

1. [Laravel Pulse Installation](#1-laravel-pulse-installation)
2. [Sentry Laravel SDK Installation](#2-sentry-laravel-sdk-installation)
3. [Performance Monitoring Setup](#3-performance-monitoring-setup)
4. [Environment Configuration](#4-environment-configuration)
5. [Testing & Validation](#5-testing--validation)
6. [Production Deployment Checklist](#6-production-deployment-checklist)

---

## 1. Laravel Pulse Installation

**Estimated Time:** 30-45 minutes

### Step 1.1: Install Pulse via Composer

```bash
cd /var/www
composer require laravel/pulse
```

**Expected Output:**
```
Using version ^1.5 for laravel/pulse
./composer.json has been updated
...
Package manifest generated successfully.
```

### Step 1.2: Publish Configuration and Migrations

```bash
php artisan vendor:publish --provider="Laravel\Pulse\PulseServiceProvider"
```

This command creates:
- `config/pulse.php` - Pulse configuration file
- Database migrations for Pulse tables (`pulse_*`)

**Expected Output:**
```
Copied File [/vendor/laravel/pulse/config/pulse.php] To [/config/pulse.php]
Copied Directory [/vendor/laravel/pulse/database/migrations] To [/database/migrations]
Publishing complete.
```

### Step 1.3: Run Migrations

```bash
php artisan migrate
```

**Expected Output:**
```
Running migrations.
2024_01_01_000000_create_pulse_tables .......... DONE
```

**Tables Created:**
- `pulse_aggregates` - Aggregated metrics
- `pulse_entries` - Raw event entries
- `pulse_values` - Recorded values

### Step 1.4: Configure Pulse Recorders

Edit `/var/www/config/pulse.php` to customize recorders:

```php
<?php

use Laravel\Pulse\Recorders;

return [
    /*
    |--------------------------------------------------------------------------
    | Pulse Domain
    |--------------------------------------------------------------------------
    |
    | This is the subdomain where Pulse will be accessible from.
    |
    */

    'domain' => env('PULSE_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Pulse Path
    |--------------------------------------------------------------------------
    */

    'path' => env('PULSE_PATH', 'pulse'),

    /*
    |--------------------------------------------------------------------------
    | Pulse Storage Driver
    |--------------------------------------------------------------------------
    |
    | Supported: "database", "redis"
    |
    */

    'storage' => [
        'driver' => env('PULSE_STORAGE_DRIVER', 'database'),

        'database' => [
            'connection' => env('PULSE_DB_CONNECTION', null),
            'chunk' => 1000,
        ],

        'redis' => [
            'connection' => env('PULSE_REDIS_CONNECTION', null),
            'chunk' => 1000,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pulse Ingest Driver
    |--------------------------------------------------------------------------
    |
    | Supported: "database", "redis"
    |
    */

    'ingest' => [
        'driver' => env('PULSE_INGEST_DRIVER', 'database'),

        'redis' => [
            'connection' => env('PULSE_REDIS_CONNECTION', null),
            'chunk' => 1000,
        ],

        'trim' => [
            'lottery' => [1, 1000],
            'keep' => '7 days',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pulse Recorders
    |--------------------------------------------------------------------------
    */

    'recorders' => [
        // Cache interactions
        Recorders\CacheInteractions::class => [
            'enabled' => env('PULSE_CACHE_INTERACTIONS_ENABLED', true),
            'sample_rate' => env('PULSE_CACHE_INTERACTIONS_SAMPLE_RATE', 1),
            'groups' => [
                '/:\d+/' => ':*',
            ],
            'ignore' => [],
        ],

        // Exceptions
        Recorders\Exceptions::class => [
            'enabled' => env('PULSE_EXCEPTIONS_ENABLED', true),
            'sample_rate' => env('PULSE_EXCEPTIONS_SAMPLE_RATE', 1),
            'location' => true,
            'ignore' => [],
        ],

        // Queue jobs
        Recorders\Queues::class => [
            'enabled' => env('PULSE_QUEUES_ENABLED', true),
            'sample_rate' => env('PULSE_QUEUES_SAMPLE_RATE', 1),
            'ignore' => [],
        ],

        // Slow jobs
        Recorders\SlowJobs::class => [
            'enabled' => env('PULSE_SLOW_JOBS_ENABLED', true),
            'sample_rate' => env('PULSE_SLOW_JOBS_SAMPLE_RATE', 1),
            'threshold' => [
                'default' => env('PULSE_SLOW_JOBS_THRESHOLD', 1000),
            ],
            'ignore' => [],
        ],

        // Slow outgoing requests
        Recorders\SlowOutgoingRequests::class => [
            'enabled' => env('PULSE_SLOW_OUTGOING_REQUESTS_ENABLED', true),
            'sample_rate' => env('PULSE_SLOW_OUTGOING_REQUESTS_SAMPLE_RATE', 1),
            'threshold' => [
                'default' => env('PULSE_SLOW_OUTGOING_REQUESTS_THRESHOLD', 1000),
            ],
            'ignore' => [],
        ],

        // Slow queries
        Recorders\SlowQueries::class => [
            'enabled' => env('PULSE_SLOW_QUERIES_ENABLED', true),
            'sample_rate' => env('PULSE_SLOW_QUERIES_SAMPLE_RATE', 1),
            'threshold' => [
                'default' => env('PULSE_SLOW_QUERIES_THRESHOLD', 1000),
            ],
            'location' => true,
            'ignore' => [],
        ],

        // Slow requests
        Recorders\SlowRequests::class => [
            'enabled' => env('PULSE_SLOW_REQUESTS_ENABLED', true),
            'sample_rate' => env('PULSE_SLOW_REQUESTS_SAMPLE_RATE', 1),
            'threshold' => [
                'default' => env('PULSE_SLOW_REQUESTS_THRESHOLD', 1000),
            ],
            'ignore' => [
                '#^/pulse$#',
                '#^/telescope#',
            ],
        ],

        // Server metrics
        Recorders\Servers::class => [
            'server_name' => env('PULSE_SERVER_NAME', gethostname()),
            'directories' => [
                '/' => 'Root',
            ],
        ],

        // User jobs
        Recorders\UserJobs::class => [
            'enabled' => env('PULSE_USER_JOBS_ENABLED', true),
            'sample_rate' => env('PULSE_USER_JOBS_SAMPLE_RATE', 1),
            'ignore' => [],
        ],

        // User requests
        Recorders\UserRequests::class => [
            'enabled' => env('PULSE_USER_REQUESTS_ENABLED', true),
            'sample_rate' => env('PULSE_USER_REQUESTS_SAMPLE_RATE', 1),
            'ignore' => [
                '#^/pulse$#',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pulse Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => [
        'web',
        'auth:admin',
        'admin.authenticate',
    ],
];
```

### Step 1.5: Configure Admin-Only Dashboard Access

Add to `.env`:

```env
PULSE_DOMAIN=admin.${APP_ROOT_DOMAIN}
PULSE_PATH=pulse
```

**Update Pulse Middleware in `config/pulse.php`:**

```php
'middleware' => [
    'web',
    'auth:admin',
    'admin.authenticate',
],
```

### Step 1.6: Customize Pulse Dashboard (Optional)

Publish the dashboard view:

```bash
php artisan vendor:publish --tag=pulse-dashboard
```

This creates `/var/www/resources/views/vendor/pulse/dashboard.blade.php`.

**Example Customization:**

```blade
<x-pulse>
    <livewire:pulse.servers cols="full" />
    <livewire:pulse.slow-requests cols="6" />
    <livewire:pulse.slow-queries cols="6" />
    <livewire:pulse.exceptions cols="6" />
    <livewire:pulse.queues cols="6" />
    <livewire:pulse.slow-jobs cols="6" />
    <livewire:pulse.cache cols="6" />
    <livewire:pulse.usage cols="4" rows="2" />
</x-pulse>
```

### Step 1.7: Test Pulse Dashboard

1. Start the development server:
```bash
composer dev
```

2. Access the Pulse dashboard:
   - URL: `http://admin.virtualracingleagues.localhost/pulse`
   - Ensure you're logged in as an admin

3. Verify all cards are loading

---

## 2. Sentry Laravel SDK Installation

**Estimated Time:** 45-60 minutes

### Step 2.1: Install Sentry Laravel Package

```bash
composer require sentry/sentry-laravel
```

### Step 2.2: Publish Sentry Configuration

```bash
php artisan vendor:publish --provider="Sentry\Laravel\ServiceProvider"
```

This creates `config/sentry.php`.

### Step 2.3: Configure DSN and Basic Settings

Add to `.env`:

```env
# Sentry Configuration
SENTRY_LARAVEL_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=${APP_ENV}
SENTRY_RELEASE=${APP_NAME}@1.0.0

# Sampling Rates
SENTRY_TRACES_SAMPLE_RATE=0.2
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Additional Options
SENTRY_SEND_DEFAULT_PII=false
SENTRY_ATTACH_STACKTRACE=true
```

**Update `config/sentry.php`:**

```php
<?php

return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),

    'breadcrumbs' => [
        'sql_queries' => true,
        'sql_bindings' => env('SENTRY_SQL_BINDINGS', false),
        'sql_transactions' => true,
        'logs' => true,
        'cache' => true,
        'http_client_requests' => true,
    ],

    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.0),

    'profiles_sample_rate' => (float) env('SENTRY_PROFILES_SAMPLE_RATE', 0.0),

    'environment' => env('SENTRY_ENVIRONMENT', env('APP_ENV', 'production')),

    'release' => env('SENTRY_RELEASE'),

    'server_name' => env('SENTRY_SERVER_NAME', gethostname()),

    'send_default_pii' => env('SENTRY_SEND_DEFAULT_PII', false),

    'ignore_exceptions' => [
        Illuminate\Auth\AuthenticationException::class,
        Illuminate\Auth\Access\AuthorizationException::class,
        Symfony\Component\HttpKernel\Exception\HttpException::class,
        Illuminate\Database\Eloquent\ModelNotFoundException::class,
        Illuminate\Validation\ValidationException::class,
    ],

    'ignore_transactions' => [
        '#^GET /up$#',
        '#^GET /health$#',
        '#^GET /pulse#',
    ],

    'context_lines' => 5,
    'max_breadcrumbs' => 50,
    'sample_rate' => 1.0,

    'in_app_exclude' => [
        base_path('vendor'),
    ],

    'in_app_include' => [
        base_path('app'),
    ],
];
```

### Step 2.4: Integrate Sentry with Exception Handler

**Update `/var/www/bootstrap/app.php`:**

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            require __DIR__.'/../routes/subdomain.php';
            require __DIR__.'/../routes/api.php';
            require __DIR__.'/../routes/web.php';
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // ... existing middleware config
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Sentry integration
        $exceptions->reportable(function (Throwable $e) {
            if (app()->bound('sentry')) {
                \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($e): void {
                    if ($request = request()) {
                        $scope->setContext('request', [
                            'url' => $request->fullUrl(),
                            'method' => $request->method(),
                            'ip' => $request->ip(),
                            'user_agent' => $request->userAgent(),
                        ]);
                    }

                    if (auth()->check()) {
                        $scope->setUser([
                            'id' => (string) auth()->id(),
                            'email' => auth()->user()->email ?? null,
                            'username' => auth()->user()->name ?? null,
                        ]);
                    }

                    $scope->setTag('environment', config('app.env'));
                    $scope->setTag('subdomain', request()->getHost());
                });

                \Sentry\captureException($e);
            }
        });

        // Handle domain-specific exceptions
        // ... existing exception handling
    })->create();
```

### Step 2.5: Configure User Context

**Create `/var/www/app/Providers/SentryServiceProvider.php`:**

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Sentry\State\Scope;

class SentryServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if ($this->app->bound('sentry')) {
            \Sentry\configureScope(function (Scope $scope): void {
                if (Auth::guard('web')->check()) {
                    $user = Auth::guard('web')->user();
                    $scope->setUser([
                        'id' => (string) $user->id,
                        'email' => $user->email ?? null,
                        'username' => $user->name ?? null,
                        'segment' => 'user',
                    ]);
                    $scope->setTag('user_type', 'user');
                }

                if (Auth::guard('admin')->check()) {
                    $admin = Auth::guard('admin')->user();
                    $scope->setUser([
                        'id' => (string) $admin->id,
                        'email' => $admin->email ?? null,
                        'username' => $admin->name ?? null,
                        'segment' => 'admin',
                    ]);
                    $scope->setTag('user_type', 'admin');
                }

                $scope->setTag('app_version', config('app.version', '1.0.0'));
                $scope->setTag('environment', config('app.env'));
            });
        }
    }
}
```

**Register in `/var/www/bootstrap/providers.php`:**

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\SentryServiceProvider::class,
];
```

### Step 2.6: Test Sentry Integration

**Create a test route (temporary):**

```php
Route::get('/test-sentry', function () {
    \Sentry\addBreadcrumb(new \Sentry\Breadcrumb(
        \Sentry\Breadcrumb::LEVEL_INFO,
        \Sentry\Breadcrumb::TYPE_DEFAULT,
        'test',
        'Test breadcrumb added'
    ));

    throw new \Exception('Test exception for Sentry');
});
```

**Test and verify in Sentry dashboard, then remove the test route.**

---

## 3. Performance Monitoring Setup

**Estimated Time:** 30-45 minutes

### Step 3.1: Enable Performance Tracing

Already configured in `.env`:

```env
SENTRY_TRACES_SAMPLE_RATE=0.2
```

### Step 3.2: Add Custom Transaction Instrumentation

**Create `/var/www/app/Http/Middleware/SentryTransactionMiddleware.php`:**

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Sentry\Tracing\TransactionContext;

class SentryTransactionMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!app()->bound('sentry')) {
            return $next($request);
        }

        $transactionContext = new TransactionContext();
        $transactionContext->setName($this->getTransactionName($request));
        $transactionContext->setOp('http.server');

        $transaction = \Sentry\startTransaction($transactionContext);

        \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($transaction): void {
            $scope->setSpan($transaction);
        });

        $transaction->setData([
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'route' => $request->route()?->getName(),
        ]);

        try {
            $response = $next($request);
            $transaction->setHttpStatus($response->getStatusCode());
            $transaction->setStatus(\Sentry\Tracing\SpanStatus::ok());
            return $response;
        } catch (\Throwable $e) {
            $transaction->setStatus(\Sentry\Tracing\SpanStatus::internalError());
            throw $e;
        } finally {
            $transaction->finish();
        }
    }

    protected function getTransactionName(Request $request): string
    {
        $route = $request->route();

        if ($route) {
            return $request->method() . ' ' . ($route->getName() ?? $route->uri());
        }

        return $request->method() . ' ' . $request->path();
    }
}
```

**Register middleware in `/var/www/bootstrap/app.php`:**

```php
$middleware->append(\App\Http\Middleware\SentryTransactionMiddleware::class);
```

### Step 3.3: Queue Job Monitoring

**Create `/var/www/app/Http/Middleware/SentryJobMiddleware.php`:**

```php
<?php

namespace App\Http\Middleware;

use Sentry\Tracing\TransactionContext;

class SentryJobMiddleware
{
    public function handle($job, $next)
    {
        if (!app()->bound('sentry')) {
            return $next($job);
        }

        $transactionContext = new TransactionContext();
        $transactionContext->setName(get_class($job->job));
        $transactionContext->setOp('queue.job');

        $transaction = \Sentry\startTransaction($transactionContext);

        \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($transaction): void {
            $scope->setSpan($transaction);
        });

        try {
            $result = $next($job);
            $transaction->setStatus(\Sentry\Tracing\SpanStatus::ok());
            return $result;
        } catch (\Throwable $e) {
            $transaction->setStatus(\Sentry\Tracing\SpanStatus::internalError());
            \Sentry\captureException($e);
            throw $e;
        } finally {
            $transaction->finish();
        }
    }
}
```

**Apply to jobs:**

```php
public function middleware(): array
{
    return [new SentryJobMiddleware()];
}
```

---

## 4. Environment Configuration

### Development Environment

```env
# App
APP_ENV=local
APP_DEBUG=true

# Sentry
SENTRY_LARAVEL_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_SEND_DEFAULT_PII=true

# Pulse
PULSE_ENABLED=true
PULSE_INGEST_DRIVER=database
PULSE_DOMAIN=admin.${APP_ROOT_DOMAIN}

# Pulse Thresholds (lower in dev)
PULSE_SLOW_JOBS_THRESHOLD=500
PULSE_SLOW_QUERIES_THRESHOLD=100
PULSE_SLOW_REQUESTS_THRESHOLD=500

# Pulse Sampling (100% in dev)
PULSE_CACHE_INTERACTIONS_SAMPLE_RATE=1
PULSE_EXCEPTIONS_SAMPLE_RATE=1
PULSE_QUEUES_SAMPLE_RATE=1
```

### Production Environment

```env
# App
APP_ENV=production
APP_DEBUG=false

# Sentry
SENTRY_LARAVEL_DSN=https://productionPublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=vrl@${CI_COMMIT_SHA}
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.05
SENTRY_SEND_DEFAULT_PII=false

# Pulse
PULSE_ENABLED=true
PULSE_INGEST_DRIVER=redis
PULSE_REDIS_CONNECTION=pulse
PULSE_DOMAIN=admin.${APP_ROOT_DOMAIN}

# Pulse Thresholds (production values)
PULSE_SLOW_JOBS_THRESHOLD=1000
PULSE_SLOW_QUERIES_THRESHOLD=500
PULSE_SLOW_REQUESTS_THRESHOLD=1000

# Pulse Sampling (reduced in production)
PULSE_CACHE_INTERACTIONS_SAMPLE_RATE=0.1
PULSE_EXCEPTIONS_SAMPLE_RATE=1.0
PULSE_QUEUES_SAMPLE_RATE=0.2
```

### Redis Configuration for Pulse (Production)

**Add to `/var/www/config/database.php`:**

```php
'redis' => [
    'default' => [
        // ... existing config
    ],

    'pulse' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_PULSE_DB', '2'),
    ],
],
```

---

## 5. Testing & Validation

### Step 5.1: Unit Tests

**Create `/var/www/tests/Feature/SentryIntegrationTest.php`:**

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class SentryIntegrationTest extends TestCase
{
    public function test_sentry_is_bound(): void
    {
        $this->assertTrue($this->app->bound('sentry'));
    }

    public function test_exception_capture(): void
    {
        $this->expectException(\Exception::class);

        try {
            throw new \Exception('Test exception');
        } catch (\Exception $e) {
            $eventId = \Sentry\captureException($e);
            $this->assertNotNull($eventId);
            throw $e;
        }
    }

    public function test_transaction_tracing(): void
    {
        $transactionContext = new \Sentry\Tracing\TransactionContext();
        $transactionContext->setName('test_transaction');
        $transactionContext->setOp('test');

        $transaction = \Sentry\startTransaction($transactionContext);

        $this->assertNotNull($transaction);

        $transaction->finish();
    }
}
```

**Run tests:**

```bash
php artisan test --filter=SentryIntegrationTest
```

### Step 5.2: Manual Testing

1. **Test Pulse Dashboard:**
   - Access `http://admin.virtualracingleagues.localhost/pulse`
   - Verify all cards load

2. **Test Sentry:**
   - Trigger a test error
   - Verify in Sentry dashboard

---

## 6. Production Deployment Checklist

### Pre-Deployment

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Pulse configuration optimized
- [ ] Sentry configuration optimized
- [ ] Redis configured (for Pulse)

### Deployment Steps

1. **Deploy Code:**
   ```bash
   git pull origin main
   composer install --no-dev --optimize-autoloader
   ```

2. **Run Migrations:**
   ```bash
   php artisan migrate --force
   ```

3. **Clear Caches:**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

4. **Start Pulse Worker (if using Redis):**
   ```bash
   php artisan pulse:work &
   ```

5. **Restart Queue Workers:**
   ```bash
   php artisan queue:restart
   ```

### Post-Deployment Validation

- [ ] Pulse dashboard accessible (admin-only)
- [ ] Sentry receiving errors
- [ ] Performance transactions visible
- [ ] No performance degradation

### Rollback Plan

```env
PULSE_ENABLED=false
SENTRY_TRACES_SAMPLE_RATE=0
```

```bash
php artisan config:clear
php artisan config:cache
php artisan queue:restart
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Pulse 404 error | `php artisan route:clear && php artisan route:cache` |
| Pulse no data | Check env vars, recorders, database connection |
| Sentry not capturing | Verify DSN, network, sample rate |
| High overhead | Reduce sampling, disable high-volume recorders, use Redis |

---

## Next Steps

1. Read [frontend-plan.md](./frontend-plan.md) for Vue integration
2. Configure alert rules in Sentry
3. Set up team notifications (Slack, Discord)
4. Train team on dashboards

---

## Resources

- [Laravel Pulse Documentation](https://laravel.com/docs/12.x/pulse)
- [Sentry Laravel Documentation](https://docs.sentry.io/platforms/php/guides/laravel/)
- [Laravel Pulse GitHub](https://github.com/laravel/pulse)
- [Sentry Laravel GitHub](https://github.com/getsentry/sentry-laravel)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** Ready for Implementation
