# Laravel Pulse & Sentry Quick Start Guide

## Getting Started

### 1. Set Up Environment Variables

Add to your `.env` file:

```env
# Sentry Configuration
SENTRY_LARAVEL_DSN=https://[YOUR_DSN]@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=local
SENTRY_TRACES_SAMPLE_RATE=1.0

# Pulse Configuration
PULSE_ENABLED=true
PULSE_DOMAIN=admin.virtualracingleagues.localhost
```

**Get your Sentry DSN:**
1. Go to [sentry.io](https://sentry.io)
2. Create a new Laravel project
3. Copy the DSN from project settings

### 2. Access Pulse Dashboard

1. Log in as an admin user
2. Navigate to: `http://admin.virtualracingleagues.localhost/pulse`

### 3. Test Sentry Integration

Create a test route (temporary):

```php
// routes/subdomain.php
Route::get('/test-sentry', function () {
    throw new \Exception('Test exception for Sentry');
});
```

Visit: `http://virtualracingleagues.localhost/test-sentry`

Check Sentry dashboard to see the exception.

**Remember to remove the test route after testing!**

## Using Sentry in Your Code

### Capture Custom Exceptions

```php
try {
    // Your code
} catch (\Exception $e) {
    \Sentry\captureException($e);
    // Handle error
}
```

### Add Custom Context

```php
\Sentry\configureScope(function (\Sentry\State\Scope $scope): void {
    $scope->setContext('custom_data', [
        'key' => 'value',
    ]);
});
```

### Add Breadcrumbs

```php
\Sentry\addBreadcrumb(new \Sentry\Breadcrumb(
    \Sentry\Breadcrumb::LEVEL_INFO,
    \Sentry\Breadcrumb::TYPE_DEFAULT,
    'category',
    'Message here'
));
```

### Manual Transactions

```php
$transactionContext = new \Sentry\Tracing\TransactionContext();
$transactionContext->setName('my_operation');
$transactionContext->setOp('task');

$transaction = \Sentry\startTransaction($transactionContext);

try {
    // Your code
    $transaction->setStatus(\Sentry\Tracing\SpanStatus::ok());
} catch (\Throwable $e) {
    $transaction->setStatus(\Sentry\Tracing\SpanStatus::internalError());
    throw $e;
} finally {
    $transaction->finish();
}
```

## Pulse Monitoring

### What Pulse Tracks

- **Server Metrics:** CPU, memory, disk usage
- **Slow Requests:** Requests taking > 1000ms (configurable)
- **Slow Queries:** Database queries > 1000ms (configurable)
- **Exceptions:** All exceptions in your application
- **Queue Jobs:** Job processing times and failures
- **Cache:** Cache hits, misses, and operations
- **User Activity:** Requests and jobs by user

### Adjusting Thresholds

In `.env`:

```env
# Lower for development (catch more issues)
PULSE_SLOW_REQUESTS_THRESHOLD=500
PULSE_SLOW_QUERIES_THRESHOLD=100
PULSE_SLOW_JOBS_THRESHOLD=500

# Higher for production (only critical issues)
PULSE_SLOW_REQUESTS_THRESHOLD=2000
PULSE_SLOW_QUERIES_THRESHOLD=1000
PULSE_SLOW_JOBS_THRESHOLD=2000
```

### Sample Rates

Control how much data is collected (0.0 to 1.0):

```env
# Development: Collect everything
PULSE_EXCEPTIONS_SAMPLE_RATE=1
PULSE_SLOW_REQUESTS_SAMPLE_RATE=1

# Production: Sample to reduce overhead
PULSE_EXCEPTIONS_SAMPLE_RATE=1.0    # Always collect exceptions
PULSE_SLOW_REQUESTS_SAMPLE_RATE=0.2 # Collect 20% of slow requests
PULSE_CACHE_INTERACTIONS_SAMPLE_RATE=0.1 # Collect 10% of cache ops
```

## Production Best Practices

### 1. Use Redis for Pulse (Production Only)

```env
PULSE_INGEST_DRIVER=redis
PULSE_REDIS_CONNECTION=pulse
```

### 2. Optimize Sample Rates

```env
# Only sample high-volume data
PULSE_CACHE_INTERACTIONS_SAMPLE_RATE=0.1
PULSE_QUEUES_SAMPLE_RATE=0.2
PULSE_USER_REQUESTS_SAMPLE_RATE=0.2

# Always collect critical data
PULSE_EXCEPTIONS_SAMPLE_RATE=1.0
PULSE_SLOW_QUERIES_SAMPLE_RATE=1.0
```

### 3. Adjust Sentry Sample Rates

```env
# Production
SENTRY_TRACES_SAMPLE_RATE=0.1        # 10% of transactions
SENTRY_PROFILES_SAMPLE_RATE=0.05     # 5% of profiles
SENTRY_SEND_DEFAULT_PII=false        # Don't send PII
```

### 4. Disable in Non-Production

```env
# Staging/Testing
PULSE_ENABLED=false
SENTRY_TRACES_SAMPLE_RATE=0
```

## Troubleshooting

### Pulse Dashboard Shows No Data

1. Check `PULSE_ENABLED=true` in `.env`
2. Verify database migrations ran: `php artisan migrate`
3. Clear config cache: `php artisan config:clear`
4. Trigger some activity (browse the site, run jobs, etc.)
5. Wait 10-15 seconds and refresh dashboard

### Pulse Dashboard Shows 404

1. Clear route cache: `php artisan route:clear`
2. Verify you're logged in as admin
3. Check domain matches: `admin.virtualracingleagues.localhost/pulse`

### Sentry Not Capturing Exceptions

1. Verify DSN is set correctly in `.env`
2. Check `APP_ENV` is not `testing` (Sentry is disabled in tests)
3. Verify exception is not in `ignore_exceptions` list (`config/sentry.php`)
4. Check network connectivity to Sentry.io

### High Performance Overhead

1. Reduce sample rates for high-volume recorders
2. Switch to Redis ingest driver: `PULSE_INGEST_DRIVER=redis`
3. Disable specific recorders: `PULSE_CACHE_INTERACTIONS_ENABLED=false`
4. Increase thresholds to only capture slow operations

## Monitoring Checklist

### Daily
- [ ] Check Pulse dashboard for slow queries
- [ ] Review exceptions in Sentry

### Weekly
- [ ] Review Sentry performance trends
- [ ] Check Pulse server metrics
- [ ] Review slow requests patterns

### Monthly
- [ ] Optimize slow queries identified by Pulse
- [ ] Review and adjust sample rates based on volume
- [ ] Clean up old Pulse data (automatic after 7 days)

## Support

- Laravel Pulse Docs: https://laravel.com/docs/12.x/pulse
- Sentry Laravel Docs: https://docs.sentry.io/platforms/php/guides/laravel/
- Project Documentation: `/var/www/docs/pulse-sentry/backend-plan.md`
