<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :closable="true"
    :style="{ width: '700px' }"
    :draggable="false"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <i class="pi pi-bell text-blue-600 text-xl"></i>
        <span class="font-semibold text-lg">Notification Details</span>
      </div>
    </template>

    <div v-if="notification" class="space-y-6">
      <!-- Summary Information Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Type</label>
          <Tag
            :value="formatTypeLabel(notification.notification_type)"
            :severity="getTypeSeverity(notification.notification_type)"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Channel</label>
          <div class="flex items-center gap-2">
            <i :class="getChannelIcon(notification.channel)" class="text-gray-700"></i>
            <span class="font-medium capitalize text-gray-900">{{ notification.channel }}</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Status</label>
          <Tag :value="notification.status" :severity="getStatusSeverity(notification.status)" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Sent At</label>
          <p class="font-medium text-gray-900">{{ formatDateTime(notification.sent_at) }}</p>
        </div>

        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-600 mb-1">Recipient</label>
          <p class="font-medium text-gray-900">{{ notification.recipient || 'N/A' }}</p>
        </div>
      </div>

      <Divider />

      <!-- Subject Section -->
      <div v-if="notification.subject">
        <label class="block text-sm font-medium text-gray-600 mb-2">Subject</label>
        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p class="font-medium text-gray-900">{{ notification.subject }}</p>
        </div>
      </div>

      <!-- Body Section -->
      <div v-if="notification.body">
        <label class="block text-sm font-medium text-gray-600 mb-2">Message Body</label>
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
          <p class="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
            {{ notification.body }}
          </p>
        </div>
      </div>

      <!-- Error Message Section -->
      <div v-if="notification.error_message">
        <label class="block text-sm font-medium text-gray-600 mb-2">Error Details</label>
        <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div class="flex gap-2">
            <i class="pi pi-exclamation-circle text-red-600 mt-0.5"></i>
            <p class="text-sm text-red-800 leading-relaxed">{{ notification.error_message }}</p>
          </div>
        </div>
      </div>

      <!-- Metadata Section -->
      <div v-if="notification.metadata && Object.keys(notification.metadata).length > 0">
        <label class="block text-sm font-medium text-gray-600 mb-2">Additional Information</label>
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
          <pre class="text-xs font-mono text-gray-700 whitespace-pre-wrap">{{
            JSON.stringify(notification.metadata, null, 2)
          }}</pre>
        </div>
      </div>

      <!-- Timestamps Section -->
      <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Created</label>
          <p class="text-sm text-gray-700">{{ formatDateTime(notification.created_at) }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Updated</label>
          <p class="text-sm text-gray-700">{{ formatDateTime(notification.updated_at) }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button label="Close" severity="secondary" @click="handleClose" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import type { NotificationLog } from '@admin/types/notification';

interface Props {
  visible: boolean;
  notification: NotificationLog | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

// Composables
const { formatDate: formatDateTime } = useDateFormatter();

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

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

/**
 * Handle dialog close
 */
const handleClose = (): void => {
  isVisible.value = false;
};
</script>

<style scoped>
/* NotificationDetailDialog specific styles */
</style>
