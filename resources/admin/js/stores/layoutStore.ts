import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  timestamp: Date;
}

/**
 * Layout Store
 * Manages layout state including sidebar and notifications
 */
export const useLayoutStore = defineStore('layout', () => {
  // State
  const sidebarCollapsed = ref(localStorage.getItem('adminSidebarCollapsed') === 'true');
  const notifications = ref<Notification[]>([]);

  // Getters
  /**
   * Count unread notifications
   */
  const unreadNotificationsCount = computed((): number => {
    return notifications.value.filter((n) => !n.read).length;
  });

  /**
   * Check if there are any unread notifications
   */
  const hasUnreadNotifications = computed((): boolean => {
    return notifications.value.some((n) => !n.read);
  });

  // Actions
  /**
   * Toggle sidebar collapsed state
   */
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem('adminSidebarCollapsed', String(sidebarCollapsed.value));
  }

  /**
   * Set sidebar collapsed state
   */
  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed;
    localStorage.setItem('adminSidebarCollapsed', String(collapsed));
  }

  /**
   * Add a new notification
   */
  function addNotification(notification: Omit<Notification, 'id' | 'read' | 'timestamp'>): void {
    notifications.value.unshift({
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      timestamp: new Date(),
    });
  }

  /**
   * Mark a specific notification as read
   */
  function markNotificationAsRead(id: string): void {
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  function markAllNotificationsAsRead(): void {
    notifications.value.forEach((n) => {
      n.read = true;
    });
  }

  /**
   * Clear all notifications
   */
  function clearNotifications(): void {
    notifications.value = [];
  }

  return {
    // State
    sidebarCollapsed,
    notifications,

    // Getters
    unreadNotificationsCount,
    hasUnreadNotifications,

    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  };
});
