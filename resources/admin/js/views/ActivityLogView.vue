<template>
  <div class="activity-log-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Activity Logs</h1>
      <p class="text-gray-600">View and track all system activities</p>
    </div>

    <!-- Initial Loading Skeleton -->
    <div v-if="initialLoading" class="space-y-6">
      <Card>
        <template #content>
          <Skeleton height="4rem" class="mb-4" />
        </template>
      </Card>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card v-for="i in 3" :key="i">
          <template #content>
            <Skeleton height="6rem" />
          </template>
        </Card>
      </div>
      <Card>
        <template #content>
          <Skeleton height="20rem" />
        </template>
      </Card>
    </div>

    <!-- Main Content (after initial load) -->
    <div v-else>
      <!-- Filters & Actions -->
      <Card class="mb-6">
        <template #content>
          <div class="flex flex-col lg:flex-row gap-4 justify-between">
            <!-- Search -->
            <div class="flex-1 max-w-md">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchQuery"
                  placeholder="Search activities..."
                  class="w-full"
                />
              </IconField>
            </div>

            <!-- Filters and Actions -->
            <div class="flex gap-3">
              <!-- Log Type Filter -->
              <Select
                v-model="logTypeFilter"
                :options="logTypeOptions"
                option-label="label"
                option-value="value"
                placeholder="All Types"
                class="w-40"
              />

              <!-- Event Filter -->
              <Select
                v-model="eventFilter"
                :options="eventOptions"
                option-label="label"
                option-value="value"
                placeholder="All Events"
                class="w-40"
              />

              <!-- Limit -->
              <Select
                v-model="limitFilter"
                :options="limitOptions"
                option-label="label"
                option-value="value"
                class="w-32"
              />

              <!-- Refresh -->
              <Button
                v-tooltip.top="'Refresh'"
                icon="pi pi-refresh"
                severity="secondary"
                :loading="loading"
                @click="loadActivities"
              />

              <!-- Clean -->
              <Button
                v-if="adminStore.adminRole === 'super_admin'"
                v-tooltip.top="'Clean Old Logs'"
                icon="pi pi-trash"
                severity="danger"
                @click="showCleanDialog = true"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Total Activities -->
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
                <i class="pi pi-list text-blue-600 text-xl"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Activities</p>
                <p class="text-2xl font-bold text-gray-900">{{ filteredActivities.length }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Admin Activities -->
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50">
                <i class="pi pi-shield text-purple-600 text-xl"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Admin Activities</p>
                <p class="text-2xl font-bold text-gray-900">{{ adminActivitiesCount }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- User Activities -->
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-green-50">
                <i class="pi pi-users text-green-600 text-xl"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">User Activities</p>
                <p class="text-2xl font-bold text-gray-900">{{ userActivitiesCount }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Activity Table -->
      <Card :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }">
        <template #content>
          <ActivityLogTable
            :activities="filteredActivities"
            :loading="loading"
            :show-event="true"
            :show-subject="true"
            :paginator="true"
            :rows-per-page="20"
            @view-details="viewActivityDetails"
          />
        </template>
      </Card>
    </div>

    <!-- Activity Detail Modal -->
    <ActivityLogDetailModal
      v-model:visible="detailModalVisible"
      :activity="selectedActivity"
      @close="handleDetailModalClose"
    />

    <!-- Clean Logs Dialog -->
    <Dialog v-model:visible="showCleanDialog" modal :closable="true" :style="{ width: '450px' }">
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-trash text-red-500"></i>
          <span>Clean Old Activity Logs</span>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-700">
          This will permanently delete activity logs older than the specified number of days.
        </p>

        <div>
          <label for="cleanDays" class="block text-sm font-medium text-gray-700 mb-2">
            Delete logs older than (days)
          </label>
          <InputNumber
            id="cleanDays"
            v-model="cleanDays"
            :min="30"
            :max="3650"
            :step="1"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">Minimum: 30 days, Maximum: 3650 days (10 years)</p>
        </div>

        <div class="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <div class="flex gap-2">
            <i class="pi pi-exclamation-triangle text-yellow-600 mt-0.5"></i>
            <div>
              <p class="text-sm font-medium text-yellow-900">Warning</p>
              <p class="text-sm text-yellow-800">This action cannot be undone.</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" size="small" @click="showCleanDialog = false" />
        <Button
          label="Delete Logs"
          severity="danger"
          size="small"
          :loading="cleaning"
          @click="cleanOldLogs"
        />
      </template>
    </Dialog>

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';
import ActivityLogTable from '@admin/components/ActivityLog/ActivityLogTable.vue';
import ActivityLogDetailModal from '@admin/components/ActivityLog/ActivityLogDetailModal.vue';
import { activityLogService } from '@admin/services/activityLogService';
import { useAdminStore } from '@admin/stores/adminStore';
import { useErrorToast } from '@admin/composables/useErrorToast';
import type { Activity, LogName, EventType } from '@admin/types/activityLog';

// Composables
const adminStore = useAdminStore();
const { showErrorToast, showSuccessToast } = useErrorToast();

// State
const activities = ref<Activity[]>([]);
const loading = ref(false);
const initialLoading = ref(true);
const searchQuery = ref('');
const logTypeFilter = ref<LogName | 'all'>('all');
const eventFilter = ref<EventType | 'all'>('all');
const limitFilter = ref(50);

// Modal states
const detailModalVisible = ref(false);
const selectedActivity = ref<Activity | null>(null);
const showCleanDialog = ref(false);
const cleaning = ref(false);
const cleanDays = ref(365);

// Filter options
const logTypeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Admin', value: 'admin' as LogName },
  { label: 'User', value: 'user' as LogName },
];

const eventOptions = [
  { label: 'All Events', value: 'all' },
  { label: 'Created', value: 'created' as EventType },
  { label: 'Updated', value: 'updated' as EventType },
  { label: 'Deleted', value: 'deleted' as EventType },
];

const limitOptions = [
  { label: '50 Results', value: 50 },
  { label: '100 Results', value: 100 },
  { label: '200 Results', value: 200 },
  { label: '500 Results', value: 500 },
];

/**
 * Filtered activities based on search and filters
 */
const filteredActivities = computed(() => {
  let filtered = activities.value;

  // Filter by log type
  if (logTypeFilter.value !== 'all') {
    filtered = filtered.filter((activity) => activity.log_name === logTypeFilter.value);
  }

  // Filter by event
  if (eventFilter.value !== 'all') {
    filtered = filtered.filter((activity) => activity.event === eventFilter.value);
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((activity) => {
      const description = activity.description.toLowerCase();
      const causerEmail = activity.causer?.email.toLowerCase() || '';
      const causerId = activity.causer_id?.toString() || '';
      const activityId = activity.id.toString();

      return (
        description.includes(query) ||
        causerEmail.includes(query) ||
        causerId.includes(query) ||
        activityId.includes(query)
      );
    });
  }

  return filtered;
});

/**
 * Count of admin activities
 */
const adminActivitiesCount = computed(() => {
  return activities.value.filter((a) => a.log_name === 'admin').length;
});

/**
 * Count of user activities
 */
const userActivitiesCount = computed(() => {
  return activities.value.filter((a) => a.log_name === 'user').length;
});

/**
 * Load activities from API
 */
const loadActivities = async (): Promise<void> => {
  loading.value = true;
  try {
    activities.value = await activityLogService.getAllActivities({
      limit: limitFilter.value,
    });
  } catch (error) {
    showErrorToast(error, 'Failed to load activities');
  } finally {
    loading.value = false;
  }
};

/**
 * View activity details
 */
const viewActivityDetails = (activity: Activity): void => {
  selectedActivity.value = activity;
  detailModalVisible.value = true;
};

/**
 * Handle detail modal close
 */
const handleDetailModalClose = (): void => {
  selectedActivity.value = null;
};

/**
 * Clean old activity logs
 */
const cleanOldLogs = async (): Promise<void> => {
  cleaning.value = true;
  try {
    const response = await activityLogService.cleanOldActivities(cleanDays.value);

    showSuccessToast(response.message, 'Success');

    showCleanDialog.value = false;

    // Reload activities
    await loadActivities();
  } catch (error) {
    showErrorToast(error, 'Failed to clean activities');
  } finally {
    cleaning.value = false;
  }
};

// Load data on mount
onMounted(async () => {
  await loadActivities();
  initialLoading.value = false;
});
</script>

<style scoped>
/* ActivityLogView specific styles */
</style>
