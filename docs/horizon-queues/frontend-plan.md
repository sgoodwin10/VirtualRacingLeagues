# Frontend Implementation Plan: Horizon Dashboard Integration

## Overview

This document covers the frontend aspects of implementing Laravel Horizon, including dashboard access, admin navigation integration, and any Vue.js components needed for queue monitoring.

## Horizon Dashboard Access

### Dashboard URL

The Horizon dashboard will be accessible at:
```
https://admin.virtualracingleagues.localhost/admin/horizon
```

This follows the existing admin subdomain pattern and is protected by admin authentication.

### Route Configuration

Laravel Horizon registers its own routes. We need to ensure they integrate properly with our subdomain architecture.

**File: `routes/subdomain.php`**

The Horizon routes are automatically registered by the `HorizonServiceProvider`. We need to ensure the middleware is correctly configured:

```php
// In config/horizon.php
'middleware' => ['web', 'auth:admin'],
'domain' => env('HORIZON_DOMAIN', 'admin.virtualracingleagues.localhost'),
'path' => env('HORIZON_PATH', 'admin/horizon'),
```

### Authentication

Horizon dashboard access is controlled by:

1. **Middleware**: The `auth:admin` middleware ensures only authenticated admins can access
2. **Gate**: The `viewHorizon` gate in `HorizonServiceProvider` provides additional authorization

---

## Admin Navigation Integration

### Step 1: Add Horizon Link to Admin Sidebar

**File: `resources/admin/js/components/layout/AdminSidebar.vue`**

Add a link to Horizon in the admin navigation:

```vue
<template>
  <div class="admin-sidebar">
    <!-- Existing navigation items -->

    <!-- System Section -->
    <div class="nav-section">
      <h3 class="nav-section-title">System</h3>
      <nav class="nav-items">
        <!-- Other system links -->

        <a
          href="/admin/horizon"
          target="_blank"
          class="nav-item"
          rel="noopener noreferrer"
        >
          <PhQueue :size="20" />
          <span>Queue Monitor</span>
          <PhArrowSquareOut :size="14" class="external-icon" />
        </a>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhQueue, PhArrowSquareOut } from '@phosphor-icons/vue';
</script>

<style scoped>
.external-icon {
  margin-left: auto;
  opacity: 0.5;
}
</style>
```

### Step 2: Add Queue Stats Widget to Admin Dashboard (Optional)

Create a widget to show queue health on the admin dashboard:

**File: `resources/admin/js/components/dashboard/QueueStatsWidget.vue`**

```vue
<template>
  <Card class="queue-stats-widget">
    <template #title>
      <div class="flex items-center gap-2">
        <PhQueue :size="20" />
        <span>Queue Status</span>
      </div>
    </template>
    <template #content>
      <div v-if="loading" class="loading">
        <ProgressSpinner style="width: 30px; height: 30px" />
      </div>
      <div v-else-if="error" class="error">
        <Message severity="error" :closable="false">
          Failed to load queue stats
        </Message>
      </div>
      <div v-else class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Status</span>
          <Tag
            :severity="stats.status === 'running' ? 'success' : 'warning'"
            :value="stats.status"
          />
        </div>
        <div class="stat-item">
          <span class="stat-label">Jobs/min</span>
          <span class="stat-value">{{ stats.jobsPerMinute }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Failed</span>
          <span class="stat-value" :class="{ 'text-red-500': stats.failedJobs > 0 }">
            {{ stats.failedJobs }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Processes</span>
          <span class="stat-value">{{ stats.processes }}</span>
        </div>
      </div>
      <div class="mt-4">
        <a
          href="/admin/horizon"
          target="_blank"
          class="text-primary hover:underline text-sm"
        >
          Open Horizon Dashboard →
        </a>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { PhQueue } from '@phosphor-icons/vue';

interface QueueStats {
  status: string;
  jobsPerMinute: number;
  failedJobs: number;
  processes: number;
  recentJobs: number;
}

const loading = ref(true);
const error = ref(false);
const stats = ref<QueueStats>({
  status: 'inactive',
  jobsPerMinute: 0,
  failedJobs: 0,
  processes: 0,
  recentJobs: 0,
});

const fetchStats = async () => {
  try {
    loading.value = true;
    const response = await fetch('/admin/horizon/api/stats');
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    stats.value = {
      status: data.status,
      jobsPerMinute: data.jobsPerMinute,
      failedJobs: data.failedJobs,
      processes: data.processes,
      recentJobs: data.recentJobs,
    };
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
  // Refresh every 30 seconds
  setInterval(fetchStats, 30000);
});
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
```

---

## API Endpoints for Frontend (Optional)

If you want to display queue information in custom Vue components, you can create a proxy API endpoint:

### Backend API Route

**File: `routes/subdomain.php`** (in admin API routes)

```php
// Admin API routes
Route::middleware(['auth:admin', 'admin.authenticate'])->group(function () {
    // ... existing routes ...

    // Queue stats proxy (optional - for custom dashboard widgets)
    Route::get('/queue/stats', function () {
        try {
            $stats = app(\Laravel\Horizon\Contracts\MetricsRepository::class);
            return response()->json([
                'status' => app(\Laravel\Horizon\Contracts\MasterSupervisorRepository::class)->all() ? 'running' : 'inactive',
                'jobsPerMinute' => $stats->jobsProcessedPerMinute(),
                'failedJobs' => $stats->failedJobsCount(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Horizon not running'], 503);
        }
    })->name('admin.queue.stats');
});
```

### Frontend Service

**File: `resources/admin/js/services/queueService.ts`**

```typescript
import api from './api';

export interface QueueStats {
  status: string;
  jobsPerMinute: number;
  failedJobs: number;
  processes?: number;
  recentJobs?: number;
}

export const queueService = {
  async getStats(): Promise<QueueStats> {
    const response = await api.get('/admin/api/queue/stats');
    return response.data;
  },
};

export default queueService;
```

---

## Horizon Dashboard Customization

Laravel Horizon's dashboard is a standalone Vue.js application that comes pre-built. However, you can customize it:

### Dark Mode

Enable dark mode to match admin theme:

**File: `app/Providers/HorizonServiceProvider.php`**

```php
public function boot(): void
{
    parent::boot();

    // Enable dark mode
    Horizon::night();
}
```

### Custom CSS (Optional)

If you need to customize the Horizon dashboard appearance, publish the assets:

```bash
php artisan vendor:publish --tag=horizon-assets
```

This publishes to `public/vendor/horizon/`. You can then modify the CSS.

---

## Security Considerations

### 1. CORS Configuration

Horizon dashboard makes API calls to its own endpoints. Ensure CORS is properly configured if accessing from different origins.

### 2. Session Handling

Since Horizon uses the `auth:admin` middleware, the admin session cookie must be valid:
- Session domain: `.virtualracingleagues.localhost`
- Same-site: `lax`

### 3. External Access

For production, consider:
- IP whitelisting for Horizon dashboard
- VPN-only access
- Additional 2FA for sensitive operations

**File: `app/Providers/HorizonServiceProvider.php`** (production hardening)

```php
protected function gate(): void
{
    Gate::define('viewHorizon', function ($user) {
        // Check for specific admin role/permission
        return $user->hasRole('super-admin');

        // Or check specific permission
        // return $user->can('view-horizon');

        // Or IP whitelist (for extra security)
        // return in_array(request()->ip(), config('horizon.allowed_ips', []));
    });
}
```

---

## Testing

### E2E Test for Horizon Access

**File: `tests/e2e/admin/horizon.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Horizon Dashboard', () => {
  test('should be accessible to authenticated admins', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/horizon');

    // Horizon dashboard should load
    await expect(page.locator('text=Laravel Horizon')).toBeVisible();
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/admin/horizon');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });
});
```

---

## Implementation Checklist

### Dashboard Access
- [ ] Configure Horizon domain and path in config
- [ ] Verify `auth:admin` middleware is applied
- [ ] Test dashboard access with admin credentials
- [ ] Test redirect for unauthenticated users

### Admin Navigation
- [ ] Add Horizon link to admin sidebar
- [ ] Add external link indicator icon
- [ ] Test navigation link works correctly

### Optional Enhancements
- [ ] Create QueueStatsWidget component
- [ ] Add queue stats to admin dashboard
- [ ] Create custom API endpoint for stats
- [ ] Enable dark mode for Horizon

### Security
- [ ] Verify session cookie configuration
- [ ] Test gate authorization
- [ ] Consider IP whitelisting for production
- [ ] Document access requirements

---

## User Interface Preview

After implementation, the admin experience will be:

1. **Admin Dashboard**: Shows queue health widget with:
   - Current status (running/paused/inactive)
   - Jobs processed per minute
   - Failed jobs count
   - Quick link to Horizon

2. **Admin Sidebar**: Contains "Queue Monitor" link under System section

3. **Horizon Dashboard**: Full-featured monitoring at `/admin/horizon`:
   - Real-time job metrics
   - Queue workload visualization
   - Failed job management
   - Supervisor status
   - Job search and filtering

---

## Notes

- Horizon's dashboard is a separate Vue.js application (not integrated with our admin Vue app)
- It opens in a new tab/window from the admin sidebar
- All Horizon API endpoints are automatically secured by the middleware
- The dashboard is fully responsive and works on mobile devices
- Horizon includes its own WebSocket connection for real-time updates
