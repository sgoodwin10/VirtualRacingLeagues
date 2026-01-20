<template>
  <div class="notifications-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Notification History</h1>
      <p class="text-gray-600">View all system notifications and their delivery status</p>
    </div>

    <!-- Initial Loading Skeleton -->
    <div v-if="initialLoading" class="space-y-6">
      <Card>
        <template #content>
          <Skeleton height="4rem" />
        </template>
      </Card>
      <Card>
        <template #content>
          <Skeleton height="20rem" />
        </template>
      </Card>
    </div>

    <!-- Main Content (after initial load) -->
    <div v-else>
      <!-- Filters Card -->
      <Card class="mb-6">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Type Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select
                v-model="filters.type"
                :options="typeOptions"
                option-label="label"
                option-value="value"
                placeholder="All Types"
                class="w-full"
                show-clear
                @change="loadNotifications"
              />
            </div>

            <!-- Channel Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <Select
                v-model="filters.channel"
                :options="channelOptions"
                option-label="label"
                option-value="value"
                placeholder="All Channels"
                class="w-full"
                show-clear
                @change="loadNotifications"
              />
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                v-model="filters.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="All Statuses"
                class="w-full"
                show-clear
                @change="loadNotifications"
              />
            </div>

            <!-- Date Range -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <DatePicker
                v-model="filters.dateRange"
                selection-mode="range"
                placeholder="Select dates"
                class="w-full"
                date-format="yy-mm-dd"
                show-icon
                icon="pi pi-calendar"
                @date-select="handleDateSelect"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Data Table Card -->
      <Card :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }">
        <template #content>
          <DataTable
            :value="notifications"
            :loading="loading"
            :paginator="true"
            :rows="20"
            :total-records="totalRecords"
            :lazy="true"
            data-key="id"
            striped-rows
            paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rows-per-page-options="[10, 20, 50]"
            current-page-report-template="Showing {first} to {last} of {totalRecords} notifications"
            @page="onPageChange"
          >
            <Column field="notification_type" header="Type" sortable style="min-width: 150px">
              <template #body="{ data }">
                <Tag
                  :value="formatTypeLabel(data.notification_type)"
                  :severity="getTypeSeverity(data.notification_type)"
                />
              </template>
            </Column>

            <Column field="channel" header="Channel" sortable style="min-width: 120px">
              <template #body="{ data }">
                <span class="flex items-center gap-2">
                  <i :class="getChannelIcon(data.channel)" />
                  <span class="capitalize">{{ data.channel }}</span>
                </span>
              </template>
            </Column>

            <Column field="recipient" header="Recipient" style="min-width: 200px">
              <template #body="{ data }">
                <span class="text-sm">{{ data.recipient || 'N/A' }}</span>
              </template>
            </Column>

            <Column field="subject" header="Subject" style="min-width: 250px">
              <template #body="{ data }">
                <span class="text-sm">{{ data.subject || 'No subject' }}</span>
              </template>
            </Column>

            <Column field="status" header="Status" sortable style="min-width: 100px">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>

            <Column field="sent_at" header="Sent At" sortable style="min-width: 180px">
              <template #body="{ data }">
                <span class="text-sm">{{ formatDate(data.sent_at) }}</span>
              </template>
            </Column>

            <Column header="Actions" style="width: 100px">
              <template #body="{ data }">
                <Button
                  v-tooltip.top="'View Details'"
                  icon="pi pi-eye"
                  severity="secondary"
                  text
                  rounded
                  @click="viewNotification(data)"
                />
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-inbox text-4xl mb-3 block"></i>
                <p>No notifications found</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Detail Dialog -->
    <NotificationDetailDialog
      v-model:visible="detailDialogVisible"
      :notification="selectedNotification"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Tag from 'primevue/tag';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';
import NotificationDetailDialog from '@admin/components/notifications/NotificationDetailDialog.vue';
import { notificationService } from '@admin/services/notificationService';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { useErrorToast } from '@admin/composables/useErrorToast';
import type {
  NotificationLog,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationTypeOption,
  NotificationChannelOption,
  NotificationStatusOption,
} from '@admin/types/notification';

// Composables
const { formatDate } = useDateFormatter();
const { showErrorToast } = useErrorToast();

// State
const notifications = ref<NotificationLog[]>([]);
const loading = ref(false);
const initialLoading = ref(true);
const totalRecords = ref(0);
const currentPage = ref(1);

// Filters
const filters = reactive({
  type: null as NotificationType | null,
  channel: null as NotificationChannel | null,
  status: null as NotificationStatus | null,
  dateRange: null as Date[] | null,
});

// Filter options
const typeOptions: NotificationTypeOption[] = [
  { label: 'Contact', value: 'contact' },
  { label: 'Registration', value: 'registration' },
  { label: 'Email Verification', value: 'email_verification' },
  { label: 'Password Reset', value: 'password_reset' },
  { label: 'System', value: 'system' },
];

const channelOptions: NotificationChannelOption[] = [
  { label: 'Email', value: 'email' },
  { label: 'Discord', value: 'discord' },
];

const statusOptions: NotificationStatusOption[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Failed', value: 'failed' },
];

// Modal state
const detailDialogVisible = ref(false);
const selectedNotification = ref<NotificationLog | null>(null);

/**
 * Load notifications from API
 */
const loadNotifications = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await notificationService.getAll({
      page: currentPage.value,
      per_page: 20,
      type: filters.type,
      channel: filters.channel,
      status: filters.status,
      date_from: filters.dateRange?.[0]?.toISOString().split('T')[0],
      date_to: filters.dateRange?.[1]?.toISOString().split('T')[0],
    });

    notifications.value = response.data;
    totalRecords.value = response.total;
  } catch (error) {
    showErrorToast(error, 'Failed to load notifications');
  } finally {
    loading.value = false;
  }
};

/**
 * Handle page change event
 */
const onPageChange = (event: { page: number }): void => {
  currentPage.value = event.page + 1;
  loadNotifications();
};

/**
 * Handle date range selection
 */
const handleDateSelect = (): void => {
  // Only load when both dates are selected
  if (filters.dateRange && filters.dateRange.length === 2 && filters.dateRange[1]) {
    loadNotifications();
  }
};

/**
 * View notification details
 */
const viewNotification = (notification: NotificationLog): void => {
  selectedNotification.value = notification;
  detailDialogVisible.value = true;
};

/**
 * Format notification type for display
 */
const formatTypeLabel = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get severity color for notification type
 */
const getTypeSeverity = (type: string): string => {
  const severityMap: Record<string, string> = {
    contact: 'info',
    registration: 'success',
    email_verification: 'warn',
    password_reset: 'warn',
    system: 'secondary',
  };
  return severityMap[type] || 'secondary';
};

/**
 * Get icon for notification channel
 */
const getChannelIcon = (channel: string): string => {
  return channel === 'email' ? 'pi pi-envelope' : 'pi pi-discord';
};

/**
 * Get severity color for notification status
 */
const getStatusSeverity = (status: string): string => {
  const severityMap: Record<string, string> = {
    pending: 'warn',
    sent: 'success',
    failed: 'danger',
  };
  return severityMap[status] || 'secondary';
};

// Load data on mount
onMounted(async () => {
  await loadNotifications();
  initialLoading.value = false;
});
</script>

<style scoped>
/* NotificationsView specific styles */
</style>
