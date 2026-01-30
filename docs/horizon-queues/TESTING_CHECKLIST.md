# Laravel Horizon Testing Checklist

## Pre-Testing Verification

- [x] Laravel Horizon package installed (v5.43.0)
- [x] Configuration published to `config/horizon.php`
- [x] HorizonServiceProvider registered in `bootstrap/providers.php`
- [x] Environment variables added to `.env` and `.env.example`
- [x] Docker service added to `docker-compose.yml`
- [x] Composer dev script updated
- [x] Queue connection changed to `redis`
- [x] Horizon routes registered (verified via `artisan route:list`)

## Manual Testing Steps

### 1. Start Horizon

```bash
# Clear any cached config first
php artisan config:clear

# Start Horizon
composer dev
```

**Expected Result**: You should see output from 4 concurrent processes:
- `server` - Laravel development server
- `horizon` - Horizon queue worker
- `logs` - Log tail
- `vite` - Vite dev server

**Verify**: Look for messages like:
```
[horizon] Horizon started successfully.
```

### 2. Access Horizon Dashboard

**URL**: http://admin.virtualracingleagues.localhost:8000/admin/horizon

**Steps**:
1. Navigate to http://admin.virtualracingleagues.localhost:8000/admin/login
2. Login with admin credentials
3. Navigate to http://admin.virtualracingleagues.localhost:8000/admin/horizon

**Expected Result**:
- Dashboard loads successfully
- Shows "Active" status
- Displays two supervisors:
  - `supervisor-default`
  - `supervisor-notifications`
- Metrics graphs are visible

**Troubleshooting**:
- If 404: Check URL and subdomain
- If redirected to login: Ensure you're logged in as admin
- If blank page: Check browser console for errors

### 3. Test Queue Processing

Create a test job:

```bash
php artisan make:job TestHorizonJob
```

Edit `app/Jobs/TestHorizonJob.php`:

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TestHorizonJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $message = 'Test message')
    {
        //
    }

    public function handle(): void
    {
        Log::info('TestHorizonJob executed', ['message' => $this->message]);
        sleep(2); // Simulate work
    }
}
```

Dispatch the job via tinker:

```bash
php artisan tinker
```

```php
\App\Jobs\TestHorizonJob::dispatch('Hello Horizon!');
```

**Expected Result**:
- Job appears in "Pending Jobs" section of Horizon dashboard
- Job moves to "Completed Jobs" after processing
- Log entry appears in `storage/logs/laravel.log`

### 4. Test Queue-Specific Dispatching

```php
// In tinker
\App\Jobs\TestHorizonJob::dispatch('Mail queue test')->onQueue('mail');
\App\Jobs\TestHorizonJob::dispatch('Discord queue test')->onQueue('discord');
\App\Jobs\TestHorizonJob::dispatch('Default queue test')->onQueue('default');
```

**Expected Result**:
- Jobs appear in their respective queues in Horizon
- All jobs process successfully
- Can view metrics for each queue

### 5. Test Failed Job Handling

Create a failing job:

```php
// In tinker
\App\Jobs\TestHorizonJob::dispatch('This will fail')
    ->onQueue('default');
```

Then modify `TestHorizonJob::handle()` to throw an exception:

```php
public function handle(): void
{
    throw new \Exception('Test failure');
}
```

Dispatch again:

```php
\App\Jobs\TestHorizonJob::dispatch('Force failure');
```

**Expected Result**:
- Job appears in "Failed Jobs" section
- Can retry the job from dashboard
- Can view exception details

### 6. Test Horizon Commands

```bash
# Check status
php artisan horizon:status
# Expected: "Horizon is running."

# Pause processing
php artisan horizon:pause
# Expected: All jobs stop processing

# Check dashboard - should show "Paused" status

# Resume processing
php artisan horizon:continue
# Expected: Processing resumes

# Clear a specific queue
php artisan horizon:clear --queue=mail
# Expected: All pending jobs in mail queue are cleared
```

### 7. Test Docker Service

```bash
# Stop composer dev
# Press Ctrl+C to stop all processes

# Start Horizon via Docker
docker-compose up -d horizon

# Check logs
docker-compose logs -f horizon

# Check health
docker-compose ps horizon
```

**Expected Result**:
- Container starts successfully
- Horizon is running
- Health check passes
- Dashboard accessible

### 8. Test Long Wait Threshold

Dispatch many jobs to trigger wait threshold:

```php
// In tinker
for ($i = 0; $i < 20; $i++) {
    \App\Jobs\TestHorizonJob::dispatch("Job $i")->onQueue('mail');
}
```

**Expected Result**:
- Jobs queue up
- Wait time increases
- If wait time exceeds 30 seconds (mail queue threshold), notification should be sent (when Phase 2 is complete)

### 9. Test Metrics

```bash
# Ensure Horizon snapshot command is working
php artisan horizon:snapshot
```

**Expected Result**:
- Metrics are captured
- Dashboard shows graphs for:
  - Jobs per minute
  - Processes per queue
  - Wait time per queue

### 10. Test Failed Job Retry

```bash
# View failed jobs
php artisan queue:failed

# Retry a specific failed job (replace {id} with actual ID)
php artisan queue:retry {id}

# Or retry all
php artisan queue:retry all
```

**Expected Result**:
- Failed jobs are retried
- Jobs reappear in pending queue
- If successful, move to completed jobs

## Configuration Verification

### Check Redis Connection

```bash
# Test Redis connection
redis-cli ping
# Expected: PONG

# Check queue keys
redis-cli keys "*horizon*"
# Expected: Various horizon keys
```

### Check Environment Variables

```bash
# View current config
php artisan about | grep -E "(Queue|Horizon)"
# Expected:
#   Queue ................................................ redis
```

### Check Horizon Configuration

```bash
php artisan tinker
```

```php
config('horizon.domain');
// Expected: "admin.virtualracingleagues.localhost"

config('horizon.path');
// Expected: "admin/horizon"

config('horizon.middleware');
// Expected: ["web", "auth:admin"]

config('horizon.waits');
// Expected: ["redis:default" => 60, "redis:mail" => 30, "redis:discord" => 45]
```

## Performance Testing

### Load Test

Dispatch 100 jobs and measure processing time:

```php
// In tinker
$start = microtime(true);
for ($i = 0; $i < 100; $i++) {
    \App\Jobs\TestHorizonJob::dispatch("Load test $i");
}
$end = microtime(true);
echo "Dispatched 100 jobs in " . ($end - $start) . " seconds\n";
```

**Expected Result**:
- All jobs dispatch quickly (< 1 second)
- Jobs process efficiently
- Dashboard shows metrics
- No memory issues

### Concurrent Queue Test

```php
// In tinker
for ($i = 0; $i < 50; $i++) {
    \App\Jobs\TestHorizonJob::dispatch("Default $i")->onQueue('default');
    \App\Jobs\TestHorizonJob::dispatch("Mail $i")->onQueue('mail');
    \App\Jobs\TestHorizonJob::dispatch("Discord $i")->onQueue('discord');
}
```

**Expected Result**:
- All three queues process jobs concurrently
- `supervisor-notifications` handles mail and discord queues
- `supervisor-default` handles default queue
- No queue starvation

## Integration Testing (After Phase 2)

These tests require Phase 2 (notification updates) to be complete:

- [ ] Test email notifications are queued
- [ ] Test Discord notifications are queued
- [ ] Test notification retries
- [ ] Test notification backoff strategy
- [ ] Test notification timeouts

## Cleanup

After testing:

```bash
# Delete test job
rm app/Jobs/TestHorizonJob.php

# Clear failed jobs
php artisan queue:flush

# Clear Redis queue data
redis-cli FLUSHDB

# Restart Horizon
php artisan horizon:terminate
composer dev
```

## Common Issues and Solutions

### Issue: Horizon not starting
**Solution**:
```bash
php artisan config:clear
php artisan cache:clear
composer dev
```

### Issue: Jobs not processing
**Solution**:
```bash
# Check Horizon status
php artisan horizon:status

# Check Redis
redis-cli ping

# Restart Horizon
php artisan horizon:terminate
composer dev
```

### Issue: Dashboard 404
**Solution**:
- Verify URL: `http://admin.virtualracingleagues.localhost:8000/admin/horizon`
- Check you're logged in as admin
- Clear config: `php artisan config:clear`

### Issue: Permission denied
**Solution**:
- Ensure you're using `auth:admin` middleware
- Check admin authentication is working
- Verify gate in HorizonServiceProvider

### Issue: Jobs stuck in pending
**Solution**:
```bash
# Check if Horizon is paused
php artisan horizon:status

# Resume if paused
php artisan horizon:continue

# Check logs for errors
php artisan pail --filter="queue"
```

## Success Criteria

All tests should pass with:
- ✅ Horizon dashboard accessible
- ✅ Jobs dispatch successfully
- ✅ Jobs process from all queues
- ✅ Failed jobs appear in failed jobs section
- ✅ Metrics display correctly
- ✅ Docker service runs successfully
- ✅ Commands work as expected
- ✅ No errors in logs

## Next Steps After Successful Testing

1. Proceed to Phase 2: Update notification classes
2. Proceed to Phase 3: Update event listeners
3. Proceed to Phase 4: Add scheduled tasks
4. Proceed to Phase 5: Add failed job notifications
5. Proceed to Phase 6: Add comprehensive testing
