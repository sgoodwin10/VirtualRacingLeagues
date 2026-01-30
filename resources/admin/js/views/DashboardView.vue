<template>
  <div class="dashboard">
    <!-- Welcome Section -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome back, {{ adminName }}!</h1>
      <p class="text-gray-600">Here's what's happening with your platform today.</p>
    </div>

    <!-- Initial Loading Skeleton -->
    <div v-if="initialLoading" class="space-y-6">
      <Card>
        <template #content>
          <Skeleton height="3rem" class="mb-4" />
          <div class="space-y-4">
            <Skeleton v-for="i in 5" :key="i" height="80px" class="mb-3" />
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Content (after initial load) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Queue Stats Widget (Super Admin Only) -->
      <div v-if="isSuperAdmin" class="lg:col-span-1">
        <QueueStatsWidget />
      </div>

      <!-- Recent Activity Card -->
      <div :class="isSuperAdmin ? 'lg:col-span-2' : 'lg:col-span-3'">
        <Card class="h-full">
          <template #title>
            <div class="flex items-center justify-between">
              <span>Recent Activity</span>
              <Button
                icon="pi pi-refresh"
                text
                rounded
                size="small"
                severity="secondary"
                :loading="loading"
                @click="loadActivities"
              />
            </div>
          </template>
          <template #content>
            <!-- Loading State -->
            <div v-if="loading && !recentActivity.length" class="space-y-4">
              <Skeleton v-for="i in 5" :key="i" height="80px" class="mb-3" />
            </div>

            <!-- Empty State -->
            <div
              v-else-if="!loading && !recentActivity.length"
              class="text-center py-8 text-gray-500"
            >
              <i class="pi pi-inbox text-4xl mb-3 block"></i>
              <p>No recent activity to display</p>
            </div>

            <!-- Activity List -->
            <div v-else class="space-y-4">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-0"
              >
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    getActivityColor(activity),
                  ]"
                >
                  <i :class="getActivityIcon(activity)"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">
                    {{ getActivityTitle(activity) }}
                  </p>
                  <p class="text-xs text-gray-600 mt-1">
                    {{ activity.description }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ formatActivityTime(activity.created_at) }}
                  </p>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import { useAdminStore } from '@admin/stores/adminStore';
import { activityLogService } from '@admin/services/activityLogService';
import type { Activity } from '@admin/types/activityLog';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { useErrorToast } from '@admin/composables/useErrorToast';
import { logger } from '@admin/utils/logger';
import QueueStatsWidget from '@admin/components/dashboard/QueueStatsWidget.vue';

const adminStore = useAdminStore();
const { formatRelativeTime } = useDateFormatter();
const { showErrorToast } = useErrorToast();

// State
const recentActivity = ref<Activity[]>([]);
const loading = ref(false);
const initialLoading = ref(true);

// Computed properties
const adminName = computed(() => adminStore.adminName);
const isSuperAdmin = computed(() => adminStore.adminRole === 'super_admin');

/**
 * Load recent activities from API
 */
const loadActivities = async (): Promise<void> => {
  loading.value = true;
  try {
    // Fetch recent activities (limit to 10 most recent)
    const activities = await activityLogService.getAllActivities({ limit: 10 });
    recentActivity.value = activities;

    logger.debug('Recent activities loaded:', activities.length);
  } catch (error) {
    logger.error('Failed to load recent activities:', error);
    showErrorToast(error, 'Failed to load recent activity');
  } finally {
    loading.value = false;
  }
};

/**
 * Get activity icon based on event type and log name
 */
const getActivityIcon = (activity: Activity): string => {
  const eventMap: Record<string, string> = {
    created: 'pi pi-plus-circle',
    updated: 'pi pi-pencil',
    deleted: 'pi pi-trash',
  };

  if (activity.event && eventMap[activity.event]) {
    return eventMap[activity.event] || 'pi pi-circle';
  }

  // Fallback based on log name
  if (activity.log_name === 'user') {
    return 'pi pi-user';
  } else if (activity.log_name === 'admin') {
    return 'pi pi-shield';
  }

  return 'pi pi-circle';
};

/**
 * Get activity color based on event type
 */
const getActivityColor = (activity: Activity): string => {
  const eventColorMap: Record<string, string> = {
    created: 'bg-green-100 text-green-600',
    updated: 'bg-blue-100 text-blue-600',
    deleted: 'bg-red-100 text-red-600',
  };

  if (activity.event && eventColorMap[activity.event]) {
    return eventColorMap[activity.event] || 'bg-gray-100 text-gray-600';
  }

  // Fallback based on log name
  if (activity.log_name === 'user') {
    return 'bg-purple-100 text-purple-600';
  } else if (activity.log_name === 'admin') {
    return 'bg-orange-100 text-orange-600';
  }

  return 'bg-gray-100 text-gray-600';
};

/**
 * Get human-readable activity title
 */
const getActivityTitle = (activity: Activity): string => {
  const causerName = activity.causer?.name
    ? activity.causer.name
    : activity.causer?.first_name && activity.causer?.last_name
      ? `${activity.causer.first_name} ${activity.causer.last_name}`
      : activity.causer?.email || 'System';

  const subjectType = activity.subject_type ? activity.subject_type.split('\\').pop() : 'Item';

  return `${causerName} ${activity.description} ${subjectType}`;
};

/**
 * Format activity timestamp as relative time
 */
const formatActivityTime = (timestamp: string): string => {
  return formatRelativeTime(timestamp);
};

// Load activities on mount
onMounted(async () => {
  await loadActivities();
  initialLoading.value = false;
});
</script>

<style scoped>
.dashboard {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
