<template>
  <!-- Notifications Panel -->
  <Popover ref="notificationsPanel" class="w-80">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
      <Button
        v-if="hasUnreadNotifications"
        label="Mark all read"
        text
        size="small"
        aria-label="Mark all notifications as read"
        @click="emit('mark-all-read')"
      />
    </div>

    <div v-if="notifications.length === 0" class="text-center py-8 text-gray-500">
      <i class="pi pi-bell text-4xl mb-3"></i>
      <p>No notifications</p>
    </div>

    <div v-else class="space-y-3 max-h-96 overflow-y-auto">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'p-3 rounded-lg cursor-pointer transition-colors',
          notification.read ? 'bg-gray-50' : 'bg-blue-50',
        ]"
        role="button"
        :aria-label="`Notification: ${notification.title}`"
        tabindex="0"
        @click="emit('mark-read', notification.id)"
        @keydown.enter="emit('mark-read', notification.id)"
      >
        <div class="flex items-start gap-3">
          <div
            :class="[
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              getNotificationColor(notification.type),
            ]"
          >
            <i :class="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">
              {{ notification.title }}
            </p>
            <p class="text-xs text-gray-600 mt-1">
              {{ notification.message }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ formatTime(notification.timestamp) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import Popover from 'primevue/popover';
import type { Notification } from '@admin/stores/layoutStore';

/**
 * Props interface
 */
export interface AppTopbarNotificationsProps {
  notifications: Notification[];
  hasUnreadNotifications: boolean;
}

/**
 * Emits interface
 */
export interface AppTopbarNotificationsEmits {
  (event: 'mark-read', id: string): void;
  (event: 'mark-all-read'): void;
}

// Props
defineProps<AppTopbarNotificationsProps>();

// Emits
const emit = defineEmits<AppTopbarNotificationsEmits>();

// Template ref
const notificationsPanel = ref();

/**
 * Toggle the notifications panel
 */
const toggle = (event: Event): void => {
  notificationsPanel.value.toggle(event);
};

/**
 * Hide the notifications panel
 */
const hide = (): void => {
  notificationsPanel.value.hide();
};

/**
 * Get notification color based on type
 */
const getNotificationColor = (type: string): string => {
  const colors = {
    info: 'bg-blue-100 text-blue-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
    success: 'bg-green-100 text-green-600',
  };
  return colors[type as keyof typeof colors] || colors.info;
};

/**
 * Get notification icon based on type
 */
const getNotificationIcon = (type: string): string => {
  const icons = {
    info: 'pi pi-info-circle',
    warning: 'pi pi-exclamation-triangle',
    error: 'pi pi-times-circle',
    success: 'pi pi-check-circle',
  };
  return icons[type as keyof typeof icons] || icons.info;
};

/**
 * Format timestamp to relative time
 */
const formatTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

// Expose toggle and hide methods
defineExpose({ toggle, hide });
</script>
