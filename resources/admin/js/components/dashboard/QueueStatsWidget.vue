<template>
  <Card class="queue-stats-widget">
    <template #title>
      <div class="flex items-center gap-2">
        <PhQueue :size="20" weight="duotone" />
        <span>Queue Status</span>
      </div>
    </template>
    <template #content>
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-6">
        <ProgressSpinner style="width: 40px; height: 40px" stroke-width="4" />
      </div>

      <!-- Error State -->
      <div v-else-if="error">
        <Message severity="warn" :closable="false"> Queue monitoring unavailable </Message>
      </div>

      <!-- Stats Grid -->
      <div v-else class="stats-content">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Status</span>
            <Tag
              :severity="stats.status === 'running' ? 'success' : 'warn'"
              :value="stats.status === 'running' ? 'Running' : 'Inactive'"
              :icon="stats.status === 'running' ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'"
            />
          </div>

          <div class="stat-item">
            <span class="stat-label">Jobs/min</span>
            <div class="stat-value">
              {{ stats.jobsPerMinute }}
            </div>
          </div>

          <div class="stat-item">
            <span class="stat-label">Failed Jobs</span>
            <div class="stat-value" :class="{ 'text-red-500': stats.failedJobs > 0 }">
              {{ stats.failedJobs }}
            </div>
          </div>

          <div class="stat-item">
            <span class="stat-label">Processes</span>
            <div class="stat-value">
              {{ stats.processes }}
            </div>
          </div>
        </div>

        <!-- Link to Horizon Dashboard -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <a
            href="/admin/horizon"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            <span>Open Horizon Dashboard</span>
            <PhArrowSquareOut :size="16" weight="bold" />
          </a>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { PhQueue, PhArrowSquareOut } from '@phosphor-icons/vue';
import { queueService } from '@admin/services/queueService';
import type { QueueStats } from '@admin/services/queueService';
import { logger } from '@admin/utils/logger';

// State
const loading = ref(true);
const error = ref(false);
const stats = ref<QueueStats>({
  status: 'inactive',
  jobsPerMinute: 0,
  failedJobs: 0,
  processes: 0,
  recentJobs: 0,
});

// Refresh interval reference
let refreshInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Fetch queue stats from API
 */
const fetchStats = async (): Promise<void> => {
  try {
    loading.value = true;
    error.value = false;

    const data = await queueService.getStats();
    stats.value = data;

    logger.debug('Queue stats fetched:', data);
  } catch (err) {
    error.value = true;
    logger.error('Failed to fetch queue stats:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * Setup auto-refresh interval
 */
const setupAutoRefresh = (): void => {
  // Refresh every 30 seconds
  refreshInterval = setInterval(() => {
    fetchStats();
  }, 30000);
};

/**
 * Cleanup interval on unmount
 */
const cleanup = (): void => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Lifecycle hooks
onMounted(() => {
  fetchStats();
  setupAutoRefresh();
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.queue-stats-widget {
  height: 100%;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
